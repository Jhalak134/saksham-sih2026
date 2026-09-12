"""
model.py

Inference service for SAKSHAM Unsupervised Catchment Clustering.
Loads trained K-Means pipeline from joblib artifact and provides fault-tolerant
prediction, cluster archetype matching, and opportunity indexing.
Zero-crash guarantee: falls back gracefully if artifact is missing or corrupt.
"""

import os
import logging
from typing import Dict, Any, Optional
try:
    import joblib
except ImportError:
    joblib = None

from backend.app.ml.preprocessing import features_to_2d_array

logger = logging.getLogger("saksham.ml.model")

MODEL_DIR = os.path.join(os.path.dirname(__file__), "artifacts")
MODEL_PATH = os.path.join(MODEL_DIR, "kmeans_model.joblib")

_MODEL_CACHE: Optional[Dict[str, Any]] = None
_MODEL_LOAD_FAILED: bool = False


def get_model_artifact() -> Optional[Dict[str, Any]]:
    """Loads and caches model artifact. Returns None if artifact is missing or unloadable."""
    global _MODEL_CACHE, _MODEL_LOAD_FAILED

    if _MODEL_CACHE is not None:
        return _MODEL_CACHE
    if _MODEL_LOAD_FAILED or joblib is None:
        return None

    if not os.path.exists(MODEL_PATH):
        logger.info(f"ML artifact not found at {MODEL_PATH}. Operating in rule-only mode.")
        _MODEL_LOAD_FAILED = True
        return None

    try:
        loaded = joblib.load(MODEL_PATH)
        if isinstance(loaded, dict) and "kmeans" in loaded and "scaler" in loaded:
            _MODEL_CACHE = loaded
            logger.info("Successfully loaded SAKSHAM K-Means model artifact.")
            return _MODEL_CACHE
        else:
            logger.warning(f"Invalid artifact format in {MODEL_PATH}.")
            _MODEL_LOAD_FAILED = True
            return None
    except Exception as exc:
        logger.warning(f"Failed to load ML artifact {MODEL_PATH}: {exc}")
        _MODEL_LOAD_FAILED = True
        return None


def is_ml_available() -> bool:
    """Returns True if the ML model is trained, accessible, and ready for prediction."""
    return get_model_artifact() is not None


def predict_catchment_cluster(features: Dict[str, float]) -> Optional[Dict[str, Any]]:
    """
    Evaluates empirical catchment cluster and opportunity index from extracted feature dictionary.
    Guaranteed to return None rather than raising an uncaught exception on any error.
    """
    artifact = get_model_artifact()
    if not artifact:
        return None

    try:
        scaler = artifact["scaler"]
        kmeans = artifact["kmeans"]
        profiles = artifact.get("cluster_profiles", {})

        X_2d = features_to_2d_array(features)
        X_scaled = scaler.transform(X_2d)

        cluster_id = int(kmeans.predict(X_scaled)[0])
        centroid = kmeans.cluster_centers_[cluster_id]
        distance = float(np.linalg.norm(X_scaled[0] - centroid))

        profile = profiles.get(cluster_id, {
            "cluster_id": cluster_id,
            "rank": cluster_id,
            "name": f"Rural Catchment Cluster {cluster_id}",
            "tier": "Rural Market Cluster",
            "description": "Standard rural village demographic catchment.",
            "opportunity_tone": "Standard rural micro-enterprise market.",
            "village_count": 0,
            "avg_population": 0,
            "avg_households": 0,
            "avg_competitors": 0,
        })

        pop = features.get("population", 0.0)
        hh = features.get("household_count", 0.0)
        comp = features.get("competitor_count", 0.0)
        lit = features.get("literacy_rate", 55.0)

        # Catchment Opportunity Index (0..100)
        # Evaluates local absorption vs saturation relative to cluster average
        avg_comp = float(profile.get("avg_competitors", 1.0))
        if comp == 0:
            sat_score = 92.0
            sat_text = "Highly Undersaturated (zero direct competitors)"
        elif comp <= avg_comp:
            sat_score = 75.0 + max(0.0, (avg_comp - comp) * 8.0)
            sat_text = f"Below-Average Saturation ({int(comp)} vs cluster avg {avg_comp:.1f})"
        else:
            sat_score = max(35.0, 65.0 - (comp - avg_comp) * 12.0)
            sat_text = f"Higher Density ({int(comp)} vs cluster avg {avg_comp:.1f})"

        demo_factor = min(1.0, hh / max(1.0, float(profile.get("avg_households", 200.0))))
        opp_index = round(min(98.0, max(25.0, (sat_score * 0.65) + (demo_factor * 25.0) + (lit * 0.10))), 1)

        insights = (
            f"Classified into '{profile['name']}' ({profile['village_count']} peer villages in district). "
            f"{sat_text}. {profile['opportunity_tone']}"
        )

        return {
            "method": "kmeans_catchment_clustering",
            "cluster_id": cluster_id,
            "cluster_name": profile["name"],
            "tier": profile["tier"],
            "cluster_description": profile["description"],
            "peer_villages_count": profile["village_count"],
            "opportunity_index": opp_index,
            "relative_saturation": sat_text,
            "centroid_distance": round(distance, 2),
            "ml_insights": insights,
        }
    except Exception as exc:
        logger.warning(f"Error executing ML catchment inference: {exc}")
        return None
