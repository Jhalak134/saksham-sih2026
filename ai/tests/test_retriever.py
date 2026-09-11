"""Unit and integration tests for ai/retrieval/retriever.py."""

from __future__ import annotations

from pathlib import Path
import runpy
import tempfile
import unittest
from unittest.mock import MagicMock, patch

import chromadb

from ai.ingestion.embed_and_store import (
    DeterministicHashEmbeddingFunction,
    VECTOR_STORE_DIR,
    index_chunks,
)
from ai.retrieval.retriever import (
    DEFAULT_TOP_K,
    MAX_TOP_K,
    KnowledgeRetriever,
    RetrievalQuery,
    RetrievalResult,
    _normalize_string_filter,
    _resolve_geography,
    _validate_query_text,
    _validate_top_k,
    build_chroma_filter,
    format_retrieval_summary,
    get_default_retriever,
    main,
    reset_default_retriever,
    retrieve,
)


def _make_chunk(
    chunk_id: str,
    doc_id: str,
    text: str,
    is_template: bool = False,
    cat: str | None = None,
    dist: str | None = None,
    scheme: str | None = None,
    doc_type: str = "general",
    year: str | None = None,
) -> dict[str, object]:
    geo = {"state": "Uttar Pradesh", "district": dist} if dist else None
    return {
        "chunk_id": chunk_id,
        "document_id": doc_id,
        "title": "Title " + doc_id,
        "document_type": doc_type,
        "source": "knowledge_base/" + doc_id + ".pdf",
        "page_start": 1,
        "page_end": 2,
        "page_number": 1,
        "geography": geo,
        "business_category": cat,
        "scheme": scheme,
        "year": year,
        "is_template_data": is_template,
        "section_title": "Section",
        "chunk_index": 0,
        "chunk_index_on_page": 1,
        "char_count": len(text),
        "word_count": len(text.split()),
        "text": text,
    }


class TestQueryValidation(unittest.TestCase):
    def test_validate_query_text_valid_and_invalid(self) -> None:
        self.assertEqual(_validate_query_text("  valid text  "), "valid text")
        with self.assertRaises(TypeError):
            _validate_query_text(123)
        with self.assertRaises(ValueError):
            _validate_query_text("   ")

    def test_validate_top_k_valid_and_invalid(self) -> None:
        self.assertEqual(_validate_top_k(10), 10)
        with self.assertRaises(TypeError):
            _validate_top_k(True)  # bool is not int
        with self.assertRaises(TypeError):
            _validate_top_k("5")
        with self.assertRaises(ValueError):
            _validate_top_k(0)
        with self.assertRaises(ValueError):
            _validate_top_k(MAX_TOP_K + 1)

    def test_normalize_string_filter(self) -> None:
        self.assertIsNone(_normalize_string_filter("scheme", None))
        with self.assertRaises(TypeError):
            _normalize_string_filter("scheme", 99)
        with self.assertRaises(ValueError):
            _normalize_string_filter("scheme", "  ")
        self.assertEqual(_normalize_string_filter("scheme", "pmfme"), "PMFME")
        self.assertEqual(_normalize_string_filter("business_category", "Dairy"), "dairy")
        self.assertEqual(_normalize_string_filter("geography_district", "mathura"), "Mathura")
        self.assertEqual(_normalize_string_filter("geography_state", "up"), "Uttar Pradesh")
        self.assertEqual(_normalize_string_filter("geography_state", "Uttar Pradesh"), "Uttar Pradesh")
        self.assertEqual(_normalize_string_filter("other", "custom_val"), "custom_val")

    def test_resolve_geography(self) -> None:
        # None geo
        self.assertEqual(_resolve_geography(None, "Mathura", "UP"), ("Mathura", "Uttar Pradesh"))
        # Str geo
        self.assertEqual(_resolve_geography("Mathura", None, None), ("Mathura", None))
        with self.assertRaises(ValueError):
            _resolve_geography("   ", None, None)
        # Dict geo
        d_geo = {"district": "Mathura", "state": "Uttar Pradesh"}
        self.assertEqual(_resolve_geography(d_geo, None, None), ("Mathura", "Uttar Pradesh"))
        # Dict with empty values
        self.assertEqual(_resolve_geography({"district": " ", "state": 123}, None, None), (None, None))
        # Str geo with district already provided
        self.assertEqual(_resolve_geography("Mathura", "PreExistingDistrict", None), ("PreExistingDistrict", None))
        # Dict geo with district and state already provided
        self.assertEqual(
            _resolve_geography({"district": "Mathura", "state": "UP"}, "PreExisting", "PreState"),
            ("PreExisting", "PreState"),
        )
        # Invalid geo type
        with self.assertRaises(TypeError):
            _resolve_geography(12345, None, None)

    def test_retrieval_query_construction_and_methods(self) -> None:
        q = RetrievalQuery(
            query_text="food subsidy",
            scheme="pmfme",
            geography={"district": "mathura"},
            is_template_data=False,
            top_k=3,
        )
        self.assertEqual(q.query_text, "food subsidy")
        self.assertEqual(q.scheme, "PMFME")
        self.assertEqual(q.geography_district, "Mathura")
        self.assertFalse(q.is_template_data)
        self.assertEqual(q.top_k, 3)

        d = q.to_dict()
        self.assertEqual(d["scheme"], "PMFME")
        self.assertEqual(d["top_k"], 3)

        q2 = RetrievalQuery.from_dict(d)
        self.assertEqual(q2.query_text, "food subsidy")
        self.assertEqual(q2.scheme, "PMFME")

        with self.assertRaises(TypeError):
            RetrievalQuery.from_dict(["not a dict"])  # type: ignore[arg-type]

        with self.assertRaises(TypeError):
            RetrievalQuery(query_text="hello", is_template_data="not_bool")  # type: ignore[arg-type]


