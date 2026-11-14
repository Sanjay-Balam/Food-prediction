"""ForecastService: the single entry point (Facade) for the CLI today and an API later.

    nightly:  ingest_sales_file  ->  forecast_next_days      (no training)
    weekly:   train_weekly       (backtest, retrain, activate only if it earns it)
"""
from dataclasses import dataclass

import pandas as pd

from . import schema
from .config import Settings
from .evaluation import Backtester
from .features import FeatureBuilder
from .forecasters import RANGE_COLUMNS, LightGBMForecaster, SameWeekdayAverage
from .history import SalesHistory
from .registry import ModelRegistry
from .store import RestaurantStore


@dataclass(frozen=True)
class TrainingResult:
    version: str
    activated: bool
    reason: str
    report: dict


def decide_activation(new_accuracy: dict, baseline_accuracy: dict, active_info: dict | None,
                      max_drop_points: float) -> tuple[bool, str]:
    """A new model goes live only if it beats the simple baseline on recent unseen days, and it has not
    dropped sharply versus the live model (a sharp drop usually means a bad upload, not a better model)."""
    if not all(new_accuracy[h] > baseline_accuracy[h] for h in new_accuracy):
        return False, "LightGBM did not beat the same-weekday average on recent unseen days"
    next_day = min(new_accuracy)
    if active_info and new_accuracy[next_day] < active_info["backtest_accuracy"][str(next_day)] - max_drop_points:
        return False, (f"next-day accuracy fell more than {max_drop_points} points below the live version; "
                       "check recent uploads")
    return True, "beats the same-weekday average on recent unseen days"


class ForecastService:
    def __init__(self, store: RestaurantStore, registry: ModelRegistry, feature_builder: FeatureBuilder,
                 backtester: Backtester, settings: Settings):
        self.store, self.registry = store, registry
        self.feature_builder, self.backtester, self.settings = feature_builder, backtester, settings

    def load_history(self, rid: str) -> SalesHistory:
        return SalesHistory.from_records(self.store.load_sales(rid), self.store.load_days(rid))

    def ingest_sales_file(self, rid: str, path) -> dict:
        return self.store.upsert_sales(rid, schema.sales(pd.read_csv(path, dtype=str)))

    def ingest_days_file(self, rid: str, path) -> dict:
        """Bookings, promotions and closed days. Future dates are allowed (e.g. a party booked for Friday)."""
        return self.store.upsert_days(rid, schema.days(pd.read_csv(path, dtype=str)))

    def train_weekly(self, rid: str, weeks: int | None = None) -> TrainingResult:
        history = self.load_history(rid)
        report = self.backtester.evaluate(history, weeks)
        new_accuracy = {h: report[h]["methods"][LightGBMForecaster.name]["item_day_accuracy"] for h in report}
        baseline_accuracy = {h: report[h]["methods"][SameWeekdayAverage.name]["item_day_accuracy"] for h in report}
        models = {days_ahead: self._train_on_all_history(history, days_ahead) for days_ahead in self.settings.horizons}

        _, active_info = self.registry.active_version(rid)
        activate, reason = decide_activation(new_accuracy, baseline_accuracy, active_info,
                                             self.settings.max_drop_points)
        info = {"trained_on": {"from": str(history.qty.index.min().date()), "until": str(history.last_date.date())},
                "backtest_accuracy": {str(h): v for h, v in new_accuracy.items()},
                "baseline_accuracy": {str(h): v for h, v in baseline_accuracy.items()},
                "activated": activate, "reason": reason}
        version = self.registry.save_new_version(rid, models, info)
        if activate:
            self.registry.activate(rid, version)
        self.registry.delete_old_versions(rid)
        return TrainingResult(version, activate, reason, report)

    def forecast_next_days(self, rid: str, days: int = 7) -> pd.DataFrame:
        """low / likely / high portions per menu item for the days after the latest uploaded sales day."""
        longest = max(self.settings.horizons)
        if not 1 <= days <= longest:
            raise ValueError(f"days must be between 1 and {longest}")
        history = self.load_history(rid)
        forecast_dates = pd.date_range(history.last_date + pd.Timedelta(days=1), periods=days, name="date")
        version, models = self.registry.load_active_models(rid)
        parts = [self._forecast_dates(history, days_ahead, dates, models.get(days_ahead), until=forecast_dates[-1])
                 for days_ahead, dates in self._dates_by_horizon(forecast_dates, history.last_date).items()]
        forecast = pd.concat(parts).reset_index()
        forecast["date"] = forecast["date"].dt.strftime("%Y-%m-%d")
        forecast["data_until"] = str(history.last_date.date())
        forecast["model_version"] = version or "none (baseline only)"
        self.store.save_forecast(rid, forecast)
        return forecast

    def _train_on_all_history(self, history: SalesHistory, days_ahead: int) -> LightGBMForecaster:
        table = self.feature_builder.build(history, days_ahead)
        return LightGBMForecaster.train(table, FeatureBuilder.feature_columns(table), self.settings)

    def _dates_by_horizon(self, forecast_dates, last_date) -> dict[int, list]:
        """Each date uses the shortest-horizon model that needs sales only up to last_date."""
        groups = {}
        for date in forecast_dates:
            days_ahead = (date - last_date).days
            model_horizon = min(h for h in self.settings.horizons if h >= days_ahead)
            groups.setdefault(model_horizon, []).append(date)
        return groups

    def _forecast_dates(self, history: SalesHistory, days_ahead: int, dates: list,
                        model: LightGBMForecaster | None, until) -> pd.DataFrame:
        items = history.active_items(self.settings.active_item_days)
        table = self.feature_builder.build(history, days_ahead, until=until)
        rows = table.loc[pd.MultiIndex.from_product([dates, items], names=["date", "item"])]
        baseline = SameWeekdayAverage()
        rows = rows[baseline.can_forecast(rows)]  # brand-new items with under ~4 days of sales are skipped
        result = baseline.forecast(rows).assign(method=baseline.name)
        if model is not None:
            new_items = history.items_newer_than(self.settings.min_history_days)
            use_model = ~rows.index.get_level_values("item").isin(new_items)
            if use_model.any():
                result.loc[use_model, RANGE_COLUMNS] = model.forecast(rows[use_model]).to_numpy()
                result.loc[use_model, "method"] = model.name
        return result.assign(horizon=f"{days_ahead}-day model")
