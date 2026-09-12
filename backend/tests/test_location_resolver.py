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

