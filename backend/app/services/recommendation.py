import logging
import time
import requests
import json
from typing import Dict, Any
from app.core.config import Settings

logger = logging.getLogger(__name__)

# Zone capacities from SEED_DATA.md
ZONE_CAPACITIES = {
    "z1": 4000,
    "z2": 4000,
    "z3": 2500,
    "z4": 2500,
    "z5": 6000,
    "z6": 3000
}

# 2-minute per-zone debounce cache.
# Note: This resets on backend restart, which is an acceptable limitation for v1.
RECOMMENDATION_COOLDOWN: Dict[str, float] = {}

def check_density_threshold(zone_id: str, value: float) -> bool:
    """
    Pure threshold-check function.
    Returns whether density value crosses the 85% capacity trigger.
    """
    if zone_id not in ZONE_CAPACITIES:
        return False
    capacity = ZONE_CAPACITIES[zone_id]
    pct = (value / capacity) * 100
    return pct >= 85

def is_zone_in_cooldown(zone_id: str) -> bool:
    """
    Checks if a recommendation was generated for this zone in the last 2 minutes.
    """
    last_time = RECOMMENDATION_COOLDOWN.get(zone_id)
    if last_time is None:
        return False
    # 2 minutes = 120 seconds
    return (time.time() - last_time) < 120

def set_zone_cooldown(zone_id: str):
    """
    Sets or updates the debounce cooldown timestamp for the zone.
    """
    RECOMMENDATION_COOLDOWN[zone_id] = time.time()

# Pre-defined canned recommendations for DEMO_MODE or fallback scenarios
CANNED_RECOMMENDATIONS = {
    "z1": {
        "recommendationText": "Divert incoming flow from Gate A (North) to Gate D (West / z4) or Gate B (South / z2) to ease North Concourse (z1) density.",
        "alertText": {
            "en": "North Concourse is crowded. Please proceed to South Concourse or West Plaza entries.",
            "es": "El Concourse Norte está muy concurrido. Diríjase a las entradas de Concourse Sur o Plaza Oeste.",
            "fr": "Le hall nord est bondé. Veuillez vous diriger vers les entrées du hall sud ou de la place ouest."
        },
        "severity": "medium"
    },
    "z2": {
        "recommendationText": "Divert incoming flow from Gate B (South) to Gate D (West / z4) or Gate A (North / z1) to ease South Concourse (z2) density.",
        "alertText": {
            "en": "South Concourse is crowded. Please use North Concourse or West Plaza entries.",
            "es": "El Concourse Sur está muy concurrido. Utilice las entradas de Concourse Norte o Plaza Oeste.",
            "fr": "Le hall sud est bondé. Veuillez utiliser les entrées du hall nord ou de la place ouest."
        },
        "severity": "medium"
    },
    "z3": {
        "recommendationText": "Recommend closing/limiting Gate C (East) entry. Redirect transit-bridge pedestrian traffic to West Gate Plaza (z4) or South Concourse (z2) to relieve East Gate Plaza (z3).",
        "alertText": {
            "en": "East Gate Plaza is currently congested. Reroute to West Gate or South Concourse.",
            "es": "La Plaza de la Puerta Este está congestionada. Desvíese a la Puerta Oeste o Concourse Sur.",
            "fr": "L'East Gate Plaza est actuellement encombrée. Redirigez-vous vers West Gate ou South Concourse."
        },
        "severity": "high"
    },
    "z4": {
        "recommendationText": "Divert incoming flow from Gate D (West) to Gate A (North / z1) or Gate B (South / z2) to ease West Gate Plaza (z4) density.",
        "alertText": {
            "en": "West Gate Plaza is experiencing high density. Please use Gate A (North) or Gate B (South).",
            "es": "La Plaza de la Puerta Oeste experimenta alta densidad. Utilice la Puerta A (Norte) o Puerta B (Sur).",
            "fr": "West Gate Plaza connaît une forte densité. Veuillez utiliser la porte A (nord) ou la porte B (sud)."
        },
        "severity": "medium"
    },
    "z5": {
        "recommendationText": "Metro Transit Bridge (z5) is crowded. Retain fans in Fan Zone / Retail Row (z6) or North/South concourses until bridge queue clears.",
        "alertText": {
            "en": "Metro Transit Bridge is crowded. Please expect delays and enjoy the Fan Zone in the meantime.",
            "es": "El Puente de Metro Transit está lleno. Espere retrasos y disfrute de la Fan Zone mientras tanto.",
            "fr": "Le pont de transit du métro est encombré. Veuillez vous attendre à des retards et profiter de la Fan Zone en attendant."
        },
        "severity": "high"
    },
    "z6": {
        "recommendationText": "Fan Zone / Retail Row (z6) is crowded. Encourage fans to move to seat areas early via North/South concourses.",
        "alertText": {
            "en": "Retail and Fan Zone areas are congested. We suggest heading to your seats early.",
            "es": "Las áreas de tiendas y Fan Zone están congestionadas. Sugerimos dirigirse a sus asientos temprano.",
            "fr": "Les zones commerciales et de Fan Zone sont encombrées. Nous vous suggérons de vous rendre tôt à vos sièges."
        },
        "severity": "medium"
    }
}

