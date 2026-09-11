"""
Database session and SQLAlchemy configuration.

Database credentials are loaded from the DATABASE_URL environment variable.
Never hardcode database credentials in source code.
"""

import os

from dotenv import load_dotenv
from sqlalchemy import create_engine
from sqlalchemy.orm import DeclarativeBase, Session, sessionmaker

load_dotenv()

DATABASE_URL = os.getenv("DATABASE_URL")

if not DATABASE_URL:
    raise RuntimeError(
        "DATABASE_URL is not set. "
        "Create backend/.env or export DATABASE_URL before starting the backend."
    )


class Base(DeclarativeBase):
    """Base class for all SQLAlchemy models."""
    pass


engine = create_engine(
    DATABASE_URL,
    pool_pre_ping=True,
)

SessionLocal = sessionmaker(
    bind=engine,
    class_=Session,
    autoflush=False,
    autocommit=False,
)


def get_db():
    """
    Provide a database session for a request.

    The session is always closed after the request finishes.
    """
    db = SessionLocal()
    try:
        yield db
    finally:
        db.close()