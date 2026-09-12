"""conftest.py

Shared test fixtures and builders for AI test suites (Task 11).
"""

from __future__ import annotations

from typing import Any
import pytest

from ai.grounding.evidence_models import EvidenceItem


def make_pmfme_item(
    chunk_id: str = "pmfme_p007_c001",
    document_id: str = "pmfme_scheme_guidelines",
    title: str = "PMFME Scheme Guidelines",
    text: str = "Credit-linked grant at 35% of eligible project cost with a maximum ceiling of Rs 10 lakh.",
    source: str = "pmfme.pdf",
    page_start: int = 7,
    page_end: int = 7,
) -> EvidenceItem:
    """Build a validated scheme guideline evidence item."""
    return EvidenceItem(
        chunk_id=chunk_id,
        document_id=document_id,
        title=title,
        text=text,
        document_type="scheme_guideline",
        source=source,
        page_start=page_start,
        page_end=page_end,
        is_template_data=False,
        year="2020",
        scheme="PMFME",
        classification="verified_observed",
    )


def make_dairy_template_item(
    chunk_id: str = "dairy_p005_c001",
    document_id: str = "dairy_yogurt_plant_project_report",
    title: str = "Yogurt Plant Project Report",
    text: str = "Total capital expenditure estimated at Rs 15.5 lakh with working capital of Rs 2.5 lakh.",
    source: str = "dairy.pdf",
    page_start: int = 5,
    page_end: int = 5,
) -> EvidenceItem:
    """Build a validated template report evidence item."""
    return EvidenceItem(
        chunk_id=chunk_id,
        document_id=document_id,
        title=title,
        text=text,
        document_type="project_report_template",
        source=source,
        page_start=page_start,
        page_end=page_end,
        is_template_data=True,
        classification="template_reference",
    )


def make_mathura_historical_item(
    chunk_id: str = "mathura_p002_c001",
    document_id: str = "mathura_district_industrial_profile",
    title: str = "Mathura District Industrial Profile",
    text: str = "Total registered micro and small enterprises recorded at 350 units in Mathura district.",
    source: str = "mathura.pdf",
    page_start: int = 2,
    page_end: int = 2,
) -> EvidenceItem:
    """Build a validated historical district evidence item."""
    return EvidenceItem(
        chunk_id=chunk_id,
        document_id=document_id,
        title=title,
        text=text,
        document_type="district_knowledge",
        source=source,
        page_start=page_start,
        page_end=page_end,
        is_template_data=False,
        year="2011",
        geography={"state": "Uttar Pradesh", "district": "Mathura"},
        classification="historical",
    )


def make_entrepreneurship_item(
    chunk_id: str = "manual_p010_c001",
    document_id: str = "manual_entrepreneurship_development",
    title: str = "Agribusiness Entrepreneurship Manual",
    text: str = "Entrepreneurs must conduct market research and evaluate demand before launching.",
    source: str = "manual.pdf",
    page_start: int = 10,
    page_end: int = 10,
) -> EvidenceItem:
    """Build a validated general entrepreneurship evidence item without numeric figures."""
    return EvidenceItem(
        chunk_id=chunk_id,
        document_id=document_id,
        title=title,
        text=text,
        document_type="entrepreneurship",
        source=source,
        page_start=page_start,
        page_end=page_end,
        is_template_data=False,
        year="2024",
        classification="verified_observed",
    )


def make_valid_response_dict(
    chunk_id: str = "pmfme_p007_c001",
    document_id: str = "pmfme_scheme_guidelines",
    source: str = "pmfme.pdf",
    answer: str = "PMFME scheme provides a 35% subsidy up to Rs 10 lakh.",
    status: str = "grounded",
) -> dict[str, Any]:
    """Build a valid baseline LLM response dictionary for testing."""
    return {
        "answer": answer,
        "key_points": ["35% credit-linked grant", "Maximum ceiling of Rs 10 lakh"],
        "citations": [
            {
                "chunk_id": chunk_id,
                "document_id": document_id,
                "source": source,
                "page_start": 7,
                "page_end": 7,
            }
        ],
        "limitations": ["Requires separate bank loan appraisal."],
        "warnings": ["General scheme advisory."],
        "evidence_used": [chunk_id],
        "grounding_status": status,
    }
