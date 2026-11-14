"""Builds the model input table, one row per (date, item).

Rule that prevents leakage: for a forecast made `days_ahead` days in advance, every sales feature of
day D uses only sales from day D - days_ahead or earlier. tests/test_forecast.py checks this."""
import math

import numpy as np
import pandas as pd

from .hyderabad_calendar import CALENDAR_FEATURES, EventCalendar
from .history import SalesHistory

SAME_WEEKDAY_COLUMNS = [f"same_weekday_sales_{n}" for n in range(1, 5)]  # 1 = most recent known
TARGET_COLUMNS = ("qty_sold", "sold_out")

# Optional inputs. The backtest switches each group off to measure what it is worth.
FEATURE_GROUPS = {
    "calendar": CALENDAR_FEATURES,
    "restaurant_total": ("restaurant_avg_last_7_known_days", "restaurant_avg_last_4_same_weekdays",
                         "item_share_last_28_known_days"),
    "sold_out": ("sold_out_last_known_day",),
    "bookings": ("bookings",),
    "promo": ("is_promo",),
}


def same_weekday_lags(days_ahead: int) -> list[int]:
    """The four most recent same-weekday lags that are already known when forecasting days_ahead out."""
    first_week = math.ceil(days_ahead / 7)
    return [7 * week for week in range(first_week, first_week + 4)]


class FeatureBuilder:
    def __init__(self, calendar: EventCalendar):
        self.calendar = calendar

    def build(self, history: SalesHistory, days_ahead: int, until=None, skip_groups=()) -> pd.DataFrame:
        """`until` adds future dates so forecast rows exist; their sales features reach only known days."""
        if until is not None:
            history = history.extended_to(until)
        per_item = self._item_sales_features(history.qty, history.sold_out, days_ahead)
        per_date = self._restaurant_features(history.qty, days_ahead)
        table = self._to_long_table(history.qty, history.sold_out, per_item, per_date)
        table = self._add_date_features(table, history.qty.index, history.days)
        skipped = {column for group in skip_groups for column in FEATURE_GROUPS[group]}
        return table.drop(columns=[column for column in table.columns if column in skipped])

    @staticmethod
    def feature_columns(table: pd.DataFrame) -> list[str]:
        return [column for column in table.columns if column not in TARGET_COLUMNS]

    @staticmethod
    def _item_sales_features(qty: pd.DataFrame, sold_out: pd.DataFrame, days_ahead: int) -> dict:
        known = qty.shift(days_ahead)  # latest sales known at forecast time
        features = {name: qty.shift(lag) for name, lag in zip(SAME_WEEKDAY_COLUMNS, same_weekday_lags(days_ahead))}
        for lag in (days_ahead, days_ahead + 1):
            if lag % 7:  # multiples of 7 are already same-weekday features
                features[f"sales_{lag}d_ago"] = qty.shift(lag)
        features["avg_last_4_same_weekdays"] = (
            pd.concat([features[name] for name in SAME_WEEKDAY_COLUMNS]).groupby(level=0).mean())
        features["avg_last_7_known_days"] = known.rolling(7, min_periods=4).mean()
        features["avg_last_28_known_days"] = known.rolling(28, min_periods=14).mean()
        features["sold_out_last_known_day"] = sold_out.shift(days_ahead)
        restaurant_known = qty.sum(axis=1, min_count=1).shift(days_ahead)
        features["item_share_last_28_known_days"] = known.rolling(28, min_periods=14).sum().div(
            restaurant_known.rolling(28, min_periods=14).sum(), axis=0)
        return features

    @staticmethod
    def _restaurant_features(qty: pd.DataFrame, days_ahead: int) -> dict:
        total = qty.sum(axis=1, min_count=1)
        return {
            "restaurant_avg_last_7_known_days": total.shift(days_ahead).rolling(7, min_periods=4).mean(),
            "restaurant_avg_last_4_same_weekdays": pd.concat(
                [total.shift(lag) for lag in same_weekday_lags(days_ahead)], axis=1).mean(axis=1),
        }

    @staticmethod
    def _to_long_table(qty, sold_out, per_item: dict, per_date: dict) -> pd.DataFrame:
        item_count = qty.shape[1]
        # .ravel() is row-major, which matches the (date, item) order of the index below
        columns = {name: wide.to_numpy(dtype=float).ravel() for name, wide in per_item.items()}
        columns |= {name: np.repeat(series.to_numpy(dtype=float), item_count) for name, series in per_date.items()}
        columns["qty_sold"] = qty.to_numpy(dtype=float).ravel()
        columns["sold_out"] = sold_out.to_numpy(dtype=float).ravel()
        index = pd.MultiIndex.from_product([qty.index, qty.columns], names=["date", "item"])
        table = pd.DataFrame(columns, index=index)
        table["item"] = pd.Categorical(index.get_level_values("item"), categories=list(qty.columns))
        return table

    def _add_date_features(self, table: pd.DataFrame, dates: pd.DatetimeIndex, day_info) -> pd.DataFrame:
        row_dates = table.index.get_level_values("date")
        table["day_of_week"] = row_dates.day_of_week
        table["day_of_month"] = row_dates.day
        table["month"] = row_dates.month
        table = table.join(self.calendar.features_for(dates).rename_axis("date"), on="date")
        if day_info is not None and len(day_info):
            planned = day_info.reindex(dates)
            if planned["bookings"].notna().any():
                table["bookings"] = planned["bookings"].reindex(row_dates).to_numpy()
            if planned["promo"].fillna(0).astype(int).any():
                table["is_promo"] = planned["promo"].fillna(0).reindex(row_dates).to_numpy()
        return table
