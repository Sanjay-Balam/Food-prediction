"""Sales history as wide date x item tables, the shape every forecaster works on."""
from dataclasses import dataclass

import numpy as np
import pandas as pd

BATCH_PREP, COOK_TO_ORDER = "batch_prep", "cook_to_order"  # how a kitchen makes a dish, see prep_style_of_each_item


@dataclass(frozen=True)
class SalesHistory:
    qty: pd.DataFrame  # NaN = unknown (no upload, closed, or before the item's first sale)
    sold_out: pd.DataFrame
    days: pd.DataFrame | None = None  # per-day info (closed, bookings, promo), may include future dates

    @classmethod
    def from_records(cls, sales: pd.DataFrame, days: pd.DataFrame | None = None) -> "SalesHistory":
        """An item missing on a day that has other sales counts as 0 sold; a day with no rows is unknown."""
        qty = sales.pivot(index="date", columns="item", values="qty_sold")
        sold_out = sales.pivot(index="date", columns="item", values="sold_out")
        full = pd.date_range(qty.index.min(), qty.index.max(), name="date")
        uploaded = full.isin(qty.index)
        qty = qty.reindex(full)
        qty[uploaded] = qty[uploaded].fillna(0)
        qty = qty.where(qty.notna().cumsum() > 0)  # nothing before an item's first sale
        if days is not None and len(days):
            qty[days["closed"].reindex(full).fillna(0).astype(bool).to_numpy()] = np.nan
        return cls(qty.astype(float), sold_out.reindex(full).fillna(0), days)

    @property
    def last_date(self) -> pd.Timestamp:
        return self.qty.index.max()

    def up_to(self, last_day) -> "SalesHistory":
        """Only the sales up to and including last_day, so the days after it can be used as a hidden test."""
        last_day = pd.Timestamp(last_day)
        if last_day < self.qty.index.min():
            raise ValueError(f"until {last_day.date()} is before the first uploaded sales day "
                             f"{self.qty.index.min().date()}")
        return SalesHistory(self.qty.loc[:last_day], self.sold_out.loc[:last_day], self.days)

    def extended_to(self, until) -> "SalesHistory":
        """Adds empty future rows so forecast dates exist in the tables."""
        until = pd.Timestamp(until)
        if until <= self.last_date:
            return self
        idx = pd.date_range(self.qty.index.min(), until, name="date")
        return SalesHistory(self.qty.reindex(idx), self.sold_out.reindex(idx), self.days)

    def average_daily_sales(self, window_days: int) -> pd.Series:
        """item -> average portions per known day over the last `window_days`; NaN when the item had no known day."""
        return self.qty.loc[self.last_date - pd.Timedelta(days=window_days - 1):].mean()

    def active_items(self, window_days: int) -> list[str]:
        return [item for item, average in self.average_daily_sales(window_days).items() if average > 0]

    def prep_style_of_each_item(self, window_days: int, batch_prep_min_daily_portions: float) -> dict[str, str]:
        """BATCH_PREP for dishes that sold enough per day to be cooked ahead and judged per dish per day,
        COOK_TO_ORDER for the rest. Uses only the sales in this history, so a test cutoff cannot leak in."""
        return {item: BATCH_PREP if average >= batch_prep_min_daily_portions else COOK_TO_ORDER
                for item, average in self.average_daily_sales(window_days).items()}

    def days_needed_for_model(self, usual_days: int) -> int:
        """Days of sales the model needs before it is trusted: `usual_days`, but fewer for a short new dataset
        (never under 14), so a 3-week upload can still be tested and served by the model."""
        return min(usual_days, max(14, (self.last_date - self.qty.index.min()).days // 2))

    def items_newer_than(self, days: int) -> set[str]:
        first_seen = self.qty.notna().idxmax()
        return set(first_seen[first_seen > self.last_date - pd.Timedelta(days=days)].index)
