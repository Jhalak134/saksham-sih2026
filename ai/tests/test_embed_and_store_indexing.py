"""Unit and integration tests for vector store indexing, querying, and full-corpus integration."""

from __future__ import annotations

import json
from pathlib import Path
import runpy
import shutil
import tempfile
import unittest
from unittest.mock import patch

import chromadb
from chromadb.api.models.Collection import Collection

from ai.ingestion.embed_and_store import (
    CHUNKS_DIR,
    DeterministicHashEmbeddingFunction,
    format_indexing_summary,
    get_or_create_collection,
    get_vector_store_client,
    index_chunks,
    main,
    query_vector_store,
    rebuild_and_index,
)
from ai.tests.test_embed_and_store import make_valid_chunk


class TestVectorStoreClientAndCollection(unittest.TestCase):
    def setUp(self) -> None:
        self.temp_dir = Path(tempfile.mkdtemp())

    def tearDown(self) -> None:
        shutil.rmtree(self.temp_dir, ignore_errors=True)

    def test_get_vector_store_client_creates_dir(self) -> None:
        store_path = self.temp_dir / "nested" / "chroma"
        client = get_vector_store_client(store_path)
        self.assertIsInstance(client, chromadb.api.ClientAPI)
        self.assertTrue(store_path.exists())

    def test_get_or_create_collection_normal_and_rebuild(self) -> None:
        client = get_vector_store_client(self.temp_dir)
        fn = DeterministicHashEmbeddingFunction()

        # 1. Create first time
        coll = get_or_create_collection(client, "test_coll", embedding_function=fn, rebuild=False)
        self.assertIsInstance(coll, Collection)
        coll.add(ids=["item1"], documents=["text 1"])
        self.assertEqual(coll.count(), 1)

        # 2. Get existing without rebuild
        coll2 = get_or_create_collection(client, "test_coll", embedding_function=fn, rebuild=False)
        self.assertEqual(coll2.count(), 1)

        # 3. Rebuild existing collection (deletes and recreates fresh)
        coll_rebuilt = get_or_create_collection(client, "test_coll", embedding_function=fn, rebuild=True)
        self.assertEqual(coll_rebuilt.count(), 0)

        # 4. Rebuild non-existing collection (exception caught safely)
        coll_fresh = get_or_create_collection(client, "brand_new_coll", embedding_function=fn, rebuild=True)
        self.assertEqual(coll_fresh.count(), 0)


class TestIndexingAndIdempotency(unittest.TestCase):
    def setUp(self) -> None:
        self.temp_dir = Path(tempfile.mkdtemp())
        self.client = get_vector_store_client(self.temp_dir)
        self.fn = DeterministicHashEmbeddingFunction()
        self.collection = get_or_create_collection(
            self.client,
            "test_indexing",
            embedding_function=self.fn,
            rebuild=True,
        )

    def tearDown(self) -> None:
        shutil.rmtree(self.temp_dir, ignore_errors=True)

    def test_batch_size_validation(self) -> None:
        with self.assertRaises(ValueError) as ctx:
            index_chunks([], self.collection, batch_size=0)
        self.assertIn("batch_size must be positive", str(ctx.exception))

    def test_indexing_success_and_idempotence(self) -> None:
        c1 = make_valid_chunk(chunk_id="c1", document_id="dairy_yogurt_plant_project_report", text="dairy 1")
        c2 = make_valid_chunk(chunk_id="c2", document_id="dairy_yogurt_plant_project_report", text="dairy 2")
        c3 = make_valid_chunk(
            chunk_id="c3",
            document_id="pmfme_scheme_guidelines",
            text="pmfme scheme",
            scheme="PMFME",
            is_template_data=False,
            business_category=None,
        )

        chunks = [c1, c2, c3]
        stats = index_chunks(chunks, self.collection, batch_size=2)
        self.assertEqual(stats["chunks_loaded"], 3)
        self.assertEqual(stats["chunks_indexed"], 3)
        self.assertEqual(stats["collection_count"], 3)
        self.assertEqual(stats["document_count"], 2)
        self.assertEqual(stats["per_document_chunks"]["dairy_yogurt_plant_project_report"], 2)
        self.assertEqual(stats["per_document_chunks"]["pmfme_scheme_guidelines"], 1)

        # Idempotence: indexing again with same chunk IDs should NOT create duplicate records
        stats2 = index_chunks(chunks, self.collection, batch_size=2)
        self.assertEqual(stats2["collection_count"], 3)
        self.assertEqual(self.collection.count(), 3)


