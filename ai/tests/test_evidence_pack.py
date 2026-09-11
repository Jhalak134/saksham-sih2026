"""
test_evidence_pack.py

Comprehensive test suite for SAKSHAM AI/RAG Grounding & Evidence Pack Layer (Task 5).
Verifies provenance, data honesty (template and historical 2011), no-match behavior,
duplicate rejection, validation boundaries, and vector store integration.
"""

from __future__ import annotations

import pytest

from ai.grounding.evidence_models import (
    EvidenceClassification,
    EvidenceItem,
    EvidenceItemValidationError,
    EvidencePackValidationError,
    RetrievalStatus,
    build_provenance_summary,
    classify_evidence,
    validate_doc_integrity,
    validate_evidence_item,
    validate_non_empty_str,
    validate_optional_dict,
    validate_optional_str,
    validate_page_range,
    validate_score,
)
from ai.grounding.evidence_pack import (
    EvidencePack,
    create_evidence_pack,
    format_evidence_pack_summary,
    generate_warnings_and_limitations,
    validate_evidence_pack,
)
from ai.prompts.query_parser import ParsedQuery
from ai.retrieval.retriever import KnowledgeRetriever, RetrievalQuery, RetrievalResult


def _make_dummy_result(
    chunk_id: str = "doc1_p001_c001",
    document_id: str = "manual_entrepreneurship_development",
    title: str = "Agribusiness Manual",
    text: str = "This is verified text on agribusiness planning.",
    document_type: str = "entrepreneurship",
    source: str = "manual.pdf",
    page_start: int = 1,
    page_end: int = 1,
    geography: dict[str, str] | None = None,
    business_category: str | None = None,
    scheme: str | None = None,
    year: str | None = "2024",
    is_template_data: bool = False,
    distance: float = 0.15,
    similarity_score: float = 0.85,
) -> RetrievalResult:
    """Helper to construct a deterministic test RetrievalResult."""
    return RetrievalResult(
        chunk_id=chunk_id,
        document_id=document_id,
        title=title,
        text=text,
        document_type=document_type,
        source=source,
        page_start=page_start,
        page_end=page_end,
        geography=geography,
        business_category=business_category,
        scheme=scheme,
        year=year,
        is_template_data=is_template_data,
        distance=distance,
        similarity_score=similarity_score,
    )


