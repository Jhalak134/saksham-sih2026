"""
test_parser.py

Deterministic test suite for Task 4 — SAKSHAM Intent and Query Parser.
Verifies:
- All 25 required test cases from task specification
- Schema types, normalization routines, and detection of missing fields
- LLM output parsing, markdown fence stripping, and validation errors
- Loan amount vs margin capital distinction
- Deterministic extraction for English, Hindi, and Hinglish queries
- Retriever query integration bridge
- Quality gates: 100% line & branch coverage, zero dead code
"""

from __future__ import annotations

import pytest

from ai.prompts.parser_prompt import (
    PARSER_JSON_SCHEMA,
    PARSER_SYSTEM_PROMPT,
    ParsedGeography,
    ParsedQuery,
    ParserValidationError,
    QueryIntent,
    QueryParser,
    build_parser_prompt,
    detect_missing_fields,
    extract_deterministic,
    normalize_amount,
    normalize_block,
    normalize_business_category,
    normalize_district,
    normalize_intent,
    normalize_scheme,
    normalize_state,
    normalize_text,
    normalize_village,
    parse_llm_response,
    parse_query,
)


class TestParserSchemasAndTypes:
    """Tests for core domain dataclasses, enums, and exceptions."""

    def test_query_intent_enum(self) -> None:
        assert QueryIntent.FINANCING_INQUIRY == "financing_inquiry"
        assert QueryIntent.SCHEME_INQUIRY == "scheme_inquiry"
        assert QueryIntent.BUSINESS_INQUIRY == "business_inquiry"
        assert QueryIntent.FEASIBILITY_INQUIRY == "feasibility_inquiry"
        assert QueryIntent.GENERAL_INFORMATION == "general_information"
        assert QueryIntent.UNKNOWN == "unknown"

    def test_parser_validation_error(self) -> None:
        err = ParserValidationError("invalid output")
        assert isinstance(err, ValueError)
        assert str(err) == "invalid output"

    def test_parsed_geography_methods(self) -> None:
        geo = ParsedGeography(village="Farah", block="Farah", district="Mathura", state="Uttar Pradesh")
        assert not geo.is_empty()
        d = geo.to_dict()
        assert d == {"village": "Farah", "block": "Farah", "district": "Mathura", "state": "Uttar Pradesh"}

        empty_geo = ParsedGeography()
        assert empty_geo.is_empty()
        assert ParsedGeography.from_dict(None) is None
        assert ParsedGeography.from_dict("not_a_dict") is None  # type: ignore[arg-type]
        assert ParsedGeography.from_dict({}) is None

        created = ParsedGeography.from_dict({"district": "mathura district", "state": "up"})
        assert created is not None
        assert created.district == "Mathura"
        assert created.state == "Uttar Pradesh"

    def test_parsed_query_methods_and_retrieval_bridge(self) -> None:
        geo = ParsedGeography(district="Mathura", state="Uttar Pradesh")
        pq = ParsedQuery(
            raw_query="start dairy in Mathura",
            intent="financing_inquiry",
            business_category="dairy",
            geography=geo,
            loan_amount=500000.0,
            own_capital=100000.0,
            purpose="start unit",
            scheme="PMFME",
        )
        d = pq.to_dict()
        assert d["raw_query"] == "start dairy in Mathura"
        assert d["geography"]["district"] == "Mathura"
        assert d["loan_amount"] == 500000.0

        rq = pq.to_retrieval_query(top_k=3)
        assert rq.query_text == "start dairy in Mathura"
        assert rq.business_category == "dairy"
        assert rq.geography_district == "Mathura"
        assert rq.geography_state == "Uttar Pradesh"
        assert rq.scheme == "PMFME"
        assert rq.top_k == 3

        pq_no_geo = ParsedQuery(raw_query="hello", intent="unknown")
        rq_no_geo = pq_no_geo.to_retrieval_query()
        assert rq_no_geo.geography_district is None
        assert rq_no_geo.geography_state is None

        # from_dict validation
        with pytest.raises(ParserValidationError, match="Expected dict"):
            ParsedQuery.from_dict(["not", "dict"])  # type: ignore[arg-type]

        rebuilt = ParsedQuery.from_dict(d)
        assert rebuilt.raw_query == pq.raw_query
        assert rebuilt.business_category == "dairy"
        assert rebuilt.geography is not None
        assert rebuilt.geography.district == "Mathura"


