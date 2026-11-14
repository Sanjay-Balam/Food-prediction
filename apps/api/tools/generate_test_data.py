"""Generates realistic TEST data for an imaginary Hyderabad biryani restaurant (not real sales).

    python tools/generate_test_data.py

Writes test_data/hyderabad_demo/: sales.csv, sales.json, day_info.csv, last_week_sales.csv.
The patterns below are hidden in the numbers, so the forecast has something real to learn.
"""
import json
from pathlib import Path

import holidays
import numpy as np
import pandas as pd

ROOT = Path(__file__).resolve().parent.parent
OUTPUT = ROOT / "test_data" / "hyderabad_demo"
EVENTS_CSV = ROOT / "forecast" / "model" / "calendar_events.csv"
FIRST_DAY, LAST_DAY = "2024-11-01", "2026-11-13"
SEED = 42

# average portions on a normal Wednesday at the start of the data
MENU = {
    "Chicken Dum Biryani": 140, "Mutton Dum Biryani": 60, "Veg Biryani": 25, "Chicken 65": 45,
    "Apollo Fish": 18, "Paneer Butter Masala": 22, "Butter Naan": 120, "Double ka Meetha": 30,
    "Qubani ka Meetha": 12, "Haleem": 210,  # Haleem is only on the menu during Ramzan
}
BIRYANIS = {"Chicken Dum Biryani", "Mutton Dum Biryani", "Veg Biryani"}
DESSERTS = {"Double ka Meetha", "Qubani ka Meetha"}
DAILY_STOCK = {"Mutton Dum Biryani": 100, "Haleem": 320}  # the kitchen runs out above this

WEEKDAY_EFFECT = [0.85, 0.85, 0.90, 0.95, 1.15, 1.30, 1.40]  # Monday .. Sunday
FESTIVAL_EFFECT = {  # matched against the Telangana holiday names; others get 1.15
    "Eid al-Fitr": 1.70, "Eid al-Adha": 1.35, "Christmas": 1.25, "Independence Day": 1.15,
    "Republic Day": 1.15, "Diwali": 0.85, "Holi": 0.90, "Dussehra": 0.80,  # families at home or travelling
}
SANKRANTI_EFFECT = 0.70  # the city empties: people go to their home villages
GUESTS_SHARE = {"Chicken Dum Biryani": 0.45, "Mutton Dum Biryani": 0.20, "Chicken 65": 0.25,
                "Butter Naan": 0.50, "Double ka Meetha": 0.30}  # portions per booked party guest


def build_calendar(dates: pd.DatetimeIndex) -> pd.DataFrame:
    public = holidays.country_holidays("IN", subdiv="TG", years=range(dates.min().year, dates.max().year + 1))
    events = pd.read_csv(EVENTS_CSV, comment="#", parse_dates=["start", "end"])
    calendar = pd.DataFrame(index=dates)
    calendar["festival_effect"] = 1.0
    for day, name in public.items():
        if pd.Timestamp(day) in calendar.index:
            effect = next((value for key, value in FESTIVAL_EFFECT.items() if key in name), 1.15)
            calendar.loc[pd.Timestamp(day), "festival_effect"] = effect
            day_before = pd.Timestamp(day) - pd.Timedelta(days=1)
            if day_before in calendar.index and calendar.loc[day_before, "festival_effect"] == 1.0:
                calendar.loc[day_before, "festival_effect"] = 1.08  # people go out the evening before
    for event in events.itertuples():
        days = (dates >= event.start) & (dates <= event.end)
        if "Sankranti" in event.event or "Bhogi" in event.event:
            calendar.loc[days, "festival_effect"] = SANKRANTI_EFFECT
        elif event.kind == "festival":
            calendar.loc[days, "festival_effect"] = np.maximum(calendar.loc[days, "festival_effect"], 1.15)
    calendar["is_ramzan"] = False
    for ramzan in events[events["kind"] == "ramzan"].itertuples():
        calendar.loc[(dates >= ramzan.start) & (dates <= ramzan.end), "is_ramzan"] = True
    return calendar


