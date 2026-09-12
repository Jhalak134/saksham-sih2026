"""test_providers.py

Unit tests for LLM provider adapters (<500 LOC).
Verifies:
- Secret sanitization
- OpenAIProvider (success, auth error, timeout, network error, rate limit, 5xx, malformed, retry backoff)
- GeminiProvider (success, auth error, timeout, network error, rate limit, 5xx, malformed)
- Provider factory (create_llm_provider, get_llm_provider, get_default_llm_callable)
"""

from __future__ import annotations

import json
import pytest
import httpx

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


class TestSecretSanitization:
    """Verifies that API keys, tokens, and secrets are masked in errors and logs."""

    def test_sanitize_secret_masks_provided_secret(self) -> None:
        raw = "Failed with key sk-proj-1234567890abcdef in header"
        sanitized = sanitize_secret(raw, "sk-proj-1234567890abcdef")
        assert "sk-proj-1234567890abcdef" not in sanitized
        assert "***REDACTED***" in sanitized

    def test_sanitize_secret_regex_masks_bearer_and_keys(self) -> None:
        raw = "Authorization: Bearer my_secret_token_123456789 and key=my_api_key_abcdefgh123"
        sanitized = sanitize_secret(raw)
        assert "my_secret_token_123456789" not in sanitized
        assert "my_api_key_abcdefgh123" not in sanitized
        assert "Bearer ***REDACTED***" in sanitized

    def test_sanitize_secret_empty_or_none(self) -> None:
        assert sanitize_secret("") == ""
        assert sanitize_secret("normal error text", None) == "normal error text"


