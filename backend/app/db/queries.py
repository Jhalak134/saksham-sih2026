"""
queries.py

Reusable database queries for the SAKSHAM platform.
Operates on models defined in backend.app.db.models.
"""

from typing import List, Optional, Dict, Any
from math import atan2, cos, radians, sin, sqrt
from sqlalchemy.orm import Session
from sqlalchemy import or_, func, cast, String

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


LOCATION_ALIASES: Dict[str, str] = {
    "vrindavan": "vrindaban",
    "brindavan": "vrindaban",
    "brindaban": "vrindaban",
}


def search_villages(db: Session, query: str, limit: int = 10) -> List[Village]:
    clean = query.strip()
    q = f"%{clean}%"
    filters = [
        Village.name.ilike(q),
        cast(Village.id, String).ilike(q),
    ]
    alias = LOCATION_ALIASES.get(clean.lower())
    if alias and alias != clean.lower():
        filters.append(Village.name.ilike(f"%{alias}%"))

    return (
        db.query(Village)
        .filter(or_(*filters))
        .limit(limit)
        .all()
    )


def list_villages(db: Session, skip: int = 0, limit: int = 50) -> List[Village]:
    return db.query(Village).offset(skip).limit(limit).all()


def get_village_confidence(db: Session, village_id: int) -> Optional[str]:
    """
    Returns the pre-computed data_confidence level ('High' / 'Medium' / 'Low')
    for a village, or None if not yet computed.
    Run compute_confidence.py to populate this field.
    """
    v = db.query(Village).filter(Village.id == village_id).first()
    return v.data_confidence if v else None


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


DEFAULT_CATCHMENT_RADIUS_KM: float = 10.0


def haversine_distance_km(
    lat1: float, lon1: float, lat2: float, lon2: float
) -> float:
    """Calculates the great-circle distance in kilometers between two points."""
    r_earth_km = 6371.0
    dlat = radians(lat2 - lat1)
    dlon = radians(lon2 - lon1)
    a = (
        sin(dlat / 2.0) ** 2
        + cos(radians(lat1)) * cos(radians(lat2)) * sin(dlon / 2.0) ** 2
    )
    return r_earth_km * 2.0 * atan2(sqrt(a), sqrt(max(0.0, 1.0 - a)))


def count_competitors_in_catchment(
    db: Session,
    village_id: int,
    category_id: Optional[int] = None,
    radius_km: float = DEFAULT_CATCHMENT_RADIUS_KM,
) -> int:
    """
    Counts existing businesses within the specified radius (km) of a target village.
    Filters by category_id if provided. Gracefully returns 0 if village is not found
    or radius is non-positive.
    """
    if radius_km <= 0.0:
        return 0

    target_village = db.query(Village).filter(Village.id == village_id).first()
    if target_village is None:
        return 0

    if target_village.latitude is None or target_village.longitude is None:
        fallback_q = db.query(func.count(Business.id)).filter(
            Business.village_id == village_id
        )
        if category_id is not None:
            fallback_q = fallback_q.filter(Business.category_id == category_id)
        return fallback_q.scalar() or 0

    lat_deg = radius_km / 111.0
    cos_lat = max(abs(cos(radians(target_village.latitude))), 0.01)
    lon_deg = radius_km / (111.0 * cos_lat)

    q = db.query(Business.latitude, Business.longitude).filter(
        Business.latitude.between(
            target_village.latitude - lat_deg, target_village.latitude + lat_deg
        ),
        Business.longitude.between(
            target_village.longitude - lon_deg, target_village.longitude + lon_deg
        ),
    )
    if category_id is not None:
        q = q.filter(Business.category_id == category_id)

    coords = q.all()
    count = 0
    for b_lat, b_lon in coords:
        if (
            haversine_distance_km(
                target_village.latitude, target_village.longitude, b_lat, b_lon
            )
            <= radius_km
        ):
            count += 1
    return count


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

def get_user_by_identifier(db: Session, phone_or_email: str) -> Optional[User]:
    """
    Look up a user by their login identifier (email or phone).
    Returns None if no matching user exists.
    Used by: login endpoint.
    """
    return (
        db.query(User)
        .filter(User.phone_or_email == phone_or_email.strip())
        .first()
    )


