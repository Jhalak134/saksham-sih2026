"""
query_parser.py

Domain models, normalization functions, and parsing logic for the SAKSHAM
natural-language query parsing layer (Task 4).

Architectural Rule:
    DATA PROVIDES EVIDENCE, DETERMINISTIC ENGINES CALCULATE, AI EXPLAINS.
    - Information extraction only; no financial calculations or recommendations.
    - Distinguishes loan amount (debt requested) from own capital (margin funds).
    - Preserves user uncertainty and tracks missing fields explicitly.
"""

from __future__ import annotations

import json
import re
from dataclasses import dataclass, field
from enum import Enum
from typing import TYPE_CHECKING, Any, Callable

if TYPE_CHECKING:
    from ai.retrieval.retriever import RetrievalQuery


class QueryIntent(str, Enum):
    """Supported intent taxonomy for SAKSHAM query parsing."""
    FINANCING_INQUIRY = "financing_inquiry"
    SCHEME_INQUIRY = "scheme_inquiry"
    BUSINESS_INQUIRY = "business_inquiry"
    FEASIBILITY_INQUIRY = "feasibility_inquiry"
    GENERAL_INFORMATION = "general_information"
    UNKNOWN = "unknown"


class ParserValidationError(ValueError):
    """Raised when parser input or LLM response fails validation."""
    pass


@dataclass
class ParsedGeography:
    """Structured representation of geographic location provided by the user."""
    village: str | None = None
    block: str | None = None
    district: str | None = None
    state: str | None = None

    def to_dict(self) -> dict[str, str | None]:
        """Convert geography to a serializable dictionary."""
        return {"village": self.village, "block": self.block, "district": self.district, "state": self.state}

    def is_empty(self) -> bool:
        """Return True if no geographic sub-fields are set."""
        return not any([self.village, self.block, self.district, self.state])

    @classmethod
    def from_dict(cls, data: dict[str, Any] | None) -> ParsedGeography | None:
        """Create ParsedGeography from a dictionary, returning None if empty."""
        if not data or not isinstance(data, dict):
            return None
        geo = cls(
            village=normalize_village(data.get("village")),
            block=normalize_block(data.get("block")),
            district=normalize_district(data.get("district")),
            state=normalize_state(data.get("state")),
        )
        return None if geo.is_empty() else geo


@dataclass
class ParsedQuery:
    """Structured output from query parsing."""
    raw_query: str
    intent: str
    business_category: str | None = None
    geography: ParsedGeography | None = None
    loan_amount: float | None = None
    own_capital: float | None = None
    purpose: str | None = None
    scheme: str | None = None
    missing_fields: list[str] = field(default_factory=list)
    is_ambiguous: bool = False

    def to_dict(self) -> dict[str, Any]:
        """Convert parsed query to dictionary format."""
        return {
            "raw_query": self.raw_query,
            "intent": self.intent,
            "business_category": self.business_category,
            "geography": self.geography.to_dict() if self.geography else None,
            "loan_amount": self.loan_amount,
            "own_capital": self.own_capital,
            "purpose": self.purpose,
            "scheme": self.scheme,
            "missing_fields": list(self.missing_fields),
            "is_ambiguous": self.is_ambiguous,
        }

    @classmethod
    def from_dict(cls, data: dict[str, Any]) -> ParsedQuery:
        """Construct ParsedQuery from a dictionary."""
        if not isinstance(data, dict):
            raise ParserValidationError(f"Expected dict, got {type(data).__name__}")
        geo_val = data.get("geography")
        geo = ParsedGeography.from_dict(geo_val) if isinstance(geo_val, dict) else None
        return cls(
            raw_query=str(data.get("raw_query", "")),
            intent=normalize_intent(data.get("intent")),
            business_category=normalize_business_category(data.get("business_category")),
            geography=geo,
            loan_amount=normalize_amount(data.get("loan_amount")),
            own_capital=normalize_amount(data.get("own_capital")),
            purpose=normalize_text(data.get("purpose")),
            scheme=normalize_scheme(data.get("scheme")),
            missing_fields=list(data.get("missing_fields", [])),
            is_ambiguous=bool(data.get("is_ambiguous", False)),
        )

    def to_retrieval_query(self, top_k: int = 5) -> RetrievalQuery:
        """Construct a RetrievalQuery for vector search from this parsed query."""
        from ai.retrieval.retriever import RetrievalQuery

        dist = self.geography.district if self.geography else None
        st = self.geography.state if self.geography else None
        return RetrievalQuery(
            query_text=self.raw_query,
            business_category=self.business_category,
            geography_district=dist,
            geography_state=st,
            scheme=self.scheme,
            top_k=top_k,
        )


