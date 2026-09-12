"""test_hallucination.py

Task 10 & 11 — AI Grounding & Citation Integrity Regression Suite (<500 LOC).
Refactored to enforce file length limit (<500 LOC) while preserving full regression coverage.

Covers:
- TEST A: Citation chunk_id and document_id provenance validation
- TEST B: Grounded status rejected when evidence is unavailable / no-match
- TEST E: Missing required fields independent rejection
- TEST F: Invalid grounding_status enum validation
- TEST G: Unknown evidence_used chunk_id rejection
- TEST H: Malformed responses, code fencing, types, and empty response handling
- TEST O: evidence_used provenance validation and edge-case handling
- INTEGRATION: End-to-end FastAPI service rejection of hallucinated citations (HTTP 500)
"""

from __future__ import annotations

import json
from typing import Any
import pytest
from fastapi.testclient import TestClient

from ai.grounding.evidence_pack import create_evidence_pack
from ai.prompts.explanation_models import ExplanationValidationError, GroundingStatus
from ai.prompts.explanation_prompt import GroundedExplainer, parse_explanation_response
from ai.service.main import AIServiceDependencies, create_app
from ai.tests.conftest import make_dairy_template_item, make_pmfme_item, make_valid_response_dict


class TestHallucinationAInvalidCitationChunk:
    """TEST A: Citation to nonexistent chunk_id, document_id, or malformed citation."""

    def test_rejects_citation_to_nonexistent_chunk_id(self) -> None:
        item = make_pmfme_item()
        pack = create_evidence_pack(query="PMFME grant rate", retrieval_results=[item])

        payload = make_valid_response_dict()
        payload["citations"] = [
            {
                "chunk_id": "ghost_chunk_999",
                "document_id": "pmfme_scheme_guidelines",
                "source": "pmfme.pdf",
                "page_start": 7,
                "page_end": 7,
            }
        ]

        with pytest.raises(ExplanationValidationError, match="references unknown chunk_id 'ghost_chunk_999'"):
            parse_explanation_response(payload, pack)

    def test_rejects_citation_to_nonexistent_document_id(self) -> None:
        item = make_pmfme_item()
        pack = create_evidence_pack(query="PMFME grant rate", retrieval_results=[item])

        payload = make_valid_response_dict()
        payload["citations"] = [
            {
                "chunk_id": "pmfme_p007_c001",
                "document_id": "fabricated_pmfme_v2_guidelines",
                "source": "pmfme.pdf",
                "page_start": 7,
                "page_end": 7,
            }
        ]

        with pytest.raises(ExplanationValidationError, match="references unknown document_id 'fabricated_pmfme_v2_guidelines'"):
            parse_explanation_response(payload, pack)

    def test_rejects_citation_with_empty_or_whitespace_identifiers(self) -> None:
        item = make_pmfme_item()
        pack = create_evidence_pack(query="PMFME grant rate", retrieval_results=[item])

        payload = make_valid_response_dict()
        payload["citations"] = [
            {
                "chunk_id": "   ",
                "document_id": "pmfme_scheme_guidelines",
                "source": "pmfme.pdf",
            }
        ]

        with pytest.raises(ExplanationValidationError, match="missing chunk_id or document_id"):
            parse_explanation_response(payload, pack)

    def test_rejects_citation_not_a_dictionary(self) -> None:
        item = make_pmfme_item()
        pack = create_evidence_pack(query="PMFME grant rate", retrieval_results=[item])

        payload = make_valid_response_dict()
        payload["citations"] = ["pmfme_p007_c001"]

        with pytest.raises(ExplanationValidationError, match="Expected dict for citation"):
            parse_explanation_response(payload, pack)


class TestHallucinationBNoEvidenceGrounded:
    """TEST B: Rejection of grounded status when evidence is absent or no-match."""

    def test_rejects_grounded_status_with_no_evidence(self) -> None:
        pack = create_evidence_pack(query="What is the subsidy for goat farming?", retrieval_results=[])
        assert not pack.evidence_available
        assert pack.retrieval_status == "no_match"

        payload = {
            "answer": "Goat farming receives a 50% subsidy under national schemes.",
            "key_points": ["50% subsidy"],
            "citations": [],
            "limitations": [],
            "warnings": [],
            "evidence_used": [],
            "grounding_status": "grounded",
        }

        with pytest.raises(
            ExplanationValidationError,
            match="grounding_status cannot be 'grounded' when EvidencePack has no evidence",
        ):
            parse_explanation_response(payload, pack)

    def test_no_match_retrieval_with_factual_claims_and_fake_citations_rejected(self) -> None:
        pack = create_evidence_pack(query="Dairy loans in Mathura", retrieval_results=[])

        payload = {
            "answer": "Mathura offers 10% interest rate with Rs 5,00,000 ceiling.",
            "key_points": ["10% interest"],
            "citations": [
                {
                    "chunk_id": "mathura_p002_c001",
                    "document_id": "mathura_district_industrial_profile",
                    "source": "mathura.pdf",
                }
            ],
            "limitations": [],
            "warnings": [],
            "evidence_used": [],
            "grounding_status": "grounded",
        }

        with pytest.raises(ExplanationValidationError, match="references unknown chunk_id"):
            parse_explanation_response(payload, pack)


