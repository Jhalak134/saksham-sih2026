"""
ai_client.py

Decoupled HTTP client for interacting with the AI / RAG microservice.
Architectural Guarantee: Never raises a 500 error if AI service is down or times out;
gracefully falls back to deterministic rule-based advice.
"""

import os
import logging
from typing import Dict, Any, Optional

logger = logging.getLogger("saksham.clients.ai")

AI_SERVICE_URL = os.getenv("AI_SERVICE_URL", "http://localhost:8001").rstrip("/")
AI_REQUEST_TIMEOUT = float(os.getenv("AI_REQUEST_TIMEOUT", "3.0"))


class AIClient:
    def __init__(self, base_url: str = AI_SERVICE_URL, timeout: float = AI_REQUEST_TIMEOUT):
        self.base_url = base_url
        self.timeout = timeout

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
        language: str = "en",
    ) -> Dict[str, Any]:
        """Call external AI service or fallback to deterministic advisory."""
        try:
            import httpx
            async with httpx.AsyncClient(timeout=self.timeout) as client:
                payload = {
                    "idea": idea,
                    "category": category_name,
                    "village": village_name,
                    "fit_score": fit_score,
                    "rating": rating,
                    "project_cost": project_cost,
                    "loan_amount": loan_amount,
                    "scheme_name": scheme_name,
                    "monthly_emi": monthly_emi,
                    "language": language,
                }
                resp = await client.post(f"{self.base_url}/api/v1/explain", json=payload)
                if resp.status_code == 200:
                    data = resp.json()
                    return {
                        "available": True,
                        "summary": data.get("summary"),
                        "recommendation": data.get("recommendation"),
                        "swot": data.get("swot"),
                    }
        except Exception as exc:
            logger.info(f"AI service offline or timed out ({exc}). Using deterministic fallback.")

        # Deterministic fallback advisory
        is_hindi = language.lower().startswith("hi")
        if fit_score >= 75.0:
            summary = (
                f"{category_name} in {village_name} demonstrates strong economic viability ({fit_score}/100). "
                f"Qualifies for {scheme_name} with an estimated EMI of ₹{monthly_emi:,.0f}/mo."
            ) if not is_hindi else (
                f"{village_name} में {category_name} व्यवसाय {fit_score}/100 स्कोर के साथ बहुत अनुकूल है। "
                f"यह {scheme_name} के तहत अनुमानित मासिक ईएमआई ₹{monthly_emi:,.0f} का पात्र है।"
            )
        else:
            summary = (
                f"{category_name} in {village_name} shows moderate viability ({fit_score}/100). "
                f"Careful working capital management advised."
            ) if not is_hindi else (
                f"{village_name} में {category_name} मध्यम अनुकूलता ({fit_score}/100) प्रदर्शित करता है।"
            )

        recommendation = (
            f"Apply under {scheme_name} with ₹{project_cost*0.10:,.0f} own contribution. "
            f"Maintain 30-day working capital reserve."
        )

        return {
            "available": False,
            "summary": summary,
            "recommendation": recommendation,
            "swot": {
                "strengths": [f"High local demand base for {category_name}", f"Access to {scheme_name}"],
                "weaknesses": ["Working capital vulnerability in initial 3 months"],
                "opportunities": ["Tie-up with local haats and SHG distribution networks"],
                "threats": ["Local raw material price fluctuations"],
            },
        }


ai_client = AIClient()
