# SAKSHAM AI — CURRENT STATE

## Completed

The Grounded Explanation Layer (Task 6) is implemented and thoroughly verified:
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
* Grounded Explanation Models implemented (`ai/prompts/explanation_models.py`):
  * `GroundingStatus` taxonomy: `grounded`, `insufficient_evidence`, `ungrounded_flagged`, `no_match`
  * `ExplanationCitation` dataclass: provenance tracking with `chunk_id`, `document_id`, `source`, `page_start`, `page_end`
  * `ExplanationResult` dataclass: `answer`, `key_points`, `citations`, `limitations`, `warnings`, `evidence_used`, `grounding_status`, `language`
  * `EXPLANATION_JSON_SCHEMA`: formal JSON schema definition with strict typing and mandatory fields
* Grounded Explanation Layer implemented (`ai/prompts/explanation_prompt.py`):
  * `EXPLANATION_SYSTEM_PROMPT`: 11 non-negotiable architectural mandates enforcing zero hallucination, zero calculations (no computing EMI, margins, or subsidies), strict evidence boundary, prompt injection defense, template disclaimers, 2011 historical baseline, and PMFME scheme boundary
  * Prompt Injection Defense: `<evidence>` blocks encapsulate chunk text as passive untrusted data with structured attributes
  * `build_explanation_user_prompt`: constructs unambiguous prompts from `EvidencePack` with optional pre-calculated deterministic figures and language specification
  * `parse_explanation_response`: validates JSON formatting, parses code blocks, validates citations and `evidence_used` strictly against pack chunks, and verifies grounding consistency (e.g. rejects `grounded` if pack has no evidence)
  * `generate_deterministic_explanation`: deterministic offline generator producing grounded citations and answers for zero-LLM environments and fallback scenarios
  * Multilingual Support: English (`en`), Hindi (`hi`), and Hinglish (`hinglish`) with culturally respectful no-match responses
  * `GroundedExplainer` class: orchestrator accepting mockable/customizable `llm_callable`
  * `explain_evidence`: direct convenience function
* 100% line coverage and 100% branch coverage achieved (`ai/tests/test_explanation_prompt.py`): 22/22 tests passing
* All 160 AI regression tests passing across all completed tasks
* Code quality gates verified:
  * Cognitive Complexity < 22 (implementation max 13, all functions <= 13)
  * Cyclomatic Complexity < 22 (implementation max 11, avg 3.86 Grade A)
  * Halstead Difficulty < 80 (models=1.83, prompt=3.67)
  * LOC < 500 per file (models=175, prompt=423, tests=435)
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
* `ai/service/main.py` — NOT IMPLEMENTED YET. Next task (Task 7) for AI FastAPI service endpoints.
* `ai/tests/` — PARTIALLY IMPLEMENTED:
  * `ai/tests/test_chunk_documents.py` — COMPLETED (100% line & branch coverage on chunking pipeline).
  * `ai/tests/test_document_metadata.py` — COMPLETED (100% line & branch coverage on document metadata).
  * `ai/tests/test_embed_and_store.py` — COMPLETED (100% line & branch coverage on embedding & vector store pipeline).
  * `ai/tests/test_retriever.py` — COMPLETED (100% line & branch coverage on retrieval layer).
  * `ai/tests/test_parser.py` — COMPLETED (100% line & branch coverage across all 25+ parser requirements).
  * `ai/tests/test_evidence_pack.py` — COMPLETED (100% line & branch coverage on evidence grounding layer).
  * `ai/tests/test_explanation_prompt.py` — COMPLETED (100% line & branch coverage on explanation layer).
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

* **Decomposition for LOC & Complexity Ceiling**: Divided explanation logic into `explanation_models.py` (data structures, serialization, validation errors) and `explanation_prompt.py` (prompts, parser, citation integrity, deterministic fallbacks, orchestrator) to stay well under 500 lines per file.
* **Separation of Circular Imports**: Removed prompt barrel import in `ai/prompts/__init__.py` to maintain direct acyclic dependencies: `ai.grounding` imports `ai.prompts.query_parser`, and `ai.prompts.explanation_prompt` imports `ai.grounding.evidence_pack`.
* **Zero Financial Math in Prompts**: Strictly forbade the LLM from performing math or recalculating financial outputs (e.g. EMI, project costs, margins). Pre-computed figures must be provided in the user prompt if required and explained, never recomputed.
* **Prompt Injection Defense**: Guarded retrieval outputs within explicit passive `<evidence>` blocks with XML-like metadata attributes to prevent document text from hijacking system instructions.
* **Deterministic Fallback Engine**: Built a full offline explanation generator (`generate_deterministic_explanation`) providing fully grounded answers with accurate citations and provenance tags without invoking external LLM APIs.
* **Mandatory Citation Validation**: Model-generated citations are strictly verified against the `EvidencePack` chunk IDs and document IDs, raising `ExplanationValidationError` if an ungrounded or invented citation is returned.

