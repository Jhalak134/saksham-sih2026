"""Tests for SAKSHAM AI FastAPI service and pipeline orchestration.

Verifies request validation, pipeline flow, error handling, dependency injection,
health readiness, multilingual support, and offline end-to-end integration.
"""

from typing import Any
import pytest
from fastapi.testclient import TestClient

from ai.grounding.evidence_models import EvidenceItem
from ai.grounding.evidence_pack import EvidencePack
from ai.prompts.explanation_models import (
    ExplanationCitation,
    ExplanationResult,
    ExplanationValidationError,
)
from ai.prompts.explanation_prompt import GroundedExplainer
from ai.prompts.query_parser import ParsedQuery, ParserValidationError, QueryParser
from ai.retrieval.retriever import KnowledgeRetriever, RetrievalQuery, RetrievalResult
from ai.service.main import (
    AIServiceDependencies,
    create_app,
    get_explainer,
    get_parser,
    get_retriever,
)


def _make_mock_item(
    chunk_id: str = "pmfme_p007_c001",
    document_id: str = "pmfme_scheme_guidelines",
    title: str = "PMFME Guidelines",
    text: str = "35% credit linked subsidy.",
    classification: str = "verified_observed",
) -> EvidenceItem:
    return EvidenceItem(
        chunk_id=chunk_id,
        document_id=document_id,
        title=title,
        text=text,
        document_type="scheme_guidelines",
        source="pmfme.pdf",
        page_start=7,
        page_end=7,
        scheme="PMFME",
        classification=classification,
    )


class TestRequestValidation:
    """Verifies input bounds, field formats, and forbidden properties."""

    @pytest.fixture
    def client(self) -> TestClient:
        return TestClient(create_app())

    def test_valid_request(self, client: TestClient) -> None:
        resp = client.post("/query", json={"query": "PMFME scheme guidelines subsidy"})
        assert resp.status_code == 200
        data = resp.json()
        assert "parsed_query" in data
        assert "explanation" in data
        assert "citations" in data

    def test_missing_query(self, client: TestClient) -> None:
        resp = client.post("/query", json={"language": "en"})
        assert resp.status_code == 422
        assert resp.json()["error_type"] == "request_validation_error"

    def test_whitespace_query(self, client: TestClient) -> None:
        resp = client.post("/query", json={"query": "    "})
        assert resp.status_code == 422
        assert "query cannot be empty" in resp.json()["detail"]

    def test_oversized_query(self, client: TestClient) -> None:
        long_q = "loan " * 501  # > 2000 chars
        resp = client.post("/query", json={"query": long_q})
        assert resp.status_code == 422
        assert resp.json()["error_type"] == "request_validation_error"

    def test_top_k_bounds(self, client: TestClient) -> None:
        resp_low = client.post("/query", json={"query": "valid", "top_k": 0})
        assert resp_low.status_code == 422
        resp_high = client.post("/query", json={"query": "valid", "top_k": 21})
        assert resp_high.status_code == 422

    def test_invalid_language(self, client: TestClient) -> None:
        resp = client.post("/query", json={"query": "valid", "language": "french"})
        assert resp.status_code == 422
        assert "Unsupported language" in resp.json()["detail"]

    def test_extra_fields_forbidden(self, client: TestClient) -> None:
        resp = client.post("/query", json={"query": "valid", "unknown_field": "test"})
        assert resp.status_code == 422
        assert resp.json()["error_type"] == "request_validation_error"


