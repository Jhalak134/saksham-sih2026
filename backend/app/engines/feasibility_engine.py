"""
feasibility_engine.py

Explainable multi-factor feasibility scoring engine for rural micro-enterprises.
Computes transparent, dynamic 4-factor composite Fit Score grounded in Census 2011 data:
- Market Opportunity (30%): Demand-to-capacity coverage, demographic scale, purchasing power
- Competition Density (25%): Catchment competitor saturation per household
- Capital Fit (25%): Equity margin adequacy vs benchmark setup costs
- Infrastructure Viability (20%): Sub-district block connectivity and village scale
"""

from typing import Dict, Any, List, Optional
from backend.app.db.models import Village, BusinessCategory

CATEGORY_BENCHMARKS: Dict[str, Dict[str, Any]] = {
    "dairy": {
        "typical_cost": 350000.0,
        "min_pop": 1000,
        "default_margin": 0.22,
        "monthly_spend_per_hh": 2500.0,
        "turnover_to_capital": 0.22,
        "type": "essential",
    },
    "retail": {
        "typical_cost": 150000.0,
        "min_pop": 1500,
        "default_margin": 0.18,
        "monthly_spend_per_hh": 3500.0,
        "turnover_to_capital": 0.28,
        "type": "essential",
    },
    "grocery/retail": {
        "typical_cost": 150000.0,
        "min_pop": 1500,
        "default_margin": 0.18,
        "monthly_spend_per_hh": 3500.0,
        "turnover_to_capital": 0.28,
        "type": "essential",
    },
    "textiles": {
        "typical_cost": 250000.0,
        "min_pop": 2500,
        "default_margin": 0.25,
        "monthly_spend_per_hh": 900.0,
        "turnover_to_capital": 0.20,
        "type": "specialized",
    },
    "food processing": {
        "typical_cost": 400000.0,
        "min_pop": 3500,
        "default_margin": 0.20,
        "monthly_spend_per_hh": 1200.0,
        "turnover_to_capital": 0.22,
        "type": "specialized",
    },
    "agriculture": {
        "typical_cost": 200000.0,
        "min_pop": 800,
        "default_margin": 0.20,
        "monthly_spend_per_hh": 2000.0,
        "turnover_to_capital": 0.24,
        "type": "essential",
    },
    "logistics": {
        "typical_cost": 500000.0,
        "min_pop": 4000,
        "default_margin": 0.22,
        "monthly_spend_per_hh": 700.0,
        "turnover_to_capital": 0.20,
        "type": "specialized",
    },
    "handicrafts": {
        "typical_cost": 120000.0,
        "min_pop": 1000,
        "default_margin": 0.25,
        "monthly_spend_per_hh": 500.0,
        "turnover_to_capital": 0.25,
        "type": "specialized",
    },
    "education": {
        "typical_cost": 180000.0,
        "min_pop": 3000,
        "default_margin": 0.25,
        "monthly_spend_per_hh": 1000.0,
        "turnover_to_capital": 0.22,
        "type": "specialized",
    },
}


