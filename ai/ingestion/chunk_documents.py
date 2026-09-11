"""
chunk_documents.py

Step 1.5 of the SAKSHAM RAG pipeline: split cleaned document text into
meaningful, semantically coherent, metadata-rich chunks.

Architecture:
    document -> page -> section/paragraph -> chunk

Key Principles:
    - DATA PROVIDES EVIDENCE, DETERMINISTIC ENGINES CALCULATE, AI EXPLAINS.
    - Deterministic and reproducible: no LLMs, deterministic chunk IDs.
    - Preserves exact page provenance (page_start, page_end, page_number).
    - Preserves all curated metadata from document_metadata.py (never guesses).
    - Preserves template flags (is_template_data=True for dairy report).
    - Preserves historical vintage (year=2011, Mathura district profile).
    - Sentence boundaries are strictly respected (no mid-sentence cutting).
"""

from __future__ import annotations

import json
import re
from pathlib import Path

from ai.knowledge_base.document_metadata import (
    DOCUMENT_METADATA,
    build_page_metadata,
    get_metadata,
)

KNOWLEDGE_BASE_DIR = Path(__file__).resolve().parents[1] / "knowledge_base"
CLEANED_DIR = KNOWLEDGE_BASE_DIR / "cleaned"
CHUNKS_DIR = KNOWLEDGE_BASE_DIR / "chunks"

# Target chunk size in words (per specification: approximately 300–800 words)
MIN_CHUNK_WORDS: int = 50
MAX_CHUNK_WORDS: int = 600
OVERLAP_SENTENCES: int = 1

TOC_HEADER_RATIO: float = 0.6
TOC_MIN_LINES: int = 3

# Section header patterns:
# 1. Numbered subsections: "1.1 Overview", "1.1.1 Food Processing"
# 2. Major numbered sections: "1. General Characteristics", "2. District at a Glance"
# 3. Explicit module headers: "Module 1"
# 4. Uppercase headings: "INTRODUCTION", "PROJECTED PROFITABILITY STATEMENT"
HEADER_PATTERN = re.compile(
    r"^("
    r"\d+(\.\d+){1,4}\s+[A-Z].*"
    r"|\d+\.\s+[A-Z].*"
    r"|Module\s+\d+.*"
    r"|[A-Z0-9\s,&/()\-:]{3,50}"
    r")$"
)

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


def is_header_line(line: str) -> bool:
    """Check if a line matches a section header pattern without false-positive table rows."""
    stripped = line.strip()
    if not stripped or len(stripped) > 60:
        return False
    if re.match(r"^\d+[\s\d.,%-]+$", stripped):
        return False
    return bool(HEADER_PATTERN.match(stripped))


def is_table_of_contents_page(text: str) -> bool:
    """Detect table-of-contents pages where lines are bare headings with page numbers."""
    lines = [line.strip() for line in text.split("\n") if line.strip()]
    if len(lines) < TOC_MIN_LINES:
        return False
    toc_pattern = re.compile(
        r"^(\d+(\.\d+)*\s+.*?\d+$|[A-Z\s]{3,30}\s+\d+$)"
    )
    toc_matches = [line for line in lines if toc_pattern.match(line)]
    return len(toc_matches) / len(lines) >= TOC_HEADER_RATIO


def extract_section_title(text: str) -> str | None:
    """Extract section title if the first non-empty line of text is a header."""
    lines = [line.strip() for line in text.split("\n") if line.strip()]
    if lines and is_header_line(lines[0]):
        return lines[0]
    return None


def split_page_into_sections(text: str) -> list[str]:
    """Split page lines into section blocks at detected header lines."""
    lines = [line for line in text.split("\n") if line.strip()]
    if not lines:
        return []

    sections: list[str] = []
    current: list[str] = []
    for line in lines:
        if is_header_line(line) and current:
            sections.append("\n".join(current).strip())
            current = []
        current.append(line)
    sections.append("\n".join(current).strip())
    return sections


def split_sentences(text: str) -> list[str]:
    """Split text along terminal sentence boundaries preserving sentence integrity."""
    pattern = r"(?<=[.!?])\s+(?=[A-Z0-9\"'\u2018\u201c])"
    sentences = re.split(pattern, text)
    cleaned = [sentence.strip() for sentence in sentences if sentence.strip()]
    return cleaned if cleaned else [text.strip()]


def split_long_section(
    text: str,
    max_words: int = MAX_CHUNK_WORDS,
    overlap_sentences: int = OVERLAP_SENTENCES,
) -> list[str]:
    """Split a section exceeding max_words along sentence boundaries with deterministic overlap."""
    words = text.split()
    if len(words) <= max_words:
        return [text]

    sentences = split_sentences(text)
    if len(sentences) <= 1:
        chunks: list[str] = []
        step = max(max_words - 20, 1)
        for idx in range(0, len(words), step):
            chunks.append(" ".join(words[idx : idx + max_words]))
        return chunks

    chunks = []
    current_sentences: list[str] = []
    current_words = 0
    for sentence in sentences:
        sentence_word_count = len(sentence.split())
        if current_sentences and (current_words + sentence_word_count > max_words):
            chunks.append(" ".join(current_sentences))
            overlap_count = min(overlap_sentences, len(current_sentences))
            current_sentences = list(current_sentences[-overlap_count:])
            current_words = sum(len(s.split()) for s in current_sentences)
        current_sentences.append(sentence)
        current_words += sentence_word_count

    chunks.append(" ".join(current_sentences))
    return chunks