class TestPipelineAndGrounding:
    """Verifies pipeline orchestration, provenance, and data integrity."""

    def test_citation_and_provenance_preservation(self) -> None:
        class MockRetriever:
            def retrieve(self, _query: RetrievalQuery) -> list[RetrievalResult]:
                return [
                    RetrievalResult(
                        chunk_id="pmfme_p007_c001",
                        document_id="pmfme_scheme_guidelines",
                        title="PMFME",
                        text="35% subsidy up to 10 lakh.",
                        document_type="scheme_guidelines",
                        source="pmfme.pdf",
                        page_start=7,
                        page_end=7,
                        geography=None,
                        business_category=None,
                        scheme="PMFME",
                        year="2020",
                        is_template_data=False,
                        distance=0.1,
                        similarity_score=0.9,
                    )
                ]

        class MockExplainer:
            def explain(self, evidence_pack: EvidencePack, language: str = "en", calculations: Any = None) -> ExplanationResult:
                _ = (language, calculations)
                cit = ExplanationCitation(
                    chunk_id="pmfme_p007_c001",
                    document_id="pmfme_scheme_guidelines",
                    source="pmfme.pdf",
                    page_start=7,
                    page_end=7,
                )
                return ExplanationResult(
                    answer="Subsidy is 35%.",
                    key_points=["35% grant"],
                    citations=[cit],
                    limitations=list(evidence_pack.limitations),
                    warnings=list(evidence_pack.warnings),
                    evidence_used=["pmfme_p007_c001"],
                    grounding_status="grounded",
                    language="en",
                )

        deps = AIServiceDependencies(retriever=MockRetriever(), explainer=MockExplainer())  # type: ignore
        client = TestClient(create_app(deps=deps))

        resp = client.post("/query", json={"query": "PMFME subsidy rules", "top_k": 3})
        assert resp.status_code == 200
        data = resp.json()
        assert data["grounding_status"] == "grounded"
        assert len(data["citations"]) == 1
        assert data["citations"][0]["chunk_id"] == "pmfme_p007_c001"
        assert data["citations"][0]["page_start"] == 7
        assert data["explanation_detail"]["key_points"] == ["35% grant"]

    def test_missing_fields_preservation(self) -> None:
        deps = AIServiceDependencies()
        client = TestClient(create_app(deps=deps))
        # Ambiguous query missing loan_amount and own_capital
        resp = client.post("/query", json={"query": "dairy business"})
        assert resp.status_code == 200
        pq = resp.json()["parsed_query"]
        assert pq["loan_amount"] is None
        assert pq["own_capital"] is None
        assert "loan_amount" in pq["missing_fields"]
        assert "own_capital" in pq["missing_fields"]

    def test_retrieval_no_match(self) -> None:
        class EmptyRetriever:
            def retrieve(self, _query: RetrievalQuery) -> list[RetrievalResult]:
                return []

        deps = AIServiceDependencies(retriever=EmptyRetriever())  # type: ignore
        client = TestClient(create_app(deps=deps))
        resp = client.post("/query", json={"query": "unknown alien technology"})
        assert resp.status_code == 200
        data = resp.json()
        assert data["retrieval_status"] == "no_match"
        assert data["evidence_available"] is False
        assert data["grounding_status"] == "no_match"
        assert any("absence of retrieved evidence" in lim.lower() for lim in data["limitations"])

    def test_multilingual_and_alias_endpoint(self) -> None:
        client = TestClient(create_app())
        # Hindi query
        resp_hi = client.post("/explain", json={"query": "मुझे लोन चाहिए", "language": "hindi"})
        assert resp_hi.status_code == 200
        assert resp_hi.json()["language"] == "hi"

        # Hinglish query
        resp_hing = client.post("/explain", json={"query": "dairy plant lagana hai", "language": "hinglish"})
        assert resp_hing.status_code == 200
        assert resp_hing.json()["language"] == "hinglish"

    def test_geography_in_parsed_query(self) -> None:
        client = TestClient(create_app())
        resp = client.post("/query", json={"query": "Mathura industrial profile"})
        assert resp.status_code == 200
        geo = resp.json()["parsed_query"]["geography"]
        assert geo is not None
        assert geo["district"] == "Mathura"

    def test_calculations_passed_to_explanation(self) -> None:
        received_calc = None

        class SpyExplainer:
            def explain(self, evidence_pack: EvidencePack, language: str = "en", calculations: Any = None) -> ExplanationResult:
                _ = (evidence_pack, language)
                nonlocal received_calc
                received_calc = calculations
                return ExplanationResult(
                    answer="Done",
                    key_points=[],
                    citations=[],
                    limitations=[],
                    warnings=[],
                    evidence_used=[],
                    grounding_status="no_match",
                    language="en",
                )

        deps = AIServiceDependencies(explainer=SpyExplainer())  # type: ignore
        client = TestClient(create_app(deps=deps))
        resp = client.post(
            "/query",
            json={"query": "loan query", "calculations": {"emi": 15000, "project_cost": 500000}},
        )
        assert resp.status_code == 200
        assert received_calc == {"emi": 15000, "project_cost": 500000}


