"""HTTP API over ForecastService (same service the CLI uses).

Run:      python -m uvicorn forecast.api:app --reload
Test:     Postman -> Import -> postman/Food-Forecast-API.postman_collection.json   (or http://127.0.0.1:8000/docs)
Security: no login yet. Keep it on 127.0.0.1 (the default) until authentication is added.
"""
import math
from datetime import date
from functools import lru_cache
from typing import Literal

import numpy as np
from fastapi import Depends, FastAPI, File, HTTPException, Query, UploadFile
from fastapi.middleware.cors import CORSMiddleware
from fastapi.responses import JSONResponse

from .app import create_forecast_service, create_message_writer
from .service import ForecastService

app = FastAPI(title="Food quantity forecast API",
              description="Upload sales, train weekly, forecast portions per menu item, and compare with real sales.")

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

@app.get("/health", summary="Health check endpoint for frontend demo")
def health():
    return {"status": "ok", "service": "food-quantity-forecast-api"}

UPLOAD_HELP = "a .csv file, or a .json file holding a list of rows"
UNTIL_HELP = ("test mode: use only sales up to this day (YYYY-MM-DD); the uploaded days after it stay unseen "
              "and can be compared with the forecast")


@lru_cache
def get_service() -> ForecastService:
    return create_forecast_service()


@app.exception_handler(ValueError)
def bad_request(_, error: ValueError):  # bad file, bad restaurant id, unfair test cutoff
    return JSONResponse(status_code=400, content={"detail": str(error)})


@app.exception_handler(FileNotFoundError)
def not_found(_, error: FileNotFoundError):  # no sales or no forecast yet
    return JSONResponse(status_code=404, content={"detail": str(error)})


def json_safe(value):
    """JSON has no NaN and no numpy types: NaN -> null, numpy numbers -> plain numbers."""
    if isinstance(value, dict):
        return {str(key): json_safe(item) for key, item in value.items()}
    if isinstance(value, list | tuple):
        return [json_safe(item) for item in value]
    if isinstance(value, np.generic):
        value = value.item()
    if isinstance(value, float) and math.isnan(value):
        return None
    return value


@app.post("/restaurants/{restaurant_id}/sales/upload",
          summary="Upload sales (.csv or .json): date, item, qty_sold, optional sold_out")
def upload_sales(restaurant_id: str, file: UploadFile = File(..., description=UPLOAD_HELP),
                 service: ForecastService = Depends(get_service)):
    return service.ingest_sales_file(restaurant_id, file.file, file.filename)


@app.post("/restaurants/{restaurant_id}/days/upload",
          summary="Upload day info (.csv or .json): date, closed, bookings, promo")
def upload_days(restaurant_id: str, file: UploadFile = File(..., description=UPLOAD_HELP),
                service: ForecastService = Depends(get_service)):
    return service.ingest_days_file(restaurant_id, file.file, file.filename)


@app.post("/restaurants/{restaurant_id}/train", summary="Weekly training: backtest, retrain, go live only if better")
def train(restaurant_id: str, weeks: int | None = Query(None, ge=1),
          until: date | None = Query(None, description=UNTIL_HELP),
          service: ForecastService = Depends(get_service)):
    result = service.train_weekly(restaurant_id, weeks, until)
    return json_safe({"version": result.version, "activated": result.activated, "reason": result.reason,
                      "accuracy": result.report})


@app.post("/restaurants/{restaurant_id}/forecast", summary="Forecast low / likely / high portions per item")
def forecast(restaurant_id: str, days: int = Query(7, ge=1),
             until: date | None = Query(None, description=UNTIL_HELP),
             service: ForecastService = Depends(get_service)):
    rows = service.forecast_next_days(restaurant_id, days, until)
    return json_safe({"data_until": rows["data_until"].iloc[0], "model_version": rows["model_version"].iloc[0],
                      "rows": rows[["date", "item", "category", "low", "likely", "high", "method"]].to_dict("records")})


@app.post("/restaurants/{restaurant_id}/compare",
          summary="Compare the latest forecast with real sales, per day or per week")
def compare(restaurant_id: str, period: Literal["day", "week"] = "day",
            file: UploadFile | None = File(None, description="optional reference file of real sales (.csv or "
                                                                ".json), not saved. Without it, the sales already "
                                                                "uploaded are used"),
            service: ForecastService = Depends(get_service)):
    source, filename = (file.file, file.filename) if file else (None, None)
    return json_safe(service.compare_with_actuals(restaurant_id, period, source, filename))


@app.get("/restaurants/{restaurant_id}/backtest", summary="Accuracy on the most recent weeks the model never saw")
def backtest(restaurant_id: str, weeks: int | None = Query(None, ge=1),
             service: ForecastService = Depends(get_service)):
    return json_safe(service.backtester.evaluate(service.load_history(restaurant_id), weeks))


@app.post("/restaurants/{restaurant_id}/message", summary="Chef prep message for the first forecast day")
def message(restaurant_id: str, language: str = "English", service: ForecastService = Depends(get_service)):
    latest = service.store.latest_forecast(restaurant_id)
    if latest is None:
        raise HTTPException(status_code=404, detail=f"no forecast yet for '{restaurant_id}': make a forecast first")
    day, text, source = create_message_writer(service.settings).write_for_next_day(latest, language)
    return {"date": day, "message": text, "source": source}
