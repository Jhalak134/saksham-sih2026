"""
retriever.py

Step 3 of the SAKSHAM AI/RAG pipeline: similarity search and contextual
metadata-aware retrieval from the Chroma vector database.

Architecture:
    query
      ↓
    embedding
      ↓
    vector similarity search
      ↓
    metadata filtering
      ↓
    ranked retrieval results
      ↓
    provenance-preserving evidence

Key Principles:
    - DATA PROVIDES EVIDENCE, DETERMINISTIC ENGINES CALCULATE, AI EXPLAINS.
    - The retriever returns source evidence for downstream reasoning.
    - It does NOT calculate financial eligibility, costs, or feasibility scores.
    - It does NOT invent facts or hallucinate missing data.
    - Preserves template flags (is_template_data=True for dairy yogurt report).
    - Preserves historical vintage (year=2011 for Mathura industrial profile).
    - Preserves scheme identity (scheme=PMFME).
    - Preserves source, page_start, and page_end provenance.
    - Explicit empty list for no matches (no hallucinated answers).
"""

from __future__ import annotations

from dataclasses import dataclass
from pathlib import Path
from typing import Any

from chromadb.api.models.Collection import Collection
from chromadb.api.types import Documents, EmbeddingFunction

from ai.ingestion.embed_and_store import (
    DEFAULT_COLLECTION_NAME,
    VECTOR_STORE_DIR,
    get_vector_store_client,
    query_vector_store,
)

DEFAULT_TOP_K: int = 5
MAX_TOP_K: int = 100


def _validate_query_text(text: Any) -> str:
    """Validate and normalize query text."""
    if not isinstance(text, str):
        raise TypeError(f"query_text must be a str, got {type(text).__name__}")
    stripped = text.strip()
    if not stripped:
        raise ValueError("query_text cannot be empty or whitespace only")
    return stripped


def _validate_top_k(top_k: Any) -> int:
    """Validate top_k parameter."""
    if type(top_k) is not int:
        raise TypeError(f"top_k must be an int, got {type(top_k).__name__}")
    if top_k <= 0:
        raise ValueError(f"top_k must be a positive integer, got {top_k}")
    if top_k > MAX_TOP_K:
        raise ValueError(f"top_k cannot exceed {MAX_TOP_K}, got {top_k}")
    return top_k


def _normalize_string_filter(field_name: str, val: Any) -> str | None:
    """Validate and canonicalize optional string filters."""
    if val is None:
        return None
    if not isinstance(val, str):
        raise TypeError(f"{field_name} must be a str or None, got {type(val).__name__}")
    s_val = val.strip()
    if not s_val:
        raise ValueError(f"{field_name} cannot be an empty string")

    if field_name == "scheme" and s_val.upper() == "PMFME":
        return "PMFME"
    if field_name == "business_category" and s_val.lower() == "dairy":
        return "dairy"
    if field_name == "geography_district" and s_val.lower() == "mathura":
        return "Mathura"
    if field_name == "geography_state" and s_val.lower() in ("uttar pradesh", "up"):
        return "Uttar Pradesh"
    return s_val


def _resolve_geography(
    geo: Any,
    district: str | None,
    state: str | None,
) -> tuple[str | None, str | None]:
    """Resolve district and state from geography parameter or direct fields."""
    resolved_district = district
    resolved_state = state

    if geo is not None:
        if isinstance(geo, str):
            g_str = geo.strip()
            if not g_str:
                raise ValueError("geography string cannot be empty")
            if resolved_district is None:
                resolved_district = g_str
        elif isinstance(geo, dict):
            if resolved_district is None and "district" in geo:
                d = geo["district"]
                if isinstance(d, str) and d.strip():
                    resolved_district = d.strip()
            if resolved_state is None and "state" in geo:
                s = geo["state"]
                if isinstance(s, str) and s.strip():
                    resolved_state = s.strip()
        else:
            raise TypeError(
                f"geography must be a str, dict, or None, got {type(geo).__name__}"
            )

    return (
        _normalize_string_filter("geography_district", resolved_district),
        _normalize_string_filter("geography_state", resolved_state),
    )


