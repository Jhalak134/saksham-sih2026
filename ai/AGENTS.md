# SAKSHAM AI — CURRENT STATE

## Completed

The Evidence Pack / Grounding Layer (Task 5) is implemented and thoroughly verified:
* PDF extraction verified (`ai/ingestion/extract_documents.py`)
* PDF cleaning verified (`ai/ingestion/clean_documents.py`)
* Curated document metadata verified and schema enhanced (`ai/knowledge_base/document_metadata.py`)
* Document chunking implemented (`ai/ingestion/chunk_documents.py`)
* Chunk output generated for all four source documents (`ai/knowledge_base/chunks/*.json`)
* Chunk validation implemented and enforcing integrity rules (`validate_chunks`)
* Embeddings and persistent vector store implemented (`ai/ingestion/embed_and_store.py`)
* Persistent ChromaDB vector store indexed at `ai/vector_store/chroma/` with 179 chunks
* Retrieval layer implemented (`ai/retrieval/retriever.py`, `ai/retrieval/__init__.py`)
* Intent / Query Parser implemented (`ai/prompts/parser_prompt.py`, `ai/prompts/query_parser.py`)
* Grounding and Evidence Pack Layer implemented (`ai/grounding/evidence_models.py`, `ai/grounding/evidence_pack.py`, `ai/grounding/__init__.py`)
* Structured `EvidenceItem` schema defined: immutable `@dataclass(frozen=True)` preserving `chunk_id`, `document_id`, `title`, `text`, `document_type`, `source`, `page_start`, `page_end`, `geography`, `business_category`, `scheme`, `year`, `is_template_data`, `distance`, `similarity_score`, `classification`, `section_title`, `chunk_index`, and `page_number`
* Structured `EvidencePack` schema defined: encapsulates `query_text`, `structured_query` (`ParsedQuery` / `RetrievalQuery`), `retrieval_status`, `evidence_items`, `result_count`, `evidence_available`, `limitations`, `warnings`, and `provenance_summary`
* Data honesty classification taxonomy implemented (`EvidenceClassification`):
  * `TEMPLATE_REFERENCE`: enforces template status for `dairy_yogurt_plant_project_report` (`is_template_data=True`)
  * `HISTORICAL`: enforces 2011 baseline vintage for `mathura_district_industrial_profile` and strictly rejects 2026 recency conversion
  * `VERIFIED_OBSERVED`: official scheme guidelines (`pmfme_scheme_guidelines`) and generic guidance (`manual_entrepreneurship_development`)
  * `INCOMPLETE_MAPPED`: tracks partial or unmapped evidence
  * `UNAVAILABLE`: explicit state when knowledge-base evidence is absent
* Domain protection rules:
  * Template protection: rejects `dairy_yogurt_plant_project_report` with `is_template_data=False` or non-template classification
  * Historical vintage protection: rejects `mathura_district_industrial_profile` with `year='2026'` or any year other than `'2011'`
  * Scheme isolation: rejects `pmfme_scheme_guidelines` with scheme names other than `'PMFME'`, ensuring guidelines are not conflated with borrower approval
  * Missing value preservation: `None` values for financial amounts, locations, and categories are strictly maintained (never converted to 0, "unknown", or guessed defaults)
* No-match integrity behavior: when retriever returns empty results, creates a valid pack with `evidence_available=False`, `retrieval_status="no_match"`, and explicit limitation stating that absence of retrieved evidence does not imply real-world non-existence
* Validation suite: rejects malformed items, invalid page ranges (`page_end < page_start` or `page_start < 1`), duplicate chunk IDs within a pack, and result-count mismatches
* Deterministic warnings & limitations generation: auto-detects template chunks, 2011 historical baseline, PMFME scheme presence, missing advisory fields, and query ambiguity
* 100% line and 100% branch test coverage achieved (`ai/tests/test_evidence_pack.py`)
* Code quality gates verified: Cyclomatic Complexity < 22 (implementation max 13, avg 4.56), Halstead Difficulty < 80 (5.71 for pack, 6.71 for models), LOC < 500 per file (400 for models, 405 for pack, 33 for init, 488 for tests), Dead Code = 0

## Current Files

