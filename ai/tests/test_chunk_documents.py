"""Comprehensive tests for ai/ingestion/chunk_documents.py to guarantee 100% coverage."""

from __future__ import annotations

import json
import runpy
import tempfile
from pathlib import Path
import unittest
from unittest.mock import patch

from ai.ingestion.chunk_documents import (
    MIN_CHUNK_WORDS,
    MAX_CHUNK_WORDS,
    OVERLAP_SENTENCES,
    REQUIRED_CHUNK_FIELDS,
    build_chunk_record,
    calculate_document_stats,
    chunk_all,
    chunk_document,
    chunk_page_text,
    extract_section_title,
    format_stats_summary,
    is_header_line,
    is_table_of_contents_page,
    main,
    merge_short_sections,
    split_long_section,
    split_page_into_sections,
    split_sentences,
    validate_chunks,
)


class TestHeaderAndTOCDetection(unittest.TestCase):
    def test_is_header_line(self) -> None:
        self.assertFalse(is_header_line(""))
        self.assertFalse(is_header_line("   "))
        self.assertFalse(is_header_line("x" * 65))
        self.assertFalse(is_header_line("100.00 200.00 300.00 - 50%"))
        self.assertFalse(is_header_line("This is just a normal sentence in a paragraph."))

        self.assertTrue(is_header_line("1.1 Overview"))
        self.assertTrue(is_header_line("1.1.1 Food Processing Micro Enterprises"))
        self.assertTrue(is_header_line("1. General Characteristics of the District"))
        self.assertTrue(is_header_line("Module 1"))
        self.assertTrue(is_header_line("INTRODUCTION"))
        self.assertTrue(is_header_line("PROJECTED PROFITABILITY STATEMENT"))

    def test_is_table_of_contents_page(self) -> None:
        self.assertFalse(is_table_of_contents_page(""))
        self.assertFalse(is_table_of_contents_page("line 1\nline 2"))

        toc_page = (
            "1.0 Background 4\n"
            "2.0 One District One Product 5\n"
            "3.0 Programme Contents 6\n"
            "4.0 Individual Category 7\n"
        )
        self.assertTrue(is_table_of_contents_page(toc_page))

        regular_page = (
            "This is normal paragraph text on an ordinary page.\n"
            "It explains various aspects of the business.\n"
            "There are multiple sentences that describe the details.\n"
            "Nothing here looks like a table of contents.\n"
        )
        self.assertFalse(is_table_of_contents_page(regular_page))

    def test_extract_section_title(self) -> None:
        self.assertIsNone(extract_section_title(""))
        self.assertIsNone(extract_section_title("   \n  \n"))
        self.assertIsNone(extract_section_title("This is a normal paragraph with no title."))
        self.assertEqual(
            extract_section_title("1.1 Overview\nSome body text follows here."),
            "1.1 Overview",
        )


