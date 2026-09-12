import pytest
from backend.app.db.session import SessionLocal
from backend.app.engines.location_resolver import resolve_location


def test_resolve_location_exact():
    db = SessionLocal()
    try:
        res = resolve_location(db, "Kamar")
        assert res["matched"] is True
        assert res["village"] is not None
        assert res["village"].name == "Kamar"
    finally:
        db.close()


def test_resolve_location_by_code():
    db = SessionLocal()
    try:
        res = resolve_location(db, "123579")
        assert res["matched"] is True
        assert res["village"].id == 123579
    finally:
        db.close()


def test_resolve_location_with_district_suffix():
    """Verify locations formatted as 'Village, District' resolve to the correct village."""
    db = SessionLocal()
    try:
        res_kamar = resolve_location(db, "Kamar, Mathura")
        assert res_kamar["matched"] is True
        assert res_kamar["village"].name == "Kamar"

        res_barsana = resolve_location(db, "Barsana, Mathura")
        assert res_barsana["matched"] is True
        assert "barsana" in res_barsana["village"].name.lower()

        res_farah = resolve_location(db, "Farah, Mathura")
        assert res_farah["matched"] is True
        assert "farah" in res_farah["village"].name.lower()
    finally:
        db.close()


def test_resolve_location_loc_v_prefix():
    """Verify frontend 'loc_v_{id}' identifiers resolve directly to the village."""
    db = SessionLocal()
    try:
        res = resolve_location(db, "loc_v_123579")
        assert res["matched"] is True
        assert res["village"].id == 123579
        assert res["village"].name == "Kamar"
    finally:
        db.close()


def test_resolve_vrindavan_transliteration():
    """Verify 'Vrindavan, Mathura' and 'loc_07' resolve to Vrindaban Bangar (124296)."""
    db = SessionLocal()
    try:
        res_v = resolve_location(db, "Vrindavan, Mathura")
        assert res_v["matched"] is True
        assert res_v["village"] is not None
        assert res_v["village"].id == 124296
        assert res_v["village"].name == "Vrindaban Bangar"

        res_loc07 = resolve_location(db, "loc_07")
        assert res_loc07["matched"] is True
        assert res_loc07["village"].id == 124296
    finally:
        db.close()


def test_mathura_reference_dataset_contains_874_villages():
    """Verify that the Mathura cleaned Census 2011 dataset contains exactly 874 villages."""
    import os, csv
    csv_path = "backend/data_pipeline/cleaned/mathura_villages_clean.csv"
    assert os.path.exists(csv_path)
    with open(csv_path, encoding="utf-8") as f:
        reader = list(csv.DictReader(f))
        assert len(reader) == 874


def test_search_villages_vrindavan_alias():
    """Verify search_villages finds Vrindaban Bangar when queried with Vrindavan."""
    from backend.app.db.queries import search_villages
    db = SessionLocal()
    try:
        results = search_villages(db, "Vrindavan", limit=10)
        assert len(results) >= 1
        assert any(v.id == 124296 for v in results)
    finally:
        db.close()



