"""
explanation_models.py

Domain models, citation schemas, and outcome contracts for the SAKSHAM
Grounded Explanation Layer (Task 6).

Architectural Rule:
    DATA PROVIDES EVIDENCE, DETERMINISTIC ENGINES CALCULATE, AI EXPLAINS.
    - Information explanation only; no financial calculations or recommendations.
    - Preserves exact source citations, warnings, limitations, and grounding status.
"""

from __future__ import annotations

from dataclasses import dataclass, field
from enum import Enum
from typing import Any


class GroundingStatus(str, Enum):
    """Grounding outcome classification for generated explanations."""

    GROUNDED = "grounded"
    INSUFFICIENT_EVIDENCE = "insufficient_evidence"
    UNGROUNDED_FLAGGED = "ungrounded_flagged"
    NO_MATCH = "no_match"


class ExplanationValidationError(ValueError):
    """Raised when an explanation request, response, or citation fails validation."""

    pass


EXPLANATION_JSON_SCHEMA: dict[str, Any] = {
    "type": "object",
    "required": [
        "answer",
        "key_points",
        "citations",
        "limitations",
        "warnings",
        "evidence_used",
        "grounding_status",
    ],
    "properties": {
        "answer": {"type": "string"},
        "key_points": {
            "type": "array",
            "items": {"type": "string"},
        },
        "citations": {
            "type": "array",
            "items": {
                "type": "object",
                "required": ["chunk_id", "document_id", "source"],
                "properties": {
                    "chunk_id": {"type": "string"},
                    "document_id": {"type": "string"},
                    "source": {"type": "string"},
                    "page_start": {"type": ["integer", "null"]},
                    "page_end": {"type": ["integer", "null"]},
                },
            },
        },
        "limitations": {
            "type": "array",
            "items": {"type": "string"},
        },
        "warnings": {
            "type": "array",
            "items": {"type": "string"},
        },
        "evidence_used": {
            "type": "array",
            "items": {"type": "string"},
        },
        "grounding_status": {
            "type": "string",
            "enum": [item.value for item in GroundingStatus],
        },
    },
}


@dataclass(frozen=True)
class ExplanationCitation:
    """Provenance citation tying an explanation claim to a specific evidence chunk."""

    chunk_id: str
    document_id: str
    source: str
    page_start: int | None = None
    page_end: int | None = None

    def to_dict(self) -> dict[str, Any]:
        """Serialize citation to dictionary."""
        return {
            "chunk_id": self.chunk_id,
            "document_id": self.document_id,
            "source": self.source,
            "page_start": self.page_start,
            "page_end": self.page_end,
        }

    @classmethod
    def from_dict(cls, data: dict[str, Any]) -> ExplanationCitation:
        """Construct ExplanationCitation from dictionary."""
        if not isinstance(data, dict):
            raise ExplanationValidationError(
                f"Expected dict for citation, got {type(data).__name__}"
            )
        cid = str(data.get("chunk_id", "")).strip()
        did = str(data.get("document_id", "")).strip()
        src = str(data.get("source", "")).strip()
        if not cid or not did:
            raise ExplanationValidationError("Citation missing chunk_id or document_id")
        return cls(
            chunk_id=cid,
            document_id=did,
            source=src,
            page_start=data.get("page_start"),
            page_end=data.get("page_end"),
        )


@dataclass
class ExplanationResult:
    """Structured explanation output grounded in EvidencePack provenance."""

    answer: str
    key_points: list[str] = field(default_factory=list)
    citations: list[ExplanationCitation] = field(default_factory=list)
    limitations: list[str] = field(default_factory=list)
    warnings: list[str] = field(default_factory=list)
    evidence_used: list[str] = field(default_factory=list)
    grounding_status: str = GroundingStatus.GROUNDED.value
    language: str = "en"

    def to_dict(self) -> dict[str, Any]:
        """Convert explanation result to serializable dictionary."""
        return {
            "answer": self.answer,
            "key_points": list(self.key_points),
            "citations": [c.to_dict() for c in self.citations],
            "limitations": list(self.limitations),
            "warnings": list(self.warnings),
            "evidence_used": list(self.evidence_used),
            "grounding_status": self.grounding_status,
            "language": self.language,
        }

    @classmethod
    def from_dict(cls, data: dict[str, Any]) -> ExplanationResult:
        """Construct ExplanationResult from serialized dictionary."""
        if not isinstance(data, dict):
            raise ExplanationValidationError(
                f"Expected dict for explanation result, got {type(data).__name__}"
            )
        raw_cits = data.get("citations", [])
        if not isinstance(raw_cits, list):
            raise ExplanationValidationError("citations must be a list")
        cits = [ExplanationCitation.from_dict(c) for c in raw_cits]
        return cls(
            answer=str(data.get("answer", "")),
            key_points=list(data.get("key_points", [])),
            citations=cits,
            limitations=list(data.get("limitations", [])),
            warnings=list(data.get("warnings", [])),
            evidence_used=list(data.get("evidence_used", [])),
            grounding_status=str(
                data.get("grounding_status", GroundingStatus.GROUNDED.value)
            ),
            language=str(data.get("language", "en")),
        )
