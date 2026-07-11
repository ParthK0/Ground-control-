import datetime
import uuid
import logging
from typing import List, Any
from fastapi import APIRouter, HTTPException, Request, Depends, BackgroundTasks
from google.cloud import firestore

from app.core.config import get_settings, Settings
from app.core.auth import require_staff_auth
from app.models.density_schemas import DensityRequest, DensityResponse
from app.services.recommendation import (
    check_density_threshold,
    is_zone_in_cooldown,
    set_zone_cooldown,
    generate_recommendation
)

router = APIRouter()
logger = logging.getLogger(__name__)

# Zone capacity definitions based on SEED_DATA.md
ZONE_CAPACITIES = {
    "z1": 4000,  # North Concourse
    "z2": 4000,  # South Concourse
    "z3": 2500,  # East Gate Plaza
    "z4": 2500,  # West Gate Plaza
    "z5": 6000,  # Metro Transit Bridge
    "z6": 3000   # Fan Zone / Retail Row
}

def process_density_thresholds(zone_id: str, value: float, db: Any, state: Any, settings: Settings):
    """
    Checks density thresholds, debounces, generates recommendations with Gemini, and records to store.
    """
    if check_density_threshold(zone_id, value):
        if not is_zone_in_cooldown(zone_id):
            # Set the 2-minute debounce cooldown
            set_zone_cooldown(zone_id)
            
            logger.info(f"Crowd threshold crossed for zone {zone_id} ({value}). Generating recommendation...")
            rec = generate_recommendation(zone_id, value, settings)
            timestamp = datetime.datetime.now(datetime.timezone.utc)
            
            if db is not None:
                try:
                    # Write recommendation document
                    rec_ref = db.collection("recommendations").document()
                    doc_data = {
                        "zoneId": zone_id,
                        "recommendationText": rec["recommendationText"],
                        "text": rec["recommendationText"],
                        "alertText": rec["alertText"],
                        "languages": rec["alertText"],
                        "severity": rec["severity"],
                        "status": "pending",
                        "timestamp": timestamp
                    }
                    rec_ref.set(doc_data)
                    logger.info(f"Recommendation saved to Firestore: {rec_ref.id}")
                    return
                except Exception as err:
                    logger.error(f"Failed to save recommendation to Firestore: {err}")
            
            # Local/offline fallback storage
            mock_id = f"rec_{uuid.uuid4().hex}"
            doc_data = {
                "id": mock_id,
                "zoneId": zone_id,
                "recommendationText": rec["recommendationText"],
                "text": rec["recommendationText"],
                "alertText": rec["alertText"],
                "languages": rec["alertText"],
                "severity": rec["severity"],
                "status": "pending",
                "timestamp": timestamp
            }
            state.local_recommendations_store.append(doc_data)
            logger.info(f"Recommendation saved to local store: {mock_id}")
        else:
            logger.info(f"Recommendation trigger for zone {zone_id} is debounced (in cooldown).")

@router.post("/density", response_model=DensityResponse)
async def create_density_reading(
    request: Request, 
    density_in: DensityRequest,
    background_tasks: BackgroundTasks,
    settings: Settings = Depends(get_settings),
    staff: dict = Depends(require_staff_auth)
) -> DensityResponse:
    # 1. Server-side validation of zone ID
    if density_in.zoneId not in ZONE_CAPACITIES:
        raise HTTPException(
            status_code=400,
            detail=f"Invalid zoneId '{density_in.zoneId}'. Must be one of z1-z6."
        )

    # 2. Server-side validation of capacity range
    capacity_limit = ZONE_CAPACITIES[density_in.zoneId]
    if not (0 <= density_in.value <= capacity_limit):
        raise HTTPException(
            status_code=400,
            detail=(
                f"Density value {density_in.value} is out of bounds for zone '{density_in.zoneId}'. "
                f"Must be between 0 and capacity limit ({capacity_limit})."
            )
        )

    timestamp = datetime.datetime.now(datetime.timezone.utc)
    db = request.app.state.firestore

    # Add background task to process thresholds & recommendation engine
    background_tasks.add_task(
        process_density_thresholds,
        density_in.zoneId,
        density_in.value,
        db,
        request.app.state,
        settings
    )

    if db is not None:
        try:
            # Write to Firestore collection "density_readings"
            doc_ref = db.collection("density_readings").document()
            doc_data = {
                "zoneId": density_in.zoneId,
                "value": density_in.value,
                "source": density_in.source,
                "timestamp": timestamp
            }
            doc_ref.set(doc_data)
            
            return DensityResponse(
                id=doc_ref.id,
                zoneId=density_in.zoneId,
                value=density_in.value,
                source=density_in.source,
                timestamp=timestamp.isoformat()
            )
        except Exception as err:
            logger.error(f"Firestore write failed, falling back to local storage: {err}")

    # Offline/local fallback storage
    doc_id = f"mock_{uuid.uuid4().hex}"
    doc_data = {
        "id": doc_id,
        "zoneId": density_in.zoneId,
        "value": density_in.value,
        "source": density_in.source,
        "timestamp": timestamp
    }
    request.app.state.local_density_store.append(doc_data)

    return DensityResponse(
        id=doc_id,
        zoneId=density_in.zoneId,
        value=density_in.value,
        source=density_in.source,
        timestamp=timestamp.isoformat()
    )


@router.get("/density-readings", response_model=List[DensityResponse])
async def get_latest_density_readings(
    request: Request,
    staff: dict = Depends(require_staff_auth)
) -> List[DensityResponse]:
    db = request.app.state.firestore
    latest_by_zone = {}

    if db is not None:
        try:
            # Fetch last 100 readings ordered by timestamp descending
            query = (
                db.collection("density_readings")
                .order_by("timestamp", direction=firestore.Query.DESCENDING)
                .limit(100)
            )
            docs = query.get()

            for doc in docs:
                data = doc.to_dict()
                zid = data.get("zoneId")
                if zid and zid not in latest_by_zone:
                    ts = data.get("timestamp")
                    ts_str = ts.isoformat() if hasattr(ts, "isoformat") else str(ts)
                    latest_by_zone[zid] = DensityResponse(
                        id=doc.id,
                        zoneId=zid,
                        value=data.get("value"),
                        source=data.get("source"),
                        timestamp=ts_str
                    )
            return list(latest_by_zone.values())
        except Exception as err:
            logger.error(f"Firestore query failed, falling back to local storage: {err}")

    # Fallback to local store
    for item in reversed(request.app.state.local_density_store):
        zid = item["zoneId"]
        if zid not in latest_by_zone:
            ts = item["timestamp"]
            ts_str = ts.isoformat() if hasattr(ts, "isoformat") else str(ts)
            latest_by_zone[zid] = DensityResponse(
                id=item["id"],
                zoneId=zid,
                value=item["value"],
                source=item["source"],
                timestamp=ts_str
            )

    return list(latest_by_zone.values())
