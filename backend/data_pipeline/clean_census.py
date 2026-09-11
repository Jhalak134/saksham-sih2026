"""
clean_census.py

Filters the raw all-India Census 2011 village-level dataset down to the
Mathura district (Uttar Pradesh) pilot region, cleans column names/types,
and produces two clean output files:

  - mathura_villages_clean.csv   (874 villages, one row each)
  - mathura_summaries_clean.csv  (district + sub-district rollups)

Run from the backend/data_pipeline/ directory:
    python clean_census.py
"""

import pandas as pd

# --- Constants -------------------------------------------------------------

RAW_FILE = "raw/2011-IndiaStateDistSbDistVill-0000.xlsx"
VILLAGES_OUT = "cleaned/mathura_villages_clean.csv"
SUMMARIES_OUT = "cleaned/mathura_summaries_clean.csv"

STATE_CODE_UP = 9          # Uttar Pradesh
DISTRICT_CODE_MATHURA = 145  # Mathura district

# Columns we actually need, per docs/data_requirements.md and data_dictionary.md
KEEP_COLUMNS = [
    "State", "District", "Subdistt", "Town/Village", "Level", "Name", "TRU",
    "No_HH", "TOT_P", "TOT_M", "TOT_F",
    "P_LIT", "M_LIT", "F_LIT", "P_ILL", "M_ILL", "F_ILL",
    "TOT_WORK_P", "TOT_WORK_M", "TOT_WORK_F",
    "MAIN_CL_P", "MAIN_AL_P", "MAIN_HH_P",
    "NON_WORK_P",
]

RENAME_MAP = {
    "Town/Village": "village_code",
    "Name": "name",
    "No_HH": "households",
    "TOT_P": "population_total",
    "TOT_M": "population_male",
    "TOT_F": "population_female",
    "P_LIT": "literate_total",
    "M_LIT": "literate_male",
    "F_LIT": "literate_female",
    "P_ILL": "illiterate_total",
    "M_ILL": "illiterate_male",
    "F_ILL": "illiterate_female",
    "TOT_WORK_P": "workers_total",
    "TOT_WORK_M": "workers_male",
    "TOT_WORK_F": "workers_female",
    "MAIN_CL_P": "cultivators",
    "MAIN_AL_P": "agri_labourers",
    "MAIN_HH_P": "household_industry_workers",
    "NON_WORK_P": "non_workers",
    "Town/Village": "village_code",
    "NON_WORK_P": "non_workers",
}

# --- Block-centroid coordinates (approximation, not per-village precision) ---
# Census 2011 PCA data has no lat/long. Mathura's 874 villages fall into just
# 4 blocks (sub-districts), so we assign each village its block headquarters'
# coordinates as a documented approximation — good enough for 5-10km radius
# analysis, not claimed as exact village-level location.
BLOCK_COORDINATES = {
    761: {"latitude": 27.7239, "longitude": 77.5029},  # Chhata
    762: {"latitude": 27.6364, "longitude": 77.7124},  # Mat (Mant)
    763: {"latitude": 27.4300, "longitude": 77.7500},  # Mahavan
    764: {"latitude": 27.4925, "longitude": 77.6737},  # Mathura
}


def add_approximate_coordinates(villages: pd.DataFrame) -> pd.DataFrame:
    """
    Attach latitude/longitude to each village using its block's centroid.
    This is a documented approximation, not per-village geocoding — see
    docs/location_schema.md data quality rules (source must be recorded).
    """
    villages = villages.copy()
    villages["latitude"] = villages["Subdistt"].map(
        lambda code: BLOCK_COORDINATES[code]["latitude"]
    )
    villages["longitude"] = villages["Subdistt"].map(
        lambda code: BLOCK_COORDINATES[code]["longitude"]
    )
    villages["location_precision"] = "block_centroid_approximation"
    return villages    


def load_raw_census(path: str) -> pd.DataFrame:
    """Load the raw all-India Census Excel file."""
    return pd.read_excel(path)


def filter_to_mathura(df: pd.DataFrame) -> pd.DataFrame:
    """Filter the all-India dataset down to Mathura district, UP."""
    return df[
        (df["State"] == STATE_CODE_UP) & (df["District"] == DISTRICT_CODE_MATHURA)
    ].copy()


def clean_columns(df: pd.DataFrame) -> pd.DataFrame:
    """Select only needed columns and rename them to clear names."""
    df = df[KEEP_COLUMNS].copy()
    df = df.rename(columns=RENAME_MAP)
    return df


def split_villages_and_summaries(df: pd.DataFrame) -> tuple[pd.DataFrame, pd.DataFrame]:
    """
    Split into village-level rows (used by the feasibility engine) and
    sub-district/district summary rows (used for rollups/context).
    """
    villages = df[df["Level"] == "VILLAGE"].copy()
    summaries = df[df["Level"].isin(["SUB-DISTRICT", "DISTRICT"])].copy()

    # Villages are always TRU='Rural' in this dataset — Level/TRU carry no
    # extra information at this granularity, so drop them.
    villages = villages.drop(columns=["Level", "TRU"])

    return villages, summaries

def add_approximate_coordinates(villages: pd.DataFrame) -> pd.DataFrame:
    """
    Attach latitude/longitude to each village using its block's centroid.
    This is a documented approximation, not per-village geocoding — see
    docs/location_schema.md data quality rules (source must be recorded).
    """
    villages = villages.copy()
    villages["latitude"] = villages["Subdistt"].map(
        lambda code: BLOCK_COORDINATES[code]["latitude"]
    )
    villages["longitude"] = villages["Subdistt"].map(
        lambda code: BLOCK_COORDINATES[code]["longitude"]
    )
    villages["location_precision"] = "block_centroid_approximation"
    return villages


def run_sanity_checks(villages: pd.DataFrame, summaries: pd.DataFrame) -> None:
    """Print checks a human should glance at before trusting the output."""
    print("Villages shape:", villages.shape)
    print("Summaries shape:", summaries.shape)

    missing = villages.isnull().sum()
    missing = missing[missing > 0]
    if not missing.empty:
        print("\nWARNING: missing values found in villages:")
        print(missing)
    else:
        print("\nNo missing values in villages — good.")

    print("\nSample village rows:")
    print(villages.head())


def main():
    print("Loading raw census file...")
    df = load_raw_census(RAW_FILE)
    print("Raw shape:", df.shape)

    print("\nFiltering to Mathura district...")
    mathura_df = filter_to_mathura(df)
    print("Mathura rows:", mathura_df.shape[0])

    print("\nCleaning columns...")
    mathura_df = clean_columns(mathura_df)

    print("\nSplitting into villages / summaries...")
    villages, summaries = split_villages_and_summaries(mathura_df)

    print("\nAdding approximate block-centroid coordinates...")
    villages = add_approximate_coordinates(villages)

    run_sanity_checks(villages, summaries)

    villages.to_csv(VILLAGES_OUT, index=False)
    summaries.to_csv(SUMMARIES_OUT, index=False)
    print(f"\nSaved: {VILLAGES_OUT}")
    print(f"Saved: {SUMMARIES_OUT}")


if __name__ == "__main__":
    main()

