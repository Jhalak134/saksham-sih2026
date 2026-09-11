"""
conftest.py — project root pytest configuration

Ensures the repo root is on sys.path so that `import backend.*`
works correctly regardless of how pytest is invoked.
"""

import sys
import os

# Add the repo root to sys.path so 'backend' is importable as a package
sys.path.insert(0, os.path.dirname(__file__))