@dataclass
class RetrievalQuery:
    """Structured query object for vector store retrieval."""

    query_text: str
    business_category: str | None = None
    geography_district: str | None = None
    geography_state: str | None = None
    scheme: str | None = None
    document_type: str | None = None
    is_template_data: bool | None = None
    top_k: int = DEFAULT_TOP_K
    geography: str | dict[str, str] | None = None

    def __post_init__(self) -> None:
        self.query_text = _validate_query_text(self.query_text)
        self.top_k = _validate_top_k(self.top_k)

        if self.is_template_data is not None and type(self.is_template_data) is not bool:
            raise TypeError(
                f"is_template_data must be a bool or None, got {type(self.is_template_data).__name__}"
            )

        self.geography_district, self.geography_state = _resolve_geography(
            self.geography, self.geography_district, self.geography_state
        )
        self.business_category = _normalize_string_filter(
            "business_category", self.business_category
        )
        self.scheme = _normalize_string_filter("scheme", self.scheme)
        self.document_type = _normalize_string_filter(
            "document_type", self.document_type
        )

    def to_dict(self) -> dict[str, Any]:
        """Convert query parameters to a dictionary."""
        return {
            "query_text": self.query_text,
            "business_category": self.business_category,
            "geography_district": self.geography_district,
            "geography_state": self.geography_state,
            "scheme": self.scheme,
            "document_type": self.document_type,
            "is_template_data": self.is_template_data,
            "top_k": self.top_k,
        }

    @classmethod
    def from_dict(cls, data: dict[str, Any]) -> RetrievalQuery:
        """Create a RetrievalQuery from a dictionary."""
        if not isinstance(data, dict):
            raise TypeError(f"query data must be a dict, got {type(data).__name__}")
        return cls(
            query_text=data.get("query_text", ""),
            business_category=data.get("business_category"),
            geography_district=data.get("geography_district"),
            geography_state=data.get("geography_state"),
            scheme=data.get("scheme"),
            document_type=data.get("document_type"),
            is_template_data=data.get("is_template_data"),
            top_k=data.get("top_k", DEFAULT_TOP_K),
            geography=data.get("geography"),
        )


@dataclass(frozen=True)
class RetrievalResult:
    """Structured result containing retrieved chunk text, metadata, and provenance."""

    chunk_id: str
    document_id: str
    title: str
    text: str
    document_type: str
    source: str
    page_start: int
    page_end: int
    geography: dict[str, str] | None
    business_category: str | None
    scheme: str | None
    year: str | None
    is_template_data: bool
    distance: float
    similarity_score: float
    section_title: str | None = None
    chunk_index: int = 0
    page_number: int = 1

    @classmethod
    def from_hit(cls, hit: dict[str, Any]) -> RetrievalResult:
        """Construct a RetrievalResult from a deserialized vector store hit."""
        dist = float(hit.get("distance", 0.0))
        sim = max(0.0, min(1.0, 1.0 - dist))
        return cls(
            chunk_id=str(hit["chunk_id"]),
            document_id=str(hit["document_id"]),
            title=str(hit.get("title", "")),
            text=str(hit.get("text", "")),
            document_type=str(hit.get("document_type", "")),
            source=str(hit.get("source", "")),
            page_start=int(hit.get("page_start", 1)),
            page_end=int(hit.get("page_end", 1)),
            geography=hit.get("geography"),
            business_category=hit.get("business_category"),
            scheme=hit.get("scheme"),
            year=hit.get("year"),
            is_template_data=bool(hit.get("is_template_data", False)),
            distance=dist,
            similarity_score=round(sim, 4),
            section_title=hit.get("section_title"),
            chunk_index=int(hit.get("chunk_index", 0)),
            page_number=int(hit.get("page_number", 1)),
        )

    def to_dict(self) -> dict[str, Any]:
        """Serialize retrieval result to dictionary."""
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
            "section_title": self.section_title,
            "chunk_index": self.chunk_index,
            "page_number": self.page_number,
        }


def build_chroma_filter(query: RetrievalQuery) -> dict[str, Any] | None:
    """Build a Chroma-compatible where filter clause from structured query fields."""
    conditions: list[dict[str, Any]] = []

    if query.business_category is not None:
        conditions.append({"business_category": query.business_category})
    if query.geography_district is not None:
        conditions.append({"geography_district": query.geography_district})
    if query.geography_state is not None:
        conditions.append({"geography_state": query.geography_state})
    if query.scheme is not None:
        conditions.append({"scheme": query.scheme})
    if query.document_type is not None:
        conditions.append({"document_type": query.document_type})
    if query.is_template_data is not None:
        conditions.append({"is_template_data": query.is_template_data})

    if not conditions:
        return None
    if len(conditions) == 1:
        return conditions[0]
    return {"$and": conditions}


