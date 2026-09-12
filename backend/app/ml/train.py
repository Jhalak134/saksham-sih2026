"""
train.py

Offline training script for SAKSHAM Rural Catchment Clustering (K-Means).
Trains an unsupervised clustering model on all Census 2011 villages in the database,
learning empirical demographic scale, competitor density, and market opportunity patterns.
Produces serialized artifacts containing StandardScaler, KMeans, and cluster archetype profiles.
"""

import os
import datetime
from typing import Dict, Any, List, Tuple
import numpy as np
import pandas as pd
from sklearn.cluster import KMeans
from sklearn.preprocessing import StandardScaler
import joblib

from backend.app.db.session import SessionLocal
from backend.app.db.models import Village, Business, BusinessCategory
from backend.app.ml.preprocessing import (
    extract_features,
    features_to_vector,
    FEATURE_NAMES,
)

MODEL_DIR = os.path.join(os.path.dirname(__file__), "artifacts")
MODEL_PATH = os.path.join(MODEL_DIR, "kmeans_model.joblib")


def load_training_data() -> Tuple[np.ndarray, List[Dict[str, Any]]]:
    """Queries all villages and mapped businesses to extract empirical training dataset."""
    db = SessionLocal()
    try:
        villages = db.query(Village).all()
        # Count competitors per village
        comp_counts: Dict[int, int] = {}
        businesses = db.query(Business).all()
        for b in businesses:
            if b.village_id:
                comp_counts[b.village_id] = comp_counts.get(b.village_id, 0) + 1

        dataset = []
        village_meta = []
        for v in villages:
            comp = comp_counts.get(v.id, 0)
            # Use baseline category benchmark parameters for rural training
            feats = extract_features(
                village=v,
                category=None,
                capital_input=100000.0,
                competitor_count=comp,
            )
            vec = features_to_vector(feats)
            dataset.append(vec)
            village_meta.append({
                "village_id": v.id,
                "name": v.name,
                "pop": feats["population"],
                "hh": feats["household_count"],
                "comp": feats["competitor_count"],
            })

        return np.array(dataset, dtype=np.float64), village_meta
    finally:
        db.close()


def train_and_export(n_clusters: int = 4, random_state: int = 42) -> Dict[str, Any]:
    """Fits StandardScaler + KMeans on village data, generates archetype profiles, and saves artifact."""
    X, village_meta = load_training_data()
    n_samples = len(X)
    if n_samples == 0:
        raise ValueError("No village data available in database for training.")

    scaler = StandardScaler()
    X_scaled = scaler.fit_transform(X)

    kmeans = KMeans(n_clusters=n_clusters, random_state=random_state, n_init=10)
    cluster_labels = kmeans.fit_predict(X_scaled)

    # Compute descriptive profile for each cluster
    df_meta = pd.DataFrame(village_meta)
    df_meta["cluster"] = cluster_labels

    cluster_profiles: Dict[int, Dict[str, Any]] = {}
    
    # Sort cluster IDs by average population descending to establish consistent archetypes
    cluster_pop_means = [
        (c_id, float(df_meta[df_meta["cluster"] == c_id]["pop"].mean()))
        for c_id in range(n_clusters)
    ]
    # Map raw cluster ID to ordered archetype rank
    cluster_pop_means.sort(key=lambda x: x[1], reverse=True)
    rank_mapping = {raw_id: rank for rank, (raw_id, _) in enumerate(cluster_pop_means)}

    archetype_definitions = [
        {
            "name": "Major Rural Commercial Hub",
            "tier": "Tier 1 - Commercial Hub",
            "description": "High demographic scale (>3,500 pop, >600 hh). Robust purchasing power, active transit connectivity, and commercial activity.",
            "opportunity_tone": "High market capacity; focus on differentiated services and brand trust.",
        },
        {
            "name": "Prime Undersaturated Rural Market",
            "tier": "Tier 2 - Growth Catchment",
            "description": "Medium-to-large population (1,800–3,500 pop) with low-to-moderate competitor saturation. Prime target for new micro-enterprises.",
            "opportunity_tone": "Ideal unmet demand zone; strong consumer absorption with minimal head-to-head competition.",
        },
        {
            "name": "Developing Semi-Agrarian Catchment",
            "tier": "Tier 3 - Agrarian Market",
            "description": "Moderate village scale (800–1,800 pop). Steady agrarian demand pool with standard sub-district market linkages.",
            "opportunity_tone": "Reliable staple demand; moderate project scale recommended.",
        },
        {
            "name": "Deep Rural Micro-Hamlet",
            "tier": "Tier 4 - Lean Scale Village",
            "description": "Small village or remote hamlet (<800 pop). Limited immediate household volume requiring lean capital investment.",
            "opportunity_tone": "Lean capital investment advised; consider expanding delivery radius to adjoining hamlets.",
        },
    ]

    for raw_id in range(n_clusters):
        subset = df_meta[df_meta["cluster"] == raw_id]
        count = len(subset)
        avg_pop = float(subset["pop"].mean()) if count > 0 else 0.0
        avg_hh = float(subset["hh"].mean()) if count > 0 else 0.0
        avg_comp = float(subset["comp"].mean()) if count > 0 else 0.0

        rank = rank_mapping.get(raw_id, 3)
        arch = archetype_definitions[min(rank, len(archetype_definitions) - 1)]

        cluster_profiles[raw_id] = {
            "cluster_id": raw_id,
            "rank": rank,
            "name": arch["name"],
            "tier": arch["tier"],
            "description": arch["description"],
            "opportunity_tone": arch["opportunity_tone"],
            "village_count": count,
            "avg_population": round(avg_pop, 1),
            "avg_households": round(avg_hh, 1),
            "avg_competitors": round(avg_comp, 2),
        }

    artifact = {
        "scaler": scaler,
        "kmeans": kmeans,
        "cluster_profiles": cluster_profiles,
        "feature_names": FEATURE_NAMES,
        "trained_samples": n_samples,
        "trained_at": datetime.datetime.utcnow().isoformat() + "Z",
        "version": "1.0.0",
    }

    os.makedirs(MODEL_DIR, exist_ok=True)
    joblib.dump(artifact, MODEL_PATH)
    print(f"Successfully trained and saved model to {MODEL_PATH}")
    print(f"Trained on {n_samples} villages across {n_clusters} clusters.")
    for cid, prof in cluster_profiles.items():
        print(f"  Cluster {cid} ({prof['name']}): {prof['village_count']} villages, Avg Pop: {prof['avg_population']:.0f}")

    return artifact


if __name__ == "__main__":
    train_and_export()
