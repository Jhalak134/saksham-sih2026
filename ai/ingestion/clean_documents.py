"""
clean_documents.py

Step 1.3 of the SAKSHAM RAG pipeline: clean the page text produced by
extract_documents.py.

Reads JSON files from ai/knowledge_base/extracted/ and writes cleaned
versions (same shape) to ai/knowledge_base/cleaned/.

What this step does:
    - Normalizes ragged whitespace (trailing spaces, excess blank lines)
    - Detects and strips repeated header/footer lines (e.g. page-number
      footers like "- 3 -" or a bare "3"), using digit-normalized
      comparison across pages so a footer that changes only by page
      number is still recognized as boilerplate
    - Leaves genuinely empty pages as empty (nothing to clean, nothing
      to invent)

What this step deliberately does NOT do:
    - Rewrite, summarize, or otherwise alter real sentence content
    - Attempt to repair mid-word spacing artifacts from the PDF's own
      font kerning (e.g. "k ilometers") — that requires a dictionary-
      based heuristic that risks corrupting correct text, out of scope
      for this step
"""

from __future__ import annotations

import json
import re
from dataclasses import dataclass
from pathlib import Path

KNOWLEDGE_BASE_DIR = Path(__file__).resolve().parents[1] / "knowledge_base"
EXTRACTED_DIR = KNOWLEDGE_BASE_DIR / "extracted"
CLEANED_DIR = KNOWLEDGE_BASE_DIR / "cleaned"

# A boilerplate header/footer must appear on at least this fraction of a
# document's non-empty pages before we treat it as noise rather than content.
BOILERPLATE_THRESHOLD = 0.4

_DIGIT_RUN = re.compile(r"\d+")
_BLANK_LINE_RUN = re.compile(r"\n{3,}")


def normalize_for_comparison(line: str) -> str:
    """Collapse digit runs so '- 3 -' and '- 47 -' compare as the same pattern."""
    return _DIGIT_RUN.sub("#", line.strip())


def normalize_whitespace(text: str) -> str:
    """Strip trailing spaces per line and collapse 3+ blank lines to one."""
    lines = [line.rstrip() for line in text.split("\n")]
    collapsed = "\n".join(lines)
    collapsed = _BLANK_LINE_RUN.sub("\n\n", collapsed)
    return collapsed.strip()


def _edge_line(text: str, *, first: bool) -> str:
    lines = [line for line in text.split("\n") if line.strip()]
    if not lines:
        return ""
    return lines[0] if first else lines[-1]


def detect_boilerplate(pages: list[dict]) -> dict[str, str | None]:
    """
    Find a repeated header pattern (first line) and/or footer pattern
    (last line) across a document's non-empty pages.
    """
    non_empty = [p for p in pages if p["text"].strip()]
    if len(non_empty) < 3:
        return {"header": None, "footer": None}

    header_counts: dict[str, int] = {}
    footer_counts: dict[str, int] = {}
    for page in non_empty:
        header_counts[normalize_for_comparison(_edge_line(page["text"], first=True))] = (
            header_counts.get(normalize_for_comparison(_edge_line(page["text"], first=True)), 0) + 1
        )
        footer_counts[normalize_for_comparison(_edge_line(page["text"], first=False))] = (
            footer_counts.get(normalize_for_comparison(_edge_line(page["text"], first=False)), 0) + 1
        )

    threshold = len(non_empty) * BOILERPLATE_THRESHOLD
    header = _most_frequent_above_threshold(header_counts, threshold)
    footer = _most_frequent_above_threshold(footer_counts, threshold)
    return {"header": header, "footer": footer}


def _most_frequent_above_threshold(counts: dict[str, int], threshold: float) -> str | None:
    if not counts:
        return None
    pattern, count = max(counts.items(), key=lambda item: item[1])
    if pattern and count >= threshold:
        return pattern
    return None


def strip_boilerplate_line(text: str, pattern: str, *, first: bool) -> str:
    """Remove the first or last non-empty line if it matches the boilerplate pattern."""
    lines = text.split("\n")
    non_empty_indices = [i for i, line in enumerate(lines) if line.strip()]
    if not non_empty_indices:
        return text
    target_index = non_empty_indices[0] if first else non_empty_indices[-1]
    if normalize_for_comparison(lines[target_index]) == pattern:
        del lines[target_index]
    return "\n".join(lines)


def clean_page_text(text: str, boilerplate: dict[str, str | None]) -> str:
    cleaned = text
    if boilerplate["header"]:
        cleaned = strip_boilerplate_line(cleaned, boilerplate["header"], first=True)
    if boilerplate["footer"]:
        cleaned = strip_boilerplate_line(cleaned, boilerplate["footer"], first=False)
    return normalize_whitespace(cleaned)


def clean_document(document: dict) -> dict:
    boilerplate = detect_boilerplate(document["pages"])
    cleaned_pages = [
        {"page_number": p["page_number"], "text": clean_page_text(p["text"], boilerplate)}
        for p in document["pages"]
    ]
    return {
        **{k: v for k, v in document.items() if k != "pages"},
        "removed_header_pattern": boilerplate["header"],
        "removed_footer_pattern": boilerplate["footer"],
        "pages": cleaned_pages,
    }


def clean_all(
    extracted_dir: Path = EXTRACTED_DIR, cleaned_dir: Path = CLEANED_DIR
) -> list[Path]:
    cleaned_dir.mkdir(parents=True, exist_ok=True)
    outputs = []
    for source_path in sorted(extracted_dir.glob("*.json")):
        document = json.loads(source_path.read_text(encoding="utf-8"))
        cleaned = clean_document(document)
        output_path = cleaned_dir / source_path.name
        output_path.write_text(
            json.dumps(cleaned, ensure_ascii=False, indent=2), encoding="utf-8"
        )
        outputs.append(output_path)
    return outputs


if __name__ == "__main__":
    for path in clean_all():
        print(f"Cleaned -> {path}")