class TestErrorHandlingAndSecurity:
    """Verifies error responses, sanitized error messages, and no LLM bypass."""

    def test_parser_validation_error_handler(self) -> None:
        class FailingParser:
            def parse(self, _text: str) -> ParsedQuery:
                raise ParserValidationError("Simulated parsing schema violation")

        client = TestClient(create_app(deps=AIServiceDependencies(parser=FailingParser())))  # type: ignore
        resp = client.post("/query", json={"query": "test query"})
        assert resp.status_code == 422
        data = resp.json()
        assert data["error_type"] == "parser_validation_error"
        assert "Simulated parsing schema violation" in data["detail"]

    def test_retrieval_failure_handler(self) -> None:
        class FailingRetriever:
            def retrieve(self, _query: RetrievalQuery) -> list[RetrievalResult]:
                raise RuntimeError("Chroma connection refused")

        client = TestClient(create_app(deps=AIServiceDependencies(retriever=FailingRetriever())))  # type: ignore
        resp = client.post("/query", json={"query": "test query"})
        assert resp.status_code == 503
        data = resp.json()
        assert data["error_type"] == "retrieval_error"
        assert "Knowledge-base retrieval failed" in data["detail"]

    def test_evidence_pack_validation_error_handler(self) -> None:
        class CorruptRetriever:
            def retrieve(self, _query: RetrievalQuery) -> list[Any]:
                # Invalid classification raises EvidenceItemValidationError
                return [_make_mock_item(document_id="dairy_yogurt_plant_project_report", classification="historical")]

        client = TestClient(create_app(deps=AIServiceDependencies(retriever=CorruptRetriever())))  # type: ignore
        resp = client.post("/query", json={"query": "test query"})
        assert resp.status_code == 500
        assert resp.json()["error_type"] == "evidence_pack_validation_error"

    def test_explanation_validation_error_handler(self) -> None:
        class FailingExplainer:
            def explain(self, evidence_pack: EvidencePack, language: str = "en", calculations: Any = None) -> ExplanationResult:
                _ = (evidence_pack, language, calculations)
                raise ExplanationValidationError("Invented citations detected")

        client = TestClient(create_app(deps=AIServiceDependencies(explainer=FailingExplainer())))  # type: ignore
        resp = client.post("/query", json={"query": "test query"})
        assert resp.status_code == 500
        assert resp.json()["error_type"] == "explanation_validation_error"

    def test_unexpected_internal_error_no_stack_trace(self) -> None:
        class BuggyParser:
            def parse(self, _text: str) -> ParsedQuery:
                raise ZeroDivisionError("/home/divyansh/secret/path/internal_bug.py: line 42")

        client = TestClient(
            create_app(deps=AIServiceDependencies(parser=BuggyParser())),
            raise_server_exceptions=False,
        )
        resp = client.post("/query", json={"query": "test query"})
        assert resp.status_code == 500
        data = resp.json()
        assert data["error_type"] == "internal_server_error"
        # Verify sensitive paths and raw stack trace are not leaked
        assert "/home/divyansh/secret" not in data["detail"]
        assert "ZeroDivisionError" not in data["detail"]
        assert data["detail"] == "An unexpected internal error occurred while processing the request."

    def test_value_error_handler(self) -> None:
        class ValueErrParser:
            def parse(self, _text: str) -> ParsedQuery:
                raise ValueError("Invalid format parameter")

        client = TestClient(create_app(deps=AIServiceDependencies(parser=ValueErrParser())))  # type: ignore
        resp = client.post("/query", json={"query": "test query"})
        assert resp.status_code == 400
        assert resp.json()["error_type"] == "value_error"

    def test_no_direct_llm_bypass_of_evidence_pack(self) -> None:
        pack_received = None

        class InterceptExplainer:
            def explain(self, evidence_pack: EvidencePack, language: str = "en", calculations: Any = None) -> ExplanationResult:
                _ = (language, calculations)
                nonlocal pack_received
                pack_received = evidence_pack
                assert isinstance(evidence_pack, EvidencePack)
                return ExplanationResult(
                    answer="Verified pack",
                    key_points=[],
                    citations=[],
                    limitations=[],
                    warnings=[],
                    evidence_used=[],
                    grounding_status="grounded" if evidence_pack.evidence_available else "no_match",
                    language="en",
                )

        client = TestClient(create_app(deps=AIServiceDependencies(explainer=InterceptExplainer())))  # type: ignore
        resp = client.post("/query", json={"query": "dairy guidelines"})
        assert resp.status_code == 200
        assert isinstance(pack_received, EvidencePack)
        assert pack_received.structured_query is not None


