"""
auth.py

User profile and session endpoints.
"""

from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session
from pydantic import BaseModel
from typing import Optional

from backend.app.db.session import get_db
from backend.app.db.models import User
from backend.app.db.queries import get_or_create_user

router = APIRouter(prefix="/api/v1/auth", tags=["User Profile"])


class UserProfileIn(BaseModel):
    phone_or_email: str
    home_location: Optional[str] = None
    default_capital: Optional[float] = 100000.0
    preferred_language: Optional[str] = "en"


@router.post("/profile")
def save_profile(req: UserProfileIn, db: Session = Depends(get_db)):
    user = get_or_create_user(db, req.phone_or_email, req.home_location)
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
