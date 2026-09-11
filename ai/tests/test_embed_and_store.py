"""Unit and integration tests for ai/ingestion/embed_and_store.py."""

from __future__ import annotations

import json
from pathlib import Path
import runpy
import shutil
import tempfile
import unittest
from unittest.mock import MagicMock, patch

import chromadb
from chromadb.api.models.Collection import Collection

from ai.ingestion.embed_and_store import (
    CHUNKS_DIR,
    DEFAULT_BATCH_SIZE,
    DEFAULT_COLLECTION_NAME,
    EMBEDDING_DIMENSION,
    REQUIRED_CHUNK_FIELDS,
    DeterministicHashEmbeddingFunction,
    deserialize_chunk_metadata,
    format_indexing_summary,
    get_embedding_function,
    get_or_create_collection,
    get_vector_store_client,
    index_chunks,
    load_all_chunks,
    load_chunks_from_file,
    main,
    query_vector_store,
    rebuild_and_index,
    serialize_chunk_metadata,
    validate_chunk_for_indexing,
)
from ai.knowledge_base.document_metadata import DOCUMENT_METADATA


def make_valid_chunk(
    chunk_id: str = "doc_p001_c001",
    document_id: str = "dairy_yogurt_plant_project_report",
    text: str = "This is a sample chunk text for testing.",
    is_template_data: bool = True,
    business_category: str | None = "dairy",
    scheme: str | None = None,
    year: str | None = None,
    geography: dict[str, str] | None = None,
) -> dict[str, object]:
    return {
        "chunk_id": chunk_id,
        "document_id": document_id,
        "title": "Sample Title",
        "document_type": "project_report_template",
        "source": "business_knowledge/sample.pdf",
        "page_start": 1,
        "page_end": 1,
        "page_number": 1,
        "geography": geography,
        "business_category": business_category,
        "scheme": scheme,
        "year": year,
        "is_template_data": is_template_data,
        "section_title": "Sample Section",
        "chunk_index": 0,
        "chunk_index_on_page": 1,
        "char_count": len(text),
        "word_count": len(text.split()),
        "text": text,
    }


class TestDeterministicEmbeddingFunction(unittest.TestCase):
    def test_embedding_generation_and_dimensions(self) -> None:
        fn = DeterministicHashEmbeddingFunction(dimension=128)
        self.assertEqual(fn.dimension, 128)

        docs = ["hello world", "sample text", ""]
        embeddings = fn(docs)
        self.assertEqual(len(embeddings), 3)
        self.assertEqual(fn.name(), "deterministic_hash")
        self.assertEqual(fn.get_config(), {"dimension": 128})
        fn_rebuilt = DeterministicHashEmbeddingFunction.build_from_config({"dimension": 128})
        self.assertEqual(fn_rebuilt.dimension, 128)
        fn_default_built = DeterministicHashEmbeddingFunction.build_from_config({})
        self.assertEqual(fn_default_built.dimension, EMBEDDING_DIMENSION)
        for emb in embeddings:
            self.assertEqual(len(emb), 128)
            norm = sum(x * x for x in emb) ** 0.5
            self.assertAlmostEqual(norm, 1.0, places=5)

    def test_default_dimension(self) -> None:
        fn = DeterministicHashEmbeddingFunction()
        self.assertEqual(fn.dimension, EMBEDDING_DIMENSION)
        emb = fn(["testing default dimension"])[0]
        self.assertEqual(len(emb), EMBEDDING_DIMENSION)

    def test_reproducibility(self) -> None:
        fn1 = DeterministicHashEmbeddingFunction()
        fn2 = DeterministicHashEmbeddingFunction()
        res1 = fn1(["consistent text"])
        res2 = fn2(["consistent text"])
        self.assertEqual(len(res1), len(res2))
        for v1, v2 in zip(res1[0], res2[0]):
            self.assertAlmostEqual(v1, v2, places=6)