class TestHallucinationERequiredFields:
    """TEST E: Independent rejection of each missing mandatory field."""

    @pytest.mark.parametrize(
        "missing_field",
        ["answer", "key_points", "citations", "limitations", "warnings", "grounding_status"],
    )
    def test_rejects_missing_required_fields_individually(self, missing_field: str) -> None:
        item = make_pmfme_item()
        pack = create_evidence_pack(query="PMFME grant", retrieval_results=[item])

        payload = make_valid_response_dict()
        del payload[missing_field]

        with pytest.raises(ExplanationValidationError, match=f"Missing required field: '{missing_field}'"):
            parse_explanation_response(payload, pack)

    def test_rejects_completely_empty_dictionary(self) -> None:
        item = make_pmfme_item()
        pack = create_evidence_pack(query="PMFME grant", retrieval_results=[item])

        with pytest.raises(ExplanationValidationError, match="Missing required field"):
            parse_explanation_response({}, pack)


class TestHallucinationFInvalidGroundingStatus:
    """TEST F: Enforcement of valid GroundingStatus enum values."""

    @pytest.mark.parametrize(
        "bad_status",
        ["verified", "partially_grounded", "hallucinated", "unverified", "TRUE", "", "null"],
    )
    def test_rejects_invalid_grounding_status_value(self, bad_status: str) -> None:
        item = make_pmfme_item()
        pack = create_evidence_pack(query="PMFME grant", retrieval_results=[item])

        payload = make_valid_response_dict()
        payload["grounding_status"] = bad_status

        with pytest.raises(ExplanationValidationError, match=f"Invalid grounding_status: '{bad_status}'"):
            parse_explanation_response(payload, pack)

    def test_accepts_all_defined_grounding_status_enum_values(self) -> None:
        item = make_pmfme_item()
        pack = create_evidence_pack(query="PMFME grant", retrieval_results=[item])

        for valid_status in GroundingStatus:
            payload = make_valid_response_dict(status=valid_status.value)
            res = parse_explanation_response(payload, pack)
            assert res.grounding_status == valid_status.value


class TestHallucinationGUnknownEvidenceUsed:
    """TEST G: Enforcement of evidence_used chunk_id provenance."""

    def test_rejects_evidence_used_referencing_unknown_chunk_id(self) -> None:
        item = make_pmfme_item()
        pack = create_evidence_pack(query="PMFME grant", retrieval_results=[item])

        payload = make_valid_response_dict()
        payload["evidence_used"] = ["pmfme_p007_c001", "unseen_chunk_xyz"]

        with pytest.raises(ExplanationValidationError, match="evidence_used references unknown chunk_id 'unseen_chunk_xyz'"):
            parse_explanation_response(payload, pack)

    def test_accepts_valid_evidence_used_subset(self) -> None:
        item1 = make_pmfme_item(chunk_id="c1")
        item2 = make_dairy_template_item(chunk_id="c2")
        pack = create_evidence_pack(query="Multi query", retrieval_results=[item1, item2])

        payload = make_valid_response_dict(chunk_id="c1")
        payload["evidence_used"] = ["c1"]

        res = parse_explanation_response(payload, pack)
        assert res.evidence_used == ["c1"]


