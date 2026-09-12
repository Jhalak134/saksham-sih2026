"""ai.providers package

Safe, isolated LLM provider adapters for the SAKSHAM AI/RAG microservice.
"""

from __future__ import annotations

from ai.providers.base import (
    BaseLLMProvider,
    LLMAuthenticationError,
    LLMNetworkError,
    LLMProviderError,
    LLMRateLimitError,
    LLMResponseFormatError,
    LLMTimeoutError,
    sanitize_secret,
)
from ai.providers.factory import (
    create_llm_provider,
    get_default_llm_callable,
    get_llm_provider,
)
from ai.providers.gemini_provider import GeminiProvider
from ai.providers.openai_provider import OpenAIProvider

__all__ = [
    "BaseLLMProvider",
    "LLMAuthenticationError",
    "LLMNetworkError",
    "LLMProviderError",
    "LLMRateLimitError",
    "LLMResponseFormatError",
    "LLMTimeoutError",
    "sanitize_secret",
    "OpenAIProvider",
    "GeminiProvider",
    "create_llm_provider",
    "get_llm_provider",
    "get_default_llm_callable",
]