class TestNormalizers:
    """Unit tests for safe, deterministic normalization functions."""

    def test_normalize_text(self) -> None:
        assert normalize_text(None) is None
        assert normalize_text(123) is None
        assert normalize_text("   ") is None
        assert normalize_text("  valid text  ") == "valid text"

    def test_normalize_amount_rupees_and_thousands(self) -> None:
        assert normalize_amount(None) is None
        assert normalize_amount(200000) == 200000.0
        assert normalize_amount(250000.5) == 250000.5
        assert normalize_amount("") is None
        assert normalize_amount("   ") is None
        assert normalize_amount("₹2,00,000") == 200000.0
        assert normalize_amount("Rs. 200000") == 200000.0
        assert normalize_amount("inr 500000") == 500000.0
        assert normalize_amount("2,00,000 rupees") == 200000.0
        assert normalize_amount("50000 रुपए") == 50000.0
        assert normalize_amount("50 thousand") == 50000.0
        assert normalize_amount("50k") == 50000.0
        assert normalize_amount("50 हज़ार") == 50000.0

    def test_normalize_amount_lakhs_and_crores(self) -> None:
        assert normalize_amount("2 lakh") == 200000.0
        assert normalize_amount("2.5 lakh") == 250000.0
        assert normalize_amount("2 lac") == 200000.0
        assert normalize_amount("2 lakhs") == 200000.0
        assert normalize_amount("2.5 lacs") == 250000.0
        assert normalize_amount("2 लाख") == 200000.0
        assert normalize_amount("1 crore") == 10000000.0
        assert normalize_amount("1.5 cr") == 15000000.0
        assert normalize_amount("2 crores") == 20000000.0
        assert normalize_amount("1 करोड़") == 10000000.0

    def test_normalize_amount_errors(self) -> None:
        with pytest.raises(ValueError, match="Amount cannot be negative"):
            normalize_amount(-100)
        with pytest.raises(ValueError, match="Amount cannot be negative"):
            normalize_amount("-200")
        with pytest.raises(TypeError, match="Amount must be numeric or str"):
            normalize_amount(["100"])
        with pytest.raises(ValueError, match="Cannot parse numeric amount"):
            normalize_amount("invalid amount")

    def test_normalize_district(self) -> None:
        assert normalize_district(None) is None
        assert normalize_district("   ") is None
        assert normalize_district("Mathura district") == "Mathura"
        assert normalize_district("mathura dist") == "Mathura"
        assert normalize_district("Mathura ज़िला") == "Mathura"
        assert normalize_district("Agra district") == "Agra"
        assert normalize_district("district") is None

    def test_normalize_state(self) -> None:
        assert normalize_state(None) is None
        assert normalize_state("   ") is None
        assert normalize_state("UP") == "Uttar Pradesh"
        assert normalize_state("u.p.") == "Uttar Pradesh"
        assert normalize_state("uttar pradesh") == "Uttar Pradesh"
        assert normalize_state("उत्तर प्रदेश") == "Uttar Pradesh"
        assert normalize_state("MP") == "Madhya Pradesh"
        assert normalize_state("madhya pradesh") == "Madhya Pradesh"
        assert normalize_state("rajasthan") == "Rajasthan"
        assert normalize_state("राजस्थान") == "Rajasthan"
        assert normalize_state("punjab") == "Punjab"

    def test_normalize_village_and_block(self) -> None:
        assert normalize_village(None) is None
        assert normalize_village("Farah village") == "Farah"
        assert normalize_village("village Farah") == "Farah"
        assert normalize_village("Farah gaon") == "Farah"
        assert normalize_village("Farah गाँव") == "Farah"
        assert normalize_village("village") is None

        assert normalize_block(None) is None
        assert normalize_block("Farah block") == "Farah"
        assert normalize_block("block Farah") == "Farah"
        assert normalize_block("Farah tehsil") == "Farah"
        assert normalize_block("Farah ब्लॉक") == "Farah"
        assert normalize_block("block") is None

    def test_normalize_business_category_and_data_honesty(self) -> None:
        assert normalize_business_category(None) is None
        assert normalize_business_category("dairy") == "dairy"
        assert normalize_business_category("dairy farming") == "dairy"
        assert normalize_business_category("doodh ka kaam") == "dairy"
        assert normalize_business_category("डेयरी") == "dairy"
        assert normalize_business_category("kirana store") == "retail"
        assert normalize_business_category("retail dukaan") == "retail"
        assert normalize_business_category("garments kapda") == "textiles"
        assert normalize_business_category("food processing unit") == "food_processing"
        assert normalize_business_category("workshop fabrication") == "manufacturing"
        assert normalize_business_category("salon repair service") == "services"

        # Data Honesty: generic 'food business' does NOT become dairy
        assert normalize_business_category("food business") == "food_business"
        assert normalize_business_category("poultry farming") == "poultry_farming"

    def test_normalize_scheme(self) -> None:
        assert normalize_scheme(None) is None
        assert normalize_scheme("pmfme") == "PMFME"
        assert normalize_scheme("PM-FME") == "PMFME"
        assert normalize_scheme("pm fme scheme") == "PMFME"
        assert normalize_scheme("micro finance") == "Micro Finance Scheme"
        assert normalize_scheme("microfinance") == "Micro Finance Scheme"
        assert normalize_scheme("mfs") == "Micro Finance Scheme"
        assert normalize_scheme("term loan") == "Term Loan Scheme"
        assert normalize_scheme("tls") == "Term Loan Scheme"
        assert normalize_scheme("mudra") == "mudra"

    def test_normalize_intent(self) -> None:
        assert normalize_intent(None) == "unknown"
        assert normalize_intent("financing_inquiry") == "financing_inquiry"
        assert normalize_intent("loan inquiry") == "financing_inquiry"
        assert normalize_intent("government scheme") == "scheme_inquiry"
        assert normalize_intent("market feasibility") == "feasibility_inquiry"
        assert normalize_intent("start a business") == "business_inquiry"
        assert normalize_intent("general info") == "general_information"
        assert normalize_intent("what is the weather") == "unknown"

    def test_detect_missing_fields(self) -> None:
        # Complete
        geo = ParsedGeography(district="Mathura")
        assert detect_missing_fields("dairy", geo, 500000.0, 100000.0, "start unit") == []

        # All missing
        assert detect_missing_fields(None, None, None, None, None) == [
            "business_category",
            "geography",
            "loan_amount",
            "own_capital",
            "purpose",
        ]

        # Missing geography with empty ParsedGeography
        assert detect_missing_fields("dairy", ParsedGeography(), 500000.0, 100000.0, "start") == ["geography"]


