"""Tests for ai/knowledge_base/document_metadata.py ensuring 100% branch coverage."""

from __future__ import annotations

import tempfile
from pathlib import Path
import unittest

from ai.knowledge_base.document_metadata import (
    DOCUMENT_METADATA,
    DocumentMetadata,
    build_page_metadata,
    get_metadata,
    validate_metadata_coverage,
)


class TestDocumentMetadata(unittest.TestCase):
    def test_get_metadata_known_documents(self) -> None:
        for doc_id in [
            "pmfme_scheme_guidelines",
            "dairy_yogurt_plant_project_report",
            "manual_entrepreneurship_development",
            "mathura_district_industrial_profile",
        ]:
            meta = get_metadata(doc_id)
            self.assertIsInstance(meta, DocumentMetadata)

    def test_get_metadata_unknown_document_raises(self) -> None:
        with self.assertRaises(KeyError) as ctx:
            get_metadata("non_existent_document")
        self.assertIn("No curated metadata for 'non_existent_document'", str(ctx.exception))

    def test_build_page_metadata(self) -> None:
        doc = {
            "document_id": "dairy_yogurt_plant_project_report",
            "title": "Project Report: Yogurt Plant Unit",
            "document_type": "business_knowledge",
            "source": "business_knowledge/dairy_yogurt_plant_project_report.pdf",
        }
        page = {"page_number": 3, "text": "sample text"}
        meta = build_page_metadata(doc, page)
        self.assertEqual(meta["document_id"], "dairy_yogurt_plant_project_report")
        self.assertEqual(meta["document_type"], "project_report_template")
        self.assertEqual(meta["page_number"], 3)
        self.assertEqual(meta["page_start"], 3)
        self.assertEqual(meta["page_end"], 3)
        self.assertTrue(meta["is_template_data"])
        self.assertEqual(meta["business_category"], "dairy")

    def test_build_page_metadata_fallback_doc_type(self) -> None:
        doc = {
            "document_id": "pmfme_scheme_guidelines",
            "title": "PMFME Guidelines",
            "document_type": "scheme_docs",
            "source": "scheme_docs/pmfme_scheme_guidelines.pdf",
        }
        page = {"page_number": 1, "text": ""}
        meta = build_page_metadata(doc, page)
        self.assertEqual(meta["document_type"], "scheme_docs")
        self.assertEqual(meta["scheme"], "PMFME")

    def test_validate_metadata_coverage_clean(self) -> None:
        problems = validate_metadata_coverage()
        self.assertEqual(problems, [])

    def test_validate_metadata_coverage_with_missing_and_stray(self) -> None:
        with tempfile.TemporaryDirectory() as tmp_dir:
            tmp_path = Path(tmp_dir)
            (tmp_path / "unknown_doc.json").write_text("{}", encoding="utf-8")
            (tmp_path / "pmfme_scheme_guidelines.json").write_text("{}", encoding="utf-8")

            problems = validate_metadata_coverage(tmp_path)
            self.assertTrue(any("unknown_doc" in p for p in problems))
            self.assertTrue(any("has curated metadata but no file" in p for p in problems))

    def test_main_clean(self) -> None:
        from unittest.mock import patch
        from ai.knowledge_base.document_metadata import main
        with patch("builtins.print") as mock_print:
            code = main()
            self.assertEqual(code, 0)
            mock_print.assert_called_with("All cleaned documents have curated metadata, and vice versa. OK.")

    def test_main_with_problems(self) -> None:
        from unittest.mock import patch
        from ai.knowledge_base.document_metadata import main
        with patch("ai.knowledge_base.document_metadata.validate_metadata_coverage", return_value=["Mock problem"]):
            with patch("builtins.print") as mock_print:
                code = main()
                self.assertEqual(code, 1)
                mock_print.assert_called_with("PROBLEM:", "Mock problem")

    def test_run_as_main(self) -> None:
        import runpy
        from unittest.mock import patch
        with patch("builtins.print"):
            runpy.run_module("ai.knowledge_base.document_metadata", run_name="__main__")


if __name__ == "__main__":
    unittest.main()
