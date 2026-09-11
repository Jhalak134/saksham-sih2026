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

    # 1. Exact Census Village ID / Code match
    if clean_q.isdigit():
        v_by_id = db.query(Village).filter(Village.id == int(clean_q)).first()
        if v_by_id:
            return {
                "query": query,
                "matched": True,
                "village": v_by_id,
                "candidates": [v_by_id],
                "message": f"Exact match for Census code '{clean_q}'.",
            }

    # 2. Exact name match (case-insensitive)
    exact_name = db.query(Village).filter(func.lower(Village.name) == clean_q.lower()).first()
    if exact_name:
        return {
            "query": query,
            "matched": True,
            "village": exact_name,
            "candidates": [exact_name],
            "message": f"Exact match for village '{exact_name.name}'.",
        }

    # 3. Substring / partial search
    pattern = f"%{clean_q}%"
    candidates = db.query(Village).filter(Village.name.ilike(pattern)).limit(10).all()
    if candidates:
        return {
            "query": query,
            "matched": True,
            "village": candidates[0],
            "candidates": candidates,
            "message": f"Matched '{candidates[0].name}' from {len(candidates)} candidates.",
        }

    # 4. Check Block name
    blk = db.query(Block).filter(Block.name.ilike(pattern)).first()
    if blk and blk.villages:
        best_v = max(blk.villages, key=lambda v: v.population or 0)
        return {
            "query": query,
            "matched": True,
            "village": best_v,
            "candidates": blk.villages[:5],
            "message": f"Resolved to major village in Block '{blk.name}'.",
        }

    # 5. Default fallback to largest populated village in district
    fallback_v = db.query(Village).order_by(Village.population.desc()).first()
    return {
        "query": query,
        "matched": False,
        "village": fallback_v,
        "candidates": [fallback_v] if fallback_v else [],
        "message": f"No exact match for '{query}'. Showing nearest major village.",
    }
