import numpy as np
import pandas as pd
import pytest

from forecast.app import create_forecast_service
from forecast.config import Settings
from forecast.data import schema
from forecast.data.history import SalesHistory
from forecast.messaging import PrepMessageWriter, format_as_table
from forecast.model.features import FeatureBuilder
from forecast.model.hyderabad_calendar import EventCalendar
from sample_data import AVERAGE_DAILY_SALES, make_sales


@pytest.fixture
def service(tmp_path):
    return create_forecast_service(Settings(root=tmp_path))


@pytest.mark.parametrize("days_ahead", Settings().horizons)
def test_features_never_use_unknown_sales(days_ahead):
    history = SalesHistory.from_records(schema.sales(make_sales()))
    target_day = history.qty.index[120]
    unknown_days = history.qty.index > target_day - pd.Timedelta(days=days_ahead)
    changed_qty, changed_sold_out = history.qty.copy(), history.sold_out.copy()
    changed_qty[unknown_days], changed_sold_out[unknown_days] = 999.0, 1.0
    builder = FeatureBuilder(EventCalendar())
    original = builder.build(history, days_ahead)
    changed = builder.build(SalesHistory(changed_qty, changed_sold_out), days_ahead)
    columns = FeatureBuilder.feature_columns(original)
    pd.testing.assert_frame_equal(original.xs(target_day, level="date")[columns],
                                  changed.xs(target_day, level="date")[columns])


def test_invalid_uploads_are_rejected():
    good = make_sales(3)
    for column, bad_value in [("date", "15-01-2025"), ("qty_sold", "-2"), ("qty_sold", "2.5")]:
        bad = good.astype(str)
        bad.loc[0, column] = bad_value
        with pytest.raises(ValueError):
            schema.sales(bad)
    with pytest.raises(ValueError):
        schema.sales(pd.concat([good, good.iloc[:1]]))
    with pytest.raises(ValueError):
        schema.restaurant_id("../other_restaurant")


def test_reuploading_a_day_replaces_it(service, tmp_path):
    first_upload = make_sales(2)
    first_upload.to_csv(tmp_path / "day1.csv", index=False)
    assert service.ingest_sales_file("r1", tmp_path / "day1.csv")["added"] == len(first_upload)

    correction = first_upload.iloc[:1].assign(qty_sold=999)
    next_day = make_sales(1, start="2025-01-03")
    pd.concat([correction, next_day]).to_csv(tmp_path / "day2.csv", index=False)
    result = service.ingest_sales_file("r1", tmp_path / "day2.csv")

    assert result == {"added": len(next_day), "replaced": 1, "total_rows": len(first_upload) + len(next_day)}
    stored = service.store.load_sales("r1")
    corrected = stored[(stored["date"] == "2025-01-01") & (stored["item"] == correction["item"].iloc[0])]
    assert corrected["qty_sold"].item() == 999


def test_unknown_days_are_not_counted_as_zero_sales():
    sales = make_sales(10)
    sales = sales[sales["date"] != "2025-01-05"]  # nothing uploaded that day
    sales = sales[~((sales["date"] == "2025-01-06") & (sales["item"] == "Haleem"))]  # uploaded, Haleem sold 0
    closed = pd.DataFrame({"closed": [1], "bookings": [np.nan], "promo": [0]},
                          index=pd.DatetimeIndex(["2025-01-07"], name="date"))
    qty = SalesHistory.from_records(schema.sales(sales), closed).qty
    assert qty.loc["2025-01-05"].isna().all()
    assert qty.loc["2025-01-06", "Haleem"] == 0
    assert qty.loc["2025-01-07"].isna().all()


def test_train_then_forecast_next_week(service, tmp_path):
    make_sales().to_csv(tmp_path / "sales.csv", index=False)
    service.ingest_sales_file("r1", tmp_path / "sales.csv")
    result = service.train_weekly("r1", weeks=4)
    assert (tmp_path / "artifacts" / "r1" / result.version / "h1_likely.txt").exists()

    forecast = service.forecast_next_days("r1", days=7)
    assert len(forecast) == 7 * len(AVERAGE_DAILY_SALES)
    assert forecast["date"].nunique() == 7
    assert (forecast["low"] >= 0).all()
    assert (forecast["low"] <= forecast["likely"]).all() and (forecast["likely"] <= forecast["high"]).all()
    assert set(forecast["horizon"]) == {"1-day model", "7-day model"}
    assert service.store.latest_forecast("r1") is not None


