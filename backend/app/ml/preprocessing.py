"""
preprocessing.py

Feature engineering layer for SAKSHAM Rural Micro-Enterprise Intelligence.
Extracts normalized, validated numerical feature vectors from real Census 2011 data,
OSM/survey competitor counts, and category benchmarks.
Handles missing, zero, and out-of-bounds values with robust domain-grounded fallbacks.
"""

from typing import Dict, Any, Optional, List
import numpy as np

from backend.app.db.models import Village, BusinessCategory
from backend.app.engines.feasibility_engine import CATEGORY_BENCHMARKS

DEFAULT_BENCHMARK: Dict[str, Any] = {
    "typical_cost": 300000.0,
    "min_pop": 1500,
    "default_margin": 0.20,
    "monthly_spend_per_hh": 2000.0,
    "turnover_to_capital": 0.22,
    "type": "essential",
}

FEATURE_NAMES: List[str] = [
    "population",
    "household_count",
    "literacy_rate",
    "competitor_count",
    "hh_per_competitor",
    "monthly_tam",
    "capital_margin_ratio",
    "infra_score",
]


def resolve_category_benchmark(category: Optional[Any]) -> Dict[str, Any]:
    """Resolves category benchmark parameters with safe fallback for unknown categories."""
    if not category:
        return DEFAULT_BENCHMARK
    cat_name = getattr(category, "name", str(category)).lower().strip()
    return CATEGORY_BENCHMARKS.get(cat_name, DEFAULT_BENCHMARK)


def compute_infrastructure_score(village: Optional[Village], pop: float) -> float:
    """Calculates infrastructure viability score (40..90) based on sub-district block connectivity and scale."""
    if not village:
        return 65.0

    block_name = ""
    if hasattr(village, "block") and village.block and getattr(village.block, "name", None):
        block_name = village.block.name.lower()

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

    return float(max(40.0, min(90.0, base_infra + infra_adj)))


def extract_features(
    village: Optional[Village],
    category: Optional[BusinessCategory],
    capital_input: Optional[float],
    competitor_count: int = 0,
) -> Dict[str, float]:
    """
    Extracts a dictionary of numerical features from village, category, and capital inputs.
    Gracefully handles None, negative, or invalid values with zero-error guarantees.
    """
    # 1. Population & Households
    raw_pop = getattr(village, "population", 0) if village else 0
    pop = float(max(0, int(raw_pop or 0)))

    raw_hh = getattr(village, "household_count", None) if village else None
    if raw_hh is not None and raw_hh > 0:
        households = float(raw_hh)
    elif pop > 0:
        households = float(round(pop / 6.0))
    else:
        households = 0.0

    # 2. Literacy Rate (0..100 scale, default to district average 55.0% if missing)
    raw_lit = getattr(village, "literacy_rate", None) if village else None
    if raw_lit is None:
        lit_pct = 55.0
    elif raw_lit <= 1.0:
        lit_pct = float(raw_lit * 100.0)
    else:
        lit_pct = float(min(100.0, max(0.0, raw_lit)))

    # 3. Category Benchmark Resolution
    bench = resolve_category_benchmark(category)
    typical_cost = float(bench.get("typical_cost", 300000.0))
    min_margin = typical_cost * 0.10
    monthly_spend = float(bench.get("monthly_spend_per_hh", 2000.0))

    # 4. Capital & Margin Ratio
    cap = float(max(0.0, capital_input or 100000.0))
    margin_ratio = (cap / min_margin) if min_margin > 0 else 1.0
    margin_ratio = float(min(10.0, max(0.0, margin_ratio)))

    # 5. Competitor Density
    comp = float(max(0, int(competitor_count or 0)))
    if comp == 0:
        hh_per_comp = float(min(2000.0, households if households > 0 else 100.0))
    else:
        hh_per_comp = float(households / comp)

    # 6. Monthly TAM Demand
    monthly_tam = float(households * monthly_spend)

    # 7. Infrastructure Viability Score
    infra = compute_infrastructure_score(village, pop)

    return {
        "population": pop,
        "household_count": households,
        "literacy_rate": lit_pct,
        "competitor_count": comp,
        "hh_per_competitor": hh_per_comp,
        "monthly_tam": monthly_tam,
        "capital_margin_ratio": margin_ratio,
        "infra_score": infra,
    }


def features_to_vector(features: Dict[str, float]) -> np.ndarray:
    """Converts the feature dictionary into a 1D numpy array matching FEATURE_NAMES order."""
    return np.array([features.get(k, 0.0) for k in FEATURE_NAMES], dtype=np.float64)


def features_to_2d_array(features: Dict[str, float]) -> np.ndarray:
    """Converts feature dictionary into 2D array of shape (1, n_features)."""
    return features_to_vector(features).reshape(1, -1)
