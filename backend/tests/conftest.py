"""conftest.py

Shared pytest fixtures and test-only database configuration for backend tests.
Uses SQLite for hermetic offline testing without external database dependencies.
"""

import os
import pytest

import tempfile

test_db = os.path.join(tempfile.gettempdir(), "test_saksham.db").replace("\\", "/")
if os.path.exists(test_db):
    try:
        os.remove(test_db)
    except OSError:
        pass
os.environ["DATABASE_URL"] = f"sqlite:///{test_db}"
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
        for v_data in [
            {"id": 123579, "block_id": 1, "name": "Kamar", "population": 7031, "household_count": 1153, "literacy_rate": 53.6},
            {"id": 123580, "block_id": 1, "name": "Barsana Rural", "population": 5200, "household_count": 850, "literacy_rate": 61.2},
            {"id": 123581, "block_id": 1, "name": "Farah Dehat", "population": 6100, "household_count": 920, "literacy_rate": 64.5},
            {"id": 124296, "block_id": 1, "name": "Vrindaban Bangar", "population": 951, "household_count": 203, "literacy_rate": 80.2},
        ]:
            if not db.query(models.Village).filter(models.Village.id == v_data["id"]).first():
                db.add(models.Village(**v_data))
        db.commit()

        # Seed sample businesses
        if not db.query(models.Business).first():
            db.add(models.Business(id=1, village_id=123579, category_id=2, name="Sharma General Store"))
            db.add(models.Business(id=2, village_id=123579, category_id=2, name="Verma Kirana & Provisions"))
            db.add(models.Business(id=3, village_id=123580, category_id=4, name="Braj Agro Food Processing"))
            db.add(models.Business(id=4, village_id=123581, category_id=1, name="Kamar Dairy Cooperative"))
            db.commit()
    finally:
        db.close()
    yield
