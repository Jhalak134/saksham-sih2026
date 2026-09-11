"""ai_client.py

Decoupled HTTP client for interacting with the SAKSHAM AI / RAG microservice.
Architectural Guarantee: Never raises a 500 error if the AI service is down or times out;
gracefully falls back to deterministic rule-based advice.
"""

import os
import logging
from typing import Dict, Any, Optional
import httpx

logger = logging.getLogger("saksham.clients.ai")

AI_SERVICE_URL = os.getenv("AI_SERVICE_URL", "http://localhost:8001").rstrip("/")
AI_REQUEST_TIMEOUT = float(os.getenv("AI_REQUEST_TIMEOUT", "5.0"))
AI_DEFAULT_TOP_K = int(os.getenv("AI_DEFAULT_TOP_K", "5"))


class AIClient:
    """HTTP client communicating with SAKSHAM AI microservice."""

    def __init__(
        self,
        base_url: Optional[str] = None,
        timeout: Optional[float] = None,
        default_top_k: Optional[int] = None,
    ) -> None:
        self.base_url = (base_url or os.getenv("AI_SERVICE_URL", AI_SERVICE_URL)).rstrip("/")
        self.timeout = timeout if timeout is not None else float(os.getenv("AI_REQUEST_TIMEOUT", str(AI_REQUEST_TIMEOUT)))
        self.default_top_k = default_top_k if default_top_k is not None else int(os.getenv("AI_DEFAULT_TOP_K", str(AI_DEFAULT_TOP_K)))

    @staticmethod
    def build_assessment_query(
        idea: Optional[str],
        category_name: str,
        village_name: str,
        margin: float,
    ) -> str:
        """Construct bounded natural-language query representing borrower inquiry."""
        clean_idea = (idea or "").strip()
        if clean_idea and clean_idea.lower() not in ("rural micro-enterprise unit", category_name.lower()):
            text = (
                f"Evaluate business feasibility, operational considerations, and financing scheme "
                f"guidelines for {clean_idea} in village {village_name} under the {category_name} "
                f"category with margin capital of INR {margin:,.0f}."
            )
        else:
            text = (
                f"Explain the business feasibility, market demand factors, and government financing "
                f"schemes for setting up a {category_name} unit in village {village_name} with "
                f"margin capital of INR {margin:,.0f}."
            )
        return text[:2000]

    @staticmethod
    def build_calculations_payload(
        project_cost: float,
        loan_amount: float,
        monthly_emi: float,
        scheme_name: str,
        interest_rate: Optional[float] = None,
        tenure_months: Optional[int] = None,
        moratorium_months: Optional[int] = None,
        fit_score: Optional[float] = None,
        rating: Optional[str] = None,
        repayment_burden_category: Optional[str] = None,
    ) -> Dict[str, Any]:
        """Construct deterministic calculations dictionary without PII."""
        payload: Dict[str, Any] = {
            "project_cost": round(project_cost, 2),
            "max_loan_amount": round(loan_amount, 2),
            "monthly_emi": round(monthly_emi, 2),
            "scheme_name": scheme_name,
        }
        if interest_rate is not None:
            payload["interest_rate"] = round(interest_rate, 2)
        if tenure_months is not None:
            payload["tenure_months"] = int(tenure_months)
        if moratorium_months is not None:
            payload["moratorium_months"] = int(moratorium_months)
        if fit_score is not None:
            payload["fit_score"] = round(fit_score, 1)
        if rating is not None:
            payload["rating"] = rating
        if repayment_burden_category is not None:
            payload["repayment_burden_category"] = repayment_burden_category
        return payload

    @staticmethod
    def _parse_success_response(data: Dict[str, Any]) -> Dict[str, Any]:
        """Map Task 7 QueryResponse into backend structured dictionary."""
        detail = data.get("explanation_detail", {})
        explanation = data.get("explanation") or detail.get("answer", "")
        key_points = detail.get("key_points", [])
        return {
            "available": True,
            "source": "ai_service",
            "summary": explanation,
            "explanation": explanation,
            "recommendation": explanation,
            "key_points": key_points,
            "citations": data.get("citations", []),
            "limitations": data.get("limitations", []),
            "warnings": data.get("warnings", []),
            "grounding_status": data.get("grounding_status", "grounded"),
            "retrieval_status": data.get("retrieval_status", "success"),
            "evidence_available": data.get("evidence_available", True),
            "result_count": data.get("result_count", len(data.get("citations", []))),
            "parsed_query": data.get("parsed_query"),
            "swot": {
                "strengths": key_points[:2] if key_points else ["Verified against official scheme records."],
                "weaknesses": data.get("limitations", [])[:2],
                "opportunities": ["Structured financing available through official channel."],
                "threats": data.get("warnings", [])[:2],
            },
        }

    async def query_ai_service(
        self,
        query: str,
        language: str = "en",
        top_k: Optional[int] = None,
        calculations: Optional[Dict[str, Any]] = None,
    ) -> Dict[str, Any]:
        """Execute HTTP query to AI microservice matching Task 7 QueryRequest contract."""
        clean_query = query.strip()
        if not clean_query:
            return {
                "available": False,
                "source": "client_validation_error",
                "error": "Query cannot be empty or whitespace only",
                "explanation": "",
                "recommendation": "",
                "citations": [],
                "limitations": ["Query rejected: empty input."],
                "warnings": [],
                "grounding_status": "unverified",
                "retrieval_status": "error",
                "evidence_available": False,
            }

        clamped_top_k = max(1, min(20, int(top_k if top_k is not None else self.default_top_k)))
        payload: Dict[str, Any] = {
            "query": clean_query[:2000],
            "language": language,
            "top_k": clamped_top_k,
        }
        if calculations is not None:
            payload["calculations"] = calculations

        url = f"{self.base_url}/query"
        try:
            async with httpx.AsyncClient(timeout=self.timeout) as client:
                resp = await client.post(url, json=payload)
                if resp.status_code == 200:
                    return self._parse_success_response(resp.json())

                logger.warning("AI service returned non-200 status code: %s", resp.status_code)
                return {
                    "available": False,
                    "source": "ai_service_http_error",
                    "status_code": resp.status_code,
                    "error": f"AI service HTTP {resp.status_code}",
                    "explanation": "",
                    "recommendation": "",
                    "citations": [],
                    "limitations": [f"AI service returned status code {resp.status_code}."],
                    "warnings": [],
                    "grounding_status": "unverified",
                    "retrieval_status": "error",
                    "evidence_available": False,
                }
        except Exception as exc:
            logger.info("AI service request failed (%s). Using fallback or reporting offline.", type(exc).__name__)
            return {
                "available": False,
                "source": "ai_service_connection_error",
                "error": f"AI service unreachable: {type(exc).__name__}",
                "explanation": "",
                "recommendation": "",
                "citations": [],
                "limitations": ["AI advisory service unreachable."],
                "warnings": [],
                "grounding_status": "unverified",
                "retrieval_status": "unavailable",
                "evidence_available": False,
            }

    @staticmethod
    def _build_deterministic_fallback(
        category_name: str,
        village_name: str,
        fit_score: float,
        scheme_name: str,
        monthly_emi: float,
        project_cost: float,
        language: str = "en",
    ) -> Dict[str, Any]:
        """Construct rule-based fallback advisory when AI service is unavailable."""
        is_hindi = language.lower().startswith("hi")
        if fit_score >= 75.0:
            summary = (
                f"{category_name} in {village_name} demonstrates strong economic viability ({fit_score:.1f}/100). "
                f"Qualifies for {scheme_name} with an estimated EMI of ₹{monthly_emi:,.0f}/mo."
            ) if not is_hindi else (
                f"{village_name} में {category_name} व्यवसाय {fit_score:.1f}/100 स्कोर के साथ बहुत अनुकूल है। "
                f"यह {scheme_name} के तहत अनुमानित मासिक ईएमआई ₹{monthly_emi:,.0f} का पात्र है।"
            )
        else:
            summary = (
                f"{category_name} in {village_name} shows moderate viability ({fit_score:.1f}/100). "
                f"Careful working capital management advised."
            ) if not is_hindi else (
                f"{village_name} में {category_name} मध्यम अनुकूलता ({fit_score:.1f}/100) प्रदर्शित करता है।"
            )

        recommendation = (
            f"Apply under {scheme_name} with ₹{project_cost * 0.10:,.0f} own contribution. "
            f"Maintain 30-day working capital reserve."
        ) if not is_hindi else (
            f"{scheme_name} के तहत ₹{project_cost * 0.10:,.0f} के स्वयं के अंशदान के साथ आवेदन करें।"
        )

        return {
            "available": False,
            "source": "deterministic_fallback",
            "summary": summary,
            "explanation": summary,
            "recommendation": recommendation,
            "key_points": [summary, recommendation],
            "citations": [],
            "limitations": ["AI advisory service currently unavailable; rule-based summary provided."],
            "warnings": ["AI service offline — explanation is generated via deterministic business rules."],
            "grounding_status": "unverified",
            "retrieval_status": "unavailable",
            "evidence_available": False,
            "parsed_query": None,
            "swot": {
                "strengths": [f"High local demand base for {category_name}", f"Access to {scheme_name}"],
                "weaknesses": ["Working capital vulnerability in initial 3 months"],
                "opportunities": ["Tie-up with local haats and SHG distribution networks"],
                "threats": ["Local raw material price fluctuations"],
            },
        }

    async def get_assessment_insights(
        self,
        idea: str,
        category_name: str,
        village_name: str,
        fit_score: float,
        rating: str,
        project_cost: float,
        loan_amount: float,
        scheme_name: str,
        monthly_emi: float,
        interest_rate: Optional[float] = None,
        tenure_months: Optional[int] = None,
        moratorium_months: Optional[int] = None,
        repayment_burden_category: Optional[str] = None,
        language: str = "en",
    ) -> Dict[str, Any]:
        """High-level assessment explanation orchestrator with graceful fallback."""
        query = self.build_assessment_query(
            idea=idea,
            category_name=category_name,
            village_name=village_name,
            margin=project_cost * 0.10,
        )
        calculations = self.build_calculations_payload(
            project_cost=project_cost,
            loan_amount=loan_amount,
            monthly_emi=monthly_emi,
            scheme_name=scheme_name,
            interest_rate=interest_rate,
            tenure_months=tenure_months,
            moratorium_months=moratorium_months,
            fit_score=fit_score,
            rating=rating,
            repayment_burden_category=repayment_burden_category,
        )
        ai_result = await self.query_ai_service(
            query=query,
            language=language,
            calculations=calculations,
        )
        if ai_result.get("available"):
            return ai_result

        return self._build_deterministic_fallback(
            category_name=category_name,
            village_name=village_name,
            fit_score=fit_score,
            scheme_name=scheme_name,
            monthly_emi=monthly_emi,
            project_cost=project_cost,
            language=language,
        )


ai_client = AIClient()

