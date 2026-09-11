# SAKSHAM — Master Project Reference

*One-stop context doc. Upload this at the start of any new conversation instead of re-explaining the project. Covers: the original problem statement, product definition, architecture, platform decisions, and the full UI/UX design history and open questions. (Team execution/build-task breakdown is intentionally excluded — kept as a separate file.)*

---

## 1. Origin — SIH Problem Statement #91

**Title:** AI-Driven Hyper-Local Business Advisory and Financial Structuring Assistant for Rural Micro-Entrepreneurs

**Background:** Government schemes provide concessional credit for income-generating activities, requiring beneficiaries to contribute ~10% margin money while State/Central Channelizing Agencies (SCAs/CAs) fund the remaining 90%. Despite capital being available, many first-time rural entrepreneurs face business stagnation due to lack of localized market research and poor financial literacy around loan structuring, margin requirements, and repayment.

**The two financing schemes (exact figures):**

| | Micro Finance Scheme | Term Loan Scheme |
|---|---|---|
| Project cost range | Up to ₹1.40 lakh | ₹1.40 lakh – ₹50 lakh |
| Loan share | Up to 90% (max ₹1.25 lakh) | Up to 90% (max ₹45 lakh) |
| Interest rate | 6.5% p.a. | 8% p.a. |
| Tenure | 3 years | 7 years |
| Moratorium | 3 months | 6 months |

**Core formula:**
- Project Cost = Available Margin ÷ 10%
- Max Loan = 90% of Project Cost
- Example: ₹1,00,000 margin → ₹10,00,000 project cost → ₹9,00,000 loan

**Scheme routing logic:** Project Cost ≤ ₹1.40L → Micro Finance Scheme; Project Cost > ₹1.40L and ≤ ₹50L → Term Loan Scheme.

**Required user inputs (per the official brief):** Geographic Location (Village/Block/District), Available Margin Capital, Proposed Business Category.

**Module 1 — Hyper-Local Business Feasibility Report** must cover: Market Reach (5–10km radius), Opportunity Analysis (underserved niches), SWOT, Threats Identification, Competitor Mapping, Product Market Value/Pricing.

**Module 2 — Smart Financial Calculator & Scheme Router** must cover: Financial Structuring, Scheme Auto-Selection, EMI & Moratorium Generator.

**Stated impact goals:** reduce micro-enterprise failure rate; eliminate financial confusion between margin capital, borrowing capacity, and repayment obligations; empower grassroots entrepreneurship with data-backed decisions.

---

## 2. What SAKSHAM Is

SAKSHAM is a **hyper-local AI business advisory and financial planning system** for rural/semi-urban entrepreneurs. It helps a first-time or early-stage entrepreneur decide:
- Whether a proposed business is worth pursuing in their specific location
- How that business should be financially structured
- Which available government-backed/concessional financing scheme fits it

It is a **decision-support system** — not a chatbot, not a loan calculator.

