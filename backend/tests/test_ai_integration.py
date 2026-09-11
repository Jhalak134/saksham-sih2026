"""test_ai_integration.py

Comprehensive tests verifying the Task 8B Main Backend <-> AI Service integration:
- AI client request formatting and payload building
- Zero PII propagation to AI
- Financial value integrity (AI text never alters deterministic figures)
- Provenance, citations, limitations, warnings preservation
- Graceful deterministic fallback when AI service is offline, times out, or fails
- Direct AI gateway route (/api/v1/ai/query) behavior and error handling
"""

import unittest.mock as mock
import pytest
import httpx
from fastapi.testclient import TestClient

from backend.app.main import app
from backend.app.clients.ai_client import AIClient, ai_client

client = TestClient(app)


def _sample_ai_response():
    """Factory for realistic Task 7 QueryResponse payload."""
    return {
        "query": "Evaluate dairy enterprise in Kamar",
        "parsed_query": {
            "raw_query": "Evaluate dairy enterprise in Kamar",
            "intent": "feasibility_inquiry",
            "business_category": "dairy",
            "geography": {
                "district": "Mathura",
                "state": "Uttar Pradesh",
                "village": "Kamar",
                "block": "Chhata",
            },
            "loan_amount": 900000.0,
            "own_capital": 100000.0,
            "purpose": "dairy unit",
            "scheme": "Term Loan Scheme",
            "missing_fields": [],
            "is_ambiguous": False,
        },
        "retrieval_status": "success",
        "evidence_available": True,
        "result_count": 2,
        "explanation": "Official records indicate viable dairy operations under the Term Loan Scheme with 10% margin.",
        "explanation_detail": {
            "answer": "Official records indicate viable dairy operations under the Term Loan Scheme with 10% margin.",
            "key_points": [
                "10% margin enables ₹9,00,000 borrowing under Term Loan Scheme.",
                "Village Kamar has verified connectivity in Chhata block.",
            ],
            "citations": [
                {
                    "chunk_id": "dairy_yogurt_plant_project_report_p003_c001",
                    "document_id": "dairy_yogurt_plant_project_report",
                    "source": "Dairy Pre-Feasibility Report",
                    "page_start": 3,
                    "page_end": 4,
                },
                {
                    "chunk_id": "mathura_district_industrial_profile_p005_c002",
                    "document_id": "mathura_district_industrial_profile",
                    "source": "Mathura Industrial Profile",
                    "page_start": 5,
                    "page_end": 6,
                },
            ],
            "limitations": ["Dairy figures represent reference template benchmarks."],
            "warnings": ["Ensure local milk collection chilling arrangements."],
            "evidence_used": ["dairy_yogurt_plant_project_report_p003_c001"],
            "grounding_status": "fully_grounded",
            "language": "en",
        },
        "citations": [
            {
                "chunk_id": "dairy_yogurt_plant_project_report_p003_c001",
                "document_id": "dairy_yogurt_plant_project_report",
                "source": "Dairy Pre-Feasibility Report",
                "page_start": 3,
                "page_end": 4,
            }
        ],
        "limitations": ["Dairy figures represent reference template benchmarks."],
        "warnings": ["Ensure local milk collection chilling arrangements."],
        "grounding_status": "fully_grounded",
        "language": "en",
    }


# ─── 1. AI Client Request Formatting & Successful Response ───────────────────

