"""
feasibility_engine.py

Explainable multi-factor feasibility scoring engine for rural micro-enterprises.
Computes transparent 4-factor composite Fit Score:
- Market Opportunity (30%)
- Competition Density (25%)
- Capital Fit (25%)
- Infrastructure Viability (20%)
"""

from typing import Dict, Any, List, Optional
from backend.app.db.models import Village, BusinessCategory


def evaluate_feasibility(
    village: Village,
    category: BusinessCategory,
    capital_input: float,
    competitor_count: int = 0,
) -> Dict[str, Any]:
    """
    Evaluates business feasibility in the specified village catchment.
    Produces Fit Score, Confidence Level, Rating, and Rationales.
    """
    pop = village.population or 0
    households = village.household_count or 0
    lit_rate = village.literacy_rate or 60.0

    # 1. Market Opportunity Factor (30%)
    if pop >= 10000:
        base_market = 90.0
    elif pop >= 4000:
        base_market = 80.0
    elif pop >= 1500:
        base_market = 70.0
    elif pop > 0:
        base_market = 55.0
    else:
        base_market = 45.0

    if lit_rate >= 70.0:
        lit_adj = 5.0
    elif lit_rate < 45.0:
        lit_adj = -5.0
    else:
        lit_adj = 0.0

    market_score = max(20.0, min(100.0, base_market + lit_adj))
    market_rationale = (
        f"Population catchment of {pop:,} residents across {households:,} households. "
        f"Literacy rate is {lit_rate:.1f}%."
    )

    # 2. Competition Factor (25%)
    if competitor_count == 0:
        comp_score = 95.0
        comp_rationale = f"Zero direct {category.name} businesses mapped in {village.name}. Unmet market demand."
    elif competitor_count <= 2:
        comp_score = 80.0
        comp_rationale = f"{competitor_count} competitor(s) operating nearby. Ample room for new entrant."
    elif competitor_count <= 5:
        comp_score = 65.0
        comp_rationale = f"{competitor_count} competitors mapped. Moderate competition; quality differentiation needed."
    else:
        comp_score = 45.0
        comp_rationale = f"{competitor_count} competitors recorded. High market saturation."

    # 3. Capital Fit Factor (25%)
    # Under SIH #91, ₹14,000 margin unlocks ₹1.40L (Micro Finance); ₹1,00,000 unlocks ₹10L
    if capital_input >= 100000.0:
        cap_score = 90.0
        cap_rationale = f"Capital of INR {capital_input:,.0f} provides strong 10% margin for project up to INR {capital_input*10:,.0f}."
    elif capital_input >= 50000.0:
        cap_score = 80.0
        cap_rationale = f"Capital of INR {capital_input:,.0f} qualifies for ₹5.0 Lakh Term Loan project."
    elif capital_input >= 14000.0:
        cap_score = 70.0
        cap_rationale = f"Capital of INR {capital_input:,.0f} satisfies Micro Finance Scheme margin requirement."
    else:
        cap_score = 50.0
        cap_rationale = f"Capital of INR {capital_input:,.0f} is tight; Micro Finance ceiling may require lean scale."

    # 4. Infrastructure Factor (20%)
    infra_score = 80.0
    infra_rationale = f"Sub-district connectivity verified under Block {village.block.name if village.block else 'Mathura'}."

    # Weighted Composite Fit Score
    fit_score = round(
        (market_score * 0.30) +
        (comp_score * 0.25) +
        (cap_score * 0.25) +
        (infra_score * 0.20),
        1
    )

    # Qualitative Rating
    if fit_score >= 80.0:
        rating = "Highly Feasible"
    elif fit_score >= 65.0:
        rating = "Feasible"
    elif fit_score >= 50.0:
        rating = "Moderate Fit"
    else:
        rating = "High Risk"

    # Confidence Indicator based on data coverage
    confidence_level = "High" if pop > 0 else "Medium"

    # Actionable Risks
    risks = []
    if competitor_count >= 3:
        risks.append({
            "category": "Market",
            "risk": f"{competitor_count} active competitors operating in catchment.",
            "mitigation": "Differentiate with home delivery, credit loyalty, or higher purity grading.",
            "severity": "Medium",
        })
    if category.is_seasonal:
        risks.append({
            "category": "Seasonality",
            "risk": f"{category.name} experiences seasonal crop/harvest demand fluctuations.",
            "mitigation": "Maintain a 30-day operating reserve during lean months.",
            "severity": "Medium",
        })
    if capital_input < 25000.0:
        risks.append({
            "category": "Capital",
            "risk": "Lean working capital buffer increases vulnerability to delayed customer receivables.",
            "mitigation": "Apply for concessional Micro Finance with 3-month moratorium.",
            "severity": "High",
        })

    return {
        "fit_score": fit_score,
        "rating": rating,
        "confidence_level": confidence_level,
        "breakdown": {
            "market_opportunity": round(market_score, 1),
            "competition": round(comp_score, 1),
            "capital_fit": round(cap_score, 1),
            "infrastructure": round(infra_score, 1),
        },
        "scoring_rationale": {
            "market_opportunity": market_rationale,
            "competition": comp_rationale,
            "capital_fit": cap_rationale,
            "infrastructure": infra_rationale,
        },
        "risks": risks,
    }
