"""claim_verifier.py

Deterministic quantitative claim extraction and verification for SAKSHAM Grounding (Task 11).

Architectural Rule:
    DATA PROVIDES EVIDENCE, DETERMINISTIC ENGINES CALCULATE, AI EXPLAINS.
    - Extracts objective quantitative claims (percentages, currency, tenure, quantities).
    - Compares claims against cited evidence chunks and pre-computed calculations.
    - Context-aware: rejects false positives where numbers match but concepts conflict
      (e.g. subsidy vs margin).
    - Conservative: flags or rejects unsupported claims rather than falsely certifying grounding.
"""

from __future__ import annotations

from dataclasses import dataclass
import re
from typing import Any, Sequence

from ai.grounding.evidence_models import EvidenceItem
from ai.prompts.explanation_models import GroundingStatus


@dataclass(frozen=True)
class QuantitativeClaim:
    """Structured representation of an extracted quantitative claim."""

    raw_text: str
    claim_type: str  # "percentage", "currency", "tenure", "quantity"
    normalized_value: float
    unit: str  # "%", "inr", "months", "units"
    concept: str | None  # e.g. "subsidy", "margin", "interest_rate", "loan_amount", "emi", "tenure"
    context_snippet: str


@dataclass(frozen=True)
class GroundingVerificationResult:
    """Outcome of content-level quantitative claim verification."""

    is_grounded: bool
    supported_claims: list[QuantitativeClaim]
    unsupported_claims: list[QuantitativeClaim]
    warning_message: str | None = None
    downgraded_status: str = GroundingStatus.GROUNDED.value


# Context keyword dictionaries for concept detection
_CONCEPT_KEYWORDS: dict[str, tuple[str, ...]] = {
    "subsidy": ("subsidy", "subsidies", "grant", "grants", "financial assistance", "concession", "credit-linked grant"),
    "margin": ("margin", "promoter contribution", "promoter's contribution", "own contribution", "borrower contribution", "equity"),
    "interest_rate": ("interest rate", "interest", "rate of interest", "roi", "per annum", "p.a.", "apr"),
    "loan_amount": ("loan", "borrowing", "credit limit", "loan limit", "bank finance", "debt", "ceiling"),
    "project_cost": ("project cost", "setup cost", "cost", "capex", "capital expenditure", "outlay", "working capital", "investment"),
    "emi": ("emi", "installment", "monthly installment", "monthly payment", "repayment installment"),
    "tenure": ("tenure", "repayment period", "moratorium", "loan term", "duration"),
    "profit": ("profit", "surplus", "net income", "earnings"),
    "revenue": ("revenue", "turnover", "sales", "gross receipts"),
    "units": ("units", "enterprises", "msmes", "plants", "establishments", "micro units"),
}

# Conflict matrix: concepts that must NOT be confused even if numbers match
_MUTUALLY_EXCLUSIVE_CONCEPTS: frozenset[frozenset[str]] = frozenset([
    frozenset({"subsidy", "margin"}),
    frozenset({"subsidy", "interest_rate"}),
    frozenset({"margin", "interest_rate"}),
    frozenset({"interest_rate", "tenure"}),
    frozenset({"profit", "project_cost"}),
    frozenset({"revenue", "emi"}),
    frozenset({"loan_amount", "emi"}),
])


def _edge_distance(token_start: int, token_end: int, kw_start: int, kw_end: int) -> float:
    """Calculate character separation distance between token and keyword span."""
    if kw_end <= token_start:
        return float(token_start - kw_end)
    if kw_start >= token_end:
        return float(kw_start - token_end)
    return 0.0


def detect_concept(text: str, start: int = 0, end: int = 0) -> str | None:
    """Identify the semantic financial or business concept closest to the token in text."""
    lowered = text.lower()
    t_start = start if end > start else 0
    t_end = end if end > start else len(text)

    closest_concept: str | None = None
    min_dist: float = float("inf")

    for concept, keywords in _CONCEPT_KEYWORDS.items():
        for kw in keywords:
            pos = 0
            while True:
                idx = lowered.find(kw, pos)
                if idx == -1:
                    break
                dist = _edge_distance(t_start, t_end, idx, idx + len(kw))
                if dist < min_dist:
                    min_dist = dist
                    closest_concept = concept
                pos = idx + 1

    if min_dist <= 60.0:
        return closest_concept
    return None