@pytest.mark.anyio
async def test_ai_client_request_formatting_and_success():
    """Verify query builder, calculation payload, and success response mapping."""
    test_client_instance = AIClient(base_url="http://test-ai:8001", timeout=3.0, default_top_k=5)
    mock_resp = mock.MagicMock(spec=httpx.Response)
    mock_resp.status_code = 200
    mock_resp.json.return_value = _sample_ai_response()

    with mock.patch("httpx.AsyncClient.post", new_callable=mock.AsyncMock) as mock_post:
        mock_post.return_value = mock_resp

        result = await test_client_instance.get_assessment_insights(
            idea="Commercial dairy chilling facility",
            category_name="Dairy",
            village_name="Kamar",
            fit_score=82.5,
            rating="Highly Feasible",
            project_cost=1000000.0,
            loan_amount=900000.0,
            scheme_name="Term Loan Scheme",
            monthly_emi=14945.32,
            interest_rate=8.0,
            tenure_months=84,
            moratorium_months=6,
            repayment_burden_category="Critical (>60% of profit)",
            language="en",
        )

        assert mock_post.called
        call_url = mock_post.call_args[0][0]
        call_json = mock_post.call_args[1]["json"]

        assert call_url == "http://test-ai:8001/query"
        assert "Commercial dairy chilling facility" in call_json["query"]
        assert "Kamar" in call_json["query"]
        assert call_json["language"] == "en"
        assert call_json["top_k"] == 5

        # Calculations nested correctly
        calcs = call_json["calculations"]
        assert calcs["project_cost"] == 1000000.0
        assert calcs["max_loan_amount"] == 900000.0
        assert calcs["monthly_emi"] == 14945.32
        assert calcs["scheme_name"] == "Term Loan Scheme"
        assert calcs["interest_rate"] == 8.0
        assert calcs["tenure_months"] == 84
        assert calcs["moratorium_months"] == 6
        assert calcs["fit_score"] == 82.5
        assert calcs["rating"] == "Highly Feasible"

        # Result structure
        assert result["available"] is True
        assert result["source"] == "ai_service"
        assert "Official records indicate viable dairy operations" in result["explanation"]
        assert len(result["citations"]) >= 1
        assert result["citations"][0]["chunk_id"] == "dairy_yogurt_plant_project_report_p003_c001"
        assert result["grounding_status"] == "fully_grounded"
        assert result["evidence_available"] is True


def test_ai_client_query_builder_fallbacks():
    """Verify query builder with generic or empty idea."""
    q1 = AIClient.build_assessment_query(
        idea="Rural micro-enterprise unit",
        category_name="Retail",
        village_name="Kamar",
        margin=14000.0,
    )
    assert "setting up a Retail unit in village Kamar" in q1
    assert "Rural micro-enterprise unit" not in q1

    q2 = AIClient.build_assessment_query(
        idea=None,
        category_name="Textiles",
        village_name="Kamar",
        margin=25000.0,
    )
    assert "setting up a Textiles unit in village Kamar" in q2


# ─── 2. Client Validation & Error Handling ────────────────────────────────────

@pytest.mark.anyio
async def test_ai_client_empty_whitespace_query():
    """Empty or whitespace query is rejected locally without network call."""
    res = await ai_client.query_ai_service(query="   \t   ")
    assert res["available"] is False
    assert res["source"] == "client_validation_error"
    assert res["evidence_available"] is False