def normalize_text(val: Any) -> str | None:
    """Strip and clean string text, returning None if empty."""
    if val is None or not isinstance(val, str):
        return None
    cleaned = val.strip()
    return cleaned if cleaned else None


def _parse_amount_multiplier(clean_text: str) -> tuple[str, float]:
    """Identify Indian numeric scale multipliers in string text."""
    pats = [
        (r"(?i)(?:\bcrores?\b|cr\b|करोड़)", 10000000.0),
        (r"(?i)(?:\blakhs?\b|\blacs?\b|lac\b|लाख)", 100000.0),
        (r"(?i)(?:\bthousands?\b|k\b|(?:हज़ार|हजार))", 1000.0),
    ]
    for pattern, mult in pats:
        if re.search(pattern, clean_text):
            return re.sub(pattern, "", clean_text).strip(), mult
    return clean_text, 1.0


def normalize_amount(val: Any) -> float | None:
    """Normalize numeric amount in rupees, lakhs, crores, or thousand notations."""
    if val is None:
        return None
    if isinstance(val, (int, float)):
        if val < 0:
            raise ValueError(f"Amount cannot be negative: {val}")
        return float(val)
    if not isinstance(val, str):
        raise TypeError(f"Amount must be numeric or str, got {type(val).__name__}")
    clean = val.strip().lower()
    if not clean:
        return None
    clean = re.sub(r"[₹,]", "", clean)
    clean = re.sub(r"(?i)\brs\.?\s*|\binr\s*|\brupees?\s*|\b(?:रुपये|रुपए)\s*", "", clean).strip()
    clean, multiplier = _parse_amount_multiplier(clean)
    try:
        num = float(clean)
    except ValueError as err:
        raise ValueError(f"Cannot parse numeric amount from '{val}'") from err
    if num < 0:
        raise ValueError(f"Amount cannot be negative: {val}")
    return num * multiplier


def normalize_district(val: Any) -> str | None:
    """Normalize district name, stripping suffixes and title-casing."""
    clean = normalize_text(val)
    if not clean:
        return None
    clean = re.sub(r"(?i)\b(district|dist\.?)\b|(ज़िला|जिला)", "", clean).strip()
    if not clean:
        return None
    return "Mathura" if clean.lower() == "mathura" else clean.title()


def normalize_state(val: Any) -> str | None:
    """Normalize state name to full canonical name."""
    clean = normalize_text(val)
    if not clean:
        return None
    lower = clean.lower()
    if lower in ("up", "u.p.", "uttar pradesh", "उत्तर प्रदेश"):
        return "Uttar Pradesh"
    if lower in ("mp", "m.p.", "madhya pradesh", "मध्य प्रदेश"):
        return "Madhya Pradesh"
    return "Rajasthan" if lower in ("rajasthan", "राजस्थान") else clean.title()


def normalize_village(val: Any) -> str | None:
    """Normalize village name, stripping village markers."""
    clean = normalize_text(val)
    if not clean:
        return None
    clean = re.sub(r"(?i)\b(village|gram|gaon)\b|(गाँव|गांव)", "", clean).strip()
    return clean.title() if clean else None


def normalize_block(val: Any) -> str | None:
    """Normalize block/tehsil name, stripping administrative markers."""
    clean = normalize_text(val)
    if not clean:
        return None
    clean = re.sub(r"(?i)\b(block|tehsil|taluka)\b|(तहसील|ब्लॉक)", "", clean).strip()
    return clean.title() if clean else None