def are_concepts_compatible(concept_a: str | None, concept_b: str | None) -> bool:
    """Check whether two concepts can refer to the same factual claim."""
    if concept_a is None or concept_b is None:
        return True
    if concept_a == concept_b:
        return True
    pair = frozenset({concept_a, concept_b})
    if pair in _MUTUALLY_EXCLUSIVE_CONCEPTS:
        return False
    return True


def normalize_currency_amount(amount_str: str, multiplier_str: str | None = None) -> float | None:
    """Normalize raw currency text into standard INR float value."""
    clean = amount_str.replace(",", "").strip()
    try:
        val = float(clean)
    except ValueError:
        return None

    if multiplier_str:
        m_lower = multiplier_str.lower().strip()
        if m_lower.startswith("lakh"):
            return val * 100_000.0
        if m_lower.startswith("crore"):
            return val * 10_000_000.0
        if m_lower in ("k", "thousand"):
            return val * 1_000.0

    return val


def _extract_context_window(text: str, start: int, end: int, window: int = 50) -> str:
    """Extract character slice surrounding an identified token."""
    w_start = max(0, start - window)
    w_end = min(len(text), end + window)
    return text[w_start:w_end]


def extract_claims_from_text(text: str) -> list[QuantitativeClaim]:
    """Extract quantitative claims (percentages, currency, tenure, quantities) from text."""
    claims: list[QuantitativeClaim] = []
    if not text or not text.strip():
        return claims

    # 1. Percentages: e.g. "35%", "8.5 percent", "35.0%"
    pct_pattern = re.compile(r"(?i)\b(\d+(?:\.\d+)?)\s*(%|percent(?:age)?\b)")
    for m in pct_pattern.finditer(text):
        raw = m.group(0)
        try:
            val = float(m.group(1))
        except ValueError:
            continue
        ctx = _extract_context_window(text, m.start(), m.end())
        claims.append(
            QuantitativeClaim(
                raw_text=raw,
                claim_type="percentage",
                normalized_value=val,
                unit="%",
                concept=detect_concept(text, m.start(), m.end()),
                context_snippet=ctx,
            )
        )

    # 2. Currency: with symbol prefix (e.g. "₹10,00,000", "Rs 15.5 lakh", "Rs. 10 lakh")
    # or multiplier postfix (e.g. "10 lakh", "1.5 lakh")
    curr_pattern = re.compile(
        r"(?i)(?:₹|Rs\.?|INR)\s*(\d+(?:,\d+)*(?:\.\d+)?)\s*(lakhs?|crores?|k)?\b|"
        r"\b(\d+(?:,\d+)*(?:\.\d+)?)\s*(lakhs?|crores?)\b"
    )
    for m in curr_pattern.finditer(text):
        raw = m.group(0).strip()
        num_str = m.group(1) or m.group(3)
        mult_str = m.group(2) or m.group(4)
        val = normalize_currency_amount(num_str, mult_str)
        if val is None:
            continue
        ctx = _extract_context_window(text, m.start(), m.end())
        claims.append(
            QuantitativeClaim(
                raw_text=raw,
                claim_type="currency",
                normalized_value=val,
                unit="inr",
                concept=detect_concept(text, m.start(), m.end()),
                context_snippet=ctx,
            )
        )

    # 3. Tenure: e.g. "36 months", "5 years", "84 months"
    tenure_pattern = re.compile(r"(?i)\b(\d+)\s*(months?|years?)\b")
    for m in tenure_pattern.finditer(text):
        raw = m.group(0).strip()
        try:
            num = int(m.group(1))
        except ValueError:
            continue
        unit_str = m.group(2).lower()
        months_val = float(num * 12 if unit_str.startswith("year") else num)
        ctx = _extract_context_window(text, m.start(), m.end())
        concept = detect_concept(text, m.start(), m.end()) or "tenure"
        claims.append(
            QuantitativeClaim(
                raw_text=raw,
                claim_type="tenure",
                normalized_value=months_val,
                unit="months",
                concept=concept,
                context_snippet=ctx,
            )
        )

    # 4. Domain Quantities: e.g. "350 units", "350 micro units"
    qty_pattern = re.compile(r"(?i)\b(\d+(?:,\d+)*)\s*(units?|enterprises?)\b")
    for m in qty_pattern.finditer(text):
        raw = m.group(0).strip()
        val_str = m.group(1).replace(",", "")
        try:
            val = float(val_str)
        except ValueError:
            continue
        ctx = _extract_context_window(text, m.start(), m.end())
        claims.append(
            QuantitativeClaim(
                raw_text=raw,
                claim_type="quantity",
                normalized_value=val,
                unit="units",
                concept="units",
                context_snippet=ctx,
            )
        )

    return claims


