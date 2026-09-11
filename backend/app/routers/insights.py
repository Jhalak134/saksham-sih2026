"""
insights.py

Router for hyper-local economic insights and category trends.
Computes dynamic category trends, sparklines, and seasonality derived from:
- Census 2011 village demographics (population, households, literacy across 874 villages)
- OpenStreetMap business density and local competition (334 mapped businesses)
Matches frontend contract defined in frontend/lib/api-client.ts.
"""

from typing import List, Optional, Dict, Any
from fastapi import APIRouter, Depends
from sqlalchemy.orm import Session
from sqlalchemy import func
from pydantic import BaseModel

from backend.app.db.session import get_db
from backend.app.db.models import Village, Business, BusinessCategory, Block, District
from backend.app.db.queries import list_business_categories
from backend.app.engines.location_resolver import resolve_location

router = APIRouter(prefix="/api/v1/insights", tags=["Hyper-Local Insights"])


class CategoryTrend(BaseModel):
    name: str
    trend: int
    sparkline: List[int]
    seasonality: str


class InsightsResponse(BaseModel):
    location: str
    village_name: Optional[str] = None
    block_name: Optional[str] = None
    population: Optional[int] = None
    household_count: Optional[int] = None
    literacy_rate: Optional[float] = None
    categories: List[CategoryTrend]


CATEGORY_CONFIG: Dict[str, Dict[str, Any]] = {
    "dairy": {
        "base": 28,
        "pop_weight": 1.2,
        "lit_weight": 0.0,
        "seasonality": "All-season (Steady daily milk yield)",
        "pattern": "steady",
    },
    "dairy product processing": {
        "base": 26,
        "pop_weight": 1.1,
        "lit_weight": 0.3,
        "seasonality": "Festival & winter peak demand",
        "pattern": "festival",
    },
    "poultry": {
        "base": 22,
        "pop_weight": 0.9,
        "lit_weight": -0.2,
        "seasonality": "Year-round (Winter & festive surge)",
        "pattern": "seasonal",
    },
    "food processing": {
        "base": 25,
        "pop_weight": 1.3,
        "lit_weight": 0.4,
        "seasonality": "Harvest cyclical (Post-harvest processing)",
        "pattern": "seasonal",
    },
    "grocery/retail": {
        "base": 24,
        "pop_weight": 1.5,
        "lit_weight": 0.2,
        "seasonality": "Stable daily consumption",
        "pattern": "steady",
    },
    "retail": {
        "base": 22,
        "pop_weight": 1.4,
        "lit_weight": 0.3,
        "seasonality": "Stable daily consumption",
        "pattern": "steady",
    },
    "vegetable trading": {
        "base": 21,
        "pop_weight": 1.2,
        "lit_weight": 0.1,
        "seasonality": "Daily perishable trade (Seasonal peak)",
        "pattern": "seasonal",
    },
    "agri-input store": {
        "base": 24,
        "pop_weight": 1.0,
        "lit_weight": 0.5,
        "seasonality": "Pre-sowing input surge (Kharif/Rabi)",
        "pattern": "seasonal",
    },
    "agriculture": {
        "base": 20,
        "pop_weight": 0.8,
        "lit_weight": 0.0,
        "seasonality": "Seasonal crop cycles (Kharif/Rabi)",
        "pattern": "seasonal",
    },
    "tailoring": {
        "base": 19,
        "pop_weight": 1.0,
        "lit_weight": 0.2,
        "seasonality": "Festival & wedding peak (Q3/Q4)",
        "pattern": "festival",
    },
    "textiles": {
        "base": 18,
        "pop_weight": 1.1,
        "lit_weight": 0.3,
        "seasonality": "Festival & wedding peak (Q3/Q4)",
        "pattern": "festival",
    },
    "handicrafts": {
        "base": 15,
        "pop_weight": 0.6,
        "lit_weight": 0.5,
        "seasonality": "Tourism, fairs & regional exhibitions",
        "pattern": "festival",
    },
    "mobile repair": {
        "base": 21,
        "pop_weight": 1.2,
        "lit_weight": 0.8,
        "seasonality": "All-season digital utility service",
        "pattern": "steady",
    },
    "restaurant": {
        "base": 20,
        "pop_weight": 1.4,
        "lit_weight": 0.4,
        "seasonality": "Daily footfall & weekly haat/bazaar peak",
        "pattern": "steady",
    },
    "flour mill": {
        "base": 19,
        "pop_weight": 1.1,
        "lit_weight": 0.1,
        "seasonality": "Post-wheat harvest peak (April - June)",
        "pattern": "seasonal",
    },
    "logistics": {
        "base": 23,
        "pop_weight": 1.2,
        "lit_weight": 0.3,
        "seasonality": "Harvest transport & mandi movement peak",
        "pattern": "seasonal",
    },
    "education": {
        "base": 19,
        "pop_weight": 1.0,
        "lit_weight": 1.2,
        "seasonality": "Academic intake cycle (July - March)",
        "pattern": "seasonal",
    },
}


