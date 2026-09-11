"""
location.py

Router for location catalog, search, and resolution.
"""

from typing import List, Optional
from fastapi import APIRouter, Depends, HTTPException, Query
from sqlalchemy.orm import Session
from pydantic import BaseModel, ConfigDict

from backend.app.db.session import get_db
from backend.app.db.models import Village
from backend.app.db.queries import get_village_by_id, search_villages, list_villages
from backend.app.engines.location_resolver import resolve_location

router = APIRouter(prefix="/api/v1/locations", tags=["Locations"])


class LocationResolveRequest(BaseModel):
    query: str


class VillageOut(BaseModel):
    id: int
    name: str
    block_name: Optional[str] = None
    district_name: str = "Mathura"
    state_name: str = "Uttar Pradesh"
    population: int
    household_count: int
    literacy_rate: float

    model_config = ConfigDict(from_attributes=True)


@router.get("", response_model=List[VillageOut])
def get_locations(
    q: Optional[str] = Query(None, description="Search village name or code"),
    skip: int = Query(0, ge=0),
    limit: int = Query(50, ge=1, le=100),
    db: Session = Depends(get_db),
):
    """List or search Census villages."""
    if q and q.strip():
        items = search_villages(db, q.strip(), limit=limit)
    else:
        items = list_villages(db, skip=skip, limit=limit)

    return [
        VillageOut(
            id=v.id,
            name=v.name,
            block_name=v.block.name if v.block else None,
            district_name=v.block.district.name if v.block and v.block.district else "Mathura",
            state_name="Uttar Pradesh",
            population=v.population or 0,
            household_count=v.household_count or 0,
            literacy_rate=v.literacy_rate or 0.0,
        )
        for v in items
    ]


@router.get("/{location_id}", response_model=VillageOut)
def get_location_by_id_endpoint(location_id: int, db: Session = Depends(get_db)):
    v = get_village_by_id(db, location_id)
    if not v:
        raise HTTPException(status_code=404, detail="Village not found.")
    return VillageOut(
        id=v.id,
        name=v.name,
        block_name=v.block.name if v.block else None,
        district_name="Mathura",
        state_name="Uttar Pradesh",
        population=v.population or 0,
        household_count=v.household_count or 0,
        literacy_rate=v.literacy_rate or 0.0,
    )


@router.post("/resolve")
def resolve_location_endpoint(req: LocationResolveRequest, db: Session = Depends(get_db)):
    """Resolves an ambiguous village search string."""
    res = resolve_location(db, req.query)
    v = res["village"]
    return {
        "query": req.query,
        "matched": res["matched"],
        "message": res["message"],
        "village": {
            "id": v.id,
            "name": v.name,
            "block_name": v.block.name if v and v.block else "Chhata",
            "district": "Mathura",
            "state": "Uttar Pradesh",
            "population": v.population or 0,
            "household_count": v.household_count or 0,
            "literacy_rate": v.literacy_rate or 0.0,
        } if v else None,
    }
