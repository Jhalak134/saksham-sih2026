# SAKSHAM — AI/RAG & BACKEND ARCHITECTURE STATE

## Pipeline Progress

```
Raw PDFs
    ↓
Extraction                    ✅ already done
    ↓
Cleaning                      ✅ already done
    ↓
Curated metadata              ✅ already done
    ↓
Document chunking             ✅ COMPLETED & VERIFIED (see ai/AGENTS.md)
    ↓
Embeddings / Vector Store     ✅ COMPLETED & VERIFIED (see ai/AGENTS.md)
    ↓
Retrieval                     ✅ COMPLETED & VERIFIED (see ai/AGENTS.md)
    ↓
Intent / Query Parser         ✅ COMPLETED & VERIFIED (see ai/AGENTS.md)
    ↓
Evidence Pack / Grounding     ✅ COMPLETED & VERIFIED (see ai/AGENTS.md)
    ↓
Explanation prompt            ✅ COMPLETED & VERIFIED (see ai/AGENTS.md)
    ↓
AI service                    ✅ COMPLETED & VERIFIED (see ai/AGENTS.md)
    ↓
Main Backend Integration      ✅ COMPLETED & VERIFIED (Task 8B)
    ↓
Frontend Wire-up              ⏳ NEXT TASK (Task 9)
    ↓
Hallucination tests           ❌ future task
```

==================================================

1. FIRST: UNDERSTAND THE EXISTING PROJECT
   ==================================================

Before writing code:

1. Read the root `AGENTS.md`.
2. Read the AI-specific files under `ai/`.
3. Inspect:

   * `ai/ingestion/extract_document.py`
   * `ai/ingestion/clean_documents.py`
   * `ai/knowledge_base/document_metadata.py`
   * `ai/knowledge_base/README.md`
   * `ai/requirements.txt`
   * all existing files under `ai/knowledge_base/cleaned/`
4. If `ai/AGENTS.md` does not exist, create it.
5. Do not assume the existing implementation matches the project plan. Verify it from the code.

The current knowledge base contains four source documents:

1. `pmfme_scheme_guidelines`
2. `dairy_yogurt_plant_project_report`
3. `manual_entrepreneurship_development`
4. `mathura_district_industrial_profile`

Understand the metadata already defined for each document before implementing chunking.

==================================================
2. PROJECT PRINCIPLES YOU MUST PRESERVE
=======================================

SAKSHAM follows this architectural rule:

```
DATA PROVIDES EVIDENCE
DETERMINISTIC ENGINES CALCULATE
AI EXPLAINS
```

The RAG system exists to retrieve reliable source material.

Do NOT introduce an LLM into the chunking process.

Do NOT use an LLM to decide metadata.

Do NOT invent metadata.

Do NOT invent missing document information.

If metadata is not explicitly available from the existing curated metadata system, keep it `None`.

==================================================
3. IMPORTANT DATA-HONESTY RULES
===============================

These rules are mandatory.

### A. Template/reference documents

`dairy_yogurt_plant_project_report` is explicitly marked:

```
is_template_data = True
```

It contains illustrative/example project figures.

Every chunk produced from this document MUST preserve:

```
is_template_data = True
```

Do not remove this field.

Do not convert its example figures into "facts".

Also preserve:

```
document_type = project_report_template
```

where provided by the existing document metadata/extraction pipeline.

### B. Mathura industrial profile

This document contains historical/local information.

Its metadata currently identifies:

```
geography = Uttar Pradesh / Mathura
year = 2011
```

Do not convert this into current-2026 data.

### C. PMFME

The PMFME document is a separate government scheme document.

It is NOT automatically the same thing as SAKSHAM's primary Micro Finance Scheme / Term Loan Scheme described in the project problem statement.

Preserve:

```
scheme = PMFME
```

Do not rename it to another scheme.

### D. Entrepreneurship manual

This is general entrepreneurship knowledge.

Do not incorrectly label it as Mathura-specific.

==================================================
4. IMPLEMENT `chunk_documents.py`
=================================

Implement:

```
ai/ingestion/chunk_documents.py
```

The implementation should read the cleaned JSON files from:

```
ai/knowledge_base/cleaned/
```

and write final chunks to:

```
ai/knowledge_base/chunks/
```

The source PDFs must NEVER be modified.

The cleaned JSON files must NEVER be modified by the chunking process.

Chunking must be independently re-runnable.

==================================================
5. CHUNKING STRATEGY
====================

Do NOT implement naive fixed character slicing such as:

```
text[i:i+1000]
```

