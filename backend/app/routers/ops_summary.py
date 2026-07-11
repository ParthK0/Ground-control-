import logging
import json
import httpx
from fastapi import APIRouter, Request, Depends, status
from google.cloud import firestore

from app.core.config import get_settings, Settings
from app.core.auth import require_staff_auth
from app.core.constants import ZONE_CAPACITIES, ZONE_NAMES
from app.core.weather import MOCK_WEATHER_SIGNAL
from app.models.ops_summary_schemas import OpsSummaryResponse

router = APIRouter()
logger = logging.getLogger("ops_summary")


SYSTEM_INSTRUCTIONS = """
You are GroundControl Stadium Operations Synthesizer.
Your task is to provide a single, synthesized plain-language paragraph summarizing the current operational situation at Northgate Stadium.
You are given the current crowd density readings across stadium zones, open incidents, pending recommendations, and a weather signal.

Rules for response:
1. Return exactly one synthesized paragraph.
2. The summary must be plain-language but quantified wherever the source data allows (e.g., "Zone 3 congestion is up to 88%" or "two incidents open" or "congestion increased by 35%"). Do not use vague adjectives when exact numbers are available.
3. Incorporate the weather signal context.
4. Output must be a JSON object with a single field:
   - "summary": (string) The synthesized paragraph.
"""

DEMO_SUMMARY = (
    "Zone 3 (East Gate Plaza) congestion is up to 88% capacity, with one open incident logged. "
    "Rain is expected in 40 minutes — recommend publishing the Zone 3 reroute immediately to ease the crowd flow before weather conditions deteriorate."
)

@router.post("/ops-summary", response_model=OpsSummaryResponse, status_code=status.HTTP_200_OK)
async def generate_ops_summary(
    request: Request,
    settings: Settings = Depends(get_settings),
    staff: dict = Depends(require_staff_auth)
) -> OpsSummaryResponse:
    db = request.app.state.firestore

    # 1. Fetch latest density readings
    latest_by_zone = {}
    if db is not None:
        try:
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
                    latest_by_zone[zid] = data.get("value")
        except Exception as err:
            logger.error(f"Firestore density fetch failed: {err}")
    else:
        # Fallback to local memory store
        local_store = getattr(request.app.state, "local_density_store", [])
        for item in reversed(local_store):
            zid = item.get("zoneId")
            if zid and zid not in latest_by_zone:
                latest_by_zone[zid] = item.get("value")

    # Format density context
    density_context = []
    for zid, cap in ZONE_CAPACITIES.items():
        val = latest_by_zone.get(zid, 0)
        pct = (val / cap) * 100 if cap > 0 else 0
        name = ZONE_NAMES.get(zid, zid)
        density_context.append(f"- {name} ({zid}): {val}/{cap} occupants ({pct:.1f}% capacity)")

    # 2. Fetch open incidents (status == "new")
    open_incidents = []
    if db is not None:
        try:
            docs = db.collection("incidents").where("status", "==", "new").get()
            for doc in docs:
                data = doc.to_dict()
                open_incidents.append(data)
        except Exception as err:
            logger.error(f"Firestore incidents fetch failed: {err}")
    else:
        local_store = getattr(request.app.state, "local_incidents_store", [])
        open_incidents = [inc for inc in local_store if inc.get("status") == "new"]

    incidents_context = []
    for inc in open_incidents:
        inc_text = inc.get("text", "")
        category = inc.get("category", "other")
        severity = inc.get("severity", "low")
        incidents_context.append(f"- [{category.upper()} - {severity.upper()} severity] {inc_text}")

    # 3. Fetch pending recommendations
    pending_recs = []
    if db is not None:
        try:
            docs = db.collection("recommendations").where("status", "==", "pending").get()
            for doc in docs:
                data = doc.to_dict()
                pending_recs.append(data)
        except Exception as err:
            logger.error(f"Firestore recommendations fetch failed: {err}")
    else:
        local_store = getattr(request.app.state, "local_recommendations_store", [])
        pending_recs = [rec for rec in local_store if rec.get("status") == "pending"]

    recs_context = []
    for rec in pending_recs:
        rec_text = rec.get("recommendationText") or rec.get("text") or ""
        zid = rec.get("zoneId", "")
        recs_context.append(f"- For {ZONE_NAMES.get(zid, zid)} ({zid}): {rec_text}")

    # Check for demo mode / invalid API key
    if settings.demo_mode or not settings.gemini_api_key or settings.gemini_api_key == "dummy":
        logger.info("Using Ops Summary DEMO fallback.")
        return OpsSummaryResponse(summary=DEMO_SUMMARY)

    # Prepare prompt
    prompt = f"""
Current Stadium State:

1. Crowd Density Readings:
{"\n".join(density_context)}

2. Open Incidents:
{"\n".join(incidents_context) if incidents_context else "None"}

3. Pending Recommendations:
{"\n".join(recs_context) if recs_context else "None"}

4. Weather Signal:
Condition: {MOCK_WEATHER_SIGNAL['condition']}
Change expected in: {MOCK_WEATHER_SIGNAL['changeInMinutes']} minutes
"""

    api_url = "https://generativelanguage.googleapis.com/v1beta/models/gemini-1.5-flash:generateContent"
    headers = {
        "Content-Type": "application/json",
        "x-goog-api-key": settings.gemini_api_key
    }

    payload = {
        "contents": [
            {
                "parts": [
                    {
                        "text": prompt
                    }
                ]
            }
        ],
        "systemInstruction": {
            "parts": [
                {
                    "text": SYSTEM_INSTRUCTIONS
                }
            ]
        },
        "generationConfig": {
            "responseMimeType": "application/json",
            "responseSchema": {
                "type": "OBJECT",
                "properties": {
                    "summary": {
                        "type": "STRING",
                        "description": "Synthesized plain-language summary paragraph containing quantified details"
                    }
                },
                "required": ["summary"]
            }
        }
    }

    try:
        async with httpx.AsyncClient() as client:
            response = await client.post(api_url, json=payload, headers=headers, timeout=5.0)
        if response.status_code != 200:
            logger.error(f"Gemini API returned error code {response.status_code}: {response.text}")
            return OpsSummaryResponse(summary=DEMO_SUMMARY)

        res_data = response.json()
        raw_text = res_data["candidates"][0]["content"]["parts"][0]["text"]
        parsed = json.loads(raw_text)
        summary_text = parsed.get("summary", DEMO_SUMMARY)
        return OpsSummaryResponse(summary=summary_text)

    except httpx.HTTPError as err:
        logger.error(f"Failed to generate operational summary with Gemini: {err}")
        return OpsSummaryResponse(summary=DEMO_SUMMARY)
    except Exception as err:
        logger.error(f"Error parsing Gemini response: {err}")
        return OpsSummaryResponse(summary=DEMO_SUMMARY)
