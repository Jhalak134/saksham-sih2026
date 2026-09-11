"""
evidence_models.py

Domain models, classification taxonomy, and validation logic for individual
evidence items in the SAKSHAM AI/RAG Grounding Layer (Task 5).

Architectural Rule:
    DATA PROVIDES EVIDENCE, DETERMINISTIC ENGINES CALCULATE, AI EXPLAINS.
    - Preserves provenance, exact source text, page ranges, and data honesty.
    - Separates template references and historical vintages from live local facts.
"""

from __future__ import annotations

from dataclasses import dataclass
from enum import Enum
from typing import Any, Sequence

from ai.retrieval.retriever import RetrievalResult


class EvidenceClassification(str, Enum):
    """Data honesty taxonomy distinguishing factual nature of evidence."""

    VERIFIED_OBSERVED = "verified_observed"
    HISTORICAL = "historical"
    TEMPLATE_REFERENCE = "template_reference"
    INCOMPLETE_MAPPED = "incomplete_mapped"
    UNAVAILABLE = "unavailable"


VALID_CLASSIFICATIONS: frozenset[str] = frozenset(
    item.value for item in EvidenceClassification
)


class RetrievalStatus(str, Enum):
    """Outcome status for evidence retrieval."""

    SUCCESS = "success"
    NO_MATCH = "no_match"


class EvidenceItemValidationError(ValueError):
    """Raised when an individual evidence item fails validation."""

    pass


class EvidencePackValidationError(ValueError):
    """Raised when an evidence pack fails integrity or validation checks."""

    pass


def classify_evidence(
    document_id: str,
    is_template_data: bool,
    year: str | None,
    document_type: str | None = None,
) -> str:
    """Classify evidence nature based on source provenance and metadata."""
    if is_template_data or document_type == "project_report_template":
        return EvidenceClassification.TEMPLATE_REFERENCE.value
    if year == "2011" or document_id == "mathura_district_industrial_profile":
        return EvidenceClassification.HISTORICAL.value
    return EvidenceClassification.VERIFIED_OBSERVED.value


def validate_non_empty_str(field_name: str, val: Any) -> str:
    """Validate that a field is a non-empty string."""
    if not isinstance(val, str):
        raise EvidenceItemValidationError(
            f"{field_name} must be a str, got {type(val).__name__}"
        )
    cleaned = val.strip()
    if not cleaned:
        raise EvidenceItemValidationError(
            f"{field_name} cannot be empty or whitespace only"
        )
    return cleaned


def validate_page_range(start: Any, end: Any) -> tuple[int, int]:
    """Validate page_start and page_end boundaries."""
    if type(start) is not int or start < 1:
        raise EvidenceItemValidationError(
            f"Invalid page_start: {start} (must be int >= 1)"
        )
    if type(end) is not int or end < start:
        raise EvidenceItemValidationError(
            f"Invalid page_end: {end} (must be int >= page_start {start})"
        )
    return start, end


def validate_score(
    val: Any, name: str, min_val: float, max_val: float | None = None
) -> float:
    """Validate float scores within allowed numerical bounds."""
    if type(val) is bool or not isinstance(val, (int, float)):
        raise EvidenceItemValidationError(
            f"{name} must be a float or int, got {type(val).__name__}"
        )
    f_val = float(val)
    if f_val < min_val:
        raise EvidenceItemValidationError(f"{name} must be >= {min_val}, got {f_val}")
    if max_val is not None and f_val > max_val:
        raise EvidenceItemValidationError(f"{name} must be <= {max_val}, got {f_val}")
    return f_val


def validate_optional_str(field_name: str, val: Any) -> str | None:
    """Validate optional string metadata without altering None."""
    if val is None:
        return None
    if not isinstance(val, str):
        raise EvidenceItemValidationError(
            f"{field_name} must be a str or None, got {type(val).__name__}"
        )
    return val


def validate_optional_dict(field_name: str, val: Any) -> dict[str, str] | None:
    """Validate optional dictionary metadata without altering None."""
    if val is None:
        return None
    if not isinstance(val, dict):
        raise EvidenceItemValidationError(
            f"{field_name} must be a dict or None, got {type(val).__name__}"
        )
    return val