@pytest.mark.anyio
async def test_ai_client_offline_fallback_english_and_hindi():
    """Verify fallback behavior when AI service is offline."""
    with mock.patch("httpx.AsyncClient.post", new_callable=mock.AsyncMock) as mock_post:
        mock_post.side_effect = httpx.ConnectError("Connection refused")

        # English high fit score
        res_en = await ai_client.get_assessment_insights(
            idea="Dairy farm",
            category_name="Dairy",
            village_name="Kamar",
            fit_score=82.5,
            rating="Highly Feasible",
            project_cost=1000000.0,
            loan_amount=900000.0,
            scheme_name="Term Loan Scheme",
            monthly_emi=14945.32,
            language="en",
        )
        assert res_en["available"] is False
        assert res_en["source"] == "deterministic_fallback"
        assert "strong economic viability" in res_en["explanation"]
        assert res_en["citations"] == []
        assert res_en["grounding_status"] == "unverified"

        # English moderate fit score
        res_mod = ai_client._build_deterministic_fallback(
            category_name="Retail",
            village_name="Kamar",
            fit_score=60.0,
            scheme_name="Micro Finance Scheme",
            monthly_emi=3000.0,
            project_cost=100000.0,
            language="en",
        )
        assert "moderate viability" in res_mod["explanation"]

        # Hindi high fit score
        res_hi = ai_client._build_deterministic_fallback(
            category_name="Dairy",
            village_name="Kamar",
            fit_score=82.5,
            scheme_name="Term Loan Scheme",
            monthly_emi=14945.32,
            project_cost=1000000.0,
            language="hi",
        )
        assert "बहुत अनुकूल है" in res_hi["explanation"]
        assert "स्वयं के अंशदान" in res_hi["recommendation"]

        # Hindi moderate fit score
        res_hi_mod = ai_client._build_deterministic_fallback(
            category_name="Retail",
            village_name="Kamar",
            fit_score=60.0,
            scheme_name="Micro Finance Scheme",
            monthly_emi=3000.0,
            project_cost=100000.0,
            language="hi",
        )
        assert "मध्यम अनुकूलता" in res_hi_mod["explanation"]


@pytest.mark.anyio
async def test_ai_client_timeout_and_http_error():
    """Verify timeout and HTTP non-200 responses."""
    with mock.patch("httpx.AsyncClient.post", new_callable=mock.AsyncMock) as mock_post:
        # Timeout
        mock_post.side_effect = httpx.TimeoutException("Read timed out")
        res_to = await ai_client.query_ai_service(query="Test query")
        assert res_to["available"] is False
        assert res_to["source"] == "ai_service_connection_error"

        # HTTP 503
        mock_resp = mock.MagicMock(spec=httpx.Response)
        mock_resp.status_code = 503
        mock_post.side_effect = None
        mock_post.return_value = mock_resp

        res_http = await ai_client.query_ai_service(query="Test query")
        assert res_http["available"] is False
        assert res_http["source"] == "ai_service_http_error"
        assert res_http["status_code"] == 503


# ─── 3. Full Assessment Integration (/api/v1/assess) ─────────────────────────

def test_assess_endpoint_with_successful_ai():
    """Full assessment endpoint integrates AI insights and citations."""
    mock_resp = mock.MagicMock(spec=httpx.Response)
    mock_resp.status_code = 200
    mock_resp.json.return_value = _sample_ai_response()

    with mock.patch("httpx.AsyncClient.post", new_callable=mock.AsyncMock) as mock_post:
        mock_post.return_value = mock_resp

        resp = client.post("/api/v1/assess", json={
            "location": "Kamar",
            "category": "Dairy",
            "capital": 100000.0,
            "idea": "Commercial dairy farm",
            "phone_or_email": "entrepreneur@saksham.gov.in",
            "language": "en",
        })

        assert resp.status_code == 200
        data = resp.json()

        # Frontend compatibility fields
        assert data["fitScore"] == 86.0
        assert data["confidence"] == "High"
        assert "Official records indicate viable dairy operations" in data["recommendation"]

        # Deterministic calculations
        assert data["financial"]["project_cost"] == 1000000.0
        assert data["financial"]["max_loan_amount"] == 900000.0
        assert data["financial"]["monthly_emi"] > 0
        assert data["scheme"]["name"] == "Term Loan Scheme"

        # AI Insights payload
        ai_meta = data["ai_insights"]
        assert ai_meta["available"] is True
        assert ai_meta["source"] == "ai_service"
        assert len(ai_meta["citations"]) >= 1
        assert ai_meta["grounding_status"] == "fully_grounded"


