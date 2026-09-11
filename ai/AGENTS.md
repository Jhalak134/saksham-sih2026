# SAKSHAM AI — CURRENT STATE

## Completed

The AI Service / FastAPI Integration (Task 7) is implemented and thoroughly verified:
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
* Grounded Explanation Layer implemented (`ai/prompts/explanation_models.py`, `ai/prompts/explanation_prompt.py`)
* AI Service Request & Response Models implemented (`ai/service/models.py`):
  * `QueryRequest`: bounded natural-language input (`min_length=1`, `max_length=2000`), whitespace rejection, normalized languages (`en`, `hi`, `hinglish`), bounded `top_k` (`1-20`), optional deterministic `calculations`, and strict `extra="forbid"`.
  * `ParsedQueryResponse` & `ParsedGeographyResponse`: faithfully mirrors domain `ParsedQuery` while strictly preserving `None` (no 0 or "unknown" defaults for missing values).
  * `CitationResponse`: clean provenance metadata (`chunk_id`, `document_id`, `source`, `page_start`, `page_end`).
  * `ExplanationDetailResponse`: detailed explanatory metrics (`answer`, `key_points`, `citations`, `limitations`, `warnings`, `evidence_used`, `grounding_status`, `language`).
  * `QueryResponse`: top-level response returning `explanation` text directly, alongside full provenance, structured parsed query, warnings, limitations, and grounding status.
  * `HealthResponse`: reports service status (`ok` / `degraded`), vector store status (`ready` / `unavailable`), chunk count, and service version.
  * `ErrorResponse`: standardized error payload (`error`, `detail`, `error_type`) preventing raw stack traces or internal filesystem leakages.
* AI Service Application & Endpoints implemented (`ai/service/main.py`, `ai/service/__init__.py`):
  * `GET /health`: non-blocking health check querying vector store collection count without expensive re-indexing.
  * `POST /query`: executes the 6-stage pipeline (`API Request -> Query Parser -> Retrieval Query -> Retriever -> Evidence Pack -> Grounded Explanation -> QueryResponse`).
  * `POST /explain`: full alias to `/query` for conversational callers.
  * Exception Handlers:
    * `RequestValidationError` -> 422 (`request_validation_error`)
    * `ParserValidationError` -> 422 (`parser_validation_error`)
    * `ValueError` -> 400 (`value_error`)
    * `RetrievalServiceError` -> 503 (`retrieval_error`)
    * `EvidencePackValidationError` / `EvidenceItemValidationError` -> 500 (`evidence_pack_validation_error`)
    * `ExplanationValidationError` -> 500 (`explanation_validation_error`)
    * Global unhandled `Exception` -> 500 (`internal_server_error`) with sanitized message and zero trace leakage.
  * Dependency Injection: `AIServiceDependencies` container and provider functions (`get_parser`, `get_retriever`, `get_explainer`) compatible with `create_app(deps=...)` and standard FastAPI `app.dependency_overrides`.
* 100% line coverage and 100% branch coverage achieved (`ai/tests/test_service.py`): 25/25 tests passing
* All 186 AI regression tests passing across all completed tasks
* Code quality gates verified:
  * Cognitive Complexity < 22 (implementation max 3, all functions <= 3)
  * Cyclomatic Complexity < 22 (implementation max 4, avg 1.96 Grade A)
  * Halstead Difficulty < 80 (`main.py`=1.80, `models.py`=5.08)
  * Maintainability Index: Rank A across all files
  * LOC < 500 per file (`main.py`=267, `models.py`=214, `__init__.py`=41, `test_service.py`=429)
  * Dead code & redundancy: 0 unused items via `vulture`

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
* `ai/prompts/explanation_models.py` — COMPLETED. Explanatory result models, citation models, schemas, and grounding status enums.
* `ai/prompts/explanation_prompt.py` — COMPLETED. Grounded explanation prompts, parsing, citation validation, deterministic explanation generator, and `GroundedExplainer`.
* `ai/service/models.py` — COMPLETED. Pydantic request and response schemas for FastAPI endpoints.
* `ai/service/main.py` — COMPLETED. FastAPI application factory, routes (`/health`, `/query`, `/explain`), dependency injection, and sanitized exception handlers.
* `ai/service/__init__.py` — COMPLETED. Service package exports.
* `ai/tests/` — PARTIALLY IMPLEMENTED:
  * `ai/tests/test_chunk_documents.py` — COMPLETED (100% line & branch coverage on chunking pipeline).
  * `ai/tests/test_document_metadata.py` — COMPLETED (100% line & branch coverage on document metadata).
  * `ai/tests/test_embed_and_store.py` — COMPLETED (100% line & branch coverage on embedding & vector store pipeline).
  * `ai/tests/test_retriever.py` — COMPLETED (100% line & branch coverage on retrieval layer).
  * `ai/tests/test_parser.py` — COMPLETED (100% line & branch coverage across all 25+ parser requirements).
  * `ai/tests/test_evidence_pack.py` — COMPLETED (100% line & branch coverage on evidence grounding layer).
  * `ai/tests/test_explanation_prompt.py` — COMPLETED (100% line & branch coverage on explanation layer).
  * `ai/tests/test_service.py` — COMPLETED (100% line & branch coverage on AI FastAPI service layer).
  * `ai/tests/test_hallucination.py` — NOT IMPLEMENTED YET. Future task.

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

