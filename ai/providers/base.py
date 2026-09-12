"""base.py

Core abstract base classes and exception hierarchy for LLM providers.
Enforces zero-secret leakage, structured exceptions, and callable interface.
"""

from __future__ import annotations

from abc import ABC, abstractmethod
import re
from typing import Any


def sanitize_secret(text: str, secret: str | None = None) -> str:
    """Strip secrets, tokens, and API keys from error messages and logs."""
    if not text:
        return ""
    sanitized = text
    if secret and secret.strip():
        sanitized = sanitized.replace(secret, "***REDACTED***")
    sanitized = re.sub(r"(Bearer\s+)[A-Za-z0-9_\-\.]{8,}", r"\1***REDACTED***", sanitized)
    sanitized = re.sub(r"(key=)[A-Za-z0-9_\-\.]{8,}", r"\1***REDACTED***", sanitized, flags=re.IGNORECASE)
    sanitized = re.sub(r"(x-goog-api-key['\":\s=]+)[A-Za-z0-9_\-\.]{8,}", r"\1***REDACTED***", sanitized, flags=re.IGNORECASE)
    return sanitized


class LLMProviderError(Exception):
    """Base exception for all LLM provider failures."""

    def __init__(self, message: str, secret_to_mask: str | None = None) -> None:
        clean_message = sanitize_secret(message, secret_to_mask)
        super().__init__(clean_message)


class LLMAuthenticationError(LLMProviderError):
    """Raised when authentication fails (HTTP 401/403 or missing API key)."""


class LLMTimeoutError(LLMProviderError):
    """Raised when the provider request exceeds configured timeout."""


class LLMRateLimitError(LLMProviderError):
    """Raised when the provider returns HTTP 429 rate limit exceeded."""


class LLMNetworkError(LLMProviderError):
    """Raised when connectivity, DNS, or socket errors occur."""


class LLMResponseFormatError(LLMProviderError):
    """Raised when the provider returns malformed, empty, or unparseable output."""


class BaseLLMProvider(ABC):
    """Abstract interface for LLM provider adapters.

    Provides callable interface compatible with Callable[[str, str], str | dict[str, Any]].
    """

    @abstractmethod
    def call(self, system_prompt: str, user_prompt: str) -> str:
        """Invoke provider with system and user prompts, returning raw response text."""

    def __call__(self, system_prompt: str, user_prompt: str) -> str:
        """Enables direct injection into llm_callable parameter seams."""
        return self.call(system_prompt, user_prompt)