class TestOpenAIProvider:
    """Verifies OpenAI-compatible chat completions provider mechanics."""

    def test_missing_api_key_raises_auth_error(self, monkeypatch: pytest.MonkeyPatch) -> None:
        monkeypatch.delenv("OPENAI_API_KEY", raising=False)
        provider = OpenAIProvider(api_key="")
        with pytest.raises(LLMAuthenticationError, match="API key not configured"):
            provider.call("sys", "user")

    def test_successful_response_parsed(self) -> None:
        resp_payload = {
            "choices": [{
                "message": {"role": "assistant", "content": '{"answer": "Grounded response"}'},
                "finish_reason": "stop",
            }]
        }
        mock_transport = httpx.MockTransport(
            lambda req: httpx.Response(200, json=resp_payload)
        )
        client = httpx.Client(transport=mock_transport)
        provider = OpenAIProvider(api_key="sk-test-key", client=client)

        result = provider("sys", "user")
        assert result == '{"answer": "Grounded response"}'

    def test_authentication_error_401(self) -> None:
        mock_transport = httpx.MockTransport(
            lambda req: httpx.Response(401, json={"error": "Invalid API key"})
        )
        client = httpx.Client(transport=mock_transport)
        provider = OpenAIProvider(api_key="sk-invalid", client=client)

        with pytest.raises(LLMAuthenticationError, match="unauthorized or invalid"):
            provider("sys", "user")

    def test_rate_limit_error_429(self) -> None:
        mock_transport = httpx.MockTransport(
            lambda req: httpx.Response(429, json={"error": "Rate limit reached"})
        )
        client = httpx.Client(transport=mock_transport)
        provider = OpenAIProvider(api_key="sk-test", client=client, max_retries=0)

        with pytest.raises(LLMRateLimitError, match="rate limit exceeded"):
            provider("sys", "user")

    def test_server_error_500(self) -> None:
        mock_transport = httpx.MockTransport(
            lambda req: httpx.Response(500, json={"error": "Internal server error"})
        )
        client = httpx.Client(transport=mock_transport)
        provider = OpenAIProvider(api_key="sk-test", client=client, max_retries=0)

        with pytest.raises(LLMProviderError, match="server error with status 500"):
            provider("sys", "user")

    def test_client_error_404(self) -> None:
        mock_transport = httpx.MockTransport(
            lambda req: httpx.Response(404, json={"error": "Model not found"})
        )
        client = httpx.Client(transport=mock_transport)
        provider = OpenAIProvider(api_key="sk-test", client=client, max_retries=0)

        with pytest.raises(LLMProviderError, match="failed with status 404"):
            provider("sys", "user")

    def test_timeout_exception(self) -> None:
        def raise_timeout(req: httpx.Request) -> httpx.Response:
            raise httpx.ReadTimeout("Read timed out")

        mock_transport = httpx.MockTransport(raise_timeout)
        client = httpx.Client(transport=mock_transport)
        provider = OpenAIProvider(api_key="sk-test", client=client, max_retries=0)

        with pytest.raises(LLMTimeoutError, match="timed out"):
            provider("sys", "user")

    def test_network_exception(self) -> None:
        def raise_network(req: httpx.Request) -> httpx.Response:
            raise httpx.ConnectError("Connection refused")

        mock_transport = httpx.MockTransport(raise_network)
        client = httpx.Client(transport=mock_transport)
        provider = OpenAIProvider(api_key="sk-test", client=client, max_retries=0)

        with pytest.raises(LLMNetworkError, match="network error"):
            provider("sys", "user")

    def test_malformed_non_json_response(self) -> None:
        mock_transport = httpx.MockTransport(
            lambda req: httpx.Response(200, text="<html>502 Bad Gateway</html>")
        )
        client = httpx.Client(transport=mock_transport)
        provider = OpenAIProvider(api_key="sk-test", client=client)

        with pytest.raises(LLMResponseFormatError, match="non-JSON response"):
            provider("sys", "user")

    def test_malformed_response_structures(self) -> None:
        test_cases = [
            ({"choices": []}, "no choices"),
            ({"choices": ["not_a_dict"]}, "not a valid dict"),
            ({"choices": [{"message": "not_a_dict"}]}, "message is not a valid dict"),
            ({"choices": [{"message": {"content": ""}}]}, "empty message content"),
            ({"choices": [{"message": {"content": None}}]}, "empty message content"),
        ]
        for bad_body, match_str in test_cases:
            mock_transport = httpx.MockTransport(
                lambda req, b=bad_body: httpx.Response(200, json=b)  # type: ignore
            )
            client = httpx.Client(transport=mock_transport)
            provider = OpenAIProvider(api_key="sk-test", client=client)
            with pytest.raises(LLMResponseFormatError, match=match_str):
                provider("sys", "user")

    def test_retry_success_after_transient_failure(self) -> None:
        calls = 0

        def flaky_handler(req: httpx.Request) -> httpx.Response:
            nonlocal calls
            calls += 1
            if calls == 1:
                return httpx.Response(503, json={"error": "Service overloaded"})
            return httpx.Response(200, json={
                "choices": [{"message": {"role": "assistant", "content": "Recovered"}}]
            })

        mock_transport = httpx.MockTransport(flaky_handler)
        client = httpx.Client(transport=mock_transport)
        provider = OpenAIProvider(api_key="sk-test", client=client, max_retries=2)

        res = provider("sys", "user")
        assert res == "Recovered"
        assert calls == 2

    def test_config_parameter_bounds(self) -> None:
        provider = OpenAIProvider(
            api_key="sk-test",
            timeout=100.0,
            max_retries=10,
            max_tokens=10000,
            temperature=-0.5,
        )
        assert provider.timeout == 60.0
        assert provider.max_retries == 3
        assert provider.max_tokens == 4096
        assert provider.temperature == 0.0


