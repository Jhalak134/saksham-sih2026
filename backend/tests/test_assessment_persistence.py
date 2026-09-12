"""
test_assessment_persistence.py

Comprehensive tests for assessment database persistence, POST vs GET equivalence,
complete report reconstruction, and history category mapping in SAKSHAM.
"""

import pytest
from fastapi.testclient import TestClient

from backend.app.main import app
from backend.app.db.session import SessionLocal
from backend.app.db import models
from backend.app.db.queries import (
    save_assessment,
    get_assessment_by_id,
    list_assessments,
)

client = TestClient(app)


def test_assessment_persistence_roundtrip():
    """Verifies that all rich financial, feasibility, and AI fields are persisted and retrieved."""
    db = SessionLocal()
    try:
        # Create test assessment directly via save_assessment
        saved = save_assessment(
            db=db,
            user_id=1,
            village_id=123579,
            category_id=1,
            capital_input=100000.0,
            fit_score=83.2,
            confidence_level="High",
            project_cost=1000000.0,
            max_loan_amount=900000.0,
            recommended_project_size=350000.0,
            scheme_id=2,
            status="Exploring",
            rating="Highly Feasible",
            competitor_count=0,
            business_idea="Chilling unit test",
            interest_rate=8.0,
            tenure_months=84,
            moratorium_months=6,
            monthly_emi=14834.86,
            total_repayment=1157119.46,
            total_interest=257119.46,
            estimated_monthly_revenue=87500.0,
            estimated_monthly_profit=19250.0,
            repayment_burden_ratio=0.771,
            repayment_burden_category="Critical (>60% of profit)",
            feasibility_breakdown={
                "fit_score": 83.2,
                "rating": "Highly Feasible",
                "confidence_level": "High",
                "breakdown": {"market_size": 85.0, "competition": 95.0},
            },
            ai_insights={
                "explanation": "Persisted AI Explanation",
                "recommendation": "Persisted AI Recommendation",
                "key_points": ["Point 1", "Point 2"],
                "citations": [{"chunk_id": "test_chunk_001", "source": "test.pdf"}],
                "warnings": ["Sample Warning"],
                "limitations": ["Sample Limitation"],
                "grounding_status": "grounded",
            },
        )
        assess_id = saved.id
        db.close()

        # Retrieve via GET API
        resp = client.get(f"/api/v1/assess/{assess_id}")
        assert resp.status_code == 200
        data = resp.json()

        assert data["id"] == assess_id
        assert data["fitScore"] == 83.2
        assert data["fit_score"] == 83.2
        assert data["confidence"] == "High"
        assert data["confidence_level"] == "High"
        assert data["rating"] == "Highly Feasible"
        assert data["competitor_count"] == 0
        assert data["category"]["name"] == "Dairy"
        assert data["category"]["id"] == 1

        # Check financial values
        fin = data["financial"]
        assert fin["available_margin"] == 100000.0
        assert fin["project_cost"] == 1000000.0
        assert fin["max_loan_amount"] == 900000.0
        assert fin["monthly_emi"] == 14834.86
        assert fin["total_repayment"] == 1157119.46
        assert fin["total_interest"] == 257119.46
        assert fin["repayment_burden_category"] == "Critical (>60% of profit)"

        # Check AI insights
        ai = data["ai_insights"]
        assert ai["explanation"] == "Persisted AI Explanation"
        assert ai["recommendation"] == "Persisted AI Recommendation"
        assert ai["citations"][0]["chunk_id"] == "test_chunk_001"
        assert ai["grounding_status"] == "grounded"
    finally:
        db = SessionLocal()
        db.query(models.Assessment).filter(models.Assessment.id == assess_id).delete(synchronize_session=False)
        db.commit()
        db.close()


