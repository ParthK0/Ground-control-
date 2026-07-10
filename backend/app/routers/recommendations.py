import datetime
import uuid
import logging
from typing import List
from fastapi import APIRouter, HTTPException, Request, status
from google.cloud import firestore

from app.models.recommendation_schemas import RecommendationResponse

router = APIRouter()
logger = logging.getLogger(__name__)

@router.get("/recommendations", response_model=List[RecommendationResponse])
async def list_recommendations(request: Request) -> List[RecommendationResponse]:
    """
    List all pending recommendations.
    """
    db = request.app.state.firestore
    pending_recs = []

    if db is not None:
        try:
            # Query recommendations collection for pending status
            query = db.collection("recommendations").where("status", "==", "pending")
            docs = query.get()
            for doc in docs:
                data = doc.to_dict()
                ts = data.get("timestamp")
                ts_str = ts.isoformat() if hasattr(ts, "isoformat") else str(ts)
                pending_recs.append(
                    RecommendationResponse(
                        id=doc.id,
                        zoneId=data.get("zoneId"),
                        recommendationText=data.get("recommendationText") or data.get("text") or "",
                        alertText=data.get("alertText") or data.get("languages") or {},
                        severity=data.get("severity") or "high",
                        status=data.get("status") or "pending",
                        timestamp=ts_str
                    )
                )
            return pending_recs
        except Exception as err:
            logger.error(f"Firestore recommendations fetch failed: {err}")

    # Fallback to local store
    for item in request.app.state.local_recommendations_store:
        if item.get("status") == "pending":
            ts = item.get("timestamp")
            ts_str = ts.isoformat() if hasattr(ts, "isoformat") else str(ts)
            pending_recs.append(
                RecommendationResponse(
                    id=item.get("id"),
                    zoneId=item.get("zoneId"),
                    recommendationText=item.get("recommendationText") or item.get("text") or "",
                    alertText=item.get("alertText") or item.get("languages") or {},
                    severity=item.get("severity") or "high",
                    status=item.get("status") or "pending",
                    timestamp=ts_str
                )
            )

    return pending_recs


@router.post("/recommendations/{id}/approve", status_code=status.HTTP_200_OK)
async def approve_recommendation(request: Request, id: str):
    """
    Approve a recommendation, writing its alerts to the public alerts collection.
    """
    db = request.app.state.firestore
    timestamp = datetime.datetime.now(datetime.timezone.utc)

    if db is not None:
        try:
            rec_ref = db.collection("recommendations").document(id)
            rec_doc = rec_ref.get()
            if not rec_doc.exists:
                raise HTTPException(status_code=404, detail=f"Recommendation '{id}' not found.")
            
            rec_data = rec_doc.to_dict()
            if rec_data.get("status") == "approved":
                return {"status": "approved"}

            # Write alertText (all three languages) to public alerts collection
            alert_ref = db.collection("alerts").document()
            alert_data = {
                "recommendationId": id,
                "zoneId": rec_data.get("zoneId"),
                "alertText": rec_data.get("alertText") or rec_data.get("languages"),
                "languages": rec_data.get("alertText") or rec_data.get("languages"),
                "timestamp": timestamp,
                "active": True
            }
            alert_ref.set(alert_data)

            # Update status to approved
            rec_ref.update({"status": "approved"})
            return {"status": "approved"}
        except HTTPException:
            raise
        except Exception as err:
            raise HTTPException(
                status_code=500, 
                detail=f"Firestore error while approving recommendation: {err}"
            )

    # Local fallback path
    found_rec = None
    for rec in request.app.state.local_recommendations_store:
        if rec.get("id") == id:
            found_rec = rec
            break

    if not found_rec:
        raise HTTPException(status_code=404, detail=f"Recommendation '{id}' not found.")

    if found_rec.get("status") == "approved":
        return {"status": "approved"}

    found_rec["status"] = "approved"

    # Write alertText to local_alerts_store
    alert_id = f"alert_{uuid.uuid4().hex}"
    alert_data = {
        "id": alert_id,
        "recommendationId": id,
        "zoneId": found_rec.get("zoneId"),
        "alertText": found_rec.get("alertText"),
        "languages": found_rec.get("alertText"),
        "timestamp": timestamp,
        "active": True
    }
    request.app.state.local_alerts_store.append(alert_data)

    return {"status": "approved"}
