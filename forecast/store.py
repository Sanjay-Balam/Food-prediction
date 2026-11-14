"""Storage of restaurant data behind one interface. CSV files now; a database store later implements the
same RestaurantStore protocol and nothing else changes."""
from pathlib import Path
from typing import Protocol

import numpy as np
import pandas as pd

from . import schema


class RestaurantStore(Protocol):
    def load_sales(self, rid: str) -> pd.DataFrame: ...
    def load_days(self, rid: str) -> pd.DataFrame: ...
    def upsert_sales(self, rid: str, new: pd.DataFrame) -> dict: ...
    def upsert_days(self, rid: str, new: pd.DataFrame) -> dict: ...
    def save_forecast(self, rid: str, forecast: pd.DataFrame) -> str: ...
    def latest_forecast(self, rid: str) -> pd.DataFrame | None: ...


class CsvRestaurantStore:
    """data/<rid>/sales.csv, data/<rid>/days.csv (optional), forecasts/<rid>/<first forecast date>.csv"""

    def __init__(self, data_dir: Path, forecasts_dir: Path):
        self.data_dir, self.forecasts_dir = Path(data_dir), Path(forecasts_dir)

    def _sales_path(self, rid: str) -> Path:
        return self.data_dir / schema.restaurant_id(rid) / "sales.csv"

    def _days_path(self, rid: str) -> Path:
        return self.data_dir / schema.restaurant_id(rid) / "days.csv"

    def load_sales(self, rid: str) -> pd.DataFrame:
        path = self._sales_path(rid)
        if not path.exists():
            raise FileNotFoundError(f"no sales yet for '{rid}': ingest a file first")
        return schema.sales(pd.read_csv(path, dtype=str))

    def load_days(self, rid: str) -> pd.DataFrame:
        path = self._days_path(rid)
        return schema.days(pd.read_csv(path, dtype=str)) if path.exists() else schema.empty_days()

    def upsert_sales(self, rid: str, new: pd.DataFrame) -> dict:
        """A re-sent (date, item) row replaces the stored one, so corrections are safe."""
        old = self.load_sales(rid) if self._sales_path(rid).exists() else new.iloc[0:0]
        merged, replaced = _merge_keep_latest(old, new, key=["date", "item"])
        _atomic_write(merged.assign(date=merged["date"].dt.strftime("%Y-%m-%d")), self._sales_path(rid))
        return {"added": len(new) - replaced, "replaced": replaced, "total_rows": len(merged)}

    def upsert_days(self, rid: str, new: pd.DataFrame) -> dict:
        """A re-sent date replaces the whole stored row for that date (closed, bookings and promo)."""
        merged, replaced = _merge_keep_latest(self.load_days(rid).reset_index(), new.reset_index(), key=["date"])
        readable = merged.assign(date=merged["date"].dt.strftime("%Y-%m-%d"),
                                 closed=np.where(merged["closed"] == 1, "yes", "no"),
                                 promo=np.where(merged["promo"] == 1, "yes", "no"))
        _atomic_write(readable[["date", "closed", "bookings", "promo"]], self._days_path(rid))
        return {"added": len(new) - replaced, "replaced": replaced, "total_days": len(merged)}

    def save_forecast(self, rid: str, forecast: pd.DataFrame) -> str:
        path = self.forecasts_dir / schema.restaurant_id(rid) / f"{forecast['date'].min()}.csv"
        _atomic_write(forecast, path)
        return str(path)

    def latest_forecast(self, rid: str) -> pd.DataFrame | None:
        files = sorted((self.forecasts_dir / schema.restaurant_id(rid)).glob("*.csv"))
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
