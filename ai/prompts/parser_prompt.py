"""
parser_prompt.py

Step 4 of the SAKSHAM AI/RAG pipeline: Intent and query parsing layer.
Provides prompt templates, structured output schema, and prompt builders
for converting user natural language inquiries into structured parameters.

Architectural Rule:
    DATA PROVIDES EVIDENCE, DETERMINISTIC ENGINES CALCULATE, AI EXPLAINS.
    - Prompts guide information extraction only.
    - Never asks the LLM to calculate financial figures or decide eligibility.
    - Instructs the LLM to return null for unmentioned fields rather than guessing.
"""

from __future__ import annotations

import json
from typing import Any, Callable

from ai.prompts.query_parser import (
    ParsedGeography,
    ParsedQuery,
    ParserValidationError,
    QueryIntent,
    QueryParser,
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

__all__ = [
    "PARSER_SYSTEM_PROMPT",
    "PARSER_JSON_SCHEMA",
    "build_parser_prompt",
    "ParsedGeography",
    "ParsedQuery",
    "ParserValidationError",
    "QueryIntent",
    "QueryParser",
    "parse_query",
    "parse_llm_response",
    "extract_deterministic",
    "detect_missing_fields",
    "normalize_amount",
    "normalize_district",
    "normalize_state",
    "normalize_village",
    "normalize_block",
    "normalize_business_category",
    "normalize_scheme",
    "normalize_intent",
    "normalize_text",
]

PARSER_SYSTEM_PROMPT: str = (
    "You are SAKSHAM's Query Parsing Assistant for rural micro-entrepreneurs.\n"
    "Your ONLY role is information extraction. Convert user natural language into structured JSON.\n\n"
    "MANDATORY RULES:\n"
    "1. DATA HONESTY: Extract ONLY facts explicitly stated by user. NEVER invent or guess.\n"
    "2. NO CALCULATIONS: Never calculate project cost, EMI, margins, subsidies, or eligibility.\n"
    "3. NO RECOMMENDATIONS: Do not recommend business ideas or claim suitability.\n"
    "4. LOAN VS CAPITAL: 'loan_amount' is debt requested; 'own_capital' is personal margin money.\n"
    "5. GEOGRAPHY: Distinguish village, block, district, and state. Leave missing fields null.\n"
    "6. MISSING FIELDS: Use null for missing fields. Never use 0, 'unknown', or guessed values.\n"
    "7. OUTPUT FORMAT: Return a single valid JSON object strictly conforming to the schema."
)

PARSER_JSON_SCHEMA: dict[str, Any] = {
    "type": "object",
    "required": ["intent", "business_category", "geography", "loan_amount", "own_capital", "purpose", "is_ambiguous"],
    "properties": {
        "intent": {
            "type": "string",
            "enum": [item.value for item in QueryIntent],
        },
        "purpose": {"type": ["string", "null"]},
        "business_category": {"type": ["string", "null"]},
        "geography": {
            "type": ["object", "null"],
            "properties": {
                "village": {"type": ["string", "null"]},
                "block": {"type": ["string", "null"]},
                "district": {"type": ["string", "null"]},
                "state": {"type": ["string", "null"]},
            },
        },
        "loan_amount": {"type": ["number", "null"]},
        "own_capital": {"type": ["number", "null"]},
        "scheme": {"type": ["string", "null"]},
        "is_ambiguous": {"type": "boolean"},
    },
}


def build_parser_prompt(query_text: str) -> str:
    """Build user prompt for query parsing LLM call."""
    return (
        f"Parse the following user query into structured JSON:\n"
        f"Query: \"{query_text}\"\n\n"
        f"JSON Schema:\n{json.dumps(PARSER_JSON_SCHEMA, indent=2)}\n"
        f"Return ONLY valid JSON."
    )
