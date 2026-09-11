# SAKSHAM AI — CURRENT STATE

## Completed

The Intent / Query Parser Layer (Task 4) is implemented and thoroughly verified:
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
* Structured schema defined (`ParsedQuery`, `ParsedGeography`, `QueryIntent`, `ParserValidationError`)
* Supported domain fields: `raw_query`, `intent`, `business_category`, `geography` (`village`, `block`, `district`, `state`), `loan_amount` (debt requested), `own_capital` (margin funds), `purpose`, `scheme`, `missing_fields`, `is_ambiguous`
* Safe deterministic normalization: Indian scale notation (rupees, lakhs, crores, thousands, ₹, Rs., INR, Devanagari numerals/terms), geography canonicalization (district, state, village, block), business categories, and schemes
* Multilingual and Hinglish support: handles English, Hindi (Devanagari), and natural Hinglish phrasing
* Distinct loan amount vs margin capital tracking: never conflates borrowing requests with equity contribution
* Explicit missing-field tracking: identifies unsupplied advisory parameters without fabricating default 0, "unknown", or guessed values
* LLM boundary abstraction: mockable/injectable `QueryParser(llm_callable=...)` with markdown code fence stripping and strict JSON schema validation
* Zero-dependency deterministic extractor (`extract_deterministic`) for offline execution and testing
* Retrieval integration bridge: `ParsedQuery.to_retrieval_query()` constructs type-safe `RetrievalQuery` instances for downstream vector search
* 100% line and 100% branch test coverage achieved (`ai/tests/test_parser.py`)
* Code quality gates verified: Cyclomatic Complexity < 22 (implementation max 19, avg 4.7), Halstead Difficulty < 80 (7.45), LOC < 500 per file (112 for parser_prompt.py, 485 for query_parser.py, 481 for test_parser.py), Dead Code = 0

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
* `ai/prompts/explanation_prompt.py` — NOT IMPLEMENTED YET. Future task for generating borrower-friendly explanations.
* `ai/service/main.py` — NOT IMPLEMENTED YET. Future task for AI FastAPI service endpoints.
* `ai/tests/` — PARTIALLY IMPLEMENTED:
  * `ai/tests/test_chunk_documents.py` — COMPLETED (100% line & branch coverage on chunking pipeline).
  * `ai/tests/test_document_metadata.py` — COMPLETED (100% line & branch coverage on document metadata).
  * `ai/tests/test_embed_and_store.py` — COMPLETED (100% line & branch coverage on embedding & vector store pipeline).
  * `ai/tests/test_retriever.py` — COMPLETED (100% line & branch coverage on retrieval layer).
  * `ai/tests/test_parser.py` — COMPLETED (100% line & branch coverage across all 25+ parser requirements).
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

* **Loan Amount vs Own Capital**: Explicitly decoupled borrowing requests (`loan_amount`) from borrower equity/savings (`own_capital`). If a borrower specifies "I have 2 lakh of my own money", `own_capital` is 200,000 and `loan_amount` remains `None`.
* **Single Concern & LOC Ceiling**: Separated prompt definitions (`parser_prompt.py`) from parser engine models and logic (`query_parser.py`) to strictly satisfy the `< 500` lines-of-code requirement while enabling clean re-exports from `parser_prompt.py`.
* **Zero-Dependency Deterministic Fallback**: In addition to an injectable LLM interface, implemented `extract_deterministic(...)` supporting English, Hindi, and Hinglish queries for reliable offline testability and local execution without network dependencies.
* **Evidence Honesty on Missing Values**: Unstated inputs remain `None` and are tracked in `missing_fields` (`["business_category", "geography", "loan_amount", "own_capital", "purpose"]`). No 0, "unknown", or guessed locations/categories are fabricated.
* **Retriever Bridge**: Implemented `ParsedQuery.to_retrieval_query()` which prepares a validated `RetrievalQuery` without directly invoking ChromaDB, preserving clear architectural boundaries.

## Unresolved Issues

* None for Tasks 1, 2, 3, or 4.

## Next Task

```
NEXT TASK: TASK 5 — EVIDENCE PACK / GROUNDING LAYER
```

Task 5 will combine structured retrieval results from Task 3 with provenance, chunk metadata, and source context into a clean, tamper-proof evidence package to safely pass to the future explanation layer.

Before writing code for Task 5, the next agent must:
1. Inspect `ai/retrieval/retriever.py` (`RetrievalResult`, `retrieve`).
2. Inspect `ai/prompts/parser_prompt.py` and `ai/prompts/query_parser.py` (`ParsedQuery`, `to_retrieval_query`).
3. Review grounding criteria to ensure source citations, template flags, and vintages are preserved in evidence packs.

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
# 1. Run full test suite across entire ai package (118 passed)
PYTHONPATH=. /home/divyansh/myenv/bin/pytest ai/tests/ -v

# 2. Run branch coverage for parser module (100% line & branch coverage)
PYTHONPATH=. /home/divyansh/myenv/bin/coverage run --branch -m pytest ai/tests/test_parser.py
/home/divyansh/myenv/bin/coverage report -m --include="ai/prompts/*"

# 3. Check cyclomatic complexity (Limit < 22, Result: Max 19, Avg 4.7)
/home/divyansh/myenv/bin/radon cc ai/prompts/parser_prompt.py ai/prompts/query_parser.py -s -a

# 4. Check Halstead difficulty (Limit < 80, Result: 7.45)
/home/divyansh/myenv/bin/radon hal ai/prompts/parser_prompt.py ai/prompts/query_parser.py

# 5. Check dead code (Limit = 0, Result: 0)
/home/divyansh/myenv/bin/vulture ai/prompts/parser_prompt.py ai/prompts/query_parser.py ai/tests/test_parser.py

# 6. Check line counts (Limit < 500 per file, Result: parser_prompt=112, query_parser=485, test_parser=481)
wc -l ai/prompts/parser_prompt.py ai/prompts/query_parser.py ai/tests/test_parser.py
```

### Verified Pipeline Results
* Full test suite: 118/118 tests passed (29/29 for parser).
* 100% line coverage and 100% branch coverage on both `ai/prompts/parser_prompt.py` and `ai/prompts/query_parser.py`.
* Zero dead code, zero surviving issues.