class TestGetEmbeddingFunction(unittest.TestCase):
    def test_get_embedding_function_types(self) -> None:
        fn_default = get_embedding_function("default")
        self.assertIsNotNone(fn_default)

        fn_onnx = get_embedding_function("onnx")
        self.assertIsNotNone(fn_onnx)

        fn_hash = get_embedding_function("deterministic_hash")
        self.assertIsInstance(fn_hash, DeterministicHashEmbeddingFunction)

        fn_test = get_embedding_function("test")
        self.assertIsInstance(fn_test, DeterministicHashEmbeddingFunction)

    def test_get_embedding_function_invalid(self) -> None:
        with self.assertRaises(ValueError) as ctx:
            get_embedding_function("invalid_choice")
        self.assertIn("Unknown embedding_type 'invalid_choice'", str(ctx.exception))


class TestChunkValidation(unittest.TestCase):
    def test_valid_chunk(self) -> None:
        chunk = make_valid_chunk()
        # Should not raise
        validate_chunk_for_indexing(chunk)
        validate_chunk_for_indexing(chunk, known_document_ids={"dairy_yogurt_plant_project_report"})

    def test_missing_required_fields(self) -> None:
        chunk = make_valid_chunk()
        del chunk["scheme"]
        with self.assertRaises(ValueError) as ctx:
            validate_chunk_for_indexing(chunk)
        self.assertIn("missing required fields", str(ctx.exception))

    def test_empty_chunk_id(self) -> None:
        chunk = make_valid_chunk(chunk_id="   ")
        with self.assertRaises(ValueError) as ctx:
            validate_chunk_for_indexing(chunk)
        self.assertIn("empty chunk_id", str(ctx.exception))

    def test_empty_text(self) -> None:
        chunk = make_valid_chunk(text="   \n  ")
        with self.assertRaises(ValueError) as ctx:
            validate_chunk_for_indexing(chunk)
        self.assertIn("empty text", str(ctx.exception))

    def test_invalid_page_start(self) -> None:
        chunk = make_valid_chunk()
        chunk["page_start"] = 0
        with self.assertRaises(ValueError) as ctx:
            validate_chunk_for_indexing(chunk)
        self.assertIn("invalid page_start", str(ctx.exception))

        chunk["page_start"] = "one"  # type: ignore
        with self.assertRaises(ValueError) as ctx:
            validate_chunk_for_indexing(chunk)
        self.assertIn("invalid page_start", str(ctx.exception))

    def test_invalid_page_end(self) -> None:
        chunk = make_valid_chunk()
        chunk["page_end"] = 0
        with self.assertRaises(ValueError) as ctx:
            validate_chunk_for_indexing(chunk)
        self.assertIn("invalid page_end", str(ctx.exception))

        chunk["page_start"] = 5
        chunk["page_end"] = 4
        with self.assertRaises(ValueError) as ctx:
            validate_chunk_for_indexing(chunk)
        self.assertIn("invalid page_end", str(ctx.exception))

        chunk["page_end"] = "five"  # type: ignore
        with self.assertRaises(ValueError) as ctx:
            validate_chunk_for_indexing(chunk)
        self.assertIn("invalid page_end", str(ctx.exception))

    def test_invalid_is_template_data(self) -> None:
        chunk = make_valid_chunk()
        chunk["is_template_data"] = "yes"  # type: ignore
        with self.assertRaises(ValueError) as ctx:
            validate_chunk_for_indexing(chunk)
        self.assertIn("is_template_data must be a boolean", str(ctx.exception))

    def test_unknown_document_id(self) -> None:
        chunk = make_valid_chunk(document_id="unregistered_doc")
        with self.assertRaises(ValueError) as ctx:
            validate_chunk_for_indexing(chunk, known_document_ids={"known_doc_1"})
        self.assertIn("references unknown document_id: 'unregistered_doc'", str(ctx.exception))


