import datetime
import uuid
import json
import logging
import requests
from typing import Dict, Any
from fastapi import APIRouter, Request, Depends, status

from app.core.config import get_settings, Settings
from app.models.incident_schemas import IncidentRequest, IncidentResponse

router = APIRouter()
logger = logging.getLogger(__name__)

ALLOWED_CATEGORIES = {"medical", "security", "crowd_control", "lost_person", "facility", "weather", "other"}
ALLOWED_SEVERITIES = {"low", "medium", "high", "critical"}

DEMO_INCIDENTS = {
    "medical": {
        "category": "medical",
        "severity": "high",
        "draftResponse": "Dispatch medical team to the reported coordinates. Administer first aid and coordinate with local ambulance if needed.",
        "draftComms": "Medical staff are responding to an incident. Please clear the pathway for emergency personnel."
    },
    "security": {
        "category": "security",
        "severity": "high",
        "draftResponse": "Alert stadium security officers to intervene and secure the area. Review CCTV footage.",
        "draftComms": "Security response is active. Please remain calm and follow stadium staff instructions."
    },
    "crowd_control": {
        "category": "crowd_control",
        "severity": "medium",
        "draftResponse": "Redirect incoming pedestrian flow via alternative gates. Dispatch crowd monitors.",
        "draftComms": "Crowd control measures are in place. Please follow directed pathways to ensure safety."
    },
    "lost_person": {
        "category": "lost_person",
        "severity": "low",
        "draftResponse": "Log person description. Notify all gate staff and stadium operations center.",
        "draftComms": "If you have lost a member of your party, please report to the nearest Guest Services booth."
    },
    "facility": {
        "category": "facility",
        "severity": "low",
        "draftResponse": "Dispatch maintenance personnel to investigate and resolve the issue.",
        "draftComms": "Maintenance crews are addressing a facility issue. We appreciate your patience."
    },
    "weather": {
        "category": "weather",
        "severity": "medium",
        "draftResponse": "Monitor weather radars. Prepare indoor concourses for temporary shelter.",
        "draftComms": "Weather warning is active. Please seek shelter under covered concourses."
    },
    "other": {
        "category": "other",
        "severity": "low",
        "draftResponse": "Monitor situation and dispatch standard support crew if needed.",
        "draftComms": "Operations staff are assessing the situation. Please follow general safety procedures."
    }
}

def classify_incident_demo(text: str) -> Dict[str, Any]:
    msg = text.lower()
    
    # Special test hook to simulate invalid classifications and trigger the flagged state
    if "flag-me" in msg:
        return {
            "category": "invalid_category_test",
            "severity": "invalid_severity_test",
            "draftResponse": "",
            "draftComms": ""
        }
        
    category = "other"
    if any(k in msg for k in ["medical", "injured", "heart", "hurt", "chest", "blood", "doctor", "ambulance", "paramedic"]):
        category = "medical"
    elif any(k in msg for k in ["fight", "steal", "weapon", "theft", "gate crasher", "security", "police", "arrest", "assault"]):
        category = "security"
    elif any(k in msg for k in ["crowd", "crush", "congestion", "blocked", "bridge", "stuck", "gate plaza"]):
        category = "crowd_control"
    elif any(k in msg for k in ["lost", "child", "boy", "girl", "missing", "family", "parent"]):
        category = "lost_person"
    elif any(k in msg for k in ["leak", "broken", "power", "light", "structure", "toilet", "electrical", "flood"]):
        category = "facility"
    elif any(k in msg for k in ["rain", "lightning", "storm", "weather", "wind", "heat", "hot", "sunstroke"]):
        category = "weather"

    demo_inc = DEMO_INCIDENTS[category]
    return {
        "category": demo_inc["category"],
        "severity": demo_inc["severity"],
        "draftResponse": demo_inc["draftResponse"],
        "draftComms": demo_inc["draftComms"]
    }

