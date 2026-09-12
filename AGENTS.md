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
Frontend Wire-up              ✅ COMPLETED & VERIFIED (Task 9B)
    ↓
Hallucination tests           ⏳ NEXT TASK (Task 10)
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
  Task 9B (Frontend Integration) is completed. Proceed to Task 10.

==================================================
# SAKSHAM — TASK 9B CURRENT STATE & HANDOFF
==================================================

### Task 9B — Live Frontend → Backend → AI/RAG Integration

- **Status**: COMPLETED and VERIFIED.
- **Implementation Completed**:
  - **Environment Configuration**:
    - Created `frontend/.env.example` with `NEXT_PUBLIC_BACKEND_URL=http://localhost:8000`.
  - **Type Contracts & Schema Alignment** (`frontend/lib/api-types.ts`, `frontend/data/reportsData.ts`):
    - Strict, typed contracts matching FastAPI main backend: `AssessmentRequest`, `BackendAssessmentResponse`, `VillageData`, `CategoryData`, `FinancialData`, `FeasibilityData`, `SchemeData`, `AIInsights`, `Citation`, `AssessmentHistoryItem`.
    - Resilient naming supporting both camelCase and snake_case property access for AI insights, citations, and provenance.
    - Added `aiInsights`, `repaymentBurdenCategory`, and `isLiveBackend` fields to `DetailedReport`.
  - **Full Frontend API Client** (`frontend/lib/api-client.ts`):
    - Real `createAssessment`: Submits to `POST /api/v1/assess` and caches result.
    - Real `getAssessmentById`: Returns cached assessment or fetches `GET /api/v1/assess/{id}`.
    - Real `getAssessmentHistory`: Queries `GET /api/v1/assess/history?skip=...&limit=...`.
    - Canonical `mapBackendResponseToDetailedReport`:
      - Normalizes feasibility breakdown scores from backend scale ($0..100$) to UI scale ($0..10$) (e.g. $85 \rightarrow 8.5$).
      - Preserves exact deterministic financial calculations (zero client-side recalculations).
      - Maps `repayment_burden_category` to UI burden badge.
      - Sets `isLiveBackend: true` for live backend assessments.
      - Maps AI insights, grounding status, citations with excerpts and chunk IDs, limitations, and warnings.
  - **Assessment Flow Integration**:
    - `frontend/components/assessment/StepReview.tsx`: Added `isSubmitting` prop, button loading spinner, and disabled state while assessment generates.
    - `frontend/app/(shell)/new-assessment/page.tsx`: Replaced mock router push with async `createAssessment`, navigation to `/assessment/completed?id={id}`, and actionable error alert banner.
    - `frontend/components/assessment/AssessmentCompleted.tsx`: Reads real assessment ID from `useSearchParams()`, dynamically fetches summary details, displays real confidence and fit score, and routes CTA to `/reports/{id}`. Wrapped with `<Suspense>` in `app/(shell)/assessment/completed/page.tsx`.
  - **Dashboard & Advisory Presentation**:
    - `frontend/components/screens/Report.tsx`: Fetches live assessment from backend for non-mock IDs, manages loading spinner and retry error states, and displays a "Live Backend" badge.
    - `frontend/components/dashboard/DashboardTab.tsx`: Added "AI Advisory & Grounded Evidence" section with:
      - Grounding status badge (`🟢 Grounded Evidence` vs `⚙️ Rule-based Advisory (Calculations Verified)`).
      - Full explanation text and advisory highlights bullet list.
      - Source provenance and citations list with document title, page numbers, chunk ID, and italicized excerpt blocks.
      - Document warning badges: Template notice (`⚠️ Template / Model Estimate`) for `dairy_yogurt_plant_project_report` and historical notice (`ℹ️ Mathura Profile (2011 Historical)`) for `mathura_district_industrial_profile`.
      - Advisory Limitations & Scope callout container.
    - `frontend/components/dashboard/FinancialsTab.tsx`: Added `repaymentBurdenCategory` badge in Recommended Structure card header; all figures strictly match backend deterministic values.
    - `frontend/components/screens/MyReports.tsx`: Fetches and merges live backend assessment history with mock reports seamlessly.
  - **Unit & Integration Test Suite** (`frontend/tests/api-client.test.ts`):
    - Comprehensive test coverage for `createAssessment`, `getAssessmentById`, `getAssessmentHistory`, `mapBackendResponseToDetailedReport` (including $0..100 \rightarrow 0..10$ scaling, exact financial preservation, AI citation mapping, and GET fallback), and backward compatibility.
