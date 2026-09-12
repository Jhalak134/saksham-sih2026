"""test_grounding_claims.py

Task 11 — Content-Level Grounding Hardening: Quantitative Claim Verification (<500 LOC).

Verifies:
1. Supported numeric claims pass
2. Unsupported numeric claims rejected / flagged
3. Supported percentage claims pass
4. Unsupported percentage claims rejected / flagged
5. Supported currency amounts pass (with equivalent formatting: lakh vs full digits)
6. Unsupported currency amounts rejected / flagged
7. Supported interest rates pass (via calculations)
8. Fabricated interest rates rejected / flagged
9. Supported loan tenure passes (months & years conversion)
10. Fabricated tenure rejected / flagged
11. Valid citation but unsupported claim is not accepted as grounded
12. Multiple citations with one unsupported quantitative claim
13. No evidence + quantitative claim
14. Template evidence + quantitative claim
15. Historical evidence + quantitative claim
16. Equivalent formatting: ₹1,00,000 vs ₹100000 vs 1 lakh
17. Percentage formatting: 35% vs 35 percent
18. False positive scenario: same number (35%), conflicting concept (subsidy vs margin)
19. Financial calculation protection against conflicting values
20. Downgrade mode (reject_unsupported=False) yielding ungrounded_flagged with warnings
"""

from __future__ import annotations

import pytest

from ai.grounding.evidence_pack import create_evidence_pack
from ai.prompts.claim_verifier import (
    are_concepts_compatible,
    detect_concept,
    extract_claims_from_calculations,
    extract_claims_from_text,
    normalize_currency_amount,
    verify_quantitative_grounding,
)
from ai.prompts.explanation_models import ExplanationValidationError, GroundingStatus
from ai.prompts.explanation_prompt import parse_explanation_response
from ai.tests.conftest import (
    make_dairy_template_item,
    make_entrepreneurship_item,
    make_mathura_historical_item,
    make_pmfme_item,
    make_valid_response_dict,
)


class TestClaimExtractionAndConceptUnits:
    """Unit verification of extraction, normalization, and concept compatibility."""

    def test_extract_percentages_and_variations(self) -> None:
        text = "Grant is 35% with 8.5 percent interest and 0% margin."
        claims = extract_claims_from_text(text)
        vals = [(c.normalized_value, c.unit, c.concept) for c in claims]
        assert (35.0, "%", "subsidy") in vals
        assert (8.5, "%", "interest_rate") in vals
        assert (0.0, "%", "margin") in vals

    def test_extract_currency_and_multipliers(self) -> None:
        text = "Ceiling is Rs 10 lakh, capex is Rs 15.5 lakh, loan is ₹1,00,000 or ₹100000."
        claims = extract_claims_from_text(text)
        vals = [c.normalized_value for c in claims]
        assert 1_000_000.0 in vals
        assert 1_550_000.0 in vals
        assert 100_000.0 in vals

    def test_extract_tenure_months_and_years(self) -> None:
        text = "Repayment tenure is 60 months or 5 years with 84 months maximum."
        claims = extract_claims_from_text(text)
        months = [c.normalized_value for c in claims if c.claim_type == "tenure"]
        assert 60.0 in months
        assert 84.0 in months

    def test_normalize_currency_edge_cases(self) -> None:
        assert normalize_currency_amount("10", "crore") == 100_000_000.0
        assert normalize_currency_amount("50", "k") == 50_000.0
        assert normalize_currency_amount("invalid_num") is None

    def test_concept_conflict_matrix(self) -> None:
        assert are_concepts_compatible("subsidy", "margin") is False
        assert are_concepts_compatible("subsidy", "interest_rate") is False
        assert are_concepts_compatible("profit", "project_cost") is False
        assert are_concepts_compatible("subsidy", "subsidy") is True
        assert are_concepts_compatible("subsidy", None) is True

    def test_extract_empty_or_whitespace_text(self) -> None:
        assert extract_claims_from_text("") == []
        assert extract_claims_from_text("   \n\t  ") == []
        assert extract_claims_from_calculations(None) == []


