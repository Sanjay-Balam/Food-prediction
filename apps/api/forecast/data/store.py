"""Storage of restaurant data behind one interface. CSV files now; a database store later implements the
same RestaurantStore protocol and nothing else changes."""
from pathlib import Path
from typing import Protocol

import numpy as np
import pandas as pd

from . import schema


class RestaurantStore(Protocol):
    def load_sales(self, restaurant_id: str) -> pd.DataFrame: ...
    def load_days(self, restaurant_id: str) -> pd.DataFrame: ...
    def upsert_sales(self, restaurant_id: str, new: pd.DataFrame) -> dict: ...
    def upsert_days(self, restaurant_id: str, new: pd.DataFrame) -> dict: ...
    def save_forecast(self, restaurant_id: str, forecast: pd.DataFrame) -> str: ...
    def latest_forecast(self, restaurant_id: str) -> pd.DataFrame | None: ...


class CsvRestaurantStore:
    """data/<restaurant_id>/sales.csv, data/<restaurant_id>/days.csv (optional),
    forecasts/<restaurant_id>/<first forecast date>.csv"""

    def __init__(self, data_dir: Path, forecasts_dir: Path):
        self.data_dir, self.forecasts_dir = Path(data_dir), Path(forecasts_dir)

    def _sales_path(self, restaurant_id: str) -> Path:
        return self.data_dir / schema.validate_restaurant_id(restaurant_id) / "sales.csv"

    def _days_path(self, restaurant_id: str) -> Path:
        return self.data_dir / schema.validate_restaurant_id(restaurant_id) / "days.csv"

    def load_sales(self, restaurant_id: str) -> pd.DataFrame:
        path = self._sales_path(restaurant_id)
        if not path.exists():
            raise FileNotFoundError(f"no sales yet for '{restaurant_id}': ingest a file first")
        return schema.sales(pd.read_csv(path, dtype=str))

    def load_days(self, restaurant_id: str) -> pd.DataFrame:
        path = self._days_path(restaurant_id)
        return schema.days(pd.read_csv(path, dtype=str)) if path.exists() else schema.empty_days()

    # shortcut: read-modify-write without a lock; two uploads for the same restaurant at the same moment can lose
    # rows. Fine for one person testing; the PostgreSQL store will use a transaction instead.
    def upsert_sales(self, restaurant_id: str, new: pd.DataFrame) -> dict:
        """A re-sent (date, item) row replaces the stored one, so corrections are safe."""
        old = self.load_sales(restaurant_id) if self._sales_path(restaurant_id).exists() else new.iloc[0:0]
        merged, replaced = _merge_keep_latest(old, new, key=["date", "item"])
        _atomic_write(merged.assign(date=merged["date"].dt.strftime("%Y-%m-%d")), self._sales_path(restaurant_id))
        return {"added": len(new) - replaced, "replaced": replaced, "total_rows": len(merged)}

    def upsert_days(self, restaurant_id: str, new: pd.DataFrame) -> dict:
        """A re-sent date replaces the whole stored row for that date (closed, bookings and promo)."""
        stored_days = self.load_days(restaurant_id).reset_index()
        merged, replaced = _merge_keep_latest(stored_days, new.reset_index(), key=["date"])
        readable = merged.assign(date=merged["date"].dt.strftime("%Y-%m-%d"),
                                 closed=np.where(merged["closed"] == 1, "yes", "no"),
                                 promo=np.where(merged["promo"] == 1, "yes", "no"))
        _atomic_write(readable[["date", "closed", "bookings", "promo"]], self._days_path(restaurant_id))
        return {"added": len(new) - replaced, "replaced": replaced, "total_days": len(merged)}

    def save_forecast(self, restaurant_id: str, forecast: pd.DataFrame) -> str:
        path = self.forecasts_dir / schema.validate_restaurant_id(restaurant_id) / f"{forecast['date'].min()}.csv"
        _atomic_write(forecast, path)
        return str(path)

    def latest_forecast(self, restaurant_id: str) -> pd.DataFrame | None:
        folder = self.forecasts_dir / schema.validate_restaurant_id(restaurant_id)
        files = sorted(folder.glob("*.csv"), key=lambda path: path.stat().st_mtime)
        return pd.read_csv(files[-1]) if files else None


def _merge_keep_latest(old: pd.DataFrame, new: pd.DataFrame, key: list[str]) -> tuple[pd.DataFrame, int]:
    """Stored rows plus new rows; where both have the same key, the new row wins."""
    if old.empty:
        return new.sort_values(key), 0
    replaced = len(old.merge(new[key], on=key))
    merged = pd.concat([old, new]).drop_duplicates(key, keep="last").sort_values(key)
    return merged, replaced


def _atomic_write(df: pd.DataFrame, path: Path):
    """Write to a temp file, then swap: a crash mid-write never corrupts the stored file."""
    path.parent.mkdir(parents=True, exist_ok=True)
    tmp = path.with_suffix(".tmp")
    df.to_csv(tmp, index=False)
    tmp.replace(path)