def generate_recommendation(zone_id: str, current_value: float, settings: Settings) -> Dict[str, Any]:
    """
    Generates a rerouting recommendation utilizing Gemini structured outputs.
    Integrates DEMO_MODE and API safety/cooldown fallbacks.
    """
    fallback = CANNED_RECOMMENDATIONS.get(zone_id, {
        "recommendationText": f"Crowd density spike detected in {zone_id}. Recommend staff monitoring.",
        "alertText": {
            "en": f"Zone {zone_id} is crowded. Please follow staff directions.",
            "es": f"La zona {zone_id} está llena. Siga las instrucciones del personal.",
            "fr": f"La zone {zone_id} est bondée. Veuillez suivre les instructions du personnel."
        },
        "severity": "high"
    })

    # 1. DEMO_MODE Env Check
    if settings.demo_mode:
        logger.info("DEMO_MODE is active. Returning pre-written recommendation.")
        return fallback

    # 2. Key Check
    if not settings.gemini_api_key or settings.gemini_api_key == "dummy":
        logger.warning("No valid GEMINI_API_KEY. Using fallback recommendation.")
        return fallback

    api_url = f"https://generativelanguage.googleapis.com/v1beta/models/gemini-1.5-flash:generateContent?key={settings.gemini_api_key}"
    
    SYSTEM_INSTRUCTIONS = """
You are GroundControl Stadium Operations recommendation planner.
You monitor occupant density across stadium zones.
When a zone experiences a crowd density spike (>= 85% capacity), your task is to draft a rerouting recommendation for the staff (recommending alternatives from the available zones) and to compose public-facing alert notices in English (en), Spanish (es), and French (fr).

Static Venue Knowledge Base:
Zones:
- z1: North Concourse (Capacity: 4000, Accessible Route: Yes/True)
- z2: South Concourse (Capacity: 4000, Accessible Route: Yes/True)
- z3: East Gate Plaza (Capacity: 2500, Accessible Route: No/False)
- z4: West Gate Plaza (Capacity: 2500, Accessible Route: Yes/True)
- z5: Metro Transit Bridge (Capacity: 6000, Accessible Route: Yes/True)
- z6: Fan Zone / Retail Row (Capacity: 3000, Accessible Route: No/False)

Gates:
- g1: Gate A (North) - Connects to North Concourse (z1). Notes: Primary accessible entry.
- g2: Gate B (South) - Connects to South Concourse (z2). Notes: Secondary accessible entry.
- g3: Gate C (East) - Connects to East Gate Plaza (z3). Notes: Steps only, no ramp access.
- g4: Gate D (West) - Connects to West Gate Plaza (z4). Notes: Accessible entry and drop-off point.

Instructions:
1. Formulate a staff-facing recommendation detailing how to reroute crowd flow away from the congested zone towards adjacent or less busy zones. Keep it professional.
2. Formulate corresponding public alerts in en, es, and fr. The tone should be clear and helpful.
3. The response must be a JSON object conforming to the schema.
"""

    prompt = (
        f"Generate a rerouting recommendation for stadium zone '{zone_id}' which is currently congested at {current_value} occupants.\n"
    )

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
                    "recommendationText": {
                        "type": "STRING",
                        "description": "Staff-facing recommendation suggestion"
                    },
                    "alertText": {
                        "type": "OBJECT",
                        "properties": {
                            "en": {"type": "STRING"},
                            "es": {"type": "STRING"},
                            "fr": {"type": "STRING"}
                        },
                        "required": ["en", "es", "fr"]
                    },
                    "severity": {
                        "type": "STRING",
                        "enum": ["low", "medium", "high", "critical"],
                        "description": "Severity of this density alert"
                    }
                },
                "required": ["recommendationText", "alertText", "severity"]
            }
        }
    }

    try:
        response = requests.post(api_url, json=payload, headers={"Content-Type": "application/json"}, timeout=5.0)
        
        if response.status_code != 200:
            logger.error(f"Gemini API returned error code {response.status_code}: {response.text}")
            return fallback

        res_data = response.json()
        raw_text = res_data["candidates"][0]["content"]["parts"][0]["text"]
        parsed = json.loads(raw_text)

        # Validate structured fields
        rec_text = parsed.get("recommendationText")
        alert_dict = parsed.get("alertText")
        sev = parsed.get("severity")

        if not rec_text or not alert_dict or not sev:
            logger.warning("Gemini recommendation response missing fields. Using fallback.")
            return fallback

        # Validate severity enum
        if sev not in ["low", "medium", "high", "critical"]:
            logger.warning(f"Invalid severity level '{sev}' from Gemini. Defaulting to 'high'.")
            sev = "high"

        return {
            "recommendationText": rec_text,
            "alertText": alert_dict,
            "severity": sev
        }

    except Exception as exc:
        logger.error(f"Failed to generate recommendation via Gemini API: {exc}")
        return fallback