class TestResultAndFilter(unittest.TestCase):
    def test_build_chroma_filter(self) -> None:
        # No filter
        q_empty = RetrievalQuery(query_text="test")
        self.assertIsNone(build_chroma_filter(q_empty))

        # Single filter
        q_single = RetrievalQuery(query_text="test", business_category="dairy")
        self.assertEqual(build_chroma_filter(q_single), {"business_category": "dairy"})

        # Multiple filters
        q_multi = RetrievalQuery(
            query_text="test",
            business_category="dairy",
            geography_district="Mathura",
            geography_state="Uttar Pradesh",
            scheme="PMFME",
            document_type="guidelines",
            is_template_data=True,
        )
        filt = build_chroma_filter(q_multi)
        self.assertIsNotNone(filt)
        self.assertIn("$and", filt)
        self.assertEqual(len(filt["$and"]), 6)

    def test_retrieval_result_from_hit_and_to_dict(self) -> None:
        hit = {
            "chunk_id": "c01",
            "document_id": "d01",
            "title": "Title",
            "text": "sample text",
            "document_type": "doc",
            "source": "src.pdf",
            "page_start": 1,
            "page_end": 2,
            "geography": {"state": "UP"},
            "business_category": "dairy",
            "scheme": "PMFME",
            "year": "2020",
            "is_template_data": True,
            "distance": 0.25,
            "section_title": "Sec",
            "chunk_index": 1,
            "page_number": 1,
        }
        res = RetrievalResult.from_hit(hit)
        self.assertEqual(res.chunk_id, "c01")
        self.assertEqual(res.distance, 0.25)
        self.assertEqual(res.similarity_score, 0.75)
        self.assertTrue(res.is_template_data)

        d = res.to_dict()
        self.assertEqual(d["chunk_id"], "c01")
        self.assertEqual(d["similarity_score"], 0.75)

    def test_format_retrieval_summary(self) -> None:
        q = RetrievalQuery(query_text="test", scheme="PMFME")
        hit = {
            "chunk_id": "c01",
            "document_id": "d01",
            "text": "text",
            "distance": 0.1,
            "page_start": 1,
            "page_end": 1,
        }
        res = [RetrievalResult.from_hit(hit)]
        summary = format_retrieval_summary(q, res)
        self.assertIn("Query: 'test'", summary)
        self.assertIn("Applied filters:", summary)
        self.assertIn("c01", summary)

        q_no_filters = RetrievalQuery(query_text="no filters query")
        summary_no_filt = format_retrieval_summary(q_no_filters, [])
        self.assertNotIn("Applied filters:", summary_no_filt)