def validate_doc_integrity(
    doc_id: str,
    is_template: bool,
    year: str | None,
    scheme: str | None,
    classification: str,
) -> None:
    """Enforce data honesty rules for known knowledge base documents."""
    if doc_id == "dairy_yogurt_plant_project_report":
        if not is_template:
            raise EvidenceItemValidationError(
                "dairy_yogurt_plant_project_report must have is_template_data=True"
            )
        if classification != EvidenceClassification.TEMPLATE_REFERENCE.value:
            raise EvidenceItemValidationError(
                "dairy_yogurt_plant_project_report must be classified as template_reference"
            )
    elif doc_id == "mathura_district_industrial_profile":
        if year == "2026":
            raise EvidenceItemValidationError(
                "mathura_district_industrial_profile cannot have year='2026'; vintage is historical (2011)"
            )
        if year != "2011":
            raise EvidenceItemValidationError(
                f"mathura_district_industrial_profile must have year='2011', got '{year}'"
            )
        if classification != EvidenceClassification.HISTORICAL.value:
            raise EvidenceItemValidationError(
                "mathura_district_industrial_profile must be classified as historical"
            )
    elif doc_id == "pmfme_scheme_guidelines":
        if scheme != "PMFME":
            raise EvidenceItemValidationError(
                f"pmfme_scheme_guidelines must have scheme='PMFME', got '{scheme}'"
            )


def validate_evidence_item(item: EvidenceItem) -> None:
    """Validate all required fields, provenance, and domain honesty on an EvidenceItem."""
    validate_non_empty_str("chunk_id", item.chunk_id)
    validate_non_empty_str("document_id", item.document_id)
    validate_non_empty_str("title", item.title)
    validate_non_empty_str("text", item.text)
    validate_non_empty_str("document_type", item.document_type)
    validate_non_empty_str("source", item.source)
    validate_page_range(item.page_start, item.page_end)

    if type(item.is_template_data) is not bool:
        raise EvidenceItemValidationError(
            f"is_template_data must be a bool, got {type(item.is_template_data).__name__}"
        )

    validate_score(item.distance, "distance", 0.0)
    validate_score(item.similarity_score, "similarity_score", 0.0, 1.0)

    if item.classification not in VALID_CLASSIFICATIONS:
        raise EvidenceItemValidationError(
            f"Invalid classification '{item.classification}'. Must be one of {sorted(VALID_CLASSIFICATIONS)}"
        )

    validate_optional_dict("geography", item.geography)
    validate_optional_str("business_category", item.business_category)
    validate_optional_str("scheme", item.scheme)
    validate_optional_str("year", item.year)
    validate_optional_str("section_title", item.section_title)

    if type(item.chunk_index) is not int or item.chunk_index < 0:
        raise EvidenceItemValidationError(f"Invalid chunk_index: {item.chunk_index}")
    if type(item.page_number) is not int or item.page_number < 1:
        raise EvidenceItemValidationError(f"Invalid page_number: {item.page_number}")

    validate_doc_integrity(
        item.document_id,
        item.is_template_data,
        item.year,
        item.scheme,
        item.classification,
    )


