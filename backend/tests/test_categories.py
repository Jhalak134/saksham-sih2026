"""
test_categories.py

Tests for /api/v1/categories and /api/v1/categories/{category_id} endpoints.
Verifies:
- List categories endpoint returns all available business categories.
- Category details endpoint filters businesses from database:
  SELECT * FROM businesses WHERE category_id = ?
- Both numeric IDs (e.g. 1, 3, 5) and string slugs (e.g. textiles, retail, dairy, food) resolve properly.
- Feasible clusters, demand trend, benchmark metrics, and schemes are returned.
"""

import pytest
from fastapi.testclient import TestClient
from backend.app.main import app

client = TestClient(app)


def test_list_categories():
    resp = client.get("/api/v1/categories")
    assert resp.status_code == 200
    cats = resp.json()
    assert isinstance(cats, list)
    assert len(cats) >= 5
    first = cats[0]
    assert "id" in first
    assert "name" in first
    assert "is_seasonal" in first


def test_get_category_by_numeric_id():
    resp = client.get("/api/v1/categories/1")
    assert resp.status_code == 200
    data = resp.json()
    assert data["numeric_id"] == 1
    assert "demand_trend" in data
    assert "feasible_locations_count" in data
    assert "total_businesses" in data
    assert "sample_businesses" in data
    assert "applicable_schemes" in data
    assert isinstance(data["sample_businesses"], list)


def test_get_category_by_slug_dairy():
    resp = client.get("/api/v1/categories/dairy?location=Mathura")
    assert resp.status_code == 200
    data = resp.json()
    assert data["slug"] == "dairy"
    assert "Dairy" in data["name"]
    assert data["feasible_locations_count"] > 0
    assert data["trend_percent"] > 0
    assert len(data["applicable_schemes"]) > 0


def test_get_category_retail_with_db_businesses():
    # Retail / Grocery in DB has businesses mapped
    resp = client.get("/api/v1/categories/retail?location=Mathura")
    assert resp.status_code == 200
    data = resp.json()
    assert data["slug"] == "retail"
    assert data["total_businesses"] >= 1
    assert len(data["sample_businesses"]) > 0
    first_biz = data["sample_businesses"][0]
    assert "id" in first_biz
    assert "name" in first_biz
    assert "village_name" in first_biz


def test_get_category_food_with_db_businesses():
    # Food processing in DB has businesses mapped
    resp = client.get("/api/v1/categories/food?location=Mathura")
    assert resp.status_code == 200
    data = resp.json()
    assert data["slug"] == "food"
    assert data["total_businesses"] >= 1
    assert len(data["sample_businesses"]) > 0


def test_get_category_textiles():
    resp = client.get("/api/v1/categories/textiles?location=Mathura")
    assert resp.status_code == 200
    data = resp.json()
    assert data["slug"] == "textiles"
    assert "Textiles" in data["name"]
    assert data["feasible_locations_count"] > 0


def test_legacy_route_alias():
    resp = client.get("/api/categories/retail")
    assert resp.status_code == 200
    data = resp.json()
    assert data["slug"] == "retail"