def normalize_business_category(val: Any) -> str | None:
    """Normalize business category to canonical taxonomy without guessing."""
    clean = normalize_text(val)
    if not clean:
        return None
    lower = clean.lower()
    cat_map = [
        (("dairy", "doodh", "milk", "yogurt", "paneer", "ghee", "डेयरी", "दूध"), "dairy"),
        (("kirana", "grocery", "general store", "retail", "dukaan", "दुकान", "किराना"), "retail"),
        (("textile", "garment", "cloth", "tailor", "weaving", "kapda", "कपड़ा"), "textiles"),
        (("food processing", "food_processing", "agro processing", "bakery", "खाद्य"), "food_processing"),
        (("manufacturing", "fabrication", "workshop"), "manufacturing"),
        (("service", "services", "repair", "salon"), "services"),
    ]
    for keywords, category in cat_map:
        if any(t in lower for t in keywords):
            return category
    return lower.replace(" ", "_")


def normalize_scheme(val: Any) -> str | None:
    """Normalize scheme names to canonical identifiers."""
    clean = normalize_text(val)
    if not clean:
        return None
    lower = clean.lower()
    if "pmfme" in lower or "pm-fme" in lower or "pm fme" in lower or "पीएमएफएमई" in lower:
        return "PMFME"
    if "micro finance" in lower or "microfinance" in lower or lower == "mfs":
        return "Micro Finance Scheme"
    if "term loan" in lower or lower == "tls":
        return "Term Loan Scheme"
    return clean if len(clean) < 40 else None


def normalize_intent(val: Any) -> str:
    """Normalize user intent to the QueryIntent taxonomy."""
    clean = normalize_text(val)
    if not clean:
        return QueryIntent.UNKNOWN.value
    lower = clean.lower().replace(" ", "_").replace("-", "_")
    if lower in {item.value for item in QueryIntent}:
        return lower
    intent_keywords = [
        (("finance", "loan", "borrow", "credit", "margin", "capital", "लोन", "कर्ज", "ऋण", "चाहिए"), QueryIntent.FINANCING_INQUIRY.value),
        (("scheme", "subsidy", "government", "pmfme", "योजना", "सब्सिडी"), QueryIntent.SCHEME_INQUIRY.value),
        (("feasibility", "viable", "profit", "market", "demand", "मुनाफा", "फायदा"), QueryIntent.FEASIBILITY_INQUIRY.value),
        (("business", "start", "open", "kholna", "shuru", "व्यापार", "दुकान", "शुरू"), QueryIntent.BUSINESS_INQUIRY.value),
        (("info", "guide", "manual", "general", "जानकारी"), QueryIntent.GENERAL_INFORMATION.value),
    ]
    for keywords, mapped_intent in intent_keywords:
        if any(w in lower for w in keywords):
            return mapped_intent
    return QueryIntent.UNKNOWN.value


def detect_missing_fields(
    business_category: str | None,
    geography: ParsedGeography | None,
    loan_amount: float | None,
    own_capital: float | None,
    purpose: str | None,
) -> list[str]:
    """Detect which required SAKSHAM advisory fields are missing."""
    checks = [
        ("business_category", business_category is None),
        ("geography", geography is None or geography.is_empty()),
        ("loan_amount", loan_amount is None),
        ("own_capital", own_capital is None),
        ("purpose", purpose is None),
    ]
    return [name for name, is_missing in checks if is_missing]


