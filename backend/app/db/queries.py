"""
queries.py

Reusable database queries for the SAKSHAM platform.
Operates on models defined in backend.app.db.models.
"""

from typing import List, Optional
from sqlalchemy.orm import Session
from sqlalchemy import or_, func

from backend.app.db.models import (
    State,
    District,
    Block,
    Village,
    BusinessCategory,
    Business,
    Scheme,
    User,
    Assessment,
)


# ─── Village & Geographic Queries ─────────────────────────────────────────────

def get_village_by_id(db: Session, village_id: int) -> Optional[Village]:
    return db.query(Village).filter(Village.id == village_id).first()


def get_village_by_name(db: Session, name: str) -> Optional[Village]:
    return db.query(Village).filter(func.lower(Village.name) == name.strip().lower()).first()


def search_villages(db: Session, query: str, limit: int = 10) -> List[Village]:
    q = f"%{query.strip()}%"
    return (
        db.query(Village)
        .filter(
            or_(
                Village.name.ilike(q),
                func.cast(Village.id, str).ilike(q),
            )
        )
        .limit(limit)
        .all()
    )


def list_villages(db: Session, skip: int = 0, limit: int = 50) -> List[Village]:
    return db.query(Village).offset(skip).limit(limit).all()


# ─── Category & Business Queries ──────────────────────────────────────────────

def list_business_categories(db: Session) -> List[BusinessCategory]:
    return db.query(BusinessCategory).all()


def get_category_by_id(db: Session, category_id: int) -> Optional[BusinessCategory]:
    return db.query(BusinessCategory).filter(BusinessCategory.id == category_id).first()


def get_category_by_name(db: Session, name: str) -> Optional[BusinessCategory]:
    return (
        db.query(BusinessCategory)
        .filter(func.lower(BusinessCategory.name) == name.strip().lower())
        .first()
    )


def list_businesses_by_village(
    db: Session, village_id: int, category_id: Optional[int] = None
) -> List[Business]:
    q = db.query(Business).filter(Business.village_id == village_id)
    if category_id is not None:
        q = q.filter(Business.category_id == category_id)
    return q.all()


def count_competitors_in_catchment(
    db: Session, village_id: int, category_id: Optional[int] = None
) -> int:
    """Count existing businesses in the village or district catchment."""
    q = db.query(func.count(Business.id))
    if category_id is not None:
        q = q.filter(Business.category_id == category_id)
    return q.scalar() or 0


# ─── Scheme Queries ───────────────────────────────────────────────────────────

def list_schemes(db: Session) -> List[Scheme]:
    return db.query(Scheme).all()


def get_scheme_by_id(db: Session, scheme_id: int) -> Optional[Scheme]:
    return db.query(Scheme).filter(Scheme.id == scheme_id).first()


def get_scheme_for_cost(db: Session, project_cost: float) -> Optional[Scheme]:
    """
    Routes financing scheme based on official SIH #91 thresholds:
    - Project Cost <= 1.40L (₹140,000) -> Micro Finance Scheme
    - Project Cost > 1.40L and <= 50L (₹5,000,000) -> Term Loan Scheme
    """
    if project_cost <= 140000.0:
        return db.query(Scheme).filter(Scheme.name.ilike("%micro%")).first()
    else:
        return db.query(Scheme).filter(Scheme.name.ilike("%term%")).first()


# ─── User Queries ─────────────────────────────────────────────────────────────

def get_or_create_user(
    db: Session, phone_or_email: str, home_location: Optional[str] = None
) -> User:
    identifier = phone_or_email.strip()
    user = db.query(User).filter(User.phone_or_email == identifier).first()
    if not user:
        user = User(
            phone_or_email=identifier,
            home_location=home_location,
            default_capital=100000.0,
            preferred_language="en",
        )
        db.add(user)
        db.commit()
        db.refresh(user)
    return user


# ─── Assessment Queries ───────────────────────────────────────────────────────

def save_assessment(
    db: Session,
    user_id: int,
    village_id: int,
    category_id: int,
    capital_input: float,
    fit_score: float,
    confidence_level: str,
    project_cost: float,
    max_loan_amount: float,
    recommended_project_size: float,
    scheme_id: Optional[int] = None,
    status: str = "Exploring",
) -> Assessment:
    assessment = Assessment(
        user_id=user_id,
        village_id=village_id,
        category_id=category_id,
        capital_input=capital_input,
        fit_score=fit_score,
        confidence_level=confidence_level,
        project_cost=project_cost,
        max_loan_amount=max_loan_amount,
        recommended_project_size=recommended_project_size,
        scheme_id=scheme_id,
        status=status,
    )
    db.add(assessment)
    db.commit()
    db.refresh(assessment)
    return assessment


def get_assessment_by_id(db: Session, assessment_id: int) -> Optional[Assessment]:
    return db.query(Assessment).filter(Assessment.id == assessment_id).first()


def list_assessments(db: Session, skip: int = 0, limit: int = 50) -> List[Assessment]:
    return (
        db.query(Assessment)
        .order_by(Assessment.id.desc())
        .offset(skip)
        .limit(limit)
        .all()
    )
