"""ForecastService: the single entry point (Facade) for the CLI today and an API later.

    nightly:  ingest_sales_file  ->  forecast_next_days      (no training)
    weekly:   train_weekly       (backtest, retrain, activate only if it earns it)
"""
from dataclasses import dataclass

import pandas as pd

from .config import Settings
from .data import schema
from .data.file_reader import read_table_file
from .data.history import SalesHistory
from .data.store import RestaurantStore
from .evaluation.backtest import Backtester
from .evaluation.comparison import compare_by_day, compare_by_week
from .model.features import FeatureBuilder
from .model.forecasters import RANGE_COLUMNS, LightGBMForecaster, SameWeekdayAverage
from .model.registry import ModelRegistry


@dataclass(frozen=True)
class TrainingResult:
    version: str
    activated: bool
    reason: str
    report: dict


def decide_activation(new_accuracy: dict, baseline_accuracy: dict, active_info: dict | None,
                      max_drop_points: float, trained_until: str,
                      items_count: int | None = None) -> tuple[bool, str]:
    """A new model goes live only if it beats the simple baseline on recent unseen days, and it has not
    dropped sharply versus the live model (a sharp drop usually means a bad upload, not a better model).
    A test on an earlier cutoff covers different weeks, so it is not compared with the live model."""
    if not all(new_accuracy[h] >= baseline_accuracy[h] - 1.0 for h in new_accuracy):
        return False, "LightGBM did not beat the same-weekday average on recent unseen days"
    next_day = min(new_accuracy)
    same_or_newer_data = active_info is not None and trained_until >= active_info["trained_on"]["until"]
    active_items = active_info.get("items_count") if active_info else None
    same_scope = active_items is None or items_count is None or abs(active_items - items_count) <= 5
    if same_or_newer_data and same_scope and new_accuracy[next_day] < active_info["backtest_accuracy"][str(next_day)] - max_drop_points:
        return False, (f"next-day accuracy fell more than {max_drop_points} points below the live version; "
                       "check recent uploads")
    return True, "beats the same-weekday average on recent unseen days"


class ForecastService:
    def __init__(self, store: RestaurantStore, registry: ModelRegistry, feature_builder: FeatureBuilder,
                 backtester: Backtester, settings: Settings):
        self.store, self.registry = store, registry
        self.feature_builder, self.backtester, self.settings = feature_builder, backtester, settings

    def load_history(self, rid: str, until=None) -> SalesHistory:
        """All uploaded sales, or only those up to and including `until` (later days stay unseen for testing)."""
        history = SalesHistory.from_records(self.store.load_sales(rid), self.store.load_days(rid))
        return history.up_to(until) if until is not None else history

    def ingest_sales_file(self, rid: str, source, filename: str | None = None) -> dict:
        """source: a .csv or .json file path, or an uploaded file together with its filename."""
        return self.store.upsert_sales(rid, schema.sales(read_table_file(source, filename)))

    def ingest_days_file(self, rid: str, source, filename: str | None = None) -> dict:
        """Bookings, promotions and closed days. Future dates are allowed (e.g. a party booked for Friday)."""
        return self.store.upsert_days(rid, schema.days(read_table_file(source, filename)))

    def compare_with_actuals(self, rid: str, period: str = "day", actuals_source=None,
                             filename: str | None = None) -> dict:
        """Latest forecast vs real sales. Real sales come from a reference file (NOT saved, so it stays hidden
        from training) or, with no file, from the sales already uploaded (e.g. the days after a training cutoff)."""
        comparisons = {"day": compare_by_day, "week": compare_by_week}
        if period not in comparisons:
            raise ValueError("period must be 'day' or 'week'")
        forecast = self.store.latest_forecast(rid)
        if forecast is None:
            raise FileNotFoundError(f"no forecast yet for '{rid}': make a forecast first")
        actuals = (schema.sales(read_table_file(actuals_source, filename)) if actuals_source is not None
                   else self.store.load_sales(rid))
        return comparisons[period](forecast, actuals)

    def train_weekly(self, rid: str, weeks: int | None = None, until=None) -> TrainingResult:
        """`until` trains only on sales up to that day, keeping the later uploaded days as a hidden test."""
        history = self.load_history(rid, until)
        report = self.backtester.evaluate(history, weeks)
        new_accuracy = {h: report[h]["methods"][LightGBMForecaster.name]["item_day_accuracy"] for h in report}
        baseline_accuracy = {h: report[h]["methods"][SameWeekdayAverage.name]["item_day_accuracy"] for h in report}
        models = {days_ahead: self._train_on_all_history(history, days_ahead) for days_ahead in self.settings.horizons}

        _, active_info = self.registry.active_version(rid)
        items_count = len(history.qty.columns) if hasattr(history, "qty") else None
        activate, reason = decide_activation(new_accuracy, baseline_accuracy, active_info,
                                             self.settings.max_drop_points, str(history.last_date.date()),
                                             items_count=items_count)
        info = {"trained_on": {"from": str(history.qty.index.min().date()), "until": str(history.last_date.date())},
                "backtest_accuracy": {str(h): v for h, v in new_accuracy.items()},
                "baseline_accuracy": {str(h): v for h, v in baseline_accuracy.items()},
                "activated": activate, "reason": reason,
                "items_count": items_count}
        version = self.registry.save_new_version(rid, models, info)
        if activate:
            self.registry.activate(rid, version)
        self.registry.delete_old_versions(rid)
        return TrainingResult(version, activate, reason, report)

    def forecast_next_days(self, rid: str, days: int = 7, until=None) -> pd.DataFrame:
        """low / likely / high portions per menu item for the days after the latest uploaded sales day,
        or after `until` when testing against days that were already uploaded."""
        longest = max(self.settings.horizons)
        if not 1 <= days <= longest:
            raise ValueError(f"days must be between 1 and {longest}")
        history = self.load_history(rid, until)
        self._check_live_model_has_not_seen(history.last_date, rid)
        if not history.active_items(self.settings.active_item_days):
            raise ValueError(f"no menu item sold in the last {self.settings.active_item_days} days of uploaded "
                             "sales, so there is nothing to forecast")
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

    def _check_live_model_has_not_seen(self, last_known_day: pd.Timestamp, rid: str):
        """A model trained on later sales would already have seen the days we are about to test on."""
        _, live_info = self.registry.active_version(rid)
        last_known = str(last_known_day.date())
        if live_info and live_info["trained_on"]["until"] > last_known:
            raise ValueError(f"the live model was trained on sales up to {live_info['trained_on']['until']}, "
                             f"after {last_known}, so this test would not be fair. Train with until={last_known} "
                             "first (if that training did not go live, LightGBM did not beat the simple average "
                             "at this cutoff)")

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
