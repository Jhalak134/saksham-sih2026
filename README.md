<div align="center">

<img src="frontend/public/logo.svg" alt="SAKSHAM logo" width="88" />

# SAKSHAM

**AI-Driven Hyper-Local Business Advisory & Financial Structuring Assistant for Rural Micro-Entrepreneurs**

*Smart India Hackathon 2026, Problem Statement #91*

[![Backend](https://img.shields.io/badge/backend-FastAPI-009688)](backend)
[![Frontend](https://img.shields.io/badge/frontend-Next.js%2016%20%2F%20React%2019-black)](frontend)
[![AI Service](https://img.shields.io/badge/AI%2FRAG-ChromaDB-6f42c1)](ai)
[![Tests](https://img.shields.io/badge/tests-234%20backend%2Fai%20%2B%20427%20frontend-brightgreen)](#-testing--quality-gates)
[![Code Quality](https://img.shields.io/badge/complexity%20gate-%3C22%20enforced-informational)](RULES.md)
[![Status](https://img.shields.io/badge/status-active%20development-yellow)](#-current-status--roadmap)

[Problem](#-the-problem) · [What we built](#-what-saksham-is) · [Why SAKSHAM](#-why-saksham) · [Architecture](#-system-architecture) · [Product Walkthrough](#-product-walkthrough) · [Tech Stack](#-tech-stack) · [Getting Started](#-getting-started) · [API](#-api-overview) · [Quality](#-testing--quality-gates) · [Roadmap](#-current-status--roadmap)

</div>

<p align="center">
  <img src="screenshots/landing-page.png" alt="SAKSHAM landing page" width="900">
</p>

---

## 🧭 The Problem

Rural entrepreneurs can access concessional government credit (10% margin money, 90% funded by a Channelizing Agency) — but there's no decision layer to turn "I have ₹1,00,000" into "start this business, get this loan, pay this EMI." **SIH Problem Statement #91** asks for that layer, on two real schemes:

| | Micro Finance Scheme | Term Loan Scheme |
|---|---|---|
| Project cost range | Up to ₹1.40 lakh | ₹1.40 lakh to ₹50 lakh |
| Loan share | Up to 90% (max ₹1.25 lakh) | Up to 90% (max ₹45 lakh) |
| Interest rate | 6.5% p.a. | 8% p.a. |
| Tenure | 3 years | 7 years |
| Moratorium | 3 months | 6 months |

```
Project Cost = Available Margin Capital ÷ 10%
Max Loan     = 90% of Project Cost (capped at scheme ceiling)
Scheme       = Micro Finance (≤ ₹1.40L)  or  Term Loan (₹1.40L to ₹50L)
```

Three inputs — **Location, Available Margin Capital, Business Category** — in; a **Feasibility Report** and a **Financial Calculator & Scheme Router** out.

## 💡 What SAKSHAM Is

A **decision-support system**, not a chatbot, not a loan-approval engine. Every number traces back to a formula or a cited document — never an LLM guess:

```
DATA PROVIDES EVIDENCE  ->  DETERMINISTIC ENGINES CALCULATE  ->  AI EXPLAINS
```

| SAKSHAM is | SAKSHAM is *not* |
|---|---|
| A hyper-local feasibility + financial structuring advisor | A loan approval system (the bank/SCA still decides) |
| A decision-support tool with a Business Fit Score | A guaranteed business-success predictor |
| Grounded in cited government scheme text and real geo data | A generic chatbot that answers from its own memory |
| Explicit about data recency and confidence | A government portal replacing official application systems |

**Eligibility vs. Suitability:** Eligibility is the max you could finance; Suitability is what's actually recommended for *this* business, location, and capital.

**Evidence honesty:** every non-computed figure is labeled with age/source (e.g. Census baselines shown as baselines, not "current"); template data is flagged `is_template_data = true` end to end — enforced in code, not just disclaimed (see [`ai/grounding`](ai/grounding)).

## 🥇 Why SAKSHAM

| Capability | **SAKSHAM** | Aggregators | AI chatbot | Scheme portals | Bank / CA |
|---|:---:|:---:|:---:|:---:|:---:|
| Feasibility for your *exact* village | ✅ Census + OSM | ❌ | ⚠️ Only if fed data | ❌ | ✅ not scalable |
| Fixed-formula financial math | ✅ | ⚠️ EMI only | ❌ Can invent figures | ❌ No calculator | ✅ manual |
| Claims traced to cited sources | ✅ | ❌ | ❌ | ⚠️ Static docs | Depends |
| Eligibility *and* Suitability shown separately | ✅ | ❌ Max only | ❌ | ❌ | ⚠️ Sometimes |
| Multilingual, low-end-phone PWA | ✅ | ⚠️ Rare | ⚠️ Depends on prompting | ⚠️ Rare | ⚠️ Depends |
| Free, no travel/appointment | ✅ | ✅ | ✅ | ✅ jargon-heavy | ❌ Cost barrier |
| Flags stale/illustrative data | ✅ | ❌ | ❌ | ⚠️ Varies | ⚠️ Varies |

Aggregators calculate but don't localize; chatbots localize but can't cite; portals inform but don't advise. SAKSHAM: **deterministic finance + local evidence + a language layer that only explains.**

## 🏗️ System Architecture

```
                         SAKSHAM
                            |
              +-------------+-------------+
       BUSINESS INTELLIGENCE       FINANCIAL INTELLIGENCE
       (Market / Risk / Competition)  (Project / Scheme / Repayment)
              +-------------+-------------+
                            v
                     EVIDENCE LAYER  (numbers + confidence, never invented)
                            v
                    RAG / KNOWLEDGE BASE  (ChromaDB, 4 curated documents)
                            v
                  AI ADVISOR / EXPLANATION LAYER  (grounded, cited, never calculates)
                            v
                   MULTILINGUAL ADVISORY REPORT
                            v
                       USER DECISION
```

<p align="center"><img src="diagrams/SystemArchitecture_flowchart.png" alt="System architecture flowchart" width="720"></p>

`Frontend` → `Backend (:8000)` → deterministic engines + Postgres → `AIClient` → `AI/RAG microservice (:8001)`. If the AI service is down, it falls back to rule-based explanations — never fails, never fabricates.

<details>
<summary>Additional diagrams (RAG pipeline, scheme routing, ER diagram, API sequence, navigation map)</summary>

| | |
|---|---|
| **RAG Pipeline** | <img src="diagrams/RAGPipelineFlow_flowchart.png" width="380"> |
| **Scheme Routing Logic** | <img src="diagrams/SchemeRoutingLogic_flowchart.png" width="380"> |
| **Database ER Diagram** | <img src="diagrams/DatabaseERDiagram_erDiagram.png" width="380"> |
| **API Sequence Diagram** | <img src="diagrams/APISequenceDiagram_sequenceDiagram.png" width="380"> |
| **New Assessment Flow** | <img src="diagrams/NewAssessmentFlow_flowchart.png" width="380"> |
| **Assessment Status Lifecycle** | <img src="diagrams/Assessment%20Status_stateDiagram.png" width="380"> |

</details>

**Why RAG:** the knowledge base is static, authoritative, and small — retrieval + citation beats a model "remembering" facts. Every claim is checked against a real `chunk_id`/`document_id` before it's shown.

## 📱 Product Walkthrough

<table>
<tr>
<td align="center" width="50%">
<img src="screenshots/discover.png" alt="Discover screen"><br>
<sub><b>Discover</b>: the home screen.</sub>
</td>
<td align="center" width="50%">
<img src="screenshots/dashboard.png" alt="Assessment dashboard"><br>
<sub><b>Dashboard</b>: one assessment's full report.</sub>
</td>
</tr>
</table>

> Drop screenshots into `screenshots/` at the repo root (`landing-page.png`, `discover.png`, `dashboard.png`), or update paths to match.

### 🎨 UI Mockups

Drop mockup exports into `mockups/mobile/` and `mockups/desktop/` using the filenames below (or rename and update paths).

**Mobile**

<table>
<tr>
<td align="center" width="50%">
<img src="mockups/mobile/landing-hero.png" alt="Mobile landing - hero"><br>
<sub>Landing page — hero & how it helps</sub>
</td>
<td align="center" width="50%">
<img src="mockups/mobile/landing-features.png" alt="Mobile landing - features & FAQ"><br>
<sub>Landing page — features & FAQ</sub>
</td>
</tr>
<tr>
<td align="center">
<img src="mockups/mobile/app-shell.png" alt="Mobile app shell and drawer"><br>
<sub>App shell (default) & navigation drawer</sub>
</td>
<td align="center">
<img src="mockups/mobile/discover.png" alt="Mobile discover screen"><br>
<sub>Discover — top movers, map, categories</sub>
</td>
</tr>
<tr>
<td align="center">
<img src="mockups/mobile/assessment-flow.png" alt="Mobile assessment creation flow"><br>
<sub>My Reports → New Assessment → Created</sub>
</td>
<td align="center">
<img src="mockups/mobile/dashboard-tabs.png" alt="Mobile dashboard tabs"><br>
<sub>Dashboard, Market, Financials & Next Steps tabs</sub>
</td>
</tr>
</table>

**Desktop**

<table>
<tr>
<td align="center" width="50%">
<img src="mockups/desktop/landing.png" alt="Desktop landing page"><br>
<sub>Landing page</sub>
</td>
<td align="center" width="50%">
<img src="mockups/desktop/app-shell.png" alt="Desktop app shell and sidebar"><br>
<sub>App shell & sidebar navigation</sub>
</td>
</tr>
<tr>
<td align="center">
<img src="mockups/desktop/assessment-flow.png" alt="Desktop assessment creation flow"><br>
<sub>My Reports → New Assessment → Created</sub>
</td>
<td align="center">
<img src="mockups/desktop/discover.png" alt="Desktop discover screen"><br>
<sub>Discover — top movers, map, categories</sub>
</td>
</tr>
<tr>
<td align="center" colspan="2">
<img src="mockups/desktop/dashboard-tabs.png" alt="Desktop dashboard tabs"><br>
<sub>Dashboard, Market, Financials & Next Steps tabs</sub>
</td>
</tr>
</table>

## 🧩 Tech Stack

| Layer | Technology |
|---|---|
| **Frontend** | Next.js 16 (Turbopack, App Router), React 19, TypeScript, Tailwind CSS 4, MapLibre GL / react-map-gl, Vitest + Testing Library |
| **Backend** | FastAPI, SQLAlchemy 2, Alembic, PostgreSQL (Neon) / SQLite, Pydantic, JWT (`python-jose`, `bcrypt`) |
| **AI / RAG** | FastAPI, ChromaDB (offline sentence-transformer embeddings), deterministic grounded explanation layer, `pdfplumber` |
| **Data** | Census / DCHB demographics, OpenStreetMap, curated PMFME + district + entrepreneurship documents |
| **Quality** | `pytest` + `pytest-cov`, `radon`, `vulture`, ESLint + `sonarjs`, `tsc --strict`, Vitest coverage |

## 📁 Repository Structure

```
saksham-sih2026/
├── frontend/            Next.js PWA: Discover, New Assessment, Dashboard, Compare, Schemes
├── backend/              FastAPI gateway: auth, assessments, locations, schemes, insights, AI gateway
│   ├── app/engines/      Deterministic financial + feasibility engines
│   ├── app/routers/      REST endpoints
│   ├── app/db/           SQLAlchemy models, queries, Alembic migrations
│   └── tests/
├── ai/                   Standalone AI/RAG microservice
│   ├── ingestion/        PDF extraction, cleaning, chunking (never touches source PDFs)
│   ├── knowledge_base/   4 curated source documents + generated chunks
│   ├── retrieval/        ChromaDB vector store + retriever
│   ├── grounding/        Evidence pack construction, warning/disclaimer enforcement
│   ├── prompts/          Query parser + grounded explanation prompt & validator
│   ├── service/          FastAPI app exposing /query
│   └── tests/
├── docs/                 Master reference, API contracts, data dictionary, work logs
├── diagrams/             Architecture, ERD, sequence, flowchart and UI concept exports
├── RULES.md              Hard code-quality gates (see below)
└── AGENTS.md             Living task/handoff log between build sessions
```

## 🚀 Getting Started

### Prerequisites
- Python 3.11+ and Node.js 20+
- PostgreSQL (e.g. [Neon](https://neon.tech)), or just use local SQLite

### 0. Clone
```bash
git clone https://github.com/<your-org>/saksham-sih2026.git
cd saksham-sih2026
```

### 1. AI / RAG microservice (port 8001)
```bash
cd ai
pip install -r requirements.txt
python -m ai.ingestion.chunk_documents      # (re)build chunks, if needed
python -m ai.ingestion.embed_and_store      # build/refresh ChromaDB
uvicorn ai.service.main:app --reload --port 8001
```

### 2. Backend gateway (port 8000)
```bash
cd backend
pip install -r requirements.txt
cp ../.env.example .env        # DATABASE_URL / JWT_SECRET_KEY, or leave unset for SQLite
alembic upgrade head            # or: python create_tables.py
uvicorn app.main:app --reload --port 8000
```

### 3. Frontend (port 3000)
```bash
cd frontend
cp .env.example .env.local     # NEXT_PUBLIC_BACKEND_URL=http://localhost:8000
npm install
npm run dev
```

Open **http://localhost:3000**. If the AI microservice isn't running, assessments still work — the backend falls back to rule-based advisory text.

### Common frontend commands
```bash
npm run dev             # dev server (Turbopack)
npm run build            # production build
npm run start            # run production build
npm run lint             # ESLint
npm run test              # Vitest once
npm run test:watch        # Vitest watch mode
npm run test:coverage     # Vitest with coverage
```

### Common backend commands
```bash
uvicorn app.main:app --reload --port 8000    # dev server with hot reload
alembic revision --autogenerate -m "message"  # new migration
alembic upgrade head                          # apply migrations
pytest tests/ --cov                            # tests with coverage
python create_tables.py                        # quick local SQLite bootstrap
```

## 🔌 API Overview

All routes served by the backend gateway (`:8000`); the frontend never talks to the AI microservice directly.

| Method | Endpoint | Purpose |
|---|---|---|
| `POST` | `/api/v1/assess` | Run a full assessment |
| `GET` | `/api/v1/assess/{id}` | Fetch a persisted assessment |
| `GET` | `/api/v1/assess/history` | List a user's past assessments |
| `GET` | `/api/v1/assess/my-reports` | Assessments for "My Reports" screen |
| `GET` | `/api/v1/locations?q=` | Live village/block/district search |
| `POST` | `/api/v1/locations/resolve` | Resolve free-text location to a canonical village |
| `GET` | `/api/v1/schemes` | List financing schemes |
| `POST` | `/api/v1/schemes/calculate-emi` | Reducing-balance EMI simulator |
| `POST` | `/api/v1/schemes/match` | Match project cost to correct scheme |
| `GET` | `/api/v1/insights/{location}` | Hyper-local demand/category insights |
| `POST` | `/api/v1/ai/query` | Conversational AI advisory gateway |
| `POST` | `/api/v1/auth/*` | Registration, login, Google sign-in, profile |

Full contracts: [`docs/api-contracts.md`](docs/api-contracts.md).

### The three formulas everything else is built on

```
Project Cost          = Available Margin Capital ÷ 10%
Maximum Eligible Loan = min(Project Cost × 90%, Scheme Ceiling)

EMI = P × r × (1+r)^n / [(1+r)^n − 1]     where r = annual rate / 12,  n = tenure minus moratorium (months)

Fit Score = (Market × 0.30) + (Competition × 0.25) + (Capital Fit × 0.25) + (Infrastructure × 0.20)
  >= 80 Highly Feasible   |   65 to 79.9 Feasible   |   50 to 64.9 Moderate Fit   |   < 50 High Risk
```

Live in [`backend/app/engines`](backend/app/engines) — the AI layer never touches them.

## ✅ Testing & Quality Gates

Hard thresholds in [`RULES.md`](RULES.md):

| Metric | Gate |
|---|---|
| Cyclomatic complexity (per function) | < 22 |
| Cognitive complexity (per function) | < 22 |
| Halstead difficulty (per module) | < 80 |
| Lines of code (per file) | < 500 |
| Test coverage (new/modified code) | 100% line + branch |
| `any` / `unknown` (TypeScript) | 0 |
| Dead / duplicated code | 0 |

**234/234** Python tests passing (backend + AI), **427/427** frontend tests across 40 suites, clean `npm run build` and `tsc --noEmit`. Per-milestone logs: [`AGENTS.md`](AGENTS.md).

```bash
# Backend + AI tests
PYTHONPATH=. pytest backend/tests/ ai/tests/ --cov

# Frontend tests
cd frontend && npm run test:coverage
```

## 🎯 Current Status & Roadmap

Full audit: [`ai/problems.txt`](ai/problems.txt). Headlines:

- **Generation is deterministic, not LLM-generated.** Retrieval via ChromaDB is real; explanation text is currently template-assembled. Clean injection seam (`llm_callable`) ready for a live LLM — not wired yet.
- **Citation IDs are validated, full content isn't (yet).** Claims check against real chunk/doc IDs; token-level grounding against source text is planned before LLM wiring.
- **Hallucination test suite in progress** (`ai/tests/test_hallucination.py`) — required gate before LLM wiring.
- **Knowledge base scoped to MVP**: 4 documents, one pilot district (Mathura) — not nationwide coverage.

**Next:** wire a real LLM behind `llm_callable`, finish the hallucination/grounding suite, expand beyond the pilot district.

## 👥 Team

Cross-functional: backend/API, data/Census pipelines, AI/RAG, frontend. Per-contributor logs: [`docs/work-log`](docs/work-log).

## 📄 License

No license file yet. All rights reserved by the team for SIH 2026 evaluation.

---

<div align="center">
<sub>SAKSHAM. Smart India Hackathon 2026, Problem Statement #91: AI-Driven Hyper-Local Business Advisory and Financial Structuring Assistant for Rural Micro-Entrepreneurs</sub>
</div>