class TestEvidenceModelsValidation:
    """Tests for individual field validation, doc integrity, and classification."""

    def test_classify_evidence(self) -> None:
        assert EvidenceClassification.INCOMPLETE_MAPPED.value == "incomplete_mapped"
        assert EvidenceClassification.UNAVAILABLE.value == "unavailable"
        assert classify_evidence("dairy_yogurt_plant_project_report", True, None) == "template_reference"
        assert classify_evidence("any_doc", False, None, "project_report_template") == "template_reference"
        assert classify_evidence("mathura_district_industrial_profile", False, "2011") == "historical"
        assert classify_evidence("other_doc", False, "2011") == "historical"
        assert classify_evidence("pmfme_scheme_guidelines", False, "2020") == "verified_observed"

    def test_validate_primitives(self) -> None:
        assert validate_non_empty_str("name", " hello ") == "hello"
        with pytest.raises(EvidenceItemValidationError):
            validate_non_empty_str("name", 123)
        with pytest.raises(EvidenceItemValidationError):
            validate_non_empty_str("name", "   ")

        assert validate_page_range(1, 2) == (1, 2)
        with pytest.raises(EvidenceItemValidationError):
            validate_page_range("1", 2)
        with pytest.raises(EvidenceItemValidationError):
            validate_page_range(0, 2)
        with pytest.raises(EvidenceItemValidationError):
            validate_page_range(2, "3")
        with pytest.raises(EvidenceItemValidationError):
            validate_page_range(5, 4)

        assert validate_score(0.5, "score", 0.0, 1.0) == 0.5
        with pytest.raises(EvidenceItemValidationError):
            validate_score(True, "score", 0.0)
        with pytest.raises(EvidenceItemValidationError):
            validate_score("0.5", "score", 0.0)
        with pytest.raises(EvidenceItemValidationError):
            validate_score(-0.1, "score", 0.0)
        with pytest.raises(EvidenceItemValidationError):
            validate_score(1.5, "score", 0.0, 1.0)

        assert validate_optional_str("s", None) is None
        assert validate_optional_str("s", "ok") == "ok"
        with pytest.raises(EvidenceItemValidationError):
            validate_optional_str("s", 42)

        assert validate_optional_dict("d", None) is None
        assert validate_optional_dict("d", {"a": "b"}) == {"a": "b"}
        with pytest.raises(EvidenceItemValidationError):
            validate_optional_dict("d", "not-a-dict")

    def test_validate_doc_integrity(self) -> None:
        # Dairy template check
        with pytest.raises(EvidenceItemValidationError, match="must have is_template_data=True"):
            validate_doc_integrity("dairy_yogurt_plant_project_report", False, None, None, "template_reference")
        with pytest.raises(EvidenceItemValidationError, match="classified as template_reference"):
            validate_doc_integrity("dairy_yogurt_plant_project_report", True, None, None, "verified_observed")
        validate_doc_integrity("dairy_yogurt_plant_project_report", True, None, None, "template_reference")

        # Mathura historical check
        with pytest.raises(EvidenceItemValidationError, match="cannot have year='2026'"):
            validate_doc_integrity("mathura_district_industrial_profile", False, "2026", None, "historical")
        with pytest.raises(EvidenceItemValidationError, match="must have year='2011'"):
            validate_doc_integrity("mathura_district_industrial_profile", False, "2020", None, "historical")
        with pytest.raises(EvidenceItemValidationError, match="classified as historical"):
            validate_doc_integrity("mathura_district_industrial_profile", False, "2011", None, "verified_observed")
        validate_doc_integrity("mathura_district_industrial_profile", False, "2011", None, "historical")

        # PMFME scheme check
        with pytest.raises(EvidenceItemValidationError, match="must have scheme='PMFME'"):
            validate_doc_integrity("pmfme_scheme_guidelines", False, "2020", "OTHER", "verified_observed")
        validate_doc_integrity("pmfme_scheme_guidelines", False, "2020", "PMFME", "verified_observed")

        # Other docs pass through
        validate_doc_integrity("custom_doc", False, "2024", None, "verified_observed")

    def test_validate_evidence_item_boundaries(self) -> None:
        item = EvidenceItem.from_retrieval_result(_make_dummy_result())
        validate_evidence_item(item)

        # Invalid bool
        with pytest.raises(EvidenceItemValidationError):
            validate_evidence_item(EvidenceItem.from_dict({**item.to_dict(), "is_template_data": "True"}))
        bad_bool_item = EvidenceItem(
            chunk_id="c1", document_id="d1", title="t", text="txt",
            document_type="dt", source="s", page_start=1, page_end=1,
            is_template_data="invalid",  # type: ignore
        )
        with pytest.raises(EvidenceItemValidationError, match="is_template_data must be a bool"):
            validate_evidence_item(bad_bool_item)
        # Invalid classification
        with pytest.raises(EvidenceItemValidationError):
            validate_evidence_item(EvidenceItem.from_dict({**item.to_dict(), "classification": "invalid_cls"}))
        # Invalid chunk_index
        with pytest.raises(EvidenceItemValidationError):
            validate_evidence_item(EvidenceItem.from_dict({**item.to_dict(), "chunk_index": -1}))
        # Invalid page_number
        with pytest.raises(EvidenceItemValidationError):
            validate_evidence_item(EvidenceItem.from_dict({**item.to_dict(), "page_number": 0}))


class TestEvidenceItemConstruction:
    """Tests for EvidenceItem construction, conversion, and serialization."""

    def test_from_retrieval_result_and_to_dict(self) -> None:
        rr = _make_dummy_result()
        item = EvidenceItem.from_retrieval_result(rr)
        assert item.chunk_id == rr.chunk_id
        assert item.document_id == rr.document_id
        assert item.title == rr.title
        assert item.text == rr.text
        assert item.classification == EvidenceClassification.VERIFIED_OBSERVED.value

        d = item.to_dict()
        assert d["chunk_id"] == rr.chunk_id
        prov = item.get_provenance()
        assert prov["document_id"] == rr.document_id
        assert prov["chunk_id"] == rr.chunk_id

    def test_from_retrieval_result_type_error(self) -> None:
        with pytest.raises(EvidenceItemValidationError):
            EvidenceItem.from_retrieval_result("not-a-result")  # type: ignore

    def test_from_dict_and_round_trip(self) -> None:
        rr = _make_dummy_result()
        item = EvidenceItem.from_retrieval_result(rr)
        d = item.to_dict()
        reconstructed = EvidenceItem.from_dict(d)
        assert reconstructed == item

        with pytest.raises(EvidenceItemValidationError):
            EvidenceItem.from_dict("not-a-dict")  # type: ignore

        # from_dict auto-classification
        d_no_cls = {k: v for k, v in d.items() if k != "classification"}
        auto_item = EvidenceItem.from_dict(d_no_cls)
        assert auto_item.classification == EvidenceClassification.VERIFIED_OBSERVED.value