def test_assess_financial_value_integrity_against_ai_tampering():
    """CRITICAL: Verify AI response figures NEVER overwrite backend calculations."""
    tampered_ai_resp = _sample_ai_response()
    # Simulate an AI explanation containing completely conflicting numbers
    tampered_ai_resp["explanation"] = (
        "AI suggests: project_cost is ₹500,000, loan is ₹200,000, EMI is ₹4,000, fit score is 45.0"
    )

    mock_resp = mock.MagicMock(spec=httpx.Response)
    mock_resp.status_code = 200
    mock_resp.json.return_value = tampered_ai_resp

    with mock.patch("httpx.AsyncClient.post", new_callable=mock.AsyncMock) as mock_post:
        mock_post.return_value = mock_resp

        resp = client.post("/api/v1/assess", json={
            "location": "Kamar",
            "category": "Dairy",
            "capital": 100000.0,
            "idea": "Dairy chilling unit",
        })

        assert resp.status_code == 200
        data = resp.json()

        # Mathematical and deterministic values MUST remain intact
        assert data["financial"]["project_cost"] == 1000000.0
        assert data["financial"]["max_loan_amount"] == 900000.0
        assert data["fitScore"] == 86.0
        assert data["scheme"]["name"] == "Term Loan Scheme"
        assert data["scheme"]["interest_rate"] == 8.0
        assert data["scheme"]["tenure_months"] == 84


def test_assess_no_pii_sent_to_ai():
    """Verify user phone/email is NEVER included in AI request payload."""
    mock_resp = mock.MagicMock(spec=httpx.Response)
    mock_resp.status_code = 200
    mock_resp.json.return_value = _sample_ai_response()

    with mock.patch("httpx.AsyncClient.post", new_callable=mock.AsyncMock) as mock_post:
        mock_post.return_value = mock_resp

        resp = client.post("/api/v1/assess", json={
            "location": "Kamar",
            "category": "Dairy",
            "capital": 100000.0,
            "phone_or_email": "private_user_9988776655@saksham.org",
        })
        assert resp.status_code == 200

        assert mock_post.called
        call_json = mock_post.call_args[1]["json"]

        # Ensure PII is absent from query, calculations, and entire JSON payload
        raw_json_str = str(call_json)
        assert "private_user" not in raw_json_str
        assert "9988776655" not in raw_json_str
        assert "saksham.org" not in raw_json_str


def test_assess_offline_ai_fallback():
    """Verify full assessment still succeeds when AI service is offline."""
    with mock.patch("httpx.AsyncClient.post", new_callable=mock.AsyncMock) as mock_post:
        mock_post.side_effect = httpx.ConnectError("Service refused")

        resp = client.post("/api/v1/assess", json={
            "location": "Kamar",
            "category": "Dairy",
            "capital": 100000.0,
            "idea": "Dairy chilling center",
        })

        assert resp.status_code == 200
        data = resp.json()

        assert data["fitScore"] == 86.0
        assert data["financial"]["project_cost"] == 1000000.0
        assert data["ai_insights"]["available"] is False
        assert data["ai_insights"]["source"] == "deterministic_fallback"
        assert data["ai_insights"]["citations"] == []
        assert data["ai_insights"]["grounding_status"] == "unverified"
        assert len(data["recommendation"]) > 0


# ─── 4. Direct AI Route (/api/v1/ai/query) ───────────────────────────────────

def test_direct_ai_route_success():
    """Direct gateway route forwards conversational query to AI service."""
    mock_resp = mock.MagicMock(spec=httpx.Response)
    mock_resp.status_code = 200
    mock_resp.json.return_value = _sample_ai_response()

    with mock.patch("httpx.AsyncClient.post", new_callable=mock.AsyncMock) as mock_post:
        mock_post.return_value = mock_resp

        resp = client.post("/api/v1/ai/query", json={
            "query": "What are the rules for subsidy under PMFME in Mathura?",
            "language": "en",
            "top_k": 4,
            "calculations": {"project_cost": 500000.0},
        })

        assert resp.status_code == 200
        data = resp.json()
        assert data["available"] is True
        assert data["source"] == "ai_service"
        assert "Official records indicate viable dairy operations" in data["explanation"]


