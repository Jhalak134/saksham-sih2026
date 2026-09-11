# Data Requirements

## Project

AI-Driven Hyper-Local Business Advisory and Financial Structuring Assistant for Rural Micro-Entrepreneurs

## Purpose

This document defines the data required to build the Hyper-Local Business Feasibility module.

The system will use this data to analyze a proposed business based on:

- Geographic location
- Local population and demographics
- Nearby businesses and competitors
- Infrastructure and accessibility
- Local market and price information
- Business-specific requirements and risks

---

# 1. Location Data

## Purpose

Location data is required to identify the user's village/block/district and calculate the 5–10 km area around the selected location.

## Required Fields

| Field | Description |
|---|---|
| village | Name of village |
| block | Block/sub-district |
| district | District name |
| state | State name |
| latitude | Geographic latitude |
| longitude | Geographic longitude |
| pincode | Postal code, if available |

## Used For

- Identifying the user's location
- Finding nearby villages
- 5 km radius analysis
- 10 km radius analysis
- Mapping businesses and facilities
- Calculating geographic distances

## Possible Sources

- Census of India
- Government Open Data Platform (data.gov.in)
- OpenStreetMap
- Other official geographic datasets

---

# 2. Demographic Data

## Purpose

Demographic data will help estimate the potential consumer base and understand the local population.

## Required Fields

| Field | Description |
|---|---|
| location_id | Unique location identifier |
| population | Total population |
| households | Number of households |
| male_population | Male population, if available |
| female_population | Female population, if available |
| age_groups | Population by age group, if available |
| workers | Number of workers |
| cultivators | Number of cultivators |
| agricultural_labourers | Number of agricultural labourers |
| household_industry_workers | Workers in household industries |
| literacy | Literacy information |

## Used For

- Estimating consumer base
- Understanding local economic activity
- Identifying target customer groups
- Business opportunity analysis
- Comparing nearby areas

## Possible Sources

- Census of India
- Government Open Data Platform (data.gov.in)
- District Census Handbooks

---

# 3. Local Business / Competitor Data

## Purpose

Business data will help estimate the number and density of existing businesses near the user's proposed business location.

## Required Fields

| Field | Description |
|---|---|
| business_id | Unique business identifier |
| business_name | Name of business, if available |
| business_category | Type of business |
| village | Village/locality |
| block | Block |
| district | District |
| latitude | Geographic latitude |
| longitude | Geographic longitude |
| source | Source of business information |
| collection_date | Date when data was collected |

## Example Categories

- Dairy
- Grocery/Retail
- Poultry
- Tailoring
- Food Processing
- Restaurant
- Mobile Repair
- Agri-input Store
- Handicrafts
- Flour Mill

## Used For

- Competitor mapping
- Competitor density estimation
- Market saturation estimation
- Opportunity analysis
- Identifying underserved areas

## Possible Sources

- OpenStreetMap
- Permitted business/location APIs
- Government business datasets
- Manually verified local data

## Important Limitation

Business datasets may not contain every business in a rural area.

Therefore, the system should describe the result as:

"Estimated mapped competitors"

rather than:

"Total competitors."

---

# 4. Infrastructure and Local Amenities Data

## Purpose

Infrastructure data will help determine accessibility and the business environment of the selected location.

## Required Fields

| Field | Description |
|---|---|
| location_id | Unique location identifier |
| banks | Nearby banking facilities |
| schools | Nearby educational institutions |
| healthcare | Nearby healthcare facilities |
| markets | Nearby markets |
| roads | Road/connectivity information |
| electricity | Electricity availability, if available |
| water | Water availability, if available |
| communication | Communication/internet information, if available |

## Used For

- Accessibility analysis
- Business feasibility
- Supply chain analysis
- Financial accessibility
- Risk identification

## Possible Sources

- District Census Handbooks
- Census of India
- data.gov.in
- OpenStreetMap
- Other government datasets

---

# 5. Market and Price Data

## Purpose

Market and price data will help estimate local market value and develop indicative pricing recommendations.

## Required Fields

| Field | Description |
|---|---|
| product | Product/commodity name |
| market | Market name |
| district | District |
| date | Date of price observation |
| minimum_price | Minimum recorded price |
| maximum_price | Maximum recorded price |
| modal_price | Modal/representative price |
| unit | Unit such as kg, litre, etc. |
| source | Data source |

## Used For

- Market value estimation
- Pricing analysis
- Price trend analysis
- Opportunity analysis
- Seasonal analysis

## Possible Sources

- Government agricultural market datasets
- data.gov.in
- Relevant government departments

## Important Limitation

