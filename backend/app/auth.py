"""
backend/app/auth.py

Authentication utilities for the SAKSHAM platform.

Password hashing uses bcrypt directly (no passlib wrapper).
JWT tokens use python-jose with HS256.

Never store or log plaintext passwords.
Never return password_hash in API responses.
Never hardcode secrets.
"""

import os
from datetime import datetime, timedelta, timezone
from typing import Optional

import bcrypt
from jose import JWTError, jwt

# ── Password Hashing ──────────────────────────────────────────────────────────

def hash_password(plain: str) -> str:
    """
    Hash a plaintext password using bcrypt.

    Raises:
        ValueError: If the password is empty or whitespace-only.
    """
    if not plain or not plain.strip():
        raise ValueError("Password must not be empty.")
    hashed_bytes = bcrypt.hashpw(plain.encode("utf-8"), bcrypt.gensalt())
    return hashed_bytes.decode("utf-8")


def verify_password(plain: str, hashed: str) -> bool:
    """
    Verify a plaintext password against a stored bcrypt hash.

    Returns False (not an exception) if:
    - The password is wrong
    - The hash is None (pre-auth legacy users with NULL password_hash)
    - Any encoding/format issue occurs
    """
    if not plain or not hashed:
        return False
    try:
        return bcrypt.checkpw(plain.encode("utf-8"), hashed.encode("utf-8"))
    except Exception:
        return False


# ── JWT Tokens ────────────────────────────────────────────────────────────────

_JWT_SECRET = os.getenv("JWT_SECRET_KEY")
_JWT_ALGORITHM = "HS256"
_ACCESS_TOKEN_EXPIRE_HOURS = 8  # short-lived; adjust as needed


def _get_secret() -> str:
    """
    Retrieve the JWT secret, raising a clear error if not configured.
    Called lazily so tests that don't touch tokens don't need the env var.
    """
    secret = os.getenv("JWT_SECRET_KEY") or _JWT_SECRET
    if not secret:
        raise RuntimeError(
            "JWT_SECRET_KEY is not set. "
            "Add JWT_SECRET_KEY=<random-secret> to backend/.env"
        )
    return secret


def create_access_token(user_id: int) -> str:
    """
    Create a signed JWT access token for the given user ID.

    The token payload contains:
      sub  — the user's integer ID (as a string, per JWT convention)
      exp  — expiry timestamp (UTC)
      iat  — issued-at timestamp (UTC)

    Args:
        user_id: The authenticated user's database ID.

    Returns:
        A signed JWT string to be returned to the client.
    """
    now = datetime.now(tz=timezone.utc)
    payload = {
        "sub": str(user_id),
        "iat": now,
        "exp": now + timedelta(hours=_ACCESS_TOKEN_EXPIRE_HOURS),
    }
    return jwt.encode(payload, _get_secret(), algorithm=_JWT_ALGORITHM)


def decode_access_token(token: str) -> Optional[int]:
    """
    Decode and validate a JWT access token.

    Returns the user ID (int) if the token is valid and not expired.
    Returns None if the token is invalid, expired, or malformed —
    callers should return HTTP 401.

    Args:
        token: The raw JWT string from the Authorization header.
    """
    try:
        payload = jwt.decode(token, _get_secret(), algorithms=[_JWT_ALGORITHM])
        user_id_str: Optional[str] = payload.get("sub")
        if user_id_str is None:
            return None
        return int(user_id_str)
    except (JWTError, ValueError):
        return None