class TestMetadataSerializationAndDeserialization(unittest.TestCase):
    def test_serialization_and_roundtrip_with_nested_geography(self) -> None:
        chunk = make_valid_chunk(
            chunk_id="mathura_p001_c001",
            document_id="mathura_district_industrial_profile",
            geography={"state": "Uttar Pradesh", "district": "Mathura"},
            year="2011",
            is_template_data=False,
            business_category=None,
        )

        serialized = serialize_chunk_metadata(chunk)
        self.assertTrue(serialized["has_geography"])
        self.assertEqual(serialized["geography_state"], "Uttar Pradesh")
        self.assertEqual(serialized["geography_district"], "Mathura")
        self.assertEqual(serialized["year"], "2011")
        self.assertEqual(serialized["business_category"], "")
        self.assertFalse(serialized["is_template_data"])

        deserialized = deserialize_chunk_metadata(serialized)
        self.assertEqual(deserialized["geography"], {"state": "Uttar Pradesh", "district": "Mathura"})
        self.assertEqual(deserialized["year"], "2011")
        self.assertIsNone(deserialized["business_category"])
        self.assertIsNone(deserialized["scheme"])
        self.assertFalse(deserialized["is_template_data"])
        self.assertEqual(deserialized["chunk_id"], "mathura_p001_c001")

    def test_serialization_and_roundtrip_without_geography(self) -> None:
        chunk = make_valid_chunk(
            chunk_id="pmfme_p001_c001",
            document_id="pmfme_scheme_guidelines",
            geography=None,
            scheme="PMFME",
            year="2020",
            is_template_data=False,
            business_category=None,
        )

        serialized = serialize_chunk_metadata(chunk)
        self.assertFalse(serialized["has_geography"])
        self.assertEqual(serialized["geography"], "")
        self.assertEqual(serialized["scheme"], "PMFME")

        deserialized = deserialize_chunk_metadata(serialized)
        self.assertIsNone(deserialized["geography"])
        self.assertEqual(deserialized["scheme"], "PMFME")
        self.assertEqual(deserialized["year"], "2020")
        self.assertIsNone(deserialized["business_category"])
        self.assertFalse(deserialized["is_template_data"])

    def test_serialization_defaults_when_optional_keys_missing(self) -> None:
        minimal_chunk = {
            "chunk_id": "min_c1",
            "document_id": "min_doc",
            "page_start": 2,
            "page_end": 2,
            "text": "minimal text",
        }
        serialized = serialize_chunk_metadata(minimal_chunk)
        self.assertEqual(serialized["title"], "")
        self.assertEqual(serialized["document_type"], "")
        self.assertEqual(serialized["source"], "")
        self.assertEqual(serialized["page_number"], 2)
        self.assertEqual(serialized["chunk_index"], 0)
        self.assertEqual(serialized["chunk_index_on_page"], 0)
        self.assertEqual(serialized["char_count"], len("minimal text"))
        self.assertEqual(serialized["word_count"], 2)
        self.assertFalse(serialized["is_template_data"])
        self.assertEqual(serialized["section_title"], "")

    def test_deserialization_defaults_when_stored_keys_missing(self) -> None:
        minimal_stored: dict[str, object] = {
            "chunk_id": "stored_c1",
            "document_id": "stored_doc",
        }
        deserialized = deserialize_chunk_metadata(minimal_stored)
        self.assertIsNone(deserialized["geography"])
        self.assertIsNone(deserialized["scheme"])
        self.assertIsNone(deserialized["year"])
        self.assertIsNone(deserialized["business_category"])
        self.assertIsNone(deserialized["section_title"])
        self.assertEqual(deserialized["page_start"], 1)
        self.assertEqual(deserialized["page_end"], 1)
        self.assertEqual(deserialized["page_number"], 1)
        self.assertFalse(deserialized["is_template_data"])


