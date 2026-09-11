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
from sqlalchemy import func, or_
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
legacy_router = APIRouter(prefix="/assess", tags=["Assessment Engine Legacy"])


class AssessmentRequest(BaseModel):
    location: Optional[str] = Field(None, description="Village name, code, or search string")
    location_query: Optional[str] = None
    village_id: Optional[int] = None
    category: Optional[str] = Field(None, description="Business category name")
    category_id: Optional[int] = None
    capital: Optional[float] = Field(None, description="Available margin capital in INR")
    available_capital: Optional[float] = None
    capital_input: Optional[float] = None
    idea: Optional[str] = "Rural micro-enterprise unit"
    language: Optional[str] = "en"
    phone_or_email: Optional[str] = "guest_entrepreneur@saksham.gov.in"


CATEGORY_ALIASES = {
    "dairy": "Dairy",
    "milk": "Dairy",
    "ghee": "Dairy",
    "paneer": "Dairy",
    "retail": "Retail",
    "kirana": "Retail",
    "store": "Retail",
    "shop": "Retail",
    "grocery": "Grocery/Retail",
    "grocery/retail": "Grocery/Retail",
    "textiles": "Textiles",
    "textile": "Textiles",
    "tailoring": "Tailoring",
    "stitching": "Tailoring",
    "boutique": "Tailoring",
    "garment": "Textiles",
    "garments": "Textiles",
    "clothes": "Textiles",
    "clothing": "Textiles",
    "food": "Food Processing",
    "food processing": "Food Processing",
    "processing": "Food Processing",
    "flour mill": "Flour Mill",
    "atta chakki": "Flour Mill",
    "oil mill": "Food Processing",
    "agriculture": "Agriculture",
    "agri": "Agriculture",
    "farm": "Agriculture",
    "farming": "Agriculture",
    "agri-input": "Agri-input Store",
    "poultry": "Poultry",
    "vegetable": "Vegetable Trading",
    "restaurant": "Restaurant",
    "repair": "Mobile Repair",
    "mobile": "Mobile Repair",
    "logistics": "Logistics",
    "transport": "Logistics",
    "delivery": "Logistics",
    "handicrafts": "Handicrafts",
    "handicraft": "Handicrafts",
    "craft": "Handicrafts",
    "pottery": "Handicrafts",
    "education": "Education",
    "coaching": "Education",
    "school": "Education",
    "tuition": "Education",
}


def _resolve_assessment_village(db: Session, req: AssessmentRequest) -> Village:
    # 1. Prioritize explicit numeric village_id
    if req.village_id:
        v_by_id = db.query(Village).filter(Village.id == req.village_id).first()
        if v_by_id:
            return v_by_id

    # 2. Resolve via search string
    loc_str = req.location or req.location_query or "Kamar"
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
        if cat:
            return cat

    cat_str = (req.category or "").strip()

    # If category wasn't explicitly provided, infer from idea keywords
    if not cat_str:
        if req.idea and req.idea.strip():
            idea_lower = req.idea.lower()
            for k in sorted(CATEGORY_ALIASES.keys(), key=len, reverse=True):
                if k in idea_lower:
                    cat_str = CATEGORY_ALIASES[k]
                    break

    clean_c = cat_str.strip().lower()

    # 1. Exact match
    if clean_c:
        cat = db.query(BusinessCategory).filter(func.lower(BusinessCategory.name) == clean_c).first()

    # 2. Alias keyword matching (longest keyword first)
    if not cat and clean_c:
        for k in sorted(CATEGORY_ALIASES.keys(), key=len, reverse=True):
            if k in clean_c:
                target_name = CATEGORY_ALIASES[k]
                cat = db.query(BusinessCategory).filter(func.lower(BusinessCategory.name) == target_name.lower()).first()
                if cat:
                    break

    # 3. Substring match
    if not cat and clean_c:
        cat = db.query(BusinessCategory).filter(BusinessCategory.name.ilike(f"%{clean_c}%")).first()

    # 4. Fallback to Dairy if nothing matched
    if not cat:
        cat = db.query(BusinessCategory).filter(func.lower(BusinessCategory.name) == "dairy").first()
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
        village=village,
        competitor_count=comp_count,
    )

    # 6. Explainable Feasibility Evaluation
    feas_data = evaluate_feasibility(
        village=village,
        category=cat,
        capital_input=margin,
        competitor_count=comp_count,
        idea=req.idea,
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
        rating=feas_data.get("rating"),
        competitor_count=comp_count,
        business_idea=req.idea or cat.name,
        interest_rate=fin_data.get("interest_rate"),
        tenure_months=fin_data.get("tenure_months"),
        moratorium_months=fin_data.get("moratorium_months"),
        monthly_emi=fin_data.get("monthly_emi"),
        total_repayment=fin_data.get("total_repayment"),
        total_interest=fin_data.get("total_interest"),
        estimated_monthly_revenue=fin_data.get("estimated_monthly_revenue"),
        estimated_monthly_profit=fin_data.get("estimated_monthly_profit"),
        repayment_burden_ratio=fin_data.get("repayment_burden_ratio"),
        repayment_burden_category=fin_data.get("repayment_burden_category"),
        feasibility_breakdown=feas_data,
        ai_insights=ai_data,
    )

    return _build_assessment_response(saved)


