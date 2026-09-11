"""
financial_engine.py

Deterministic financial structuring engine for SAKSHAM (SIH Problem Statement #91).
100% deterministic Python mathematics grounded in Census 2011 demographic data
and rural micro-enterprise economic benchmarks.
"""

import math
from typing import Dict, Any, Optional
from backend.app.db.models import Scheme, Village


# Benchmark setup costs, operating margins, and NSSO/Census rural demand parameters per micro-enterprise category
CATEGORY_BENCHMARKS = {
    "dairy": {
        "typical_cost": 350000.0,
        "default_margin": 0.22,
        "monthly_spend_per_hh": 2500.0,   # Milk, curd, ghee, dairy cattle products
        "base_capture_rate": 0.06,        # ~6% capture of village retail dairy demand
        "export_market_ratio": 0.45,      # 45% wholesale off-take (dairy cooperatives / chilling plants)
        "turnover_to_capital": 0.22,      # Monthly production capacity ratio = ~22% of project capital
    },
    "retail": {
        "typical_cost": 150000.0,
        "default_margin": 0.18,
        "monthly_spend_per_hh": 3500.0,   # FMCG, staples, groceries, household items
        "base_capture_rate": 0.08,        # ~8% capture of local village kirana spend
        "export_market_ratio": 0.05,      # Kirana is hyper-local, minimal export (5%)
        "turnover_to_capital": 0.28,      # Monthly sales capacity ~28% of capital/stock
    },
    "grocery/retail": {
        "typical_cost": 150000.0,
        "default_margin": 0.18,
        "monthly_spend_per_hh": 3500.0,
        "base_capture_rate": 0.08,
        "export_market_ratio": 0.05,
        "turnover_to_capital": 0.28,
    },
    "textiles": {
        "typical_cost": 250000.0,
        "default_margin": 0.25,
        "monthly_spend_per_hh": 900.0,    # Tailoring, cloth, school uniforms, festive wear
        "base_capture_rate": 0.07,
        "export_market_ratio": 0.15,      # Nearby haat / weekly bazaar sales
        "turnover_to_capital": 0.20,
    },
    "food processing": {
        "typical_cost": 400000.0,
        "default_margin": 0.20,
        "monthly_spend_per_hh": 1200.0,   # Atta chakki, mustard oil expeller, spice milling
        "base_capture_rate": 0.10,
        "export_market_ratio": 0.35,      # Bulk flour / oil supply to local mandis
        "turnover_to_capital": 0.22,
    },
    "agriculture": {
        "typical_cost": 200000.0,
        "default_margin": 0.20,
        "monthly_spend_per_hh": 2000.0,   # Agro-inputs, seeds, bio-fertilizers, nursery
        "base_capture_rate": 0.08,
        "export_market_ratio": 0.30,      # Inter-village agro distribution
        "turnover_to_capital": 0.24,
    },
    "logistics": {
        "typical_cost": 500000.0,
        "default_margin": 0.22,
        "monthly_spend_per_hh": 700.0,    # Local freight, agri-produce transport to Mathura mandi
        "base_capture_rate": 0.12,
        "export_market_ratio": 0.40,      # Regional route transport
        "turnover_to_capital": 0.20,
    },
    "handicrafts": {
        "typical_cost": 120000.0,
        "default_margin": 0.25,
        "monthly_spend_per_hh": 500.0,    # Pottery, woodwork, devotional crafts
        "base_capture_rate": 0.08,
        "export_market_ratio": 0.50,      # Religious tourism wholesale (Vrindavan, Mathura, Govardhan)
        "turnover_to_capital": 0.25,
    },
    "education": {
        "typical_cost": 180000.0,
        "default_margin": 0.25,
        "monthly_spend_per_hh": 1000.0,   # Tuition, coaching, vocational computer classes
        "base_capture_rate": 0.08,
        "export_market_ratio": 0.10,      # Nearby hamlets
        "turnover_to_capital": 0.22,
    },
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
    village: Optional[Village] = None,
    competitor_count: int = 0,
) -> Dict[str, Any]:
    """
    Computes financial structure per SIH Problem Statement #91 grounded in Census 2011:
    - Project Cost = Available Margin ÷ 10%
    - Max Loan = 90% of Project Cost
    - Scheme Auto-Selection (Micro Finance <= ₹1.40L, Term Loan > ₹1.40L)
    - Census-driven Monthly Revenue, Operating Profit, and Repayment Burden
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

    # Suitability & Category benchmarks
    cat_clean = category_name.strip().lower()
    benchmark = CATEGORY_BENCHMARKS.get(
        cat_clean,
        CATEGORY_BENCHMARKS.get("dairy", {
            "typical_cost": 250000.0,
            "default_margin": 0.20,
            "monthly_spend_per_hh": 2000.0,
            "base_capture_rate": 0.08,
            "export_market_ratio": 0.30,
            "turnover_to_capital": 0.22,
        })
    )

    typical_cost = benchmark["typical_cost"]
    margin_rate = benchmark["default_margin"]
    spend_per_hh = benchmark.get("monthly_spend_per_hh", 2000.0)
    base_capture = benchmark.get("base_capture_rate", 0.08)
    export_ratio = benchmark.get("export_market_ratio", 0.30)
    turnover_ratio = benchmark.get("turnover_to_capital", 0.22)

    # Extract Census 2011 Demographics
    if village is not None:
        pop = village.population or 0
        households = village.household_count or (round(pop / 6.0) if pop > 0 else 0)
        raw_lit = village.literacy_rate if village.literacy_rate is not None else 0.55
        lit_dec = (raw_lit / 100.0) if raw_lit > 1.0 else raw_lit
    else:
        # Fallback representative baseline for unlocated simulations
        pop = 3500
        households = 550
        lit_dec = 0.55

    # 1. Catchment Total Addressable Market (TAM) per month
    monthly_tam = households * spend_per_hh

    # 2. Purchasing power & Competition deflator
    purchasing_power_factor = 0.85 + (0.30 * lit_dec)
    comp_count = max(0, int(competitor_count))
    competition_deflator = 1.0 / (1.0 + (0.35 * comp_count))
    effective_capture_rate = base_capture * competition_deflator * purchasing_power_factor

    # 3. Local village demand capture
    local_demand = monthly_tam * effective_capture_rate

    # 4. Installed production capacity & external export
    installed_capacity_rev = project_cost * turnover_ratio
    export_demand = installed_capacity_rev * export_ratio
    accessible_demand = local_demand + export_demand

    # 5. Operating Monthly Revenue & Profit
    if households == 0 and pop == 0:
        monthly_revenue = export_demand * 0.15
    else:
        monthly_revenue = min(installed_capacity_rev, max(0.08 * installed_capacity_rev, accessible_demand))

    monthly_profit = monthly_revenue * margin_rate

    # 6. Recommended Project Size (Suitability)
    if households > 0:
        sustainable_turnover = (local_demand / (1.0 - export_ratio)) if export_ratio < 1.0 else local_demand
        catchment_supported_cap = sustainable_turnover / turnover_ratio
        recommended_project_size = min(typical_cost, max(75000.0, round(catchment_supported_cap / 25000.0) * 25000.0))
    else:
        recommended_project_size = 50000.0

    # 7. Repayment Burden
    monthly_emi = emi_info["monthly_emi"]
    burden_ratio = (monthly_emi / monthly_profit) if monthly_profit > 0 else 9.99

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
        "monthly_emi": monthly_emi,
        "total_repayment": emi_info["total_repayment"],
        "total_interest": emi_info["total_interest"],
        "estimated_monthly_revenue": round(monthly_revenue, 2),
        "estimated_monthly_profit": round(monthly_profit, 2),
        "repayment_burden_ratio": round(burden_ratio, 3),
        "repayment_burden_category": burden_category,
        "catchment_households": households,
        "catchment_population": pop,
        "monthly_catchment_tam": round(monthly_tam, 2),
    }