class TestEvidencePackValidationAndIntegrity:
    """Tests for pack-level validation, duplicates, and result count consistency."""

    def test_valid_pack_creation(self) -> None:
        item = EvidenceItem.from_retrieval_result(_make_dummy_result())
        pack = create_evidence_pack(query="How to plan agribusiness?", retrieval_results=[item])
        assert pack.result_count == 1
        assert pack.evidence_available is True
        assert pack.retrieval_status == RetrievalStatus.SUCCESS.value
        assert pack.evidence_items[0].chunk_id == item.chunk_id

    def test_duplicate_chunk_ids_rejected(self) -> None:
        item1 = EvidenceItem.from_retrieval_result(_make_dummy_result(chunk_id="c001"))
        item2 = EvidenceItem.from_retrieval_result(_make_dummy_result(chunk_id="c001"))
        with pytest.raises(EvidencePackValidationError, match="Duplicate chunk_id detected"):
            create_evidence_pack(query="test", retrieval_results=[item1, item2])

    def test_no_match_empty_pack(self) -> None:
        pack = create_evidence_pack(query="Nonexistent topic", retrieval_results=[])
        assert pack.result_count == 0
        assert pack.evidence_available is False
        assert pack.retrieval_status == RetrievalStatus.NO_MATCH.value
        assert len(pack.limitations) >= 1
        assert "No relevant knowledge-base evidence was retrieved" in pack.limitations[0]

    def test_validate_evidence_pack_failures(self) -> None:
        item = EvidenceItem.from_retrieval_result(_make_dummy_result())
        with pytest.raises(EvidencePackValidationError, match="query_text cannot be empty"):
            validate_evidence_pack(EvidencePack(query_text="   ", evidence_items=[], result_count=0))
        with pytest.raises(EvidencePackValidationError, match="result_count"):
            validate_evidence_pack(EvidencePack(query_text="valid", evidence_items=[item], result_count=2, evidence_available=True, retrieval_status="success"))
        with pytest.raises(EvidencePackValidationError, match="evidence_available must be False"):
            validate_evidence_pack(EvidencePack(query_text="valid", evidence_items=[], result_count=0, evidence_available=True, retrieval_status="no_match"))
        with pytest.raises(EvidencePackValidationError, match="retrieval_status must be 'no_match'"):
            validate_evidence_pack(EvidencePack(query_text="valid", evidence_items=[], result_count=0, evidence_available=False, retrieval_status="success"))
        with pytest.raises(EvidencePackValidationError, match="evidence_available must be True"):
            validate_evidence_pack(EvidencePack(query_text="valid", evidence_items=[item], result_count=1, evidence_available=False, retrieval_status="success"))
        with pytest.raises(EvidencePackValidationError, match="retrieval_status must be 'success'"):
            validate_evidence_pack(EvidencePack(query_text="valid", evidence_items=[item], result_count=1, evidence_available=True, retrieval_status="no_match"))
        with pytest.raises(EvidencePackValidationError, match="must be EvidenceItem instances"):
            validate_evidence_pack(EvidencePack(query_text="valid", evidence_items=["not_item"], result_count=1, evidence_available=True, retrieval_status="success"))  # type: ignore


class TestWarningsLimitationsAndProvenance:
    """Tests for template warnings, 2011 historical warnings, PMFME and missing fields limitations."""

    def test_template_and_historical_warnings(self) -> None:
        r_template = _make_dummy_result(
            chunk_id="dairy_c001",
            document_id="dairy_yogurt_plant_project_report",
            document_type="project_report_template",
            is_template_data=True,
            year=None,
        )
        r_historical = _make_dummy_result(
            chunk_id="mathura_c001",
            document_id="mathura_district_industrial_profile",
            document_type="district_knowledge",
            geography={"state": "Uttar Pradesh", "district": "Mathura"},
            year="2011",
            is_template_data=False,
        )

        pack = create_evidence_pack(
            query="Dairy investment in Mathura",
            retrieval_results=[r_template, r_historical],
        )
        assert pack.has_template_data is True
        assert pack.has_historical_data is True
        assert "dairy_yogurt_plant_project_report" in pack.document_ids
        assert "mathura_district_industrial_profile" in pack.document_ids
        assert len(pack.chunk_ids) == 2
        assert any("template/reference data" in w for w in pack.warnings)
        assert any("2011 baseline vintage" in w for w in pack.warnings)

    def test_pmfme_and_missing_fields_limitations(self) -> None:
        r_pmfme = _make_dummy_result(
            chunk_id="pmfme_c001",
            document_id="pmfme_scheme_guidelines",
            scheme="PMFME",
            year="2020",
        )
        parsed_q = ParsedQuery(
            raw_query="pmfme loan",
            intent="scheme_inquiry",
            scheme="PMFME",
            missing_fields=["business_category", "geography", "loan_amount", "own_capital", "purpose"],
            is_ambiguous=True,
        )

        pack = create_evidence_pack(query=parsed_q, retrieval_results=[r_pmfme])
        assert any("PMFME scheme guidelines" in lim for lim in pack.limitations)
        assert any("Query is missing advisory parameters" in lim for lim in pack.limitations)
        assert any("brief or ambiguous" in w for w in pack.warnings)

    def test_provenance_summary_aggregation(self) -> None:
        r1 = _make_dummy_result(chunk_id="c1", document_id="docA", scheme="PMFME", year="2020")
        r2 = _make_dummy_result(chunk_id="c2", document_id="docA", scheme="PMFME", year="2020")
        summary = build_provenance_summary([
            EvidenceItem.from_retrieval_result(r1),
            EvidenceItem.from_retrieval_result(r2),
        ])
        assert summary["documents"] == ["docA"]
        assert summary["chunks"] == ["c1", "c2"]
        assert summary["schemes"] == ["PMFME"]
        assert summary["vintages"] == ["2020"]