- **Exact Files Changed**:
  - `frontend/.env.example` (new)
  - `frontend/lib/api-types.ts` (new)
  - `frontend/lib/api-client.ts` (updated and verified)
  - `frontend/data/reportsData.ts` (updated)
  - `frontend/components/assessment/StepReview.tsx` (updated)
  - `frontend/app/(shell)/new-assessment/page.tsx` (updated)
  - `frontend/components/assessment/AssessmentCompleted.tsx` (updated)
  - `frontend/app/(shell)/assessment/completed/page.tsx` (updated)
  - `frontend/components/screens/Report.tsx` (updated)
  - `frontend/components/dashboard/DashboardTab.tsx` (updated)
  - `frontend/components/dashboard/FinancialsTab.tsx` (updated)
  - `frontend/components/screens/MyReports.tsx` (updated)
  - `frontend/tests/api-client.test.ts` (updated)
  - `backend/**` (0 files modified - strict invariance preserved)
  - `ai/**` (0 files modified - strict invariance preserved)
- **Quality & Architectural Metrics**:
  - `any` types: **0** across all modified files.
  - `unknown` types unhandled: **0** across all modified files.
  - LOC per file: All files strictly < 500 lines (`api-client.ts` = 429, `api-types.ts` = 157, `DashboardTab.tsx` = 288, `Report.tsx` = 228, `StepReview.tsx` = 135, `AssessmentCompleted.tsx` = 236, `FinancialsTab.tsx` = 201, `MyReports.tsx` = 220).
  - Cyclomatic Complexity: Max 5 across functions.
  - Cognitive Complexity: Max 4 across functions (Limit < 22).
- **Verification & Test Results**:
  - Frontend API test suite: **7/7 test suites passed** (100% success).
  - Python test suite: **217/217 passed** (0 failures, 0 regressions).
  - Live End-to-End Pipeline: Verified live assessment creation (`POST :8000/api/v1/assess` -> AI microservice :8001 -> DB persistence -> `GET :8000/api/v1/assess/{id}` -> UI report adapter).
- **Next Task**:
  ```
  NEXT TASK: TASK 10 — HALLUCINATION TESTS & GROUNDING VERIFICATION
  ```

==================================================
# SAKSHAM — LOCAL RUNTIME SETUP STATUS & HANDOFF
==================================================

### Local Runtime & Dependency Setup

- **Status**: COMPLETED and FULLY VERIFIED.
- **Python Environment**:
  - Environment path: `/home/divyansh/myenv` (Python 3.14.7).
  - Manifest dependencies satisfied: `fastapi`, `uvicorn`, `pydantic`, `sqlalchemy`, `httpx`, `pandas`, `openpyxl`, `chromadb`, `pytest`, `pytest-cov`, `radon`.
  - Python test suite: **217/217 passed** (`PYTHONPATH=. /home/divyansh/myenv/bin/pytest backend/tests/ ai/tests/`).
- **Frontend / Node Environment**:
  - Environment: Node `v26.8.1`, npm `12.0.2`, Next.js `16.3.4` (Turbopack), React 19.
  - Resolved `rss-parser` offline dependency in `frontend/node_modules/rss-parser` and declared in `frontend/package.json`.
  - Configured `frontend/next.config.ts` with `turbopack: { root: path.resolve(__dirname) }` to eliminate workspace lockfile inference warnings.
  - Cleaned stray root package files: removed untracked root `package.json` and reverted root `package-lock.json` to pristine empty commit.
  - Frontend test suite: **35/35 test suites passed (350/350 tests, 100%)** (`npm run test`).
  - Next.js production build: **Passed with 0 errors and 0 warnings** (`npm run build`).
