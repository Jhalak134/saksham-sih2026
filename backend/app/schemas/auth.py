"""
backend/app/schemas/auth.py

Pydantic request/response models for authentication endpoints.

IMPORTANT: UserResponse must never include password_hash.
           All response models are validated at serialization time.
"""

from typing import Optional
from pydantic import BaseModel, field_validator


class SignupRequest(BaseModel):
    phone_or_email: str
    password: str
    home_location: Optional[str] = None
    preferred_language: str = "en"

    @field_validator("phone_or_email")
    @classmethod
    def identifier_not_empty(cls, v: str) -> str:
        v = v.strip()
        if not v:
            raise ValueError("phone_or_email must not be empty.")
        return v

    @field_validator("password")
    @classmethod
    def password_min_length(cls, v: str) -> str:
        if len(v.strip()) < 6:
            raise ValueError("Password must be at least 6 characters.")
        return v


class LoginRequest(BaseModel):
    phone_or_email: str
    password: str


class UserResponse(BaseModel):
    """
    Safe user representation returned in API responses.
    NEVER includes password_hash.
    """
    id: int
    phone_or_email: str
    home_location: Optional[str] = None
    default_capital: Optional[float] = None
    preferred_language: Optional[str] = None

    model_config = {"from_attributes": True}


class TokenResponse(BaseModel):
    """Returned on successful login or signup."""
    access_token: str
    token_type: str = "bearer"
    expires_in_hours: int = 8
    user: UserResponse


class MessageResponse(BaseModel):
    """Generic success/info message response."""
    message: str
