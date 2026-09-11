import csv
import os
import sys
import pandas as pd

"""
load_to_postgres.py

Loads the cleaned CSVs from cleaned/ into the live database.

Run from the repo root (not from inside data_pipeline/), so the
`backend.app.db` imports resolve correctly:
    python -m backend.data_pipeline.load_to_postgres
"""

from backend.app.db.session import SessionLocal, engine
from backend.app.db.models import (
    Base,
    State,
    District,
    Block,
    BusinessCategory,
    Village,
    Business,
    Scheme,
)

# The 4 Mathura blocks and their Census Subdistt codes — same codes used
# in clean_census.py's BLOCK_COORDINATES.
MATHURA_BLOCKS = {
    761: "Chhata",
    762: "Mat",
    763: "Mahavan",
    764: "Mathura",
}

# From docs/data_requirements.md, section 8 — 12 team agreed categories + core standard categories
BUSINESS_CATEGORIES = [
    ("Dairy", True),
    ("Poultry", True),
    ("Grocery/Retail", False),
    ("Vegetable Trading", True),
    ("Food Processing", True),
    ("Tailoring", False),
    ("Handicrafts", False),
    ("Mobile Repair", False),
    ("Agri-input Store", True),
    ("Restaurant", False),
    ("Flour Mill", False),
    ("Dairy Product Processing", True),
    ("Retail", False),
    ("Textiles", False),
    ("Agriculture", True),
    ("Logistics", False),
    ("Education", False),
]

# Official schemes per SIH Problem Statement #91 / master_reference.md
OFFICIAL_SCHEMES = [
    {
        "name": "Micro Finance Scheme",
        "max_project_cost": 140000.0,
        "max_loan_amount": 125000.0,
        "interest_rate": 6.5,
        "tenure_months": 36,
        "moratorium_months": 3,
    },
    {
        "name": "Term Loan Scheme",
        "max_project_cost": 5000000.0,
        "max_loan_amount": 4500000.0,
        "interest_rate": 8.0,
        "tenure_months": 84,
        "moratorium_months": 6,
    },
]

BASE_DIR = os.path.abspath(os.path.join(os.path.dirname(__file__), "..", ".."))
CLEANED_DIR = os.path.join(os.path.dirname(__file__), "cleaned")
VILLAGES_CSV = os.path.join(CLEANED_DIR, "mathura_villages_clean.csv")
OSM_CSV = os.path.join(CLEANED_DIR, "mathura_osm_clean.csv")


def seed_state(session) -> State:
    """
    Returns the Uttar Pradesh State row, creating it if it doesn't exist
    yet. Checking first means re-running this script is safe — it won't
    create duplicate rows.
    """
    state = session.query(State).filter_by(code="UP").first()
    if state is None:
        state = State(id=9, name="Uttar Pradesh", code="UP")
        session.add(state)
        session.commit()
        print("Created state: Uttar Pradesh")
    else:
        print("State already exists: Uttar Pradesh")
    return state


def seed_district(session, state: State) -> District:
    """Returns the Mathura District row, creating it if needed."""
    district = session.query(District).filter_by(
        name="Mathura", state_id=state.id
    ).first()
    if district is None:
        district = District(id=145, name="Mathura", state_id=state.id)
        session.add(district)
        session.commit()
        print("Created district: Mathura")
    else:
        print("District already exists: Mathura")
    return district


def seed_blocks(session, district: District) -> dict[int, Block]:
    """
    Returns a mapping of {census_subdistt_code: Block row}, creating any
    missing blocks. This mapping is what lets us later say "this village's
    Subdistt code is 761, so its block_id is blocks_by_code[761].id".
    """
    blocks_by_code = {}
    for code, name in MATHURA_BLOCKS.items():
        block = session.query(Block).filter_by(
            name=name, district_id=district.id
        ).first()
        if block is None:
            block = Block(id=code, name=name, district_id=district.id)
            session.add(block)
            session.commit()
            print(f"Created block: {name}")
        else:
            print(f"Block already exists: {name}")
        blocks_by_code[code] = block
    return blocks_by_code


