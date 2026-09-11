"""
embed_and_store.py

Step 2 of the SAKSHAM AI/RAG pipeline: generate embeddings and persist
document chunks into the Chroma vector database.

Architecture:
    chunks (Task 1 output)
       ↓
    embeddings (all-MiniLM-L6-v2 ONNX or deterministic hash)
       ↓
    persistent vector store (ChromaDB at ai/vector_store/chroma)

Key Principles:
    - DATA PROVIDES EVIDENCE, DETERMINISTIC ENGINES CALCULATE, AI EXPLAINS.
    - Vector store is purely an evidence retrieval layer (no financial calculations).
    - Preserves all chunk metadata: document_id, chunk_id, page_start, page_end,
      geography, business_category, scheme, year, is_template_data, source.
    - Preserves template flags (is_template_data=True for dairy yogurt report).
    - Preserves historical vintage (year=2011, Mathura district profile).
    - Preserves scheme identity (scheme=PMFME).
    - Deterministic and reproducible: stable IDs, idempotent upserts, rebuild support.
"""

from __future__ import annotations

import hashlib
import json
import os
from pathlib import Path
from typing import Any

import chromadb
from chromadb.api import ClientAPI
from chromadb.api.models.Collection import Collection
from chromadb.api.types import Documents, EmbeddingFunction, Embeddings
from chromadb.utils.embedding_functions import DefaultEmbeddingFunction

from ai.knowledge_base.document_metadata import DOCUMENT_METADATA

AI_DIR = Path(__file__).resolve().parents[1]
CHUNKS_DIR = AI_DIR / "knowledge_base" / "chunks"
DEFAULT_VECTOR_STORE_DIR = AI_DIR / "vector_store" / "chroma"
VECTOR_STORE_DIR = Path(
    os.getenv("SAKSHAM_VECTOR_STORE_DIR", str(DEFAULT_VECTOR_STORE_DIR))
)

DEFAULT_COLLECTION_NAME: str = "saksham_knowledge_base"
DEFAULT_BATCH_SIZE: int = 64
EMBEDDING_DIMENSION: int = 384

REQUIRED_CHUNK_FIELDS: frozenset[str] = frozenset(
    {
        "chunk_id",
        "document_id",
        "title",
        "document_type",
        "source",
        "page_start",
        "page_end",
        "geography",
        "business_category",
        "scheme",
        "year",
        "is_template_data",
        "text",
    }
)