class TestParseLLMResponse:
    """Tests for validating LLM outputs, schema adherence, and error handling."""

    def test_valid_llm_response_dict(self) -> None:
        raw_dict = {
            "intent": "financing_inquiry",
            "business_category": "dairy",
            "geography": {"village": "Farah", "block": "Farah", "district": "Mathura", "state": "Uttar Pradesh"},
            "loan_amount": 500000,
            "own_capital": 100000,
            "purpose": "dairy plant setup",
            "scheme": "PMFME",
            "is_ambiguous": False,
        }
        res = parse_llm_response(raw_dict, "5 lakh loan for dairy in Farah Mathura")
        assert res.intent == "financing_inquiry"
        assert res.business_category == "dairy"
        assert res.geography is not None
        assert res.geography.district == "Mathura"
        assert res.loan_amount == 500000.0
        assert res.own_capital == 100000.0
        assert res.scheme == "PMFME"
        assert res.missing_fields == []
        assert not res.is_ambiguous

    def test_valid_llm_response_json_string_with_code_fences(self) -> None:
        json_str = """```json
        {
            "intent": "scheme_inquiry",
            "business_category": "dairy",
            "geography": null,
            "loan_amount": null,
            "own_capital": 200000,
            "purpose": "check subsidies",
            "scheme": "pmfme",
            "is_ambiguous": false
        }
        ```"""
        res = parse_llm_response(json_str, "Tell me about PMFME for dairy with 2 lakh capital")
        assert res.intent == "scheme_inquiry"
        assert res.scheme == "PMFME"
        assert res.geography is None
        assert res.loan_amount is None
        assert res.own_capital == 200000.0
        assert "geography" in res.missing_fields
        assert "loan_amount" in res.missing_fields

    def test_parse_llm_response_empty_geography_dict(self) -> None:
        raw_dict = {
            "intent": "business_inquiry",
            "business_category": "retail",
            "geography": {"village": None, "block": None, "district": None, "state": None},
            "loan_amount": None,
            "own_capital": None,
            "purpose": "start shop",
            "is_ambiguous": False,
        }
        res = parse_llm_response(raw_dict, "start shop")
        assert res.geography is None
        assert "geography" in res.missing_fields

    def test_parse_llm_response_validation_errors(self) -> None:
        with pytest.raises(ValueError, match="query_text cannot be empty"):
            parse_llm_response({}, "")
        with pytest.raises(ValueError, match="query_text cannot be empty"):
            parse_llm_response({}, "   ")
        with pytest.raises(ParserValidationError, match="Expected str or dict"):
            parse_llm_response(12345, "some query")  # type: ignore[arg-type]
        with pytest.raises(ParserValidationError, match="Invalid JSON"):
            parse_llm_response("{not valid json", "some query")
        with pytest.raises(ParserValidationError, match="LLM response root must be a dict"):
            parse_llm_response("[1, 2, 3]", "some query")
        with pytest.raises(ParserValidationError, match="intent must be a string or null"):
            parse_llm_response({"intent": 123}, "some query")
        with pytest.raises(ParserValidationError, match="is_ambiguous must be a boolean"):
            parse_llm_response({"is_ambiguous": "maybe"}, "some query")
        with pytest.raises(ParserValidationError, match="geography must be a dict or null"):
            parse_llm_response({"geography": "Mathura"}, "some query")
        with pytest.raises(ParserValidationError, match="Invalid loan_amount"):
            parse_llm_response({"loan_amount": "invalid_number"}, "some query")
        with pytest.raises(ParserValidationError, match="Invalid own_capital"):
            parse_llm_response({"own_capital": "invalid_number"}, "some query")