def test_direct_ai_route_offline_returns_503():
    """Direct query fails with 503 instead of fabricating grounded citations."""
    with mock.patch("httpx.AsyncClient.post", new_callable=mock.AsyncMock) as mock_post:
        mock_post.side_effect = httpx.ConnectError("AI offline")

        resp = client.post("/api/v1/ai/query", json={
            "query": "What are the scheme eligibility criteria?",
        })

        assert resp.status_code == 503
        data = resp.json()
        assert "AI advisory service is currently unavailable" in data["detail"] or "AI service unreachable" in data["detail"]


def test_direct_ai_route_validation_errors():
    """Verify query bounds and language validation on direct gateway."""
    # Empty query
    resp1 = client.post("/api/v1/ai/query", json={"query": "   "})
    assert resp1.status_code == 422

    # Unsupported language
    resp2 = client.post("/api/v1/ai/query", json={"query": "Valid query", "language": "german"})
    assert resp2.status_code == 422

    # Invalid top_k
    resp3 = client.post("/api/v1/ai/query", json={"query": "Valid query", "top_k": 50})
    assert resp3.status_code == 422


def test_direct_ai_route_language_variants():
    """Verify accepted language variations on gateway route."""
    mock_resp = mock.MagicMock(spec=httpx.Response)
    mock_resp.status_code = 200
    mock_resp.json.return_value = _sample_ai_response()

    with mock.patch("httpx.AsyncClient.post", new_callable=mock.AsyncMock) as mock_post:
        mock_post.return_value = mock_resp

        # English
        r_en = client.post("/api/v1/ai/query", json={"query": "Valid query", "language": "English"})
        assert r_en.status_code == 200

        # Hindi
        r_hi = client.post("/api/v1/ai/query", json={"query": "Valid query", "language": "Hindi"})
        assert r_hi.status_code == 200

        # Hinglish
        r_hing = client.post("/api/v1/ai/query", json={"query": "Valid query", "language": "Hinglish"})
        assert r_hing.status_code == 200


def test_build_calculations_payload_minimal_branches():
    """Verify calculation payload with only required parameters."""
    calcs = AIClient.build_calculations_payload(
        project_cost=100000.0,
        loan_amount=90000.0,
        monthly_emi=2500.0,
        scheme_name="Micro Finance",
    )
    assert "project_cost" in calcs
    assert "max_loan_amount" in calcs
    assert "monthly_emi" in calcs
    assert "scheme_name" in calcs
    assert "interest_rate" not in calcs
    assert "tenure_months" not in calcs
    assert "moratorium_months" not in calcs
    assert "fit_score" not in calcs
    assert "rating" not in calcs
    assert "repayment_burden_category" not in calcs


def test_parse_success_response_empty_branches():
    """Verify fallback branches when explanation_detail is empty."""
    raw_data = {"explanation": "Fallback explanation text"}
    parsed = AIClient._parse_success_response(raw_data)
    assert parsed["available"] is True
    assert parsed["explanation"] == "Fallback explanation text"
    assert parsed["citations"] == []
    assert parsed["swot"]["strengths"] == ["Verified against official scheme records."]


def test_assess_history_and_get_by_id():
    """Verify history retrieval and single assessment lookup."""
    # Lookup existing
    h_resp = client.get("/api/v1/assess/history")
    assert h_resp.status_code == 200
    items = h_resp.json()
    assert len(items) > 0

    first_id = items[0]["id"]
    det_resp = client.get(f"/api/v1/assess/{first_id}")
    assert det_resp.status_code == 200
    assert det_resp.json()["id"] == first_id

    # Lookup 404
    not_found = client.get("/api/v1/assess/999999")
    assert not_found.status_code == 404


def test_assess_with_category_id():
    """Verify assess router resolves category by category_id."""
    resp = client.post("/api/v1/assess", json={
        "location": "Kamar",
        "category_id": 1,
        "capital": 100000.0,
    })
    assert resp.status_code == 200
    assert resp.json()["category"]["name"] == "Dairy"


