"""factory.py

Factory functions for instantiating and configuring LLM providers.
Detects configured credentials from environment and exposes injectable callables.
"""

from __future__ import annotations

import os
from typing import Any, Callable

from ai.providers.base import BaseLLMProvider, LLMProviderError
from ai.providers.gemini_provider import GeminiProvider
from ai.providers.openai_provider import OpenAIProvider

def load_runtime_env() -> bool:
    """Discover and load environment variables from project .env if present."""
    from dotenv import find_dotenv, load_dotenv

    env_path = find_dotenv()
    if env_path:
        load_dotenv(env_path)
        return True
    return False


load_runtime_env()


def create_llm_provider(provider_type: str, **kwargs: Any) -> BaseLLMProvider:
    """Create a specific LLM provider instance by type name."""
    norm_type = provider_type.strip().lower()
    if norm_type in ("openai", "openai_compatible", "groq", "azure"):
        return OpenAIProvider(**kwargs)
    if norm_type in ("gemini", "google"):
        return GeminiProvider(**kwargs)
    raise LLMProviderError(f"Unsupported LLM provider type: '{provider_type}'")


def get_llm_provider() -> BaseLLMProvider | None:
    """Detect and instantiate a configured LLM provider from environment variables.

    Precedence:
    1. OPENAI_API_KEY -> OpenAIProvider
    2. GEMINI_API_KEY or GOOGLE_API_KEY -> GeminiProvider
    3. None configured -> returns None
    """
    openai_key = os.getenv("OPENAI_API_KEY")
    if openai_key and openai_key.strip():
        return OpenAIProvider()

    gemini_key = os.getenv("GEMINI_API_KEY") or os.getenv("GOOGLE_API_KEY")
    if gemini_key and gemini_key.strip():
        return GeminiProvider()

    return None


def get_default_llm_callable() -> Callable[[str, str], str] | None:
    """Return a callable provider interface if one is configured in the environment."""
    provider = get_llm_provider()
    if provider is not None:
        return provider.__call__
    return None