class TestQueryVectorStore(unittest.TestCase):
    def setUp(self) -> None:
        self.temp_dir = Path(tempfile.mkdtemp())
        self.client = get_vector_store_client(self.temp_dir)
        self.fn = DeterministicHashEmbeddingFunction()
        self.collection = get_or_create_collection(
            self.client,
            "test_query",
            embedding_function=self.fn,
            rebuild=True,
        )
        c_dairy = make_valid_chunk(
            chunk_id="dairy_c1",
            document_id="dairy_yogurt_plant_project_report",
            text="dairy yogurt machinery cost estimate",
            is_template_data=True,
            business_category="dairy",
        )
        c_mathura = make_valid_chunk(
            chunk_id="mathura_c1",
            document_id="mathura_district_industrial_profile",
            text="mathura district industrial profile msme estate",
            geography={"state": "Uttar Pradesh", "district": "Mathura"},
            year="2011",
            is_template_data=False,
            business_category=None,
        )
        index_chunks([c_dairy, c_mathura], self.collection)

    def tearDown(self) -> None:
        shutil.rmtree(self.temp_dir, ignore_errors=True)

    def test_query_without_filter(self) -> None:
        hits = query_vector_store(self.collection, query_text="dairy machinery", n_results=2)
        self.assertEqual(len(hits), 2)
        self.assertIn("chunk_id", hits[0])
        self.assertIn("text", hits[0])
        self.assertIn("distance", hits[0])

    def test_query_with_where_filter(self) -> None:
        # Filter for template data
        hits_template = query_vector_store(
            self.collection,
            query_text="machinery",
            n_results=2,
            where={"is_template_data": True},
        )
        self.assertEqual(len(hits_template), 1)
        self.assertEqual(hits_template[0]["chunk_id"], "dairy_c1")
        self.assertTrue(hits_template[0]["is_template_data"])

        # Filter for mathura district
        hits_mathura = query_vector_store(
            self.collection,
            query_text="industrial",
            n_results=2,
            where={"geography_district": "Mathura"},
        )
        self.assertEqual(len(hits_mathura), 1)
        self.assertEqual(hits_mathura[0]["chunk_id"], "mathura_c1")
        self.assertEqual(hits_mathura[0]["year"], "2011")
        self.assertEqual(hits_mathura[0]["geography"], {"state": "Uttar Pradesh", "district": "Mathura"})


class TestSummaryFormattingAndRebuild(unittest.TestCase):
    def setUp(self) -> None:
        self.temp_dir = Path(tempfile.mkdtemp())

    def tearDown(self) -> None:
        shutil.rmtree(self.temp_dir, ignore_errors=True)

    def test_format_indexing_summary(self) -> None:
        stats = {
            "document_count": 2,
            "chunks_loaded": 10,
            "chunks_indexed": 10,
            "chunks_skipped": 0,
            "failures": 0,
            "collection_count": 10,
            "per_document_chunks": {
                "dairy_yogurt_plant_project_report": 6,
                "custom_unknown_doc": 4,
            },
        }
        summary = format_indexing_summary(
            stats=stats,
            persist_dir=self.temp_dir,
            collection_name="test_summary",
            embedding_type="test",
        )
        self.assertIn("SAKSHAM VECTOR STORE INGESTION SUMMARY", summary)
        self.assertIn("dairy_yogurt_plant_project_report: 6 chunks (Template: True)", summary)
        self.assertIn("custom_unknown_doc: 4 chunks (Template: False)", summary)
        self.assertIn("Chunks indexed: 10", summary)

    def test_rebuild_and_index_end_to_end(self) -> None:
        chunks_dir = self.temp_dir / "chunks"
        chunks_dir.mkdir()
        c = make_valid_chunk(chunk_id="end_to_end_c1")
        (chunks_dir / "doc.json").write_text(json.dumps([c]), encoding="utf-8")

        store_dir = self.temp_dir / "store"
        stats = rebuild_and_index(
            chunks_dir=chunks_dir,
            persist_directory=store_dir,
            collection_name="test_e2e",
            embedding_type="deterministic_hash",
            batch_size=10,
        )
        self.assertEqual(stats["chunks_indexed"], 1)
        self.assertEqual(stats["collection_count"], 1)

    def test_main_function(self) -> None:
        with patch("ai.ingestion.embed_and_store.rebuild_and_index") as mock_rebuild:
            mock_rebuild.return_value = {"status": "ok"}
            main()
            mock_rebuild.assert_called_once()

    def test_run_as_main(self) -> None:
        store_dir = self.temp_dir / "main_run"
        with patch.dict(
            "os.environ",
            {
                "SAKSHAM_VECTOR_STORE_DIR": str(store_dir),
                "SAKSHAM_EMBEDDING_TYPE": "deterministic_hash",
            },
        ):
            with patch("builtins.print"):
                runpy.run_module("ai.ingestion.embed_and_store", run_name="__main__")
        self.assertTrue(store_dir.exists())