def merge_short_sections(
    sections: list[str],
    min_words: int = MIN_CHUNK_WORDS,
    max_words: int = MAX_CHUNK_WORDS,
) -> list[str]:
    """Merge undersized sections (e.g. isolated headers) with adjacent content on the page."""
    if not sections:
        return []

    merged: list[str] = []
    carry: list[str] = []
    for section in sections:
        word_count = len(section.split())
        if carry:
            carry_words = sum(len(s.split()) for s in carry)
            if carry_words + word_count <= max_words:
                carry.append(section)
            else:
                merged.append("\n\n".join(carry))
                carry = [section]
        else:
            if word_count < min_words and len(sections) > 1:
                carry.append(section)
            else:
                merged.append(section)

    if carry:
        if merged and sum(len(s.split()) for s in carry) < min_words:
            merged[-1] = merged[-1] + "\n\n" + "\n\n".join(carry)
        else:
            merged.append("\n\n".join(carry))
    return merged


def chunk_page_text(
    text: str,
    min_words: int = MIN_CHUNK_WORDS,
    max_words: int = MAX_CHUNK_WORDS,
) -> list[str]:
    """Divide a single page text into coherent chunks."""
    if not text.strip() or is_table_of_contents_page(text):
        return []

    sections = split_page_into_sections(text)
    merged_sections = merge_short_sections(sections, min_words, max_words)

    chunks: list[str] = []
    for section in merged_sections:
        chunks.extend(split_long_section(section, max_words, OVERLAP_SENTENCES))
    return chunks


def build_chunk_record(
    document: dict,
    chunk_text: str,
    page_start: int,
    page_end: int,
    chunk_index_on_page: int,
    global_chunk_index: int,
) -> dict[str, object]:
    """Create a standardized chunk dictionary with complete metadata."""
    doc_id = str(document["document_id"])
    page_dict = {"page_number": page_start}
    if doc_id in DOCUMENT_METADATA:
        base_metadata = build_page_metadata(document, page_dict)
    else:
        base_metadata = {
            "title": str(document.get("title", doc_id)),
            "document_type": str(document.get("document_type", "unknown")),
            "source": str(document.get("source", "")),
            "geography": None,
            "business_category": None,
            "scheme": None,
            "year": None,
            "is_template_data": False,
        }

    chunk_id = f"{doc_id}_p{page_start:03d}_c{chunk_index_on_page:03d}"
    section_title = extract_section_title(chunk_text)

    return {
        "chunk_id": chunk_id,
        "document_id": doc_id,
        "title": base_metadata["title"],
        "document_type": base_metadata["document_type"],
        "source": base_metadata["source"],
        "page_start": page_start,
        "page_end": page_end,
        "page_number": page_start,
        "geography": base_metadata["geography"],
        "business_category": base_metadata["business_category"],
        "scheme": base_metadata["scheme"],
        "year": base_metadata["year"],
        "is_template_data": base_metadata["is_template_data"],
        "section_title": section_title,
        "chunk_index": global_chunk_index,
        "chunk_index_on_page": chunk_index_on_page,
        "char_count": len(chunk_text),
        "word_count": len(chunk_text.split()),
        "text": chunk_text,
    }


def chunk_document(document: dict) -> list[dict[str, object]]:
    """Chunk all pages in a cleaned document and produce full chunk objects."""
    chunks: list[dict[str, object]] = []
    global_index = 0

    for page in document.get("pages", []):
        page_number = int(page["page_number"])
        page_text = str(page.get("text", ""))
        chunk_texts = chunk_page_text(page_text)

        for on_page_idx, chunk_text in enumerate(chunk_texts, start=1):
            record = build_chunk_record(
                document=document,
                chunk_text=chunk_text,
                page_start=page_number,
                page_end=page_number,
                chunk_index_on_page=on_page_idx,
                global_chunk_index=global_index,
            )
            chunks.append(record)
            global_index += 1

    return chunks


