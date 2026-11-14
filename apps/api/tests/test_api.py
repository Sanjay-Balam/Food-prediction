import json

import pandas as pd
import pytest
from fastapi.testclient import TestClient

from forecast.api import app, get_service
from forecast.app import create_forecast_service
from forecast.config import Settings
from forecast.evaluation.comparison import compare_by_day, compare_by_week
from forecast.service import decide_activation
from sample_data import AVERAGE_DAILY_SALES, make_sales


@pytest.fixture
def client(tmp_path):
    app.dependency_overrides[get_service] = lambda: create_forecast_service(Settings(root=tmp_path))
    yield TestClient(app)
    app.dependency_overrides.clear()


def as_upload(table: pd.DataFrame, name: str = "data.csv") -> dict:
    return {"file": (name, table.to_csv(index=False), "text/csv")}


def test_upload_train_forecast_and_compare_by_day_and_week(client, tmp_path):
    history, reference = make_sales(150), make_sales(7, start="2025-05-31", seed=1)  # the 7 days after history
    assert client.post("/restaurants/r1/sales/upload", files=as_upload(history)).json()["added"] == len(history)

    trained = client.post("/restaurants/r1/train?weeks=4")
    assert trained.status_code == 200 and "1" in trained.json()["accuracy"]

    forecast = client.post("/restaurants/r1/forecast?days=7").json()
    assert len(forecast["rows"]) == 7 * len(AVERAGE_DAILY_SALES)

    by_day = client.post("/restaurants/r1/compare?period=day", files=as_upload(reference)).json()
    assert by_day["days_compared"] == 7 and len(by_day["rows"]) == len(forecast["rows"])
    assert 0 < by_day["summary"]["accuracy_per_item_per_day"] <= 100

    by_week = client.post("/restaurants/r1/compare?period=week", files=as_upload(reference)).json()
    assert len(by_week["items"]) == len(AVERAGE_DAILY_SALES)
    assert by_week["summary"]["predicted_total"] == sum(row["likely"] for row in forecast["rows"])
    assert by_week["summary"]["actual_total"] == reference["qty_sold"].sum()

    stored = pd.read_csv(tmp_path / "data" / "r1" / "sales.csv")
    assert len(stored) == len(history)  # the reference file stays hidden from training


def test_errors_are_clear(client):
    bad = make_sales(3).astype(str)
    bad.loc[0, "date"] = "15-01-2025"
    response = client.post("/restaurants/r1/sales/upload", files=as_upload(bad))
    assert response.status_code == 400 and "YYYY-MM-DD" in response.json()["detail"]

    client.post("/restaurants/r1/sales/upload", files=as_upload(make_sales(30)))
    assert client.post("/restaurants/r1/compare", files=as_upload(make_sales(1))).status_code == 404
    assert client.post("/restaurants/r1/compare?period=month", files=as_upload(make_sales(1))).status_code == 422
    assert client.post("/restaurants/bad..id/forecast").status_code == 400


def test_json_upload_is_accepted_and_other_file_types_are_rejected(client, tmp_path):
    rows = make_sales(3).to_dict("records")
    response = client.post("/restaurants/r1/sales/upload",
                           files={"file": ("sales.json", json.dumps(rows), "application/json")})
    assert response.status_code == 200 and response.json()["added"] == len(rows)

    for name in ("sales.xlsx", "sales.txt"):
        rejected = client.post("/restaurants/r1/sales/upload", files={"file": (name, "anything", "text/plain")})
        assert rejected.status_code == 400 and "only .csv or .json" in rejected.json()["detail"]
    not_a_list = client.post("/restaurants/r1/sales/upload", files={"file": ("x.json", '{"date": 1}', "text/plain")})
    assert not_a_list.status_code == 400 and "list of rows" in not_a_list.json()["detail"]


def test_train_until_a_cutoff_and_compare_with_the_uploaded_days_after_it(client, tmp_path):
    all_sales = make_sales(157)  # 2025-01-01 .. 2025-06-06
    client.post("/restaurants/r1/sales/upload", files=as_upload(all_sales))
    cutoff = "2025-05-30"

    assert client.post(f"/restaurants/r1/train?weeks=4&until={cutoff}").status_code == 200
    forecast = client.post(f"/restaurants/r1/forecast?days=7&until={cutoff}").json()
    assert forecast["data_until"] == cutoff and forecast["rows"][0]["date"] == "2025-05-31"

    by_week = client.post("/restaurants/r1/compare?period=week").json()  # no file: uses the uploaded later days
    later_days = all_sales[all_sales["date"] > cutoff]
    assert by_week["days_compared"] == 7 and by_week["summary"]["actual_total"] == later_days["qty_sold"].sum()


