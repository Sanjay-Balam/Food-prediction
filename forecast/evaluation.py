"""Honest accuracy: a rolling backtest on the most recent weeks. Every test day is forecast only from data
known at forecast time, with the model retrained every week, exactly as it runs in production."""
import numpy as np
import pandas as pd

from .config import Settings
from .features import FEATURE_GROUPS, FeatureBuilder
from .forecasters import LightGBMForecaster, SameDayLastWeek, SameWeekdayAverage
from .history import SalesHistory

VOLUME_BANDS = [(0, 10, "under 10/day"), (10, 30, "10-30/day"), (30, 100, "30-100/day"), (100, np.inf, "100+/day")]


def accuracy(actual, predicted) -> float:
    """100% minus WAPE: total portions missed divided by total portions sold."""
    actual, predicted = np.asarray(actual, dtype=float), np.asarray(predicted, dtype=float)
    if actual.sum() <= 0:
        return float("nan")
    return round(100 * (1 - np.abs(actual - predicted).sum() / actual.sum()), 1)


class Backtester:
    def __init__(self, feature_builder: FeatureBuilder, settings: Settings):
        self.feature_builder, self.settings = feature_builder, settings

    def evaluate(self, history: SalesHistory, weeks: int | None = None, horizons=None, skip_groups=(),
                 with_range: bool = True) -> dict[int, dict]:
        weeks = weeks or self.settings.backtest_weeks
        test_start = history.last_date - pd.Timedelta(days=weeks * 7 - 1)
        if test_start - history.qty.index.min() < pd.Timedelta(days=self.settings.min_history_days):
            raise ValueError(f"need {self.settings.min_history_days}+ days of sales before the "
                             f"{weeks}-week test window")
        return {days_ahead: self._evaluate_horizon(history, days_ahead, test_start, skip_groups, with_range)
                for days_ahead in (horizons or self.settings.horizons)}

    def measure_input_value(self, history: SalesHistory, weeks: int | None = None) -> tuple[float, dict]:
        """Next-day accuracy with every input on, and the points lost when each optional input is switched off."""
        next_day = self.settings.horizons[0]
        table = self.feature_builder.build(history, next_day)
        groups_present = [group for group, columns in FEATURE_GROUPS.items()
                          if any(column in table.columns for column in columns)]

        def next_day_accuracy(skip_groups) -> float:
            report = self.evaluate(history, weeks, (next_day,), skip_groups, with_range=False)
            return report[next_day]["methods"][LightGBMForecaster.name]["item_day_accuracy"]

        with_all_inputs = next_day_accuracy(())
        return with_all_inputs, {group: round(with_all_inputs - next_day_accuracy((group,)), 1)
                                 for group in groups_present}

    def _evaluate_horizon(self, history, days_ahead, test_start, skip_groups, with_range) -> dict:
        table = self.feature_builder.build(history, days_ahead, skip_groups=skip_groups)
        feature_columns = FeatureBuilder.feature_columns(table)
        dates = table.index.get_level_values("date")
        step = pd.Timedelta(days=self.settings.retrain_every_days)
        baselines = [SameWeekdayAverage(), SameDayLastWeek()]
        actual_parts, forecast_parts = [], {}
        for retrain_day in pd.date_range(test_start, history.last_date, freq=step):
            known_rows = table[dates <= retrain_day - pd.Timedelta(days=days_ahead)]
            lightgbm = LightGBMForecaster.train(known_rows, feature_columns, self.settings, with_range)
            test_rows = table[(dates >= retrain_day) & (dates < retrain_day + step)]
            test_rows = test_rows[self._can_score(test_rows)]
            if test_rows.empty:
                continue
            actual_parts.append(test_rows["qty_sold"])
            for forecaster in [lightgbm, *baselines]:
                forecast_parts.setdefault(forecaster.name, []).append(forecaster.forecast(test_rows))
        actual = pd.concat(actual_parts)
        forecasts = {name: pd.concat(parts) for name, parts in forecast_parts.items()}
        return self._summarize(actual, forecasts, with_range)

    @staticmethod
    def _can_score(rows: pd.DataFrame) -> pd.Series:
        """Known actuals, not sold out (demand unknown), and enough history for every method to compete."""
        return (rows["qty_sold"].notna() & (rows["sold_out"] == 0)
                & rows["avg_last_4_same_weekdays"].notna() & rows["same_weekday_sales_1"].notna())

    @staticmethod
    def _summarize(actual: pd.Series, forecasts: dict[str, pd.DataFrame], with_range: bool) -> dict:
        items = actual.index.get_level_values("item")
        avg_sold = actual.groupby(level="item").mean()
        band_of_item = {item: band for item, avg in avg_sold.items()
                        for low, high, band in VOLUME_BANDS if low <= avg < high}
        item_band = items.map(band_of_item)
        methods = {}
        for name, forecast in forecasts.items():
            likely = forecast["likely"]
            methods[name] = {
                "item_day_accuracy": accuracy(actual, likely),
                "daily_total_accuracy": accuracy(actual.groupby(level="date").sum(),
                                                 likely.groupby(level="date").sum()),
                "accuracy_by_item": {item: accuracy(actual[items == item], likely[items == item])
                                     for item in avg_sold.index},
                "accuracy_by_volume": {band: accuracy(actual[item_band == band], likely[item_band == band])
                                       for *_, band in VOLUME_BANDS if (item_band == band).any()},
            }
        summary = {"test_days": int(actual.index.get_level_values("date").nunique()),
                   "avg_sold_per_day": avg_sold.round(1).to_dict(), "methods": methods}
        if with_range:
            lightgbm = forecasts[LightGBMForecaster.name]
            inside = (actual >= lightgbm["low"]) & (actual <= lightgbm["high"])
            summary["range_hit_rate"] = round(100 * inside.mean(), 1)
        return summary
