import datetime
import uuid
import json
import logging
import requests
from typing import Dict, List, Optional
from fastapi import APIRouter, Request, Depends, status

from app.core.config import get_settings, Settings
from app.models.briefing_schemas import BriefingRequest, BriefingResponse, BriefingSection

router = APIRouter()
logger = logging.getLogger(__name__)

DEMO_BRIEFINGS = {
    "Gate Volunteer": [
        {"heading": "Shift Overview & Duties", "body": "Monitor gate lines, scan tickets, and greet fans as they enter. Direct fans to their seat blocks."},
        {"heading": "Safety & Accessibility", "body": "Ensure the accessible ramps are clear at all times. Direct wheelchairs to the elevator on the left."},
        {"heading": "Emergency Protocol", "body": "In case of emergency, stay calm, report the issue to your gate supervisor, and follow stadium evacuation signs."}
    ],
    "Crowd Control Coordinator": [
        {"heading": "Shift Overview & Duties", "body": "Monitor spectator density at bottleneck areas (transit bridges and gate plazas). Facilitate smooth traffic flow."},
        {"heading": "High Density Protocol", "body": "If a zone density crosses 85%, assist in implementing the approved AI rerouting directions by putting up signs and guiding fans."},
        {"heading": "Key Contact Numbers", "body": "Operations Center: Dispatch-1, Security Central: Dispatch-2."}
    ],
    "General Volunteer": [
        {"heading": "General Duties", "body": "Assist fans with directions, locate missing items, and support information booths throughout the venue."},
        {"heading": "Accessibility Guide", "body": "Point fans to the nearest accessible route (marked with the accessibility icon) and help locate companion seating."},
        {"heading": "Emergency Action", "body": "Direct visitors to the nearest exits and guide them away from hazard areas as directed by public address announcements."}
    ]
}

def generate_briefing_demo(role: str, shift_context: Optional[str] = None) -> List[Dict[str, str]]:
    sections = DEMO_BRIEFINGS.get(role)
    if not sections:
        sections = DEMO_BRIEFINGS["General Volunteer"]
        
    # If shift context is supplied, append it dynamically as a section
    if shift_context:
        sections = list(sections) + [
            {"heading": "Shift Specific Context", "body": shift_context}
        ]
    return sections

def generate_briefing_live(role: str, shift_context: Optional[str], settings: Settings) -> List[Dict[str, str]]:
    api_url = f"https://generativelanguage.googleapis.com/v1beta/models/gemini-1.5-flash:generateContent?key={settings.gemini_api_key}"
    
    SYSTEM_INSTRUCTIONS = """
You are GroundControl Volunteer Coordinator.
Generate a structured, role-specific shift briefing for volunteers at Northgate Stadium.

TAXONOMY & CONTEXT:
The venue has 6 zones:
- z1: North Concourse (Capacity: 4000, Accessible Route)
- z2: South Concourse (Capacity: 4000, Accessible Route)
- z3: East Gate Plaza (Capacity: 2500, No Accessible Route, steps only)
- z4: West Gate Plaza (Capacity: 2500, Accessible Route)
- z5: Metro Transit Bridge (Capacity: 6000, Accessible Route)
- z6: Fan Zone / Retail Row (Capacity: 3000, No Accessible Route)

Instructions:
1. Generate 3 key sections for the volunteer role.
2. For each section, provide a concise 'heading' and a detailed 'body'.
3. Inject the optional shiftContext if provided.
4. The output must strictly match the JSON response schema.
"""

    payload = {
        "contents": [
            {
                "parts": [
                    {
                        "text": f"Role: {role}\nShift Context: {shift_context or 'None'}"
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
                    "sections": {
                        "type": "ARRAY",
                        "items": {
                            "type": "OBJECT",
                            "properties": {
                                "heading": {
                                    "type": "STRING",
                                    "description": "Short section heading"
                                },
                                "body": {
                                    "type": "STRING",
                                    "description": "Section details and guidelines"
                                }
                              },
                            "required": ["heading", "body"]
                        }
                    }
                },
                "required": ["sections"]
            }
        }
    }

    try:
        response = requests.post(api_url, json=payload, headers={"Content-Type": "application/json"}, timeout=5.0)
        if response.status_code != 200:
            logger.error(f"Gemini API briefing error: {response.status_code} - {response.text}")
            raise Exception("Gemini API call failed")

        res_data = response.json()
        raw_text = res_data["candidates"][0]["content"]["parts"][0]["text"]
        data = json.loads(raw_text)
        return data["sections"]
    except Exception as err:
        logger.error(f"Failed to fetch briefing from Gemini: {err}")
        raise

@router.post("/briefing", response_model=BriefingResponse, status_code=status.HTTP_200_OK)
async def create_briefing(
    request: Request,
    briefing_in: BriefingRequest,
    settings: Settings = Depends(get_settings)
) -> BriefingResponse:
    db = request.app.state.firestore
    timestamp = datetime.datetime.now(datetime.timezone.utc).isoformat()

    # 1. Briefing Generation
    sections = None
    if settings.demo_mode:
        logger.info("DEMO_MODE active. Using canned briefings.")
        sections = generate_briefing_demo(briefing_in.role, briefing_in.shiftContext)
    else:
        if not settings.gemini_api_key or settings.gemini_api_key == "dummy":
            logger.warning("No Gemini API key. Falling back to canned briefings.")
            sections = generate_briefing_demo(briefing_in.role, briefing_in.shiftContext)
        else:
            try:
                sections = generate_briefing_live(briefing_in.role, briefing_in.shiftContext, settings)
            except Exception:
                sections = generate_briefing_demo(briefing_in.role, briefing_in.shiftContext)

    parsed_sections = [BriefingSection(heading=s["heading"], body=s["body"]) for s in sections]

    # 2. Persistence
    if db is not None:
        try:
            doc_ref = db.collection("briefings").document()
            doc_data = {
                "role": briefing_in.role,
                "sections": [s.model_dump() for s in parsed_sections],
                "timestamp": timestamp
            }
            doc_ref.set(doc_data)
            return BriefingResponse(
                id=doc_ref.id,
                role=briefing_in.role,
                sections=parsed_sections,
                timestamp=timestamp
            )
        except Exception as err:
            logger.error(f"Failed to write briefing to Firestore: {err}")

    # Local store fallback
    mock_id = f"brief_{uuid.uuid4().hex}"
    doc_data = {
        "id": mock_id,
        "role": briefing_in.role,
        "sections": [s.model_dump() for s in parsed_sections],
        "timestamp": timestamp
    }
    request.app.state.local_briefings_store.append(doc_data)

    return BriefingResponse(
        id=mock_id,
        role=briefing_in.role,
        sections=parsed_sections,
        timestamp=timestamp
    )
