"""Synthetic sales shared by the tests, in the same CSV format a restaurant uploads."""
import numpy as np
import pandas as pd

AVERAGE_DAILY_SALES = {"Chicken Biryani": 60, "Haleem": 20, "Double ka Meetha": 6}


def make_sales(days=150, start="2025-01-01", seed=0) -> pd.DataFrame:
    """Daily sales per item with a weekend lift."""
    rng = np.random.default_rng(seed)
    rows = [(date.strftime("%Y-%m-%d"), item, int(rng.poisson(avg * (1.4 if date.day_of_week >= 5 else 1.0))), "no")
            for date in pd.date_range(start, periods=days) for item, avg in AVERAGE_DAILY_SALES.items()]
    return pd.DataFrame(rows, columns=["date", "item", "qty_sold", "sold_out"])
