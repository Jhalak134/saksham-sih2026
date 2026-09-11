"""
test_auth_flow.py

End-to-end backend integration tests for the full authentication flow.
Uses an isolated in-memory SQLite database via dependency overrides.
"""

import pytest
from fastapi.testclient import TestClient
from sqlalchemy import create_engine, event
from sqlalchemy.orm import sessionmaker, Session
from sqlalchemy.pool import StaticPool

from backend.app.main import app
from backend.app.db.session import Base, get_db
from backend.app.db.models import User, State, District, Block, Village, BusinessCategory, Assessment

# ══════════════════════════════════════════════════════════════════════════════
# Fixtures
# ══════════════════════════════════════════════════════════════════════════════

@pytest.fixture(name="sqlite_engine")
def fixture_sqlite_engine():
    engine = create_engine(
        "sqlite:///:memory:",
        connect_args={"check_same_thread": False},
        poolclass=StaticPool,
    )

    @event.listens_for(engine, "connect")
    def set_sqlite_pragma(dbapi_connection, connection_record):
        cursor = dbapi_connection.cursor()
        cursor.execute("PRAGMA foreign_keys=ON")
        cursor.close()

    Base.metadata.create_all(engine)
    yield engine
    Base.metadata.drop_all(engine)
    engine.dispose()


@pytest.fixture(name="db_session")
def fixture_db_session(sqlite_engine):
    TestSession = sessionmaker(bind=sqlite_engine, autoflush=False, autocommit=False)
    session = TestSession()
    try:
        yield session
    finally:
        session.rollback()
        session.close()


@pytest.fixture(name="client")
def fixture_client(db_session):
    # Override the DB dependency
    def override_get_db():
        yield db_session

    app.dependency_overrides[get_db] = override_get_db
    with TestClient(app) as c:
        yield c
    app.dependency_overrides.clear()


@pytest.fixture(name="setup_geo")
def fixture_setup_geo(db_session):
    """Creates minimal geography and category required for creating an assessment."""
    state = State(name="TestState", code="TS")
    db_session.add(state)
    db_session.flush()
    district = District(state_id=state.id, name="TestDistrict")
    db_session.add(district)
    db_session.flush()
    block = Block(district_id=district.id, name="TestBlock")
    db_session.add(block)
    db_session.flush()
    village = Village(block_id=block.id, name="TestVillage")
    db_session.add(village)
    db_session.flush()
    category = BusinessCategory(name="TestCategory")
    db_session.add(category)
    db_session.commit()
    
    return {"village_id": village.id, "category_id": category.id}


# ══════════════════════════════════════════════════════════════════════════════
# Integration Tests
# ══════════════════════════════════════════════════════════════════════════════

def test_full_auth_and_reports_flow(client: TestClient, db_session: Session, setup_geo: dict):
    # 1. Signup a new user
    signup_data = {
        "phone_or_email": "integration@example.com",
        "password": "StrongPassword123!"
    }
    resp = client.post("/auth/signup", json=signup_data)
    assert resp.status_code == 201
    token_data = resp.json()
    assert "access_token" in token_data
    assert token_data["token_type"] == "bearer"
    
    # Verify response does not leak password hash
    user_resp = token_data["user"]
    assert "password_hash" not in user_resp
    assert user_resp["phone_or_email"] == "integration@example.com"

    # 2. Verify the password is hashed and never stored/returned as plaintext
    # Check the database directly
    db_user = db_session.query(User).filter(User.phone_or_email == "integration@example.com").first()
    assert db_user is not None
    assert db_user.password_hash is not None
    assert db_user.password_hash != "StrongPassword123!"

    # 12. Verify duplicate signup fails
    dup_resp = client.post("/auth/signup", json=signup_data)
    assert dup_resp.status_code == 409

    # 11. Verify wrong-password login fails
    wrong_login_data = {
        "phone_or_email": "integration@example.com",
        "password": "WrongPassword!"
    }
    wrong_resp = client.post("/auth/login", json=wrong_login_data)
    assert wrong_resp.status_code == 401

    # 3. Login with the newly created credentials
    login_data = {
        "phone_or_email": "integration@example.com",
        "password": "StrongPassword123!"
    }
    login_resp = client.post("/auth/login", json=login_data)
    assert login_resp.status_code == 200
    access_token = login_resp.json()["access_token"]

    # 4 & 5. Verify authenticated session/token behavior & call /auth/me
    headers = {"Authorization": f"Bearer {access_token}"}
    me_resp = client.get("/auth/me", headers=headers)
    assert me_resp.status_code == 200
    assert me_resp.json()["phone_or_email"] == "integration@example.com"

    # 6. Create/persist an assessment/report for that user
    # Using DB session directly since there is no POST /assessments yet
    assessment = Assessment(
        user_id=db_user.id,
        village_id=setup_geo["village_id"],
        category_id=setup_geo["category_id"],
        capital_input=50000,
        fit_score=85.0,
        confidence_level="High",
        project_cost=60000,
        max_loan_amount=50000,
        recommended_project_size=50000,
        status="Completed"
    )
    db_session.add(assessment)
    db_session.commit()
    db_session.refresh(assessment)

    # 7. Retrieve My Reports
    reports_resp = client.get("/assess/my-reports", headers=headers)
    assert reports_resp.status_code == 200
    reports_data = reports_resp.json()
    assert "reports" in reports_data
    
    # 8. Confirm the created report is returned for that user
    reports = reports_data["reports"]
    assert len(reports) == 1
    assert reports[0]["id"] == f"REP-{assessment.id:04d}"
    assert reports[0]["fitScore"] == 85.0
    assert reports[0]["status"] == "Completed"
    assert reports[0]["location"] == "TestVillage"
    assert reports[0]["category"] == "TestCategory"

    # 9. Verify another user cannot access that report
    # Create User 2
    client.post("/auth/signup", json={"phone_or_email": "user2@example.com", "password": "User2Pass!"})
    login2_resp = client.post("/auth/login", json={"phone_or_email": "user2@example.com", "password": "User2Pass!"})
    token2 = login2_resp.json()["access_token"]
    headers2 = {"Authorization": f"Bearer {token2}"}
    
    # User 2 fetching their reports should see empty
    reports2_resp = client.get("/assess/my-reports", headers=headers2)
    assert reports2_resp.status_code == 200
    assert len(reports2_resp.json()["reports"]) == 0

    # 10. Verify logout/invalidated authentication no longer accesses protected endpoints
    # To test invalidation properly, we could just pass no token or an invalid token
    no_auth_resp = client.get("/assess/my-reports")
    assert no_auth_resp.status_code == 401
    
    bad_auth_resp = client.get("/assess/my-reports", headers={"Authorization": "Bearer invalid.token.string"})
    assert bad_auth_resp.status_code == 401


def test_legacy_user_login_returns_generic_401(client: TestClient, db_session: Session):
    # Create a legacy user with a null password_hash
    legacy_user = User(
        phone_or_email="legacy@example.com",
        password_hash=None
    )
    db_session.add(legacy_user)
    db_session.commit()

    # Attempt to log in as the legacy user
    login_data = {
        "phone_or_email": "legacy@example.com",
        "password": "SomePassword"
    }
    resp = client.post("/auth/login", json=login_data)
    
    # Assert we get a generic 401 response, not a 500 or special message
    assert resp.status_code == 401
    assert resp.json()["detail"] == "Invalid credentials."
