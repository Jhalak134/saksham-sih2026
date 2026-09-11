"""
compute_confidence.py

Computes and writes a data_confidence level ('High' / 'Medium' / 'Low')
for every village in the database.

Run from the repo root AFTER load_to_postgres.py has been run:
    python -m backend.data_pipeline.compute_confidence

Re-runnable — updates existing rows in place, does not create duplicates.

=== Confidence Rules ===

We have two data signals per village:

  1. Census signal   — population > 0 (village is inhabited and counted)
  2. OSM signal      — at least one business exists in the village's block
                       (block-level accuracy, see OSM limitation note in
                        load_to_postgres.py)

Confidence levels:

  High   — Census populated (pop > 0) AND block has OSM business data
            Interpretation: we have both demographic context AND mapped
            local competition/activity. Most reliable for feasibility scoring.

  Medium — Census populated BUT block has no OSM coverage,
           OR village is uninhabited (pop = 0) but block has OSM data.
           Interpretation: one signal is missing. Score with caution.

  Low    — population = 0 AND block has no OSM businesses.
            Interpretation: either uninhabited/unmapped or a revenue-only
            village. Feasibility engine should surface a clear warning.
"""

import os
from dotenv import load_dotenv

load_dotenv()  # searches from CWD upward — run from repo root

from sqlalchemy import func
from backend.app.db.session import SessionLocal
from backend.app.db.models import Village, Block, Business


def compute_osm_coverage_by_block(session) -> dict[int, bool]:
    """
    Returns {block_id: True} for every block that has at least one
    business row in the businesses table.
    """
    rows = (
        session.query(Business.village_id, Village.block_id)
        .join(Village, Business.village_id == Village.id)
        .all()
    )
    blocks_with_osm = set()
    for _, block_id in rows:
        blocks_with_osm.add(block_id)
    return blocks_with_osm


def assign_confidence(population: int, block_has_osm: bool) -> str:
    """
    Pure function — no DB access. Deterministic given the two signals.
    Easy to unit-test independently.
    """
    has_census = population is not None and population > 0
    if has_census and block_has_osm:
        return "High"
    elif has_census or block_has_osm:
        return "Medium"
    else:
        return "Low"


def run(session) -> dict[str, int]:
    """
    Computes and writes confidence levels for all villages.
    Returns a summary dict with counts per level.
    """
    blocks_with_osm = compute_osm_coverage_by_block(session)
    print(f"Blocks with OSM data: {len(blocks_with_osm)} / {session.query(Block).count()}")

    villages = session.query(Village).all()
    counts = {"High": 0, "Medium": 0, "Low": 0}

    for i, v in enumerate(villages, start=1):
        block_has_osm = v.block_id in blocks_with_osm
        level = assign_confidence(v.population, block_has_osm)
        v.data_confidence = level
        counts[level] += 1

        if i % 100 == 0:
            session.commit()
            print(f"  ...committed batch through village {i}")

    session.commit()
    return counts


def main():
    session = SessionLocal()
    try:
        print("Computing confidence levels for all villages...")
        counts = run(session)
        total = sum(counts.values())
        print(f"\nDone. {total} villages updated:")
        print(f"  🟢 High   : {counts['High']:>4}  ({100*counts['High']//total}%)")
        print(f"  🟡 Medium : {counts['Medium']:>4}  ({100*counts['Medium']//total}%)")
        print(f"  🔴 Low    : {counts['Low']:>4}  ({100*counts['Low']//total}%)")
    finally:
        session.close()


if __name__ == "__main__":
    main()