def classify_incident_live(text: str, settings: Settings) -> Dict[str, Any]:
    """
    Call Gemini structured output API to classify an incident.
    """
    api_url = f"https://generativelanguage.googleapis.com/v1beta/models/gemini-1.5-flash:generateContent?key={settings.gemini_api_key}"
    
    SYSTEM_INSTRUCTIONS = """
You are GroundControl Stadium Operations incident classifier.
Your task is to analyze raw reports of stadium incidents and classify them.

Incident Taxonomy:
Categories: medical | security | crowd_control | lost_person | facility | weather | other
Severities: low | medium | high | critical

Instructions:
1. Classify the incident into one of the allowed categories.
2. Classify the incident into one of the allowed severities.
3. Generate a draftResponse: a short staff-facing response suggestion outlining what actions the stadium operations center should take.
4. Generate a draftComms: a public-facing communication alert message suitable for public address announcements or fan notifications.
5. The response must be a JSON object matching the schema.
"""

    payload = {
        "contents": [
            {
                "parts": [
                    {
                        "text": f"Incident Raw Text: {text}"
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
                    "category": {
                        "type": "STRING",
                        "description": "One of: medical, security, crowd_control, lost_person, facility, weather, other"
                    },
                    "severity": {
                        "type": "STRING",
                        "description": "One of: low, medium, high, critical"
                    },
                    "draftResponse": {
                        "type": "STRING",
                        "description": "Draft response suggestion for staff"
                    },
                    "draftComms": {
                        "type": "STRING",
                        "description": "Draft communications message"
                    }
                },
                "required": ["category", "severity", "draftResponse", "draftComms"]
            }
        }
    }

    try:
        response = requests.post(api_url, json=payload, headers={"Content-Type": "application/json"}, timeout=5.0)
        if response.status_code != 200:
            logger.error(f"Gemini API incident classification error: {response.status_code} - {response.text}")
            raise Exception("Gemini API call failed")

        res_data = response.json()
        raw_text = res_data["candidates"][0]["content"]["parts"][0]["text"]
        return json.loads(raw_text)
    except Exception as err:
        logger.error(f"Failed to fetch incident classification from Gemini: {err}")
        raise

@router.post("/incident", response_model=IncidentResponse, status_code=status.HTTP_200_OK)
async def create_incident(
    request: Request,
    incident_in: IncidentRequest,
    settings: Settings = Depends(get_settings)
) -> IncidentResponse:
    db = request.app.state.firestore
    timestamp = datetime.datetime.now(datetime.timezone.utc)

    # 1. Classification Step
    classification = None
    if settings.demo_mode:
        logger.info("DEMO_MODE is active. Using keyword classification.")
        classification = classify_incident_demo(incident_in.text)
    else:
        if not settings.gemini_api_key or settings.gemini_api_key == "dummy":
            logger.warning("No valid Gemini API key. Falling back to keyword classification.")
            classification = classify_incident_demo(incident_in.text)
        else:
            try:
                classification = classify_incident_live(incident_in.text, settings)
            except Exception:
                # Fallback on api error
                classification = classify_incident_demo(incident_in.text)

    # 2. Server-side validation of category and severity
    category = classification.get("category")
    severity = classification.get("severity")
    draft_response = classification.get("draftResponse", "")
    draft_comms = classification.get("draftComms", "")

    flagged = False
    if category not in ALLOWED_CATEGORIES or severity not in ALLOWED_SEVERITIES:
        logger.warning(
            f"Invalid incident classification values: category='{category}', severity='{severity}'. "
            "Flagging for manual staff review."
        )
        category = "other"
        severity = None
        flagged = True
        draft_response = ""
        draft_comms = ""

    # 3. Persistence
    if db is not None:
        try:
            doc_ref = db.collection("incidents").document()
            doc_data = {
                "text": incident_in.text,
                "category": category,
                "severity": severity,
                "draftResponse": draft_response,
                "draftComms": draft_comms,
                "status": "new",
                "flagged": flagged,
                "timestamp": timestamp
            }
            doc_ref.set(doc_data)
            
            return IncidentResponse(
                id=doc_ref.id,
                text=incident_in.text,
                category=category,
                severity=severity,
                draftResponse=draft_response,
                draftComms=draft_comms,
                status="new",
                flagged=flagged,
                timestamp=timestamp.isoformat()
            )
        except Exception as err:
            logger.error(f"Failed to write incident to Firestore: {err}")

    # Fallback to local store
    mock_id = f"inc_{uuid.uuid4().hex}"
    doc_data = {
        "id": mock_id,
        "text": incident_in.text,
        "category": category,
        "severity": severity,
        "draftResponse": draft_response,
        "draftComms": draft_comms,
        "status": "new",
        "flagged": flagged,
        "timestamp": timestamp
    }
    request.app.state.local_incidents_store.append(doc_data)

    return IncidentResponse(
        id=mock_id,
        text=incident_in.text,
        category=category,
        severity=severity,
        draftResponse=draft_response,
        draftComms=draft_comms,
        status="new",
        flagged=flagged,
        timestamp=timestamp.isoformat()
    )
