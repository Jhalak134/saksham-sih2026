"""
assess.py

Main assessment router for SAKSHAM platform.
Integrates Location Resolution, Deterministic Financial Structuring,
Explainable Feasibility Scoring, AI Advisory, and Database Persistence.
Matches frontend contract (fitScore, confidence, recommendation) while
providing the complete analytical report.
"""

from typing import Optional, List, Dict, Any
from fastapi import APIRouter, Depends, HTTPException, Query
from sqlalchemy.orm import Session
from pydantic import BaseModel, Field

from backend.app.db.session import get_db
from backend.app.db.models import Village, BusinessCategory, Scheme, Assessment, User
from backend.app.db.queries import (
    get_village_by_id,
    get_category_by_id,
    get_category_by_name,
    get_scheme_for_cost,
    count_competitors_in_catchment,
    get_or_create_user,
    save_assessment,
    list_assessments,
    get_assessment_by_id,
    get_assessments_for_user,
)
from backend.app.engines.location_resolver import resolve_location
from backend.app.engines.financial_engine import structure_finances
from backend.app.engines.feasibility_engine import evaluate_feasibility
from backend.app.clients.ai_client import ai_client
from backend.app.routers.auth import get_current_user
from backend.app.schemas.assess import ReportSummary, MyReportsResponse

router = APIRouter(prefix="/api/v1/assess", tags=["Assessment Engine"])


class AssessmentRequest(BaseModel):
    location: Optional[str] = Field(None, description="Village name, code, or search string")
    location_query: Optional[str] = None
    village_id: Optional[int] = None
    category: Optional[str] = Field("Dairy", description="Business category name")
    category_id: Optional[int] = None
    capital: Optional[float] = Field(None, description="Available margin capital in INR")
    available_capital: Optional[float] = None
    capital_input: Optional[float] = None
    idea: Optional[str] = "Rural micro-enterprise unit"
    language: Optional[str] = "en"
    phone_or_email: Optional[str] = "guest_entrepreneur@saksham.gov.in"


def _resolve_assessment_village(db: Session, req: AssessmentRequest) -> Village:
    loc_str = req.location or req.location_query or (str(req.village_id) if req.village_id else "Kamar")
    resolved = resolve_location(db, loc_str)
    village = resolved.get("village")
    if not village:
        village = db.query(Village).order_by(Village.population.desc()).first()
    if not village:
        raise HTTPException(status_code=400, detail="No villages available in database.")
    return village


def _resolve_assessment_category(db: Session, req: AssessmentRequest) -> BusinessCategory:
    cat: Optional[BusinessCategory] = None
    if req.category_id is not None:
        cat = get_category_by_id(db, req.category_id)
    if not cat and req.category:
        cat = get_category_by_name(db, req.category)
    if not cat:
        cat = db.query(BusinessCategory).first()
    if not cat:
        raise HTTPException(status_code=400, detail="No business categories available.")
    return cat


