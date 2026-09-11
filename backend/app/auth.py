"""
backend/app/auth.py

Authentication utilities for the SAKSHAM platform.

Password hashing uses bcrypt directly (no passlib wrapper).
bcrypt >= 4.0 is required; passlib 1.7.x is NOT used because it
is incompatible with bcrypt >= 4.0.

Never store or log plaintext passwords.
Never return password_hash in API responses.
"""

import bcrypt


def hash_password(plain: str) -> str:
    """
    Hash a plaintext password using bcrypt.

    Args:
        plain: The raw password from user input. Never stored.

    Returns:
        A bcrypt hash string safe to store in the database.

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

    Returns False (not an exception) if the password is wrong or if
    the stored hash is NULL (pre-auth legacy users), so callers can
    give a uniform "invalid credentials" response.

    Args:
        plain:  Raw password from login attempt.
        hashed: The stored bcrypt hash from the database (may be None).

    Returns:
        True if the password matches, False otherwise.
    """
    if not plain or not hashed:
        return False
    try:
        return bcrypt.checkpw(plain.encode("utf-8"), hashed.encode("utf-8"))
    except Exception:
        # Malformed hash or encoding issue — treat as wrong password
        return False