def get_user_by_id(db: Session, user_id: int) -> Optional[User]:
    """
    Retrieve a user by their primary key.
    Returns None if the user does not exist.
    Used by: /auth/me endpoint, token validation.
    """
    return db.query(User).filter(User.id == user_id).first()


def create_user(
    db: Session,
    phone_or_email: str,
    password_hash: str,
    home_location: Optional[str] = None,
    default_capital: float = 100000.0,
    preferred_language: str = "en",
) -> Optional[User]:
    """
    Create a new user with a hashed password.
    Returns the created User, or None if the identifier already exists.

    Callers must hash the password BEFORE calling this function.
    Never pass plaintext passwords here.

    Used by: signup endpoint.
    """
    identifier = phone_or_email.strip()
    # Check for duplicate before attempting insert (gives cleaner error handling)
    existing = get_user_by_identifier(db, identifier)
    if existing:
        return None  # caller should return HTTP 409

    user = User(
        phone_or_email=identifier,
        password_hash=password_hash,
        home_location=home_location,
        default_capital=default_capital,
        preferred_language=preferred_language,
    )
    db.add(user)
    try:
        db.commit()
        db.refresh(user)
    except Exception:
        db.rollback()
        raise
    return user


def get_or_create_user(
    db: Session, phone_or_email: str, home_location: Optional[str] = None
) -> User:
    """
    Legacy helper: find or create a user without a password.
    Kept for compatibility with existing non-auth flows.
    New auth-required code should use create_user() + get_user_by_identifier().
    """
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
    rating: Optional[str] = None,
    competitor_count: int = 0,
    business_idea: Optional[str] = None,
    interest_rate: Optional[float] = None,
    tenure_months: Optional[int] = None,
    moratorium_months: Optional[int] = None,
    monthly_emi: Optional[float] = None,
    total_repayment: Optional[float] = None,
    total_interest: Optional[float] = None,
    estimated_monthly_revenue: Optional[float] = None,
    estimated_monthly_profit: Optional[float] = None,
    repayment_burden_ratio: Optional[float] = None,
    repayment_burden_category: Optional[str] = None,
    feasibility_breakdown: Optional[Dict[str, Any]] = None,
    ai_insights: Optional[Dict[str, Any]] = None,
) -> Assessment:
    assessment = Assessment(
        user_id=user_id,
        village_id=village_id,
        category_id=category_id,
        capital_input=capital_input,
        fit_score=fit_score,
        confidence_level=confidence_level,
        rating=rating,
        competitor_count=competitor_count,
        business_idea=business_idea,
        project_cost=project_cost,
        max_loan_amount=max_loan_amount,
        recommended_project_size=recommended_project_size,
        scheme_id=scheme_id,
        interest_rate=interest_rate,
        tenure_months=tenure_months,
        moratorium_months=moratorium_months,
        monthly_emi=monthly_emi,
        total_repayment=total_repayment,
        total_interest=total_interest,
        estimated_monthly_revenue=estimated_monthly_revenue,
        estimated_monthly_profit=estimated_monthly_profit,
        repayment_burden_ratio=repayment_burden_ratio,
        repayment_burden_category=repayment_burden_category,
        feasibility_breakdown=feasibility_breakdown,
        ai_insights=ai_insights,
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


# ─── Ownership-enforced Queries (auth-required) ───────────────────────────────

def get_assessments_for_user(
    db: Session, user_id: int, skip: int = 0, limit: int = 50
) -> List[Assessment]:
    """
    Return assessments belonging to a specific user only.
    A user must never be able to retrieve another user's assessments
    simply by changing an ID in the request.

    Used by: authenticated My Reports endpoint.
    """
    return (
        db.query(Assessment)
        .filter(Assessment.user_id == user_id)
        .order_by(Assessment.id.desc())
        .offset(skip)
        .limit(limit)
        .all()
    )


def get_assessment_for_user(
    db: Session, assessment_id: int, user_id: int
) -> Optional[Assessment]:
    """
    Retrieve a single assessment only if it belongs to the requesting user.
    Returns None (not an exception) when ownership doesn't match —
    callers should return HTTP 404 (not 403) to avoid leaking existence.

    Used by: authenticated assessment detail endpoint.
    """
    return (
        db.query(Assessment)
        .filter(Assessment.id == assessment_id, Assessment.user_id == user_id)
        .first()
    )
