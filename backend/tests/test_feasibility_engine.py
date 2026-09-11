import pytest
from backend.app.engines.feasibility_engine import evaluate_feasibility
from backend.app.db.models import Village, BusinessCategory


def test_feasibility_evaluation_positive():
    """Verify feasibility calculation for high population village with zero competitors."""
    dummy_v = Village(
        id=123579,
        name="Kamar",
        population=7031,
        household_count=1153,
        literacy_rate=53.6,
    )
    dummy_cat = BusinessCategory(
        id=1,
        name="Dairy",
        icon="milk",
        is_seasonal=False,
    )

    res = evaluate_feasibility(
        village=dummy_v,
        category=dummy_cat,
        capital_input=100000.0,
        competitor_count=0,
    )

    assert res["fit_score"] >= 70.0
    assert res["confidence_level"] == "High"
    assert res["breakdown"]["competition"] == 95.0
    assert "scoring_rationale" in res