class TestCreateEvidencePackAndFactory:
    """Tests for flexible query inputs, result coercion, formatting, and serialization."""

    def test_query_input_coercion(self) -> None:
        r = _make_dummy_result()
        p1 = create_evidence_pack("plain query text", [r])
        assert p1.query_text == "plain query text"
        assert p1.structured_query is None

        pq = ParsedQuery(raw_query="parsed text", intent="financing_inquiry")
        p2 = create_evidence_pack(pq, [r])
        assert p2.query_text == "parsed text"
        assert p2.structured_query == pq

        rq = RetrievalQuery(query_text="retrieval text")
        p3 = create_evidence_pack(rq, [r])
        assert p3.query_text == "retrieval text"
        assert p3.structured_query == rq

        p4 = create_evidence_pack({"raw_query": "dict raw text"}, [r])
        assert p4.query_text == "dict raw text"

        p5 = create_evidence_pack({"query_text": "dict query text"}, [r])
        assert p5.query_text == "dict query text"

        with pytest.raises(ValueError, match="must contain 'raw_query' or 'query_text'"):
            create_evidence_pack({"other": "text"}, [r])

        with pytest.raises(TypeError, match="Unsupported query type"):
            create_evidence_pack(12345, [r])  # type: ignore

    def test_explicit_parsed_and_retrieval_query_parameters(self) -> None:
        r = _make_dummy_result()
        pq = ParsedQuery(raw_query="from parsed", intent="financing_inquiry")
        rq = RetrievalQuery(query_text="from retrieval")

        p_pq = create_evidence_pack(query="", retrieval_results=[r], parsed_query=pq)
        assert p_pq.query_text == "from parsed"

        p_rq = create_evidence_pack(query="", retrieval_results=[r], retrieval_query=rq)
        assert p_rq.query_text == "from retrieval"

    def test_retrieval_results_coercion_types(self) -> None:
        item = EvidenceItem.from_retrieval_result(_make_dummy_result(chunk_id="c_item"))
        rr = _make_dummy_result(chunk_id="c_rr")
        d = EvidenceItem.from_retrieval_result(_make_dummy_result(chunk_id="c_dict")).to_dict()

        pack = create_evidence_pack("mixed results", [item, rr, d])
        assert pack.result_count == 3
        assert pack.evidence_items[0].chunk_id == "c_item"
        assert pack.evidence_items[1].chunk_id == "c_rr"
        assert pack.evidence_items[2].chunk_id == "c_dict"

        with pytest.raises(EvidenceItemValidationError, match="Unsupported evidence result type"):
            create_evidence_pack("test", ["invalid_result"])  # type: ignore

    def test_custom_warnings_and_limitations_deduplication(self) -> None:
        r = _make_dummy_result()
        pack = create_evidence_pack(
            query="test",
            retrieval_results=[r],
            warnings=["Custom warning", "Custom warning"],
            limitations=["Custom limitation", "Custom limitation"],
        )
        assert pack.warnings.count("Custom warning") == 1
        assert pack.limitations.count("Custom limitation") == 1

    def test_serialization_round_trip(self) -> None:
        r = _make_dummy_result()
        pq = ParsedQuery(raw_query="how to start", intent="business_inquiry")
        pack = create_evidence_pack(pq, [r])
        p_dict = pack.to_dict()

        reconstructed = EvidencePack.from_dict(p_dict)
        assert reconstructed.query_text == pack.query_text
        assert reconstructed.result_count == pack.result_count
        assert reconstructed.evidence_available == pack.evidence_available
        assert isinstance(reconstructed.structured_query, ParsedQuery)

        # RetrievalQuery round-trip in structured_query
        rq = RetrievalQuery(query_text="retrieval text")
        pack_rq = create_evidence_pack(rq, [r])
        reconstructed_rq = EvidencePack.from_dict(pack_rq.to_dict())
        assert isinstance(reconstructed_rq.structured_query, RetrievalQuery)

        # Plain dict structured_query round-trip
        pack_dict_sq = create_evidence_pack({"raw_query": "dict query", "custom_flag": True}, [r])
        d_sq = pack_dict_sq.to_dict()
        assert d_sq["structured_query"]["custom_flag"] is True
        reconstructed_dict_sq = EvidencePack.from_dict(d_sq)
        assert isinstance(reconstructed_dict_sq.structured_query, dict)

        # None structured_query round-trip
        pack_none_sq = create_evidence_pack("plain query", [r])
        d_none = pack_none_sq.to_dict()
        assert d_none["structured_query"] is None
        reconstructed_none = EvidencePack.from_dict(d_none)
        assert reconstructed_none.structured_query is None

        with pytest.raises(EvidencePackValidationError):
            EvidencePack.from_dict("not-a-dict")  # type: ignore

        with pytest.raises(EvidencePackValidationError):
            EvidencePack.from_dict({"query_text": "q", "evidence_items": "not-a-list"})

    def test_format_evidence_pack_summary(self) -> None:
        r_temp = _make_dummy_result(
            chunk_id="dairy_p001_c001",
            document_id="dairy_yogurt_plant_project_report",
            document_type="project_report_template",
            is_template_data=True,
            year=None,
        )
        r_hist = _make_dummy_result(
            chunk_id="mathura_p001_c001",
            document_id="mathura_district_industrial_profile",
            document_type="district_knowledge",
            geography={"state": "Uttar Pradesh", "district": "Mathura"},
            year="2011",
            is_template_data=False,
        )
        pack = create_evidence_pack("summary test", [r_temp, r_hist])
        text = format_evidence_pack_summary(pack)
        assert "Query: 'summary test'" in text
        assert "Contains Template Data" in text
        assert "Contains Historical Data" in text
        assert "dairy_yogurt_plant_project_report" in text

        # Empty pack format summary (covers limitations and no-flags branches)
        empty_pack = create_evidence_pack("empty test", [])
        empty_text = format_evidence_pack_summary(empty_pack)
        assert "Status: no_match" in empty_text
        assert "Limitations" in empty_text


