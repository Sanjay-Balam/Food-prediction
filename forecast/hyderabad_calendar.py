"""Calendar features for Hyderabad: Telangana public holidays plus curated local events.
Every value here is known in advance, so it is safe to use for future dates."""
from pathlib import Path

import holidays
import numpy as np
import pandas as pd

EVENTS_CSV = Path(__file__).with_name("calendar_events.csv")
EVENT_FEATURES = {"festival": "is_festival", "ramzan": "is_ramzan", "ipl": "is_ipl_match", "local": "is_local_event"}
CALENDAR_FEATURES = ("is_holiday", "is_day_before_holiday", "is_day_after_holiday", "days_to_next_holiday",
                     *EVENT_FEATURES.values())
MAX_DAYS_TO_HOLIDAY = 7  # festival build-up is counted for one week


class EventCalendar:
    def __init__(self, events_csv: Path = EVENTS_CSV, country: str = "IN", state: str | None = "TG"):
        self.events = self._load_events(events_csv)
        self.country, self.state = country, state

    def features_for(self, dates: pd.DatetimeIndex) -> pd.DataFrame:
        table = pd.DataFrame(index=dates)
        for kind, column in EVENT_FEATURES.items():
            table[column] = self._is_event_day(dates, kind)
        holiday_dates = self._holiday_dates(dates)
        one_day = pd.Timedelta(days=1)
        table["is_holiday"] = dates.isin(holiday_dates).astype(int)
        table["is_day_before_holiday"] = (dates + one_day).isin(holiday_dates).astype(int)
        table["is_day_after_holiday"] = (dates - one_day).isin(holiday_dates).astype(int)
        table["days_to_next_holiday"] = self._days_to_next_holiday(dates, holiday_dates)
        return table[list(CALENDAR_FEATURES)]

    @staticmethod
    def _load_events(path: Path) -> pd.DataFrame:
        events = pd.read_csv(path, comment="#", parse_dates=["start", "end"])
        invalid = ~events["kind"].isin(list(EVENT_FEATURES)) | (events["end"] < events["start"])
        if invalid.any():
            raise ValueError(f"{path.name}: invalid rows {events[invalid].index.tolist()}; "
                             f"kind must be one of {list(EVENT_FEATURES)} and end must not be before start")
        return events

    def _is_event_day(self, dates: pd.DatetimeIndex, kind: str) -> np.ndarray:
        flags = np.zeros(len(dates), dtype=int)
        for event in self.events[self.events["kind"] == kind].itertuples():
            flags[(dates >= event.start) & (dates <= event.end)] = 1
        return flags

    def _holiday_dates(self, dates: pd.DatetimeIndex) -> pd.DatetimeIndex:
        years = range(dates.min().year - 1, dates.max().year + 2)
        public = holidays.country_holidays(self.country, subdiv=self.state, years=years)
        all_dates = set(pd.to_datetime(list(public)))
        for festival in self.events[self.events["kind"] == "festival"].itertuples():
            all_dates.update(pd.date_range(festival.start, festival.end))
        return pd.DatetimeIndex(sorted(all_dates))

    @staticmethod
    def _days_to_next_holiday(dates: pd.DatetimeIndex, holiday_dates: pd.DatetimeIndex) -> np.ndarray:
        next_position = np.searchsorted(holiday_dates.values, dates.values)
        days_left = np.full(len(dates), MAX_DAYS_TO_HOLIDAY)
        has_next = next_position < len(holiday_dates)
        gap = (holiday_dates.values[next_position[has_next]] - dates.values[has_next]) // np.timedelta64(1, "D")
        days_left[has_next] = np.minimum(gap, MAX_DAYS_TO_HOLIDAY)
        return days_left