def test_reuploading_day_info_replaces_that_date(service, tmp_path):
    pd.DataFrame({"date": ["2025-01-10", "2025-01-11"], "closed": ["no", "yes"], "bookings": ["40", ""],
                  "promo": ["yes", "no"]}).to_csv(tmp_path / "days1.csv", index=False)
    assert service.ingest_days_file("r1", tmp_path / "days1.csv") == {"added": 2, "replaced": 0, "total_days": 2}

    pd.DataFrame({"date": ["2025-01-10", "2025-01-12"], "bookings": ["80", "15"]}).to_csv(tmp_path / "days2.csv",
                                                                                       index=False)
    assert service.ingest_days_file("r1", tmp_path / "days2.csv") == {"added": 1, "replaced": 1, "total_days": 3}
    days = service.store.load_days("r1")
    assert days.loc["2025-01-10", "bookings"] == 80 and days.loc["2025-01-10", "promo"] == 0
    assert days.loc["2025-01-11", "closed"] == 1 and np.isnan(days.loc["2025-01-11", "bookings"])


def test_bookings_and_promos_reach_the_model_including_future_dates():
    history = SalesHistory.from_records(schema.sales(make_sales(60)))
    future_day = history.last_date + pd.Timedelta(days=1)
    day_info = pd.DataFrame({"closed": [0, 0], "bookings": [30.0, 80.0], "promo": [1, 0]},
                            index=pd.DatetimeIndex([history.last_date, future_day], name="date"))
    history = SalesHistory(history.qty, history.sold_out, day_info)
    table = FeatureBuilder(EventCalendar()).build(history, 1, until=future_day)
    assert {"bookings", "is_promo"} <= set(FeatureBuilder.feature_columns(table))
    assert (table.xs(future_day, level="date")["bookings"] == 80).all()
    assert (table.xs(history.last_date, level="date")["is_promo"] == 1).all()


def test_nightly_command_uploads_forecasts_and_writes_message(tmp_path, capsys, monkeypatch):
    from forecast.cli import main
    for key in ("LLM_API_KEY", "LLM_MODEL"):  # a terminal may have .env loaded; this test must not call the LLM
        monkeypatch.delenv(key, raising=False)
    settings = Settings(root=tmp_path)  # no .env here, so the message falls back to the plain table
    history, today = make_sales(70), make_sales(1, start="2025-03-12")
    history.to_csv(tmp_path / "history.csv", index=False)
    today.to_csv(tmp_path / "today.csv", index=False)
    pd.DataFrame({"date": ["2025-03-13"], "bookings": ["60"]}).to_csv(tmp_path / "days.csv", index=False)
    main(["ingest", "-r", "r1", str(tmp_path / "history.csv")], settings)

    main(["nightly", "-r", "r1", str(tmp_path / "today.csv"), "--days-file", str(tmp_path / "days.csv")], settings)

    output = capsys.readouterr().out
    assert "sales uploaded" in output and "day info uploaded" in output and "[table" in output
    assert (tmp_path / "forecasts" / "r1" / "2025-03-13.csv").exists()


class FakeChatClient:
    def __init__(self, reply: str):
        self.reply = reply

    def complete(self, system_prompt: str, user_prompt: str) -> str:
        return self.reply


def test_llm_message_with_invented_numbers_falls_back_to_table():
    forecast = pd.DataFrame({"date": ["2026-11-15"] * 2, "item": ["Chicken Biryani", "Haleem"],
                             "low": [160, 40], "likely": [185, 48], "high": [210, 57]})
    invented_total = PrepMessageWriter(FakeChatClient("Make 185 biryani and 48 haleem (total 233)."))
    assert invented_total.write(forecast) == (format_as_table(forecast), "table (LLM reply changed or added numbers)")

    faithful = "15 Nov: Biryani 185 (160-210), Haleem 48 (40-57)."
    assert PrepMessageWriter(FakeChatClient(faithful)).write(forecast) == (faithful, "llm")
    assert PrepMessageWriter(None).write(forecast)[1].startswith("table")


def test_numbers_inside_dish_names_are_not_mistaken_for_invented_numbers():
    forecast = pd.DataFrame({"date": ["2026-11-14"], "item": ["Chicken 65"], "low": [40], "likely": [55], "high": [70]})
    reply = "Chicken 65: prepare 55 (40-70)."
    assert PrepMessageWriter(FakeChatClient(reply)).write(forecast) == (reply, "llm")