* **Decomposition for LOC & Complexity Ceiling**: Separated FastAPI models into `models.py` (schemas, validators, converters) and endpoint routing/handlers into `main.py` (pipeline runner, dependency injection, exception handling) to keep both files well below 500 lines.
* **Single Source of Truth for Pipeline**: `run_ai_pipeline` strictly coordinates the domain components (`QueryParser -> KnowledgeRetriever -> create_evidence_pack -> GroundedExplainer`) without creating duplicate parser, retrieval, or explanation logic.
* **Zero Financial Math in Service Layer**: Kept the AI service strictly explanatory. If pre-computed calculations are supplied in `request.calculations`, they are passed as trusted, unalterable context to `GroundedExplainer`.
* **Security & Sanitized Errors**: Global error handlers intercept unexpected exceptions and return clean `ErrorResponse` objects without leaking Python stack traces, filenames, or server filesystem paths.
* **Non-conflation of Filter Matches**: Maintained deterministic `no_match` response when specific metadata filters (e.g. `business_category='dairy'` + `geography_district='Mathura'`) do not intersect in the curated knowledge base, communicating insufficient evidence rather than false real-world non-existence.
* **Test Isolation via Dependency Injection**: Supported both `AIServiceDependencies` container injection and FastAPI `app.dependency_overrides` to ensure 100% offline, deterministic testing with zero live LLM or network dependencies.

## Unresolved Issues

* None for Tasks 1, 2, 3, 4, 5, 6, or 7.

## Next Task

```
NEXT TASK: TASK 8 — MAIN BACKEND INTEGRATION
```

Task 8 will connect the independently verified AI service (`ai/service/main.py`) to the main SAKSHAM backend (`backend/`), routing borrower inquiries to the AI service while keeping deterministic financial and recommendation engines separate.

Before writing code for Task 8, the next agent must:
1. Inspect `ai/service/main.py` and `ai/service/models.py`.
2. Inspect `backend/` routes and API contracts to understand existing backend communication patterns.
3. Ensure the main backend calls the AI service via HTTP or ASGI mounting without moving financial calculations into the AI layer.

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

The following verification commands and checks were executed:

```bash
# 1. Full regression test suite across entire ai package (186 passed)
PYTHONPATH=. /home/divyansh/myenv/bin/pytest ai/tests/ -v

# 2. Branch coverage for service module (100% line & branch coverage)
PYTHONPATH=. /home/divyansh/myenv/bin/coverage run --branch -m pytest ai/tests/test_service.py
/home/divyansh/myenv/bin/coverage report -m --include="ai/service/*"

# 3. Cyclomatic complexity (Limit < 22, Result: Max 4, Avg 1.96 Grade A)
/home/divyansh/myenv/bin/radon cc ai/service/*.py -s -a

# 4. Cognitive complexity (Limit < 22, Result: Max 3 in normalize_language)
# Computed via standard SonarSource Cognitive Complexity AST traversal

# 5. Halstead difficulty (Limit < 80, Result: main.py=1.80, models.py=5.08)
/home/divyansh/myenv/bin/radon hal ai/service/*.py

# 6. Maintainability index (Result: Rank A across all files)
/home/divyansh/myenv/bin/radon mi ai/service/*.py -s

# 7. Dead code & redundancy check (Limit = 0, Result: 0 unused items)
/home/divyansh/myenv/bin/vulture --min-confidence 70 ai/service/ ai/tests/test_service.py

# 8. Lines of code (Limit < 500 per file, Result: models=214, main=267, init=41, test_service=429)
wc -l ai/service/*.py ai/tests/test_service.py
```

### Verified Pipeline Results
* **Full test suite**: 186/186 tests passed (25/25 for service layer).
* **Line & Branch coverage**: 100% line coverage (159/159 statements) and 100% branch coverage (16/16 branches) across `ai/service/models.py`, `ai/service/main.py`, and `ai/service/__init__.py`.
* **Cognitive Complexity**: Max function cognitive complexity is 3 (in `normalize_language`), well below the limit of 22. Zero violations.
* **Cyclomatic Complexity**: Max cyclomatic complexity is 4, average is 1.96 (Grade A). Zero violations.
* **Halstead Difficulty**: 1.80 for `main.py` and 5.08 for `models.py` (limit < 80).
* **CRAP Analysis**: Evaluated with `CRAP(m) = CC^2 * (1 - cov)^3 + CC`. Given 100% test coverage (`cov = 1.0`), the uncoverage term drops to 0, yielding `CRAP(m) = CC(m)`. Max CRAP across all functions is 4 (well below the limit of 25). Note: no standalone third-party CRAP CLI binary is configured in the virtual environment.
* **Mutation Testing**: Automated mutation testing tooling (`mutmut` / `cosmic-ray`) is not configured in the project environment and therefore could not be run.
* **Redundancy / Duplication**: Verified 0 unused/dead items via `vulture`. Verified 0 duplicate blocks between implementation modules.
* **Data-Honesty Review**: Re-verified that unstated query parameters remain `None` (no 0 or "unknown" defaults), template disclaimers are preserved in output, and historical Mathura vintage is honored.
* **Zero surviving issues**: Clean working tree and fully reproducible offline verification.
