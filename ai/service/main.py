"""SAKSHAM AI Service — FastAPI Application.

Orchestrates the end-to-end RAG pipeline:
    API Request -> Query Parser -> Retrieval Query -> Retriever ->
    Evidence Pack -> Grounded Explanation -> Structured API Response

Preserves provenance, strict evidence boundaries, and data honesty rules.
Does NOT perform financial math or modify backend/frontend logic.
"""

from typing import Any
from fastapi import Depends, FastAPI, Request, status
from fastapi.exceptions import RequestValidationError
from fastapi.responses import JSONResponse

from ai.grounding.evidence_models import (
    EvidenceItemValidationError,
    EvidencePackValidationError,
)
from ai.grounding.evidence_pack import create_evidence_pack
from ai.prompts.explanation_models import ExplanationValidationError
from ai.prompts.explanation_prompt import GroundedExplainer
from ai.prompts.query_parser import ParserValidationError, QueryParser
from ai.providers import LLMProviderError, get_default_llm_callable
from ai.retrieval.retriever import KnowledgeRetriever, get_default_retriever
from ai.service.models import (
    ErrorResponse,
    HealthResponse,
    QueryRequest,
    QueryResponse,
)


class RetrievalServiceError(Exception):
    """Raised when the vector store retrieval operation fails."""


class AIServiceDependencies:
    """Container for injectable pipeline dependencies."""

    def __init__(
        self,
        parser: QueryParser | None = None,
        retriever: KnowledgeRetriever | None = None,
        explainer: GroundedExplainer | None = None,
    ) -> None:
        self.parser = parser
        self.retriever = retriever
        self.explainer = explainer


def get_parser(request: Request) -> QueryParser:
    """Dependency provider for QueryParser."""
    deps: AIServiceDependencies | None = getattr(request.app.state, "deps", None)
    if deps and deps.parser is not None:
        return deps.parser
    llm = get_default_llm_callable()
    return QueryParser(llm_callable=llm)


def get_retriever(request: Request) -> KnowledgeRetriever:
    """Dependency provider for KnowledgeRetriever."""
    deps: AIServiceDependencies | None = getattr(request.app.state, "deps", None)
    if deps and deps.retriever is not None:
        return deps.retriever
    return get_default_retriever()


def get_explainer(request: Request) -> GroundedExplainer:
    """Dependency provider for GroundedExplainer."""
    deps: AIServiceDependencies | None = getattr(request.app.state, "deps", None)
    if deps and deps.explainer is not None:
        return deps.explainer
    llm = get_default_llm_callable()
    return GroundedExplainer(llm_callable=llm, fallback_on_provider_error=True)


def run_ai_pipeline(
    request: QueryRequest,
    parser: QueryParser,
    retriever: KnowledgeRetriever,
    explainer: GroundedExplainer,
) -> QueryResponse:
    """Execute the end-to-end AI/RAG pipeline."""
    # 1. Parse natural-language user query
    parsed = parser.parse(request.query)

    # 2. Bridge to retrieval query
    retrieval_query = parsed.to_retrieval_query(top_k=request.top_k)

    # 3. Retrieve matching evidence chunks from knowledge base
    try:
        retrieval_results = retriever.retrieve(retrieval_query)
    except Exception as exc:
        raise RetrievalServiceError(f"Knowledge-base retrieval failed: {exc}") from exc

    # 4. Construct grounded EvidencePack with provenance and integrity rules
    evidence_pack = create_evidence_pack(
        query=parsed,
        retrieval_results=retrieval_results,
    )

    # 5. Generate grounded explanation
    explanation = explainer.explain(
        evidence_pack=evidence_pack,
        language=request.language,
        calculations=request.calculations,
    )

    # 6. Build structured API response
    return QueryResponse.from_pipeline(
        query=request.query,
        parsed_query=parsed,
        evidence_pack=evidence_pack,
        explanation=explanation,
    )


