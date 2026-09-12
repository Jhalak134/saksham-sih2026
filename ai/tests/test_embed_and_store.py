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