unless it is used only as a final safety fallback.

Prefer this hierarchy:

```
document
  ↓
page
  ↓
section/paragraph
  ↓
chunk
```

The goal is to keep each chunk semantically coherent.

A chunk should preferably contain a complete thought, rule, explanation, or small group of closely related paragraphs.

Do not split sentences unnecessarily.

Do not combine unrelated sections just to reach a target size.

==================================================
6. PAGE BOUNDARIES
==================

Preserve page information.

A chunk should preferably remain within a page when possible.

If a single section/paragraph is too large and must cross a page boundary, preserve:

```
page_start
page_end
```

If the existing cleaned structure only provides one page number per text block, inspect its structure and adapt without destroying the existing source information.

Do not invent page numbers.

==================================================
7. CHUNK SIZE
=============

Use a sensible target chunk size appropriate for later embeddings.

A reasonable starting point is approximately:

```
300–800 words
```

with modest overlap only where useful.

Do not blindly force every chunk into the same size.

Very short related paragraphs can be combined.

Very long paragraphs/sections can be split at natural boundaries.

If a hard maximum is needed, use a deterministic fallback that splits on sentence boundaries before character boundaries.

Document the chosen chunking strategy in code/comments or the AI documentation.

==================================================
8. CHUNK OVERLAP
================

Use limited overlap only when it improves context.

Do not create excessive duplicate chunks.

The objective is:

```
enough context for retrieval
+
minimal unnecessary duplication
```

If overlap is implemented, make it deterministic and document the amount/strategy.

==================================================
9. REQUIRED CHUNK METADATA
==========================

Every chunk must preserve enough provenance for future citation and retrieval.

At minimum each chunk should contain:

```
chunk_id
document_id
title
document_type
source
page_start
page_end
geography
business_category
scheme
year
is_template_data
text
```

If useful, also include:

```
section_title
chunk_index
```

Do not add metadata by guessing.

Use the existing `document_metadata.py` as the source of curated metadata.

Do not duplicate a second independent metadata dictionary inside `chunk_documents.py`.

==================================================
10. CHUNK ID
============

Chunk IDs must be:

* deterministic
* unique
* reproducible between runs

For example:

```
pmfme_scheme_guidelines_p007_c003
```

or another similarly clear convention.

Do NOT use random UUIDs for chunk IDs.

If the same input is chunked twice, the same logical chunk should receive the same ID.

==================================================
11. OUTPUT FORMAT
=================

Choose a clean JSON structure that is easy for the future embedding and retrieval stages to consume.

Prefer either:

### Option A — one JSON file per source document

```
ai/knowledge_base/chunks/
    pmfme_scheme_guidelines.json
    dairy_yogurt_plant_project_report.json
    manual_entrepreneurship_development.json
    mathura_district_industrial_profile.json
```

or another structure only if the existing repository clearly requires it.

Each file should contain a list of chunk objects.

Do not create a database or vector store in this task.

==================================================
12. VALIDATION
==============

Add validation to the chunking pipeline.

The script should detect at least:

* missing required chunk fields
* empty chunk text
* duplicate chunk IDs
* chunks pointing to unknown document IDs
* missing curated metadata
* invalid page information
* accidental loss of `is_template_data`

Do not silently ignore these problems.

For serious validation failures, fail clearly.

==================================================
13. GENERATE USEFUL INGESTION STATISTICS
========================================

When the chunking script runs, print a concise summary such as:

```
Document: PMFME
Pages: X
Chunks: Y
Average words/chunk: Z
Min words: ...
Max words: ...
Template data: False
```

Repeat for every document.

Also print:

```
Total documents
Total chunks
```

This will help us manually inspect whether the chunking strategy is reasonable.

==================================================
14. TEST THE ACTUAL FOUR DOCUMENTS
==================================

Do not test only with a tiny artificial string.

Run the implementation against all existing cleaned documents.

Verify:

1. All four documents produce chunks.
2. No chunk has empty text.
3. Chunk IDs are unique.
4. Metadata is preserved.
5. PMFME chunks retain `scheme = PMFME`.
6. Dairy project-report chunks retain:
   business_category = dairy
   is_template_data = True
7. Mathura industrial-profile chunks retain:
   geography = Uttar Pradesh / Mathura
   year = 2011
8. Entrepreneurship chunks do NOT become Mathura-specific.
9. Page references are preserved.
10. Re-running the script produces the same logical output.

==================================================
15. DO NOT IMPLEMENT THESE YET
==============================

This task stops at chunking.

DO NOT implement:

* embeddings
* OpenAI embedding calls
* Chroma
* Pinecone
* Weaviate
* FAISS
* vector database
* retriever
* semantic search
* LLM calls
* parser prompt
* explanation prompt
* AI service
* FastAPI AI endpoints
* financial calculations
* feasibility scoring
* frontend integration
* database integration
* hallucination testing

Those are future tasks.

Do not prematurely build them.

==================================================
16. UPDATE `ai/AGENTS.md`
=========================

At the end of the task, create or update:

```
ai/AGENTS.md
```

This file is the handoff/checkpoint for the next AI agent.

It MUST clearly contain:

# SAKSHAM AI — CURRENT STATE

## Completed

List what is now actually completed, for example:

* PDF extraction verified
* PDF cleaning verified
* curated document metadata verified
* document chunking implemented
* chunk output generated
* chunk validation implemented
* chunking tested against all four current documents

Only list something as completed if you actually verified it.

## Current Files

Explain the role/status of:

```
ai/ingestion/extract_document.py
ai/ingestion/clean_documents.py
ai/ingestion/chunk_documents.py
ai/ingestion/embed_and_store.py
ai/knowledge_base/document_metadata.py
ai/retrieval/retriever.py
ai/prompts/parser_prompt.py
ai/prompts/explanation_prompt.py
ai/service/main.py
ai/tests/
```

Mark unfinished files as:

```
NOT IMPLEMENTED YET
```

Do not pretend they are finished.

## Knowledge Base

List the four current documents and their important metadata distinctions.

Especially mention:

* PMFME = PMFME scheme document
* dairy project report = template/reference data
* entrepreneurship manual = generic knowledge
* Mathura industrial profile = historical/local document

## Next Task

Explicitly state:

```
NEXT TASK: IMPLEMENT EMBEDDINGS AND VECTOR STORE
```

Then explain what the next agent should inspect before coding.

## Important Rules

Repeat the critical architectural rules:

```
Data provides evidence.
Deterministic engines calculate.
AI explains.
```

And:

```
Do not treat template figures as local facts.
Do not treat historical data as current.
Do not treat missing data as zero.
Do not invent metadata.
Preserve source/page provenance.
```

## Verification

Record the exact commands you ran and whether they passed.

For example:

```
python -m ai.ingestion.chunk_documents
```

and relevant tests.

Do not write fake results.

==================================================
17. GIT / FILE SAFETY
=====================

Before changing anything, inspect the working tree.

Do not overwrite unrelated work.

Only modify files necessary for this AI chunking task.

Do not modify:

* frontend/
* backend/
* database files
* project-level business logic
* UI
* non-AI datasets

If there are unrelated uncommitted changes, preserve them.

==================================================
18. FINAL RESPONSE
==================

When finished, report:

1. What you changed.
2. Which files changed.
3. How the chunking strategy works.
4. How template/historical metadata is preserved.
5. How many chunks were generated per document.
6. Validation/test results.
7. Any issues discovered.
8. Exactly what the NEXT AI agent should do.

Do not claim the AI/RAG system is complete.

The only goal of this task is:

```
CLEANED DOCUMENTS → HIGH-QUALITY, METADATA-RICH CHUNKS
```

Stop after this stage is verified.


==================================================
# SAKSHAM — TASK 8B CURRENT STATE & HANDOFF
==================================================

### Task 8B — Main Backend Integration

- **Status**: COMPLETED and VERIFIED.
- **Implementation Completed**:
  - Modernized `AIClient` (`backend/app/clients/ai_client.py`):
    - Replaced outdated legacy stub (`/api/v1/explain` with raw root parameters) with canonical Task 7 client calling `POST /query`.
    - Enforced strict payload format matching `QueryRequest` with bounded query (`max_length=2000`, non-whitespace), language normalization (`en`, `hi`, `hinglish`), top_k clamping (`1..20`), and nested calculations dict.
    - Added zero-PII guarantee: borrower phone/email is strictly excluded from AI payload.
    - Integrated clean response parser mapping `QueryResponse` fields (`explanation`, `recommendation`, `key_points`, `citations`, `limitations`, `warnings`, `grounding_status`, `retrieval_status`, `evidence_available`, `parsed_query`).
    - Added robust deterministic rule-based fallback when AI microservice is offline, times out, or returns HTTP errors, supporting both English and Hindi.
  - Updated Assessment Orchestrator (`backend/app/routers/assess.py`):
    - Passes complete deterministic calculation results (`project_cost`, `loan_amount`, `monthly_emi`, `scheme_name`, `interest_rate`, `tenure_months`, `moratorium_months`, `fit_score`, `rating`, `repayment_burden_category`) to `get_assessment_insights`.
    - Preserves mathematical integrity: AI text is strictly explanatory and NEVER overwrites backend deterministic calculations or fit scores.
    - Populates `ai_insights` with full provenance, citations, limitations, and grounding status.
    - Refactored `_resolve_assessment_village` and `_resolve_assessment_category` to reduce cyclomatic complexity from 22 to 12.
  - Added Direct AI Query Route (`backend/app/routers/ai.py`):
    - Mounted at `POST /api/v1/ai/query` on the main backend.
    - Allows frontend conversational search/chat to query the AI microservice through the main backend gateway without direct browser exposure to the AI microservice.
    - Returns HTTP 503 if AI service is offline rather than fabricating ungrounded citations.
  - Added backend dependency `httpx` to `backend/requirements.txt`.
  - Added test configuration and seed fixtures in `backend/tests/conftest.py`.
  - Added comprehensive test suite in `backend/tests/test_ai_integration.py`.
