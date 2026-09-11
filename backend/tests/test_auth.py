"""
test_auth.py

Authentication tests for the SAKSHAM platform.

Structure:
  TestPasswordHashing   - pure unit tests, no DB, always run
  TestUserQueryLayer    - in-memory SQLite tests, no real Neon DB needed
  TestAssessmentOwnership - ownership enforcement, in-memory SQLite

Integration tests that touch the real Neon DB are skipped automatically
when DATABASE_URL is not set. Never put real credentials in this file.
"""

import pytest
from sqlalchemy import create_engine, event
from sqlalchemy.orm import sessionmaker, Session

from backend.app.auth import hash_password, verify_password


# ══════════════════════════════════════════════════════════════════════════════
# Fixtures — in-memory SQLite session (no real DB required)
# ══════════════════════════════════════════════════════════════════════════════

@pytest.fixture()
def sqlite_engine():
    """
    SQLite in-memory engine for query layer tests.
    Function-scoped: each test gets a fresh, empty DB.
    Does NOT touch Neon.
    """
    from backend.app.db.session import Base
    import backend.app.db.models  # noqa: F401 — register all models

    engine = create_engine(
        "sqlite:///:memory:",
        connect_args={"check_same_thread": False},
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


@pytest.fixture
def db(sqlite_engine):
    """Provide a fresh SQLAlchemy session per test, always rolled back."""
    TestSession = sessionmaker(bind=sqlite_engine, autoflush=False, autocommit=False)
    session = TestSession()
    try:
        yield session
    finally:
        session.rollback()
        session.close()


# ══════════════════════════════════════════════════════════════════════════════
# PART 1 — Password Hashing (pure, no DB)
# ══════════════════════════════════════════════════════════════════════════════

class TestPasswordHashing:
    """Pure unit tests for hash_password / verify_password. No DB required."""

    def test_hash_returns_string(self):
        result = hash_password("SecureP@ss1")
        assert isinstance(result, str)

    def test_hash_is_not_plaintext(self):
        plain = "SecureP@ss1"
        result = hash_password(plain)
        assert result != plain

    def test_hash_starts_with_bcrypt_prefix(self):
        result = hash_password("SecureP@ss1")
        assert result.startswith("$2b$") or result.startswith("$2a$"), (
            f"Expected bcrypt hash prefix, got: {result[:10]}"
        )

    def test_two_hashes_of_same_password_differ(self):
        """bcrypt adds a random salt — same password must produce different hashes."""
        h1 = hash_password("SecureP@ss1")
        h2 = hash_password("SecureP@ss1")
        assert h1 != h2, "bcrypt hashes must be salted (unique per call)"

    def test_verify_correct_password(self):
        plain = "CorrectHorseBattery"
        hashed = hash_password(plain)
        assert verify_password(plain, hashed) is True

    def test_verify_wrong_password(self):
        hashed = hash_password("CorrectPassword")
        assert verify_password("WrongPassword", hashed) is False

    def test_verify_empty_plain_returns_false(self):
        hashed = hash_password("ValidPassword")
        assert verify_password("", hashed) is False

    def test_verify_empty_hash_returns_false(self):
        assert verify_password("SomePassword", "") is False

    def test_verify_none_hash_returns_false(self):
        """Existing users have NULL password_hash — login must reject gracefully."""
        assert verify_password("SomePassword", None) is False

    def test_hash_empty_password_raises(self):
        with pytest.raises(ValueError):
            hash_password("")

    def test_hash_whitespace_only_raises(self):
        with pytest.raises(ValueError):
            hash_password("   ")


# ══════════════════════════════════════════════════════════════════════════════
# PART 2 — User Query Layer (in-memory SQLite)
# ══════════════════════════════════════════════════════════════════════════════

class TestUserQueryLayer:
    """Tests for get_user_by_identifier, create_user, get_user_by_id."""

    def test_get_user_by_identifier_missing(self, db):
        from backend.app.db.queries import get_user_by_identifier
        result = get_user_by_identifier(db, "nobody@example.com")
        assert result is None

    def test_create_user_success(self, db):
        from backend.app.db.queries import create_user
        hashed = hash_password("TestP@ss1")
        user = create_user(db, "new@example.com", hashed)
        assert user is not None
        assert user.id is not None
        assert user.phone_or_email == "new@example.com"
        assert user.password_hash == hashed
        # Must not expose plaintext
        assert user.password_hash != "TestP@ss1"

    def test_create_user_duplicate_returns_none(self, db):
        from backend.app.db.queries import create_user
        hashed = hash_password("TestP@ss1")
        user1 = create_user(db, "dup@example.com", hashed)
        assert user1 is not None
        user2 = create_user(db, "dup@example.com", hashed)
        assert user2 is None  # duplicate → caller returns 409

    def test_create_user_strips_whitespace(self, db):
        from backend.app.db.queries import create_user, get_user_by_identifier
        hashed = hash_password("TestP@ss1")
        user = create_user(db, "  spaced@example.com  ", hashed)
        assert user is not None
        found = get_user_by_identifier(db, "spaced@example.com")
        assert found is not None

    def test_get_user_by_id_found(self, db):
        from backend.app.db.queries import create_user, get_user_by_id
        hashed = hash_password("TestP@ss1")
        created = create_user(db, "byid@example.com", hashed)
        found = get_user_by_id(db, created.id)
        assert found is not None
        assert found.phone_or_email == "byid@example.com"

    def test_get_user_by_id_missing(self, db):
        from backend.app.db.queries import get_user_by_id
        result = get_user_by_id(db, 999999)
        assert result is None

    def test_password_hash_not_none_after_create(self, db):
        from backend.app.db.queries import create_user
        hashed = hash_password("RealPassword")
        user = create_user(db, "hashcheck@example.com", hashed)
        assert user.password_hash is not None

    def test_created_user_verify_password_works(self, db):
        """End-to-end: create → retrieve → verify."""
        from backend.app.db.queries import create_user, get_user_by_identifier
        plain = "E2ETestPassword!"
        hashed = hash_password(plain)
        create_user(db, "e2e@example.com", hashed)
        found = get_user_by_identifier(db, "e2e@example.com")
        assert found is not None
        assert verify_password(plain, found.password_hash) is True
        assert verify_password("WrongPassword", found.password_hash) is False


# ══════════════════════════════════════════════════════════════════════════════
# PART 3 — Assessment Ownership (in-memory SQLite)
# ══════════════════════════════════════════════════════════════════════════════

class TestAssessmentOwnership:
    """Ensures cross-user assessment access is impossible via the query layer."""

    @pytest.fixture(autouse=True)
    def seed(self, db):
        """Create two users and a shared assessment for each."""
        from backend.app.db.models import (
            User, State, District, Block, Village,
            BusinessCategory, Assessment
        )
        # Minimal geography required by FK constraints
        state = State(name="TestState", code="TS")
        db.add(state)
        db.flush()
        district = District(state_id=state.id, name="TestDistrict")
        db.add(district)
        db.flush()
        block = Block(district_id=district.id, name="TestBlock")
        db.add(block)
        db.flush()
        village = Village(block_id=block.id, name="TestVillage")
        db.add(village)
        db.flush()
        category = BusinessCategory(name="TestCategory")
        db.add(category)
        db.flush()

        self.user_a = User(
            phone_or_email="usera@example.com",
            password_hash=hash_password("PassA"),
        )
        self.user_b = User(
            phone_or_email="userb@example.com",
            password_hash=hash_password("PassB"),
        )
        db.add_all([self.user_a, self.user_b])
        db.flush()

        self.assessment_a = Assessment(
            user_id=self.user_a.id,
            village_id=village.id,
            category_id=category.id,
            capital_input=100000,
            fit_score=75.0,
            confidence_level="High",
            project_cost=120000,
            max_loan_amount=100000,
            recommended_project_size=100000,
        )
        self.assessment_b = Assessment(
            user_id=self.user_b.id,
            village_id=village.id,
            category_id=category.id,
            capital_input=50000,
            fit_score=60.0,
            confidence_level="Medium",
            project_cost=80000,
            max_loan_amount=50000,
            recommended_project_size=50000,
        )
        db.add_all([self.assessment_a, self.assessment_b])
        db.commit()
        db.refresh(self.user_a)
        db.refresh(self.user_b)
        db.refresh(self.assessment_a)
        db.refresh(self.assessment_b)

    def test_user_sees_own_assessments(self, db):
        from backend.app.db.queries import get_assessments_for_user
        results = get_assessments_for_user(db, self.user_a.id)
        assert len(results) == 1
        assert results[0].user_id == self.user_a.id

    def test_user_cannot_see_other_users_assessments(self, db):
        from backend.app.db.queries import get_assessments_for_user
        results_a = get_assessments_for_user(db, self.user_a.id)
        results_b = get_assessments_for_user(db, self.user_b.id)
        ids_a = {r.id for r in results_a}
        ids_b = {r.id for r in results_b}
        assert ids_a.isdisjoint(ids_b), "Cross-user assessment leak detected"

    def test_ownership_single_record_own(self, db):
        from backend.app.db.queries import get_assessment_for_user
        result = get_assessment_for_user(db, self.assessment_a.id, self.user_a.id)
        assert result is not None
        assert result.id == self.assessment_a.id

    def test_ownership_single_record_cross_user_returns_none(self, db):
        """User B must not retrieve User A's assessment by knowing the ID."""
        from backend.app.db.queries import get_assessment_for_user
        result = get_assessment_for_user(db, self.assessment_a.id, self.user_b.id)
        assert result is None, (
            "Cross-user assessment access must return None (respond HTTP 404)"
        )

    def test_nonexistent_assessment_returns_none(self, db):
        from backend.app.db.queries import get_assessment_for_user
        result = get_assessment_for_user(db, 999999, self.user_a.id)
        assert result is None
