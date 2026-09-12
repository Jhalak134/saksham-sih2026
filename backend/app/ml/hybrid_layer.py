"""
hybrid_layer.py

Hybrid Decision Layer for SAKSHAM Feasibility Scoring.
Combines:
1. Grounded, explainable 4-factor rule-based Fit Score (Primary statutory baseline)
2. Unsupervised ML catchment cluster archetype & peer opportunity index
Preserves 100% backward compatibility with existing API response schema.
"""

from typing import Dict, Any, Optional
import logging

from backend.app.db.models import Village, BusinessCategory
from backend.app.engines.feasibility_engine import evaluate_feasibility
from backend.app.ml.preprocessing import extract_features
from backend.app.ml.model import predict_catchment_cluster

logger = logging.getLogger("saksham.ml.hybrid")


def compute_hybrid_feasibility(
    village: Optional[Village],
    category: Optional[BusinessCategory],
    capital_input: float,
    competitor_count: int = 0,
    idea: Optional[str] = None,
    rule_result: Optional[Dict[str, Any]] = None,
) -> Dict[str, Any]:
    """
    Computes hybrid feasibility evaluation.
    Always preserves exact rule engine metrics (fit_score, rating, confidence_level, breakdown, risks).
    Safely enriches with ml_analysis when ML model is active.
    """
    # 1. Compute or reuse deterministic rule-based feasibility baseline
    if rule_result is not None:
        res = dict(rule_result)
    else:
        res = evaluate_feasibility(
            village=village,
            category=category,
            capital_input=capital_input,
            competitor_count=competitor_count,
            idea=idea,
        )

    # 2. Extract features and compute ML catchment analysis
    try:
        features = extract_features(
            village=village,
            category=category,
            capital_input=capital_input,
            competitor_count=competitor_count,
        )
        ml_res = predict_catchment_cluster(features)
    except Exception as err:
        logger.warning(f"Feature extraction / ML inference skipped: {err}")
        ml_res = None

    # 3. Enrich result safely
    res["ml_analysis"] = ml_res
    return res
