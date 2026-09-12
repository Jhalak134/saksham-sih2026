"""
test_competitor_catchment.py

Tests for competitor catchment counting, haversine distance, category filtering,
and village spatial differentiation in SAKSHAM.
"""

import pytest
from backend.app.db.session import SessionLocal
from backend.app.db import models
from backend.app.db.queries import (
    haversine_distance_km,
    count_competitors_in_catchment,
    DEFAULT_CATCHMENT_RADIUS_KM,
)


def test_haversine_distance_zero():
    """Distance from a point to itself is 0."""
    dist = haversine_distance_km(27.5, 77.5, 27.5, 77.5)
    assert dist == pytest.approx(0.0, abs=1e-6)


def test_haversine_distance_symmetry():
    """Distance is symmetric regardless of order."""
    d1 = haversine_distance_km(27.4925, 77.6737, 27.6364, 77.7124)
    d2 = haversine_distance_km(27.6364, 77.7124, 27.4925, 77.6737)
    assert d1 == pytest.approx(d2, rel=1e-5)
    # Mathura to Mat centroid is approx 16.4 km
    assert 15.0 < d1 < 18.0


def test_count_competitors_nonexistent_village():
    """Nonexistent village ID returns 0."""
    db = SessionLocal()
    try:
        count = count_competitors_in_catchment(db, village_id=99999999)
        assert count == 0
    finally:
        db.close()


def test_count_competitors_invalid_radius():
    """Non-positive radius returns 0."""
    db = SessionLocal()
    try:
        count = count_competitors_in_catchment(db, village_id=123579, radius_km=0.0)
        assert count == 0
        count_neg = count_competitors_in_catchment(db, village_id=123579, radius_km=-5.0)
        assert count_neg == 0
    finally:
        db.close()


def test_count_competitors_village_without_coords():
    """Village with null coordinates falls back to village_id match."""
    db = SessionLocal()
    try:
        # Create a mock village with no coords
        v = models.Village(
            id=888801,
            block_id=1,
            name="NoCoordsVillage",
            latitude=None,
            longitude=None,
            population=500,
        )
        db.add(v)
        b1 = models.Business(
            id=777701,
            village_id=888801,
            category_id=1,
            name="Mock Dairy Biz",
            latitude=None,
            longitude=None,
            source="Test",
        )
        b2 = models.Business(
            id=777702,
            village_id=888801,
            category_id=2,
            name="Mock Retail Biz",
            latitude=None,
            longitude=None,
            source="Test",
        )
        db.add(b1)
        db.add(b2)
        db.commit()

        # Count all
        c_all = count_competitors_in_catchment(db, village_id=888801, category_id=None)
        assert c_all == 2

        # Count category 1
        c_cat1 = count_competitors_in_catchment(db, village_id=888801, category_id=1)
        assert c_cat1 == 1

        # Count category 3 (none)
        c_cat3 = count_competitors_in_catchment(db, village_id=888801, category_id=3)
        assert c_cat3 == 0
    finally:
        # Clean up test rows
        db.query(models.Business).filter(models.Business.id.in_([777701, 777702])).delete(synchronize_session=False)
        db.query(models.Village).filter(models.Village.id == 888801).delete(synchronize_session=False)
        db.commit()
        db.close()


