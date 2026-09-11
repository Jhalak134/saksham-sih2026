# Work Log

## 2026-09-09 — Census data pipeline (Mathura)

**What I did:**
- Downloaded raw Census 2011 dataset (village/town/ward level, all-India) as 
  `2011-IndiaStateDistSbDistVill-0000.xlsx`
- Inspected the file structure: 660,941 rows × 94 columns. Found that 
  State/District/Subdistt/Village are numeric codes, not names — the `Level` 
  column (India/STATE/DISTRICT/SUB-DISTRICT/VILLAGE) and `Name` column decode 
  them. `TRU` column splits Total/Rural/Urban at district & sub-district level; 
  villages are always TRU='Rural' only (no double-counting risk there).
- Identified codes for pilot region: State = 9 (Uttar Pradesh), 
  District = 145 (Mathura)
- Filtered dataset to Mathura only: 889 rows (874 villages, 12 sub-districts, 
  3 district-level rows)
- Cleaned the data: selected relevant columns (population, households, 
  literacy, workforce categories), renamed to clear names, split into 
  villages (874 rows) vs. sub-district/district summaries (15 rows)
- Verified no missing values in the cleaned village data
- Wrote `backend/data_pipeline/clean_census.py` as the reusable pipeline script
- Added `docs/data_requirements.md`, `docs/data_dictionary.md`, 
  `docs/location_schema.md`
- Confirmed raw file (318MB) can't be committed — added to `.gitignore`, 
  documented download instructions instead
- Pushed branch `track1/census-cleaning`, opened PR

**Next up:** OSM data download for Mathura (Step 10 in execution plan) — 
competitor/business mapping data.

**Notes for team:**
- Raw Census file must be downloaded separately by anyone running this 
  pipeline — see setup instructions in `docs/data_requirements.md`
- Village-level rows in `mathura_villages_clean.csv` are what the feasibility 
  engine should query against for population/demographic data


## 2026-09-10 — OSM data pipeline (Mathura)

**What I did:**
- Used Overpass Turbo to query OpenStreetMap for Mathura district: all 
  nodes/ways tagged `shop`, `amenity`, or `craft` within the district's 
  administrative boundary
- Verified the boundary/query was correct by checking the coordinate spread 
  of results (~27.25–27.59 lat, ~77.4–77.8 lon) against known Mathura 
  district locations (Govardhan, Mathura city, Vrindavan) — confirms full 
  district coverage, not just a local cluster
- Exported as GeoJSON (540 raw features, ~216KB) to 
  `backend/data_pipeline/raw/mathura_osm_raw.geojson`
- Wrote `backend/data_pipeline/clean_osm.py`:
  - Extracts category (shop/amenity/craft) and subcategory (e.g. dairy, 
    restaurant, bank) from OSM tags
  - Extracts lat/lon from node/way geometry
  - Filters out non-business infrastructure tags (drinking water, benches, 
    toilets, waste baskets, etc.) that would distort competitor-density 
    calculations
  - Adds source ("OpenStreetMap") and collection_date to every row for 
    provenance tracking
- Output: 491 cleaned rows in `cleaned/mathura_osm_clean.csv`
- Category breakdown: 437 amenity, 53 shop, 1 craft. Top subcategories: 
  place_of_worship (183), restaurant (67), hospital (56), fuel (29)
- 149 rows have no `name` tag (common for rural OSM data) — still usable 
  for location/category/density, just not displayable by name
- Raw geojson is git-ignored (covered by the existing 
  `backend/data_pipeline/raw/` rule) — small enough to commit but excluded 
  for consistency with the raw-data-not-in-repo pattern; can be regenerated 
  via the same Overpass query
- Pushed branch `track1/osm-data`, opened PR

**Known limitation for whoever builds competitor-density logic:**
place_of_worship makes up 37% of all POIs (183/491) — a temple is not 
competition for a business. Competitor-density calculations must filter by 
category relevant to the specific business type being assessed, not count 
all POIs indiscriminately. OSM coverage is also visibly denser in 
Vrindavan/Mathura city (religious tourism areas) than in rural villages — 
consistent with the known "incomplete rural mapping" limitation already 
noted in data_requirements.md.