class TestKnowledgeRetrieverUnit(unittest.TestCase):
    @classmethod
    def setUpClass(cls) -> None:
        cls.tmp_dir = tempfile.TemporaryDirectory()
        client = chromadb.PersistentClient(path=cls.tmp_dir.name)
        emb_fn = DeterministicHashEmbeddingFunction()
        cls.col = client.create_collection("test_retrieval_col", embedding_function=emb_fn)

        chunks = [
            _make_chunk("c1", "doc1", "dairy farming and milk processing unit", is_template=True, cat="dairy"),
            _make_chunk("c2", "doc1", "machinery costs for yogurt manufacturing", is_template=True, cat="dairy"),
            _make_chunk("c3", "doc2", "financial support and subsidy guidelines", scheme="PMFME", year="2020"),
            _make_chunk("c4", "doc3", "industrial profile and units in Mathura", dist="Mathura", year="2011"),
            _make_chunk("c5", "doc4", "entrepreneurship development training guide", doc_type="entrepreneurship"),
        ]
        index_chunks(chunks, cls.col)
        cls.retriever = KnowledgeRetriever(collection=cls.col)

    @classmethod
    def tearDownClass(cls) -> None:
        cls.tmp_dir.cleanup()

    def test_basic_similarity_and_ordering(self) -> None:
        results = self.retriever.retrieve("dairy yogurt milk processing", top_k=2)
        self.assertEqual(len(results), 2)
        self.assertLessEqual(results[0].distance, results[1].distance)
        self.assertGreaterEqual(results[0].similarity_score, results[1].similarity_score)

    def test_top_k_behavior(self) -> None:
        res1 = self.retriever.retrieve("dairy", top_k=1)
        self.assertEqual(len(res1), 1)
        res_large = self.retriever.retrieve("dairy", top_k=50)
        self.assertLessEqual(len(res_large), 5)

    def test_business_category_filter(self) -> None:
        results = self.retriever.retrieve("processing", business_category="dairy")
        self.assertTrue(len(results) > 0)
        for r in results:
            self.assertEqual(r.business_category, "dairy")

    def test_geography_filter(self) -> None:
        results = self.retriever.retrieve("industrial profile", geography_district="Mathura")
        self.assertEqual(len(results), 1)
        self.assertEqual(results[0].chunk_id, "c4")
        self.assertEqual(results[0].geography, {"state": "Uttar Pradesh", "district": "Mathura"})

    def test_scheme_filter(self) -> None:
        results = self.retriever.retrieve("financial subsidy", scheme="PMFME")
        self.assertEqual(len(results), 1)
        self.assertEqual(results[0].scheme, "PMFME")

    def test_document_type_filter(self) -> None:
        results = self.retriever.retrieve("guide", document_type="entrepreneurship")
        self.assertEqual(len(results), 1)
        self.assertEqual(results[0].document_type, "entrepreneurship")

    def test_is_template_data_filter(self) -> None:
        res_template = self.retriever.retrieve("processing", is_template_data=True)
        for r in res_template:
            self.assertTrue(r.is_template_data)

        res_non_template = self.retriever.retrieve("processing", is_template_data=False)
        for r in res_non_template:
            self.assertFalse(r.is_template_data)

    def test_multiple_filters_together(self) -> None:
        results = self.retriever.retrieve(
            "costs",
            business_category="dairy",
            is_template_data=True,
            top_k=2,
        )
        self.assertEqual(len(results), 2)
        for r in results:
            self.assertEqual(r.business_category, "dairy")
            self.assertTrue(r.is_template_data)

    def test_optional_filters_omitted(self) -> None:
        results = self.retriever.retrieve("guide")
        self.assertGreater(len(results), 0)

    def test_no_match_behavior(self) -> None:
        results = self.retriever.retrieve("text", business_category="non_existent_category")
        self.assertEqual(results, [])

    def test_repeated_retrieval_consistency(self) -> None:
        q = RetrievalQuery(query_text="machinery", top_k=2)
        res1 = self.retriever.retrieve(q)
        res2 = self.retriever.retrieve(q)
        self.assertEqual([r.chunk_id for r in res1], [r.chunk_id for r in res2])

    def test_coerce_query_variants(self) -> None:
        # Query object + kwargs override
        q = RetrievalQuery(query_text="initial", top_k=2)
        res = self.retriever.retrieve(q, top_k=1)
        self.assertEqual(len(res), 1)

        # Dict input
        res_dict = self.retriever.retrieve({"query_text": "dairy", "top_k": 2})
        self.assertEqual(len(res_dict), 2)

        # Unsupported query type
        with self.assertRaises(TypeError):
            self.retriever.retrieve(12345)  # type: ignore[arg-type]

    def test_retriever_collection_property_and_custom_init(self) -> None:
        self.assertEqual(self.retriever.collection.name, "test_retrieval_col")
        # Init with persist dir
        ret = KnowledgeRetriever(
            persist_directory=self.tmp_dir.name,
            collection_name="test_retrieval_col",
            embedding_function=DeterministicHashEmbeddingFunction(),
        )
        self.assertEqual(ret.collection.name, "test_retrieval_col")


