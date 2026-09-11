"""ai.py

Gateway router for conversational AI queries in the SAKSHAM platform.
Routes requests through the main backend to the decoupled AI microservice.
"""

from typing import Optional, Dict, Any
from fastapi import APIRouter, HTTPException, status
from pydantic import BaseModel, Field, field_validator

from backend.app.clients.ai_client import ai_client

router = APIRouter(prefix="/api/v1/ai", tags=["AI Advisory Gateway"])


class AIQueryRequest(BaseModel):
    query: str = Field(
        ...,
        min_length=1,
        max_length=2000,
        description="Natural language query from borrower or loan officer.",
    )
    language: str = Field(
        default="en",
        description="Preferred language: 'en', 'hi', or 'hinglish'.",
    )
    top_k: int = Field(
        default=5,
        ge=1,
        le=20,
        description="Maximum evidence chunks to retrieve (1-20).",
    )
    calculations: Optional[Dict[str, Any]] = Field(
        default=None,
        description="Optional pre-computed deterministic figures.",
    )

    @field_validator("query")
    @classmethod
    def validate_query_not_whitespace(_cls, v: str) -> str:
        trimmed = v.strip()
        if not trimmed:
            raise ValueError("query cannot be empty or whitespace only")
        return trimmed

    @field_validator("language")
    @classmethod
    def normalize_language(_cls, v: str) -> str:
        clean = v.strip().lower()
        if clean in ("english", "en"):
            return "en"
        if clean in ("hindi", "hi"):
            return "hi"
        if clean in ("hinglish",):
            return "hinglish"
        raise ValueError(f"Unsupported language '{v}'. Supported: 'en', 'hi', 'hinglish'.")


@router.post("/query", status_code=status.HTTP_200_OK)
async def query_ai(req: AIQueryRequest):
    """Gateway endpoint forwarding conversational inquiry to AI microservice.

    Does not fabricate grounded results if AI service is offline.
    """
    result = await ai_client.query_ai_service(
        query=req.query,
        language=req.language,
        top_k=req.top_k,
        calculations=req.calculations,
    )
    if not result.get("available"):
        detail_msg = result.get("error") or "AI advisory service is currently unavailable. Please try again later."
        raise HTTPException(
            status_code=status.HTTP_503_SERVICE_UNAVAILABLE,
            detail=detail_msg,
        )
    return result
