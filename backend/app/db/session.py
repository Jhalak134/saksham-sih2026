"""
session.py

Sets up the SQLAlchemy engine and session for connecting to the Neon
Postgres database. Reads the connection string from the DATABASE_URL
environment variable (see .env, which is git-ignored).
"""

import os
from dotenv import load_dotenv
from sqlalchemy import create_engine
from sqlalchemy.orm import sessionmaker, DeclarativeBase

# Load environment variables from .env at the repo root
load_dotenv()

DATABASE_URL = os.getenv("DATABASE_URL")

if not DATABASE_URL:
    raise RuntimeError(
        "DATABASE_URL is not set. Create a .env file in the repo root "
        "with: DATABASE_URL=postgresql://..."
    )

# Fallback to psycopg v3 if psycopg2 DLL is blocked or unavailable on Windows
if DATABASE_URL.startswith("postgresql://") and "+psycopg" not in DATABASE_URL:
    try:
        import psycopg2
    except (ImportError, Exception):
        DATABASE_URL = DATABASE_URL.replace("postgresql://", "postgresql+psycopg://", 1)

is_sqlite = DATABASE_URL.startswith("sqlite")
connect_args = {"check_same_thread": False} if is_sqlite else {}
engine_kwargs = {"pool_pre_ping": True}
if not is_sqlite:
    engine_kwargs["pool_recycle"] = 280

engine = create_engine(
    DATABASE_URL,
    connect_args=connect_args,
    **engine_kwargs
)

SessionLocal = sessionmaker(autocommit=False, autoflush=False, bind=engine)


class Base(DeclarativeBase):
    """Base class for all SQLAlchemy models."""
    pass


def get_db():
    """
    FastAPI dependency — yields a DB session and ensures it's closed
    after the request finishes, even if an error occurs.
    """
    db = SessionLocal()
    try:
        yield db
    finally:
        db.close()