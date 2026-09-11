"""
financial_engine.py

Deterministic financial structuring engine for SAKSHAM (SIH Problem Statement #91).
100% deterministic Python mathematics — zero AI hallucination.
"""

import math
from typing import Dict, Any, Optional
from backend.app.db.models import Scheme


# Benchmark setup costs per micro-enterprise category (Suitability guidance)
CATEGORY_BENCHMARKS = {
    "dairy": {"typical_cost": 350000.0, "default_margin": 0.22},
    "retail": {"typical_cost": 150000.0, "default_margin": 0.18},
    "textiles": {"typical_cost": 250000.0, "default_margin": 0.25},
    "food processing": {"typical_cost": 400000.0, "default_margin": 0.20},
    "agriculture": {"typical_cost": 200000.0, "default_margin": 0.20},
    "logistics": {"typical_cost": 500000.0, "default_margin": 0.22},
    "handicrafts": {"typical_cost": 120000.0, "default_margin": 0.25},
    "education": {"typical_cost": 180000.0, "default_margin": 0.25},
}


def calculate_reducing_balance_emi(
    principal: float,
    annual_rate: float,
    tenure_months: int,
    moratorium_months: int = 0,
) -> Dict[str, float]:
    """
    Standard reducing-balance monthly installment calculation:
        EMI = P * r * (1 + r)^n / ((1 + r)^n - 1)
    where:
        P = principal loan amount
        r = monthly interest rate (annual_rate / 12 / 100)
        n = active repayment months (tenure_months - moratorium_months)
    """
    if principal <= 0:
        return {
            "principal": 0.0,
            "monthly_emi": 0.0,
            "total_repayment": 0.0,
            "total_interest": 0.0,
            "repayment_months": max(0, tenure_months - moratorium_months),
        }

    repayment_months = max(1, tenure_months - moratorium_months)

    if annual_rate <= 0:
        emi = principal / repayment_months
        return {
            "principal": round(principal, 2),
            "monthly_emi": round(emi, 2),
            "total_repayment": round(principal, 2),
            "total_interest": 0.0,
            "repayment_months": repayment_months,
        }

    monthly_rate = (annual_rate / 100.0) / 12.0
    factor = math.pow(1.0 + monthly_rate, repayment_months)
    emi = principal * monthly_rate * factor / (factor - 1.0)
    total_repayment = emi * repayment_months
    total_interest = total_repayment - principal

    return {
        "principal": round(principal, 2),
        "monthly_emi": round(emi, 2),
        "total_repayment": round(total_repayment, 2),
        "total_interest": round(total_interest, 2),
        "repayment_months": repayment_months,
    }


def structure_finances(
    available_margin: float,
    category_name: str,
    scheme: Optional[Scheme] = None,
) -> Dict[str, Any]:
    """
    Computes financial structure per SIH Problem Statement #91:
    - Project Cost = Available Margin ÷ 10%
    - Max Loan = 90% of Project Cost
    - Scheme Auto-Selection (Micro Finance <= ₹1.40L, Term Loan > ₹1.40L)
    - Suitability vs Eligibility comparison
    """
    margin = max(1000.0, float(available_margin))

    # Core statutory formula: Project Cost = Margin ÷ 10%
    project_cost = margin / 0.10

    # Determine scheme parameters
    if scheme:
        scheme_name = scheme.name
        scheme_id = scheme.id
        max_loan_cap = scheme.max_loan_amount
        interest_rate = scheme.interest_rate
        tenure_months = scheme.tenure_months
        moratorium_months = scheme.moratorium_months
    else:
        # Fallback routing
        if project_cost <= 140000.0:
            scheme_name = "Micro Finance Scheme"
            scheme_id = 1
            max_loan_cap = 125000.0
            interest_rate = 6.5
            tenure_months = 36
            moratorium_months = 3
        else:
            scheme_name = "Term Loan Scheme"
            scheme_id = 2
            max_loan_cap = 4500000.0
            interest_rate = 8.0
            tenure_months = 84
            moratorium_months = 6

    # Max Loan = 90% of Project Cost, subject to scheme ceiling
    raw_loan = project_cost * 0.90
    max_loan_amount = min(raw_loan, max_loan_cap)

    # Calculate reducing-balance EMI after moratorium
    emi_info = calculate_reducing_balance_emi(
        principal=max_loan_amount,
        annual_rate=interest_rate,
        tenure_months=tenure_months,
        moratorium_months=moratorium_months,
    )

    # Suitability: Benchmark recommended project size
    cat_clean = category_name.strip().lower()
    benchmark = CATEGORY_BENCHMARKS.get(cat_clean, {"typical_cost": 250000.0, "default_margin": 0.20})
    recommended_project_size = benchmark["typical_cost"]

    # Estimated monthly operational revenue & profit
    monthly_revenue = recommended_project_size * 0.25
    monthly_profit = monthly_revenue * benchmark["default_margin"]
    burden_ratio = (emi_info["monthly_emi"] / monthly_profit) if monthly_profit > 0 else 1.0

    if burden_ratio <= 0.25:
        burden_category = "Low Risk (<25% of profit)"
    elif burden_ratio <= 0.40:
        burden_category = "Manageable (25% - 40% of profit)"
    elif burden_ratio <= 0.60:
        burden_category = "High Burden (40% - 60% of profit)"
    else:
        burden_category = "Critical (>60% of profit)"

    return {
        "available_margin": round(margin, 2),
        "project_cost": round(project_cost, 2),
        "max_loan_amount": round(max_loan_amount, 2),
        "recommended_project_size": round(recommended_project_size, 2),
        "scheme_id": scheme_id,
        "scheme_name": scheme_name,
        "interest_rate": interest_rate,
        "tenure_months": tenure_months,
        "moratorium_months": moratorium_months,
        "monthly_emi": emi_info["monthly_emi"],
        "total_repayment": emi_info["total_repayment"],
        "total_interest": emi_info["total_interest"],
        "estimated_monthly_revenue": round(monthly_revenue, 2),
        "estimated_monthly_profit": round(monthly_profit, 2),
        "repayment_burden_ratio": round(burden_ratio, 3),
        "repayment_burden_category": burden_category,
    }
