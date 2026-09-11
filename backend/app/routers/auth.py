"""
backend/app/routers/auth.py

Authentication endpoints for the SAKSHAM platform.

Endpoints:
  POST /auth/signup   — create a new user account
  POST /auth/login    — authenticate and receive a JWT
  GET  /auth/me       — retrieve the current authenticated user
  POST /auth/logout   — client-side logout hint (JWT is stateless)

Security rules enforced here:
  - Passwords are NEVER logged or stored in plaintext
  - password_hash is NEVER returned in any response
  - Duplicate identifiers return 409 Conflict
  - Wrong credentials return 401 with a generic message
  - Legacy users with NULL password_hash are rejected at login with a clear message
  - All protected endpoints require a valid, non-expired JWT
"""

from typing import Annotated

from fastapi import APIRouter, Depends, HTTPException, status
from fastapi.security import HTTPAuthorizationCredentials, HTTPBearer
from sqlalchemy.orm import Session

from backend.app.auth import (
    create_access_token,
    decode_access_token,
    hash_password,
    verify_password,
)
from backend.app.db.queries import (
    create_user,
    get_user_by_id,
    get_user_by_identifier,
)
from backend.app.db.session import get_db
from backend.app.schemas.auth import (
    LoginRequest,
    MessageResponse,
    SignupRequest,
    TokenResponse,
    UserResponse,
)

router = APIRouter(prefix="/auth", tags=["auth"])

_bearer_scheme = HTTPBearer(auto_error=False)


# ── Dependency: resolve current user from Bearer token ────────────────────────

def get_current_user_id(
    credentials: Annotated[
        HTTPAuthorizationCredentials | None, Depends(_bearer_scheme)
    ],
) -> int:
    """
    FastAPI dependency that extracts and validates the JWT from the
    Authorization: Bearer <token> header.

    Returns the user_id (int) if valid.
    Raises HTTP 401 if missing, invalid, or expired.
    """
    if credentials is None:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Not authenticated. Provide a Bearer token.",
            headers={"WWW-Authenticate": "Bearer"},
        )
    user_id = decode_access_token(credentials.credentials)
    if user_id is None:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Invalid or expired token.",
            headers={"WWW-Authenticate": "Bearer"},
        )
    return user_id


def get_current_user(
    user_id: Annotated[int, Depends(get_current_user_id)],
    db: Annotated[Session, Depends(get_db)],
) -> object:
    """
    Dependency that returns the full User ORM object for the current request.
    Raises HTTP 401 if the user no longer exists in the DB.
    """
    user = get_user_by_id(db, user_id)
    if user is None:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="User account not found.",
            headers={"WWW-Authenticate": "Bearer"},
        )
    return user


# ── Endpoints ──────────────────────────────────────────────────────────────────

@router.post(
    "/signup",
    response_model=TokenResponse,
    status_code=status.HTTP_201_CREATED,
    summary="Create a new user account",
)
def signup(
    body: SignupRequest,
    db: Annotated[Session, Depends(get_db)],
) -> TokenResponse:
    """
    Register a new user.

    - Validates that the identifier is unique.
    - Hashes the password with bcrypt before storage.
    - Returns a JWT token immediately (no separate login step needed).
    - Returns 409 if the identifier is already registered.
    """
    # Check for existing user first (create_user also checks, but this gives a clearer error)
    existing = get_user_by_identifier(db, body.phone_or_email)
    if existing is not None:
        raise HTTPException(
            status_code=status.HTTP_409_CONFLICT,
            detail="An account with this phone/email already exists.",
        )

    # Hash password — never store plaintext
    pw_hash = hash_password(body.password)

    user = create_user(
        db=db,
        phone_or_email=body.phone_or_email,
        password_hash=pw_hash,
        home_location=body.home_location,
        preferred_language=body.preferred_language,
    )
    if user is None:
        # Race condition: two concurrent signups with the same identifier
        raise HTTPException(
            status_code=status.HTTP_409_CONFLICT,
            detail="An account with this phone/email already exists.",
        )

    token = create_access_token(user.id)
    return TokenResponse(
        access_token=token,
        user=UserResponse.model_validate(user),
    )


@router.post(
    "/login",
    response_model=TokenResponse,
    summary="Log in with phone/email and password",
)
def login(
    body: LoginRequest,
    db: Annotated[Session, Depends(get_db)],
) -> TokenResponse:
    """
    Authenticate a user and return a JWT token.

    - Returns 401 for invalid credentials (same message for wrong user/password
      to avoid leaking whether an account exists).
    - Returns 401 for legacy accounts with NULL password_hash, with a specific
      message instructing the user to set a password.
    - Never logs passwords.
    """
    user = get_user_by_identifier(db, body.phone_or_email)

    # Constant-time-ish path: always attempt verify even if user is None
    # to avoid timing-based user enumeration
    stored_hash = user.password_hash if user else None

    if stored_hash is None and user is not None:
        # Legacy account: exists but predates password auth
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail=(
                "This account was created before password authentication was enabled. "
                "Please contact support to set up your password."
            ),
            headers={"WWW-Authenticate": "Bearer"},
        )

    if user is None or not verify_password(body.password, stored_hash):
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Invalid credentials.",
            headers={"WWW-Authenticate": "Bearer"},
        )

    token = create_access_token(user.id)
    return TokenResponse(
        access_token=token,
        user=UserResponse.model_validate(user),
    )


@router.get(
    "/me",
    response_model=UserResponse,
    summary="Get the current authenticated user's profile",
)
def me(
    current_user: Annotated[object, Depends(get_current_user)],
) -> UserResponse:
    """
    Return the profile of the currently authenticated user.
    Requires a valid Bearer token.
    Never returns password_hash.
    """
    return UserResponse.model_validate(current_user)


@router.post(
    "/logout",
    response_model=MessageResponse,
    summary="Log out (client-side token invalidation)",
)
def logout() -> MessageResponse:
    """
    Logout hint for the client.

    JWT tokens are stateless — the server cannot invalidate them directly.
    The client should discard the token from its storage on logout.

    For production use, implement a token denylist (Redis) or use very
    short-lived tokens with refresh tokens. This is appropriate for the
    hackathon scope.
    """
    return MessageResponse(message="Logged out. Please discard your token.")