class TestIntegrationWithKnowledgeBase:
    """Integration test against actual persistent ChromaDB vector store."""

    def test_real_retrieval_and_evidence_pack_pipeline(self) -> None:
        retriever = KnowledgeRetriever()

        # 1. PMFME retrieval
        q_pmfme = RetrievalQuery(query_text="What financial assistance is given under PMFME?", scheme="PMFME", top_k=2)
        res_pmfme = retriever.retrieve(q_pmfme)
        assert len(res_pmfme) > 0
        pack_pmfme = create_evidence_pack(q_pmfme, res_pmfme)
        assert pack_pmfme.evidence_available is True
        assert any(it.scheme == "PMFME" for it in pack_pmfme.evidence_items)
        assert any("PMFME scheme guidelines" in lim for lim in pack_pmfme.limitations)

        # 2. Dairy template retrieval
        q_dairy = RetrievalQuery(query_text="Yogurt plant machinery cost", business_category="dairy", is_template_data=True, top_k=2)
        res_dairy = retriever.retrieve(q_dairy)
        assert len(res_dairy) > 0
        pack_dairy = create_evidence_pack(q_dairy, res_dairy)
        assert pack_dairy.has_template_data is True
        assert all(it.is_template_data is True for it in pack_dairy.evidence_items)
        assert any("template/reference data" in w for w in pack_dairy.warnings)

        # 3. Mathura profile retrieval
        q_mathura = RetrievalQuery(query_text="Industrial profile and registered units", geography_district="Mathura", top_k=2)
        res_mathura = retriever.retrieve(q_mathura)
        assert len(res_mathura) > 0
        pack_mathura = create_evidence_pack(q_mathura, res_mathura)
        assert pack_mathura.has_historical_data is True
        assert all(it.year == "2011" for it in pack_mathura.evidence_items)
        assert any("2011 baseline vintage" in w for w in pack_mathura.warnings)