class TestQuantitativeGroundingVerification:
    """Core Task 11 content-level grounding tests across requirements 1 to 20."""

    def test_1_supported_numeric_claim_passes(self) -> None:
        item = make_mathura_historical_item()
        pack = create_evidence_pack(query="Mathura units", retrieval_results=[item])
        payload = make_valid_response_dict(
            item.chunk_id, item.document_id, item.source,
            answer="Mathura district records 350 units in industrial profile.",
        )
        res = parse_explanation_response(payload, pack)
        assert res.grounding_status == GroundingStatus.GROUNDED.value

    def test_2_unsupported_numeric_claim_rejected(self) -> None:
        item = make_mathura_historical_item()
        pack = create_evidence_pack(query="Mathura units", retrieval_results=[item])
        payload = make_valid_response_dict(
            item.chunk_id, item.document_id, item.source,
            answer="Mathura district records 999 units in active operation.",
        )
        with pytest.raises(ExplanationValidationError, match="Unsupported quantitative claim in answer"):
            parse_explanation_response(payload, pack)

    def test_3_supported_percentage_passes(self) -> None:
        item = make_pmfme_item()
        pack = create_evidence_pack(query="PMFME grant", retrieval_results=[item])
        payload = make_valid_response_dict(
            item.chunk_id, item.document_id, item.source,
            answer="PMFME provides a 35% credit-linked grant.",
        )
        res = parse_explanation_response(payload, pack)
        assert res.grounding_status == GroundingStatus.GROUNDED.value

    def test_4_unsupported_percentage_rejected(self) -> None:
        item = make_pmfme_item()
        pack = create_evidence_pack(query="PMFME grant", retrieval_results=[item])
        payload = make_valid_response_dict(
            item.chunk_id, item.document_id, item.source,
            answer="PMFME provides an 85% credit-linked grant.",
        )
        with pytest.raises(ExplanationValidationError, match="Unsupported quantitative claim in answer: '85%'"):
            parse_explanation_response(payload, pack)

    def test_5_supported_currency_amount_passes(self) -> None:
        item = make_pmfme_item()
        pack = create_evidence_pack(query="PMFME grant", retrieval_results=[item])
        payload = make_valid_response_dict(
            item.chunk_id, item.document_id, item.source,
            answer="Grant has a maximum ceiling of Rs 10,00,000.",
        )
        res = parse_explanation_response(payload, pack)
        assert res.grounding_status == GroundingStatus.GROUNDED.value

    def test_6_unsupported_currency_amount_rejected(self) -> None:
        item = make_pmfme_item()
        pack = create_evidence_pack(query="PMFME grant", retrieval_results=[item])
        payload = make_valid_response_dict(
            item.chunk_id, item.document_id, item.source,
            answer="Grant has a maximum ceiling of Rs 50,00,000.",
        )
        with pytest.raises(ExplanationValidationError, match="Unsupported quantitative claim in answer"):
            parse_explanation_response(payload, pack)

    def test_7_supported_interest_rate_from_calculations_passes(self) -> None:
        item = make_pmfme_item()
        pack = create_evidence_pack(query="Loan terms", retrieval_results=[item])
        calcs = {"interest_rate": 8.5, "monthly_emi": 15000.0}
        payload = make_valid_response_dict(
            item.chunk_id, item.document_id, item.source,
            answer="The interest rate is 8.5% with 35% grant support.",
        )
        res = parse_explanation_response(payload, pack, calculations=calcs)
        assert res.grounding_status == GroundingStatus.GROUNDED.value

    def test_8_fabricated_interest_rate_rejected(self) -> None:
        item = make_entrepreneurship_item()
        pack = create_evidence_pack(query="Loan interest", retrieval_results=[item])
        payload = make_valid_response_dict(
            item.chunk_id, item.document_id, item.source,
            answer="Agribusiness loans feature an interest rate of 4.5%.",
        )
        with pytest.raises(ExplanationValidationError, match="Unsupported quantitative claim in answer: '4.5%'"):
            parse_explanation_response(payload, pack)

    def test_9_supported_tenure_passes(self) -> None:
        item = make_pmfme_item()
        pack = create_evidence_pack(query="Repayment tenure", retrieval_results=[item])
        calcs = {"tenure_months": 60}
        payload = make_valid_response_dict(
            item.chunk_id, item.document_id, item.source,
            answer="The repayment tenure is 60 months with 35% subsidy.",
        )
        res = parse_explanation_response(payload, pack, calculations=calcs)
        assert res.grounding_status == GroundingStatus.GROUNDED.value

    def test_10_fabricated_tenure_rejected(self) -> None:
        item = make_pmfme_item()
        pack = create_evidence_pack(query="Repayment tenure", retrieval_results=[item])
        calcs = {"tenure_months": 60}
        payload = make_valid_response_dict(
            item.chunk_id, item.document_id, item.source,
            answer="The repayment tenure is 120 months.",
        )
        with pytest.raises(ExplanationValidationError, match="Unsupported quantitative claim in answer: '120 months'"):
            parse_explanation_response(payload, pack, calculations=calcs)

    def test_11_valid_citation_with_unsupported_claim_not_grounded(self) -> None:
        item = make_pmfme_item()
        pack = create_evidence_pack(query="Subsidy query", retrieval_results=[item])
        # Valid citation ID, but completely fabricated 99% subsidy claim
        payload = make_valid_response_dict(
            chunk_id=item.chunk_id,
            document_id=item.document_id,
            source=item.source,
            answer="Under PMFME guidelines, the interest rate is 99%.",
        )
        with pytest.raises(ExplanationValidationError, match="Unsupported quantitative claim in answer: '99%'"):
            parse_explanation_response(payload, pack)

    def test_12_multiple_citations_with_one_unsupported_claim(self) -> None:
        item1 = make_pmfme_item(chunk_id="c1")
        item2 = make_dairy_template_item(chunk_id="c2")
        pack = create_evidence_pack(query="Multi query", retrieval_results=[item1, item2])
        payload = {
            "answer": "PMFME gives 35% grant, dairy capex is Rs 15.5 lakh, and profit is ₹90,000.",
            "key_points": ["35% grant", "15.5 lakh capex"],
            "citations": [
                {"chunk_id": "c1", "document_id": item1.document_id, "source": item1.source},
                {"chunk_id": "c2", "document_id": item2.document_id, "source": item2.source},
            ],
            "limitations": [],
            "warnings": [],
            "evidence_used": ["c1", "c2"],
            "grounding_status": "grounded",
        }
        with pytest.raises(ExplanationValidationError, match="Unsupported quantitative claim in answer: '₹90,000'"):
            parse_explanation_response(payload, pack)

    def test_13_no_evidence_with_quantitative_claim_rejected(self) -> None:
        pack = create_evidence_pack(query="Bakery profit", retrieval_results=[])
        payload = {
            "answer": "Your bakery will generate ₹50,000 monthly profit.",
            "key_points": ["₹50,000 profit"],
            "citations": [],
            "limitations": [],
            "warnings": [],
            "evidence_used": [],
            "grounding_status": "grounded",
        }
        with pytest.raises(ExplanationValidationError, match="grounding_status cannot be 'grounded'"):
            parse_explanation_response(payload, pack)

    def test_14_template_evidence_with_quantitative_claim_preserves_warning(self) -> None:
        item = make_dairy_template_item()
        pack = create_evidence_pack(query="Yogurt capex", retrieval_results=[item])
        payload = make_valid_response_dict(
            item.chunk_id, item.document_id, item.source,
            answer="Estimated capital expenditure is Rs 15.5 lakh.",
        )
        res = parse_explanation_response(payload, pack)
        assert res.grounding_status == GroundingStatus.GROUNDED.value
        assert any("template/reference data" in w for w in res.warnings)

    def test_15_historical_evidence_with_quantitative_claim_preserves_warning(self) -> None:
        item = make_mathura_historical_item()
        pack = create_evidence_pack(query="Mathura units", retrieval_results=[item])
        payload = make_valid_response_dict(
            item.chunk_id, item.document_id, item.source,
            answer="Recorded total is 350 units in Mathura.",
        )
        res = parse_explanation_response(payload, pack)
        assert res.grounding_status == GroundingStatus.GROUNDED.value
        assert any("2011 baseline vintage" in w for w in res.warnings)

    def test_16_equivalent_formatting_variations(self) -> None:
        item = make_pmfme_item(text="Grant ceiling is Rs 10 lakh (Rs. 1000000).")
        pack = create_evidence_pack(query="Grant ceiling", retrieval_results=[item])
        payload = make_valid_response_dict(
            item.chunk_id, item.document_id, item.source,
            answer="The ceiling is ₹10,00,000.",
        )
        res = parse_explanation_response(payload, pack)
        assert res.grounding_status == GroundingStatus.GROUNDED.value

    def test_17_percentage_formatting_variations(self) -> None:
        item = make_pmfme_item(text="Grant @ 35% with credit linkage.")
        pack = create_evidence_pack(query="Grant percent", retrieval_results=[item])
        payload = make_valid_response_dict(
            item.chunk_id, item.document_id, item.source,
            answer="The subsidy rate is 35 percent.",
        )
        res = parse_explanation_response(payload, pack)
        assert res.grounding_status == GroundingStatus.GROUNDED.value

    def test_18_false_positive_prevention_concept_conflict(self) -> None:
        # Evidence says subsidy is 35%. Answer claims margin is 35%.
        item = make_pmfme_item(text="Credit-linked grant at 35% of eligible project cost.")
        pack = create_evidence_pack(query="Margin requirement", retrieval_results=[item])
        payload = make_valid_response_dict(
            item.chunk_id, item.document_id, item.source,
            answer="The borrower promoter margin requirement is 35%.",
        )
        with pytest.raises(ExplanationValidationError, match="Unsupported quantitative claim in answer: '35%'"):
            parse_explanation_response(payload, pack)

    def test_19_financial_calculation_conflict_rejected(self) -> None:
        item = make_pmfme_item()
        pack = create_evidence_pack(query="EMI inquiry", retrieval_results=[item])
        calcs = {"monthly_emi": 27415.0, "loan_amount": 1350000.0}
        payload = make_valid_response_dict(
            item.chunk_id, item.document_id, item.source,
            answer="Your monthly EMI is ₹5,000 with 35% subsidy.",
        )
        with pytest.raises(ExplanationValidationError, match="Unsupported quantitative claim in answer: '₹5,000'"):
            parse_explanation_response(payload, pack, calculations=calcs)

    def test_20_downgrade_mode_when_reject_unsupported_is_false(self) -> None:
        item = make_pmfme_item()
        pack = create_evidence_pack(query="Subsidy query", retrieval_results=[item])
        payload = make_valid_response_dict(
            item.chunk_id, item.document_id, item.source,
            answer="PMFME grant is 35% and market interest rate is 14%.",
        )
        res = parse_explanation_response(payload, pack, reject_unsupported=False)
        assert res.grounding_status == GroundingStatus.UNGROUNDED_FLAGGED.value
        assert any("Answer contains ungrounded quantitative claim '14%'" in w for w in res.warnings)

    def test_21_already_flagged_ungrounded_retains_status_with_warning(self) -> None:
        item = make_pmfme_item()
        pack = create_evidence_pack(query="Subsidy query", retrieval_results=[item])
        payload = make_valid_response_dict(
            item.chunk_id, item.document_id, item.source,
            answer="PMFME grant is 35% and market interest rate is 14%.",
            status=GroundingStatus.UNGROUNDED_FLAGGED.value,
        )
        res = parse_explanation_response(payload, pack)
        assert res.grounding_status == GroundingStatus.UNGROUNDED_FLAGGED.value
        assert any("14%" in w for w in res.warnings)

    def test_22_claim_verifier_helper_edge_cases(self) -> None:
        from ai.prompts.claim_verifier import (
            _edge_distance,
            detect_concept,
            normalize_currency_amount,
            claims_match,
            QuantitativeClaim,
            extract_claims_from_calculations,
        )
        # 1. Edge distance when spans overlap
        assert _edge_distance(5, 10, 6, 8) == 0.0

        # 2. Detect concept returns None when keyword is far (> 60 chars away)
        far_text = "interest " + ("x" * 70) + "35%"
        assert detect_concept(far_text, 80, 83) is None

        # 3. Currency normalizer with thousand / k, unsupported multiplier, and invalid string
        assert normalize_currency_amount("50", "k") == 50_000.0
        assert normalize_currency_amount("50", "thousand") == 50_000.0
        assert normalize_currency_amount("50", "unsupported_unit") == 50.0
        assert normalize_currency_amount("invalid") is None

        # 4. Calculation extraction handles invalid types gracefully
        bad_calcs = {"interest_rate": "not_a_number", "loan_amount": None}
        extracted = extract_claims_from_calculations(bad_calcs)
        assert len(extracted) == 0

        # 5. Claims match rejects mismatched units
        c1 = QuantitativeClaim("35%", "percentage", 35.0, "%", "subsidy", "ctx")
        c2 = QuantitativeClaim("35", "percentage", 35.0, "units", "subsidy", "ctx")
        assert claims_match(c1, c2) is False

    def test_23_explanation_prompt_warning_deduplication_and_flagged_grounded(
        self, monkeypatch: pytest.MonkeyPatch
    ) -> None:
        from ai.prompts.claim_verifier import GroundingVerificationResult
        import ai.prompts.explanation_prompt as ep
        item = make_pmfme_item()
        pack = create_evidence_pack(query="Subsidy query", retrieval_results=[item])

        # Existing warning should not be duplicated when reject_unsupported=False
        expected_warning = (
            "Answer contains ungrounded quantitative claim '14%' not supported by "
            "cited evidence or pre-computed calculations."
        )
        payload = make_valid_response_dict(
            chunk_id=item.chunk_id,
            document_id=item.document_id,
            source=item.source,
            answer="PMFME grant is 35% and market interest rate is 14%.",
        )
        payload["warnings"] = [expected_warning]
        res = parse_explanation_response(payload, pack, reject_unsupported=False)
        assert res.warnings.count(expected_warning) == 1

        # Existing warning not duplicated when status is UNGROUNDED_FLAGGED
        payload_flagged = make_valid_response_dict(
            chunk_id=item.chunk_id,
            document_id=item.document_id,
            source=item.source,
            answer="PMFME grant is 35% and market interest rate is 14%.",
            status=GroundingStatus.UNGROUNDED_FLAGGED.value,
        )
        payload_flagged["warnings"] = [expected_warning]
        res2 = parse_explanation_response(
            payload_flagged,
            pack,
            reject_unsupported=True,
        )
        assert res2.warnings.count(expected_warning) == 1

        # Status is UNGROUNDED_FLAGGED but all claims in answer are actually grounded
        payload_grounded = make_valid_response_dict(
            chunk_id=item.chunk_id,
            document_id=item.document_id,
            source=item.source,
            answer="PMFME grant is 35%.",
            status=GroundingStatus.UNGROUNDED_FLAGGED.value,
        )
        res3 = parse_explanation_response(payload_grounded, pack)
        assert res3.grounding_status == GroundingStatus.UNGROUNDED_FLAGGED.value

        # Branch coverage: verification.warning_message is None
        none_res = GroundingVerificationResult(
            is_grounded=False,
            supported_claims=[],
            unsupported_claims=[],
            warning_message=None,
            downgraded_status=GroundingStatus.UNGROUNDED_FLAGGED.value,
        )
        monkeypatch.setattr(ep, "verify_quantitative_grounding", lambda **kw: none_res)
        p_grounded = make_valid_response_dict(
            chunk_id=item.chunk_id,
            document_id=item.document_id,
            source=item.source,
            status=GroundingStatus.GROUNDED.value,
        )
        res4 = parse_explanation_response(p_grounded, pack, reject_unsupported=False)
        assert res4.grounding_status == GroundingStatus.UNGROUNDED_FLAGGED.value

        p_flagged = make_valid_response_dict(
            chunk_id=item.chunk_id,
            document_id=item.document_id,
            source=item.source,
            status=GroundingStatus.UNGROUNDED_FLAGGED.value,
        )
        res5 = parse_explanation_response(p_flagged, pack, reject_unsupported=True)
        assert res5.grounding_status == GroundingStatus.UNGROUNDED_FLAGGED.value

    def test_24_claim_verifier_defensive_regex_fallbacks(self, monkeypatch: pytest.MonkeyPatch) -> None:
        from ai.prompts.claim_verifier import extract_claims_from_text
        import ai.prompts.claim_verifier as cv

        # Test defensive float/int conversion failures
        orig_float = float
        def mock_float(val: object) -> float:
            if isinstance(val, str) and ("35" in val or "350" in val):
                raise ValueError("Simulated float failure")
            return orig_float(val)  # type: ignore[arg-type]

        monkeypatch.setattr("builtins.float", mock_float)
        claims = extract_claims_from_text("35% subsidy and 350 units")
        assert len(claims) == 0

        monkeypatch.undo()

        orig_int = int
        def mock_int(val: object) -> int:
            if isinstance(val, str) and "36" in val:
                raise ValueError("Simulated int failure")
            return orig_int(val)  # type: ignore[arg-type]

        monkeypatch.setattr("builtins.int", mock_int)
        claims_tenure = extract_claims_from_text("Tenure is 36 months.")
        assert len(claims_tenure) == 0

        monkeypatch.undo()

        # Currency pattern returning None from normalizer
        monkeypatch.setattr(cv, "normalize_currency_amount", lambda a, b: None)
        claims_curr = extract_claims_from_text("Loan of Rs 10 lakh.")
        assert len(claims_curr) == 0
