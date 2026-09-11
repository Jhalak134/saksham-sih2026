"""
conftest.py — project root pytest configuration

1. Adds the repo root to sys.path so `import backend.*` works.
2. Loads backend/.env before any test imports, so DATABASE_URL is
   available when session.py is imported during DB-fixture setup.
   Tests that don't touch the DB at all won't be affected.
"""

import sys
import os
from pathlib import Path

# Add the repo root to sys.path so 'backend' is importable as a package
sys.path.insert(0, os.path.dirname(__file__))

# Load root .env (for DATABASE_URL) and backend/.env (for JWT_SECRET_KEY)
from dotenv import load_dotenv  # noqa: E402
load_dotenv(Path(__file__).parent / ".env")
load_dotenv(Path(__file__).parent / "backend" / ".env")