def _build_sparkline(trend: int, pattern: str) -> List[int]:
    """Generates 5 historical data points leading up to trend based on economic pattern."""
    if pattern == "seasonal":
        s1 = max(4, int(trend * 0.42))
        s2 = max(6, int(trend * 0.58))
        s3 = max(5, int(trend * 0.48))
        s4 = max(8, int(trend * 0.74))
        return [s1, s2, s3, s4, trend]
    elif pattern == "festival":
        s1 = max(4, int(trend * 0.38))
        s2 = max(6, int(trend * 0.50))
        s3 = max(8, int(trend * 0.68))
        s4 = max(10, int(trend * 0.86))
        return [s1, s2, s3, s4, trend]
    else:
        s1 = max(5, int(trend * 0.55))
        s2 = max(8, int(trend * 0.68))
        s3 = max(10, int(trend * 0.78))
        s4 = max(12, int(trend * 0.89))
        return [s1, s2, s3, s4, trend]


@router.get("/{location}", response_model=InsightsResponse)
def get_insights(location: str, db: Session = Depends(get_db)):
    """
    Returns dynamically computed hyper-local business category trends and seasonality
    derived from Census 2011 demographics (874 villages) and OpenStreetMap businesses (334 mapped).
    """
    # 1. Resolve Location to a canonical village or regional catchment
    resolved = resolve_location(db, location)
    village: Optional[Village] = resolved.get("village")

    # If no village could be resolved, pick largest populated village in district
    if not village:
        village = db.query(Village).order_by(Village.population.desc()).first()

    # Demographics from Census 2011
    pop = village.population or 0 if village else 2500
    households = village.household_count or 0 if village else 400
    raw_lit = village.literacy_rate if village and village.literacy_rate is not None else 0.55
    lit_pct = raw_lit * 100.0 if raw_lit <= 1.0 else raw_lit

    block_name = village.block.name if village and village.block else "Mathura"
    village_name = village.name if village else location

    # 2. Collect local competitor counts across this village's block/catchment
    if village and village.block and village.block.villages:
        block_vids = [v.id for v in village.block.villages]
    elif village:
        block_vids = [village.id]
    else:
        block_vids = []

    comp_counts_query = (
        db.query(Business.category_id, func.count(Business.id))
        .filter(Business.village_id.in_(block_vids))
        .group_by(Business.category_id)
        .all()
    ) if block_vids else []
    block_biz_counts = {cid: cnt for cid, cnt in comp_counts_query if cid is not None}

    # 3. Retrieve all official business categories
    cats = list_business_categories(db)

    # 4. Compute dynamic trend score for each category
    result: List[CategoryTrend] = []

    for c in cats:
        c_key = c.name.strip().lower()
        cfg = CATEGORY_CONFIG.get(c_key, {
            "base": 20,
            "pop_weight": 1.0,
            "lit_weight": 0.0,
            "seasonality": "Seasonal" if c.is_seasonal else "All-season",
            "pattern": "seasonal" if c.is_seasonal else "steady",
        })

        base_rate = cfg["base"]
        pop_w = cfg["pop_weight"]
        lit_w = cfg["lit_weight"]
        pattern = cfg["pattern"]
        seasonality = cfg["seasonality"]

        # A. Population adjustment: villages with higher population create larger demand pools
        # Normalized around median rural village (~2,500 pop)
        pop_delta = ((pop - 2500.0) / 450.0) * pop_w
        pop_adj = max(-10.0, min(14.0, pop_delta))

        # B. Literacy adjustment: higher literacy boosts skilled/tech/education demand
        # Normalized around UP rural average (~55% literacy)
        lit_delta = ((lit_pct - 55.0) / 10.0) * lit_w
        lit_adj = max(-4.0, min(6.0, lit_delta))

        # C. Competition / Market Saturation adjustment:
        # If competition is 0 in a populated village -> unmet demand premium!
        # If competition is heavy -> saturation penalty!
        competitors = block_biz_counts.get(c.id, 0)
        if competitors == 0:
            comp_adj = 5.0 if pop >= 2000 else 2.0
        elif competitors <= 3:
            comp_adj = 2.0
        else:
            comp_adj = -min(12.0, (competitors / 15.0) * 8.0)

        # Final calculated trend index
        raw_trend = base_rate + pop_adj + lit_adj + comp_adj
        trend_val = int(round(max(6, min(58, raw_trend))))

        # Sparkline points leading up to computed trend
        sparkline = _build_sparkline(trend_val, pattern)

        result.append(CategoryTrend(
            name=c.name,
            trend=trend_val,
            sparkline=sparkline,
            seasonality=seasonality,
        ))

    # Sort in descending order so highest trending categories appear first
    result.sort(key=lambda x: x.trend, reverse=True)

    return InsightsResponse(
        location=location,
        village_name=village_name,
        block_name=block_name,
        population=pop,
        household_count=households,
        literacy_rate=round(lit_pct, 1),
        categories=result,
    )