- **Exact Files Changed**:
  - `backend/app/clients/ai_client.py` (rewritten and modernized)
  - `backend/app/routers/ai.py` (new gateway router)
  - `backend/app/routers/assess.py` (updated assessment pipeline and refactored)
  - `backend/app/main.py` (mounted `ai.router`)
  - `backend/requirements.txt` (added `httpx`)
  - `backend/tests/conftest.py` (test database setup and environment configuration)
  - `backend/tests/test_ai_integration.py` (comprehensive integration tests)
- **Architecture / Data Flow**:
  - Frontend -> Main Backend (port 8000) -> Deterministic Engines (Location, Financial, Feasibility, DB) -> AIClient -> AI Service (port 8001: Parser -> Retriever -> Evidence Pack -> Grounded Explainer) -> Structured Response.
- **AI Endpoint Integration**:
  - `POST {AI_SERVICE_URL}/query` with `QueryRequest` schema.
- **Fallback Behavior**:
  - On connection refusal, timeout, HTTP 4xx/5xx, or malformed responses:
  - Assessment gracefully degrades to deterministic rule-based advice with `available: False`, `source: "deterministic_fallback"`, `grounding_status: "unverified"`, and `citations: []`.
  - Direct conversational queries return HTTP 503 without fabricating fake advice.
- **Configuration Variables**:
  - `AI_SERVICE_URL` (default: `http://localhost:8001`)
  - `AI_REQUEST_TIMEOUT` (default: `5.0`)
  - `AI_DEFAULT_TOP_K` (default: `5`)
- **Tests Run & Results**:
  - Full suite: **217/217 passed** (186 AI tests + 31 backend tests).
  - Backend integration test suite: 17/17 passed.
- **Coverage Results**:
  - `backend/app/clients/ai_client.py`: **100% line coverage** (77/77 statements), **100% branch coverage** (24/24 branches).
  - `backend/app/routers/ai.py`: **100% line coverage** (35/35 statements), **100% branch coverage** (10/10 branches).
  - Combined new/modified integration modules: **100% line and branch coverage**.
- **Complexity Metrics**:
  - Cyclomatic Complexity: Max 12 (`create_assessment`), Max 7 (`AIClient.build_calculations_payload`), Max 4 (`AIQueryRequest.normalize_language`). Average 4.61 (Grade A). All functions < 22.
  - Cognitive Complexity: Max 9 (`create_assessment`), Max 6 (`build_calculations_payload`), Max 3 (`query_ai`). All functions <= 9 (Limit < 22).
  - Halstead Difficulty: `ai_client.py` = 5.33, `ai.py` = 1.88, `assess.py` = 2.95 (Limit < 80).
  - Maintainability Index: Grade A across all files.
  - CRAP Score: Max 12 across methods (Limit < 25).
  - Dead Code: 0 unused items via `vulture`.
  - LOC per file: `ai_client.py` = 303, `ai.py` = 77, `assess.py` = 240, `main.py` = 291 (all < 500).
- **Known Limitations**:
  - Frontend client stubs in `frontend/lib/api-client.ts` are currently mock promises and need to be wired to call the real backend endpoints in Task 9.
  - Live Neon PostgreSQL requires network and `DATABASE_URL` environment variable; offline tests use SQLite.
- **Unresolved Issues**: None. Zero regressions on Tasks 1–7.
- **Next Task**:
  ```
  NEXT TASK: TASK 9 — FRONTEND API CLIENT INTEGRATION & ADVISORY DISPLAY
  ```