def validate_chunks(
    chunks: list[dict[str, object]],
    known_document_ids: set[str] | None = None,
) -> list[str]:
    """Validate chunks against required integrity, provenance, and metadata rules."""
    errors: list[str] = []
    seen_ids: set[str] = set()
    known_ids = known_document_ids if known_document_ids is not None else set(DOCUMENT_METADATA.keys())

    for chunk in chunks:
        cid = str(chunk.get("chunk_id", "<missing>"))

        # 1. Missing required fields
        missing = sorted(REQUIRED_CHUNK_FIELDS - chunk.keys())
        if missing:
            errors.append(f"Chunk {cid} missing required fields: {missing}")

        # 2. Empty chunk text
        text = str(chunk.get("text", "")).strip()
        if not text:
            errors.append(f"Chunk {cid} has empty text")

        # 3. Duplicate chunk IDs
        if cid in seen_ids:
            errors.append(f"Duplicate chunk_id detected: {cid}")
        seen_ids.add(cid)

        # 4. Unknown document ID
        doc_id = str(chunk.get("document_id", ""))
        if doc_id not in known_ids:
            errors.append(f"Chunk {cid} references unknown document_id: '{doc_id}'")
            continue

        # 5. Metadata fidelity checks
        curated = get_metadata(doc_id)
        if chunk.get("is_template_data") != curated.is_template_data:
            errors.append(
                f"Chunk {cid} is_template_data mismatch: expected {curated.is_template_data}, "
                f"got {chunk.get('is_template_data')}"
            )
        if chunk.get("scheme") != curated.scheme:
            errors.append(
                f"Chunk {cid} scheme mismatch: expected {curated.scheme}, got {chunk.get('scheme')}"
            )
        if chunk.get("business_category") != curated.business_category:
            errors.append(
                f"Chunk {cid} business_category mismatch: expected {curated.business_category}, "
                f"got {chunk.get('business_category')}"
            )
        if chunk.get("geography") != curated.geography:
            errors.append(
                f"Chunk {cid} geography mismatch: expected {curated.geography}, got {chunk.get('geography')}"
            )
        if chunk.get("year") != curated.year:
            errors.append(
                f"Chunk {cid} year mismatch: expected {curated.year}, got {chunk.get('year')}"
            )

        # 6. Page range validity
        p_start = chunk.get("page_start")
        p_end = chunk.get("page_end")
        if not isinstance(p_start, int) or p_start < 1:
            errors.append(f"Chunk {cid} has invalid page_start: {p_start}")
        if not isinstance(p_end, int) or (isinstance(p_start, int) and p_end < p_start):
            errors.append(f"Chunk {cid} has invalid page_end: {p_end}")

    return errors


def calculate_document_stats(
    document_id: str,
    title: str,
    pages_count: int,
    chunks: list[dict[str, object]],
    is_template: bool,
) -> dict[str, object]:
    """Compute summary metrics for chunks of a document."""
    word_counts = [int(c.get("word_count", 0)) for c in chunks]
    total_words = sum(word_counts)
    chunk_count = len(chunks)

    return {
        "document_id": document_id,
        "title": title,
        "pages": pages_count,
        "chunks": chunk_count,
        "avg_words": (total_words / chunk_count) if chunk_count > 0 else 0.0,
        "min_words": min(word_counts) if word_counts else 0,
        "max_words": max(word_counts) if word_counts else 0,
        "is_template_data": is_template,
    }


def format_stats_summary(stats_list: list[dict[str, object]]) -> str:
    """Format ingestion statistics summary block according to pipeline specification."""
    lines = [
        "=" * 50,
        "DOCUMENT CHUNKING INGESTION SUMMARY",
        "=" * 50,
    ]
    total_chunks = 0
    for stats in stats_list:
        total_chunks += int(stats["chunks"])
        lines.append(f"Document: {stats['document_id']}")
        lines.append(f"Pages: {stats['pages']}")
        lines.append(f"Chunks: {stats['chunks']}")
        lines.append(f"Average words/chunk: {float(stats['avg_words']):.1f}")
        lines.append(f"Min words: {stats['min_words']}")
        lines.append(f"Max words: {stats['max_words']}")
        lines.append(f"Template data: {stats['is_template_data']}")
        lines.append("-" * 50)

    lines.append(f"Total documents: {len(stats_list)}")
    lines.append(f"Total chunks: {total_chunks}")
    lines.append("=" * 50)
    return "\n".join(lines)


def chunk_all(
    cleaned_dir: Path = CLEANED_DIR,
    chunks_dir: Path = CHUNKS_DIR,
) -> list[Path]:
    """Chunk all cleaned documents, validate chunks, print statistics, and write outputs."""
    chunks_dir.mkdir(parents=True, exist_ok=True)
    outputs: list[Path] = []
    stats_list: list[dict[str, object]] = []

    for source_path in sorted(cleaned_dir.glob("*.json")):
        document = json.loads(source_path.read_text(encoding="utf-8"))
        doc_id = str(document["document_id"])
        chunks = chunk_document(document)

        validation_errors = validate_chunks(chunks)
        if validation_errors:
            error_detail = "\n".join(validation_errors[:10])
            raise ValueError(
                f"Validation failed for {doc_id} with {len(validation_errors)} error(s):\n{error_detail}"
            )

        curated = get_metadata(doc_id)
        stats = calculate_document_stats(
            document_id=doc_id,
            title=str(document.get("title", doc_id)),
            pages_count=len(document.get("pages", [])),
            chunks=chunks,
            is_template=curated.is_template_data,
        )
        stats_list.append(stats)

        output_path = chunks_dir / source_path.name
        output_path.write_text(
            json.dumps(chunks, ensure_ascii=False, indent=2),
            encoding="utf-8",
        )
        outputs.append(output_path)

    print(format_stats_summary(stats_list))
    return outputs


def main() -> None:
    chunk_all()


if __name__ == "__main__":
    main()