def parse_llm_response(raw_response: str | dict[str, Any], raw_query: str) -> ParsedQuery:
    """Validate and parse raw LLM output into a normalized ParsedQuery."""
    if not isinstance(raw_query, str) or not raw_query.strip():
        raise ValueError("query_text cannot be empty or whitespace only")

    if isinstance(raw_response, str):
        cleaned = raw_response.strip()
        if cleaned.startswith("```"):
            cleaned = re.sub(r"^```(?:json)?\s*", "", cleaned)
            cleaned = re.sub(r"\s*```$", "", cleaned)
        try:
            data = json.loads(cleaned)
        except Exception as err:
            raise ParserValidationError(f"Invalid JSON in LLM response: {err}") from err
    elif isinstance(raw_response, dict):
        data = raw_response
    else:
        raise ParserValidationError(f"Expected str or dict response, got {type(raw_response).__name__}")

    if not isinstance(data, dict):
        raise ParserValidationError(f"LLM response root must be a dict, got {type(data).__name__}")

    intent_raw = data.get("intent")
    if intent_raw is not None and not isinstance(intent_raw, str):
        raise ParserValidationError(f"intent must be a string or null, got {type(intent_raw).__name__}")

    is_amb_raw = data.get("is_ambiguous")
    if is_amb_raw is not None and not isinstance(is_amb_raw, bool):
        raise ParserValidationError(f"is_ambiguous must be a boolean, got {type(is_amb_raw).__name__}")

    geo_raw = data.get("geography")
    if geo_raw is not None and not isinstance(geo_raw, dict):
        raise ParserValidationError(f"geography must be a dict or null, got {type(geo_raw).__name__}")

    parsed_geo: ParsedGeography | None = None
    if isinstance(geo_raw, dict):
        parsed_geo = ParsedGeography(
            village=normalize_village(geo_raw.get("village")),
            block=normalize_block(geo_raw.get("block")),
            district=normalize_district(geo_raw.get("district")),
            state=normalize_state(geo_raw.get("state")),
        )
        if parsed_geo.is_empty():
            parsed_geo = None

    try:
        loan_amount = normalize_amount(data.get("loan_amount"))
    except (ValueError, TypeError) as err:
        raise ParserValidationError(f"Invalid loan_amount: {err}") from err

    try:
        own_capital = normalize_amount(data.get("own_capital"))
    except (ValueError, TypeError) as err:
        raise ParserValidationError(f"Invalid own_capital: {err}") from err

    business_cat = normalize_business_category(data.get("business_category"))
    purpose = normalize_text(data.get("purpose"))

    missing = detect_missing_fields(business_cat, parsed_geo, loan_amount, own_capital, purpose)
    return ParsedQuery(
        raw_query=raw_query.strip(),
        intent=normalize_intent(intent_raw),
        business_category=business_cat,
        geography=parsed_geo,
        loan_amount=loan_amount,
        own_capital=own_capital,
        purpose=purpose,
        scheme=normalize_scheme(data.get("scheme")),
        missing_fields=missing,
        is_ambiguous=bool(is_amb_raw) if is_amb_raw is not None else False,
    )


def _extract_geo_deterministic(text: str) -> ParsedGeography | None:
    """Extract location components deterministically from text."""
    v_m = re.search(r"(?i)\b([a-zA-Z\u0900-\u097F]+)\s*(?:village|gaon)\b|(?:village|gaon)\s+([a-zA-Z\u0900-\u097F]+)\b", text)
    village = normalize_village(v_m.group(1) or v_m.group(2)) if v_m else None

    b_m = re.search(r"(?i)\b([a-zA-Z\u0900-\u097F]+)\s*(?:block|tehsil)\b|(?:block|tehsil)\s+([a-zA-Z\u0900-\u097F]+)\b", text)
    block = normalize_block(b_m.group(1) or b_m.group(2)) if b_m else None

    d_m = re.search(r"(?i)\b([a-zA-Z\u0900-\u097F]+)\s*(?:district|dist\.?)\b|(?:district|dist\.?)\s+([a-zA-Z\u0900-\u097F]+)\b", text)
    district = normalize_district(d_m.group(1) or d_m.group(2)) if d_m else ("Mathura" if re.search(r"(?i)\bmathura\b|मथुरा", text) else None)

    s_m = re.search(r"(?i)\b(uttar pradesh|up|u\.p\.|उत्तर प्रदेश|madhya pradesh|mp|rajasthan)\b", text)
    state = normalize_state(s_m.group(1)) if s_m else None
    geo = ParsedGeography(village=village, block=block, district=district, state=state)
    return None if geo.is_empty() else geo


