"""gemini_provider.py

Google Gemini REST LLM provider adapter using httpx.
Supports Gemini 1.5 Flash and Pro via direct v1beta API.
Enforces header-based authentication, bounded retries, and JSON output.
"""

from __future__ import annotations

import os
import time
from typing import Any
import httpx

from ai.providers.base import (
    BaseLLMProvider,
    LLMAuthenticationError,
    LLMNetworkError,
    LLMProviderError,
    LLMRateLimitError,
    LLMResponseFormatError,
    LLMTimeoutError,
)


class GeminiProvider(BaseLLMProvider):
    """Google Gemini REST API provider."""

    def __init__(
        self,
        api_key: str | None = None,
        base_url: str | None = None,
        model: str | None = None,
        timeout: float | None = None,
        max_retries: int | None = None,
        max_tokens: int | None = None,
        temperature: float = 0.0,
        client: httpx.Client | None = None,
    ) -> None:
        self.api_key = api_key or os.getenv("GEMINI_API_KEY") or os.getenv("GOOGLE_API_KEY", "")
        self.base_url = (base_url or os.getenv("GEMINI_BASE_URL") or "https://generativelanguage.googleapis.com/v1beta").rstrip("/")
        self.model = model or os.getenv("GEMINI_MODEL") or "gemini-3.6-flash"

        raw_timeout = timeout if timeout is not None else float(os.getenv("LLM_REQUEST_TIMEOUT", "30.0"))
        self.timeout = max(1.0, min(raw_timeout, 60.0))

        raw_retries = max_retries if max_retries is not None else int(os.getenv("LLM_MAX_RETRIES", "2"))
        self.max_retries = max(0, min(raw_retries, 3))

        raw_tokens = max_tokens if max_tokens is not None else int(os.getenv("LLM_MAX_TOKENS", "4096"))
        self.max_tokens = max(128, min(raw_tokens, 8192))

        self.temperature = max(0.0, min(temperature, 1.0))
        self._injected_client = client

    def _get_client(self) -> httpx.Client:
        if self._injected_client is not None:
            return self._injected_client
        return httpx.Client(timeout=self.timeout)

    def call(self, system_prompt: str, user_prompt: str) -> str:
        """Invoke generateContent endpoint with header authentication and bounded retry."""
        if not self.api_key or not self.api_key.strip():
            raise LLMAuthenticationError("API key not configured for Gemini provider")

        url = f"{self.base_url}/models/{self.model}:generateContent"
        headers = {
            "x-goog-api-key": self.api_key.strip(),
            "Content-Type": "application/json",
        }
        payload = {
            "system_instruction": {
                "parts": [{"text": system_prompt}]
            },
            "contents": [
                {
                    "role": "user",
                    "parts": [{"text": user_prompt}]
                }
            ],
            "generationConfig": {
                "temperature": self.temperature,
                "maxOutputTokens": self.max_tokens,
                "responseMimeType": "application/json",
            },
        }

        last_error: Exception | None = None

        for attempt in range(self.max_retries + 1):
            client = self._get_client()
            close_after = self._injected_client is None
            try:
                response = client.post(url, json=payload, headers=headers)
                return self._handle_response(response)
            except (LLMAuthenticationError, LLMResponseFormatError):
                raise
            except (LLMTimeoutError, LLMNetworkError, LLMRateLimitError, LLMProviderError) as exc:
                last_error = exc
            except httpx.TimeoutException as exc:
                last_error = LLMTimeoutError(f"Gemini request timed out after {self.timeout}s: {exc}", self.api_key)
            except httpx.NetworkError as exc:
                last_error = LLMNetworkError(f"Gemini network error: {exc}", self.api_key)
            except Exception as exc:
                raise LLMProviderError(f"Unexpected Gemini provider error: {exc}", self.api_key) from exc
            finally:
                if close_after:
                    client.close()

            if attempt < self.max_retries:
                time.sleep(0.01 * (2 ** attempt))

        raise last_error or LLMProviderError("Gemini call failed with unknown error", self.api_key)

    def _handle_response(self, response: httpx.Response) -> str:
        """Evaluate HTTP response status and extract candidate text content."""
        code = response.status_code
        if code in (401, 403):
            raise LLMAuthenticationError(
                f"Gemini authentication failed with status {code}: unauthorized or invalid credentials",
                self.api_key,
            )
        if code == 429:
            raise LLMRateLimitError(
                f"Gemini rate limit exceeded (status 429)",
                self.api_key,
            )
        if 500 <= code < 600:
            raise LLMProviderError(
                f"Gemini server error with status {code}",
                self.api_key,
            )
        if 400 <= code < 500:
            raise LLMProviderError(
                f"Gemini request failed with status {code}",
                self.api_key,
            )

        try:
            data = response.json()
        except Exception as exc:
            raise LLMResponseFormatError(
                f"Gemini returned non-JSON response: {exc}",
                self.api_key,
            ) from exc

        candidates = data.get("candidates")
        if not isinstance(candidates, list) or len(candidates) == 0:
            raise LLMResponseFormatError("Gemini response contains no candidates", self.api_key)

        first_candidate = candidates[0]
        if not isinstance(first_candidate, dict):
            raise LLMResponseFormatError("Gemini candidate is not a valid dict", self.api_key)

        content = first_candidate.get("content")
        if not isinstance(content, dict):
            raise LLMResponseFormatError("Gemini candidate content is not a valid dict", self.api_key)

        parts = content.get("parts")
        if not isinstance(parts, list) or len(parts) == 0:
            raise LLMResponseFormatError("Gemini content has no parts", self.api_key)

        first_part = parts[0]
        if not isinstance(first_part, dict):
            raise LLMResponseFormatError("Gemini part is not a valid dict", self.api_key)

        text = first_part.get("text")
        if text is None or not str(text).strip():
            raise LLMResponseFormatError("Gemini returned empty text content", self.api_key)

        return str(text)
