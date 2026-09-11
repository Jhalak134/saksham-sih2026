"""
schemes.py

Router for official government loan & subsidy schemes and EMI math.
"""

from typing import List, Optional
from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session
from pydantic import BaseModel, Field

from backend.app.db.session import get_db
from backend.app.db.models import Scheme
from backend.app.db.queries import list_schemes, get_scheme_by_id, get_scheme_for_cost
from backend.app.engines.financial_engine import calculate_reducing_balance_emi, structure_finances

router = APIRouter(prefix="/api/v1/schemes", tags=["Schemes & Financial Calculators"])


class EMICalculationRequest(BaseModel):
    loan_amount: float = Field(..., gt=0)
    interest_rate: float = Field(..., ge=0)
    tenure_months: int = Field(60, gt=0)
    moratorium_months: int = Field(0, ge=0)


class SchemeMatchRequest(BaseModel):
    available_margin: float = Field(..., gt=0)
    category: Optional[str] = "Dairy"


@router.get("")
def get_schemes(db: Session = Depends(get_db)):
    """Retrieve all active official concessional credit schemes."""
    schemes = list_schemes(db)
    return [
        {
            "id": s.id,
            "name": s.name,
            "max_project_cost": s.max_project_cost,
            "max_loan_amount": s.max_loan_amount,
            "interest_rate": s.interest_rate,
            "tenure_months": s.tenure_months,
            "moratorium_months": s.moratorium_months,
            "margin_requirement": "10% own promoter contribution",
        }
        for s in schemes
    ]


@router.get("/{scheme_id}")
def get_scheme(scheme_id: int, db: Session = Depends(get_db)):
    s = get_scheme_by_id(db, scheme_id)
    if not s:
        raise HTTPException(status_code=404, detail="Scheme not found.")
    return {
        "id": s.id,
        "name": s.name,
        "max_project_cost": s.max_project_cost,
        "max_loan_amount": s.max_loan_amount,
        "interest_rate": s.interest_rate,
        "tenure_months": s.tenure_months,
        "moratorium_months": s.moratorium_months,
    }


@router.post("/calculate-emi")
def calculate_emi_endpoint(req: EMICalculationRequest):
    """
    Direct reducing-balance EMI calculation after moratorium period:
    EMI = P * r * (1 + r)^n / ((1 + r)^n - 1)
    """
    return calculate_reducing_balance_emi(
        principal=req.loan_amount,
        annual_rate=req.interest_rate,
        tenure_months=req.tenure_months,
        moratorium_months=req.moratorium_months,
    )


@router.post("/match")
def match_scheme_endpoint(req: SchemeMatchRequest, db: Session = Depends(get_db)):
    """
    Auto-selects Micro Finance Scheme vs Term Loan Scheme based on 10% margin input.
    """
    project_cost = req.available_margin / 0.10
    sch = get_scheme_for_cost(db, project_cost)
    res = structure_finances(
        available_margin=req.available_margin,
        category_name=req.category or "Dairy",
        scheme=sch,
    )
    return res
