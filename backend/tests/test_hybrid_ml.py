"""
test_hybrid_ml.py

Comprehensive test suite verifying the Hybrid Rule-Based + ML Architecture.
Tests all 12 required scenarios:
1. Normal village
2. Missing population (None / 0)
3. Missing household count (imputed from population)
4. Zero competitors
5. Multiple competitors
6. Low capital (below 10% statutory margin)
7. High capital (comfortable cushion)
8. Different business categories (Dairy, Textiles, Agriculture)
9. Unknown business category (fallback benchmark)
10. Missing ML model artifact (clean rule fallback)
11. ML prediction failure / corrupt artifact (graceful error handling)
12. Insufficient ML data / empty village features
"""

import pytest
from unittest.mock import patch
import numpy as np

from backend.app.db.models import Village, BusinessCategory
from backend.app.engines.feasibility_engine import evaluate_feasibility
from backend.app.ml.preprocessing import (
    extract_features,
    features_to_vector,
    resolve_category_benchmark,
    FEATURE_NAMES,
)
from backend.app.ml.model import (
    predict_catchment_cluster,
    get_model_artifact,
    is_ml_available,
)
from backend.app.ml.hybrid_layer import compute_hybrid_feasibility


@pytest.fixture
def normal_village():
    return Village(
        id=1001,
        name="Kamar",
        population=7031,
        household_count=1153,
        literacy_rate=53.6,
    )


@pytest.fixture
def dairy_category():
    return BusinessCategory(
        id=1,
        name="Dairy",
        icon="milk",
        is_seasonal=False,
    )


# 1. Normal Village
def test_normal_village_hybrid(normal_village, dairy_category):
    res = compute_hybrid_feasibility(
        village=normal_village,
        category=dairy_category,
        capital_input=100000.0,
        competitor_count=1,
    )
    assert res["fit_score"] > 0
    assert "breakdown" in res
    assert "scoring_rationale" in res
    assert "risks" in res
    assert res["ml_analysis"] is not None
    assert res["ml_analysis"]["method"] == "kmeans_catchment_clustering"
    assert "cluster_name" in res["ml_analysis"]
    assert "opportunity_index" in res["ml_analysis"]


# 2. Missing Population
def test_missing_population(dairy_category):
    v_no_pop = Village(id=1002, name="Deserted Hamlet", population=None, household_count=None, literacy_rate=None)
    res = compute_hybrid_feasibility(
        village=v_no_pop,
        category=dairy_category,
        capital_input=50000.0,
        competitor_count=0,
    )
    assert res["fit_score"] >= 0
    assert res["confidence_level"] == "Low"
    assert res["ml_analysis"] is not None
    assert res["ml_analysis"]["cluster_id"] in [0, 1, 2, 3]


# 3. Missing Household Count (Imputed)
def test_missing_household_count_imputation(dairy_category):
    v_no_hh = Village(id=1003, name="Populated Village", population=3000, household_count=None, literacy_rate=60.0)
    feats = extract_features(v_no_hh, dairy_category, 100000.0, 0)
    assert feats["household_count"] == 500.0  # round(3000 / 6)
    res = compute_hybrid_feasibility(v_no_hh, dairy_category, 100000.0, 0)
    assert res["fit_score"] > 0
    assert res["ml_analysis"] is not None


# 4. Zero Competitors
def test_zero_competitors(normal_village, dairy_category):
    res = compute_hybrid_feasibility(normal_village, dairy_category, 100000.0, competitor_count=0)
    assert res["breakdown"]["competition"] == 95.0
    assert res["ml_analysis"] is not None
    assert "Undersaturated" in res["ml_analysis"]["relative_saturation"]


# 5. Multiple Competitors
def test_multiple_competitors(normal_village, dairy_category):
    res = compute_hybrid_feasibility(normal_village, dairy_category, 100000.0, competitor_count=6)
    assert res["breakdown"]["competition"] < 95.0
    assert any(r["category"] == "Market" for r in res["risks"])
    assert res["ml_analysis"] is not None


# 6. Low Capital (< statutory margin)
def test_low_capital_triggers_risk(normal_village, dairy_category):
    # Dairy typical cost 350,000 -> 10% min margin is 35,000
    res = compute_hybrid_feasibility(normal_village, dairy_category, capital_input=15000.0, competitor_count=0)
    assert res["breakdown"]["capital_fit"] <= 52.0
    assert any(r["category"] == "Capital" for r in res["risks"])


# 7. High Capital
def test_high_capital_strong_score(normal_village, dairy_category):
    res = compute_hybrid_feasibility(normal_village, dairy_category, capital_input=200000.0, competitor_count=0)
    assert res["breakdown"]["capital_fit"] == 90.0


# 8. Different Business Categories
def test_different_business_categories(normal_village):
    cat_textiles = BusinessCategory(id=2, name="Textiles", icon="shirt", is_seasonal=False)
    cat_agri = BusinessCategory(id=3, name="Agriculture", icon="sprout", is_seasonal=True)

    res_textiles = compute_hybrid_feasibility(normal_village, cat_textiles, 100000.0, 0)
    res_agri = compute_hybrid_feasibility(normal_village, cat_agri, 100000.0, 0)

    assert res_textiles["fit_score"] > 0
    assert res_agri["fit_score"] > 0
    assert any(r["category"] == "Seasonality" for r in res_agri["risks"])


# 9. Unknown Category (Graceful benchmark fallback)
def test_unknown_category_fallback(normal_village):
    cat_unknown = BusinessCategory(id=999, name="Quantum Superconducting Devices", icon="cpu", is_seasonal=False)
    bench = resolve_category_benchmark(cat_unknown)
    assert bench["typical_cost"] > 0
    res = compute_hybrid_feasibility(normal_village, cat_unknown, 100000.0, 0)
    assert res["fit_score"] > 0
    assert res["ml_analysis"] is not None


# 10. Missing ML Model (Fallback to pure rule engine)
def test_missing_ml_model_fallback(normal_village, dairy_category):
    with patch("backend.app.ml.model.get_model_artifact", return_value=None):
        res = compute_hybrid_feasibility(normal_village, dairy_category, 100000.0, 0)
        # Rule engine works identically
        assert res["fit_score"] >= 70.0
        assert res["confidence_level"] == "High"
        assert res["breakdown"]["competition"] == 95.0
        assert res["ml_analysis"] is None


# 11. ML Prediction Failure (Corrupt feature / exception fallback)
def test_ml_prediction_failure_fallback(normal_village, dairy_category):
    with patch("backend.app.ml.hybrid_layer.predict_catchment_cluster", side_effect=RuntimeError("Corrupt weights")):
        res = compute_hybrid_feasibility(normal_village, dairy_category, 100000.0, 0)
        assert res["fit_score"] >= 70.0
        assert res["ml_analysis"] is None


# 12. Insufficient ML Data (All None inputs)
def test_insufficient_ml_data():
    res = compute_hybrid_feasibility(
        village=None,
        category=None,
        capital_input=0.0,
        competitor_count=0,
    )
    assert res["fit_score"] >= 0.0
    assert "breakdown" in res
