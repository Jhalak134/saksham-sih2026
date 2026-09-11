"""
extract_documents.py

Step 1.2 of the SAKSHAM RAG pipeline: PDF -> page-indexed text extraction.

Reads PDFs from ai/knowledge_base/raw/<document_type>/ and writes one JSON
file per document to ai/knowledge_base/extracted/, preserving for every
page:
    - document name (title)
    - page number
    - source (path to the original PDF, relative to knowledge_base/raw)

Chunking is NOT done here — see chunk_documents.py (Step 1.5). This file
only turns a PDF into a page-indexed list of text blocks.
"""

from __future__ import annotations

import json
from dataclasses import dataclass, field
from pathlib import Path

import pdfplumber

KNOWLEDGE_BASE_DIR = Path(__file__).resolve().parents[1] / "knowledge_base"
RAW_DIR = KNOWLEDGE_BASE_DIR / "raw"
EXTRACTED_DIR = KNOWLEDGE_BASE_DIR / "extracted"

# Known human-readable titles for the current MVP document set (Step 0.4).
# Any future document not listed here falls back to a prettified filename.
KNOWN_TITLES = {
    "pmfme_scheme_guidelines": (
        "Guidelines for Implementation of PM Formalisation of Micro Food "
        "Processing Enterprises Scheme (PMFME)"
    ),
    "dairy_yogurt_plant_project_report": "Project Report: Yogurt Plant Unit",
    "manual_entrepreneurship_development": "A Manual on Entrepreneurship Development",
    "mathura_district_industrial_profile": "Brief Industrial Profile of District Mathura",
}


@dataclass
class PageText:
    page_number: int
    text: str


@dataclass
class ExtractedDocument:
    document_id: str
    title: str
    document_type: str
    source: str
    page_count: int
    pages: list[PageText] = field(default_factory=list)

    def to_dict(self) -> dict:
        return {
            "document_id": self.document_id,
            "title": self.title,
            "document_type": self.document_type,
            "source": self.source,
            "page_count": self.page_count,
            "pages": [
                {"page_number": p.page_number, "text": p.text} for p in self.pages
            ],
        }


def infer_document_type(pdf_path: Path) -> str:
    """The category folder name directly under raw/ is the document_type."""
    return pdf_path.relative_to(RAW_DIR).parts[0]


def infer_title(document_id: str) -> str:
    return KNOWN_TITLES.get(document_id, document_id.replace("_", " ").title())


def extract_pages(pdf_path: Path) -> list[PageText]:
    """Extract text page-by-page, keeping page numbers 1-indexed."""
    pages: list[PageText] = []
    with pdfplumber.open(pdf_path) as pdf:
        for index, page in enumerate(pdf.pages, start=1):
            text = page.extract_text() or ""
            pages.append(PageText(page_number=index, text=text))
    return pages


def extract_document(pdf_path: Path) -> ExtractedDocument:
    document_id = pdf_path.stem
    pages = extract_pages(pdf_path)
    return ExtractedDocument(
        document_id=document_id,
        title=infer_title(document_id),
        document_type=infer_document_type(pdf_path),
        source=str(pdf_path.relative_to(RAW_DIR)),
        page_count=len(pages),
        pages=pages,
    )


def save_extracted(document: ExtractedDocument, output_dir: Path = EXTRACTED_DIR) -> Path:
    output_dir.mkdir(parents=True, exist_ok=True)
    output_path = output_dir / f"{document.document_id}.json"
    output_path.write_text(
        json.dumps(document.to_dict(), ensure_ascii=False, indent=2),
        encoding="utf-8",
    )
    return output_path


def find_all_pdfs(raw_dir: Path = RAW_DIR) -> list[Path]:
    return sorted(raw_dir.rglob("*.pdf"))


def extract_all() -> list[Path]:
    """Extract every PDF under raw/ and write results to extracted/."""
    outputs = []
    for pdf_path in find_all_pdfs():
        document = extract_document(pdf_path)
        outputs.append(save_extracted(document))
    return outputs


if __name__ == "__main__":
    for path in extract_all():
        print(f"Extracted -> {path}")
