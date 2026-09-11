"""
backend/app/main.py

FastAPI application entry point for the SAKSHAM platform.

Run locally:
    uvicorn backend.app.main:app --reload --port 8000

The backend/.env file must contain:
    DATABASE_URL=postgresql://...
    JWT_SECRET_KEY=<strong-random-secret>
"""

import os
from dotenv import load_dotenv

load_dotenv()  # load backend/.env before anything else

from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware

from backend.app.routers import auth as auth_router

# ── Application ───────────────────────────────────────────────────────────────

app = FastAPI(
    title="SAKSHAM API",
    description=(
        "AI-driven hyper-local business advisory and financial structuring "
        "assistant for rural micro-entrepreneurs. SIH Problem Statement #91."
    ),
    version="0.1.0",
    docs_url="/docs",
    redoc_url="/redoc",
)

# ── CORS ──────────────────────────────────────────────────────────────────────
# Allow the Next.js dev server and production origin.
# Extend ALLOWED_ORIGINS in .env for additional environments.

_raw_origins = os.getenv(
    "ALLOWED_ORIGINS",
    "http://localhost:3000,http://127.0.0.1:3000",
)
_allowed_origins = [o.strip() for o in _raw_origins.split(",") if o.strip()]

app.add_middleware(
    CORSMiddleware,
    allow_origins=_allowed_origins,
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# ── Routers ───────────────────────────────────────────────────────────────────

app.include_router(auth_router.router)

# Future routers — uncomment as they are implemented:
# from backend.app.routers import assess, location, insights, schemes
# app.include_router(assess.router)
# app.include_router(location.router)
# app.include_router(insights.router)
# app.include_router(schemes.router)


# ── Health Check ──────────────────────────────────────────────────────────────

@app.get("/health", tags=["meta"])
def health() -> dict:
    """Quick liveness check — no DB query."""
    return {"status": "ok", "service": "saksham-api"}