def _build_village_dict(v: Optional[Village]) -> Optional[Dict[str, Any]]:
    if not v:
        return None
    block_name = v.block.name if v.block else "Mathura"
    return {
        "id": v.id,
        "name": v.name,
        "block_name": block_name,
        "district": "Mathura",
        "state": "Uttar Pradesh",
        "population": v.population or 0,
        "households": v.household_count or 0,
        "literacy_rate": round(v.literacy_rate * 100.0, 1) if (v.literacy_rate is not None and v.literacy_rate <= 1.0) else (v.literacy_rate or 0.0),
    }


def _build_category_dict(cat: Optional[BusinessCategory]) -> Optional[Dict[str, Any]]:
    if not cat:
        return None
    return {
        "id": cat.id,
        "name": cat.name,
        "icon": cat.icon,
        "is_seasonal": cat.is_seasonal,
    }


def _build_financial_dict(a: Assessment) -> Dict[str, Any]:
    sch = a.scheme
    project_cost = a.project_cost if a.project_cost is not None else (a.capital_input / 0.10 if a.capital_input else 1000000.0)
    max_loan = a.max_loan_amount if a.max_loan_amount is not None else (project_cost * 0.90)
    interest_rate = a.interest_rate if a.interest_rate is not None else (sch.interest_rate if sch else 8.0)
    tenure_months = a.tenure_months if a.tenure_months is not None else (sch.tenure_months if sch else 84)
    moratorium_months = a.moratorium_months if a.moratorium_months is not None else (sch.moratorium_months if sch else 6)
    scheme_name = sch.name if sch else "Term Loan Scheme"
    scheme_id = a.scheme_id or (sch.id if sch else 2)

    return {
        "available_margin": a.capital_input,
        "project_cost": project_cost,
        "max_loan_amount": max_loan,
        "recommended_project_size": a.recommended_project_size or (project_cost * 0.35),
        "scheme_id": scheme_id,
        "scheme_name": scheme_name,
        "interest_rate": interest_rate,
        "tenure_months": tenure_months,
        "moratorium_months": moratorium_months,
        "monthly_emi": a.monthly_emi,
        "total_repayment": a.total_repayment,
        "total_interest": a.total_interest,
        "estimated_monthly_revenue": a.estimated_monthly_revenue,
        "estimated_monthly_profit": a.estimated_monthly_profit,
        "repayment_burden_ratio": a.repayment_burden_ratio,
        "repayment_burden_category": a.repayment_burden_category,
    }


def _build_feasibility_dict(a: Assessment) -> Dict[str, Any]:
    if a.feasibility_breakdown and isinstance(a.feasibility_breakdown, dict):
        return a.feasibility_breakdown
    return {
        "fit_score": a.fit_score,
        "rating": a.rating or "Feasible",
        "confidence_level": a.confidence_level or "Medium",
    }


def _build_assessment_response(a: Assessment) -> Dict[str, Any]:
    """
    Constructs the authoritative analytical assessment response matching the frontend
    and backend contracts from a persisted Assessment entity.
    """
    recommendation_text = ""
    if a.ai_insights and isinstance(a.ai_insights, dict):
        recommendation_text = a.ai_insights.get("recommendation") or a.ai_insights.get("explanation", "")

    fin_data = _build_financial_dict(a)
    feas_data = _build_feasibility_dict(a)
    rating = a.rating or (feas_data.get("rating") if isinstance(feas_data, dict) else "Highly Feasible")

    return {
        "id": a.id,
        "fitScore": a.fit_score,
        "confidence": a.confidence_level,
        "recommendation": recommendation_text,
        "fit_score": a.fit_score,
        "confidence_level": a.confidence_level,
        "rating": rating,
        "village": _build_village_dict(a.village),
        "category": _build_category_dict(a.category),
        "financial": fin_data,
        "feasibility": feas_data,
        "scheme": {
            "id": fin_data["scheme_id"],
            "name": fin_data["scheme_name"],
            "interest_rate": fin_data["interest_rate"],
            "tenure_months": fin_data["tenure_months"],
            "moratorium_months": fin_data["moratorium_months"],
        },
        "ai_insights": a.ai_insights,
        "competitor_count": a.competitor_count if a.competitor_count is not None else 0,
        "status": a.status or "Exploring",
        "created_at": a.created_at,
    }


@router.get("/my-reports", response_model=MyReportsResponse)
@legacy_router.get("/my-reports", response_model=MyReportsResponse)
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
            "category_name": a.category.name if a.category else "General",
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
    return _build_assessment_response(a)
