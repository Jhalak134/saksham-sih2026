"""
evidence_pack.py

Container, validation, limitations/warnings generation, and factory functions
for the SAKSHAM AI/RAG Grounding Layer (Task 5).

Architectural Rule:
    DATA PROVIDES EVIDENCE, DETERMINISTIC ENGINES CALCULATE, AI EXPLAINS.
    - Information packaging only; no financial calculations, eligibility decisions,
      or business recommendations.
    - Preserves exact source text and page boundaries.
    - Rejects malformed evidence or duplicate chunk IDs.
    - Deterministic warnings and limitations for downstream reasoning.
"""

from __future__ import annotations

from dataclasses import dataclass, field
from typing import Any, Sequence

from ai.grounding.evidence_models import (
    VALID_CLASSIFICATIONS,
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
from ai.prompts.query_parser import ParsedQuery
from ai.retrieval.retriever import RetrievalQuery, RetrievalResult

__all__ = [
    "EvidenceClassification",
    "VALID_CLASSIFICATIONS",
    "RetrievalStatus",
    "EvidenceItemValidationError",
    "EvidencePackValidationError",
    "EvidenceItem",
    "EvidencePack",
    "classify_evidence",
    "validate_non_empty_str",
    "validate_page_range",
    "validate_score",
    "validate_optional_str",
    "validate_optional_dict",
    "validate_doc_integrity",
    "validate_evidence_item",
    "validate_evidence_pack",
    "build_provenance_summary",
    "generate_warnings_and_limitations",
    "create_evidence_pack",
    "format_evidence_pack_summary",
]


def _collect_warnings(
    items: Sequence[EvidenceItem],
    structured_query: Any,
) -> list[str]:
    """Generate warnings regarding template and historical data."""
    warnings: list[str] = []
    has_template = any(
        it.is_template_data
        or it.classification == EvidenceClassification.TEMPLATE_REFERENCE.value
        for it in items
    )
    if has_template:
        warnings.append(
            "Evidence includes template/reference data (e.g. dairy yogurt project report). "
            "Financial and operational figures are illustrative examples and must NOT be treated "
            "as guaranteed costs, local market facts, or actual borrower outcomes."
        )

    has_historical = any(
        it.year == "2011"
        or it.classification == EvidenceClassification.HISTORICAL.value
        for it in items
    )
    if has_historical:
        warnings.append(
            "Evidence includes historical data with 2011 baseline vintage (e.g. Mathura district profile). "
            "Figures reflect historical census/MSME records and must NOT be treated as current 2026 data."
        )

    is_ambiguous = getattr(structured_query, "is_ambiguous", False)
    if is_ambiguous:
        warnings.append(
            "User query is brief or ambiguous; retrieved evidence may be general."
        )

    return warnings


def _collect_limitations(
    items: Sequence[EvidenceItem],
    structured_query: Any,
) -> list[str]:
    """Generate limitations regarding missing fields, no-matches, and scheme rules."""
    limitations: list[str] = []
    if not items:
        limitations.append(
            "No relevant knowledge-base evidence was retrieved for this query. "
            "The absence of retrieved evidence does not imply that the real-world business, "
            "scheme, or fact does not exist."
        )

    has_pmfme = any(it.scheme == "PMFME" for it in items)
    if has_pmfme:
        limitations.append(
            "Evidence contains PMFME scheme guidelines. Scheme rules and subsidy parameters do not "
            "determine individual borrower loan approval or eligibility under SAKSHAM micro-finance schemes."
        )

    missing = getattr(structured_query, "missing_fields", None)
    if isinstance(missing, list) and missing:
        limitations.append(
            f"Query is missing advisory parameters: {', '.join(sorted(missing))}. "
            "Unprovided parameters were not guessed or defaulted to zero."
        )

    return limitations


def generate_warnings_and_limitations(
    items: Sequence[EvidenceItem],
    structured_query: Any = None,
) -> tuple[list[str], list[str]]:
    """Generate deterministic warnings and limitations for downstream explanation."""
    warnings = _collect_warnings(items, structured_query)
    limitations = _collect_limitations(items, structured_query)
    return warnings, limitations


def validate_evidence_pack(pack: EvidencePack) -> None:
    """Validate structure, count consistency, and uniqueness of an EvidencePack."""
    if not isinstance(pack.query_text, str) or not pack.query_text.strip():
        raise EvidencePackValidationError(
            "query_text cannot be empty or whitespace only"
        )

    if pack.result_count != len(pack.evidence_items):
        raise EvidencePackValidationError(
            f"result_count ({pack.result_count}) does not match "
            f"number of evidence items ({len(pack.evidence_items)})"
        )

    if not pack.evidence_items:
        if pack.evidence_available:
            raise EvidencePackValidationError(
                "evidence_available must be False when evidence_items is empty"
            )
        if pack.retrieval_status != RetrievalStatus.NO_MATCH.value:
            raise EvidencePackValidationError(
                f"retrieval_status must be 'no_match' when evidence_items is empty, "
                f"got '{pack.retrieval_status}'"
            )
    else:
        if not pack.evidence_available:
            raise EvidencePackValidationError(
                "evidence_available must be True when evidence_items has items"
            )
        if pack.retrieval_status != RetrievalStatus.SUCCESS.value:
            raise EvidencePackValidationError(
                f"retrieval_status must be 'success' when evidence_items has items, "
                f"got '{pack.retrieval_status}'"
            )

    seen_chunks: set[str] = set()
    for item in pack.evidence_items:
        if not isinstance(item, EvidenceItem):
            raise EvidencePackValidationError(
                f"All evidence_items must be EvidenceItem instances, got {type(item).__name__}"
            )
        validate_evidence_item(item)
        if item.chunk_id in seen_chunks:
            raise EvidencePackValidationError(
                f"Duplicate chunk_id detected in evidence items: '{item.chunk_id}'"
            )
        seen_chunks.add(item.chunk_id)


@dataclass
class EvidencePack:
    """Structured evidence package passed from retrieval to explanation layer."""

    query_text: str
    structured_query: ParsedQuery | RetrievalQuery | dict[str, Any] | None = None
    retrieval_status: str = RetrievalStatus.NO_MATCH.value
    evidence_items: list[EvidenceItem] = field(default_factory=list)
    result_count: int = 0
    evidence_available: bool = False
    limitations: list[str] = field(default_factory=list)
    warnings: list[str] = field(default_factory=list)
    provenance_summary: dict[str, Any] = field(default_factory=dict)

    @property
    def has_template_data(self) -> bool:
        """Return True if any evidence item contains template/reference data."""
        return bool(self.provenance_summary.get("has_template_data", False))

    @property
    def has_historical_data(self) -> bool:
        """Return True if any evidence item contains historical data."""
        return bool(self.provenance_summary.get("has_historical_data", False))

    @property
    def document_ids(self) -> list[str]:
        """Return list of distinct document IDs present in this evidence pack."""
        return list(self.provenance_summary.get("documents", []))

    @property
    def chunk_ids(self) -> list[str]:
        """Return list of distinct chunk IDs present in this evidence pack."""
        return list(self.provenance_summary.get("chunks", []))

    def to_dict(self) -> dict[str, Any]:
        """Convert evidence pack to dictionary format."""
        sq_dict: dict[str, Any] | None = None
        if self.structured_query is not None:
            if hasattr(self.structured_query, "to_dict"):
                sq_dict = self.structured_query.to_dict()
            else:
                sq_dict = dict(self.structured_query)

        return {
            "query_text": self.query_text,
            "structured_query": sq_dict,
            "retrieval_status": self.retrieval_status,
            "result_count": self.result_count,
            "evidence_available": self.evidence_available,
            "evidence_items": [it.to_dict() for it in self.evidence_items],
            "limitations": list(self.limitations),
            "warnings": list(self.warnings),
            "provenance_summary": dict(self.provenance_summary),
        }

    @classmethod
    def from_dict(cls, data: dict[str, Any]) -> EvidencePack:
        """Construct and validate an EvidencePack from a dictionary."""
        if not isinstance(data, dict):
            raise EvidencePackValidationError(
                f"Expected dict, got {type(data).__name__}"
            )

        raw_items = data.get("evidence_items", [])
        if not isinstance(raw_items, list):
            raise EvidencePackValidationError(
                f"evidence_items must be a list, got {type(raw_items).__name__}"
            )

        items = [EvidenceItem.from_dict(it) for it in raw_items]
        sq_data = data.get("structured_query")
        struct_q: ParsedQuery | RetrievalQuery | dict[str, Any] | None = None
        if isinstance(sq_data, dict):
            if "intent" in sq_data and "raw_query" in sq_data:
                struct_q = ParsedQuery.from_dict(sq_data)
            elif "query_text" in sq_data:
                struct_q = RetrievalQuery.from_dict(sq_data)
            else:
                struct_q = sq_data

        pack = cls(
            query_text=str(data.get("query_text", "")),
            structured_query=struct_q,
            retrieval_status=str(
                data.get("retrieval_status", RetrievalStatus.NO_MATCH.value)
            ),
            evidence_items=items,
            result_count=int(data.get("result_count", len(items))),
            evidence_available=bool(data.get("evidence_available", len(items) > 0)),
            limitations=list(data.get("limitations", [])),
            warnings=list(data.get("warnings", [])),
            provenance_summary=dict(
                data.get("provenance_summary", build_provenance_summary(items))
            ),
        )
        validate_evidence_pack(pack)
        return pack


def _resolve_query_and_struct(
    query: str | ParsedQuery | RetrievalQuery | dict[str, Any],
    parsed_query: ParsedQuery | None,
    retrieval_query: RetrievalQuery | None,
) -> tuple[str, ParsedQuery | RetrievalQuery | dict[str, Any] | None]:
    """Resolve raw query string and structured query object from inputs."""
    if parsed_query is not None:
        return parsed_query.raw_query, parsed_query
    if retrieval_query is not None:
        return retrieval_query.query_text, retrieval_query
    if isinstance(query, ParsedQuery):
        return query.raw_query, query
    if isinstance(query, RetrievalQuery):
        return query.query_text, query
    if isinstance(query, dict):
        if "raw_query" in query:
            return str(query["raw_query"]), query
        if "query_text" in query:
            return str(query["query_text"]), query
        raise ValueError("query dict must contain 'raw_query' or 'query_text'")
    if isinstance(query, str):
        return query, None
    raise TypeError(f"Unsupported query type: {type(query).__name__}")


def create_evidence_pack(
    query: str | ParsedQuery | RetrievalQuery | dict[str, Any],
    retrieval_results: Sequence[RetrievalResult | EvidenceItem | dict[str, Any]]
    | None = None,
    parsed_query: ParsedQuery | None = None,
    retrieval_query: RetrievalQuery | None = None,
    limitations: Sequence[str] | None = None,
    warnings: Sequence[str] | None = None,
) -> EvidencePack:
    """Factory creating a validated, provenance-preserving EvidencePack."""
    q_text, struct_q = _resolve_query_and_struct(
        query, parsed_query, retrieval_query
    )

    items: list[EvidenceItem] = []
    if retrieval_results:
        for res in retrieval_results:
            if isinstance(res, EvidenceItem):
                items.append(res)
            elif isinstance(res, RetrievalResult):
                items.append(EvidenceItem.from_retrieval_result(res))
            elif isinstance(res, dict):
                items.append(EvidenceItem.from_dict(res))
            else:
                raise EvidenceItemValidationError(
                    f"Unsupported evidence result type: {type(res).__name__}"
                )

    auto_warns, auto_limits = generate_warnings_and_limitations(items, struct_q)
    all_warns = list(auto_warns)
    if warnings:
        for w in warnings:
            if w not in all_warns:
                all_warns.append(w)

    all_limits = list(auto_limits)
    if limitations:
        for limit in limitations:
            if limit not in all_limits:
                all_limits.append(limit)

    count = len(items)
    available = count > 0
    status = (
        RetrievalStatus.SUCCESS.value
        if available
        else RetrievalStatus.NO_MATCH.value
    )
    prov_summary = build_provenance_summary(items)

    pack = EvidencePack(
        query_text=validate_non_empty_str("query_text", q_text),
        structured_query=struct_q,
        retrieval_status=status,
        evidence_items=items,
        result_count=count,
        evidence_available=available,
        limitations=all_limits,
        warnings=all_warns,
        provenance_summary=prov_summary,
    )
    validate_evidence_pack(pack)
    return pack


def format_evidence_pack_summary(pack: EvidencePack) -> str:
    """Format evidence pack for human inspection and logging."""
    lines = [
        f"Query: '{pack.query_text}'",
        f"Status: {pack.retrieval_status} | Available: {pack.evidence_available} | Items: {pack.result_count}",
    ]
    if pack.provenance_summary.get("documents"):
        lines.append(f"Documents: {', '.join(pack.provenance_summary['documents'])}")
    if pack.provenance_summary.get("has_template_data"):
        lines.append("Flag: Contains Template Data")
    if pack.provenance_summary.get("has_historical_data"):
        lines.append("Flag: Contains Historical Data")
    if pack.warnings:
        lines.append(f"Warnings ({len(pack.warnings)}):")
        for w in pack.warnings:
            lines.append(f"  - {w}")
    if pack.limitations:
        lines.append(f"Limitations ({len(pack.limitations)}):")
        for limit in pack.limitations:
            lines.append(f"  - {limit}")
    for idx, it in enumerate(pack.evidence_items, 1):
        lines.append(
            f"[{idx}] {it.chunk_id} ({it.classification}) | doc={it.document_id} | "
            f"pages={it.page_start}-{it.page_end} | score={it.similarity_score:.4f}"
        )
    return "\n".join(lines)
