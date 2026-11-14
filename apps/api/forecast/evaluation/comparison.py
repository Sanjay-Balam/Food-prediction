"""Prediction vs real sales, per day or per week, with the same accuracy formula as the backtest."""
import pandas as pd

from .backtest import accuracy


def compare_by_day(forecast: pd.DataFrame, actuals: pd.DataFrame) -> dict:
    matched = _match(forecast, actuals)
    matched["difference"] = matched["actual"] - matched["likely"]
    matched["inside_range"] = (matched["actual"] >= matched["low"]) & (matched["actual"] <= matched["high"])
    totals = matched.groupby("date")[["likely", "actual"]].sum().rename(columns={"likely": "predicted"})
    totals["accuracy"] = [accuracy([real], [predicted]) for real, predicted in zip(totals["actual"], totals["predicted"])]
    return {
        "period": "day", **_dates(matched),
        "summary": {
            "accuracy_per_item_per_day": accuracy(matched["actual"], matched["likely"]),
            "accuracy_daily_total": accuracy(totals["actual"], totals["predicted"]),
            "actual_inside_range_percent": round(100 * matched["inside_range"].mean(), 1),
        },
        "daily_totals": totals.reset_index().to_dict("records"),
        "rows": matched[["date", "item", "low", "likely", "high", "actual", "difference", "inside_range"]]
        .to_dict("records"),
    }


def compare_by_week(forecast: pd.DataFrame, actuals: pd.DataFrame) -> dict:
    matched = _match(forecast, actuals)
    items = matched.groupby("item")[["likely", "actual"]].sum().rename(columns={"likely": "predicted"})
    items["difference"] = items["actual"] - items["predicted"]
    items["accuracy"] = [accuracy([real], [predicted]) for real, predicted in zip(items["actual"], items["predicted"])]
    predicted_total, actual_total = int(items["predicted"].sum()), int(items["actual"].sum())
    result = {
        "period": "week", **_dates(matched),
        "summary": {
            "accuracy_per_item": accuracy(items["actual"], items["predicted"]),
            "accuracy_restaurant_total": accuracy([actual_total], [predicted_total]),
            "predicted_total": predicted_total,
            "actual_total": actual_total,
        },
        "items": items.reset_index().to_dict("records"),
    }
    if result["days_compared"] < 7:
        result["note"] = f"only {result['days_compared']} day(s) had real sales to compare; a full week needs 7"
    return result


def _match(forecast: pd.DataFrame, actuals: pd.DataFrame) -> pd.DataFrame:
    """Pairs each forecast row with the real sales of the same date and item.
    POS exports skip items that sold nothing, so on a date the reference covers, a missing item means 0 sold
    (the same rule the sales upload uses)."""
    real = actuals.assign(date=actuals["date"].dt.strftime("%Y-%m-%d"))[["date", "item", "qty_sold"]]
    covered = forecast[forecast["date"].isin(real["date"])]
    if covered.empty:
        raise ValueError(f"the reference file has no sales for the forecast dates "
                         f"{forecast['date'].min()} to {forecast['date'].max()}")
    matched = covered.merge(real.rename(columns={"qty_sold": "actual"}), on=["date", "item"], how="left")
    return matched.fillna({"actual": 0}).astype({"actual": int})


def _dates(matched: pd.DataFrame) -> dict:
    return {"from": matched["date"].min(), "to": matched["date"].max(),
            "days_compared": int(matched["date"].nunique())}