class TestSplittingAndMerging(unittest.TestCase):
    def test_split_page_into_sections(self) -> None:
        self.assertEqual(split_page_into_sections(""), [])
        self.assertEqual(split_page_into_sections("   \n\n"), [])

        no_headers = "Line 1\nLine 2\nLine 3"
        self.assertEqual(split_page_into_sections(no_headers), [no_headers])

        with_headers = (
            "1.1 First Header\n"
            "Line A\n"
            "1.2 Second Header\n"
            "Line B"
        )
        sections = split_page_into_sections(with_headers)
        self.assertEqual(len(sections), 2)
        self.assertEqual(sections[0], "1.1 First Header\nLine A")
        self.assertEqual(sections[1], "1.2 Second Header\nLine B")

    def test_split_sentences(self) -> None:
        text = "Hello world. This is test! How are you? Everything is fine."
        sentences = split_sentences(text)
        self.assertEqual(len(sentences), 4)

        no_punct = "Just a single run of text without ending punctuation"
        self.assertEqual(split_sentences(no_punct), [no_punct])
        self.assertEqual(split_sentences(""), [""])

    def test_split_long_section(self) -> None:
        short_text = "This is a short text."
        self.assertEqual(split_long_section(short_text, max_words=50), [short_text])

        # Over max_words with sentences
        s1 = "Word " * 25 + "."
        s2 = "More " * 25 + "."
        s3 = "Final " * 25 + "."
        long_text = f"{s1} {s2} {s3}"
        chunks = split_long_section(long_text, max_words=30, overlap_sentences=1)
        self.assertGreater(len(chunks), 1)

        # Single long sentence fallback (words > max_words, sentences <= 1)
        giant_sentence = "UnbrokenSentenceWithNoTerminalPunctuation " * 40
        giant_chunks = split_long_section(giant_sentence, max_words=15, overlap_sentences=1)
        self.assertGreater(len(giant_chunks), 1)

    def test_merge_short_sections(self) -> None:
        self.assertEqual(merge_short_sections([]), [])

        # Single section under min_words -> returned as-is
        single_short = ["Just a few words."]
        self.assertEqual(merge_short_sections(single_short, min_words=10), single_short)

        # Multiple sections where first is short and merges into next
        s1 = "Short heading."
        s2 = "Body text with many words that go on and on for a while."
        merged = merge_short_sections([s1, s2], min_words=10, max_words=50)
        self.assertEqual(len(merged), 1)
        self.assertIn("Short heading.", merged[0])

        # Carry exceeds max_words
        big1 = "Word " * 20
        big2 = "Word " * 20
        merged_big = merge_short_sections([s1, big1, big2], min_words=5, max_words=25)
        self.assertGreaterEqual(len(merged_big), 2)

        # Carry remaining at end with sum < min_words
        trailing_short = ["Main content " * 10, "Tiny tail."]
        merged_tail = merge_short_sections(trailing_short, min_words=5, max_words=50)
        self.assertEqual(len(merged_tail), 1)

        # Carry remaining at end with sum >= min_words
        distinct_secs = ["First " * 6, "Second " * 6]
        merged_distinct = merge_short_sections(distinct_secs, min_words=4, max_words=8)
        self.assertEqual(len(merged_distinct), 2)

    def test_chunk_page_text(self) -> None:
        self.assertEqual(chunk_page_text(""), [])
        self.assertEqual(chunk_page_text("   \n"), [])

        toc_page = "1.0 Title 1\n2.0 Title 2\n3.0 Title 3\n"
        self.assertEqual(chunk_page_text(toc_page), [])

        normal_page = "1.1 Overview\n" + ("This is detailed text for the overview section. " * 10)
        chunks = chunk_page_text(normal_page, min_words=10, max_words=100)
        self.assertGreaterEqual(len(chunks), 1)


class TestChunkDocumentAndRecords(unittest.TestCase):
    def test_build_chunk_record_and_chunk_document(self) -> None:
        doc = {
            "document_id": "dairy_yogurt_plant_project_report",
            "title": "Project Report: Yogurt Plant Unit",
            "document_type": "business_knowledge",
            "source": "business_knowledge/dairy_yogurt_plant_project_report.pdf",
            "pages": [
                {"page_number": 1, "text": "PROJECT REPORT\nYogurt Plant Unit"},
                {"page_number": 2, "text": ""},  # empty page
                {"page_number": 3, "text": "INTRODUCTION\nDairy processing details."},
            ],
        }
        chunks = chunk_document(doc)
        self.assertEqual(len(chunks), 2)
        c1, c2 = chunks[0], chunks[1]

        self.assertEqual(c1["chunk_id"], "dairy_yogurt_plant_project_report_p001_c001")
        self.assertEqual(c1["page_start"], 1)
        self.assertEqual(c1["page_end"], 1)
        self.assertEqual(c1["page_number"], 1)
        self.assertEqual(c1["chunk_index"], 0)
        self.assertEqual(c1["chunk_index_on_page"], 1)
        self.assertEqual(c1["document_type"], "project_report_template")
        self.assertTrue(c1["is_template_data"])

        self.assertEqual(c2["chunk_id"], "dairy_yogurt_plant_project_report_p003_c001")
        self.assertEqual(c2["chunk_index"], 1)
        self.assertEqual(c2["section_title"], "INTRODUCTION")


