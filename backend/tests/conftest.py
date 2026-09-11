"""conftest.py

Shared pytest fixtures and test-only database configuration for backend tests.
Uses SQLite for hermetic offline testing without external database dependencies.
"""

import os
import pytest

# Ensure test DATABASE_URL is set before importing app modules
os.environ.setdefault("DATABASE_URL", "sqlite:////tmp/test_saksham.db")
os.environ.setdefault("AI_SERVICE_URL", "http://localhost:8001")
os.environ.setdefault("AI_REQUEST_TIMEOUT", "5.0")
os.environ.setdefault("AI_DEFAULT_TOP_K", "5")

from backend.app.db.session import engine, SessionLocal
from backend.app.db import models


@pytest.fixture(scope="session", autouse=True)
def setup_test_database():
    """Create tables and seed minimal test data for testing."""
    models.Base.metadata.create_all(bind=engine)
    db = SessionLocal()
    try:
        # Seed categories if not present
        if not db.query(models.BusinessCategory).first():
            db.add(models.BusinessCategory(id=1, name="Dairy", icon="milk", is_seasonal=False))
            db.add(models.BusinessCategory(id=2, name="Retail", icon="store", is_seasonal=False))
            db.add(models.BusinessCategory(id=3, name="Textiles", icon="shirt", is_seasonal=False))
            db.add(models.BusinessCategory(id=4, name="Food Processing", icon="utensils", is_seasonal=True))
            db.add(models.BusinessCategory(id=5, name="Agriculture", icon="leaf", is_seasonal=True))
            db.commit()

        # Seed schemes if not present
        if not db.query(models.Scheme).first():
            db.add(models.Scheme(
                id=1,
                name="Micro Finance Scheme",
                max_project_cost=140000.0,
                max_loan_amount=125000.0,
                interest_rate=6.5,
                tenure_months=36,
                moratorium_months=3,
            ))
            db.add(models.Scheme(
                id=2,
                name="Term Loan Scheme",
                max_project_cost=5000000.0,
                max_loan_amount=4500000.0,
                interest_rate=8.0,
                tenure_months=84,
                moratorium_months=6,
            ))
            db.commit()

        # Seed hierarchy
        if not db.query(models.State).first():
            db.add(models.State(id=1, name="Uttar Pradesh", code="UP"))
            db.commit()
        if not db.query(models.District).first():
            db.add(models.District(id=1, state_id=1, name="Mathura"))
            db.commit()
        if not db.query(models.Block).first():
            db.add(models.Block(id=1, district_id=1, name="Chhata"))
            db.commit()
        if not db.query(models.Village).first():
            db.add(models.Village(
                id=123579,
                block_id=1,
                name="Kamar",
                population=7031,
                household_count=1153,
                literacy_rate=53.6,
            ))
            db.commit()
    finally:
        db.close()
    yield
