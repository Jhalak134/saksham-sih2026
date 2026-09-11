from fastapi import APIRouter, Depends
from sqlalchemy.orm import Session
from typing import List

from backend.app.db.session import get_db
from backend.app.db.queries import get_assessments_for_user
from backend.app.routers.auth import get_current_user
from backend.app.db.models import User
from backend.app.schemas.assess import ReportSummary, MyReportsResponse

router = APIRouter(prefix="/assess", tags=["assessments"])

@router.get("/my-reports", response_model=MyReportsResponse)
def get_my_reports(
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    assessments = get_assessments_for_user(db, current_user.id)
    
    reports = []
    for a in assessments:
        # Construct the response expected by the frontend
        reports.append(
            ReportSummary(
                id=f"REP-{a.id:04d}",
                category=a.category.name if a.category else "Unknown",
                location=a.village.name if a.village else "Unknown",
                date=a.created_at.strftime("%b %d, %Y") if a.created_at else "Unknown",
                fitScore=a.fit_score or 0.0,
                # Faking estimated profit for now, as it's not in the DB schema
                estimatedProfit=(a.capital_input or 100000.0) * 0.15,
                status=a.status or "Exploring"
            )
        )
        
    return MyReportsResponse(reports=reports)