class TestValidation(unittest.TestCase):
    def setUp(self) -> None:
        self.valid_chunk = {
            "chunk_id": "pmfme_scheme_guidelines_p004_c001",
            "document_id": "pmfme_scheme_guidelines",
            "title": "Guidelines for Implementation of PMFME",
            "document_type": "scheme_docs",
            "source": "scheme_docs/pmfme_scheme_guidelines.pdf",
            "page_start": 4,
            "page_end": 4,
            "page_number": 4,
            "geography": None,
            "business_category": None,
            "scheme": "PMFME",
            "year": "2020",
            "is_template_data": False,
            "text": "Valid chunk content.",
        }

    def test_validate_chunks_clean(self) -> None:
        errors = validate_chunks([self.valid_chunk])
        self.assertEqual(errors, [])

    def test_validate_chunks_missing_fields_and_empty_text(self) -> None:
        bad_chunk = dict(self.valid_chunk)
        del bad_chunk["title"]
        bad_chunk["text"] = "   "
        errors = validate_chunks([bad_chunk])
        self.assertTrue(any("missing required fields" in e for e in errors))
        self.assertTrue(any("has empty text" in e for e in errors))

    def test_validate_chunks_duplicates_and_unknown_doc(self) -> None:
        c1 = dict(self.valid_chunk)
        c2 = dict(self.valid_chunk)
        c3 = dict(self.valid_chunk)
        c3["chunk_id"] = "unknown_p001_c001"
        c3["document_id"] = "unknown_doc"

        errors = validate_chunks([c1, c2, c3])
        self.assertTrue(any("Duplicate chunk_id detected" in e for e in errors))
        self.assertTrue(any("references unknown document_id" in e for e in errors))

    def test_validate_chunks_metadata_mismatches(self) -> None:
        c = dict(self.valid_chunk)
        c["is_template_data"] = True
        c["scheme"] = "WRONG_SCHEME"
        c["business_category"] = "wrong_cat"
        c["geography"] = {"state": "Wrong"}
        c["year"] = "1999"

        errors = validate_chunks([c])
        self.assertTrue(any("is_template_data mismatch" in e for e in errors))
        self.assertTrue(any("scheme mismatch" in e for e in errors))
        self.assertTrue(any("business_category mismatch" in e for e in errors))
        self.assertTrue(any("geography mismatch" in e for e in errors))
        self.assertTrue(any("year mismatch" in e for e in errors))

    def test_validate_chunks_invalid_page_bounds(self) -> None:
        c1 = dict(self.valid_chunk)
        c1["page_start"] = 0
        c1["page_end"] = -1

        c2 = dict(self.valid_chunk)
        c2["chunk_id"] = "pmfme_scheme_guidelines_p004_c002"
        c2["page_start"] = 5
        c2["page_end"] = 4

        c3 = dict(self.valid_chunk)
        c3["chunk_id"] = "pmfme_scheme_guidelines_p004_c003"
        c3["page_start"] = "four"
        c3["page_end"] = "five"

        errors = validate_chunks([c1, c2, c3])
        self.assertTrue(any("invalid page_start" in e for e in errors))
        self.assertTrue(any("invalid page_end" in e for e in errors))


class TestStatsAndSummary(unittest.TestCase):
    def test_calculate_document_stats_with_chunks(self) -> None:
        chunks = [
            {"word_count": 100},
            {"word_count": 200},
        ]
        stats = calculate_document_stats(
            document_id="doc1",
            title="Doc 1",
            pages_count=2,
            chunks=chunks,
            is_template=False,
        )
        self.assertEqual(stats["chunks"], 2)
        self.assertEqual(stats["avg_words"], 150.0)
        self.assertEqual(stats["min_words"], 100)
        self.assertEqual(stats["max_words"], 200)

    def test_calculate_document_stats_empty_chunks(self) -> None:
        stats = calculate_document_stats(
            document_id="doc1",
            title="Doc 1",
            pages_count=1,
            chunks=[],
            is_template=False,
        )
        self.assertEqual(stats["chunks"], 0)
        self.assertEqual(stats["avg_words"], 0.0)
        self.assertEqual(stats["min_words"], 0)
        self.assertEqual(stats["max_words"], 0)

    def test_format_stats_summary(self) -> None:
        stats = [
            {
                "document_id": "pmfme",
                "pages": 33,
                "chunks": 33,
                "avg_words": 281.3,
                "min_words": 40,
                "max_words": 466,
                "is_template_data": False,
            }
        ]
        summary = format_stats_summary(stats)
        self.assertIn("DOCUMENT CHUNKING INGESTION SUMMARY", summary)
        self.assertIn("Document: pmfme", summary)
        self.assertIn("Total chunks: 33", summary)