def test_count_competitors_spatial_catchment_and_category_filter():
    """Tests circular catchment distance calculation and category filtering."""
    db = SessionLocal()
    try:
        # Village at (27.5000, 77.5000)
        v = models.Village(
            id=888802,
            block_id=1,
            name="SpatialTestVillage",
            latitude=27.5000,
            longitude=77.5000,
            population=2000,
        )
        db.add(v)

        # Business 1: ~3 km away (lat + 0.027), category=1
        b_near_cat1 = models.Business(
            id=777711,
            village_id=888802,
            category_id=1,
            name="Near Dairy",
            latitude=27.5270,
            longitude=77.5000,
            source="Test",
        )
        # Business 2: ~3 km away (lat + 0.027), category=2
        b_near_cat2 = models.Business(
            id=777712,
            village_id=888802,
            category_id=2,
            name="Near Retail",
            latitude=27.5270,
            longitude=77.5000,
            source="Test",
        )
        # Business 3: ~15 km away (lat + 0.135), category=1 (outside 10km radius)
        b_far_cat1 = models.Business(
            id=777713,
            village_id=888802,
            category_id=1,
            name="Far Dairy",
            latitude=27.6350,
            longitude=77.5000,
            source="Test",
        )
        # Business 4: ~50 km away (far outside bounding box)
        b_very_far = models.Business(
            id=777714,
            village_id=888802,
            category_id=1,
            name="Very Far Dairy",
            latitude=28.0000,
            longitude=77.5000,
            source="Test",
        )

        db.add_all([b_near_cat1, b_near_cat2, b_far_cat1, b_very_far])
        db.commit()

        # Within 10 km, all categories: b_near_cat1 and b_near_cat2 = 2
        cnt_10km_all = count_competitors_in_catchment(db, village_id=888802, category_id=None, radius_km=10.0)
        assert cnt_10km_all == 2

        # Within 10 km, category 1 only: b_near_cat1 = 1
        cnt_10km_cat1 = count_competitors_in_catchment(db, village_id=888802, category_id=1, radius_km=10.0)
        assert cnt_10km_cat1 == 1

        # Within 10 km, category 2 only: b_near_cat2 = 1
        cnt_10km_cat2 = count_competitors_in_catchment(db, village_id=888802, category_id=2, radius_km=10.0)
        assert cnt_10km_cat2 == 1

        # Within 10 km, category 3 only (none): 0
        cnt_10km_cat3 = count_competitors_in_catchment(db, village_id=888802, category_id=3, radius_km=10.0)
        assert cnt_10km_cat3 == 0

        # Within 20 km, category 1: b_near_cat1 and b_far_cat1 = 2
        cnt_20km_cat1 = count_competitors_in_catchment(db, village_id=888802, category_id=1, radius_km=20.0)
        assert cnt_20km_cat1 == 2

        # Within 2 km (smaller than 3km distance): 0
        cnt_2km = count_competitors_in_catchment(db, village_id=888802, category_id=1, radius_km=2.0)
        assert cnt_2km == 0
    finally:
        db.query(models.Business).filter(models.Business.id.in_([777711, 777712, 777713, 777714])).delete(synchronize_session=False)
        db.query(models.Village).filter(models.Village.id == 888802).delete(synchronize_session=False)
        db.commit()
        db.close()


def test_spatial_differentiation_between_villages():
    """Different village locations receive different competitor counts."""
    db = SessionLocal()
    try:
        # Village A at (27.5000, 77.5000)
        v_a = models.Village(
            id=888803,
            block_id=1,
            name="VillageA",
            latitude=27.5000,
            longitude=77.5000,
            population=1000,
        )
        # Village B at (27.8000, 77.5000) (~33 km away)
        v_b = models.Village(
            id=888804,
            block_id=1,
            name="VillageB",
            latitude=27.8000,
            longitude=77.5000,
            population=1000,
        )
        db.add_all([v_a, v_b])

        # Business near Village A only (~2 km from A, ~31 km from B)
        b_near_a = models.Business(
            id=777721,
            village_id=888803,
            category_id=2,
            name="Retail Near A",
            latitude=27.5180,
            longitude=77.5000,
            source="Test",
        )
        db.add(b_near_a)
        db.commit()

        count_a = count_competitors_in_catchment(db, village_id=888803, category_id=2, radius_km=DEFAULT_CATCHMENT_RADIUS_KM)
        count_b = count_competitors_in_catchment(db, village_id=888804, category_id=2, radius_km=DEFAULT_CATCHMENT_RADIUS_KM)

        assert count_a == 1
        assert count_b == 0
        assert count_a != count_b
    finally:
        db.query(models.Business).filter(models.Business.id == 777721).delete(synchronize_session=False)
        db.query(models.Village).filter(models.Village.id.in_([888803, 888804])).delete(synchronize_session=False)
        db.commit()
        db.close()


def test_bounding_box_corner_point_filtered_by_haversine():
    """Point inside square bounding box but outside circular radius is excluded."""
    db = SessionLocal()
    try:
        v = models.Village(
            id=888805,
            block_id=1,
            name="CornerTestVillage",
            latitude=27.5000,
            longitude=77.5000,
            population=1000,
        )
        db.add(v)
        # 10 km bounding box: lat_deg = 10/111 = ~0.090, lon_deg = ~0.101
        # Place business at (27.57, 77.58) which is inside bounding box:
        # lat diff = 0.07, lon diff = 0.08
        # Haversine distance is sqrt((0.07*111)^2 + (0.08*98.5)^2) = sqrt(60.4 + 62.1) = ~11.07 km > 10 km
        b_corner = models.Business(
            id=777731,
            village_id=888805,
            category_id=1,
            name="Corner Dairy Biz",
            latitude=27.5700,
            longitude=77.5800,
            source="Test",
        )
        db.add(b_corner)
        db.commit()

        # At 10 km radius: outside circular catchment
        cnt = count_competitors_in_catchment(db, village_id=888805, category_id=1, radius_km=10.0)
        assert cnt == 0

        # At 15 km radius: inside circular catchment
        cnt_15 = count_competitors_in_catchment(db, village_id=888805, category_id=1, radius_km=15.0)
        assert cnt_15 == 1
    finally:
        db.query(models.Business).filter(models.Business.id == 777731).delete(synchronize_session=False)
        db.query(models.Village).filter(models.Village.id == 888805).delete(synchronize_session=False)
        db.commit()
        db.close()
