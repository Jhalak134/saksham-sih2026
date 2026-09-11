# SAKSHAM — Data Coverage Report
_Generated: 11 September 2026_

> This report summarises the real data backing the SAKSHAM platform.
> All figures come directly from the live PostgreSQL database.

## Geographic Coverage

| Level      | Count |
|------------|-------|
| States     | 1 |
| Districts  | 1 |
| Blocks     | 4 |
| Villages   | 874 |

## Village Data Quality

| Status            | Villages | % of total |
|-------------------|----------|------------|
| Inhabited (pop>0) | 730 | 83% |
| Uninhabited       | 144 | 16% |

### Confidence Levels

| Level    | Villages | % of total | Meaning |
|----------|----------|------------|---------|
| [High] High   | 565 | 64% | Census data + OSM coverage |
| [Medium] Medium | 269 | 30% | One signal missing |
| [Low] Low    | 40 | 4% | No population or OSM data |

## Business / Competitor Data (OpenStreetMap)

- **Total mapped businesses:** 334
- **Source:** OpenStreetMap (collected via Overpass API)
- **Coverage note:** OSM data is denser in Mathura city / Vrindavan
  (religious tourism areas) than in rural villages — consistent with
  known rural mapping gaps. Villages in sparse blocks are flagged [Medium]/[Low].

### Businesses by Block

| Block | Mapped Businesses |
|-------|-------------------|
| Mathura | 177 |
| Mat | 120 |
| Mahavan | 37 |
| Chhata | 0 [!] sparse coverage |

## Business Categories

| Category | Mapped Businesses |
|----------|-------------------|
| Grocery/Retail | 293 |
| Food Processing | 41 |
| Logistics | 0 |
| Handicrafts | 0 |
| Restaurant | 0 |
| Poultry | 0 |
| Textiles | 0 |
| Dairy Product Processing | 0 |
| Retail | 0 |
| Flour Mill | 0 |
| Mobile Repair | 0 |
| Agri-input Store | 0 |
| Vegetable Trading | 0 |
| Tailoring | 0 |
| Agriculture | 0 |
| Education | 0 |
| Dairy | 0 |

## Financing Schemes in Database

| Scheme | Max Project Cost | Max Loan | Interest | Tenure |
|--------|-----------------|----------|----------|--------|
| Micro Finance Scheme | Rs.140,000 | Rs.125,000 | 6.5% p.a. | 36 months |
| Term Loan Scheme | Rs.5,000,000 | Rs.4,500,000 | 8.0% p.a. | 84 months |

## Market Price Data

- **Source:** Agmarknet via data.gov.in API
- **Coverage:** Mathura district (Mathura APMC, Kosikalan APMC)
- **Commodities:** Tomato, Green Chilli, Paddy (Common), Onion, Potato, Wheat
- **Limitation:** Single-day snapshot (point-in-time, not historical).
  All price records are marked `is_snapshot=True` in the cleaned CSV.
  Re-running `clean_market_prices.py` fetches a fresh day's prices.

## Census Data Summary (Mathura District, 2011)

| Metric | Value |
|--------|-------|
| Total population (all villages) | 1,791,191 |
| Total households | 292,881 |
| Average literacy rate (inhabited villages) | 57.7% |
| Data year | 2011 |
| Data source | Census of India 2011 |

---

_All data is sourced from official government datasets (Census 2011,_
_Agmarknet) and OpenStreetMap. No data was invented or estimated._
_Confidence levels reflect actual data availability, not assumptions._