class TestGeminiProvider:
    """Verifies Google Gemini REST API provider mechanics."""

    def test_missing_api_key_raises_auth_error(self, monkeypatch: pytest.MonkeyPatch) -> None:
        monkeypatch.delenv("GEMINI_API_KEY", raising=False)
        monkeypatch.delenv("GOOGLE_API_KEY", raising=False)
        provider = GeminiProvider(api_key="")
        with pytest.raises(LLMAuthenticationError, match="API key not configured"):
            provider.call("sys", "user")

    def test_successful_response_parsed(self) -> None:
        resp_payload = {
            "candidates": [{
                "content": {
                    "parts": [{"text": '{"answer": "Gemini grounded explanation"}'}],
                },
                "finishReason": "STOP",
            }]
        }
        mock_transport = httpx.MockTransport(
            lambda req: httpx.Response(200, json=resp_payload)
        )
        client = httpx.Client(transport=mock_transport)
        provider = GeminiProvider(api_key="gemini-test-key", client=client)

        result = provider("sys", "user")
        assert result == '{"answer": "Gemini grounded explanation"}'

    def test_authentication_error_403(self) -> None:
        mock_transport = httpx.MockTransport(
            lambda req: httpx.Response(403, json={"error": "API key blocked"})
        )
        client = httpx.Client(transport=mock_transport)
        provider = GeminiProvider(api_key="gemini-blocked", client=client)

        with pytest.raises(LLMAuthenticationError, match="unauthorized or invalid"):
            provider("sys", "user")

    def test_rate_limit_error_429(self) -> None:
        mock_transport = httpx.MockTransport(
            lambda req: httpx.Response(429, json={"error": "Quota exhausted"})
        )
        client = httpx.Client(transport=mock_transport)
        provider = GeminiProvider(api_key="gemini-key", client=client, max_retries=0)

        with pytest.raises(LLMRateLimitError, match="rate limit exceeded"):
            provider("sys", "user")

    def test_server_error_503(self) -> None:
        mock_transport = httpx.MockTransport(
            lambda req: httpx.Response(503, json={"error": "Service Unavailable"})
        )
        client = httpx.Client(transport=mock_transport)
        provider = GeminiProvider(api_key="gemini-key", client=client, max_retries=0)

        with pytest.raises(LLMProviderError, match="server error with status 503"):
            provider("sys", "user")

    def test_client_error_400(self) -> None:
        mock_transport = httpx.MockTransport(
            lambda req: httpx.Response(400, json={"error": "Bad request format"})
        )
        client = httpx.Client(transport=mock_transport)
        provider = GeminiProvider(api_key="gemini-key", client=client, max_retries=0)

        with pytest.raises(LLMProviderError, match="failed with status 400"):
            provider("sys", "user")

    def test_timeout_exception(self) -> None:
        def raise_timeout(req: httpx.Request) -> httpx.Response:
            raise httpx.ReadTimeout("Timeout from Gemini")

        mock_transport = httpx.MockTransport(raise_timeout)
        client = httpx.Client(transport=mock_transport)
        provider = GeminiProvider(api_key="gemini-key", client=client, max_retries=0)

        with pytest.raises(LLMTimeoutError, match="timed out"):
            provider("sys", "user")

    def test_network_exception(self) -> None:
        def raise_network(req: httpx.Request) -> httpx.Response:
            raise httpx.ConnectError("Gemini DNS failure")

        mock_transport = httpx.MockTransport(raise_network)
        client = httpx.Client(transport=mock_transport)
        provider = GeminiProvider(api_key="gemini-key", client=client, max_retries=0)

        with pytest.raises(LLMNetworkError, match="network error"):
            provider("sys", "user")

    def test_malformed_structures(self) -> None:
        test_cases = [
            ({"candidates": []}, "no candidates"),
            ({"candidates": ["invalid"]}, "not a valid dict"),
            ({"candidates": [{"content": "invalid"}]}, "content is not a valid dict"),
            ({"candidates": [{"content": {"parts": []}}]}, "no parts"),
            ({"candidates": [{"content": {"parts": ["invalid"]}}]}, "part is not a valid dict"),
            ({"candidates": [{"content": {"parts": [{"text": ""}]}}]}, "empty text content"),
            ({"candidates": [{"content": {"parts": [{"text": None}]}}]}, "empty text content"),
        ]
        for bad_body, match_str in test_cases:
            mock_transport = httpx.MockTransport(
                lambda req, b=bad_body: httpx.Response(200, json=b)  # type: ignore
            )
            client = httpx.Client(transport=mock_transport)
            provider = GeminiProvider(api_key="gemini-key", client=client)
            with pytest.raises(LLMResponseFormatError, match=match_str):
                provider("sys", "user")

    def test_non_json_response(self) -> None:
        mock_transport = httpx.MockTransport(
            lambda req: httpx.Response(200, text="Bad gateway raw text")
        )
        client = httpx.Client(transport=mock_transport)
        provider = GeminiProvider(api_key="gemini-key", client=client)

        with pytest.raises(LLMResponseFormatError, match="non-JSON response"):
            provider("sys", "user")