class DeterministicHashEmbeddingFunction(EmbeddingFunction[Documents]):
    """Deterministic hash-based embedding function for testing and reproducibility."""

    def __init__(self, dimension: int = EMBEDDING_DIMENSION) -> None:
        self.dimension = dimension

    @classmethod
    def name(cls) -> str:
        return "deterministic_hash"

    def get_config(self) -> dict[str, Any]:
        return {"dimension": self.dimension}

    @classmethod
    def build_from_config(cls, config: dict[str, Any]) -> DeterministicHashEmbeddingFunction:
        dim = int(config.get("dimension", EMBEDDING_DIMENSION))
        return cls(dimension=dim)

    def __call__(self, input: Documents) -> Embeddings:

        embeddings: Embeddings = []
        for text in input:
            digest = hashlib.sha256(text.encode("utf-8")).digest()
            raw_floats = [float((b / 255.0) * 2.0 - 1.0) for b in digest]
            tiled = (raw_floats * (self.dimension // len(raw_floats) + 1))[: self.dimension]
            norm = sum(x * x for x in tiled) ** 0.5 or 1.0
            embeddings.append([x / norm for x in tiled])
        return embeddings


def get_embedding_function(
    embedding_type: str = "default",
) -> EmbeddingFunction[Documents]:
    """Return an embedding function instance based on the requested type."""
    if embedding_type in ("default", "onnx"):
        return DefaultEmbeddingFunction()
    if embedding_type in ("deterministic_hash", "test"):
        return DeterministicHashEmbeddingFunction()
    raise ValueError(
        f"Unknown embedding_type '{embedding_type}'. "
        "Expected 'default', 'onnx', 'deterministic_hash', or 'test'."
    )


def validate_chunk_for_indexing(
    chunk: dict[str, Any],
    known_document_ids: set[str] | None = None,
) -> None:
    """Validate that a chunk has all required fields and valid types for indexing."""
    missing = sorted(REQUIRED_CHUNK_FIELDS - chunk.keys())
    if missing:
        cid = chunk.get("chunk_id", "<missing_id>")
        raise ValueError(f"Chunk '{cid}' missing required fields: {missing}")

    chunk_id = str(chunk["chunk_id"]).strip()
    if not chunk_id:
        raise ValueError("Chunk has empty chunk_id")

    text = str(chunk["text"]).strip()
    if not text:
        raise ValueError(f"Chunk '{chunk_id}' has empty text")

    page_start = chunk.get("page_start")
    page_end = chunk.get("page_end")
    if not isinstance(page_start, int) or page_start < 1:
        raise ValueError(f"Chunk '{chunk_id}' has invalid page_start: {page_start}")
    if not isinstance(page_end, int) or page_end < page_start:
        raise ValueError(f"Chunk '{chunk_id}' has invalid page_end: {page_end}")

    if not isinstance(chunk.get("is_template_data"), bool):
        raise ValueError(f"Chunk '{chunk_id}' is_template_data must be a boolean")

    doc_id = str(chunk.get("document_id", ""))
    if known_document_ids is not None and doc_id not in known_document_ids:
        raise ValueError(f"Chunk '{chunk_id}' references unknown document_id: '{doc_id}'")


def serialize_chunk_metadata(
    chunk: dict[str, Any],
) -> dict[str, str | int | float | bool]:
    """Serialize chunk metadata into primitive types supported by ChromaDB."""
    geo = chunk.get("geography")
    has_geo = isinstance(geo, dict)
    state = str(geo.get("state", "")) if has_geo else ""
    district = str(geo.get("district", "")) if has_geo else ""
    geo_str = json.dumps(geo, sort_keys=True) if has_geo else ""

    metadata: dict[str, str | int | float | bool] = {
        "chunk_id": str(chunk["chunk_id"]),
        "document_id": str(chunk["document_id"]),
        "title": str(chunk.get("title", "")),
        "document_type": str(chunk.get("document_type", "")),
        "source": str(chunk.get("source", "")),
        "page_start": int(chunk["page_start"]),
        "page_end": int(chunk["page_end"]),
        "page_number": int(chunk.get("page_number", chunk["page_start"])),
        "chunk_index": int(chunk.get("chunk_index", 0)),
        "chunk_index_on_page": int(chunk.get("chunk_index_on_page", 0)),
        "char_count": int(chunk.get("char_count", len(chunk.get("text", "")))),
        "word_count": int(chunk.get("word_count", len(chunk.get("text", "").split()))),
        "is_template_data": bool(chunk.get("is_template_data", False)),
        "scheme": str(chunk["scheme"]) if chunk.get("scheme") is not None else "",
        "year": str(chunk["year"]) if chunk.get("year") is not None else "",
        "business_category": (
            str(chunk["business_category"])
            if chunk.get("business_category") is not None
            else ""
        ),
        "section_title": (
            str(chunk["section_title"])
            if chunk.get("section_title") is not None
            else ""
        ),
        "geography": geo_str,
        "geography_state": state,
        "geography_district": district,
        "has_geography": has_geo,
    }
    return metadata


def deserialize_chunk_metadata(
    stored_metadata: dict[str, Any],
) -> dict[str, Any]:
    """Reconstruct structured chunk metadata from primitive ChromaDB metadata."""
    geo_raw = stored_metadata.get("geography")
    geography: dict[str, str] | None = None
    if isinstance(geo_raw, str) and geo_raw.strip():
        geography = json.loads(geo_raw)

    scheme = stored_metadata.get("scheme")
    year = stored_metadata.get("year")
    business_cat = stored_metadata.get("business_category")
    section_title = stored_metadata.get("section_title")

    return {
        "chunk_id": str(stored_metadata.get("chunk_id", "")),
        "document_id": str(stored_metadata.get("document_id", "")),
        "title": str(stored_metadata.get("title", "")),
        "document_type": str(stored_metadata.get("document_type", "")),
        "source": str(stored_metadata.get("source", "")),
        "page_start": int(stored_metadata.get("page_start", 1)),
        "page_end": int(stored_metadata.get("page_end", 1)),
        "page_number": int(stored_metadata.get("page_number", 1)),
        "chunk_index": int(stored_metadata.get("chunk_index", 0)),
        "chunk_index_on_page": int(stored_metadata.get("chunk_index_on_page", 0)),
        "char_count": int(stored_metadata.get("char_count", 0)),
        "word_count": int(stored_metadata.get("word_count", 0)),
        "is_template_data": bool(stored_metadata.get("is_template_data", False)),
        "scheme": str(scheme) if scheme else None,
        "year": str(year) if year else None,
        "business_category": str(business_cat) if business_cat else None,
        "section_title": str(section_title) if section_title else None,
        "geography": geography,
    }


def load_chunks_from_file(file_path: Path) -> list[dict[str, Any]]:
    """Load chunk dictionaries from a single JSON file."""
    content = file_path.read_text(encoding="utf-8")
    data = json.loads(content)
    if not isinstance(data, list):
        raise ValueError(f"Expected a JSON list of chunks in {file_path}")
    return data


def load_all_chunks(chunks_dir: Path = CHUNKS_DIR) -> list[dict[str, Any]]:
    """Load all chunk dictionaries from the chunks directory."""
    if not chunks_dir.exists():
        raise FileNotFoundError(f"Chunks directory does not exist: {chunks_dir}")

    chunk_files = sorted(chunks_dir.glob("*.json"))
    if not chunk_files:
        raise ValueError(f"No JSON chunk files found in: {chunks_dir}")

    all_chunks: list[dict[str, Any]] = []
    for file_path in chunk_files:
        all_chunks.extend(load_chunks_from_file(file_path))
    return all_chunks


def get_vector_store_client(
    persist_directory: Path = VECTOR_STORE_DIR,
) -> ClientAPI:
    """Create or return a persistent Chroma client."""
    persist_directory.mkdir(parents=True, exist_ok=True)
    return chromadb.PersistentClient(path=str(persist_directory))


def get_or_create_collection(
    client: ClientAPI,
    collection_name: str = DEFAULT_COLLECTION_NAME,
    embedding_function: EmbeddingFunction[Documents] | None = None,
    rebuild: bool = False,
) -> Collection:
    """Get or create the Chroma collection, rebuilding if requested."""
    if rebuild:
        try:
            client.delete_collection(name=collection_name)
        except Exception:
            pass
        return client.create_collection(
            name=collection_name,
            embedding_function=embedding_function,
            metadata={"hnsw:space": "cosine"},
        )
    return client.get_or_create_collection(
        name=collection_name,
        embedding_function=embedding_function,
        metadata={"hnsw:space": "cosine"},
    )


def index_chunks(
    chunks: list[dict[str, Any]],
    collection: Collection,
    batch_size: int = DEFAULT_BATCH_SIZE,
    known_document_ids: set[str] | None = None,
) -> dict[str, Any]:
    """Validate, batch, and upsert chunks into the Chroma collection."""
    if batch_size < 1:
        raise ValueError(f"batch_size must be positive, got {batch_size}")

    for chunk in chunks:
        validate_chunk_for_indexing(chunk, known_document_ids=known_document_ids)

    ids = [str(chunk["chunk_id"]) for chunk in chunks]
    documents = [str(chunk["text"]) for chunk in chunks]
    metadatas = [serialize_chunk_metadata(chunk) for chunk in chunks]

    for start_idx in range(0, len(chunks), batch_size):
        end_idx = start_idx + batch_size
        collection.upsert(
            ids=ids[start_idx:end_idx],
            documents=documents[start_idx:end_idx],
            metadatas=metadatas[start_idx:end_idx],
        )

    doc_ids = sorted({str(c["document_id"]) for c in chunks})
    per_doc_counts: dict[str, int] = {}
    for c in chunks:
        d = str(c["document_id"])
        per_doc_counts[d] = per_doc_counts.get(d, 0) + 1

    return {
        "chunks_loaded": len(chunks),
        "chunks_indexed": len(chunks),
        "chunks_skipped": 0,
        "failures": 0,
        "documents_processed": doc_ids,
        "document_count": len(doc_ids),
        "per_document_chunks": per_doc_counts,
        "collection_count": collection.count(),
    }


def format_indexing_summary(
    stats: dict[str, Any],
    persist_dir: Path,
    collection_name: str,
    embedding_type: str,
) -> str:
    """Format indexing statistics into a clean human-readable summary."""
    lines = [
        "=" * 55,
        "SAKSHAM VECTOR STORE INGESTION SUMMARY",
        "=" * 55,
        "Vector Store: ChromaDB (Persistent)",
        f"Location: {persist_dir}",
        f"Collection: {collection_name}",
        f"Embedding Model: {embedding_type}",
        f"Documents processed: {stats.get('document_count', 0)}",
        f"Chunks loaded: {stats.get('chunks_loaded', 0)}",
        f"Chunks indexed: {stats.get('chunks_indexed', 0)}",
        f"Chunks skipped: {stats.get('chunks_skipped', 0)}",
        f"Failures: {stats.get('failures', 0)}",
        f"Total collection records: {stats.get('collection_count', 0)}",
        "-" * 55,
        "Per-document breakdown:",
    ]
    per_doc = stats.get("per_document_chunks", {})
    for doc_id, count in sorted(per_doc.items()):
        is_tmpl = False
        if doc_id in DOCUMENT_METADATA:
            is_tmpl = DOCUMENT_METADATA[doc_id].is_template_data
        lines.append(f"  - {doc_id}: {count} chunks (Template: {is_tmpl})")
    lines.append("=" * 55)
    return "\n".join(lines)


def query_vector_store(
    collection: Collection,
    query_text: str,
    n_results: int = 5,
    where: dict[str, Any] | None = None,
) -> list[dict[str, Any]]:
    """Query the vector store and return matched chunks with deserialized metadata."""
    query_kwargs: dict[str, Any] = {
        "query_texts": [query_text],
        "n_results": n_results,
    }
    if where:
        query_kwargs["where"] = where

    results = collection.query(**query_kwargs)

    hits: list[dict[str, Any]] = []
    ids = results.get("ids", [[]])[0]
    docs = results.get("documents", [[]])[0]
    metas = results.get("metadatas", [[]])[0]
    distances = results.get("distances", [[]])[0] if results.get("distances") else [0.0] * len(ids)

    for cid, doc, meta, dist in zip(ids, docs, metas, distances):
        deserialized = deserialize_chunk_metadata(meta)
        deserialized["text"] = doc
        deserialized["distance"] = float(dist)
        hits.append(deserialized)

    return hits


def rebuild_and_index(
    chunks_dir: Path = CHUNKS_DIR,
    persist_directory: Path = VECTOR_STORE_DIR,
    collection_name: str = DEFAULT_COLLECTION_NAME,
    embedding_type: str = "default",
    batch_size: int = DEFAULT_BATCH_SIZE,
) -> dict[str, Any]:
    """Full workflow: load chunks, embed, rebuild index, report statistics."""
    chunks = load_all_chunks(chunks_dir=chunks_dir)
    client = get_vector_store_client(persist_directory=persist_directory)
    embedding_fn = get_embedding_function(embedding_type=embedding_type)

    collection = get_or_create_collection(
        client=client,
        collection_name=collection_name,
        embedding_function=embedding_fn,
        rebuild=True,
    )

    stats = index_chunks(
        chunks=chunks,
        collection=collection,
        batch_size=batch_size,
        known_document_ids=set(DOCUMENT_METADATA.keys()),
    )

    summary = format_indexing_summary(
        stats=stats,
        persist_dir=persist_directory,
        collection_name=collection_name,
        embedding_type=embedding_type,
    )
    print(summary)
    return stats


def main() -> None:
    embedding_type = os.getenv("SAKSHAM_EMBEDDING_TYPE", "default")
    rebuild_and_index(embedding_type=embedding_type)


if __name__ == "__main__":
    main()