class TestChunkFileLoading(unittest.TestCase):
    def setUp(self) -> None:
        self.temp_dir = Path(tempfile.mkdtemp())

    def tearDown(self) -> None:
        shutil.rmtree(self.temp_dir, ignore_errors=True)

    def test_load_chunks_from_file_valid(self) -> None:
        chunk = make_valid_chunk()
        file_path = self.temp_dir / "sample.json"
        file_path.write_text(json.dumps([chunk]), encoding="utf-8")

        loaded = load_chunks_from_file(file_path)
        self.assertEqual(len(loaded), 1)
        self.assertEqual(loaded[0]["chunk_id"], chunk["chunk_id"])

    def test_load_chunks_from_file_invalid_json_type(self) -> None:
        file_path = self.temp_dir / "invalid.json"
        file_path.write_text(json.dumps({"not": "a list"}), encoding="utf-8")

        with self.assertRaises(ValueError) as ctx:
            load_chunks_from_file(file_path)
        self.assertIn("Expected a JSON list of chunks", str(ctx.exception))

    def test_load_all_chunks_success(self) -> None:
        c1 = make_valid_chunk(chunk_id="c1")
        c2 = make_valid_chunk(chunk_id="c2")
        (self.temp_dir / "doc1.json").write_text(json.dumps([c1]), encoding="utf-8")
        (self.temp_dir / "doc2.json").write_text(json.dumps([c2]), encoding="utf-8")

        loaded = load_all_chunks(self.temp_dir)
        self.assertEqual(len(loaded), 2)
        ids = {c["chunk_id"] for c in loaded}
        self.assertEqual(ids, {"c1", "c2"})

    def test_load_all_chunks_dir_not_found(self) -> None:
        missing_dir = self.temp_dir / "does_not_exist"
        with self.assertRaises(FileNotFoundError):
            load_all_chunks(missing_dir)

    def test_load_all_chunks_empty_dir(self) -> None:
        empty_dir = self.temp_dir / "empty"
        empty_dir.mkdir()
        with self.assertRaises(ValueError) as ctx:
            load_all_chunks(empty_dir)
        self.assertIn("No JSON chunk files found", str(ctx.exception))


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
        # Index all four actual documents in temporary test vector store using deterministic hash
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

        # Verify exact chunk counts per document
        per_doc = stats["per_document_chunks"]
        self.assertEqual(per_doc["dairy_yogurt_plant_project_report"], 9)
        self.assertEqual(per_doc["manual_entrepreneurship_development"], 92)
        self.assertEqual(per_doc["mathura_district_industrial_profile"], 25)
        self.assertEqual(per_doc["pmfme_scheme_guidelines"], 53)

        client = get_vector_store_client(self.temp_dir)
        fn = DeterministicHashEmbeddingFunction()
        coll = get_or_create_collection(client, "test_saksham_knowledge_base", embedding_function=fn)

        # 1. Verify dairy project report metadata
        dairy_hits = query_vector_store(coll, query_text="yogurt plant project", n_results=5, where={"business_category": "dairy"})
        self.assertGreater(len(dairy_hits), 0)
        for hit in dairy_hits:
            self.assertTrue(hit["is_template_data"])
            self.assertEqual(hit["business_category"], "dairy")
            self.assertEqual(hit["document_type"], "project_report_template")

        # 2. Verify Mathura profile metadata
        mathura_hits = query_vector_store(coll, query_text="Mathura industrial", n_results=5, where={"geography_district": "Mathura"})
        self.assertGreater(len(mathura_hits), 0)
        for hit in mathura_hits:
            self.assertFalse(hit["is_template_data"])
            self.assertEqual(hit["year"], "2011")
            self.assertEqual(hit["geography"], {"state": "Uttar Pradesh", "district": "Mathura"})

        # 3. Verify PMFME scheme metadata
        pmfme_hits = query_vector_store(coll, query_text="PMFME guidelines", n_results=5, where={"scheme": "PMFME"})
        self.assertGreater(len(pmfme_hits), 0)
        for hit in pmfme_hits:
            self.assertFalse(hit["is_template_data"])
            self.assertEqual(hit["scheme"], "PMFME")
            self.assertEqual(hit["year"], "2020")
            self.assertIsNone(hit["geography"])

        # 4. Verify Entrepreneurship manual metadata
        manual_hits = query_vector_store(coll, query_text="entrepreneurship development manual", n_results=5, where={"document_id": "manual_entrepreneurship_development"})
        self.assertGreater(len(manual_hits), 0)
        for hit in manual_hits:
            self.assertFalse(hit["is_template_data"])
            self.assertIsNone(hit["geography"])
            self.assertEqual(hit["year"], "2024")