class TestDeterministicExtractionAndLanguages:
    """Tests for deterministic zero-dependency parser and language handling."""

    def test_complete_financing_query_english(self) -> None:
        q = "I have 1 lakh rupees of my own money and I need a loan of 9 lakh to start a dairy business in Farah village, Mathura district, Uttar Pradesh."
        res = extract_deterministic(q)
        assert res.intent == "financing_inquiry"
        assert res.business_category == "dairy"
        assert res.own_capital == 100000.0
        assert res.loan_amount == 900000.0
        assert res.geography is not None
        assert res.geography.village == "Farah"
        assert res.geography.district == "Mathura"
        assert res.geography.state == "Uttar Pradesh"
        assert not res.is_ambiguous
        assert res.missing_fields == []

    def test_loan_vs_capital_distinction(self) -> None:
        # Case A: Only capital stated
        q1 = "I have 2 lakh rupees and want to start a dairy business in Mathura"
        res1 = extract_deterministic(q1)
        assert res1.own_capital == 200000.0
        assert res1.loan_amount is None
        assert "loan_amount" in res1.missing_fields

        # Case B: Only loan stated
        q2 = "I need a loan of 5 lakh for dairy business"
        res2 = extract_deterministic(q2)
        assert res2.loan_amount == 500000.0
        assert res2.own_capital is None
        assert "own_capital" in res2.missing_fields

        # Case C: Both stated
        q3 = "I have 2 lakh of my own capital and need 5 lakh loan"
        res3 = extract_deterministic(q3)
        assert res3.own_capital == 200000.0
        assert res3.loan_amount == 500000.0

    def test_missing_fields_preservation(self) -> None:
        # Missing loan amount & capital
        res_no_amt = extract_deterministic("I want to start a dairy business in Mathura")
        assert res_no_amt.loan_amount is None
        assert res_no_amt.own_capital is None
        assert "loan_amount" in res_no_amt.missing_fields
        assert "own_capital" in res_no_amt.missing_fields

        # Missing geography
        res_no_geo = extract_deterministic("I need a 5 lakh loan for dairy business")
        assert res_no_geo.geography is None
        assert "geography" in res_no_geo.missing_fields

        # Missing business category
        res_no_cat = extract_deterministic("I have 2 lakh in Mathura and need financing")
        assert res_no_cat.business_category is None
        assert "business_category" in res_no_cat.missing_fields

    def test_hindi_query(self) -> None:
        q = "मुझे मथुरा में 5 लाख का लोन चाहिए डेयरी के लिए"
        res = extract_deterministic(q)
        assert res.intent == "financing_inquiry"
        assert res.business_category == "dairy"
        assert res.loan_amount == 500000.0
        assert res.geography is not None
        assert res.geography.district == "Mathura"

    def test_hinglish_query(self) -> None:
        q = "mujhe dairy ka business start karna hai Mathura me 5 lakh ka loan chahiye"
        res = extract_deterministic(q)
        assert res.intent == "financing_inquiry"
        assert res.business_category == "dairy"
        assert res.loan_amount == 500000.0
        assert res.geography is not None
        assert res.geography.district == "Mathura"

    def test_ambiguous_and_empty_queries(self) -> None:
        with pytest.raises(ValueError, match="query_text cannot be empty"):
            extract_deterministic("")
        with pytest.raises(ValueError, match="query_text cannot be empty"):
            extract_deterministic("   ")

        res_hi = extract_deterministic("hello")
        assert res_hi.is_ambiguous
        assert res_hi.intent == "unknown"

        res_help = extract_deterministic("need help")
        assert res_help.is_ambiguous
        assert res_help.intent == "unknown"

    def test_no_invented_values_and_scheme_extraction(self) -> None:
        res = extract_deterministic("I need a loan of 5 lakh")
        assert res.geography is None
        assert res.business_category is None
        assert res.own_capital is None

        res_sch = extract_deterministic("Information on pmfme scheme with capital 50000")
        assert res_sch.scheme == "PMFME"
        assert res_sch.own_capital == 50000.0