def extract_claims_from_calculations(calculations: dict[str, Any] | None) -> list[QuantitativeClaim]:
    """Extract authoritative quantitative claims from pre-computed financial calculations."""
    if not calculations:
        return []

    claims: list[QuantitativeClaim] = []
    # Map calculation fields to their domain concepts and units
    calc_field_specs: dict[str, tuple[str, str, str]] = {
        "interest_rate": ("percentage", "%", "interest_rate"),
        "subsidy_percentage": ("percentage", "%", "subsidy"),
        "margin_percentage": ("percentage", "%", "margin"),
        "project_cost": ("currency", "inr", "project_cost"),
        "loan_amount": ("currency", "inr", "loan_amount"),
        "monthly_emi": ("currency", "inr", "emi"),
        "own_capital": ("currency", "inr", "margin"),
        "subsidy_amount": ("currency", "inr", "subsidy"),
        "tenure_months": ("tenure", "months", "tenure"),
        "moratorium_months": ("tenure", "months", "tenure"),
    }

    for key, (ctype, unit, concept) in calc_field_specs.items():
        if key in calculations and calculations[key] is not None:
            try:
                val = float(calculations[key])
                claims.append(
                    QuantitativeClaim(
                        raw_text=f"{key}={val}",
                        claim_type=ctype,
                        normalized_value=val,
                        unit=unit,
                        concept=concept,
                        context_snippet=f"calculation:{key}",
                    )
                )
            except (ValueError, TypeError):
                continue

    return claims


def claims_match(claim_a: QuantitativeClaim, claim_b: QuantitativeClaim) -> bool:
    """Evaluate whether an answer claim matches an evidence or calculation claim."""
    if claim_a.claim_type != claim_b.claim_type:
        return False
    if claim_a.unit != claim_b.unit:
        return False

    # Check numeric tolerance (0.01% or absolute 1e-2)
    diff = abs(claim_a.normalized_value - claim_b.normalized_value)
    if diff > 1e-2 and (diff / max(1.0, abs(claim_b.normalized_value))) > 1e-4:
        return False

    # Check concept compatibility
    if not are_concepts_compatible(claim_a.concept, claim_b.concept):
        return False

    return True


def verify_quantitative_grounding(
    answer: str,
    evidence_items: Sequence[EvidenceItem],
    calculations: dict[str, Any] | None = None,
) -> GroundingVerificationResult:
    """Verify that all quantitative claims in answer are entailed by evidence or calculations."""
    answer_claims = extract_claims_from_text(answer)
    if not answer_claims:
        # No quantitative claims to verify; passes structural validation
        return GroundingVerificationResult(
            is_grounded=True,
            supported_claims=[],
            unsupported_claims=[],
            downgraded_status=GroundingStatus.GROUNDED.value,
        )

    # Gather claims from evidence items
    evidence_claims: list[QuantitativeClaim] = []
    for item in evidence_items:
        evidence_claims.extend(extract_claims_from_text(item.text))

    # Gather claims from pre-computed calculations
    calc_claims = extract_claims_from_calculations(calculations)
    all_reference_claims = evidence_claims + calc_claims

    supported: list[QuantitativeClaim] = []
    unsupported: list[QuantitativeClaim] = []

    for ac in answer_claims:
        matched = False
        for ref in all_reference_claims:
            if claims_match(ac, ref):
                matched = True
                break
        if matched:
            supported.append(ac)
        else:
            unsupported.append(ac)

    if not unsupported:
        return GroundingVerificationResult(
            is_grounded=True,
            supported_claims=supported,
            unsupported_claims=[],
            downgraded_status=GroundingStatus.GROUNDED.value,
        )

    first_unsupported = unsupported[0]
    warning_msg = (
        f"Answer contains ungrounded quantitative claim '{first_unsupported.raw_text}' "
        f"not supported by cited evidence or pre-computed calculations."
    )
    return GroundingVerificationResult(
        is_grounded=False,
        supported_claims=supported,
        unsupported_claims=unsupported,
        warning_message=warning_msg,
        downgraded_status=GroundingStatus.UNGROUNDED_FLAGGED.value,
    )
