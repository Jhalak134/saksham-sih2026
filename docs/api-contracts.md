# SAKSHAM — API Contracts & Integration Specification

**Version:** 1.0.0 (SIH 2026 Problem Statement #91)  
**Target Consumers:** Frontend Engineering Team (Next.js / PWA) & AI / RAG Advisory Team  
**Architecture Principle:**  
$$\text{Data provides Evidence} \longrightarrow \text{Deterministic Backend Engines calculate} \longrightarrow \text{AI / RAG explains}$$

> [!IMPORTANT]
> **Zero LLM Math Rule**: The LLM must **NEVER** calculate loan eligibility, EMI, scheme thresholds, competitor counts, market prices, or the Fit Score. All calculations are executed deterministically by the FastAPI backend engines.

---

## 1. Global Standards & Base URLs

- **Local Backend Base URL:** `http://localhost:8000`
- **Swagger / OpenAPI Documentation:** `http://localhost:8000/docs`
- **Developer Test Interface:** `http://localhost:8000/`
- **Standard Content-Type:** `application/json`
- **Error Format:**
  ```json
  {
    "detail": "Descriptive error message"
  }
  ```

---

## 2. Core Assessment API

### `POST /api/v1/assess`
Orchestrates location resolution, competitor counting, 4-factor feasibility scoring, SIH #91 financial structuring, scheme routing, and AI advisory fallback.

#### Request Headers
```http
Content-Type: application/json
```

#### Request Payload
```json
{
  "location": "Kamar",
  "category": "Dairy",
  "capital": 100000.0,
  "idea": "Commercial dairy farm with chilling unit",
  "language": "en",
  "phone_or_email": "entrepreneur@saksham.gov.in"
}
```

| Field | Type | Required | Description |
| :--- | :--- | :--- | :--- |
| `location` | string | Yes | Village name (e.g. `"Kamar"`), Census code (e.g. `"123579"`), or search text |
| `category` | string | Yes | Business category: `"Dairy"`, `"Retail"`, `"Textiles"`, `"Food Processing"`, `"Agriculture"`, `"Logistics"`, `"Handicrafts"`, `"Education"` |
| `capital` | float | Yes | Entrepreneur's available margin capital in INR (e.g. `100000.0`) |
| `idea` | string | No | Optional business idea description for contextual AI advisory |
| `language` | string | No | Preferred response language: `"en"`, `"hi"` |
| `phone_or_email` | string | No | User identifier for profile linking |

#### Response Payload (`200 OK`)
```json
{
  "id": 1,
  "fitScore": 82.5,
  "confidence": "High",
  "rating": "Highly Feasible",
  "recommendation": "The proposed Dairy enterprise demonstrates strong market viability in Kamar...",
  "village": {
    "id": 123579,
    "name": "Kamar",
    "block_name": "Chhata",
    "district": "Mathura",
    "state": "Uttar Pradesh",
    "population": 12450,
    "households": 2100,
    "literacy_rate": 68.5
  },
  "category": {
    "id": 1,
    "name": "Dairy",
    "icon": "milk",
    "is_seasonal": false
  },
  "financial": {
    "available_margin": 100000.0,
    "project_cost": 1000000.0,
    "max_loan_amount": 900000.0,
    "recommended_project_size": 350000.0,
    "scheme_id": 2,
    "scheme_name": "Term Loan Scheme",
    "interest_rate": 8.0,
    "tenure_months": 84,
    "moratorium_months": 6,
    "monthly_emi": 14945.32,
    "total_repayment": 1165734.96,
    "total_interest": 265734.96,
    "estimated_monthly_revenue": 87500.0,
    "estimated_monthly_profit": 19250.0,
    "repayment_burden_ratio": 0.776,
    "repayment_burden_category": "Critical (>60% of profit)"
  },
  "feasibility": {
    "fit_score": 82.5,
    "rating": "Highly Feasible",
    "confidence_level": "High",
    "breakdown": {
      "market_opportunity": 85.0,
      "competition": 95.0,
      "capital_fit": 90.0,
      "infrastructure": 80.0
    },
    "scoring_rationale": {
      "market_opportunity": "Population catchment of 12,450 residents across 2,100 households. Literacy rate is 68.5%.",
      "competition": "Zero direct Dairy businesses mapped in Kamar. Unmet market demand.",
      "capital_fit": "Capital of INR 100,000 provides strong 10% margin for project up to INR 1,000,000.",
      "infrastructure": "Sub-district connectivity verified under Block Chhata."
    },
    "risks": [
      {
        "category": "Capital",
        "risk": "Lean working capital buffer increases vulnerability to delayed customer receivables.",
        "mitigation": "Apply for concessional Micro Finance with 3-month moratorium.",
        "severity": "High"
      }
    ]
  },
  "scheme": {
    "id": 2,
    "name": "Term Loan Scheme",
    "interest_rate": 8.0,
    "tenure_months": 84,
    "moratorium_months": 6
  },
  "ai_insights": {
    "recommendation": "The proposed Dairy enterprise demonstrates strong market viability in Kamar...",
    "source": "deterministic_fallback"
  },
  "competitor_count": 0,
  "status": "Exploring",
  "created_at": "2026-09-11T05:30:00Z"
}
```

---

## 3. Location Resolution API

### `POST /api/v1/locations/resolve`
Resolves an ambiguous user query into a canonical Census Village entity.

#### Request Payload
```json
{
  "query": "Kamar"
}
```

#### Response Payload (`200 OK`)
```json
{
  "query": "Kamar",
  "matched": true,
  "message": "Exact match for village 'Kamar'.",
  "village": {
    "id": 123579,
    "name": "Kamar",
    "block_name": "Chhata",
    "district": "Mathura",
    "state": "Uttar Pradesh",
    "population": 12450,
    "household_count": 2100,
    "literacy_rate": 68.5
  }
}
```

---

## 4. Financing Schemes & EMI Simulators

### `GET /api/v1/schemes`
Lists all active concessional credit schemes with terms and rules.

#### Response Payload (`200 OK`)
```json
[
  {
    "id": 1,
    "name": "Micro Finance Scheme",
    "max_project_cost": 140000.0,
    "max_loan_amount": 125000.0,
    "interest_rate": 6.5,
    "tenure_months": 36,
    "moratorium_months": 3,
    "margin_requirement": "10% own promoter contribution"
  },
  {
    "id": 2,
    "name": "Term Loan Scheme",
    "max_project_cost": 5000000.0,
    "max_loan_amount": 4500000.0,
    "interest_rate": 8.0,
    "tenure_months": 84,
    "moratorium_months": 6,
    "margin_requirement": "10% own promoter contribution"
  }
]
```

### `POST /api/v1/schemes/simulate-emi`
Interactive what-if EMI calculator.

#### Request Payload
```json
{
  "loan_amount": 125000.0,
  "interest_rate": 6.5,
  "tenure_months": 36,
  "moratorium_months": 3
}
```

#### Response Payload (`200 OK`)
```json
{
  "principal": 125000.0,
  "monthly_emi": 4148.65,
  "total_repayment": 136905.45,
  "total_interest": 11905.45,
  "repayment_months": 33
}
```

---

## 5. Hyper-Local Insights API

### `GET /api/v1/insights/{location}`
Returns trending business categories, demand rankings, and seasonality in the catchment.

#### Response Payload (`200 OK`)
```json
{
  "location": "Mathura",
  "categories": [
    {
      "name": "Dairy",
      "trend": 34,
      "sparkline": [12, 18, 22, 28, 34],
      "seasonality": "All-season"
    },
    {
      "name": "Food Processing",
      "trend": 28,
      "sparkline": [10, 14, 20, 24, 28],
      "seasonality": "Harvest cyclical"
    },
    {
      "name": "Textiles",
      "trend": 21,
      "sparkline": [8, 12, 15, 18, 21],
      "seasonality": "Festival peak"
    }
  ]
}
```

---

## 6. Authentication API

### `POST /api/v1/auth/login`
Lightweight OTP/Phone authentication for rural users.

#### Request Payload
```json
{
  "phone": "+919876543210"
}
```

#### Response Payload (`200 OK`)
```json
{
  "access_token": "mock-jwt-token-9876543210",
  "token_type": "bearer",
  "user": {
    "id": 1,
    "phone": "+919876543210",
    "home_location": "Mathura"
  }
}
```

---

## 7. Deterministic Mathematical Formulas

### A. Statutory Financing Formula (SIH #91)
$$\text{Project Cost} = \frac{\text{Available Margin Capital}}{10\%} = \text{Available Margin Capital} \times 10$$
$$\text{Maximum Eligible Loan} = \min(\text{Project Cost} \times 90\%, \;\text{Scheme Ceiling})$$

### B. Reducing-Balance EMI with Moratorium
$$\text{EMI} = P \times r \times \frac{(1+r)^n}{(1+r)^n - 1}$$
Where:
- $P$ = Principal Loan Amount
- $r = \frac{\text{Annual Interest Rate}}{12 \times 100}$
- $n = \text{Tenure Months} - \text{Moratorium Months}$

### C. 4-Factor Composite Feasibility Scoring
$$\text{Fit Score} = (S_{\text{market}} \times 0.30) + (S_{\text{comp}} \times 0.25) + (S_{\text{cap}} \times 0.25) + (S_{\text{infra}} \times 0.20)$$

| Score Range | Rating |
| :--- | :--- |
| $\ge 80.0$ | **Highly Feasible** |
| $65.0 - 79.9$ | **Feasible** |
| $50.0 - 64.9$ | **Moderate Fit** |
| $< 50.0$ | **High Risk** |