class TestHealthAndReadiness:
    """Verifies /health endpoint reporting operational and degraded states."""

    def test_health_ok(self) -> None:
        class ReadyRetriever:
            class Collection:
                def count(self) -> int:
                    return 179

            collection = Collection()

        client = TestClient(create_app(deps=AIServiceDependencies(retriever=ReadyRetriever())))  # type: ignore
        resp = client.get("/health")
        assert resp.status_code == 200
        data = resp.json()
        assert data["status"] == "ok"
        assert data["vector_store"] == "ready"
        assert data["chunk_count"] == 179

    def test_health_degraded(self) -> None:
        class DegradedRetriever:
            @property
            def collection(self) -> Any:
                raise RuntimeError("Vector store not initialized")

        client = TestClient(create_app(deps=AIServiceDependencies(retriever=DegradedRetriever())))  # type: ignore
        resp = client.get("/health")
        assert resp.status_code == 200
        data = resp.json()
        assert data["status"] == "degraded"
        assert data["vector_store"] == "unavailable"
        assert data["chunk_count"] is None


class TestDependencyInjectionAndRealIntegration:
    """Verifies FastAPI dependency overrides and end-to-end offline integration."""

    def test_dependency_overrides(self) -> None:
        app = create_app()

        class CustomParser:
            def parse(self, text: str) -> ParsedQuery:
                return ParsedQuery(raw_query=text, intent="custom_intent")

        app.dependency_overrides[get_parser] = lambda: CustomParser()
        client = TestClient(app)
        resp = client.post("/query", json={"query": "test query"})
        assert resp.status_code == 200
        assert resp.json()["parsed_query"]["intent"] == "custom_intent"

    def test_dependency_providers_default_fallbacks(self) -> None:
        # Test direct calls to dependency getters without app.state.deps
        class DummyRequest:
            class App:
                class State:
                    deps = None
                state = State()
            app = App()

        req = DummyRequest()
        assert isinstance(get_parser(req), QueryParser)  # type: ignore
        assert isinstance(get_retriever(req), KnowledgeRetriever)  # type: ignore
        assert isinstance(get_explainer(req), GroundedExplainer)  # type: ignore

    def test_offline_real_pipeline_integration(self) -> None:
        # Full integration using actual Chroma vector store, real parser,
        # real retriever, real evidence pack, and deterministic explainer.
        client = TestClient(create_app())

        resp = client.post(
            "/query",
            json={
                "query": "Mujhe dairy yogurt processing shuru karna hai. Mere paas 2 lakh apna paisa hai.",
                "language": "hinglish",
                "top_k": 3,
            },
        )
        assert resp.status_code == 200
        data = resp.json()

        # 1. Parsed Query verification
        assert data["parsed_query"]["business_category"] == "dairy"
        assert data["parsed_query"]["geography"] is None
        assert data["parsed_query"]["own_capital"] == 200000.0

        # 2. Retrieval & Grounding verification
        assert data["retrieval_status"] == "success"
        assert data["evidence_available"] is True
        assert data["result_count"] > 0
        assert len(data["citations"]) > 0

        # 3. Explanation verification
        assert data["language"] == "hinglish"
        assert data["grounding_status"] == "grounded"
        assert len(data["explanation"]) > 20
        assert any("dairy_yogurt_plant_project_report" in c["document_id"] for c in data["citations"])