* `ai/ingestion/extract_documents.py` — COMPLETED. Extracts PDF page text and technical metadata using pdfplumber.
* `ai/ingestion/clean_documents.py` — COMPLETED. Cleans extracted text, strips repetitive boilerplate headers/footers, and normalizes whitespace.
* `ai/ingestion/chunk_documents.py` — COMPLETED. Implements semantic hierarchy chunking (`document -> page -> section/paragraph -> chunk`), sentence preservation, deterministic chunk IDs, metadata attachment, and validation.
* `ai/ingestion/embed_and_store.py` — COMPLETED. Implements embedding generation (`all-MiniLM-L6-v2` ONNX / hash), persistent ChromaDB storage, metadata serialization/deserialization, chunk validation, idempotent batch upsert, clean rebuild, and statistics reporting.
* `ai/knowledge_base/document_metadata.py` — COMPLETED. Provides curated metadata (`geography`, `business_category`, `scheme`, `year`, `is_template_data`, `document_type`) and metadata coverage validation.
* `ai/retrieval/retriever.py` — COMPLETED. Metadata-aware similarity retriever querying ChromaDB vector store with structured inputs, native `$and` filters, provenance retention, and clean no-match handling.
* `ai/retrieval/__init__.py` — COMPLETED. Package initializer exposing `KnowledgeRetriever`, `RetrievalQuery`, `RetrievalResult`, and `retrieve`.
* `ai/prompts/parser_prompt.py` — COMPLETED. Defines system prompt, strict JSON schema contract, user prompt builder, and module re-exports.
* `ai/prompts/query_parser.py` — COMPLETED. Implements parsing dataclasses, safe normalization routines, missing-field detection, LLM output validation, deterministic extraction, and the `QueryParser` interface.
* `ai/grounding/evidence_models.py` — COMPLETED. Evidence item dataclasses, classification taxonomy, and validation logic.
* `ai/grounding/evidence_pack.py` — COMPLETED. EvidencePack container, pack validation, warnings/limitations generation, factory, and formatting routines.
* `ai/grounding/__init__.py` — COMPLETED. Package initializer re-exporting evidence models, pack builder, and validation routines.
* `ai/prompts/explanation_prompt.py` — NOT IMPLEMENTED YET. Future task for generating grounded borrower explanations.
* `ai/service/main.py` — NOT IMPLEMENTED YET. Future task for AI FastAPI service endpoints.
* `ai/tests/` — PARTIALLY IMPLEMENTED:
  * `ai/tests/test_chunk_documents.py` — COMPLETED (100% line & branch coverage on chunking pipeline).
  * `ai/tests/test_document_metadata.py` — COMPLETED (100% line & branch coverage on document metadata).
  * `ai/tests/test_embed_and_store.py` — COMPLETED (100% line & branch coverage on embedding & vector store pipeline).
  * `ai/tests/test_retriever.py` — COMPLETED (100% line & branch coverage on retrieval layer).
  * `ai/tests/test_parser.py` — COMPLETED (100% line & branch coverage across all 25+ parser requirements).
  * `ai/tests/test_evidence_pack.py` — COMPLETED (100% line & branch coverage on evidence grounding layer).
  * `ai/tests/test_hallucination.py` — NOT IMPLEMENTED YET.

## Knowledge Base

The knowledge base consists of four curated documents with critical metadata distinctions:

1. **`pmfme_scheme_guidelines`**
   * Scheme document: Government guidelines for PM Formalisation of Micro Food Processing Enterprises Scheme.
   * `scheme`: `PMFME` (deliberately NOT conflated with SAKSHAM's primary 90%/10% Micro Finance/Term Loan Scheme).
   * `geography`: `None` (national scheme).
   * `year`: `2020`.
   * `is_template_data`: `False`.

2. **`dairy_yogurt_plant_project_report`**
   * Sector reference report: Pre-feasibility study for a yogurt manufacturing unit.
   * `document_type`: `project_report_template`.
   * `business_category`: `dairy`.
   * `is_template_data`: `True` (figures are illustrative example templates, NOT live market facts).
   * `geography`: `None`.
   * `year`: `None`.

3. **`manual_entrepreneurship_development`**
   * Educational manual: General agribusiness entrepreneurship and business planning handbook from MANAGE.
   * `document_type`: `entrepreneurship`.
   * `geography`: `None` (generic national guidance, NOT Mathura-specific).
   * `year`: `2024`.
   * `is_template_data`: `False`.

4. **`mathura_district_industrial_profile`**
   * Local district profile: MSME-DI Agra industrial profile for Mathura district.
   * `document_type`: `district_knowledge`.
   * `geography`: `{"state": "Uttar Pradesh", "district": "Mathura"}`.
   * `year`: `2011` (Census 2011 baseline; historical vintage, NOT 2026 data).
   * `is_template_data`: `False`.

## Decisions

* **Decomposition for LOC & Complexity Ceiling**: Separated item models, taxonomy, and item validation (`evidence_models.py`) from pack aggregation, pack validation, and formatting (`evidence_pack.py`) to satisfy the `< 500` lines-of-code ceiling while exposing a clean unified API via `ai/grounding/__init__.py`.
* **Immutability of Evidence Items**: Implemented `EvidenceItem` as `@dataclass(frozen=True)` to guarantee that downstream components cannot tamper with retrieved text, scores, or source provenance.
* **Separation of Warnings vs Limitations**: Separated data nature warnings (e.g. illustrative templates, 2011 historical baseline, brief/ambiguous queries) from advisory limitations (e.g. PMFME rules vs borrower eligibility, missing financial/location parameters).
* **Data Honesty in Empty Matches**: Guarded against false negatives by ensuring that when no chunks are retrieved, the pack returns `evidence_available=False` with a clear explanation that lack of retrieved evidence does not imply real-world non-existence.
* **Preservation of Missing Attributes**: Maintained `None` across all unstated fields, preventing zero or "unknown" defaults that could mislead deterministic financial engines or explanation prompts.

## Unresolved Issues

* None for Tasks 1, 2, 3, 4, or 5.

## Next Task

```
NEXT TASK: TASK 6 — GROUNDED EXPLANATION LAYER
```

Task 6 will take the validated `EvidencePack` from Task 5 and generate borrower-friendly, non-technical natural language explanations that are strictly anchored to the provided evidence.

Before writing code for Task 6, the next agent must:
1. Inspect `ai/grounding/evidence_pack.py` (`EvidencePack`, `EvidenceItem`, `format_evidence_pack_summary`).
2. Inspect `ai/grounding/evidence_models.py` (`EvidenceClassification`, `validate_doc_integrity`).
3. Verify that the explanation prompt enforces template disclaimers (for dairy report), vintage notices (for Mathura 2011 data), and non-conflation of PMFME scheme rules with individual loan approval.

## Important Rules

```
Data provides evidence.
Deterministic engines calculate.
AI explains.
```

* Do not treat template figures as local facts (`is_template_data=True` must always be checked).
* Do not treat historical data as current (Mathura data vintage is 2011).
* Do not treat missing data as zero.
* Do not invent metadata or hallucinate scheme terms.
* Preserve source and page provenance (`source`, `page_start`, `page_end`).

## Verification

The following verification commands were executed and passed with zero errors:

```bash
# 1. Run full test suite across entire ai package (139 passed)
PYTHONPATH=. /home/divyansh/myenv/bin/pytest ai/tests/ -v

# 2. Run branch coverage for grounding module (100% line & branch coverage)
PYTHONPATH=. /home/divyansh/myenv/bin/coverage run --branch -m pytest ai/tests/test_evidence_pack.py
/home/divyansh/myenv/bin/coverage report -m --include="ai/grounding/*"

# 3. Check cyclomatic complexity (Limit < 22, Result: Max 13, Avg 4.56)
/home/divyansh/myenv/bin/radon cc ai/grounding/ -s -a

# 4. Check Halstead difficulty (Limit < 80, Result: pack=5.71, models=6.71)
/home/divyansh/myenv/bin/radon hal ai/grounding/

# 5. Check maintainability index (Result: Rank A across all files)
/home/divyansh/myenv/bin/radon mi ai/grounding/ -s

# 6. Check dead code (Limit = 0, Result: 0)
/home/divyansh/myenv/bin/vulture ai/grounding/ ai/tests/test_evidence_pack.py

# 7. Check line counts (Limit < 500 per file, Result: models=400, pack=405, init=33, test_evidence_pack=488)
wc -l ai/grounding/*.py ai/tests/test_evidence_pack.py
```

### Verified Pipeline Results
* Full test suite: 139/139 tests passed (21/21 for evidence pack).
* 100% line coverage and 100% branch coverage across `ai/grounding/evidence_models.py`, `ai/grounding/evidence_pack.py`, and `ai/grounding/__init__.py`.
* Zero dead code, zero surviving issues.
