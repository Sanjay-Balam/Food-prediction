"""Single source of truth for paths and tuning values."""
from dataclasses import dataclass, field
from pathlib import Path

ROOT = Path(__file__).resolve().parent.parent


@dataclass(frozen=True)
class Settings:
    root: Path = ROOT
    horizons: tuple[int, ...] = (1, 7)  # h1: tomorrow; h7: days 2-7, and tomorrow if an upload is missing
    min_history_days: int = 28  # items newer than this use the same-weekday baseline
    active_item_days: int = 28  # items with no sale in this window are treated as off the menu
    # dishes averaging this many portions a day are batch-prepped and judged per dish per day; below it random
    # day-to-day swings dominate (at 10/day the best possible per-day accuracy is about 75%), so they are cook-to-order
    batch_prep_min_daily_portions: int = 10
    backtest_weeks: int = 2
    retrain_every_days: int = 14
    keep_versions: int = 3
    max_drop_points: float = 2.0  # refuse a new version this far below the active one (bad-upload guard)
    range_quantiles: tuple[float, float] = (0.05, 0.95)  # set from backtest range hit-rate, target ~80%
    rounds: int = 120
    lgbm_params: dict = field(default_factory=lambda: dict(
        learning_rate=0.05, num_leaves=15, min_data_in_leaf=20, bagging_fraction=0.8, bagging_freq=1,
        feature_fraction=0.8, verbose=-1, seed=7))

    @property
    def data_dir(self) -> Path:
        return self.root / "data"

    @property
    def artifacts_dir(self) -> Path:
        return self.root / "artifacts"

    @property
    def forecasts_dir(self) -> Path:
        return self.root / "forecasts"

    @property
    def env_file(self) -> Path:
        return self.root / ".env"
