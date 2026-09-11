import pytest
from fastapi.testclient import TestClient
from backend.app.main import app

client = TestClient(app)


def test_user_profile():
    resp = client.post("/api/v1/auth/profile", json={
        "phone_or_email": "9876543210",
        "home_location": "Kamar",
        "default_capital": 100000.0,
        "preferred_language": "en"
    })
    assert resp.status_code == 200
    data = resp.json()
    assert data["phone_or_email"] == "9876543210"

    get_resp = client.get("/api/v1/auth/profile/9876543210")
    assert get_resp.status_code == 200
    assert get_resp.json()["home_location"] == "Kamar"