Market prices change over time.

Every price record should therefore store its date and source.

---

# 6. Agriculture and Livestock Data

## Purpose

Agriculture and livestock data will be particularly useful for businesses such as dairy, poultry, farming, food processing and agri-input businesses.

## Required Fields

| Field | Description |
|---|---|
| location_id | Unique location identifier |
| crop_information | Relevant crop information |
| livestock_population | Livestock population |
| cattle_population | Cattle population, if available |
| buffalo_population | Buffalo population, if available |
| agricultural_activity | Main agricultural activities |
| production_information | Relevant production information |

## Used For

- Dairy feasibility
- Poultry feasibility
- Agriculture-related business analysis
- Raw material availability
- Supply chain analysis

## Possible Sources

- Government agriculture datasets
- Livestock census/data
- data.gov.in
- Relevant state government departments

---

# 7. Weather and Seasonal Data

## Purpose

Weather and seasonal information can help identify environmental and seasonal risks.

## Required Fields

| Field | Description |
|---|---|
| location_id | Location identifier |
| date | Observation date |
| rainfall | Rainfall |
| temperature | Temperature |
| season | Season |
| other_weather_indicators | Other relevant indicators |

## Used For

- Seasonal demand analysis
- Agriculture-related risk analysis
- Supply chain risk
- Weather-related threats

## Possible Sources

- Government meteorological datasets
- Government agriculture datasets
- Other reliable public datasets

---

# 8. Business Knowledge Data

## Purpose

Business knowledge describes the general requirements of different business categories.

Unlike demographic or location data, this information describes the business itself.

## Required Fields

| Field | Description |
|---|---|
| business_category | Business type |
| typical_investment | Typical investment range |
| equipment | Required equipment |
| raw_materials | Required inputs |
| working_capital | Working capital requirements |
| distribution_channels | Possible distribution channels |
| target_customers | Typical customer groups |
| risks | Common business risks |
| seasonality | Seasonal characteristics |
| pricing_information | General pricing information |

## Initial Business Categories

1. Dairy
2. Poultry
3. Grocery/Retail
4. Vegetable Trading
5. Food Processing
6. Tailoring
7. Handicrafts
8. Mobile Repair
9. Agri-input Store
10. Restaurant
11. Flour Mill
12. Dairy Product Processing

## Possible Sources

- Government business/MSME resources
- Government scheme/business guidelines
- Agricultural and rural development reports
- Expert-validated information
- Manually curated information

---

# 9. Data Source and Quality Information

Every important dataset should maintain information about its source.

## Required Metadata

| Field | Description |
|---|---|
| source | Where the data came from |
| source_url | URL of the source |
| year | Year of the dataset |
| collection_date | Date collected, if applicable |
| last_updated | Last update date, if known |
| data_quality | Quality/confidence assessment |

## Principles

1. Prefer official government sources.
2. Store the source of important information.
3. Store the year/date of the data.
4. Clearly distinguish estimates from verified information.
5. Do not present old data as current data.
6. Do not treat incomplete business listings as a complete list of competitors.
7. Do not allow the AI to invent missing numerical data.

---

## 10. Initial Pilot Region

* State: Uttar Pradesh
* District: Mathura
* Initial geographic scope: Villages within Mathura district
* Purpose: Build and test the MVP using a manageable geographic region before scaling to additional districts and states.
* Census demographic data: Census 2011
* Current datasets: Will be added separately with their source and collection/update date.


---

# 11. Final Data Flow

The data layer will eventually provide information to the feasibility engine:

Location
    ↓
Nearby locations within 5–10 km
    ↓
Demographic data
    +
Business/competitor data
    +
Infrastructure data
    +
Market/price data
    +
Agriculture/livestock data
    +
Weather/seasonal data
    +
Business knowledge
    ↓
Hyper-Local Feasibility Analysis

## Raw Data Setup — Census

The raw Census file is **not committed to this repo** — it's 318MB, well over 
GitHub's 100MB file size limit, and is excluded via `.gitignore`.

To run `clean_census.py` yourself:

1. Source: Census of India — Primary Census Abstract, Village/Town/Ward level data
2. File: `2011-IndiaStateDistSbDistVill-0000.xlsx`
3. Download from: https://censusindia.gov.in/census.website/
4. Place it at: `backend/data_pipeline/raw/2011-IndiaStateDistSbDistVill-0000.xlsx`
5. Run: `python clean_census.py` (from inside `backend/data_pipeline/`)

Output: `cleaned/mathura_villages_clean.csv` (874 villages) and 
`cleaned/mathura_summaries_clean.csv` (district/sub-district rollups).