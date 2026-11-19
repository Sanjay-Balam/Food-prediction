import json
import math

import pandas as pd
import pytest
from fastapi.testclient import TestClient

from forecast.api import app, get_service
from forecast.app import create_forecast_service
from forecast.config import Settings
from forecast.data import schema
from forecast.data.history import SalesHistory
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
    # period: Biryani 20 vs 18, Haleem 40 vs 45 -> misses 2+5 of 63 -> 88.9%; total 60 vs 63 -> 95.2%
    assert by_day["summary"] == {"accuracy_per_item_per_day": 66.7, "accuracy_daily_total": 85.7,
                                 "actual_inside_range_percent": 50.0, "accuracy_per_item_period": 88.9,
                                 "accuracy_period_total": 95.2, "accuracy_per_category_per_day": None,
                                 "accuracy_per_category_period": None, "accuracy_per_item_per_day_batch_prep": None,
                                 "predicted_total": 60, "actual_total": 63}
    assert by_day["prep_styles"] == []  # no prep style in the forecast: nothing reported, nothing made up
    assert by_day["categories"] == []  # no categories given: nothing reported, nothing made up
    # rows: 12 vs 10, 15 vs 20, 6 vs 10, 30 vs 20; days: 27 vs 30, 36 vs 30; items: 18 vs 20, 45 vs 40
    assert [row["accuracy"] for row in by_day["rows"]] == [83.3, 66.7, 33.3, 66.7]
    assert [(day["accuracy"], day["inside_range_percent"]) for day in by_day["daily_totals"]] == [(88.9, 100.0),
                                                                                                  (83.3, 0.0)]
    assert [(item["item"], item["accuracy"]) for item in by_day["items"]] == [("Biryani", 88.9), ("Haleem", 88.9)]
    by_week = compare_by_week(forecast, actuals)
    # week: Biryani 20 vs 18, Haleem 40 vs 45 -> misses 2+5 of 63 -> 88.9%; total 60 vs 63 -> 95.2%
    assert by_week["summary"] == {"accuracy_per_item": 88.9, "accuracy_per_category": None,
                                  "accuracy_restaurant_total": 95.2, "predicted_total": 60, "actual_total": 63}
    assert by_week["note"].startswith("only 2 day(s)")


def test_accuracy_is_reported_as_measured_with_many_items():
    """No floor or cap: a bad forecast over many items must show its real, low accuracy."""
    forecast = pd.DataFrame({"date": ["2025-01-01"] * 4, "item": ["Biryani", "Haleem", "Kheer", "Naan"],
                             "low": [8, 8, 8, 2], "likely": [10, 10, 10, 3], "high": [12, 12, 12, 4]})
    actuals = pd.DataFrame({"date": pd.to_datetime(["2025-01-01"] * 3), "item": ["Biryani", "Haleem", "Kheer"],
                            "qty_sold": [2, 5, 20]})
    by_day = compare_by_day(forecast, actuals)
    # misses 8+5+10+3 = 26 of 27 sold -> 3.7%
    assert by_day["summary"]["accuracy_per_item_per_day"] == 3.7
    assert compare_by_week(forecast, actuals)["summary"]["accuracy_per_item"] == 3.7  # one day: same misses
    assert math.isnan(by_day["rows"][3]["accuracy"])  # Naan sold 0: no accuracy, shown as null in JSON


def test_category_accuracy_matches_hand_calculation():
    forecast = pd.DataFrame({"date": ["2025-01-01"] * 3 + ["2025-01-02"] * 3, "item": ["Biryani", "Pulao", "Naan"] * 2,
                             "category": ["Rice", "Rice", ""] * 2,
                             "low": [0] * 6, "likely": [10, 5, 4] * 2, "high": [20] * 6})
    actuals = pd.DataFrame({"date": pd.to_datetime(["2025-01-01"] * 3 + ["2025-01-02"] * 3),
                            "item": ["Biryani", "Pulao", "Naan"] * 2, "qty_sold": [12, 2, 4, 6, 11, 2]})
    by_day = compare_by_day(forecast, actuals)
    # category-days: Rice 15 vs 14 and 15 vs 17, uncategorized (Naan) 4 vs 4 and 4 vs 2 -> misses 1+2+0+2 = 5 of 37
    assert by_day["summary"]["accuracy_per_category_per_day"] == 86.5
    # period: Rice 30 vs 31, uncategorized 8 vs 6 -> misses 1+2 = 3 of 37
    assert by_day["summary"]["accuracy_per_category_period"] == 91.9
    category_rows = [(category["category"], category["predicted"], category["actual"], category["difference"],
                      category["accuracy"]) for category in by_day["categories"]]
    assert category_rows == [("Rice", 30, 31, 1, 96.8), ("uncategorized", 8, 6, -2, 66.7)]
    assert by_day["rows"][2]["category"] == "uncategorized"
    assert compare_by_week(forecast, actuals)["summary"]["accuracy_per_category"] == 91.9