**Next up:** Market price data (Step 10 continued / execution plan Step A 
continued) — likely Agmarknet or similar source.

## 2026-09-10 — Market price data pipeline (Mathura)

**What I did:**
- Found the relevant Agmarknet dataset on data.gov.in: "Current Daily Price 
  of Various Commodities from Various Markets (Mandi)" 
  (resource ID: 9ef84268-d588-465a-a308-a864a43d0070)
- Signed up for a data.gov.in account and generated an API key
- Queried the API directly, filtered to State=Uttar Pradesh, 
  District=Mathura, exported as CSV
- Important limitation discovered: this resource only returns a **same-day 
  snapshot**, not historical data — "Current Daily Price" is literal. Got 
  7 rows for 10/09/2026 across 2 markets (Mathura APMC, Kosikalan APMC)
- Commodities covered: Tomato, Green Chilli, Paddy(Common), Onion, Potato, 
  Wheat — relevant to dairy/food-processing/retail categories, though thin 
  coverage overall
- Wrote `backend/data_pipeline/clean_market_prices.py`:
  - Renamed columns (raw export had XML-artifact names like 
    `Min_x0020_Price` from a leaked space encoding)
  - Parsed arrival_date properly (source format DD/MM/YYYY)
  - Converted price columns to numeric
  - Added `source` ("Agmarknet via data.gov.in") and `is_snapshot=True` 
    fields per data quality rules — every price record must be traceable 
    and marked as point-in-time, not treated as a permanent/current price
- Output: 7 clean rows in `cleaned/mathura_market_prices_clean.csv`, no 
  missing values
- Raw file is small (~700 bytes) — committed directly to repo (not 
  gitignored, unlike Census/OSM raw files)
- Pushed branch `track1/market-prices`, opened PR