class TestActualFourDocumentsIntegration(unittest.TestCase):
    def setUp(self) -> None:
        self.temp_dir = Path(tempfile.mkdtemp())

    def tearDown(self) -> None:
        shutil.rmtree(self.temp_dir, ignore_errors=True)

    def test_actual_four_documents_indexed_and_verified(self) -> None:
        stats = rebuild_and_index(
            chunks_dir=CHUNKS_DIR,
            persist_directory=self.temp_dir,
            collection_name="test_saksham_knowledge_base",
            embedding_type="deterministic_hash",
            batch_size=64,
        )

        self.assertEqual(stats["document_count"], 4)
        self.assertEqual(stats["chunks_loaded"], 179)
        self.assertEqual(stats["chunks_indexed"], 179)
        self.assertEqual(stats["collection_count"], 179)
        self.assertEqual(stats["failures"], 0)
        self.assertEqual(stats["chunks_skipped"], 0)

        per_doc = stats["per_document_chunks"]
        self.assertEqual(per_doc["dairy_yogurt_plant_project_report"], 9)
        self.assertEqual(per_doc["manual_entrepreneurship_development"], 92)
        self.assertEqual(per_doc["mathura_district_industrial_profile"], 25)
        self.assertEqual(per_doc["pmfme_scheme_guidelines"], 53)

        client = get_vector_store_client(self.temp_dir)
        fn = DeterministicHashEmbeddingFunction()
        coll = get_or_create_collection(client, "test_saksham_knowledge_base", embedding_function=fn)

        dairy_hits = query_vector_store(coll, query_text="yogurt plant project", n_results=5, where={"business_category": "dairy"})
        self.assertGreater(len(dairy_hits), 0)
        for hit in dairy_hits:
            self.assertTrue(hit["is_template_data"])
            self.assertEqual(hit["business_category"], "dairy")
            self.assertEqual(hit["document_type"], "project_report_template")

        mathura_hits = query_vector_store(coll, query_text="Mathura industrial", n_results=5, where={"geography_district": "Mathura"})
        self.assertGreater(len(mathura_hits), 0)
        for hit in mathura_hits:
            self.assertFalse(hit["is_template_data"])
            self.assertEqual(hit["year"], "2011")
            self.assertEqual(hit["geography"], {"state": "Uttar Pradesh", "district": "Mathura"})

        pmfme_hits = query_vector_store(coll, query_text="PMFME guidelines", n_results=5, where={"scheme": "PMFME"})
        self.assertGreater(len(pmfme_hits), 0)
        for hit in pmfme_hits:
            self.assertFalse(hit["is_template_data"])
            self.assertEqual(hit["scheme"], "PMFME")
            self.assertEqual(hit["year"], "2020")
            self.assertIsNone(hit["geography"])

        manual_hits = query_vector_store(coll, query_text="entrepreneurship development manual", n_results=5, where={"document_id": "manual_entrepreneurship_development"})
        self.assertGreater(len(manual_hits), 0)
        for hit in manual_hits:
            self.assertFalse(hit["is_template_data"])
            self.assertIsNone(hit["geography"])
            self.assertEqual(hit["year"], "2024")
