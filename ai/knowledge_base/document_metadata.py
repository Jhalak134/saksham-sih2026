"""
document_metadata.py

Step 1.4 of the SAKSHAM RAG pipeline: the metadata schema for the
knowledge base.

Technical fields (document_id, title, document_type, source, page_number)
are already produced automatically by extract_documents.py. This file
holds the fields that require a judgment call about *what the document's
own text actually says* — geography, business_category, scheme, year.

Rule followed throughout: a field is set only if the source document
itself states it. If a document doesn't name a state/district, a scheme,
or a year, that field stays None rather than being guessed. Every value
below was checked against the cleaned extracted text before being set
(see the verification step in the accompanying walkthrough).
"""

from __future__ import annotations

from dataclasses import dataclass
from pathlib import Path

KNOWLEDGE_BASE_DIR = Path(__file__).resolve().parent
CLEANED_DIR = KNOWLEDGE_BASE_DIR / "cleaned"


@dataclass(frozen=True)
class DocumentMetadata:
    geography: dict[str, str] | None
    business_category: str | None
    scheme: str | None
    year: str | None
    is_template_data: bool = False
    document_type: str | None = None


DOCUMENT_METADATA: dict[str, DocumentMetadata] = {
    "pmfme_scheme_guidelines": DocumentMetadata(
        geography=None,  # national scheme; no state/district named anywhere in the text
        business_category=None,  # covers all food processing, not one SAKSHAM category
        scheme="PMFME",
        year="2020",  # doc states "period of five years from 2020-21 to 2024-25"
    ),
    "dairy_yogurt_plant_project_report": DocumentMetadata(
        geography=None,  # template report; no state/district named
        business_category="dairy",
        scheme=None,  # no scheme referenced in this document
        year=None,  # no publication year stated (a "2023" market projection appears
        #             in a sentence about CAGR growth — that's not a document date)
        is_template_data=True,  # example-unit figures, not live market data
        document_type="project_report_template",
    ),
    "manual_entrepreneurship_development": DocumentMetadata(
        geography=None,  # general/national manual, no state or district discussed
        business_category=None,  # generic across sectors
        scheme=None,
        year="2024",  # "Edition: 2024" stated on the copyright page
    ),
    "mathura_district_industrial_profile": DocumentMetadata(
        geography={"state": "Uttar Pradesh", "district": "Mathura"},
        business_category=None,  # spans many sectors, not one category
        scheme=None,
        year="2011",  # Census 2011 is the document's primary data vintage
    ),
}


def get_metadata(document_id: str) -> DocumentMetadata:
    if document_id not in DOCUMENT_METADATA:
        raise KeyError(
            f"No curated metadata for '{document_id}'. Add an entry to "
            "DOCUMENT_METADATA before using this document in the pipeline "
            "— do not guess its metadata automatically."
        )
    return DOCUMENT_METADATA[document_id]


def build_page_metadata(document: dict, page: dict) -> dict:
    """Merge a cleaned document's technical fields + curated fields for one page."""
    curated = get_metadata(document["document_id"])
    doc_type = curated.document_type or document.get("document_type")
    page_num = page["page_number"]
    return {
        "document_id": document["document_id"],
        "title": document["title"],
        "document_type": doc_type,
        "source": document["source"],
        "page_number": page_num,
        "page_start": page_num,
        "page_end": page_num,
        "geography": curated.geography,
        "business_category": curated.business_category,
        "scheme": curated.scheme,
        "year": curated.year,
        "is_template_data": curated.is_template_data,
    }


def validate_metadata_coverage(cleaned_dir: Path = CLEANED_DIR) -> list[str]:
    """Return a list of problems: docs on disk with no curated metadata, or vice versa."""
    on_disk = {p.stem for p in cleaned_dir.glob("*.json")}
    curated = set(DOCUMENT_METADATA.keys())
    problems = []
    for missing in sorted(on_disk - curated):
        problems.append(f"'{missing}' exists in cleaned/ but has no curated metadata")
    for stray in sorted(curated - on_disk):
        problems.append(f"'{stray}' has curated metadata but no file in cleaned/")
    return problems


def main() -> int:
    problems = validate_metadata_coverage()
    if problems:
        for problem in problems:
            print("PROBLEM:", problem)
        return 1
    print("All cleaned documents have curated metadata, and vice versa. OK.")
    return 0


if __name__ == "__main__":
    main()