def register_exception_handlers(app: FastAPI) -> None:
    """Register strict error handlers preventing trace and path leakage."""

    @app.exception_handler(RequestValidationError)
    async def request_validation_handler(_: Request, exc: RequestValidationError) -> JSONResponse:
        return JSONResponse(
            status_code=status.HTTP_422_UNPROCESSABLE_CONTENT,
            content=ErrorResponse(
                error="Invalid Request",
                detail=str(exc),
                error_type="request_validation_error",
            ).model_dump(),
        )

    @app.exception_handler(ParserValidationError)
    async def parser_validation_handler(_: Request, exc: ParserValidationError) -> JSONResponse:
        return JSONResponse(
            status_code=status.HTTP_422_UNPROCESSABLE_CONTENT,
            content=ErrorResponse(
                error="Parser Validation Error",
                detail=str(exc),
                error_type="parser_validation_error",
            ).model_dump(),
        )

    @app.exception_handler(ValueError)
    async def value_error_handler(_: Request, exc: ValueError) -> JSONResponse:
        return JSONResponse(
            status_code=status.HTTP_400_BAD_REQUEST,
            content=ErrorResponse(
                error="Bad Request",
                detail=str(exc),
                error_type="value_error",
            ).model_dump(),
        )

    @app.exception_handler(RetrievalServiceError)
    async def retrieval_error_handler(_: Request, exc: RetrievalServiceError) -> JSONResponse:
        return JSONResponse(
            status_code=status.HTTP_503_SERVICE_UNAVAILABLE,
            content=ErrorResponse(
                error="Retrieval Failure",
                detail=str(exc),
                error_type="retrieval_error",
            ).model_dump(),
        )

    @app.exception_handler(EvidencePackValidationError)
    @app.exception_handler(EvidenceItemValidationError)
    async def evidence_pack_error_handler(
        _: Request, exc: EvidencePackValidationError | EvidenceItemValidationError
    ) -> JSONResponse:
        return JSONResponse(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            content=ErrorResponse(
                error="Evidence Grounding Error",
                detail=str(exc),
                error_type="evidence_pack_validation_error",
            ).model_dump(),
        )

    @app.exception_handler(ExplanationValidationError)
    async def explanation_error_handler(_: Request, exc: ExplanationValidationError) -> JSONResponse:
        return JSONResponse(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            content=ErrorResponse(
                error="Explanation Grounding Error",
                detail=str(exc),
                error_type="explanation_validation_error",
            ).model_dump(),
        )

    @app.exception_handler(LLMProviderError)
    async def llm_provider_error_handler(_: Request, exc: LLMProviderError) -> JSONResponse:
        return JSONResponse(
            status_code=status.HTTP_503_SERVICE_UNAVAILABLE,
            content=ErrorResponse(
                error="LLM Provider Error",
                detail=str(exc),
                error_type="llm_provider_error",
            ).model_dump(),
        )

    @app.exception_handler(Exception)
    async def global_exception_handler(_: Request, __: Exception) -> JSONResponse:
        return JSONResponse(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            content=ErrorResponse(
                error="Internal Server Error",
                detail="An unexpected internal error occurred while processing the request.",
                error_type="internal_server_error",
            ).model_dump(),
        )


def register_routes(app: FastAPI) -> None:
    """Register HTTP endpoints on application."""

    @app.get(
        "/health",
        response_model=HealthResponse,
        status_code=status.HTTP_200_OK,
        summary="Service and vector-store health status",
    )
    async def health_endpoint(
        retriever: KnowledgeRetriever = Depends(get_retriever),
    ) -> HealthResponse:
        try:
            count = retriever.collection.count()
            return HealthResponse(
                status="ok",
                vector_store="ready",
                chunk_count=count,
                version="1.0.0",
            )
        except Exception:
            return HealthResponse(
                status="degraded",
                vector_store="unavailable",
                chunk_count=None,
                version="1.0.0",
            )

    @app.post(
        "/query",
        response_model=QueryResponse,
        status_code=status.HTTP_200_OK,
        summary="Parse, retrieve, ground, and explain borrower inquiry",
    )
    @app.post(
        "/explain",
        response_model=QueryResponse,
        status_code=status.HTTP_200_OK,
        summary="Alias for /query endpoint",
    )
    async def query_endpoint(
        payload: QueryRequest,
        parser: QueryParser = Depends(get_parser),
        retriever: KnowledgeRetriever = Depends(get_retriever),
        explainer: GroundedExplainer = Depends(get_explainer),
    ) -> QueryResponse:
        return run_ai_pipeline(
            request=payload,
            parser=parser,
            retriever=retriever,
            explainer=explainer,
        )


def create_app(deps: AIServiceDependencies | None = None) -> FastAPI:
    """Application factory for SAKSHAM AI service."""
    application = FastAPI(
        title="SAKSHAM AI / RAG Service",
        description="Grounded AI microservice for borrower inquiry explanation and knowledge-base retrieval.",
        version="1.0.0",
    )
    application.state.deps = deps
    register_exception_handlers(application)
    register_routes(application)
    return application


app = create_app()