- **Active Local Services & Health**:
  - **Main Backend** (port 8000): FastAPI via Uvicorn. Health: `{"status":"healthy","service":"saksham-backend","version":"1.0.0","database":"connected"}`.
  - **AI / RAG Microservice** (port 8001): FastAPI via Uvicorn. Health: `{"status":"ok","vector_store":"ready","chunk_count":179,"version":"1.0.0"}`.
  - **Frontend** (port 3000): Next.js Turbopack dev server. HTTP 200 on all primary routes (`/`, `/new-assessment`, `/assessment/completed`, `/reports/[id]`, `/dashboard`, `/my-reports`, `/discover`, `/compare`, `/help`).
  - **Database**: SQLite database at `/tmp/saksham_local.db` seeded with 874 villages, 8 categories, 2 schemes.
  - **Vector Store**: ChromaDB at `ai/vector_store/chroma/` loaded with 179 pre-indexed chunks.
- **End-to-End Flow Verification**:
  - Assessment payload: Bera (Mathura), Dairy, Available Capital ₹100,000, Idea: "Small Dairy unit with 2 cows and milk storage", Language: en.
  - Flow: Frontend (`localhost:3000`) -> Backend (`POST :8000/api/v1/assess`) -> LocationResolver (`Bera`) -> FinancialEngine (Project Cost ₹1,000,000, Loan ₹900,000, EMI ₹14,834.86, Term Loan Scheme) -> FeasibilityEngine (Fit Score 75.8, Feasible) -> AIClient (`POST :8001/query`) -> Retriever (5 Chroma chunks) -> Grounded Explainer (citations, template warnings preserved) -> DB Persistence (Assessment #6) -> Frontend UI mapping (`/reports/6`).
- **Code Quality Metrics**:
  - Cyclomatic Complexity: Max 12 (limit < 22).
  - Cognitive Complexity: Max 9 (limit < 22).
  - Halstead Difficulty: Max 5.33 (limit < 80).
  - Maintainability Index: Grade A across all modules.
  - TypeScript types: 0 `any`, 0 unhandled `unknown`.
  - LOC per file: All files < 500 lines.
  - Deterministic calculations: 100% preserved with zero AI modifications.

==================================================
# SAKSHAM — TASK 4 CURRENT STATE & HANDOFF
==================================================

### Task 4 — Complete Assessment Persistence + History Mapping

- **Status**: COMPLETED and VERIFIED.
- **Audit Deficiencies Fixed**:
  - **P1-D (Assessment Persistence)**:
    - Extended `Assessment` model (`backend/app/db/models.py`) with 15 missing analytical, financial, feasibility, and AI explanation fields:
      `rating`, `competitor_count`, `business_idea`, `interest_rate`, `tenure_months`, `moratorium_months`, `monthly_emi`, `total_repayment`, `total_interest`, `estimated_monthly_revenue`, `estimated_monthly_profit`, `repayment_burden_ratio`, `repayment_burden_category`, `feasibility_breakdown` (JSON), `ai_insights` (JSON).
    - Updated `save_assessment` query (`backend/app/db/queries.py`) to atomically persist all financial metrics, feasibility scores, breakdown details, and AI advisory outputs.
    - Updated `POST /api/v1/assess` (`backend/app/routers/assess.py`) to persist all assessment values into the database.
    - Unified serialization helper `_build_assessment_response` used by both `POST /api/v1/assess` and `GET /api/v1/assess/{id}`, guaranteeing 100% field equivalence across creation, browser reload, and backend restarts.
    - Added full backward compatibility for legacy assessment rows where new columns are `NULL`.
  - **P2 (Assessment History Mapping)**:
    - Fixed `GET /api/v1/assess/history` where `category_name` was incorrectly returning `scheme.name`. It now returns `assessment.category.name` with fallback to `"General"`.
- **Exact Files Changed**:
  - `backend/app/db/models.py` (added relationships and 15 persistence columns)
  - `backend/app/db/queries.py` (updated `save_assessment` parameter list and persistence logic)
  - `backend/app/routers/assess.py` (wired full persistence, created modular response builders, fixed history mapping)
  - `backend/tests/test_assessment_persistence.py` (comprehensive 5-test persistence suite)
- **Quality & Architectural Metrics**:
  - Cyclomatic Complexity: Max 14 (`_build_financial_dict`), Max 8 (`create_assessment`, `_build_assessment_response`), Max 6 (`_resolve_assessment_village`, `_resolve_assessment_category`, `_build_village_dict`), Max 5 (`_build_feasibility_dict`, `get_history`). All < 22.
  - Maintainability Index: Grade A across all modified files (`assess.py` = 45.27, `queries.py` = 54.17, `models.py` = 100.0).
  - Lines of Code: All files < 300 lines (`assess.py` = 298, `queries.py` = 281, `models.py` = 170).
- **Verification & Test Results**:
  - Python tests: **234/234 passed** (48 backend tests + 186 AI tests).
  - Frontend tests: **351/351 passed** (35 test suites, 0 regressions).
  - Live E2E round-trip: Verified identical fields on `POST /api/v1/assess` vs `GET /api/v1/assess/{id}`, survived backend restart with 0 diffs.

==================================================
# SAKSHAM — TASK 5 CURRENT STATE & HANDOFF
==================================================

### Task 5 — Connect Frontend Location Search + Global AI Search

- **Status**: COMPLETED and FULLY VERIFIED.
- **Audit Deficiencies Fixed**:
  - **P1-E (Frontend Assessment Location Search)**:
    - Wired `StepLocation.tsx` to live Census village endpoint via `searchLocations(q)` in `frontend/lib/api-client.ts` calling `GET /api/v1/locations?q=<query>`.
    - Integrated race-condition-safe, debounced `useLocationSearch(300)` hook with active request cancellation token.
    - Added comprehensive result rendering displaying village name, block name, district, state, Census ID, and pilot area badge.
    - Handled duplicate village names across blocks (e.g. Nabipur in Chhata vs Mat) by rendering block and Census ID clearly in the suggestion list.
    - Updated `NewAssessmentPage` (`frontend/app/(shell)/new-assessment/page.tsx`) to pass canonical `village_id` and formatted location string to `createAssessment`.
    - Updated `_resolve_assessment_village` in backend (`backend/app/routers/assess.py`) to prioritize `village_id` over ambiguous location strings.
    - Enforced zero silent fallback: errors and empty states are surfaced explicitly to the user without masking backend failures with fake data.
  - **P1-F / Global Search (Header Search → Backend AI Advisory Gateway)**:
    - Connected global search bar in `Header.tsx` to `POST /api/v1/ai/query` on backend (:8000), routing to AI microservice (:8001).
    - Added `queryAI` API client method in `frontend/lib/api-client.ts`.
    - Built accessible `GlobalAISearchModal` (`frontend/components/layout/GlobalAISearchModal.tsx`) providing:
      - Grounding status badge (`🟢 Grounded Evidence` vs `🟡 Partially Grounded` vs `⚪ No Knowledge-Base Match` vs `⚙️ Rule-based Advisory`).
      - Full advisory explanation / summary text.
      - Advisory highlights (key points list with checkmarks).
      - Retrieved Provenance & Citations with template warning badges (`⚠️ Template / Model Estimate`), historical badges (`ℹ️ Mathura Profile (2011 Historical)`), page numbers, chunk IDs, and italicized excerpts.
      - Advisory scope & limitations container.
      - Policy warnings container.
      - Error handling with interactive retry button.
    - Preserved active application language (`en`, `hi`, `hinglish`) without hardcoded translation hacks.
  - **Code Quality & Refactoring**:
    - Extracted `mapBackendResponseToDetailedReport` into dedicated `frontend/lib/report-adapter.ts` (214 LOC) to keep `api-client.ts` at 308 LOC, strictly obeying `LOC < 500`.
- **Exact Files Changed**:
  - `frontend/lib/api-types.ts` (added `VillageLocation`, `AIQueryRequest`, `AIQueryResponse`, `village_id`)
  - `frontend/lib/api-client.ts` (added `searchLocations`, `formatVillageLocation`, `queryAI`, re-exported adapter)
  - `frontend/lib/report-adapter.ts` (new helper module for DetailedReport mapping)
  - `frontend/hooks/useLocationSearch.ts` (wired live API search with debounce and cancellation)
  - `frontend/components/assessment/StepLocation.tsx` (wired live location search, loading, error, and duplicates display)
  - `frontend/app/(shell)/new-assessment/page.tsx` (passed `village_id` and location string to assessment creation)
  - `frontend/components/layout/Header.tsx` (wired functional search submission and modal)
  - `frontend/components/layout/GlobalAISearchModal.tsx` (new grounded AI advisory modal)
  - `backend/app/routers/assess.py` (prioritized `village_id` in `_resolve_assessment_village`)
  - `frontend/tests/StepLocation.test.tsx` (expanded to 15 tests covering live location search and duplicates)
  - `frontend/tests/api-client.test.ts` (expanded to 18 tests covering `searchLocations`, formatting, and `queryAI`)
  - `frontend/tests/HeaderAISearch.test.tsx` (new test suite with 5 tests covering global AI search)
- **Quality Metrics**:
  - TypeScript types: **0 `any`**, **0 unhandled `unknown`**.
  - Lines of Code: All modified files < 450 LOC (`StepLocation.tsx` = 314, `GlobalAISearchModal.tsx` = 317, `Header.tsx` = 239, `api-client.ts` = 308, `report-adapter.ts` = 214, `api-types.ts` = 200, `new-assessment/page.tsx` = 234, `useLocationSearch.ts` = 67).
  - Python Cyclomatic Complexity: Max 14 (`_build_financial_dict`), Max 8 (`create_assessment`), Max 6 (`_resolve_assessment_village`). All < 22.
  - Python Maintainability Index: Grade A (`assess.py` = 45.27).
- **Verification & Test Results**:
  - Frontend test suite: **36/36 test files passed, 365/365 tests passed (100%)**.
  - Next.js production build: **Passed with 0 errors**.
  - Python test suite: **234/234 passed** (48 backend tests + 186 AI tests).
  - Live E2E round-trip: Assessment created with Bera (ID 123912), Dairy, ₹100,000 -> persisted Assessment #20 -> `GET /api/v1/assess/20` returns 100% matching payload (`diff -u` exit code 0).
  - Live Global AI search queries tested on port 8000:
    - Query 1 ("What dairy business opportunities are relevant around Bera?"): HTTP 200, Grounded Evidence, 5 citations.
    - Query 2 ("PMFME dairy scheme"): HTTP 200, No Knowledge-Base Match, 0 citations, limitations noted.
    - Query 3 ("Bera me dairy shuru karne ke liye kitna loan milega?"): HTTP 200, Hindi language query successfully processed.

==================================================
# SAKSHAM — TASK 6 CURRENT STATE & HANDOFF
==================================================

### Task 6 — Connect Schemes + Location Insights to Real Backend Data

- **Status**: COMPLETED and VERIFIED.
- **Audit Deficiencies Fixed**:
  - **Schemes Integration**:
    - Replaced static scheme lists with live data from `GET /api/v1/schemes` (`listSchemes()`).
    - Connected interactive EMI calculator to `POST /api/v1/schemes/calculate-emi` (`calculateSchemeEMI(...)`).
    - Connected margin matcher to `POST /api/v1/schemes/match` (`matchSchemeForCost(...)`).
    - Modularized `SchemesTab.tsx` by extracting `SchemeMarginMatcher.tsx` and `SchemeEmiCalculator.tsx` to maintain LOC < 250 across all files.
  - **Location Insights Integration**:
    - Wired `MarketTab.tsx` to fetch real regional demand indicators and category trends via `getInsights(location)` calling `GET /api/v1/insights/{location}`.
    - Preserved honest labeling: marked growth percentages as `Observed Regional Indicator` with Census 2011 demographic baseline.
  - **Zero Silent Fallback**:
    - Surfaced clear error banners with interactive retry buttons on backend failure instead of quietly displaying fabricated static data.
- **Exact Files Changed**:
  - `frontend/components/dashboard/SchemesTab.tsx` (connected live schemes + interactive tools)
  - `frontend/components/dashboard/SchemeMarginMatcher.tsx` (new modular component)
  - `frontend/components/dashboard/SchemeEmiCalculator.tsx` (new modular component)
  - `frontend/components/dashboard/MarketTab.tsx` (connected live regional insights)
  - `frontend/lib/api-client.ts` (added schemes and insights client methods)
  - `frontend/tests/schemes-integration.test.tsx` (10 tests)
  - `frontend/tests/insights-integration.test.tsx` (10 tests)
- **Verification & Test Results**:
  - Frontend test suites: 38/38 passed (385/385 tests).
  - Python test suite: 234/234 passed.

==================================================
# SAKSHAM — TASK 7 CURRENT STATE & HANDOFF
==================================================

### Task 7 — Connect Discover to Real Backend Data

- **Status**: COMPLETED and FULLY VERIFIED.
- **Audit Deficiencies Fixed**:
  - **Discover State Opportunities & Pilot Insights Bar** (`frontend/components/discover/StateInsightsBar.tsx`):
    - Replaced hardcoded opportunity metrics with live backend data from `GET /api/v1/insights/{location}` and `GET /api/v1/schemes`.
    - Shows top regional growth categories with verified `+{trend}%` badges and seasonality indicators.
    - Shows official concessional credit schemes (`Micro Finance Scheme`, `Term Loan Scheme`, plus PMFME reference).
    - Displays `874 micro locations` with explicit `Census 2011 Baseline (Mathura)` label.
    - Strict Data Honesty: Provenance notice explicitly clarifies demographic figures are Census 2011 baseline and category growth percentages are regional sample indicators.
    - Zero Silent Mock Fallback: Network/backend errors display an explicit error alert with a functional "Retry" button (`RefreshCw`).
    - Non-Pilot States: Non-UP states display a static reference profile with a prominent "Coming Soon" badge without calling the backend.
  - **Discover Categories & Market Insights** (`frontend/components/discover/ArticleCategorySection.tsx`):
    - Added `selectedDistrict?: string | null` prop to coordinate with district-level map drilldown.
    - Replaced static trend percentages with live trends from `getInsights(targetLocation)`.
    - All 8 business categories in the 4x2 grid update their trend pills (e.g. Dairy `+34%`, Food Processing `+28%`, Logistics `+24%`, Textiles `+21%`) with a `Verified Indicators` header badge.
    - Category Detail View (View A) displays:
      - Live growth trend (`+{trend}% YoY in {stateName}`) with `Live Regional Indicator` badge.
      - Official government credit schemes mapped to the category.
      - Honest provenance labels: Target capital benchmark labeled `(Reference Benchmark Range)` and profit margin labeled `(Model Estimate)`.
    - Zero Silent Mock Fallback: Backend error surfaces an error alert with an interactive "Retry" button.
  - **Discover Screen Layout & Coordination** (`frontend/components/screens/Discover.tsx`):
    - Coordinates 3-level map drilldown (`India Map` -> `UP Districts Map` -> `Mathura District MapLibre OSM GeoJSON`) with `ArticleCategorySection` and `StateInsightsBar`.
    - Preserves all map visual styling, SVG paths, MapLibre OSM tiles, and layout integrity.
- **Exact Files Changed**:
  - `frontend/components/discover/StateInsightsBar.tsx` (290 LOC, LOC < 500)
  - `frontend/components/discover/ArticleCategorySection.tsx` (377 LOC, LOC < 500)
  - `frontend/components/screens/Discover.tsx` (107 LOC, LOC < 500)
  - `frontend/tests/discover-integration.test.tsx` (440 LOC, 13 comprehensive tests)
- **Quality & Architectural Metrics**:
  - TypeScript: **0 `any`**, **0 unhandled `unknown`**, `tsc --noEmit` passed with 0 errors.
  - Lines of Code: All modified files < 400 lines (StateInsightsBar: 290, ArticleCategorySection: 377, Discover: 107).
  - Test Coverage on modified components:
    - `ArticleCategorySection.tsx`: 95.4% statements, 90.32% branches, 95% functions, 97.53% lines.
    - `StateInsightsBar.tsx`: 96.36% statements, 91.78% branches, 92.3% functions, 98.07% lines.
    - `Discover.tsx`: 95.83% statements, 85.71% branches, 80% functions, 95.83% lines.
  - No frontend financial, feasibility, or opportunity calculations invented.
- **Verification & Test Results**:
  - Frontend test suite: **39/39 test files passed, 398/398 tests passed (100%)**.
  - Python test suite: **234/234 passed** (48 backend tests + 186 AI tests).
  - Next.js production build: **Passed with 0 errors** (`npm run build`).
  - Assessment Regression: Verified `POST /api/v1/assess` and `GET /api/v1/assess/{id}` with Bera, Dairy, ₹10,000 margin capital -> Fit Score 73.2, Micro Finance Scheme, EMI ₹2,985.64, 100% field equivalence.
- **Next Task**:
  ```
  NEXT TASK: TASK 8 — COMPARE FEATURE (COMPLETED)
  ```

==================================================
# SAKSHAM — TASK 8 CURRENT STATE & HANDOFF
==================================================

### Task 8 — Compare Feature: Architecture Audit + Live Data Integration

- **Status**: COMPLETED and FULLY VERIFIED.
- **Architecture Audit & Decision**:
  - Audited all frontend Compare components, backend routers (`assess.py`, `schemes.py`, `insights.py`), database models, and deterministic engines.
  - **Decision: Existing APIs are completely sufficient.** No new backend comparison endpoint was required.
  - Persistence and query endpoints (`GET /api/v1/assess/{id}`, `GET /api/v1/assess/history`, `GET /api/v1/schemes`, `GET /api/v1/insights/{location}`) already provide all necessary fields (fit score, rating, margin, project cost, loan amount, monthly EMI, total interest, profit, repayment burden, 4-pillar feasibility breakdown, OSM competitor count, AI grounding status).
  - Side-by-side comparison uses `Promise.all([getAssessmentById(id1), getAssessmentById(id2)])` without duplicating backend financial or feasibility calculations on the client.
- **Implementation Completed**:
  - **Mode A: Opportunities Comparison** (`frontend/components/compare/CompareCard.tsx`, `TrendComparisonChart.tsx`):
    - Fetches live regional insights and category demand trends via `getInsights('Uttar Pradesh')`.
    - Fetches official concessional credit schemes via `getSchemes()`.
    - Live trend growth indicators with explicit `Observed Regional Indicator` labeling and sparklines.
    - Official government credit scheme terms (`{scheme.name} • {interest_rate}% p.a. • Up to ₹{max_loan_amount}`).
    - Dynamic budget fit evaluated against official 10% promoter contribution rule.
    - Typical setup cost labeled with data honesty notice `(Reference Benchmark Range)`.
    - Interactive 12-month trend comparison chart with smooth SVG cubic Bezier paths, area gradients, and interactive hover tooltip.
  - **Mode B: Past Assessments Comparison** (`frontend/components/compare/CompareAssessmentView.tsx`, `CompareAssessmentCard.tsx`):
    - Reads assessment IDs from URL search params (`?a=id1&a=id2`) or defaults to latest 2 from history.
    - Slot 0 and Slot 1 dropdown selectors allow switching assessments dynamically.
    - Displays authoritative persisted metrics verbatim:
      - Census 2011 baseline village demographics (Name, Block, District).
      - Feasibility fit score, rating badge (`Highly Feasible`, `Feasible`, `Moderate`, `Low Potential`), and confidence.
      - Exact financial structure: Promoter margin, project cost, concessional loan, monthly EMI, profit, and repayment burden.
      - Feasibility breakdown (Market Opportunity, Competition, Capital Fit, Infrastructure).
      - OSM mapped competitor count.
      - AI advisory grounding status (`🟢 Grounded Evidence` vs `⚪ Rule-based`).
    - Provenance and mathematical integrity notice.
  - **Compare Screen Coordination & State Management** (`frontend/components/compare/CompareScreen.tsx`):
    - Mode switcher tabs: `Opportunities` vs `Past Assessments (count)`.
    - Category picker when comparison is cleared, supporting single or multi-selection with reset to default.
    - Synchronizes sidebar badge with compare count.
    - Mobile quick search and capital link.
    - **Zero Silent Mock Fallback**: Backend errors display clear alert banners with interactive "Retry" buttons.
- **Exact Files Changed**:
  - `frontend/lib/api-types.ts` (added `max_loan_amount`, `margin_requirement` to `SchemeData`)
  - `frontend/components/compare/CompareAssessmentCard.tsx` (240 LOC, new modular component)
  - `frontend/components/compare/CompareAssessmentView.tsx` (83 LOC, new modular component)
  - `frontend/components/compare/CompareCard.tsx` (257 LOC, updated with live schemes & sparklines)
  - `frontend/components/compare/CompareHeader.tsx` (106 LOC, updated with mode switcher)
  - `frontend/components/compare/CompareNextSteps.tsx` (71 LOC)
  - `frontend/components/compare/CompareScreen.tsx` (460 LOC, coordinates Mode A & B)
  - `frontend/components/compare/TrendComparisonChart.tsx` (311 LOC, smooth SVG area curves)
  - `frontend/tests/CompareComponents.test.tsx` (17 tests)
  - `frontend/tests/compare-integration.test.tsx` (26 tests)
- **Quality & Architectural Metrics**:
  - TypeScript: **0 `any`**, **0 unhandled `unknown`**, `tsc --noEmit` passed with 0 errors.
  - Lines of Code: All modified files < 500 lines.
  - Cyclomatic Complexity: Max 7 across all functions (limit < 22).
  - Test Coverage on all Compare components (`frontend/components/compare/**`):
    - **Statements**: **100%** (100% on every single file)
    - **Branches**: **100%** (100% on every single file)
    - **Functions**: **100%** (100% on every single file)
    - **Lines**: **100%** (100% on every single file)
  - Mathematical integrity: Zero frontend recalculation of financial, feasibility, or opportunity scores.
- **Verification & Test Results**:
  - Frontend test suite: **40/40 test files passed, 427/427 tests passed (100%)**.
  - Python test suite: **234/234 passed** (48 backend tests + 186 AI tests).
  - Next.js production build: **Passed with 0 errors** (`npm run build`).
  - Assessment Regression: Verified `POST /api/v1/assess` and `GET /api/v1/assess/{id}` with Bera, Dairy, ₹10,000 margin capital -> Fit Score 73.2, Micro Finance Scheme, EMI ₹2,985.64, 100% field equivalence.
- **Next Task**:
  ```
  NEXT TASK: TASK 10 — HALLUCINATION TESTS & GROUNDING VERIFICATION
  ```


