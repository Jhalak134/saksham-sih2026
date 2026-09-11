"""
session.py

Sets up the SQLAlchemy engine and session for connecting to the Neon
Postgres database. Reads the connection string from the DATABASE_URL
environment variable (see .env, which is git-ignored).
"""

import os
from dotenv import load_dotenv
from sqlalchemy import create_engine
from sqlalchemy.orm import sessionmaker, declarative_base

# Load environment variables from .env at the repo root
load_dotenv()

DATABASE_URL = os.getenv("DATABASE_URL")

if not DATABASE_URL:
    raise RuntimeError(
        "DATABASE_URL is not set. Create a .env file in the repo root "
        "with: DATABASE_URL=postgresql://..."
    )

engine = create_engine(
    DATABASE_URL,
    pool_pre_ping=True,   # test each connection before using it, reconnect if it's gone stale
    pool_recycle=280,     # recycle connections before Neon's own timeout can kill them
)

SessionLocal = sessionmaker(autocommit=False, autoflush=False, bind=engine)

Base = declarative_base()


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