class TestQueryParserAndPromptModule:
    """Tests for QueryParser class, injectable LLM callable, and prompt definitions."""

    def test_query_parser_deterministic_fallback(self) -> None:
        parser = QueryParser()
        res = parser.parse("I need a 5 lakh loan for dairy in Mathura")
        assert res.business_category == "dairy"
        assert res.loan_amount == 500000.0

        with pytest.raises(ValueError, match="query_text cannot be empty"):
            parser.parse("")

    def test_query_parser_with_mock_llm(self) -> None:
        def mock_llm(sys_prompt: str, user_prompt: str) -> dict:
            assert "SAKSHAM's Query Parsing Assistant" in sys_prompt
            assert "JSON Schema:" in user_prompt
            return {
                "intent": "financing_inquiry",
                "business_category": "dairy",
                "geography": {"village": None, "block": None, "district": "Mathura", "state": "Uttar Pradesh"},
                "loan_amount": 300000,
                "own_capital": 50000,
                "purpose": "expand dairy farm",
                "scheme": "PMFME",
                "is_ambiguous": False,
            }

        res = parse_query("expand dairy with 3 lakh loan in Mathura", llm_callable=mock_llm)
        assert res.intent == "financing_inquiry"
        assert res.loan_amount == 300000.0
        assert res.own_capital == 50000.0
        assert res.scheme == "PMFME"

    def test_prompt_constants_and_builder(self) -> None:
        assert "SAKSHAM" in PARSER_SYSTEM_PROMPT
        assert "DATA HONESTY" in PARSER_SYSTEM_PROMPT
        assert PARSER_JSON_SCHEMA["type"] == "object"
        assert "intent" in PARSER_JSON_SCHEMA["properties"]
        p = build_parser_prompt("My test query")
        assert "My test query" in p
        assert "JSON Schema:" in p