def test_forecast_refuses_a_cutoff_the_live_model_has_already_seen(client, tmp_path):
    registry = create_forecast_service(Settings(root=tmp_path)).registry
    client.post("/restaurants/r1/sales/upload", files=as_upload(make_sales(150)))
    full = client.post("/restaurants/r1/train?weeks=4").json()  # trained on everything, up to 2025-05-30
    registry.activate("r1", full["version"])  # make it live even if it did not beat the baseline
    unfair = client.post("/restaurants/r1/forecast?until=2025-05-20")
    assert unfair.status_code == 400 and "would not be fair" in unfair.json()["detail"]

    earlier = client.post("/restaurants/r1/train?weeks=4&until=2025-05-20").json()
    registry.activate("r1", earlier["version"])
    assert client.post("/restaurants/r1/forecast?until=2025-05-20").status_code == 200


def test_a_test_on_an_earlier_cutoff_is_not_blocked_by_the_live_models_score():
    live = {"trained_on": {"until": "2025-06-30"}, "backtest_accuracy": {"1": 90.0}}
    lower = {1: 80.0}, {1: 70.0}  # beats the baseline, but 10 points below the live model
    assert decide_activation(*lower, live, max_drop_points=2.0, trained_until="2025-05-20")[0]
    assert not decide_activation(*lower, live, max_drop_points=2.0, trained_until="2025-07-07")[0]


def test_forecast_without_recent_sales_gives_clear_error(client):
    sales = make_sales(60)
    sales["qty_sold"] = 0  # e.g. a restaurant closed for renovation
    client.post("/restaurants/r1/sales/upload", files=as_upload(sales))
    response = client.post("/restaurants/r1/forecast")
    assert response.status_code == 400 and "nothing to forecast" in response.json()["detail"]


def test_items_missing_from_reference_count_as_zero_sold():
    """POS exports leave out items that sold nothing; a forecast of 5 against a real 0 must count as a miss."""
    forecast = pd.DataFrame({"date": ["2025-01-01"] * 2, "item": ["Biryani", "Kheer"],
                             "low": [8, 2], "likely": [10, 5], "high": [12, 8]})
    actuals = pd.DataFrame({"date": pd.to_datetime(["2025-01-01"]), "item": ["Biryani"], "qty_sold": [10]})
    by_day = compare_by_day(forecast, actuals)
    assert len(by_day["rows"]) == 2 and by_day["rows"][1]["actual"] == 0
    assert by_day["summary"]["accuracy_per_item_per_day"] == 50.0  # missed 5 of 10 sold


def test_excel_csv_with_bom_is_accepted(client):
    csv_with_bom = "﻿" + make_sales(2).to_csv(index=False)
    response = client.post("/restaurants/r1/sales/upload", files={"file": ("excel.csv", csv_with_bom, "text/csv")})
    assert response.status_code == 200


def test_comparison_numbers_match_hand_calculation():
    forecast = pd.DataFrame({"date": ["2025-01-01", "2025-01-01", "2025-01-02", "2025-01-02"],
                             "item": ["Biryani", "Haleem"] * 2,
                             "low": [8, 15, 8, 15], "likely": [10, 20, 10, 20], "high": [12, 25, 12, 25]})
    actuals = pd.DataFrame({"date": pd.to_datetime(["2025-01-01", "2025-01-01", "2025-01-02", "2025-01-02"]),
                            "item": ["Biryani", "Haleem"] * 2, "qty_sold": [12, 15, 6, 30]})
    by_day = compare_by_day(forecast, actuals)
    # misses 2+5+4+10 = 21 of 63 sold -> 66.7%; daily totals 30 vs 27 and 30 vs 36 -> misses 3+6 of 63 -> 85.7%
    # in range: day 1 both on the edge (12 of 8-12, 15 of 15-25) count as inside; day 2 both outside -> 50%
    assert by_day["summary"] == {"accuracy_per_item_per_day": 66.7, "accuracy_daily_total": 85.7,
                                 "actual_inside_range_percent": 50.0}
    by_week = compare_by_week(forecast, actuals)
    # week: Biryani 20 vs 18, Haleem 40 vs 45 -> misses 2+5 of 63 -> 88.9%; total 60 vs 63 -> 95.2%
    assert by_week["summary"] == {"accuracy_per_item": 88.9, "accuracy_restaurant_total": 95.2,
                                  "predicted_total": 60, "actual_total": 63}
    assert by_week["note"].startswith("only 2 day(s)")