class TestHallucinationHMalformedResponse:
    """TEST H: Parser resilience across string formats, code-fencing, and types."""

    def test_handles_valid_json_string(self) -> None:
        item = make_pmfme_item()
        pack = create_evidence_pack(query="PMFME grant", retrieval_results=[item])
        payload = make_valid_response_dict()

        res = parse_explanation_response(json.dumps(payload), pack)
        assert res.answer == payload["answer"]

    def test_handles_markdown_code_fenced_json(self) -> None:
        item = make_pmfme_item()
        pack = create_evidence_pack(query="PMFME grant", retrieval_results=[item])
        payload = make_valid_response_dict()

        fenced = f"```json\n{json.dumps(payload, indent=2)}\n```"
        res = parse_explanation_response(fenced, pack)
        assert res.answer == payload["answer"]

    def test_handles_markdown_code_fenced_without_tag(self) -> None:
        item = make_pmfme_item()
        pack = create_evidence_pack(query="PMFME grant", retrieval_results=[item])
        payload = make_valid_response_dict()

        fenced = f"```\n{json.dumps(payload)}\n```"
        res = parse_explanation_response(fenced, pack)
        assert res.answer == payload["answer"]

    def test_rejects_malformed_json_syntax(self) -> None:
        item = make_pmfme_item()
        pack = create_evidence_pack(query="PMFME grant", retrieval_results=[item])

        with pytest.raises(ExplanationValidationError, match="Invalid JSON in LLM response"):
            parse_explanation_response("{\"answer\": \"incomplete...", pack)

    def test_rejects_json_array_root(self) -> None:
        item = make_pmfme_item()
        pack = create_evidence_pack(query="PMFME grant", retrieval_results=[item])

        array_json = json.dumps([make_valid_response_dict()])
        with pytest.raises(ExplanationValidationError, match="Response root must be a dict"):
            parse_explanation_response(array_json, pack)

    def test_rejects_plain_string_not_json(self) -> None:
        item = make_pmfme_item()
        pack = create_evidence_pack(query="PMFME grant", retrieval_results=[item])

        with pytest.raises(ExplanationValidationError, match="Invalid JSON in LLM response"):
            parse_explanation_response("Here is the answer without JSON formatting.", pack)

    def test_rejects_invalid_field_types(self) -> None:
        item = make_pmfme_item()
        pack = create_evidence_pack(query="PMFME grant", retrieval_results=[item])

        payload = make_valid_response_dict()
        payload["citations"] = "pmfme_p007_c001"

        with pytest.raises(ExplanationValidationError, match="citations must be a list"):
            parse_explanation_response(payload, pack)

    def test_rejects_non_string_non_dict_input(self) -> None:
        item = make_pmfme_item()
        pack = create_evidence_pack(query="PMFME grant", retrieval_results=[item])

        with pytest.raises(ExplanationValidationError, match="Expected str or dict response"):
            parse_explanation_response(12345, pack)  # type: ignore

    def test_rejects_empty_string_response(self) -> None:
        item = make_pmfme_item()
        pack = create_evidence_pack(query="PMFME grant", retrieval_results=[item])

        with pytest.raises(ExplanationValidationError, match="Invalid JSON in LLM response"):
            parse_explanation_response("", pack)


class TestHallucinationOEvidenceUsedValidation:
    """TEST O: Comprehensive evidence_used validation and edge cases."""

    def test_evidence_used_valid_chunk_ids(self) -> None:
        item1 = make_pmfme_item(chunk_id="c1")
        item2 = make_pmfme_item(chunk_id="c2")
        pack = create_evidence_pack(query="PMFME", retrieval_results=[item1, item2])

        payload = make_valid_response_dict(chunk_id="c1")
        payload["evidence_used"] = ["c1", "c2"]

        res = parse_explanation_response(payload, pack)
        assert res.evidence_used == ["c1", "c2"]

    def test_evidence_used_invalid_chunk_id_rejected(self) -> None:
        item = make_pmfme_item(chunk_id="c1")
        pack = create_evidence_pack(query="PMFME", retrieval_results=[item])

        payload = make_valid_response_dict(chunk_id="c1")
        payload["evidence_used"] = ["c1", "nonexistent_chunk_id"]

        with pytest.raises(ExplanationValidationError, match="evidence_used references unknown chunk_id"):
            parse_explanation_response(payload, pack)

    def test_evidence_used_non_list_or_none_coerced_safely(self) -> None:
        item = make_pmfme_item(chunk_id="c1")
        pack = create_evidence_pack(query="PMFME", retrieval_results=[item])

        payload = make_valid_response_dict(chunk_id="c1")
        payload["evidence_used"] = "invalid_string_instead_of_list"

        res = parse_explanation_response(payload, pack)
        assert res.evidence_used == []


class TestHallucinationFastAPIServiceIntegration:
    """Verifies that the FastAPI AI service returns HTTP 500 when an LLM hallucinates citations."""

    def test_service_endpoint_rejects_hallucinated_citations_with_500(self) -> None:
        def hallucinatory_llm(_system: str, _user: str) -> dict[str, Any]:
            return {
                "answer": "Hallucinated advice citing ghost chunk.",
                "key_points": ["Fake point"],
                "citations": [
                    {
                        "chunk_id": "hallucinated_chunk_999",
                        "document_id": "pmfme_scheme_guidelines",
                        "source": "pmfme.pdf",
                        "page_start": 1,
                        "page_end": 1,
                    }
                ],
                "limitations": [],
                "warnings": [],
                "evidence_used": ["hallucinated_chunk_999"],
                "grounding_status": "grounded",
            }

        deps = AIServiceDependencies(explainer=GroundedExplainer(llm_callable=hallucinatory_llm))
        app = create_app(deps=deps)
        client = TestClient(app)

        response = client.post(
            "/query",
            json={"query": "PMFME scheme grant rate", "top_k": 3},
        )

        assert response.status_code == 500
        body = response.json()
        assert body["error_type"] == "explanation_validation_error"
        assert "hallucinated_chunk_999" in body["detail"]