## Unresolved Issues

* None for Tasks 1, 2, 3, 4, 5, or 6.

## Next Task

```
NEXT TASK: TASK 7 — AI SERVICE / FASTAPI INTEGRATION
```

Task 7 will wrap the end-to-end AI/RAG pipeline (Query Parser -> Retriever -> Evidence Pack -> Grounded Explainer) into FastAPI endpoints in `ai/service/main.py`.

Before writing code for Task 7, the next agent must:
1. Inspect `ai/prompts/query_parser.py` (`QueryParser`, `ParsedQuery`).
2. Inspect `ai/retrieval/retriever.py` (`KnowledgeRetriever`, `RetrievalQuery`).
3. Inspect `ai/grounding/evidence_pack.py` (`create_evidence_pack`, `EvidencePack`).
4. Inspect `ai/prompts/explanation_prompt.py` (`GroundedExplainer`, `explain_evidence`).
5. Ensure FastAPI request/response models honor the data-honesty rules and preserve all metadata provenance.

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
# 1. Full regression test suite across entire ai package (160 passed)
PYTHONPATH=. /home/divyansh/myenv/bin/pytest ai/tests/ -v

# 2. Branch coverage for explanation module (100% line & branch coverage)
PYTHONPATH=. /home/divyansh/myenv/bin/coverage run --branch -m pytest ai/tests/test_explanation_prompt.py
/home/divyansh/myenv/bin/coverage report -m --include="ai/prompts/explanation*"

# 3. Cyclomatic complexity (Limit < 22, Result: Max 11, Avg 3.86 Grade A)
/home/divyansh/myenv/bin/radon cc ai/prompts/explanation*.py -s -a

# 4. Cognitive complexity (Limit < 22, Result: Max 13 in build_explanation_user_prompt)
# Computed via standard SonarSource Cognitive Complexity AST traversal

# 5. Halstead difficulty (Limit < 80, Result: models=1.83, prompt=3.67)
/home/divyansh/myenv/bin/radon hal ai/prompts/explanation*.py

# 6. Maintainability index (Result: Rank A across all files)
/home/divyansh/myenv/bin/radon mi ai/prompts/explanation*.py -s

# 7. Dead code & redundancy check (Limit = 0, Result: 0 unused items, 0 duplicate blocks)
/home/divyansh/myenv/bin/vulture ai/prompts/explanation*.py ai/tests/test_explanation_prompt.py

# 8. Lines of code (Limit < 500 per file, Result: models=175, prompt=423, tests=435)
wc -l ai/prompts/explanation_models.py ai/prompts/explanation_prompt.py ai/tests/test_explanation_prompt.py
```

### Verified Pipeline Results
* **Full test suite**: 160/160 tests passed (22/22 for explanation layer).
* **Line & Branch coverage**: 100% line coverage (205/205 statements) and 100% branch coverage (86/86 branches) across `ai/prompts/explanation_models.py` and `ai/prompts/explanation_prompt.py`.
* **Cognitive Complexity**: Max function cognitive complexity is 13 (in `build_explanation_user_prompt`), well below the limit of 22. Zero violations.
* **Cyclomatic Complexity**: Max cyclomatic complexity is 11 (in `build_explanation_user_prompt`), average is 3.86 (Grade A). Zero violations.
* **Halstead Difficulty**: 1.83 for `explanation_models.py` and 3.67 for `explanation_prompt.py` (limit < 80).
* **CRAP Analysis**: Evaluated with `CRAP(m) = CC^2 * (1 - cov)^3 + CC`. Given 100% test coverage (`cov = 1.0`), the uncoverage term drops to 0, yielding `CRAP(m) = CC(m)`. Max CRAP across all functions is 11 (well below the limit of 25). Note: no standalone third-party CRAP CLI binary is configured in the virtual environment.
* **Mutation Testing**: Automated mutation testing tooling (`mutmut` / `cosmic-ray`) is not configured in the project environment and therefore could not be run.
* **Redundancy / Duplication**: Verified 0 unused/dead items via `vulture`. Verified 0 duplicate blocks between implementation modules.
* **Data-Honesty Review**: Re-verified that `dairy_yogurt_plant_project_report` is strictly tagged with template disclaimers, `mathura_district_industrial_profile` retains historical vintage `2011`, and `pmfme_scheme_guidelines` retains scheme isolation.
* **Zero surviving issues**: Clean working tree and fully reproducible offline verification.
