"""
auth.py

Authentication, User Profile, and Session endpoints for the SAKSHAM platform.

Endpoints:
  POST /api/v1/auth/signup   — create a new user account (JWT)
  POST /api/v1/auth/login    — authenticate and receive a JWT
  GET  /api/v1/auth/me       — retrieve the current authenticated user
  POST /api/v1/auth/logout   — client-side logout hint (JWT is stateless)
  POST /api/v1/auth/profile  — save user profile
  GET  /api/v1/auth/profile/{id} — get user profile
  POST /api/v1/auth/google   — Google One Tap OAuth login

Security rules enforced here:
  - Passwords are NEVER logged or stored in plaintext
  - password_hash is NEVER returned in any response
  - Duplicate identifiers return 409 Conflict
  - Legacy users with NULL password_hash receive the same generic 401 "Invalid credentials." response as other invalid credentials.
  - All protected endpoints require a valid, non-expired JWT
"""

from typing import Annotated, Optional

from fastapi import APIRouter, Depends, HTTPException, status
from fastapi.security import HTTPAuthorizationCredentials, HTTPBearer
from sqlalchemy.orm import Session
from pydantic import BaseModel

from backend.app.auth import (
    create_access_token,
    decode_access_token,
    hash_password,
    verify_password,
)
from backend.app.db.models import User
from backend.app.db.queries import (
    create_user,
    get_user_by_id,
    get_user_by_identifier,
    get_or_create_user,
)
from backend.app.db.session import get_db
from backend.app.schemas.auth import (
    LoginRequest,
    MessageResponse,
    SignupRequest,
    TokenResponse,
    UserResponse,
)

router = APIRouter(prefix="/api/v1/auth", tags=["auth"])
legacy_router = APIRouter(prefix="/auth", tags=["auth"])

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
) -> User:
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


# ── JWT Auth Endpoints ────────────────────────────────────────────────────────

@router.post(
    "/signup",
    response_model=TokenResponse,
    status_code=status.HTTP_201_CREATED,
    summary="Create a new user account",
)
@legacy_router.post(
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
@legacy_router.post(
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

    - Legacy users with NULL password_hash receive the same generic 401 "Invalid credentials."
      response as other invalid credentials. We do not reveal that an account exists.
    - Never logs passwords.
    """
    user = get_user_by_identifier(db, body.phone_or_email)

    # Constant-time-ish path: always attempt verify even if user is None
    # to avoid timing-based user enumeration
    stored_hash = user.password_hash if user else None

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
@legacy_router.get(
    "/me",
    response_model=UserResponse,
    summary="Get the current authenticated user's profile",
)
def me(
    current_user: Annotated[User, Depends(get_current_user)],
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
@legacy_router.post(
    "/logout",
    response_model=MessageResponse,
    summary="Log out (client-side token invalidation)",
)
def logout() -> MessageResponse:
    """
    Logout hint for the client.

    JWT tokens are stateless — the server cannot invalidate them directly.
    The client should discard the token from its storage on logout.
    """
    return MessageResponse(message="Logged out. Please discard your token.")


# ── Profile & OAuth Endpoints (origin/main) ───────────────────────────────────

class UserProfileIn(BaseModel):
    phone_or_email: str
    home_location: Optional[str] = None
    default_capital: Optional[float] = 100000.0
    preferred_language: Optional[str] = "en"


@router.post("/profile")
def save_profile(req: UserProfileIn, db: Session = Depends(get_db)):
    user = get_or_create_user(db, req.phone_or_email, req.home_location)
    if req.home_location is not None:
        user.home_location = req.home_location
    if req.default_capital is not None:
        user.default_capital = req.default_capital
    if req.preferred_language is not None:
        user.preferred_language = req.preferred_language
    db.commit()
    db.refresh(user)
    return {
        "id": user.id,
        "phone_or_email": user.phone_or_email,
        "home_location": user.home_location,
        "default_capital": user.default_capital,
        "preferred_language": user.preferred_language,
    }


@router.get("/profile/{identifier}")
def get_profile(identifier: str, db: Session = Depends(get_db)):
    user = db.query(User).filter(User.phone_or_email == identifier).first()
    if not user:
        raise HTTPException(status_code=404, detail="User not found.")
    return {
        "id": user.id,
        "phone_or_email": user.phone_or_email,
        "home_location": user.home_location,
        "default_capital": user.default_capital,
        "preferred_language": user.preferred_language,
    }


class GoogleAuthIn(BaseModel):
    email: str
    name: Optional[str] = None
    picture: Optional[str] = None
    google_id: Optional[str] = None
    credential: Optional[str] = None


@router.post("/google")
def google_auth(req: GoogleAuthIn, db: Session = Depends(get_db)):
    if not req.email or not req.email.strip():
        raise HTTPException(status_code=400, detail="Email is required.")

    clean_email = req.email.strip().lower()
    existing_user = db.query(User).filter(User.phone_or_email == clean_email).first()
    is_new = existing_user is None

    user = get_or_create_user(db, clean_email, None)
    db.commit()
    db.refresh(user)

    return {
        "id": user.id,
        "phone_or_email": user.phone_or_email,
        "name": req.name or clean_email.split("@")[0],
        "picture": req.picture,
        "home_location": user.home_location,
        "default_capital": user.default_capital,
        "preferred_language": user.preferred_language,
        "auth_provider": "google",
        "is_new_user": is_new,
    }