AMT_REGEX: str = r"(?:(?:₹|rs\.?|inr)\s*)?[0-9]+(?:\.[0-9]+)?(?:,[0-9]+)*(?:\s*(?:lakhs?|lacs?|crores?|cr|thousands?|k|लाख|करोड़|हज़ार|हजार))?"


def _extract_amounts_deterministic(text: str) -> tuple[float | None, float | None]:
    """Extract loan_amount and own_capital deterministically from text."""
    loan_amt: float | None = None
    capital_amt: float | None = None

    cap_m = re.search(r"(?i)(?:have|saving|savings|own money|own capital|mere paas|apna|margin)[^0-9₹]*(" + AMT_REGEX + r")", text)
    if cap_m:
        capital_amt = normalize_amount(cap_m.group(1))

    loan_m = re.search(r"(?i)(?:loan|borrow|chahiye|udhar|credit|need)[^0-9₹]*(" + AMT_REGEX + r")", text)
    if loan_m:
        loan_amt = normalize_amount(loan_m.group(1))

    if loan_amt is None and capital_amt is None:
        gen_m = re.search(AMT_REGEX, text)
        if gen_m and gen_m.group(0).strip():
            val = normalize_amount(gen_m.group(0))
            if re.search(r"(?i)\b(loan|chahiye|borrow)\b", text):
                loan_amt = val
            elif re.search(r"(?i)\b(have|mere paas|capital)\b", text):
                capital_amt = val
            else:
                loan_amt = val

    return loan_amt, capital_amt


def extract_deterministic(query_text: str) -> ParsedQuery:
    """Deterministic, zero-dependency extractor for test and fallback usage."""
    if not isinstance(query_text, str) or not query_text.strip():
        raise ValueError("query_text cannot be empty or whitespace only")

    text = query_text.strip()
    is_ambiguous = len(text) < 4 or bool(re.match(r"(?i)^(hello|hi|hey|help|need help|test)\b", text))
    geo = _extract_geo_deterministic(text)
    loan_amount, own_capital = _extract_amounts_deterministic(text)

    b_cat = normalize_business_category(text)
    kw = ("dairy", "doodh", "milk", "kirana", "dukaan", "retail", "textile", "kapda", "food", "khadya", "manufacturing", "service", "डेयरी", "दूध")
    if b_cat and not any(t in text.lower() for t in kw):
        b_cat = None

    intent = QueryIntent.UNKNOWN.value if is_ambiguous else normalize_intent(text)
    purpose = text if not is_ambiguous else None

    scheme = None
    for s_name in ("pmfme", "pm-fme", "pm fme", "micro finance", "microfinance", "term loan"):
        if s_name in text.lower():
            scheme = normalize_scheme(s_name)
            break

    missing = detect_missing_fields(b_cat, geo, loan_amount, own_capital, purpose)
    return ParsedQuery(
        raw_query=text,
        intent=intent,
        business_category=b_cat,
        geography=geo,
        loan_amount=loan_amount,
        own_capital=own_capital,
        purpose=purpose,
        scheme=scheme,
        missing_fields=missing,
        is_ambiguous=is_ambiguous,
    )


class QueryParser:
    """Parser for extracting structured intent and parameters from user queries."""

    def __init__(
        self,
        llm_callable: Callable[[str, str], str | dict[str, Any]] | None = None,
    ) -> None:
        self.llm_callable = llm_callable

    def parse(self, query_text: str) -> ParsedQuery:
        """Parse query using injected LLM callable, or deterministic fallback if none."""
        if not isinstance(query_text, str) or not query_text.strip():
            raise ValueError("query_text cannot be empty or whitespace only")

        if self.llm_callable is not None:
            from ai.prompts.parser_prompt import PARSER_SYSTEM_PROMPT, build_parser_prompt

            resp = self.llm_callable(PARSER_SYSTEM_PROMPT, build_parser_prompt(query_text))
            return parse_llm_response(resp, query_text)

        return extract_deterministic(query_text)


def parse_query(
    query_text: str,
    llm_callable: Callable[[str, str], str | dict[str, Any]] | None = None,
) -> ParsedQuery:
    """Convenience function to parse a user query."""
    return QueryParser(llm_callable=llm_callable).parse(query_text)