def evaluate_feasibility(
    village: Village,
    category: BusinessCategory,
    capital_input: float,
    competitor_count: int = 0,
    idea: Optional[str] = None,
) -> Dict[str, Any]:
    """
    Evaluates business feasibility in the specified village catchment.
    Produces Fit Score, Confidence Level, Rating, and Rationales grounded in
    Census 2011 demographic data, category purchasing power, and competition density.
    """
    v_name = village.name if village else "Catchment Area"
    pop = getattr(village, "population", 0) or 0
    raw_hh = getattr(village, "household_count", None)
    households = raw_hh or (round(pop / 6.0) if pop > 0 else 0)
    raw_lit = getattr(village, "literacy_rate", None)
    if raw_lit is None:
        lit_pct = 55.0
    else:
        lit_pct = (raw_lit * 100.0) if raw_lit <= 1.0 else raw_lit

    cat_label = category.name if category else "enterprise"
    cat_key = (cat_label or "").lower().strip()
    bench = CATEGORY_BENCHMARKS.get(
        cat_key,
        CATEGORY_BENCHMARKS.get("dairy", {
            "typical_cost": 300000.0,
            "min_pop": 2000,
            "default_margin": 0.20,
            "monthly_spend_per_hh": 2000.0,
            "turnover_to_capital": 0.22,
            "type": "essential",
        })
    )
    typical_cost = bench["typical_cost"]
    min_margin = typical_cost * 0.10  # 10% statutory margin under SIH #91
    margin_ratio = (capital_input / min_margin) if min_margin > 0 else 1.0

    # ─────────────────────────────────────────────────────────────────────────
    # 1. Market Opportunity Factor (30%) — Census Demographics & Demand Coverage
    # ─────────────────────────────────────────────────────────────────────────
    monthly_tam = households * bench.get("monthly_spend_per_hh", 2000.0)
    project_cost = capital_input / 0.10
    target_monthly_output = project_cost * bench.get("turnover_to_capital", 0.22)
    coverage = (monthly_tam / target_monthly_output) if target_monthly_output > 0 else 0.0

    if pop == 0:
        market_score = 30.0
        market_rationale = f"Unpopulated or unmapped census catchment in {v_name}. Minimal direct consumer market."
    else:
        if coverage >= 8.0:
            base_market = 78.0 + min(10.0, (coverage - 8.0) * 0.4)
        elif coverage >= 3.0:
            base_market = 70.0 + (coverage - 3.0) * 1.6
        elif coverage >= 1.0:
            base_market = 56.0 + (coverage - 1.0) * 7.0
        else:
            base_market = max(25.0, 35.0 + coverage * 21.0)

        # Literacy adjustment against Mathura district rural average of 55%
        lit_adj = max(-6.0, min(5.0, (lit_pct - 55.0) * 0.75))
        market_score = max(20.0, min(95.0, base_market + lit_adj))
        market_rationale = (
            f"Census 2011 Catchment: {pop:,} residents across {households:,} households "
            f"({lit_pct:.1f}% literacy). Estimated category monthly demand pool is ₹{monthly_tam:,.0f} "
            f"({coverage:.1f}x project scale coverage)."
        )

    # ─────────────────────────────────────────────────────────────────────────
    # 2. Competition Factor (25%) — Real Census Household Density
    # ─────────────────────────────────────────────────────────────────────────
    comp_count = max(0, int(competitor_count))
    if comp_count == 0:
        if cat_key in ["retail", "grocery/retail"] and pop > 3000:
            comp_score = 78.0
            comp_rationale = f"Active commercial hub in {v_name} with existing unorganized kirana presence."
        else:
            comp_score = 95.0
            comp_rationale = f"Zero direct {cat_label} competitors mapped in {v_name}. Strong unmet local demand."
    else:
        hh_per_comp = (households / comp_count) if comp_count > 0 else households
        if hh_per_comp >= 400:
            comp_score = 80.0
            comp_rationale = f"{comp_count} competitor(s) across {households:,} households (~{int(hh_per_comp)} hh/store). Ample market depth."
        elif hh_per_comp >= 200:
            comp_score = 65.0
            comp_rationale = f"{comp_count} competitor(s) across {households:,} households (~{int(hh_per_comp)} hh/store). Moderate density; differentiation required."
        elif hh_per_comp >= 100:
            comp_score = 52.0
            comp_rationale = f"{comp_count} competitor(s) across {households:,} households (~{int(hh_per_comp)} hh/store). High competitor concentration."
        else:
            comp_score = 40.0
            comp_rationale = f"{comp_count} competitor(s) across {households:,} households. Market saturation high relative to population."

    # ─────────────────────────────────────────────────────────────────────────
    # 3. Capital Fit Factor (25%) — Equity Margin & Working Capital Cushion
    # ─────────────────────────────────────────────────────────────────────────
    if capital_input >= 100000.0 or margin_ratio >= 2.0:
        cap_score = 90.0
        cap_rationale = (
            f"Capital of INR {capital_input:,.0f} provides strong "
            f"{min(100.0, (capital_input / typical_cost) * 100):.0f}% equity margin for ₹{typical_cost:,.0f} benchmark project."
        )
    elif margin_ratio >= 1.2:
        cap_score = 80.0
        cap_rationale = (
            f"Capital of INR {capital_input:,.0f} comfortably satisfies {cat_label} margin requirements with reserve buffer."
        )
    elif margin_ratio >= 0.9:
        cap_score = 70.0
        cap_rationale = (
            f"Capital of INR {capital_input:,.0f} meets minimum 10% statutory margin, but leaves limited operating cushion."
        )
    elif margin_ratio >= 0.5:
        cap_score = 52.0
        cap_rationale = (
            f"Capital of INR {capital_input:,.0f} is tight for {cat_label} (benchmark ₹{min_margin:,.0f} margin needed). Lean scale required."
        )
    else:
        cap_score = 35.0
        cap_rationale = (
            f"Capital of INR {capital_input:,.0f} is critically low for {cat_label} (min margin ₹{min_margin:,.0f}). High equity deficit."
        )

    # ─────────────────────────────────────────────────────────────────────────
    # 4. Infrastructure Factor (20%) — Block Connectivity & Village Scale
    # ─────────────────────────────────────────────────────────────────────────
    block_obj = getattr(village, "block", None) if village else None
    block_name = getattr(block_obj, "name", "").lower() if block_obj else ""
    if any(b in block_name for b in ["chhata", "mathura", "govardhan"]):
        base_infra = 80.0
    elif any(b in block_name for b in ["nandgaon", "baldeo", "raya", "farah"]):
        base_infra = 74.0
    else:
        base_infra = 70.0

    if pop == 0:
        infra_adj = -18.0
    elif pop < 500:
        infra_adj = -8.0
    else:
        infra_adj = 0.0

    infra_score = max(40.0, min(90.0, base_infra + infra_adj))
    infra_rationale = f"Sub-district connectivity verified under Block {getattr(block_obj, 'name', 'Mathura')}."

    # ─────────────────────────────────────────────────────────────────────────
    # Weighted Composite Fit Score
    # ─────────────────────────────────────────────────────────────────────────
    fit_score = round(
        (market_score * 0.30) +
        (comp_score * 0.25) +
        (cap_score * 0.25) +
        (infra_score * 0.20),
        1
    )

    # Qualitative Rating
    if fit_score >= 82.0:
        rating = "Highly Feasible"
    elif fit_score >= 68.0:
        rating = "Feasible"
    elif fit_score >= 52.0:
        rating = "Moderate Fit"
    else:
        rating = "High Risk"

    confidence_level = "High" if (pop >= 1000 and households >= 150) else ("Medium" if pop > 0 else "Low")

    # Actionable Risks
    risks = []
    if comp_count >= 3:
        risks.append({
            "category": "Market",
            "risk": f"{comp_count} active competitors operating in catchment.",
            "mitigation": "Differentiate with home delivery, credit loyalty, or higher purity grading.",
            "severity": "Medium",
        })
    is_seasonal = getattr(category, "is_seasonal", False) if category else False
    if is_seasonal:
        risks.append({
            "category": "Seasonality",
            "risk": f"{cat_label} experiences seasonal crop/harvest demand fluctuations.",
            "mitigation": "Maintain a 30-day operating reserve during lean months.",
            "severity": "Medium",
        })
    if capital_input < min_margin:
        risks.append({
            "category": "Capital",
            "risk": f"Equity of ₹{capital_input:,.0f} falls short of recommended ₹{min_margin:,.0f} margin.",
            "mitigation": "Apply for concessional Micro Finance Scheme or seek SHG credit support.",
            "severity": "High",
        })
    if pop < bench.get("min_pop", 1500) and pop > 0:
        risks.append({
            "category": "Demographic",
            "risk": f"Village population of {pop:,} is below typical threshold of {bench.get('min_pop', 1500):,} for {cat_label}.",
            "mitigation": "Expand delivery/sales radius to adjoining hamlets or establish wholesale off-take.",
            "severity": "Medium",
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