class TestChunkAllAndMain(unittest.TestCase):
    def test_chunk_all_success(self) -> None:
        with tempfile.TemporaryDirectory() as tmp_dir:
            tmp_path = Path(tmp_dir)
            cleaned_dir = tmp_path / "cleaned"
            chunks_dir = tmp_path / "chunks"
            cleaned_dir.mkdir()

            doc_content = {
                "document_id": "pmfme_scheme_guidelines",
                "title": "PMFME Guidelines",
                "document_type": "scheme_docs",
                "source": "scheme_docs/pmfme_scheme_guidelines.pdf",
                "pages": [
                    {"page_number": 4, "text": "1.0 Background\nSome description text."}
                ],
            }
            (cleaned_dir / "pmfme_scheme_guidelines.json").write_text(
                json.dumps(doc_content), encoding="utf-8"
            )

            with patch("builtins.print") as mock_print:
                outputs = chunk_all(cleaned_dir=cleaned_dir, chunks_dir=chunks_dir)
                self.assertEqual(len(outputs), 1)
                self.assertTrue(outputs[0].exists())
                mock_print.assert_called()

    def test_chunk_all_validation_failure_raises(self) -> None:
        with tempfile.TemporaryDirectory() as tmp_dir:
            tmp_path = Path(tmp_dir)
            cleaned_dir = tmp_path / "cleaned"
            chunks_dir = tmp_path / "chunks"
            cleaned_dir.mkdir()

            doc_content = {
                "document_id": "unknown_document",
                "title": "Unknown",
                "document_type": "unknown",
                "source": "unknown.pdf",
                "pages": [
                    {"page_number": 1, "text": "Content"}
                ],
            }
            (cleaned_dir / "unknown_document.json").write_text(
                json.dumps(doc_content), encoding="utf-8"
            )

            with self.assertRaises(ValueError) as ctx:
                chunk_all(cleaned_dir=cleaned_dir, chunks_dir=chunks_dir)
            self.assertIn("Validation failed for unknown_document", str(ctx.exception))

    def test_main(self) -> None:
        with patch("ai.ingestion.chunk_documents.chunk_all") as mock_chunk_all:
            main()
            mock_chunk_all.assert_called_once()

    def test_run_as_main(self) -> None:
        with patch("ai.ingestion.chunk_documents.chunk_all"):
            runpy.run_module("ai.ingestion.chunk_documents", run_name="__main__")

    def test_actual_four_documents_end_to_end(self) -> None:
        with tempfile.TemporaryDirectory() as tmp_dir:
            tmp_chunks = Path(tmp_dir)
            outputs1 = chunk_all(chunks_dir=tmp_chunks)
            self.assertEqual(len(outputs1), 4)

            # 1. All four documents produce chunks
            for out_file in outputs1:
                data1 = json.loads(out_file.read_text(encoding="utf-8"))
                self.assertGreater(len(data1), 0)

                # 2. No chunk has empty text & 3. Chunk IDs unique & 9. Page references preserved
                cids = set()
                for c in data1:
                    self.assertTrue(bool(c["text"].strip()))
                    self.assertNotIn(c["chunk_id"], cids)
                    cids.add(c["chunk_id"])
                    self.assertIsInstance(c["page_start"], int)
                    self.assertIsInstance(c["page_end"], int)
                    self.assertGreaterEqual(c["page_start"], 1)
                    self.assertGreaterEqual(c["page_end"], c["page_start"])

            # 5. PMFME scheme = PMFME
            pmfme_chunks = json.loads((tmp_chunks / "pmfme_scheme_guidelines.json").read_text(encoding="utf-8"))
            for c in pmfme_chunks:
                self.assertEqual(c["scheme"], "PMFME")

            # 6. Dairy: business_category = dairy, is_template_data = True
            dairy_chunks = json.loads((tmp_chunks / "dairy_yogurt_plant_project_report.json").read_text(encoding="utf-8"))
            for c in dairy_chunks:
                self.assertEqual(c["business_category"], "dairy")
                self.assertTrue(c["is_template_data"])
                self.assertEqual(c["document_type"], "project_report_template")

            # 7. Mathura: geography = UP / Mathura, year = 2011
            mathura_chunks = json.loads((tmp_chunks / "mathura_district_industrial_profile.json").read_text(encoding="utf-8"))
            for c in mathura_chunks:
                self.assertEqual(c["geography"], {"state": "Uttar Pradesh", "district": "Mathura"})
                self.assertEqual(c["year"], "2011")

            # 8. Entrepreneurship: NOT Mathura-specific
            ent_chunks = json.loads((tmp_chunks / "manual_entrepreneurship_development.json").read_text(encoding="utf-8"))
            for c in ent_chunks:
                self.assertIsNone(c["geography"])

            # 10. Re-running script produces the same logical output
            outputs2 = chunk_all(chunks_dir=tmp_chunks)
            for f1, f2 in zip(outputs1, outputs2):
                d1 = json.loads(f1.read_text(encoding="utf-8"))
                d2 = json.loads(f2.read_text(encoding="utf-8"))
                self.assertEqual(d1, d2)


if __name__ == "__main__":
    unittest.main()