def test_categories_flow_from_upload_to_forecast_and_compare(client):
    upload = client.post("/restaurants/r1/sales/upload",
                         files=as_upload(make_sales(150).assign(category=" Mains "))).json()  # spaces are stripped
    assert upload["categories"] == 1
    forecast = client.post("/restaurants/r1/forecast?days=7&until=2025-05-23").json()
    assert {row["category"] for row in forecast["rows"]} == {"Mains"}
    by_day = client.post("/restaurants/r1/compare?period=day").json()
    assert by_day["categories"][0]["category"] == "Mains"
    assert by_day["summary"]["accuracy_per_category_per_day"] is not None


def test_prep_style_accuracy_matches_hand_calculation():
    forecast = pd.DataFrame({"date": ["2025-01-01"] * 3 + ["2025-01-02"] * 3, "item": ["Biryani", "Pulao", "Naan"] * 2,
                             "prep_style": ["batch_prep", "batch_prep", "cook_to_order"] * 2,
                             "low": [0] * 6, "likely": [10, 5, 4] * 2, "high": [20] * 6})
    actuals = pd.DataFrame({"date": pd.to_datetime(["2025-01-01"] * 3 + ["2025-01-02"] * 3),
                            "item": ["Biryani", "Pulao", "Naan"] * 2, "qty_sold": [12, 2, 4, 6, 11, 2]})
    by_day = compare_by_day(forecast, actuals)
    # batch: Biryani 12 vs 10 and 6 vs 10, Pulao 2 vs 5 and 11 vs 5 -> misses 2+4+3+6 = 15 of 31 sold -> 51.6%
    #        over the period Biryani 18 vs 20, Pulao 13 vs 10 -> misses 2+3 = 5 of 31 -> 83.9%; 31 of 37 sold -> 83.8%
    # cook-to-order: Naan 4 vs 4 and 2 vs 4 -> misses 2 of 6 -> 66.7% per day; period 6 vs 8 -> 66.7%; 6 of 37 -> 16.2%
    assert by_day["prep_styles"] == [
        {"prep_style": "batch_prep", "dishes": 2, "share_of_portions_sold_percent": 83.8,
         "accuracy_per_item_per_day": 51.6, "accuracy_per_item_period": 83.9},
        {"prep_style": "cook_to_order", "dishes": 1, "share_of_portions_sold_percent": 16.2,
         "accuracy_per_item_per_day": 66.7, "accuracy_per_item_period": 66.7}]
    assert by_day["summary"]["accuracy_per_item_per_day_batch_prep"] == 51.6
    assert compare_by_week(forecast, actuals)["prep_styles"] == by_day["prep_styles"]


def test_dishes_get_their_prep_style_from_sales_before_the_cutoff(client):
    client.post("/restaurants/r1/sales/upload", files=as_upload(make_sales(150)))  # 60, 20 and 6 portions a day
    forecast = client.post("/restaurants/r1/forecast?days=7&until=2025-05-23").json()
    assert {row["item"]: row["prep_style"] for row in forecast["rows"]} == {
        "Chicken Biryani": "batch_prep", "Haleem": "batch_prep", "Double ka Meetha": "cook_to_order"}
    by_day = client.post("/restaurants/r1/compare?period=day").json()
    assert by_day["batch_prep_min_daily_portions"] == 10
    assert [style["prep_style"] for style in by_day["prep_styles"]] == ["batch_prep", "cook_to_order"]


def test_a_cutoff_one_day_too_early_names_the_earliest_cutoff(client):
    client.post("/restaurants/r1/sales/upload", files=as_upload(make_sales(31, start="2026-08-01")))
    too_early = client.post("/restaurants/r1/train?until=2026-08-20")  # 20 days; 14 to learn + 7 to test = 21
    assert too_early.status_code == 400
    assert "is 20 days" in too_early.json()["detail"] and "on or after 2026-08-21" in too_early.json()["detail"]


def test_short_new_datasets_need_less_history_before_the_model_is_trusted():
    assert SalesHistory.from_records(schema.sales(make_sales(21))).days_needed_for_model(28) == 14
    assert SalesHistory.from_records(schema.sales(make_sales(201))).days_needed_for_model(28) == 28
