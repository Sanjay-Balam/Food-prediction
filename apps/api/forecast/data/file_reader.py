"""Reads an uploaded CSV or JSON file into a table of text values, ready for schema validation."""
import json
from pathlib import Path

import pandas as pd

ACCEPTED_TYPES = (".csv", ".json")
JSON_EXAMPLE = '[{"date": "2026-11-14", "item": "Chicken Biryani", "qty_sold": 182, "sold_out": "no"}]'


def read_table_file(source, filename: str | None = None) -> pd.DataFrame:
    """source is a file path, or an open file (an API upload) together with its original filename."""
    name = str(filename or source).lower()
    if name.endswith(".csv"):
        # utf-8-sig: CSVs saved from Excel start with an invisible BOM that would corrupt the first header
        return pd.read_csv(source, dtype=str, encoding="utf-8-sig")
    if name.endswith(".json"):
        return _rows_from_json(source)
    raise ValueError(f"only {' or '.join(ACCEPTED_TYPES)} files are accepted, got '{Path(name).name}'")


def _rows_from_json(source) -> pd.DataFrame:
    raw = source.read() if hasattr(source, "read") else Path(source).read_bytes()
    try:
        rows = json.loads(raw)  # bytes input also handles a UTF-8 BOM
    except json.JSONDecodeError as error:
        raise ValueError(f"the file is not valid JSON ({error})") from None
    if not isinstance(rows, list) or not all(isinstance(row, dict) for row in rows):
        raise ValueError(f"JSON must be a list of rows, for example {JSON_EXAMPLE}")
    return pd.DataFrame(rows, dtype=str)
