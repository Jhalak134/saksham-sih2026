"""Request and response models for the SAKSHAM AI Service.

Defines strict Pydantic schemas for the FastAPI layer, ensuring type safety,
bounded inputs, clean error reporting, and provenance preservation.
"""

from typing import Any
from pydantic import BaseModel, ConfigDict, Field, field_validator

from ai.grounding.evidence_pack import EvidencePack
from ai.prompts.explanation_models import ExplanationCitation, ExplanationResult
from ai.prompts.query_parser import ParsedQuery


class QueryRequest(BaseModel):
    """Input payload for the AI query / explanation endpoint."""

    model_config = ConfigDict(extra="forbid")

    query: str = Field(
        ...,
        min_length=1,
        max_length=2000,
        description="Natural language query from borrower in English, Hindi, or Hinglish.",
    )
    language: str = Field(
        default="en",
        description="Preferred response language: 'en', 'hi', or 'hinglish'.",
    )
    top_k: int = Field(
        default=5,
        ge=1,
        le=20,
        description="Maximum number of evidence chunks to retrieve (1-20).",
    )
    calculations: dict[str, Any] | None = Field(
        default=None,
        description="Optional pre-computed deterministic figures (e.g. EMI, project cost).",
    )

    @field_validator("query")
    @classmethod
    def validate_query_not_whitespace(cls, v: str) -> str:
        """Ensure query is not only whitespace."""
        trimmed = v.strip()
        if not trimmed:
            raise ValueError("query cannot be empty or whitespace only")
        return trimmed

    @field_validator("language")
    @classmethod
    def normalize_language(cls, v: str) -> str:
        """Normalize language to supported options."""
        clean = v.strip().lower()
        if clean in ("english", "en"):
            return "en"
        if clean in ("hindi", "hi"):
            return "hi"
        if clean in ("hinglish",):
            return "hinglish"
        raise ValueError(
            f"Unsupported language '{v}'. Supported: 'en', 'hi', 'hinglish'."
        )


class CitationResponse(BaseModel):
    """Citation metadata identifying source provenance of retrieved evidence."""

    chunk_id: str
    document_id: str
    source: str
    page_start: int
    page_end: int

    @classmethod
    def from_citation(cls, cit: ExplanationCitation) -> "CitationResponse":
        """Build response model from ExplanationCitation."""
        return cls(
            chunk_id=cit.chunk_id,
            document_id=cit.document_id,
            source=cit.source,
            page_start=cit.page_start,
            page_end=cit.page_end,
        )


class ParsedGeographyResponse(BaseModel):
    """Parsed geographic details preserving missing fields as None."""

    district: str | None = None
    state: str | None = None
    village: str | None = None
    block: str | None = None


class ParsedQueryResponse(BaseModel):
    """Structured representation of borrower intent and parameters."""

    raw_query: str
    intent: str
    business_category: str | None = None
    geography: ParsedGeographyResponse | None = None
    loan_amount: float | None = None
    own_capital: float | None = None
    purpose: str | None = None
    scheme: str | None = None
    missing_fields: list[str] = Field(default_factory=list)
    is_ambiguous: bool = False

    @classmethod
    def from_parsed_query(cls, pq: ParsedQuery) -> "ParsedQueryResponse":
        """Convert domain ParsedQuery to API response model."""
        geo = None
        if pq.geography is not None:
            geo = ParsedGeographyResponse(
                district=pq.geography.district,
                state=pq.geography.state,
                village=pq.geography.village,
                block=pq.geography.block,
            )
        return cls(
            raw_query=pq.raw_query,
            intent=pq.intent,
            business_category=pq.business_category,
            geography=geo,
            loan_amount=pq.loan_amount,
            own_capital=pq.own_capital,
            purpose=pq.purpose,
            scheme=pq.scheme,
            missing_fields=list(pq.missing_fields),
            is_ambiguous=pq.is_ambiguous,
        )


class ExplanationDetailResponse(BaseModel):
    """Detailed explanatory outputs and grounding telemetry."""

    answer: str
    key_points: list[str] = Field(default_factory=list)
    citations: list[CitationResponse] = Field(default_factory=list)
    limitations: list[str] = Field(default_factory=list)
    warnings: list[str] = Field(default_factory=list)
    evidence_used: list[str] = Field(default_factory=list)
    grounding_status: str
    language: str


class QueryResponse(BaseModel):
    """Top-level structured response from the AI/RAG service."""

    query: str
    parsed_query: ParsedQueryResponse
    retrieval_status: str
    evidence_available: bool
    result_count: int
    explanation: str
    explanation_detail: ExplanationDetailResponse
    citations: list[CitationResponse] = Field(default_factory=list)
    limitations: list[str] = Field(default_factory=list)
    warnings: list[str] = Field(default_factory=list)
    grounding_status: str
    language: str

    @classmethod
    def from_pipeline(
        cls,
        query: str,
        parsed_query: ParsedQuery,
        evidence_pack: EvidencePack,
        explanation: ExplanationResult,
    ) -> "QueryResponse":
        """Assemble structured response from pipeline outputs."""
        citations = [CitationResponse.from_citation(c) for c in explanation.citations]
        detail = ExplanationDetailResponse(
            answer=explanation.answer,
            key_points=list(explanation.key_points),
            citations=citations,
            limitations=list(explanation.limitations),
            warnings=list(explanation.warnings),
            evidence_used=list(explanation.evidence_used),
            grounding_status=explanation.grounding_status,
            language=explanation.language,
        )
        return cls(
            query=query,
            parsed_query=ParsedQueryResponse.from_parsed_query(parsed_query),
            retrieval_status=evidence_pack.retrieval_status,
            evidence_available=evidence_pack.evidence_available,
            result_count=evidence_pack.result_count,
            explanation=explanation.answer,
            explanation_detail=detail,
            citations=citations,
            limitations=list(explanation.limitations),
            warnings=list(explanation.warnings),
            grounding_status=explanation.grounding_status,
            language=explanation.language,
        )


class HealthResponse(BaseModel):
    """Health and readiness status of the AI service and vector store."""

    status: str
    vector_store: str
    chunk_count: int | None = None
    version: str = "1.0.0"


class ErrorResponse(BaseModel):
    """Standardized error response preventing trace and path leakage."""

    error: str
    detail: str
    error_type: str