class TestProviderFactory:
    """Verifies factory instantiation, precedence, and default callable creation."""

    def test_create_llm_provider_by_name(self) -> None:
        p_openai = create_llm_provider("openai", api_key="sk-test")
        assert isinstance(p_openai, OpenAIProvider)

        p_gemini = create_llm_provider("gemini", api_key="gemini-test")
        assert isinstance(p_gemini, GeminiProvider)

        with pytest.raises(LLMProviderError, match="Unsupported LLM provider type"):
            create_llm_provider("unknown_provider")

    def test_get_llm_provider_precedence(self, monkeypatch: pytest.MonkeyPatch) -> None:
        monkeypatch.delenv("OPENAI_API_KEY", raising=False)
        monkeypatch.delenv("GEMINI_API_KEY", raising=False)
        monkeypatch.delenv("GOOGLE_API_KEY", raising=False)
        assert get_llm_provider() is None
        assert get_default_llm_callable() is None

        # OpenAI takes precedence
        monkeypatch.setenv("OPENAI_API_KEY", "sk-live-test")
        p = get_llm_provider()
        assert isinstance(p, OpenAIProvider)
        assert get_default_llm_callable() is not None

        # Gemini when OpenAI is absent
        monkeypatch.delenv("OPENAI_API_KEY")
        monkeypatch.setenv("GEMINI_API_KEY", "gemini-live-test")
        p2 = get_llm_provider()
        assert isinstance(p2, GeminiProvider)

    def test_provider_default_client_and_unexpected_exception(self) -> None:
        # Default client creation
        p_openai = OpenAIProvider(api_key="sk-test")
        c1 = p_openai._get_client()
        assert isinstance(c1, httpx.Client)
        c1.close()

        p_gemini = GeminiProvider(api_key="gemini-test")
        c2 = p_gemini._get_client()
        assert isinstance(c2, httpx.Client)
        c2.close()

        # Unexpected generic exception
        def raise_runtime(req: httpx.Request) -> httpx.Response:
            raise RuntimeError("Unexpected boom")

        mock_transport = httpx.MockTransport(raise_runtime)
        client = httpx.Client(transport=mock_transport)

        p_err_openai = OpenAIProvider(api_key="sk-test", client=client)
        with pytest.raises(LLMProviderError, match="Unexpected OpenAI provider error"):
            p_err_openai("sys", "user")

        p_err_gemini = GeminiProvider(api_key="gemini-test", client=client)
        with pytest.raises(LLMProviderError, match="Unexpected Gemini provider error"):
            p_err_gemini("sys", "user")

    def test_gemini_retry_success_after_transient_failure(self) -> None:
        calls = 0

        def flaky_gemini(req: httpx.Request) -> httpx.Response:
            nonlocal calls
            calls += 1
            if calls == 1:
                return httpx.Response(503, json={"error": "Gemini overloaded"})
            return httpx.Response(200, json={
                "candidates": [{
                    "content": {"parts": [{"text": "Recovered Gemini"}]},
                    "finishReason": "STOP",
                }]
            })

        client = httpx.Client(transport=httpx.MockTransport(flaky_gemini))
        provider = GeminiProvider(api_key="gemini-test", client=client, max_retries=2)
        res = provider("sys", "user")
        assert res == "Recovered Gemini"
        assert calls == 2

    def test_provider_default_client_execution(self, monkeypatch: pytest.MonkeyPatch) -> None:
        def mock_post(self_client: httpx.Client, url: str, **kwargs: object) -> httpx.Response:
            if "chat/completions" in str(url):
                return httpx.Response(200, json={"choices": [{"message": {"content": "ok_openai"}}]})
            return httpx.Response(200, json={"candidates": [{"content": {"parts": [{"text": "ok_gemini"}]}}]})

        monkeypatch.setattr(httpx.Client, "post", mock_post)

        p1 = OpenAIProvider(api_key="sk-test")
        assert p1("sys", "user") == "ok_openai"

        p2 = GeminiProvider(api_key="gemini-test")
        assert p2("sys", "user") == "ok_gemini"

    def test_load_runtime_env(self, monkeypatch: pytest.MonkeyPatch) -> None:
        import ai.providers.factory as f

        assert f.load_runtime_env() is True

        monkeypatch.setattr("dotenv.find_dotenv", lambda: "")
        assert f.load_runtime_env() is False
