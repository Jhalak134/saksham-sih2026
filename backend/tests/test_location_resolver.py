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