def build_day_info(dates: pd.DatetimeIndex, rng) -> pd.DataFrame:
    """Party bookings (more on weekends), delivery-app promotions, a few closed days, New Year's Eve parties."""
    info = pd.DataFrame({"closed": False, "bookings": 0, "promo": False}, index=dates)
    weekend = dates.day_of_week >= 4
    party = rng.random(len(dates)) < np.where(weekend, 0.18, 0.06)
    info.loc[party, "bookings"] = rng.integers(20, 150, party.sum())
    info.loc[rng.random(len(dates)) < 0.07, "promo"] = True
    for new_years_eve in [d for d in dates if d.month == 12 and d.day == 31]:
        info.loc[new_years_eve, "bookings"] = 180
    info.loc[pd.to_datetime(["2025-07-08", "2026-02-03"]), "closed"] = True  # maintenance days
    return info


def expected_demand(dates, calendar, info, rng) -> pd.DataFrame:
    years_in = (dates - dates[0]).days / 365.0
    common = (np.array(WEEKDAY_EFFECT)[dates.day_of_week]
              * (1 + 0.12 * years_in)                                     # the restaurant slowly grows
              * np.where(dates.day <= 5, 1.08, 1.0)                        # salary days
              * np.select([dates.month.isin([4, 5]), dates.month == 12], [0.92, 1.08], 1.0)  # heat / year end
              * np.where(dates.month.isin([7, 8, 9]) & (rng.random(len(dates)) < 0.25), 0.80, 1.0)  # rain
              * calendar["festival_effect"].to_numpy()
              * np.where(info["promo"], 1.15, 1.0))
    demand = pd.DataFrame(index=dates)
    for item, base in MENU.items():
        level = base * common
        if item in BIRYANIS:
            level = level * np.where(dates.day_of_week == 4, 1.10, 1.0)  # Friday lunch after prayers
            level = level * np.where(calendar["is_ramzan"], 1.30, 1.0)    # iftar dinners
        if item in DESSERTS:
            level = level * np.where(calendar["is_ramzan"], 1.25, 1.0)
        if item == "Haleem":
            level = np.where(calendar["is_ramzan"], level, 0.0)
        demand[item] = level + GUESTS_SHARE.get(item, 0.0) * info["bookings"].to_numpy()
    return demand


def to_sales(demand: pd.DataFrame, info: pd.DataFrame, rng) -> pd.DataFrame:
    """Random day-to-day variation (more than pure chance, like real demand), stock-outs, closed days.
    Items that sold 0 have no row, as in real POS exports."""
    noise = rng.gamma(shape=25, scale=1 / 25, size=demand.shape)
    sold = rng.poisson(demand.to_numpy() * noise)
    rows = []
    for day_index, day in enumerate(demand.index):
        if info.loc[day, "closed"]:
            continue
        for item_index, item in enumerate(demand.columns):
            quantity = int(sold[day_index, item_index])
            stock = DAILY_STOCK.get(item)
            sold_out = stock is not None and quantity >= stock
            quantity = min(quantity, stock) if stock else quantity
            if quantity > 0:
                rows.append({"date": day.strftime("%Y-%m-%d"), "item": item, "qty_sold": quantity,
                             "sold_out": "yes" if sold_out else "no"})
    return pd.DataFrame(rows)


def main():
    rng = np.random.default_rng(SEED)
    dates = pd.date_range(FIRST_DAY, LAST_DAY)
    future = pd.date_range(pd.Timestamp(LAST_DAY) + pd.Timedelta(days=1), periods=7)
    calendar = build_calendar(dates)
    info = build_day_info(dates.append(future), rng)
    sales = to_sales(expected_demand(dates, calendar, info.loc[dates], rng), info.loc[dates], rng)

    OUTPUT.mkdir(parents=True, exist_ok=True)
    sales.to_csv(OUTPUT / "sales.csv", index=False)
    (OUTPUT / "sales.json").write_text(json.dumps(sales.to_dict("records"), indent=1), encoding="utf-8")
    last_week = sales[sales["date"] > (pd.Timestamp(LAST_DAY) - pd.Timedelta(days=7)).strftime("%Y-%m-%d")]
    last_week.to_csv(OUTPUT / "last_week_sales.csv", index=False)
    marked = info[info["closed"] | info["promo"] | (info["bookings"] > 0)]
    marked.assign(closed=np.where(marked["closed"], "yes", "no"), promo=np.where(marked["promo"], "yes", "no"))\
        .rename_axis("date").reset_index().assign(date=lambda t: t["date"].dt.strftime("%Y-%m-%d"))\
        .to_csv(OUTPUT / "day_info.csv", index=False)
    print(f"{len(sales)} sales rows, {sales['item'].nunique()} items, {FIRST_DAY} to {LAST_DAY} -> {OUTPUT}")


if __name__ == "__main__":
    main()
