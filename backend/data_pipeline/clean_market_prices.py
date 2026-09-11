"""
clean_market_prices.py

Cleans the raw Agmarknet/data.gov.in market price snapshot for Mathura
district into a clean, well-documented table.

Note: this source ("Current Daily Price...") returns only a same-day
snapshot per request, not historical data. Re-run the download periodically
to build up a price history over time if needed.

Run from the backend/data_pipeline/ directory:
    python clean_market_prices.py
"""

import pandas as pd

# --- Constants ---------------------------------------------------------

RAW_FILE = "raw/mathura_market_prices_raw.csv"
OUTPUT_FILE = "cleaned/mathura_market_prices_clean.csv"

RENAME_MAP = {
    "State": "state",
    "District": "district",
    "Market": "market",
    "Commodity": "commodity",
    "Variety": "variety",
    "Grade": "grade",
    "Arrival_Date": "arrival_date",
    "Min_x0020_Price": "min_price",
    "Max_x0020_Price": "max_price",
    "Modal_x0020_Price": "modal_price",
}


def load_raw(path: str) -> pd.DataFrame:
    return pd.read_csv(path)


def clean(df: pd.DataFrame) -> pd.DataFrame:
    df = df.rename(columns=RENAME_MAP)

    # Parse date properly (source format is DD/MM/YYYY)
    df["arrival_date"] = pd.to_datetime(df["arrival_date"], format="%d/%m/%Y")

    # Ensure price columns are numeric
    for col in ["min_price", "max_price", "modal_price"]:
        df[col] = pd.to_numeric(df[col], errors="coerce")

    # Provenance fields, per data quality rules: every price record must
    # retain source and be clearly marked as a point-in-time value.
    df["source"] = "Agmarknet via data.gov.in"
    df["is_snapshot"] = True  # single-day snapshot, not a trend/history

    return df


def run_sanity_checks(df: pd.DataFrame) -> None:
    print("Total rows:", len(df))
    print("\nMissing values:")
    missing = df.isnull().sum()
    print(missing[missing > 0] if missing.any() else "None")
    print("\nCommodities covered:")
    print(df["commodity"].unique())
    print("\nMarkets covered:")
    print(df["market"].unique())
    print("\nData:")
    print(df)


def main():
    print("Loading raw market price data...")
    df = load_raw(RAW_FILE)

    print("\nCleaning...")
    df = clean(df)

    run_sanity_checks(df)

    df.to_csv(OUTPUT_FILE, index=False)
    print(f"\nSaved: {OUTPUT_FILE}")


if __name__ == "__main__":
    main()