class TestRetrieverGlobalsAndIntegration(unittest.TestCase):
    def tearDown(self) -> None:
        reset_default_retriever()

    def test_get_and_reset_default_retriever(self) -> None:
        reset_default_retriever()
        r1 = get_default_retriever()
        r2 = get_default_retriever()
        self.assertIs(r1, r2)
        reset_default_retriever()

    def test_retrieve_convenience_function(self) -> None:
        mock_retriever = MagicMock()
        mock_retriever.retrieve.return_value = ["mock_result"]
        res = retrieve("query", retriever=mock_retriever, top_k=3)
        self.assertEqual(res, ["mock_result"])
        mock_retriever.retrieve.assert_called_once_with("query", top_k=3)

    def test_actual_knowledge_base_retrieval_and_provenance(self) -> None:
        if not VECTOR_STORE_DIR.exists():
            self.skipTest("Persistent vector store does not exist")

        retriever = get_default_retriever()

        # 1. PMFME query
        pmfme_hits = retriever.retrieve("PMFME subsidy and financial assistance", scheme="PMFME", top_k=2)
        self.assertEqual(len(pmfme_hits), 2)
        for hit in pmfme_hits:
            self.assertEqual(hit.scheme, "PMFME")
            self.assertFalse(hit.is_template_data)
            self.assertEqual(hit.document_id, "pmfme_scheme_guidelines")
            self.assertIn("pmfme_scheme_guidelines", hit.source)
            self.assertGreaterEqual(hit.page_start, 1)

        # 2. Dairy template query
        dairy_hits = retriever.retrieve("yogurt manufacturing plant and machinery", business_category="dairy", top_k=2)
        self.assertEqual(len(dairy_hits), 2)
        for hit in dairy_hits:
            self.assertEqual(hit.business_category, "dairy")
            self.assertTrue(hit.is_template_data)
            self.assertEqual(hit.document_type, "project_report_template")
            self.assertEqual(hit.document_id, "dairy_yogurt_plant_project_report")

        # 3. Mathura district query
        mathura_hits = retriever.retrieve("industrial profile micro small enterprises", geography_district="Mathura", top_k=2)
        self.assertEqual(len(mathura_hits), 2)
        for hit in mathura_hits:
            self.assertEqual(hit.document_id, "mathura_district_industrial_profile")
            self.assertEqual(hit.year, "2011")
            self.assertEqual(hit.geography, {"state": "Uttar Pradesh", "district": "Mathura"})
            self.assertFalse(hit.is_template_data)

        # 4. Entrepreneurship query
        ent_hits = retriever.retrieve("agribusiness entrepreneurship planning", document_type="entrepreneurship", top_k=2)
        self.assertEqual(len(ent_hits), 2)
        for hit in ent_hits:
            self.assertEqual(hit.document_id, "manual_entrepreneurship_development")
            self.assertIsNone(hit.geography)
            self.assertFalse(hit.is_template_data)

    def test_main_and_run_as_main(self) -> None:
        with patch("builtins.print") as mock_print:
            main()
            self.assertTrue(mock_print.called)

        with patch("builtins.print"):
            runpy.run_module("ai.retrieval.retriever", run_name="__main__")


if __name__ == "__main__":
    unittest.main()