@router.post("")
async def create_assessment(req: AssessmentRequest, db: Session = Depends(get_db)):
    """
    Run complete multi-criteria assessment per SIH Problem Statement #91.
    """
    # 1. Resolve Location
    village = _resolve_assessment_village(db, req)

    # 2. Resolve Category
    cat = _resolve_assessment_category(db, req)

    # 3. Resolve Margin Capital
    margin = req.capital or req.available_capital or req.capital_input or 100000.0

    # 4. Count Incumbent Competitors
    comp_count = count_competitors_in_catchment(db, village.id, cat.id)

    # 5. Deterministic Financial Structuring (SIH #91 Rules)
    project_cost_est = margin / 0.10
    selected_scheme = get_scheme_for_cost(db, project_cost_est)
    fin_data = structure_finances(
        available_margin=margin,
        category_name=cat.name,
        scheme=selected_scheme,
    )

    # 6. Explainable Feasibility Evaluation
    feas_data = evaluate_feasibility(
        village=village,
        category=cat,
        capital_input=margin,
        competitor_count=comp_count,
    )

    # 7. AI Advisory & Explanations (Decoupled with safe fallback)
    ai_data = await ai_client.get_assessment_insights(
        idea=req.idea or cat.name,
        category_name=cat.name,
        village_name=village.name,
        fit_score=feas_data["fit_score"],
        rating=feas_data["rating"],
        project_cost=fin_data["project_cost"],
        loan_amount=fin_data["max_loan_amount"],
        scheme_name=fin_data["scheme_name"],
        monthly_emi=fin_data["monthly_emi"],
        interest_rate=fin_data.get("interest_rate"),
        tenure_months=fin_data.get("tenure_months"),
        moratorium_months=fin_data.get("moratorium_months"),
        repayment_burden_category=fin_data.get("repayment_burden_category"),
        language=req.language or "en",
    )

    # 8. Persist Assessment in Database
    user = get_or_create_user(db, req.phone_or_email or "guest_user", home_location=village.name)
    saved = save_assessment(
        db=db,
        user_id=user.id,
        village_id=village.id,
        category_id=cat.id,
        capital_input=margin,
        fit_score=feas_data["fit_score"],
        confidence_level=feas_data["confidence_level"],
        project_cost=fin_data["project_cost"],
        max_loan_amount=fin_data["max_loan_amount"],
        recommended_project_size=fin_data["recommended_project_size"],
        scheme_id=fin_data["scheme_id"],
        status="Exploring",
    )

    recommendation_text = ai_data.get("recommendation") or ai_data.get("explanation", "")

    # Unified response matching frontend interface & rich backend spec
    return {
        "id": saved.id,
        # Frontend compatibility fields
        "fitScore": feas_data["fit_score"],
        "confidence": feas_data["confidence_level"],
        "recommendation": recommendation_text,
        # Rich report fields
        "fit_score": feas_data["fit_score"],
        "confidence_level": feas_data["confidence_level"],
        "rating": feas_data["rating"],
        "village": {
            "id": village.id,
            "name": village.name,
            "block_name": village.block.name if village.block else "Mathura",
            "district": "Mathura",
            "state": "Uttar Pradesh",
            "population": village.population or 0,
            "households": village.household_count or 0,
            "literacy_rate": village.literacy_rate or 0.0,
        },
        "category": {
            "id": cat.id,
            "name": cat.name,
            "icon": cat.icon,
            "is_seasonal": cat.is_seasonal,
        },
        "financial": fin_data,
        "feasibility": feas_data,
        "scheme": {
            "id": fin_data["scheme_id"],
            "name": fin_data["scheme_name"],
            "interest_rate": fin_data["interest_rate"],
            "tenure_months": fin_data["tenure_months"],
            "moratorium_months": fin_data["moratorium_months"],
        },
        "ai_insights": ai_data,
        "competitor_count": comp_count,
        "status": saved.status,
        "created_at": saved.created_at,
    }


@router.get("/my-reports", response_model=MyReportsResponse)
def get_my_reports(
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    assessments = get_assessments_for_user(db, current_user.id)

    reports = []
    for a in assessments:
        # Construct the response expected by the frontend
        reports.append(
            ReportSummary(
                id=f"REP-{a.id:04d}",
                category=a.category.name if a.category else "Unknown",
                location=a.village.name if a.village else "Unknown",
                date=a.created_at.strftime("%b %d, %Y") if a.created_at else "Unknown",
                fitScore=a.fit_score or 0.0,
                # Faking estimated profit for now, as it's not in the DB schema
                estimatedProfit=(a.capital_input or 100000.0) * 0.15,
                status=a.status or "Exploring"
            )
        )

    return MyReportsResponse(reports=reports)


@router.get("/history")
def get_history(
    skip: int = Query(0, ge=0),
    limit: int = Query(50, ge=1, le=100),
    db: Session = Depends(get_db),
):
    """Retrieve historical assessment reports."""
    items = list_assessments(db, skip=skip, limit=limit)
    return [
        {
            "id": a.id,
            "village_name": a.village.name if a.village else "Unknown",
            "category_name": a.scheme.name if a.scheme else "General",
            "capital_input": a.capital_input,
            "project_cost": a.project_cost,
            "fit_score": a.fit_score,
            "confidence_level": a.confidence_level,
            "scheme_name": a.scheme.name if a.scheme else "Concessional",
            "created_at": a.created_at,
        }
        for a in items
    ]


@router.get("/{assessment_id}")
def get_assessment(assessment_id: int, db: Session = Depends(get_db)):
    """Retrieve full details of a past assessment."""
    a = get_assessment_by_id(db, assessment_id)
    if not a:
        raise HTTPException(status_code=404, detail="Assessment not found.")
    return {
        "id": a.id,
        "village": {
            "id": a.village.id,
            "name": a.village.name,
            "population": a.village.population,
            "literacy_rate": a.village.literacy_rate,
        } if a.village else None,
        "capital_input": a.capital_input,
        "fit_score": a.fit_score,
        "confidence_level": a.confidence_level,
        "project_cost": a.project_cost,
        "max_loan_amount": a.max_loan_amount,
        "recommended_project_size": a.recommended_project_size,
        "scheme": {
            "id": a.scheme.id,
            "name": a.scheme.name,
            "interest_rate": a.scheme.interest_rate,
            "tenure_months": a.scheme.tenure_months,
        } if a.scheme else None,
        "created_at": a.created_at,
    }
