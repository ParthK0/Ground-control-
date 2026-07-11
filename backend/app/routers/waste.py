import datetime
import uuid
import logging
from typing import Optional, Dict, Any
from fastapi import APIRouter, HTTPException, Request, Depends, BackgroundTasks
from pydantic import BaseModel, Field

from app.core.config import get_settings, Settings
from app.core.auth import require_staff_auth
from app.services.recommendation import (
    is_stall_in_cooldown,
    set_stall_cooldown,
    generate_waste_recommendation,
    FOOD_STALLS
)

router = APIRouter()
logger = logging.getLogger(__name__)

class FoodStallVolumeRequest(BaseModel):
    stallId: str = Field(..., description="ID of the food stall, e.g. f1")
    salesCount: int = Field(..., description="Sales transaction volume count")

class FoodStallVolumeResponse(BaseModel):
    status: str
    recommendationCreated: bool
    details: Optional[Dict[str, Any]] = None

def process_stall_thresholds(stall_id: str, sales_count: int, db: Any, state: Any, settings: Settings):
    if sales_count >= 50:
        if not is_stall_in_cooldown(stall_id):
            set_stall_cooldown(stall_id)
            logger.info(f"Stall {stall_id} transaction volume ({sales_count}) crossed threshold. Generating waste recommendation...")
            
            rec = generate_waste_recommendation(stall_id, sales_count, settings)
            timestamp = datetime.datetime.now(datetime.timezone.utc)
            
            stall_info = FOOD_STALLS.get(stall_id, {"name": f"Stall {stall_id}", "zone": "z1"})
            zone_id = stall_info["zone"]
            
            if db is not None:
                try:
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
                    logger.info(f"Waste Recommendation saved to Firestore: {rec_ref.id}")
                    return
                except Exception as err:
                    logger.error(f"Failed to save waste recommendation to Firestore: {err}")
            
            # Local fallback storage
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
            logger.info(f"Waste Recommendation saved to local store: {mock_id}")
        else:
            logger.info(f"Waste recommendation trigger for stall {stall_id} is in cooldown.")

@router.post("/food-stall-volume", response_model=FoodStallVolumeResponse)
async def report_stall_volume(
    request: Request,
    volume_in: FoodStallVolumeRequest,
    background_tasks: BackgroundTasks,
    settings: Settings = Depends(get_settings),
    staff: dict = Depends(require_staff_auth)
) -> FoodStallVolumeResponse:
    if volume_in.stallId not in FOOD_STALLS:
        raise HTTPException(
            status_code=400,
            detail=f"Invalid stallId '{volume_in.stallId}'. Must be one of f1-f6."
        )
        
    if volume_in.salesCount < 0:
        raise HTTPException(
            status_code=400,
            detail="Sales count cannot be negative."
        )

    db = request.app.state.firestore
    
    background_tasks.add_task(
        process_stall_thresholds,
        volume_in.stallId,
        volume_in.salesCount,
        db,
        request.app.state,
        settings
    )
    
    created = volume_in.salesCount >= 50 and not is_stall_in_cooldown(volume_in.stallId)
    
    return FoodStallVolumeResponse(
        status="processed",
        recommendationCreated=created,
        details={"stallId": volume_in.stallId, "salesCount": volume_in.salesCount}
    )