def test_post_and_get_assessment_equivalence():
    """POST /api/v1/assess and GET /api/v1/assess/{id} must produce equivalent analytical reports."""
    post_resp = client.post("/api/v1/assess", json={
        "location": "Kamar",
        "category": "Dairy",
        "capital": 100000.0,
        "idea": "Dairy milk collection unit"
    })
    assert post_resp.status_code == 200
    post_data = post_resp.json()
    assess_id = post_data["id"]

    try:
        get_resp = client.get(f"/api/v1/assess/{assess_id}")
        assert get_resp.status_code == 200
        get_data = get_resp.json()

        # Check all top-level keys match
        assert set(post_data.keys()) == set(get_data.keys())

        # Check critical fields are identical
        assert post_data["id"] == get_data["id"]
        assert post_data["fitScore"] == get_data["fitScore"]
        assert post_data["fit_score"] == get_data["fit_score"]
        assert post_data["confidence"] == get_data["confidence"]
        assert post_data["rating"] == get_data["rating"]
        assert post_data["competitor_count"] == get_data["competitor_count"]
        assert post_data["category"] == get_data["category"]
        assert post_data["scheme"] == get_data["scheme"]
        assert post_data["financial"] == get_data["financial"]
        assert post_data["ai_insights"] == get_data["ai_insights"]
        assert post_data["recommendation"] == get_data["recommendation"]
    finally:
        db = SessionLocal()
        db.query(models.Assessment).filter(models.Assessment.id == assess_id).delete(synchronize_session=False)
        db.commit()
        db.close()


def test_history_category_and_scheme_mapping():
    """GET /api/v1/assess/history must accurately report business category and not conflate it with scheme."""
    # Create assessment for Retail
    resp_retail = client.post("/api/v1/assess", json={
        "location": "Kamar",
        "category": "Retail",
        "capital": 50000.0,
        "idea": "Grocery and general store"
    })
    assert resp_retail.status_code == 200
    retail_id = resp_retail.json()["id"]

    # Create assessment for Dairy
    resp_dairy = client.post("/api/v1/assess", json={
        "location": "Kamar",
        "category": "Dairy",
        "capital": 100000.0,
        "idea": "Dairy milk collection unit"
    })
    assert resp_dairy.status_code == 200
    dairy_id = resp_dairy.json()["id"]

    try:
        hist_resp = client.get("/api/v1/assess/history?limit=10")
        assert hist_resp.status_code == 200
        items = hist_resp.json()

        item_dairy = next((it for it in items if it["id"] == dairy_id), None)
        item_retail = next((it for it in items if it["id"] == retail_id), None)

        assert item_dairy is not None
        assert item_dairy["category_name"] == "Dairy"
        assert item_dairy["scheme_name"] == "Term Loan Scheme"
        assert item_dairy["category_name"] != item_dairy["scheme_name"]

        assert item_retail is not None
        assert item_retail["category_name"] == "Retail"
        assert item_retail["scheme_name"] == "Term Loan Scheme"
        assert item_retail["category_name"] != item_retail["scheme_name"]
    finally:
        db = SessionLocal()
        db.query(models.Assessment).filter(models.Assessment.id.in_([retail_id, dairy_id])).delete(synchronize_session=False)
        db.commit()
        db.close()


def test_legacy_assessment_compatibility():
    """Legacy assessment records with NULL rich columns return graceful defaults without crashing."""
    db = SessionLocal()
    try:
        legacy = models.Assessment(
            id=99901,
            user_id=1,
            village_id=123579,
            category_id=1,
            capital_input=50000.0,
            fit_score=72.0,
            confidence_level="Medium",
            project_cost=500000.0,
            max_loan_amount=450000.0,
            recommended_project_size=175000.0,
            scheme_id=1,
            status="Exploring",
            # rich columns are deliberately omitted (NULL)
        )
        db.add(legacy)
        db.commit()
        db.close()

        resp = client.get("/api/v1/assess/99901")
        assert resp.status_code == 200
        data = resp.json()

        assert data["id"] == 99901
        assert data["fitScore"] == 72.0
        assert data["category"]["name"] == "Dairy"
        assert data["scheme"]["name"] == "Micro Finance Scheme"
        assert data["financial"]["project_cost"] == 500000.0
        assert data["financial"]["monthly_emi"] is None
        assert data["ai_insights"] is None
        assert data["recommendation"] == ""
    finally:
        db = SessionLocal()
        db.query(models.Assessment).filter(models.Assessment.id == 99901).delete(synchronize_session=False)
        db.commit()
        db.close()


def test_get_assessment_not_found():
    """Non-existent assessment ID returns 404."""
    resp = client.get("/api/v1/assess/99999999")
    assert resp.status_code == 404
    assert resp.json()["detail"] == "Assessment not found."
