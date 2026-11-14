"""Forecasting methods behind one interface (Strategy pattern). The backtest scores them all the same way,
and the service picks LightGBM or the baseline per item. Every quantity comes from here, never from an LLM."""
from pathlib import Path
from typing import Protocol

import lightgbm as lgb
import numpy as np
import pandas as pd

from ..config import Settings
from .features import SAME_WEEKDAY_COLUMNS

RANGE_COLUMNS = ["low", "likely", "high"]


def make_range(low, likely, high, index) -> pd.DataFrame:
    """Whole portions, never negative, always low <= likely <= high."""
    likely = np.clip(np.round(np.asarray(likely, dtype=float)), 0, None)
    low = np.minimum(np.clip(np.round(np.asarray(low, dtype=float)), 0, None), likely)
    high = np.maximum(np.round(np.asarray(high, dtype=float)), likely)
    return pd.DataFrame({"low": low, "likely": likely, "high": high}, index=index).astype(int)


class Forecaster(Protocol):
    name: str

    def forecast(self, rows: pd.DataFrame) -> pd.DataFrame:
        """Returns low / likely / high per row of the feature table."""


class SameWeekdayAverage:
    """Average of the last 4 same weekdays; range = lowest..highest of those weeks.
    Used for new items and as the bar LightGBM must beat."""
    name = "same_weekday_average"

    @staticmethod
    def can_forecast(rows: pd.DataFrame) -> pd.Series:
        return rows["avg_last_4_same_weekdays"].notna() | rows["avg_last_7_known_days"].notna()

    def forecast(self, rows: pd.DataFrame) -> pd.DataFrame:
        same_weekdays = rows[SAME_WEEKDAY_COLUMNS]
        likely = rows["avg_last_4_same_weekdays"].fillna(rows["avg_last_7_known_days"])
        return make_range(same_weekdays.min(axis=1).fillna(likely), likely,
                          same_weekdays.max(axis=1).fillna(likely), rows.index)


class SameDayLastWeek:
    """Repeat last week's number. The simplest benchmark."""
    name = "same_day_last_week"

    def forecast(self, rows: pd.DataFrame) -> pd.DataFrame:
        last_week = rows["same_weekday_sales_1"]
        return make_range(last_week, last_week, last_week, rows.index)


class LightGBMForecaster:
    """Three models per horizon: 'likely' (tweedie, suits counts) and 'low'/'high' (quantiles for the range)."""
    name = "lightgbm"

    def __init__(self, models: dict[str, lgb.Booster], feature_columns: list[str]):
        self.models, self.feature_columns = models, feature_columns

    @classmethod
    def train(cls, table: pd.DataFrame, feature_columns: list[str], settings: Settings,
              with_range: bool = True) -> "LightGBMForecaster":
        # sold-out days are under-counted demand, so they are not used as training targets
        rows = table[table["qty_sold"].notna() & (table["sold_out"] == 0)]
        low_quantile, high_quantile = settings.range_quantiles
        objectives = {"likely": {"objective": "tweedie"}}
        if with_range:
            objectives["low"] = {"objective": "quantile", "alpha": low_quantile}
            objectives["high"] = {"objective": "quantile", "alpha": high_quantile}
        models = {name: lgb.train(settings.lgbm_params | objective,
                                  lgb.Dataset(rows[feature_columns], rows["qty_sold"]), settings.rounds)
                  for name, objective in objectives.items()}
        return cls(models, feature_columns)

    def forecast(self, rows: pd.DataFrame) -> pd.DataFrame:
        predicted = {name: model.predict(rows[self.feature_columns]) for name, model in self.models.items()}
        likely = predicted["likely"]
        return make_range(predicted.get("low", likely), likely, predicted.get("high", likely), rows.index)

    def save(self, folder: Path, prefix: str):
        for name, model in self.models.items():
            model.save_model(str(folder / f"{prefix}_{name}.txt"))

    @classmethod
    def load(cls, folder: Path, prefix: str, feature_columns: list[str]) -> "LightGBMForecaster":
        files = {name: folder / f"{prefix}_{name}.txt" for name in RANGE_COLUMNS}
        models = {name: lgb.Booster(model_file=str(path)) for name, path in files.items() if path.exists()}
        return cls(models, feature_columns)
