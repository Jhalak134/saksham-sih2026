"""openai_provider.py

OpenAI-compatible REST LLM provider adapter using httpx.
Supports OpenAI, Azure OpenAI, Groq, vLLM, and any OpenAI-compatible API.
Enforces zero-secret exposure, bounded retries, and structured JSON output.
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


class OpenAIProvider(BaseLLMProvider):
    """OpenAI-compatible chat completions provider."""

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
        self.api_key = api_key or os.getenv("OPENAI_API_KEY", "")
        self.base_url = (base_url or os.getenv("OPENAI_BASE_URL") or os.getenv("LLM_BASE_URL") or "https://api.openai.com/v1").rstrip("/")
        self.model = model or os.getenv("OPENAI_MODEL") or os.getenv("LLM_MODEL") or "gpt-4o-mini"
        
        raw_timeout = timeout if timeout is not None else float(os.getenv("LLM_REQUEST_TIMEOUT", "10.0"))
        self.timeout = max(1.0, min(raw_timeout, 60.0))

        raw_retries = max_retries if max_retries is not None else int(os.getenv("LLM_MAX_RETRIES", "2"))
        self.max_retries = max(0, min(raw_retries, 3))

        raw_tokens = max_tokens if max_tokens is not None else int(os.getenv("LLM_MAX_TOKENS", "1024"))
        self.max_tokens = max(128, min(raw_tokens, 4096))

        self.temperature = max(0.0, min(temperature, 1.0))
        self._injected_client = client

    def _get_client(self) -> httpx.Client:
        if self._injected_client is not None:
            return self._injected_client
        return httpx.Client(timeout=self.timeout)

    def call(self, system_prompt: str, user_prompt: str) -> str:
        """Invoke chat completion endpoint with strict error handling and bounded retry."""
        if not self.api_key or not self.api_key.strip():
            raise LLMAuthenticationError("API key not configured for OpenAI provider")

        url = f"{self.base_url}/chat/completions"
        headers = {
            "Authorization": f"Bearer {self.api_key.strip()}",
            "Content-Type": "application/json",
        }
        payload = {
            "model": self.model,
            "messages": [
                {"role": "system", "content": system_prompt},
                {"role": "user", "content": user_prompt},
            ],
            "temperature": self.temperature,
            "max_tokens": self.max_tokens,
            "response_format": {"type": "json_object"},
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
                last_error = LLMTimeoutError(f"OpenAI request timed out after {self.timeout}s: {exc}", self.api_key)
            except httpx.NetworkError as exc:
                last_error = LLMNetworkError(f"OpenAI network error: {exc}", self.api_key)
            except Exception as exc:
                raise LLMProviderError(f"Unexpected OpenAI provider error: {exc}", self.api_key) from exc
            finally:
                if close_after:
                    client.close()

            if attempt < self.max_retries:
                time.sleep(0.01 * (2 ** attempt))

        raise last_error or LLMProviderError("OpenAI call failed with unknown error", self.api_key)

    def _handle_response(self, response: httpx.Response) -> str:
        """Evaluate HTTP response status and extract assistant text content."""
        code = response.status_code
        if code in (401, 403):
            raise LLMAuthenticationError(
                f"OpenAI authentication failed with status {code}: unauthorized or invalid credentials",
                self.api_key,
            )
        if code == 429:
            raise LLMRateLimitError(
                f"OpenAI rate limit exceeded (status 429)",
                self.api_key,
            )
        if 500 <= code < 600:
            raise LLMProviderError(
                f"OpenAI server error with status {code}",
                self.api_key,
            )
        if 400 <= code < 500:
            raise LLMProviderError(
                f"OpenAI request failed with status {code}",
                self.api_key,
            )

        try:
            data = response.json()
        except Exception as exc:
            raise LLMResponseFormatError(
                f"OpenAI returned non-JSON response: {exc}",
                self.api_key,
            ) from exc

        choices = data.get("choices")
        if not isinstance(choices, list) or len(choices) == 0:
            raise LLMResponseFormatError("OpenAI response contains no choices", self.api_key)

        first_choice = choices[0]
        if not isinstance(first_choice, dict):
            raise LLMResponseFormatError("OpenAI choice is not a valid dict", self.api_key)

        message = first_choice.get("message")
        if not isinstance(message, dict):
            raise LLMResponseFormatError("OpenAI message is not a valid dict", self.api_key)

        content = message.get("content")
        if content is None or not str(content).strip():
            raise LLMResponseFormatError("OpenAI returned empty message content", self.api_key)

        return str(content)