def seed_business_categories(session) -> None:
    """Creates the business categories if they don't already exist."""
    for name, is_seasonal in BUSINESS_CATEGORIES:
        category = session.query(BusinessCategory).filter_by(name=name).first()
        if category is None:
            category = BusinessCategory(name=name, is_seasonal=is_seasonal)
            session.add(category)
            print(f"Created category: {name}")
        else:
            print(f"Category already exists: {name}")
    session.commit()


def seed_schemes(session) -> None:
    """Creates official concessional credit schemes if they don't exist."""
    for s_idx, s in enumerate(OFFICIAL_SCHEMES, start=1):
        sch = session.query(Scheme).filter_by(name=s["name"]).first()
        if sch is None:
            sch = Scheme(
                id=s_idx,
                name=s["name"],
                max_project_cost=s["max_project_cost"],
                max_loan_amount=s["max_loan_amount"],
                interest_rate=s["interest_rate"],
                tenure_months=s["tenure_months"],
                moratorium_months=s["moratorium_months"],
            )
            session.add(sch)
            print(f"Created scheme: {s['name']}")
        else:
            print(f"Scheme already exists: {s['name']}")
    session.commit()


def seed_villages(session, blocks_by_code: dict[int, Block]) -> None:
    """
    Loads all 874 villages from mathura_villages_clean.csv into the
    villages table, linking each one to its block via the Subdistt code
    (same codes clean_census.py used to group blocks).
    """
    created = 0
    skipped = 0
    missing_block = 0

    csv_path = VILLAGES_CSV
    if not os.path.exists(csv_path):
        csv_path = "backend/data_pipeline/cleaned/mathura_villages_clean.csv"

    if not os.path.exists(csv_path):
        print(f"WARNING: Villages CSV not found at {csv_path}, skipping.")
        return

    with open(csv_path, newline="", encoding="utf-8") as f:
        reader = csv.DictReader(f)
        for i, row in enumerate(reader, start=1):
            subdistt_code = int(row["Subdistt"])
            block = blocks_by_code.get(subdistt_code)
            if block is None:
                print(f"WARNING: no block for Subdistt {subdistt_code} ({row['name']}), skipping")
                missing_block += 1
                continue

            v_code = int(row.get("village_code", row.get("Town/Village", 0)))
            existing = session.query(Village).filter(
                (Village.id == v_code) | ((Village.name == row["name"]) & (Village.block_id == block.id))
            ).first()
            if existing is not None:
                skipped += 1
                continue

            population = int(row["population_total"])
            literate = int(row["literate_total"])
            literacy_rate = round((literate / population) * 100, 2) if population > 0 else None

            village = Village(
                id=v_code if v_code > 0 else None,
                block_id=block.id,
                name=row["name"],
                latitude=float(row["latitude"]) if row.get("latitude") else None,
                longitude=float(row["longitude"]) if row.get("longitude") else None,
                population=population,
                household_count=int(row["households"]),
                literacy_rate=literacy_rate,
                data_source="Census 2011",
                data_year="2011",
            )
            session.add(village)
            created += 1

            if i % 50 == 0:
                session.commit()
                print(f"  ...committed batch through row {i}")

    session.commit()  # final partial batch
    print(f"Villages: {created} created, {skipped} already existed, {missing_block} had no matching block")


def haversine_km(lat1, lon1, lat2, lon2) -> float:
    """
    Straight-line distance in km between two lat/lon points.
    Good enough for "which village is this business closest to" —
    we don't need road-network precision for competitor mapping.
    """
    from math import radians, sin, cos, sqrt, atan2
    R = 6371.0
    dlat = radians(lat2 - lat1)
    dlon = radians(lon2 - lon1)
    a = sin(dlat / 2) ** 2 + cos(radians(lat1)) * cos(radians(lat2)) * sin(dlon / 2) ** 2
    return R * 2 * atan2(sqrt(a), sqrt(1 - a))


def find_nearest_village(lat: float, lon: float, villages_with_coords: list[Village]) -> Village:
    """Returns whichever village in the list is geographically closest."""
    nearest = None
    nearest_dist = None
    for v in villages_with_coords:
        d = haversine_km(lat, lon, v.latitude, v.longitude)
        if nearest_dist is None or d < nearest_dist:
            nearest = v
            nearest_dist = d
    return nearest


