"""Validation of incoming data: the trust boundary. Everything downstream can assume clean input."""
import re

import numpy as np
import pandas as pd

YES = {"1", "y", "yes", "true"}
_RESTAURANT_ID = re.compile(r"[A-Za-z0-9_-]{1,64}")


def restaurant_id(rid: str) -> str:
    """Ids become folder names, so only safe characters are allowed (blocks '../' paths)."""
    if not _RESTAURANT_ID.fullmatch(rid or ""):
        raise ValueError("restaurant id may only contain letters, digits, '-' and '_'")
    return rid


def _flag(col) -> pd.Series:
    return col.fillna("").astype(str).str.strip().str.lower().isin(YES).astype(int)


def _fail_if(mask: pd.Series, what: str):
    if mask.any():
        lines = (np.flatnonzero(mask.to_numpy())[:5] + 2).tolist()  # +2: header line, 1-based
        raise ValueError(f"{what} (file lines {lines})")


def _iso_dates(col: pd.Series, what: str) -> pd.Series:
    # strict YYYY-MM-DD: avoids 03-04 being read as 4 March in one file and 3 April in another
    dates = pd.to_datetime(col.astype(str).str.strip(), format="%Y-%m-%d", errors="coerce")
    _fail_if(dates.isna(), f"{what}: bad date, expected YYYY-MM-DD")
    return dates


def _normalise(df: pd.DataFrame) -> pd.DataFrame:
    return df.rename(columns=lambda c: str(c).strip().lower())


def sales(df: pd.DataFrame) -> pd.DataFrame:
    """Columns: date, item, qty_sold, optional sold_out (yes/no). One row per date and item."""
    df = _normalise(df)
    missing = {"date", "item", "qty_sold"} - set(df.columns)
    if missing:
        raise ValueError(f"sales file is missing columns: {sorted(missing)}")
    out = pd.DataFrame({
        "date": _iso_dates(df["date"], "sales"),
        "item": df["item"].astype(str).str.strip(),
        "qty_sold": pd.to_numeric(df["qty_sold"], errors="coerce"),
        "sold_out": _flag(df["sold_out"]) if "sold_out" in df else 0,
    })
    _fail_if(out["item"].isin(["", "nan"]), "sales: empty item name")
    q = out["qty_sold"]
    _fail_if(q.isna() | (q < 0) | (q % 1 != 0), "sales: qty_sold must be a whole number >= 0")
    _fail_if(out.duplicated(["date", "item"]), "sales: same date and item appears twice")
    return out.astype({"qty_sold": int})


def empty_days() -> pd.DataFrame:
    return pd.DataFrame(columns=["closed", "bookings", "promo"], index=pd.DatetimeIndex([], name="date"))


def days(df: pd.DataFrame) -> pd.DataFrame:
    """Optional per-day info: date, closed (yes/no), bookings (number), promo (yes/no). Future dates allowed."""
    df = _normalise(df)
    if "date" not in df:
        raise ValueError("days file is missing column: date")
    dates = _iso_dates(df["date"], "days")
    _fail_if(dates.duplicated(), "days: date appears twice")
    return pd.DataFrame({
        "closed": _flag(df["closed"]) if "closed" in df else 0,
        "bookings": pd.to_numeric(df["bookings"], errors="coerce") if "bookings" in df else np.nan,
        "promo": _flag(df["promo"]) if "promo" in df else 0,
    }).set_index(pd.DatetimeIndex(dates, name="date"))
