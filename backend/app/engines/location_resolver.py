"""
location_resolver.py

Resolves user search strings (village name, PIN code, or Census code)
into canonical Village database records.
"""

from typing import Dict, Any, Optional
from sqlalchemy.orm import Session
from sqlalchemy import or_, func

from backend.app.db.models import Village, Block, District


def resolve_location(db: Session, query: str) -> Dict[str, Any]:
    """
    Resolves an ambiguous user location query into a canonical Village entity.
    Supports:
    - Census code or id: "123579", "loc_v_123579", "loc_123579"
    - Formatted location display: "Kamar, Mathura", "Barsana, Mathura, Uttar Pradesh"
    - Exact village name: "Kamar", "Hulwana", "Shergarh Bangar"
    - Partial village name / token match: "Barsana", "Chaumuhan", "Farah"
    - Block name matching: "Chhata", "Govardhan"
    - Safe fallback with matched=False only when no village matches
    """
    clean_q = query.strip()
    if not clean_q:
        first_v = db.query(Village).filter(Village.population > 1000).first()
        return {
            "query": query,
            "matched": bool(first_v),
            "village": first_v,
            "candidates": [first_v] if first_v else [],
            "message": "Default location returned.",
        }

    # 1. Check loc_v_ prefix or numeric id
    num_str = clean_q
    if num_str.lower().startswith("loc_v_"):
        num_str = num_str[6:]
    elif num_str.lower().startswith("loc_"):
        num_str = num_str[4:]

    if num_str.isdigit():
        v_by_id = db.query(Village).filter(Village.id == int(num_str)).first()
        if v_by_id:
            return {
                "query": query,
                "matched": True,
                "village": v_by_id,
                "candidates": [v_by_id],
                "message": f"Exact match for Census code '{num_str}'.",
            }

    # 2. Extract primary token from comma-separated strings (e.g. "Kamar, Mathura" -> "Kamar")
    parts = [p.strip() for p in clean_q.split(",") if p.strip()]
    village_token = parts[0] if parts else clean_q

    # 3. Exact name match on full query or primary token
    for candidate in [clean_q, village_token]:
        exact_name = db.query(Village).filter(func.lower(Village.name) == candidate.lower()).first()
        if exact_name:
            return {
                "query": query,
                "matched": True,
                "village": exact_name,
                "candidates": [exact_name],
                "message": f"Exact match for village '{exact_name.name}'.",
            }

    # 4. Partial substring search on primary token then full query
    for candidate in [village_token, clean_q]:
        if len(candidate) >= 3:
            pattern = f"%{candidate}%"
            candidates = (
                db.query(Village)
                .filter(Village.name.ilike(pattern))
                .order_by(Village.population.desc())
                .limit(10)
                .all()
            )
            if candidates:
                return {
                    "query": query,
                    "matched": True,
                    "village": candidates[0],
                    "candidates": candidates,
                    "message": f"Matched '{candidates[0].name}' from {len(candidates)} candidates.",
                }

    # 5. Check Block name
    blk_pattern = f"%{village_token}%"
    blk = db.query(Block).filter(Block.name.ilike(blk_pattern)).first()
    if blk and blk.villages:
        best_v = max(blk.villages, key=lambda v: v.population or 0)
        return {
            "query": query,
            "matched": True,
            "village": best_v,
            "candidates": blk.villages[:5],
            "message": f"Resolved to major village in Block '{blk.name}'.",
        }

    # 6. Default fallback to largest populated village in district
    fallback_v = db.query(Village).order_by(Village.population.desc()).first()
    return {
        "query": query,
        "matched": False,
        "village": fallback_v,
        "candidates": [fallback_v] if fallback_v else [],
        "message": f"No exact match for '{query}'. Showing nearest major village.",
    }