**Known limitation for whoever uses this in the financial/feasibility 
engine:** Only 6 commodities, single-day snapshot, 2 markets. Does not 
cover most of the 12 business categories (e.g. nothing for textiles, 
handicrafts, mobile repair — makes sense, those aren't agri-commodities). 
Re-running the same download periodically would build a real price history 
if time permits, but not done for MVP.

**Next up:** Scheme documents / structured scheme data — waiting on Track 3 
to hand off structured scheme rules (per execution plan, this normally 
comes from Track 3's research, but confirming who owns the actual PDF 
sourcing).

## 2026-09-10 — DB schema, Neon Postgres setup, models.py tested

**What I did:**
- Created Neon Postgres project (free tier, serverless, region AWS Asia 
  Pacific 1 / Singapore — closest to India). Only Postgres service enabled.
- Added `DATABASE_URL` to `.env` at repo root (gitignored, confirmed never 
  committed)
- Wrote `backend/app/db/session.py` — SQLAlchemy engine + session setup, 
  tested and confirmed working (connects to Neon)
- Wrote `backend/app/db/models.py` based on the team's ER diagram — defines 
  `State → District → Block → Village → {Household, Business}`, 
  `BusinessCategory`, `Scheme`, `User`, `Assessment` (links User + Village + 
  Category + Scheme), using SQLAlchemy declarative `Base` from `session.py`
- Confirmed missing `__init__.py` files in `backend/`, `backend/app/`, 
  `backend/app/db/` — added empty ones so the 
  `from backend.app.db.session import ...` import pattern resolves reliably
- Verified `models.py` imports cleanly: 
  `python -c "from backend.app.db import models; print('Import OK')"`
- Wrote `backend/create_tables.py` (kept as a permanent reusable utility, 
  not a throwaway) — calls `models.Base.metadata.create_all(bind=engine)` to 
  create all tables from the schema
- Ran it against Neon, confirmed via SQL Editor 
  (`SELECT table_name FROM information_schema.tables WHERE 
  table_schema='public';`) — all 10 expected tables created: `states`, 
  `districts`, `blocks`, `villages`, `households`, `businesses`, 
  `business_categories`, `users`, `assessments`, `schemes`. Matches ER 
  diagram exactly.
- Found and fixed a gitignore gap: `__pycache__/` wasn't excluded, was 
  showing up as untracked in every branch — added it
- Pushed branch `track1/db-models-and-tables`, opened PR, merged

**Known limitation for team:**
- `households` table is structurally defined per the ER diagram but won't 
  be populated for MVP — cleaned Census data only has village-level 
  aggregates, not per-household records. Don't expect data there.
- Anyone recreating this DB from scratch (new Neon instance, or local 
  Postgres) can run `python -m backend.create_tables` once `.env` has a 
  valid `DATABASE_URL` — no manual SQL needed.
- Must be on personal hotspot, not college WiFi, for anything touching the 
  live DB — port 5432 is blocked on college network.

**Next up:** `backend/app/db/queries.py` — reusable query functions for 
engines/routers to call (e.g. get village by name, get schemes list). Then 
`backend/data_pipeline/load_to_postgres.py` to actually load the 4 cleaned 
CSVs into these tables — nothing is in the live DB yet, tables exist but 
are empty.



## 2026-09-11 — Seeded reference tables (state, district, blocks, categories)

**What I did:**
- Wrote seed functions in `load_to_postgres.py` for the 4 reference tables:
  `states`, `districts`, `blocks`, `business_categories`
- Seeded 1 state (Uttar Pradesh), 1 district (Mathura), 4 blocks (Chhata,
  Mat, Mahavan, Mathura — same Census Subdistt codes used in
  `clean_census.py`), and the 12 agreed business categories
- Each seed function checks for an existing row before inserting, so the
  script is idempotent — safe to re-run without creating duplicates
- Verified counts directly in Neon's SQL Editor: 1/1/4/12 rows respectively,
  matching expectations exactly
- `seed_blocks()` returns a `{census_subdistt_code: Block}` mapping — this
  is what step 3b (loading villages) will use to attach each village to the
  correct block via foreign key
- Pushed branch `track1/load-postgres`, opened PR, merged

**Next up:** Step 3b — load the actual 874 villages from
`mathura_villages_clean.csv` into the `villages` table, using the
`blocks_by_code` mapping this script already builds.


## 2026-09-11 — Loaded 874 Mathura villages into Postgres

**What I did:**
- Wrote `seed_villages()` in `load_to_postgres.py`, loading all 874 rows
  from `mathura_villages_clean.csv` into the `villages` table, linked to
  the correct block via the Census Subdistt code
- Computed `literacy_rate` as `literate_total / population_total`, set to
  `None` when population is 0 (avoids div-by-zero)
- First run died mid-way with a Neon connection drop (`server closed the
  connection unexpectedly`) — root cause was one giant 874-row transaction
  with only a single commit at the end, over an unstable hotspot connection
- Fixed by: adding `pool_pre_ping=True` + `pool_recycle=280` to the engine
  in `session.py`, and committing every 50 rows instead of once at the end.
  Re-run completed cleanly, no drops.
- Verified in Neon: `SELECT COUNT(*) FROM villages` → 874. Spot-checked
  top-5 by population and a `population = 0` query.
- Found 144 villages with `population = 0`. Checked against public Census
  figures for Mathura district (730 inhabited / 874 total villages) —
  874 - 730 = 144, exact match. These are genuinely uninhabited revenue
  villages (forest patches, land-record-only entries), not a data bug.
  Confidence flag for anyone querying this table: don't assume every
  village row has usable population data — check for 0/null first.
- Pushed branch `track1/load-villages`, PR up next.

**Next up:** load OSM business/competitor data (`mathura_osm_clean.csv`)
into the `businesses` table — same idempotent pattern, but needs a village
match strategy since OSM points aren't pre-linked to a specific village
(only lat/lon), unlike the villages CSV which already had Subdistt codes.

## [Today's date] — Fixed OSM business placement bug + documented village-coordinate limitation

**Bug found:** `seed_osm_businesses` was assigning ALL businesses to a single
hardcoded default village (`first_village` query had no ORDER BY, so it
non-deterministically picked one of a handful of villages across different
runs). Confirmed via Neon: 491 businesses were split across only 4 village_ids.

**Fix applied:** Rewrote `seed_osm_businesses` to match each business to its
nearest village by haversine distance, using real business lat/long against
all villages with coordinates. Removed the 100-row cap that was silently
dropping OSM rows past row 100.

**Limitation discovered during verification:** village-level "nearest" match
isn't fully meaningful — Census 2011 has no per-village coordinates, and our
OSM export has no `place` tags to fall back on (checked directly, confirmed
zero place features). All 874 villages share only 4 coordinate points (one
per block centroid, from the earlier clean_census.py work). Investigated
LGD/OSM-boundary as a real village-coordinate source (option 3) but decided
against it given competition timeline — chose to document the limitation
instead (option 1) rather than chase a new data source with uncertain payoff.

**Current state:** Businesses are correctly matched to their real BLOCK, but
the specific village_id within that block is only a representative, not the
business's true village. Documented as a KNOWN LIMITATION in the function's
docstring in load_to_postgres.py. Downstream consumers (feasibility engine,
/insights endpoint) should treat business→village linkage as block-level
accuracy, not village-level.

**Live data:** Re-ran loader after clearing the businesses table — 334 OSM
businesses now loaded (down from 491; duplicates by name were skipped, and
rows missing coordinates were excluded) correctly matched to real blocks.


## Step 15 — Sanity check: DB values vs. Census source data
**Date:** 2026-09-11
**Files touched:** `docs/work-log/data_n.md` (this entry only)
**What I did:**
Spot-checked 3 villages from `mathura_villages_clean.csv` against the
expected DB values to confirm `load_to_postgres.py → seed_villages()` maps
fields correctly.

Checked villages: **Mandora** (uninhabited), **Kamar** (large village),
**Hulwana** (mid-size village) — chosen to cover zero-population edge case,
high-population, and mid-range.

| Field | Mandora (id=123578) | Kamar (id=123579) | Hulwana (id=123580) |
|---|---|---|---|
| `population` | 0 | 7,031 | 3,457 |
| `household_count` | 0 | 1,153 | 573 |
| `literacy_rate` | `None` | 0.5362 | 0.5291 |

CSV→DB mapping verified by tracing `seed_villages()`:
- `Village.id` ← `village_code` column
- `Village.population` ← `population_total` column
- `Village.household_count` ← `households` column
- `Village.literacy_rate` ← `round(literate_total / population_total, 4)`,
  `None` when population = 0 (correctly guarded in code)

**Live DB verification SQL** (run in Neon SQL Editor to confirm):
```sql
SELECT id, name, population, household_count, literacy_rate
FROM villages
WHERE id IN (123578, 123579, 123580)
ORDER BY id;
```
Expected result:
```
123578 | Mandora | 0    | 0    | NULL
123579 | Kamar   | 7031 | 1153 | 0.5362
123580 | Hulwana | 3457 | 573  | 0.5291
```

Note: `.env` with `DATABASE_URL` is gitignored and must be created locally
before connecting. The mapping logic check above is code-level; run the SQL
above against your Neon instance to complete the live-DB half of this
verification.

**Why:** Downstream engines (feasibility scoring, competitor density) depend
on population and household counts being correct — a systematic loading bug
(e.g. wrong column mapped) would silently corrupt every feasibility
calculation.

**Status:** Done (code-level verified; SQL query provided for live-DB
confirmation by team member with Neon credentials)

## Step 16 — Handed off queries.py to backend_s
**Date:** 2026-09-11
**Files touched:** `backend/app/db/queries.py` (already written), `docs/work-log/data_n.md`
**What I did:** Messaged backend_s teammate that `queries.py` is live on
main and ready to use. Shared the key function signatures: `get_village_by_name`,
`search_villages`, `get_scheme_for_cost`, `count_competitors_in_catchment`,
`save_assessment`, `list_business_categories`. Noted they need the Neon
`DATABASE_URL` separately (not in repo).
**Why:** backend_s can't build engine logic against real data until they
know what query functions exist — this unblocks their feasibility engine work.
**Status:** Done