def seed_osm_businesses(session) -> None:
    """
    Loads OSM competitor businesses into the businesses table, assigning
    each one to its nearest village by coordinates.

    KNOWN LIMITATION: Village coordinates are block-centroids, not true
    per-village coordinates (Census 2011 doesn't provide village-level
    lat/long, and our OSM export has no 'place' nodes to fall back on —
    confirmed by direct investigation, not assumed). This means every
    business is correctly matched to its real block, but the specific
    village_id within that block is an arbitrary representative, not
    the business's true village. Downstream consumers (feasibility
    engine, /insights endpoint) should treat business-to-village
    linkage as block-level accuracy, not village-level, and reflect
    that in the confidence indicator shown to the user.
    """
    osm_path = OSM_CSV
    if not os.path.exists(osm_path):
        osm_path = "backend/data_pipeline/cleaned/mathura_osm_clean.csv"

    if not os.path.exists(osm_path):
        print(f"OSM file not found at {osm_path}, skipping.")
        return

    # Preload all villages that actually have coordinates — this is the
    # candidate list we search for "nearest" against, for every business.
    villages_with_coords = session.query(Village).filter(
        Village.latitude.isnot(None), Village.longitude.isnot(None)
    ).all()
    print(f"  {len(villages_with_coords)} villages available with coordinates for nearest-match")

    if not villages_with_coords:
        print("WARNING: no villages have coordinates — cannot place businesses. Skipping.")
        return

    retail_cat = session.query(BusinessCategory).filter(
        (BusinessCategory.name == "Retail") | (BusinessCategory.name == "Grocery/Retail")
    ).first()
    dairy_cat = session.query(BusinessCategory).filter(BusinessCategory.name == "Dairy").first()
    textile_cat = session.query(BusinessCategory).filter(
        (BusinessCategory.name == "Textiles") | (BusinessCategory.name == "Tailoring")
    ).first()
    food_cat = session.query(BusinessCategory).filter(BusinessCategory.name == "Food Processing").first()

    with open(osm_path, newline="", encoding="utf-8") as f:
        reader = csv.DictReader(f)
        count = 0
        skipped_no_coords = 0
        for row in reader:
            b_name = str(row["name"]).strip()
            if not b_name:
                continue
            existing = session.query(Business).filter_by(name=b_name).first()
            if existing is not None:
                continue

            if not row.get("latitude") or not row.get("longitude"):
                skipped_no_coords += 1
                continue

            b_lat = float(row["latitude"])
            b_lon = float(row["longitude"])
            nearest_village = find_nearest_village(b_lat, b_lon, villages_with_coords)

            subcat = str(row.get("subcategory", "")).lower()
            cat = retail_cat
            if "dairy" in subcat or "milk" in subcat:
                cat = dairy_cat
            elif "tailor" in subcat or "fabric" in subcat:
                cat = textile_cat
            elif "food" in subcat or "restaurant" in subcat or "sweet" in subcat:
                cat = food_cat

            biz = Business(
                village_id=nearest_village.id,
                category_id=cat.id if cat else None,
                name=b_name,
                latitude=b_lat,
                longitude=b_lon,
                source="OpenStreetMap",
            )
            session.add(biz)
            count += 1

            if count % 50 == 0:
                session.commit()
                print(f"  ...committed batch, {count} businesses so far")

        session.commit()
        print(f"OSM businesses: {count} loaded, {skipped_no_coords} skipped (missing coordinates).")


def main():
    Base.metadata.create_all(bind=engine)
    session = SessionLocal()
    try:
        print("Seeding state...")
        state = seed_state(session)

        print("\nSeeding district...")
        district = seed_district(session, state)

        print("\nSeeding blocks...")
        blocks_by_code = seed_blocks(session, district)

        print("\nSeeding business categories...")
        seed_business_categories(session)

        print("\nSeeding official schemes...")
        seed_schemes(session)

        print("\nSeeding villages...")
        seed_villages(session, blocks_by_code)

        print("\nSeeding OSM businesses...")
        seed_osm_businesses(session)

        print("\nDone seeding reference data.")
    finally:
        session.close()


if __name__ == "__main__":
    main()
