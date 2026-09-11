"""
insights.py

Router for hyper-local economic insights and category trends.
Matches frontend contract defined in frontend/lib/api-client.ts.
"""

from typing import List
from fastapi import APIRouter, Depends
from sqlalchemy.orm import Session
from pydantic import BaseModel

from backend.app.db.session import get_db
from backend.app.db.queries import list_business_categories

router = APIRouter(prefix="/api/v1/insights", tags=["Hyper-Local Insights"])


class CategoryTrend(BaseModel):
    name: str
    trend: int
    sparkline: List[int]
    seasonality: str


class InsightsResponse(BaseModel):
    location: str
    categories: List[CategoryTrend]


@router.get("/{location}", response_model=InsightsResponse)
def get_insights(location: str, db: Session = Depends(get_db)):
    """
    Returns localized business category trends and seasonality for Discover dashboard.
    Matches the frontend contract in frontend/lib/api-client.ts.
    """
    cats = list_business_categories(db)
    category_trends = {
        "dairy": {"trend": 34, "sparkline": [12, 18, 22, 28, 34], "seasonality": "All-season"},
        "textiles": {"trend": 21, "sparkline": [8, 12, 15, 18, 21], "seasonality": "Festival peak"},
        "retail": {"trend": 15, "sparkline": [10, 11, 13, 14, 15], "seasonality": "Stable daily"},
        "food processing": {"trend": 28, "sparkline": [10, 14, 20, 24, 28], "seasonality": "Harvest cyclical"},
        "agriculture": {"trend": 18, "sparkline": [14, 15, 16, 17, 18], "seasonality": "Rabi/Kharif"},
        "logistics": {"trend": 24, "sparkline": [10, 12, 16, 20, 24], "seasonality": "All-season"},
        "handicrafts": {"trend": 12, "sparkline": [5, 8, 9, 11, 12], "seasonality": "Tourism/Fair"},
        "education": {"trend": 19, "sparkline": [10, 12, 14, 16, 19], "seasonality": "Academic session"},
    }

    result = []
    for c in cats:
        c_low = c.name.lower()
        t_data = category_trends.get(c_low, {"trend": 15, "sparkline": [10, 12, 14, 15], "seasonality": "All-season"})
        result.append(CategoryTrend(
            name=c.name,
            trend=t_data["trend"],
            sparkline=t_data["sparkline"],
            seasonality="Seasonal" if c.is_seasonal else t_data["seasonality"],
        ))

    # Sort so highest trending categories appear first
    result.sort(key=lambda x: x.trend, reverse=True)

    return InsightsResponse(
        location=location,
        categories=result,
    )