class KnowledgeRetriever:
    """Retriever for SAKSHAM knowledge-base vector store."""

    def __init__(
        self,
        collection: Collection | None = None,
        persist_directory: Path | str | None = None,
        collection_name: str = DEFAULT_COLLECTION_NAME,
        embedding_function: EmbeddingFunction[Documents] | None = None,
    ) -> None:
        if collection is not None:
            self._collection = collection
        else:
            p_dir = Path(persist_directory) if persist_directory else VECTOR_STORE_DIR
            client = get_vector_store_client(persist_directory=p_dir)
            self._collection = client.get_collection(
                name=collection_name,
                embedding_function=embedding_function,
            )

    @property
    def collection(self) -> Collection:
        """Return the underlying Chroma collection."""
        return self._collection

    def retrieve(
        self,
        query: RetrievalQuery | dict[str, Any] | str,
        **kwargs: Any,
    ) -> list[RetrievalResult]:
        """Retrieve matching knowledge base chunks based on query and filters."""
        structured_query = self._coerce_query(query, kwargs)
        where_filter = build_chroma_filter(structured_query)

        hits = query_vector_store(
            collection=self._collection,
            query_text=structured_query.query_text,
            n_results=structured_query.top_k,
            where=where_filter,
        )
        return [RetrievalResult.from_hit(h) for h in hits]

    @staticmethod
    def _coerce_query(
        query: RetrievalQuery | dict[str, Any] | str,
        kwargs: dict[str, Any],
    ) -> RetrievalQuery:
        """Coerce flexible query inputs (query object, dict, or string) into a validated RetrievalQuery."""
        if isinstance(query, str):
            merged = {"query_text": query, **kwargs}
            return RetrievalQuery.from_dict(merged)
        if isinstance(query, dict):
            merged = {**query, **kwargs}
            return RetrievalQuery.from_dict(merged)
        if isinstance(query, RetrievalQuery):
            if kwargs:
                d = query.to_dict()
                d.update(kwargs)
                return RetrievalQuery.from_dict(d)
            return query
        raise TypeError(
            f"Unsupported query type '{type(query).__name__}'. "
            "Expected RetrievalQuery, dict, or str."
        )


_DEFAULT_RETRIEVER: KnowledgeRetriever | None = None


def get_default_retriever() -> KnowledgeRetriever:
    """Return the cached default retriever instance, instantiating if needed."""
    global _DEFAULT_RETRIEVER
    if _DEFAULT_RETRIEVER is None:
        _DEFAULT_RETRIEVER = KnowledgeRetriever()
    return _DEFAULT_RETRIEVER


def reset_default_retriever() -> None:
    """Reset the cached default retriever instance."""
    global _DEFAULT_RETRIEVER
    _DEFAULT_RETRIEVER = None


def retrieve(
    query: RetrievalQuery | dict[str, Any] | str,
    retriever: KnowledgeRetriever | None = None,
    **kwargs: Any,
) -> list[RetrievalResult]:
    """Retrieve matching knowledge base chunks using active or default retriever."""
    active_retriever = retriever if retriever is not None else get_default_retriever()
    return active_retriever.retrieve(query, **kwargs)


def format_retrieval_summary(
    query: RetrievalQuery,
    results: list[RetrievalResult],
) -> str:
    """Format retrieval results for human inspection and CLI reporting."""
    lines = [
        f"Query: '{query.query_text}'",
        f"Top-k requested: {query.top_k} | Hits found: {len(results)}",
    ]
    filters = {k: v for k, v in query.to_dict().items() if k not in ("query_text", "top_k") and v is not None}
    if filters:
        lines.append(f"Applied filters: {filters}")

    for idx, r in enumerate(results, 1):
        lines.append(
            f"[{idx}] {r.chunk_id} (score={r.similarity_score:.4f}, dist={r.distance:.4f}) | "
            f"doc={r.document_id} | pages={r.page_start}-{r.page_end} | template={r.is_template_data}"
        )
    return "\n".join(lines)


def main() -> None:
    """Run sample retrieval demonstrations against the persistent vector store."""
    retriever = get_default_retriever()
    print("=" * 65)
    print("SAKSHAM KNOWLEDGE BASE RETRIEVER — VERIFICATION RUN")
    print("=" * 65)

    sample_queries = [
        RetrievalQuery(
            query_text="What financial support or subsidy is provided under PMFME?",
            scheme="PMFME",
            top_k=2,
        ),
        RetrievalQuery(
            query_text="Cost of plant and machinery for yogurt manufacturing unit",
            business_category="dairy",
            is_template_data=True,
            top_k=2,
        ),
        RetrievalQuery(
            query_text="Industrial profile and existing enterprises in district",
            geography_district="Mathura",
            top_k=2,
        ),
    ]

    for q in sample_queries:
        res = retriever.retrieve(q)
        print(format_retrieval_summary(q, res))
        print("-" * 65)


if __name__ == "__main__":
    main()
