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


def test_google_auth():
    resp = client.post("/api/v1/auth/google", json={
        "email": "rural.entrepreneur@gmail.com",
        "name": "Ramesh Kumar",
        "picture": "https://lh3.googleusercontent.com/a/default",
        "google_id": "1086921631486-user",
    })
    assert resp.status_code == 200
    data = resp.json()
    assert data["phone_or_email"] == "rural.entrepreneur@gmail.com"
    assert data["name"] == "Ramesh Kumar"
    assert data["auth_provider"] == "google"

    # Profile lookup works with the Google email
    get_resp = client.get("/api/v1/auth/profile/rural.entrepreneur@gmail.com")
    assert get_resp.status_code == 200
    assert get_resp.json()["phone_or_email"] == "rural.entrepreneur@gmail.com"

