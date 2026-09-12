import uuid
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
    test_email = f"user_{uuid.uuid4().hex[:8]}@gmail.com"
    resp = client.post("/api/v1/auth/google", json={
        "email": test_email,
        "name": "Ramesh Kumar",
        "picture": "https://lh3.googleusercontent.com/a/default",
        "google_id": "1086921631486-user",
    })
    assert resp.status_code == 200
    data = resp.json()
    assert data["phone_or_email"] == test_email
    assert data["name"] == "Ramesh Kumar"
    assert data["auth_provider"] == "google"
    assert data["is_new_user"] is True

    # Subsequent auth reports is_new_user False
    resp2 = client.post("/api/v1/auth/google", json={
        "email": test_email,
    })
    assert resp2.status_code == 200
    assert resp2.json()["is_new_user"] is False

    # Profile lookup works with the Google email
    get_resp = client.get(f"/api/v1/auth/profile/{test_email}")
    assert get_resp.status_code == 200
    assert get_resp.json()["phone_or_email"] == test_email

    # User profile location update works
    update_resp = client.post("/api/v1/auth/profile", json={
        "phone_or_email": test_email,
        "home_location": "Mathura",
    })
    assert update_resp.status_code == 200
    assert update_resp.json()["home_location"] == "Mathura"


