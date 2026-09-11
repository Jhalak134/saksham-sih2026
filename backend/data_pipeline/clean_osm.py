"""
clean_osm.py

Cleans the raw OSM GeoJSON export for Mathura district into a flat table of
businesses/POIs relevant to competitor mapping and infrastructure context.

Run from the backend/data_pipeline/ directory:
    python clean_osm.py
"""

import json
import pandas as pd
from datetime import date

# --- Constants ---------------------------------------------------------

RAW_FILE = "raw/mathura_osm_raw.geojson"
OUTPUT_FILE = "cleaned/mathura_osm_clean.csv"

# Tags that are physical infrastructure, not businesses/competitors —
# excluded from the business/competitor table since they'd distort
# competitor density calculations.
EXCLUDED_AMENITY_VALUES = {
    "drinking_water", "bench", "toilets", "waste_basket",
    "device_charging_station", "clock", "post_box", "fixme",
    "shelter",
}


def load_geojson(path: str) -> dict:
    with open(path, encoding="utf-8") as f:
        return json.load(f)


def extract_category(tags: dict) -> tuple[str, str]:
    """
    Returns (category, subcategory) from OSM tags.
    category = the broad tag type (shop / amenity / craft)
    subcategory = the specific value (e.g. shop=dairy -> subcategory='dairy')
    """
    if "shop" in tags:
        return "shop", tags["shop"]
    if "amenity" in tags:
        return "amenity", tags["amenity"]
    if "craft" in tags:
        return "craft", tags["craft"]
    return "unknown", "unknown"


def extract_coords(feature: dict) -> tuple[float, float]:
    """
    Nodes have direct lat/lon in properties (after conversion) or geometry.
    Ways have a 'center' with lat/lon.
    Handles both cases from the raw Overpass GeoJSON export.
    """
    geom = feature.get("geometry", {})
    coords = geom.get("coordinates")
    if coords and len(coords) == 2:
        lon, lat = coords
        return lat, lon
    return None, None


def clean_features(raw: dict) -> pd.DataFrame:
    rows = []
    for feature in raw["features"]:
        props = feature.get("properties", {})
        tags = {k: v for k, v in props.items() if k not in ("id", "type")}

        category, subcategory = extract_category(tags)

        if category == "amenity" and subcategory in EXCLUDED_AMENITY_VALUES:
            continue
        if category == "unknown":
            continue

        lat, lon = extract_coords(feature)
        if lat is None or lon is None:
            continue

        rows.append({
            "osm_id": props.get("id") or feature.get("id"),
            "name": tags.get("name", "Unnamed"),
            "category": category,
            "subcategory": subcategory,
            "latitude": lat,
            "longitude": lon,
            "source": "OpenStreetMap",
            "collection_date": date.today().isoformat(),
        })

    return pd.DataFrame(rows)


def run_sanity_checks(df: pd.DataFrame) -> None:
    print("Total cleaned rows:", len(df))
    print("\nTop categories:")
    print(df["category"].value_counts())
    print("\nTop subcategories:")
    print(df["subcategory"].value_counts().head(20))
    print("\nUnnamed businesses:", (df["name"] == "Unnamed").sum())
    print("\nSample rows:")
    print(df.head())


def main():
    print("Loading raw OSM GeoJSON...")
    raw = load_geojson(RAW_FILE)
    print("Raw features:", len(raw["features"]))

    print("\nCleaning and filtering...")
    df = clean_features(raw)

    run_sanity_checks(df)

    df.to_csv(OUTPUT_FILE, index=False, encoding="utf-8")
    print(f"\nSaved: {OUTPUT_FILE}")


if __name__ == "__main__":
    main()