@dataclass(frozen=True)
class EvidenceItem:
    """Structured, validated chunk of evidence preserving provenance and data honesty."""

    chunk_id: str
    document_id: str
    title: str
    text: str
    document_type: str
    source: str
    page_start: int
    page_end: int
    geography: dict[str, str] | None = None
    business_category: str | None = None
    scheme: str | None = None
    year: str | None = None
    is_template_data: bool = False
    distance: float = 0.0
    similarity_score: float = 1.0
    classification: str = EvidenceClassification.VERIFIED_OBSERVED.value
    section_title: str | None = None
    chunk_index: int = 0
    page_number: int = 1

    def to_dict(self) -> dict[str, Any]:
        """Convert evidence item to dictionary."""
        return {
            "chunk_id": self.chunk_id,
            "document_id": self.document_id,
            "title": self.title,
            "text": self.text,
            "document_type": self.document_type,
            "source": self.source,
            "page_start": self.page_start,
            "page_end": self.page_end,
            "geography": self.geography,
            "business_category": self.business_category,
            "scheme": self.scheme,
            "year": self.year,
            "is_template_data": self.is_template_data,
            "distance": self.distance,
            "similarity_score": self.similarity_score,
            "classification": self.classification,
            "section_title": self.section_title,
            "chunk_index": self.chunk_index,
            "page_number": self.page_number,
        }

    @classmethod
    def from_retrieval_result(cls, result: RetrievalResult) -> EvidenceItem:
        """Construct a validated EvidenceItem directly from a RetrievalResult."""
        if not isinstance(result, RetrievalResult):
            raise EvidenceItemValidationError(
                f"Expected RetrievalResult, got {type(result).__name__}"
            )
        cls_type = classify_evidence(
            document_id=result.document_id,
            is_template_data=result.is_template_data,
            year=result.year,
            document_type=result.document_type,
        )
        item = cls(
            chunk_id=result.chunk_id,
            document_id=result.document_id,
            title=result.title,
            text=result.text,
            document_type=result.document_type,
            source=result.source,
            page_start=result.page_start,
            page_end=result.page_end,
            geography=result.geography,
            business_category=result.business_category,
            scheme=result.scheme,
            year=result.year,
            is_template_data=result.is_template_data,
            distance=result.distance,
            similarity_score=result.similarity_score,
            classification=cls_type,
            section_title=result.section_title,
            chunk_index=result.chunk_index,
            page_number=result.page_number,
        )
        validate_evidence_item(item)
        return item

    @classmethod
    def from_dict(cls, data: dict[str, Any]) -> EvidenceItem:
        """Construct and validate an EvidenceItem from a dictionary."""
        if not isinstance(data, dict):
            raise EvidenceItemValidationError(
                f"Expected dict, got {type(data).__name__}"
            )

        doc_id = str(data.get("document_id", ""))
        is_temp = data.get("is_template_data")
        if type(is_temp) is not bool:
            raise EvidenceItemValidationError(
                f"is_template_data must be a bool, got {type(is_temp).__name__}"
            )

        year_val = data.get("year")
        doc_type = data.get("document_type")
        cls_val = data.get("classification")
        if not cls_val:
            cls_val = classify_evidence(doc_id, is_temp, year_val, doc_type)

        item = cls(
            chunk_id=str(data.get("chunk_id", "")),
            document_id=doc_id,
            title=str(data.get("title", "")),
            text=str(data.get("text", "")),
            document_type=str(data.get("document_type", "")),
            source=str(data.get("source", "")),
            page_start=int(data.get("page_start", 1)),
            page_end=int(data.get("page_end", 1)),
            geography=data.get("geography"),
            business_category=data.get("business_category"),
            scheme=data.get("scheme"),
            year=year_val,
            is_template_data=is_temp,
            distance=float(data.get("distance", 0.0)),
            similarity_score=float(data.get("similarity_score", 1.0)),
            classification=str(cls_val),
            section_title=data.get("section_title"),
            chunk_index=int(data.get("chunk_index", 0)),
            page_number=int(data.get("page_number", 1)),
        )
        validate_evidence_item(item)
        return item

    def get_provenance(self) -> dict[str, Any]:
        """Extract traceability metadata for citations and grounding."""
        return {
            "document_id": self.document_id,
            "chunk_id": self.chunk_id,
            "source": self.source,
            "page_start": self.page_start,
            "page_end": self.page_end,
            "title": self.title,
            "year": self.year,
            "geography": self.geography,
            "business_category": self.business_category,
            "scheme": self.scheme,
            "is_template_data": self.is_template_data,
            "classification": self.classification,
        }


def build_provenance_summary(items: Sequence[EvidenceItem]) -> dict[str, Any]:
    """Aggregate provenance information across all retrieved evidence items."""
    docs: list[str] = []
    chunks: list[str] = []
    sources: list[str] = []
    schemes: list[str] = []
    vintages: list[str] = []
    has_template = False
    has_historical = False

    for it in items:
        if it.document_id not in docs:
            docs.append(it.document_id)
        if it.chunk_id not in chunks:
            chunks.append(it.chunk_id)
        if it.source not in sources:
            sources.append(it.source)
        if it.scheme and it.scheme not in schemes:
            schemes.append(it.scheme)
        if it.year and it.year not in vintages:
            vintages.append(it.year)
        if it.is_template_data:
            has_template = True
        if (
            it.classification == EvidenceClassification.HISTORICAL.value
            or it.year == "2011"
        ):
            has_historical = True

    return {
        "documents": docs,
        "chunks": chunks,
        "sources": sources,
        "schemes": schemes,
        "vintages": vintages,
        "has_template_data": has_template,
        "has_historical_data": has_historical,
    }