### What it is explicitly NOT
- ❌ A loan approval system (the bank/SCA makes the final decision)
- ❌ A government portal (guides toward schemes, doesn't replace official application systems)
- ❌ A guaranteed business-success predictor
- ❌ A complete competitor database
- ❌ A replacement for a human financial/business consultant
- ❌ A generic chatbot (chat is only the interface to a larger analytical system)

---

## 3. Core Product Architecture

### Three primary user inputs
1. **Location** (village/block/district)
2. **Margin Capital** (available own contribution)
3. **Business category** (dairy, retail, textiles, etc.)

### Four layers of intelligence
1. **Location Resolution** — resolves input into a geographic entity (coordinates, block, district, radius, nearby infrastructure)
2. **Local Economy Understanding** — demographics, infrastructure, existing/mapped businesses, market data, sector-specific data, environmental data
3. **Business Analysis** — demand, supply, opportunity, competition, accessibility, pricing, risk → produces a **Business Fit Score** (e.g., 78/100)
4. **Financial Analysis** — project cost, loan amount, applicable scheme, repayment structure, working capital

### Critical architectural principle
**Data provides the evidence → deterministic engines calculate → AI explains.**

The LLM is *never* responsible for: calculating loan eligibility, deciding scheme thresholds, inventing market prices/competitor counts, or claiming exact demand. It handles: natural-language interaction, multilingual understanding, evidence synthesis, explanation, and report generation. RAG is used specifically for retrieving government scheme documents and business-domain knowledge, which the LLM then explains — never invents.

### Key distinction: Eligibility vs. Suitability
- **Eligibility** = "How much can you potentially finance?" (the maximum)
- **Suitability** = "How much *should* you finance for this business?" (the recommended)
These are different numbers. SAKSHAM shows both, not just the maximum.

### Evidence honesty principle
Never present a proxy as exact truth (e.g., "Census 2011 population = X" is a baseline, not "current population = X"). Every output carries a **confidence indicator** (🟡 Medium, etc.) reflecting data coverage/recency/granularity — not decoration.

### MVP scope
One state (all districts within it) → selected villages → 3–5 business categories → 2 financing schemes → one multilingual interaction flow. Prove the full journey (Location + Capital + Business → Evidence → Feasibility → Financial Structure → Scheme → Repayment → Recommendation) before scaling.

### Product architecture diagram
```
                         SAKSHAM
                            │
              ┌─────────────┴─────────────┐
       BUSINESS INTELLIGENCE       FINANCIAL INTELLIGENCE
       (Market/Risk/Competition)   (Project/Scheme/Repayment)
              └─────────────┬─────────────┘
                            ↓
                     EVIDENCE LAYER
                            ↓
                       RAG / KNOWLEDGE
                            ↓
                      AI ADVISOR / NLP
                            ↓
                   MULTILINGUAL REPORT
                            ↓
                   BUSINESS DECISION
```
Underlying everything: **Location + Business + Capital**.

---

## 4. Platform: PWA (Progressive Web App)

Mobile-first (not a shrunk desktop site), accessed via mobile browser with "Add to Home Screen" install path.

### Install behavior by platform
- **Android (Chrome/Edge):** native install prompt can fire automatically, or be triggered via a custom "Install" button once the browser signals installability.
- **iOS (Safari):** no automatic prompt — user must manually tap Share → "Add to Home Screen." Requires a self-service 2-step visual walkthrough.

### Install prompt strategy (decided)
1. Soft, dismissible prompt right after the user's **first generated report** ("Save this report — Add SAKSHAM to your home screen") — the peak-trust moment, not immediately on login.
2. If dismissed, a persistent "Install app" option remains quietly available in the drawer/profile menu.
No install prompt appears immediately post-login/signup.

---

## 5. First-Login / Home Screen Concept — "Discover"

**Decision:** no empty shell dashboard on first login. Instead, the home screen is the **Discover** dashboard — a visual, exploratory view of business trends across India, so someone with capital but no fixed idea can browse "what's rising" before committing to an assessment. This has real content from the very first visit.

### Data honesty for "rising" trends
Must be backed by genuine time-series signals:
- MCA21 company/LLP/Udyam registration data (strongest signal)
- Census 2011 vs. later economic survey deltas
- Agmarknet/e-NAM market arrivals & prices over time
- GST registration data by sector/region (where open)
- Google Trends / search interest by state (soft proxy)

Framing: **"Rising" = increasing registration/activity signals in official data — not a guaranteed forecast.**

### Discover screen layout (mobile, top to bottom)
```
┌─────────────────────────────┐
│ SAKSHAM   📍 Location ▾  🏠 │  ← sticky header, home-location shortcut
├─────────────────────────────┤
│ 📈 TOP MOVERS · [SCOPE]     │  ← horizontal scrollable ticker
│ [Dairy ▲34%][Textiles ▲21%] │     scope label updates with map selection
├─────────────────────────────┤
│   [ India map — flat,       │  ← ~35–40% height, tap-to-filter (not pan/zoom)
│     state-level shading ]   │
├─────────────────────────────┤
│ Categories   [List | 2x2]   │
│ 🐄 Dairy  ▲34% 🌾 ~~~        │  ← trend %, seasonality icon, sparkline
├─────────────────────────────┤
│ [Comparing: 2 selected →]   │  ← only when compare mode active
└─────────────────────────────┘
```

**Map:** flat, state-level only, no pan/zoom/district drill-down on mobile. Tapping a state filters (doesn't navigate) the ticker + category list. Full interactive version reserved for desktop/tablet.

**Top Movers Ticker:** above the map (highest-priority content). Header reflects scope: `TOP MOVERS · INDIA` → `TOP MOVERS · [STATE]` once filtered.

**Category List:** vertical cards, each with trend %, sparkline, seasonality badge. Tapping opens **Category Detail** (full trend chart, 2x2 position, competitor density, "Start assessment" CTA).

**Growth × Saturation (2x2):** not shown by default — available as a toggle or detail-screen feature.

**Compare Mode:** small "add to compare" per card; 2+ selections trigger a floating bar → dedicated Compare screen with overlaid trend lines.

**Capital Filter:** persistent chip (e.g. `₹1,00,000 ▾`), independent of location. Dims (doesn't hide) unreachable categories, tags them "Above your budget."

### Location filter logic
One unified region filter, distinguishing **saved home location** vs. **current browsing location**:
- 📍 chip shows current browsing location; tapping opens search/picker.
- 🏠 "Back to home" shortcut appears only when browsing away from home; snaps everything back in one tap.
- Map taps and the chip update the same underlying filter (single source of truth).
- Browsing never silently overwrites saved home location — only an explicit "Set as my location" action changes it.
- Capital stays fully independent of location logic.

---

## 6. Navigation Structure

**Decision:** bottom tab bar (primary) + hamburger drawer (secondary) — no persistent sidebar.

### Bottom Tab Bar (4 tabs)
- 🏠 **Discover** — map/ticker/category dashboard
- 📄 **My Reports** — generated assessments
- ➕ **New Assessment** — center, raised "+" button style (own prominent slot, not just Discover → tap category)
- 👤 **Profile** — home location, capital, language, install-app option

### Hamburger Drawer
Saved/Bookmarked, Compare (shown only when an active session exists), Language, How SAKSHAM Works, Install App, Help/Support, Settings, About/Feedback, Logout.

Shell layout:
```
┌─────────────────────────────┐
│ ☰  SAKSHAM         📍 ₹     │
├─────────────────────────────┤
│      [ screen content ]     │
├─────────────────────────────┤
│  🏠      📄     ➕     👤   │
│ Discover Reports New  Profile│
└─────────────────────────────┘
```

---

## 7. Search Bar / LLM-Driven Entry Point

Header search bar on Discover: `🔍 Ask SAKSHAM anything...` (tap-to-expand, not always open). The LLM **interprets intent and routes to structured features** — never answers from its own knowledge or calculates.

### Routing examples
```
"what's rising near me" → filters Discover to location
"₹2L, near Agra, what can I start" → routes into Business Discovery / pre-fills assessment
"is dairy good in my village" → routes into full assessment, pre-filled with dairy + location
"compare dairy and textiles" → opens Compare screen, both pre-selected
```

### Instant-navigate vs. conversational
Rule: **the LLM never asks for something it can infer from context** (e.g. saved home location) — only for what's genuinely missing.
- Fully specified query → instant-navigate, no friction.
- Missing required info → goes conversational, asks only for the missing piece (ideally via an inline quick-input chip).
- Fully open query ("help me start a business") → asks only the minimum needed (usually just capital).

### Shared state
Chat-based and form-based assessment entry are **not independent paths** — one session per assessment regardless of entry point. Partial answers via chat are already populated if the user later opens the New Assessment form.

---

## 8. Completing an Assessment

Once location + capital + business are resolved (via chat, form, or a mix), a CTA triggers the deterministic engines to generate output. The LLM's role stops at handoff — the report is produced by the calculation pipeline, not the LLM.

- **CTA wording (not fully locked):** leaning "Get my recommendation" or "Generate my report" — avoiding jargon like "dashboard."
- **Button visibility (leaning, not locked):** always visible, disabled until inputs are complete, with an inline progress hint ("2 of 3 details added").

---

## 9. Data Model: "My Reports" = Dashboards

Two levels only:
1. **Assessment (input)** — location + capital + business, however entered
2. **Dashboard (output)** — Fit score, evidence, financial structure, recommendation, **plus** living elements (status tracker, re-run action, notes). No separate static "report" in between — the dashboard *is* the report.

**My Reports tab** = flat list of assessments, auto-grouped by location (not manual folders), with sort/filter controls (location, business type, date, fit score):
```
My Reports
📍 Kheragarh, Agra
   🐄 Dairy — Fit 78 · Medium confidence
   🧵 Textiles — Fit 61 · Low confidence
📍 Rampur, Mathura
   🏪 Retail — Fit 85 · High confidence
```

### Inside one dashboard
Core report content + underlying trend data (refreshes over time) + scheme-rule change flags + a **status/progress tracker** (Exploring → Applied for scheme → Business started) + a re-run/update action ("Re-check with updated capital") + personal notes/journal.

One dashboard per assessed business idea (not one unified aggregate dashboard).

---

## 10. Visual Identity & Style Brief (Locked)

**White background, black/near-black text, one sparing accent color (green)** used only for highlights/active states/key numbers — never a dominant background or button-everywhere color. Hugging Face-website-adjacent aesthetic: modest, restrained, subtle borders/dividers over heavy shadows or color-blocking, clean neutral sans-serif type, moderate density (restraint, not just empty space, keeps it calm). **Icon-based, not illustrated** — no stock photography, no painterly/illustrated scenes, no gradients or glow. Flat, high-contrast, legible data visualization over decorative/glossy charts. Mobile-first, generous touch targets (44px+).

**Landing page personality specifically:** avoid "government portal," avoid "AI startup with glowing nodes," avoid "NGO pamphlet" (farmer photos, illustrated cottages). Aim: quiet fintech — restraint, real typographic hierarchy, numbers/confidence bars instead of AI iconography. Closer to Stripe or a clean Indian fintech (Groww/Cred) than a hackathon deck.

**Landing page decisions:**
- Hero: **Hybrid** — headline + CTA + a natural-language "try it" prompt framed conversationally (e.g. "I want to start a dairy unit in my village...") rather than a full 3-field form up front.
- Length: **Medium** (Hero → How it works → capabilities → "Built for your reality" → CTA), not Rich — the "sample report" teaser lives inside the post-submission flow instead, not as its own landing section.
- Language selector: visible early (not buried in footer), given multilingual access is core to the product. Leaning: sensible default detection (browser/device) + a very visible switch, not forcing a choice before the hero loads.

---

## 11. UI Design Phase — Screen Levels & Naming Convention

App broken into levels before designing:
- **Level 0 — Pre-Login:** Landing Page, Sign Up, Log In
- **Level 1 — Core Navigation Shell:** header + bottom tab bar + drawer
- **Level 2 — Bottom Tab Destinations:** Discover, My Reports, New Assessment, Profile
- **Level 3 — Drawer Destinations:** Saved, Compare, How SAKSHAM Works, Install App, Help/Support, Settings, About/Feedback
- **Level 4 — Detail Screens:** Category Detail, Dashboard (per-assessment report), Search/Chat expanded state
- **Level 6 — System/Utility Screens:** Onboarding, Empty States, Install Prompt component

**Naming convention:** competing outputs for the same screen are labeled **[Screen]-A** / **[Screen]-B**; each review round ends in "pick one as base + revise" or "merge best of both," followed by a scoped written revision prompt.

### Screens reviewed & decided so far

**Shell (App Shell + Drawer)** — Shell-A chosen as base. Fixes: added missing drawer items (Settings, Install App, How SAKSHAM Works, About/Feedback), removed "History" (out of scope), replaced green marketing promo card at drawer bottom with quiet muted-text metadata, slightly increased drawer row touch-target height (borrowed from Shell-B).

**Discover (Home)** — Discover-B chosen as base (matched agreed architecture almost exactly). Pulled in from Discover-A: the "Insights for [Location]" stat-card section and a single-line "Ask SAKSHAM anything" reinforcement card. Bugs fixed: floating Compare bar overlap, stray "Fit score" label removed.

**Dashboard (per-assessment report)** — **Merged**: Dashboard-A's tabbed container (Dashboard/Market/Financials/Schemes/Next Steps) + circular fit-score ring + card polish, with Dashboard-B's substance (Fit Score Breakdown, Confidence indicator, Eligibility vs. Suitability split, Key Risks, Status Tracker, Personal Notes) distributed across the tabs. Final tab assignment:
- **Dashboard tab:** score ring + confidence + fit breakdown + "Recommended: ₹X → See Financials" teaser + Final Recommendation (+/- factors)
- **Market tab:** Local Market Summary + Key Risks
- **Financials tab:** Max Eligibility card + green-bordered Recommended/Suitability card + revenue/expense/profit chart
- **Schemes tab:** matched-schemes-with-confidence-tags list
- **Next Steps tab:** Status Tracker stepper + Refresh/Re-check actions + Personal Notes field

**My Reports / New Assessment / Assessment Completed** — Built on **Flow-A** as base (richer preview cards, wizard flow, new "Assessment Completed" screen not in the original spec). Pulled in from Flow-B: location-grouping for My Reports (was flat list) + per-card confidence bars + sort/filter control. New Assessment: free-text idea step (from Flow-A) wired to auto-suggest a category tile in step 2 (which gained a structured capital input + icon-grid fallback from Flow-B); a proper Review step (step 4) added with edit links, CTA relabeled **"Get my recommendation"** on that step specifically. Assessment Completed kept almost as-is (animated checklist + summary card), with a confidence/data-quality note and an early fit-score badge added. Formally added to the screen list as **#7b — Assessment Completed**.

**Landing Page** — Landing-A chosen as base (Landing-B was closer to a content skeleton). Structure/copy/section order kept intact (hybrid hero, Understand/Test/Plan framing, "Built for your reality," FAQ, footer). **Flagged for removal** via revision prompt (status of whether this revision has actually been run/verified: unconfirmed): the stock photograph in the hero, the illustrated cottage/tree graphic in the closing CTA card, and the "10K+ / 500+ / 95%" stats row (unless real, verified numbers are supplied).

> Note: the first rendered mockup PDF reviewed still showed the pre-revision Landing-A (photo + illustration present) — so this revision may still need to be (re-)generated and checked.

### Review workflow used for each screen
1. Two candidate images generated from the same base prompt (different tools)
2. Named [Screen]-A / [Screen]-B, compared against the agreed spec
3. Decision made: pick one as base, or merge specific elements
4. Precise, scoped revision prompt written — protecting what already works, listing only specific fixes/additions

---

## 12. Still Open / Not Yet Decided

- Whether the Landing-A revision (photo/illustration/stats removed) has actually been regenerated and verified — last seen mockup still had the old elements
- Business Fit Score exact weighting/methodology (which factors, what weights)
- Confidence indicator exact heuristic (what data coverage/recency/granularity maps to Low/Medium/High)
- Recommended Project Size calculation logic (Suitability, distinct from Eligibility)
- Opportunity Analysis methodology (how to infer "underserved" without unsupported claims)
- Final recommendation format (Proceed / Proceed with caution / Reconsider, or a more nuanced scale)
- Category Detail screen full layout
- Compare screen full layout
- Onboarding flow specifics (first location/capital capture, language selection timing)
- Final CTA wording ("Get my recommendation" vs. "Generate my report") — leaning former, not locked
- CTA button visibility behavior (always-visible-disabled vs. appears-when-complete) — leaning former, not locked
- Go-ahead on building the first interactive prototype slice (Discover + nav, real persistence) — proposed, not started
- Remaining screens not yet designed/reviewed: Sign Up, Log In, Profile, Saved, Compare, How SAKSHAM Works, Install App, Help/Support, Settings, About/Feedback, Category Detail, Search/Chat expanded state, Onboarding Flow, Empty States, Install Prompt component
- Whether the "10K+ / 500+ / 95%" landing stats are real, verifiable numbers to reinstate, or should stay removed permanently

---

## 13. Database Schema (ERD) — Locked

Scope note: the schema is state-scoped, not district-scoped — `STATE` is the top-level pilot boundary, and every `DISTRICT` belonging to that state is loaded in (see §7 MVP scope). A district is just one level of the location hierarchy underneath it, not a separate pilot boundary.

```
erDiagram
    STATE ||--o{ DISTRICT : contains
    DISTRICT ||--o{ BLOCK : contains
    BLOCK ||--o{ VILLAGE : contains
    VILLAGE ||--o{ HOUSEHOLD : contains
    VILLAGE ||--o{ BUSINESS : contains
    BUSINESS }o--|| BUSINESS_CATEGORY : "belongs to"
    USER ||--o{ ASSESSMENT : creates
    ASSESSMENT }o--|| VILLAGE : "located in"
    ASSESSMENT }o--|| BUSINESS_CATEGORY : "assesses"
    ASSESSMENT }o--o| SCHEME : "routed to"

    STATE {
        int id PK
        string name
        string code
    }

    DISTRICT {
        int id PK
        int state_id FK
        string name
    }

    BLOCK {
        int id PK
        int district_id FK
        string name
    }

    VILLAGE {
        int id PK
        int block_id FK
        string name
        float latitude
        float longitude
        int population
        int household_count
        float literacy_rate
        string data_source
        date data_year
    }

    HOUSEHOLD {
        int id PK
        int village_id FK
        int size
        string primary_occupation
    }

    BUSINESS {
        int id PK
        int village_id FK
        int category_id FK
        string name
        float latitude
        float longitude
        string source
    }

    BUSINESS_CATEGORY {
        int id PK
        string name
        string icon
        bool is_seasonal
    }

    SCHEME {
        int id PK
        string name
        float max_project_cost
        float max_loan_amount
        float interest_rate
        int tenure_months
        int moratorium_months
    }

    USER {
        int id PK
        string phone_or_email
        string home_location
        float default_capital
        string preferred_language
    }

    ASSESSMENT {
        int id PK
        int user_id FK
        int village_id FK
        int category_id FK
        float capital_input
        float fit_score
        string confidence_level
        float project_cost
        float max_loan_amount
        float recommended_project_size
        int scheme_id FK
        string status
        datetime created_at
        datetime updated_at
    }
```
