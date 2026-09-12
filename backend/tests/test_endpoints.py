import pytest
from fastapi.testclient import TestClient
from backend.app.main import app

client = TestClient(app)


def test_health():
    resp = client.get("/health")
    assert resp.status_code == 200
    assert resp.json()["status"] == "healthy"


def test_categories():
    resp = client.get("/api/v1/categories")
    assert resp.status_code == 200
    assert len(resp.json()) >= 5


def test_locations():
    resp = client.get("/api/v1/locations")
    assert resp.status_code == 200
    assert len(resp.json()) > 0


def test_locations_search_by_name():
    resp = client.get("/api/v1/locations?q=Kamar")
    assert resp.status_code == 200
    items = resp.json()
    assert len(items) >= 1
    assert items[0]["name"] == "Kamar"
    assert items[0]["id"] == 123579
    assert items[0]["population"] == 7031


def test_locations_search_by_code():
    resp = client.get("/api/v1/locations?q=123579")
    assert resp.status_code == 200
    items = resp.json()
    assert len(items) >= 1
    assert items[0]["name"] == "Kamar"
    assert items[0]["id"] == 123579


def test_locations_search_partial():
    resp = client.get("/api/v1/locations?q=Kam")
    assert resp.status_code == 200
    items = resp.json()
    assert len(items) >= 1
    assert any(v["name"] == "Kamar" for v in items)


def test_locations_search_no_match():
    resp = client.get("/api/v1/locations?q=FakeVillageXYZ")
    assert resp.status_code == 200
    assert resp.json() == []


def test_resolve_location():
    resp = client.post("/api/v1/locations/resolve", json={"query": "Kamar"})
    assert resp.status_code == 200
    data = resp.json()
    assert data["matched"] is True
    assert data["village"]["name"] == "Kamar"


def test_schemes_and_emi():
    resp = client.get("/api/v1/schemes")
    assert resp.status_code == 200
    assert len(resp.json()) >= 2

    emi_resp = client.post("/api/v1/schemes/calculate-emi", json={
        "loan_amount": 900000.0,
        "interest_rate": 8.0,
        "tenure_months": 84,
        "moratorium_months": 6
    })
    assert emi_resp.status_code == 200
    assert emi_resp.json()["monthly_emi"] > 0


def test_insights():
    resp = client.get("/api/v1/insights/Kamar")
    assert resp.status_code == 200
    data = resp.json()
    assert "categories" in data
    assert len(data["categories"]) > 0


def test_assess():
    resp = client.post("/api/v1/assess", json={
        "location": "Kamar",
        "category": "Dairy",
        "capital": 100000.0,
        "idea": "Dairy milk collection unit"
    })
    assert resp.status_code == 200
    data = resp.json()
    assert "fitScore" in data
    assert "confidence" in data
    assert "recommendation" in data
    assert data["financial"]["project_cost"] == 1000000.0
    assert data["financial"]["max_loan_amount"] == 900000.0
    assert data["scheme"]["name"] == "Term Loan Scheme"
