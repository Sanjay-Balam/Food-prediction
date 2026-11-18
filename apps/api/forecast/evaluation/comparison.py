"""Prediction vs real sales, per day or per week, with the same accuracy formula as the backtest.
Every number is the plain formula on the matched rows: nothing is adjusted, floored or capped."""
import pandas as pd

from .backtest import accuracy

# 'category' and 'method' come from the saved forecast; a hand-made forecast may not have them
ROW_COLUMNS = ["date", "item", "category", "low", "likely", "high", "actual", "difference", "inside_range",
               "accuracy", "method"]
UNCATEGORIZED = "uncategorized"


def compare_by_day(forecast: pd.DataFrame, actuals: pd.DataFrame) -> dict:
    matched = _pair_forecast_with_real_sales(forecast, actuals)
    matched = _name_items_without_category(matched)
    matched = _add_row_results(matched)
    daily_totals = _daily_totals(matched)
    item_totals = _period_totals_by(matched, "item")
    category_totals = _period_totals_by(matched, "category") if _has_categories(matched) else None
    predicted_total, actual_total = int(item_totals["predicted"].sum()), int(item_totals["actual"].sum())
    return {
        "period": "day", **_compared_dates(matched),
        "summary": {
            "accuracy_per_item_per_day": accuracy(matched["actual"], matched["likely"]),
            "accuracy_daily_total": _accuracy_of(daily_totals),
            "actual_inside_range_percent": round(100 * matched["inside_range"].mean(), 1),
            "accuracy_per_item_period": _accuracy_of(item_totals),
            "accuracy_period_total": accuracy([actual_total], [predicted_total]),
            "accuracy_per_category_per_day": None if category_totals is None
            else _accuracy_of(_sum_by(matched, ["date", "category"])),
            "accuracy_per_category_period": None if category_totals is None else _accuracy_of(category_totals),
            "predicted_total": predicted_total,
            "actual_total": actual_total,
        },
        "daily_totals": daily_totals.reset_index().to_dict("records"),
        "items": item_totals.reset_index().to_dict("records"),
        "categories": [] if category_totals is None else category_totals.reset_index().to_dict("records"),
        "rows": matched[[column for column in ROW_COLUMNS if column in matched]].to_dict("records"),
    }


def compare_by_week(forecast: pd.DataFrame, actuals: pd.DataFrame) -> dict:
    matched = _name_items_without_category(_pair_forecast_with_real_sales(forecast, actuals))
    item_totals = _period_totals_by(matched, "item")
    category_totals = _period_totals_by(matched, "category") if _has_categories(matched) else None
    predicted_total, actual_total = int(item_totals["predicted"].sum()), int(item_totals["actual"].sum())
    result = {
        "period": "week", **_compared_dates(matched),
        "summary": {
            "accuracy_per_item": _accuracy_of(item_totals),
            "accuracy_per_category": None if category_totals is None else _accuracy_of(category_totals),
            "accuracy_restaurant_total": accuracy([actual_total], [predicted_total]),
            "predicted_total": predicted_total,
            "actual_total": actual_total,
        },
        "items": item_totals.reset_index().to_dict("records"),
        "categories": [] if category_totals is None else category_totals.reset_index().to_dict("records"),
    }
    if result["days_compared"] < 7:
        result["note"] = f"only {result['days_compared']} day(s) had real sales to compare; a full week needs 7"
    return result


def _pair_forecast_with_real_sales(forecast: pd.DataFrame, actuals: pd.DataFrame) -> pd.DataFrame:
    """Pairs each forecast row with the real sales of the same date and item.
    POS exports skip items that sold nothing, so on a date the reference covers, a missing item means 0 sold
    (the same rule the sales upload uses)."""
    real = actuals.assign(date=actuals["date"].dt.strftime("%Y-%m-%d"))[["date", "item", "qty_sold"]]
    covered = forecast[forecast["date"].isin(real["date"])]
    if covered.empty:
        raise ValueError(f"the reference file has no sales for the forecast dates "
                         f"{forecast['date'].min()} to {forecast['date'].max()}")
    paired = covered.merge(real.rename(columns={"qty_sold": "actual"}), on=["date", "item"], how="left")
    if "category" in paired:  # a saved forecast reads empty categories back as missing values
        paired["category"] = paired["category"].astype("string").fillna("")
    return paired.fillna({"actual": 0}).astype({"actual": int})


def _has_categories(matched: pd.DataFrame) -> bool:
    return "category" in matched and bool((matched["category"] != "").any())


def _name_items_without_category(matched: pd.DataFrame) -> pd.DataFrame:
    """When some items have a category, the rest are named 'uncategorized' so category totals still add up to
    the restaurant total. With no categories at all, nothing changes."""
    if not _has_categories(matched):
        return matched
    return matched.assign(category=matched["category"].replace("", UNCATEGORIZED))


def _add_row_results(matched: pd.DataFrame) -> pd.DataFrame:
    """Per row: how far off the forecast was, whether the real number fell inside the range, and its accuracy."""
    return matched.assign(difference=matched["actual"] - matched["likely"],
                          inside_range=(matched["actual"] >= matched["low"]) & (matched["actual"] <= matched["high"]),
                          accuracy=_accuracy_of_each_row(matched["actual"], matched["likely"]))


def _sum_by(matched: pd.DataFrame, keys) -> pd.DataFrame:
    """Predicted and real portions added up per group, e.g. per date, per item or per (date, category)."""
    return matched.groupby(keys)[["likely", "actual"]].sum().rename(columns={"likely": "predicted"})


def _daily_totals(matched: pd.DataFrame) -> pd.DataFrame:
    totals = _sum_by(matched, "date")
    totals["accuracy"] = _accuracy_of_each_row(totals["actual"], totals["predicted"])
    totals["inside_range_percent"] = (100 * matched.groupby("date")["inside_range"].mean()).round(1)
    return totals


def _period_totals_by(matched: pd.DataFrame, key: str) -> pd.DataFrame:
    """Per item or per category: portions summed over the whole compared period, the difference and accuracy."""
    totals = _sum_by(matched, key)
    totals["difference"] = totals["actual"] - totals["predicted"]
    totals["accuracy"] = _accuracy_of_each_row(totals["actual"], totals["predicted"])
    return totals


def _accuracy_of(totals: pd.DataFrame) -> float:
    return accuracy(totals["actual"], totals["predicted"])


def _accuracy_of_each_row(actual: pd.Series, predicted: pd.Series) -> list[float]:
    """100% minus the miss for each row; NaN (null in JSON) when nothing was sold, as in the backtest."""
    return [accuracy([real], [guess]) for real, guess in zip(actual, predicted)]


def _compared_dates(matched: pd.DataFrame) -> dict:
    return {"from": matched["date"].min(), "to": matched["date"].max(),
            "days_compared": int(matched["date"].nunique())}
