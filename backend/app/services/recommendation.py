import logging
import time
import httpx
import json
from typing import Dict, Any
from app.core.config import Settings
from app.core.constants import ZONE_CAPACITIES, RECOMMENDATION_COOLDOWN_SECS, DENSITY_THRESHOLD_PCT

logger = logging.getLogger(__name__)

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
    return pct >= DENSITY_THRESHOLD_PCT

def is_zone_in_cooldown(zone_id: str) -> bool:
    """
    Checks if a recommendation was generated for this zone in the last 2 minutes.
    """
    last_time = RECOMMENDATION_COOLDOWN.get(zone_id)
    if last_time is None:
        return False
    return (time.time() - last_time) < RECOMMENDATION_COOLDOWN_SECS

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

    api_url = "https://generativelanguage.googleapis.com/v1beta/models/gemini-1.5-flash:generateContent"
    headers = {
        "Content-Type": "application/json",
        "x-goog-api-key": settings.gemini_api_key
    }
    
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
4. Wherever a time, distance, capacity, or density percentage is knowable from the data supplied (e.g. current occupancy value or capacity limits), you must state it as a number in the recommendation and alert texts, not a vague adjective.
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
        response = httpx.post(api_url, json=payload, headers=headers, timeout=5.0)
        
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
            logger.warning("Invalid severity level '%s' from Gemini. Defaulting to 'high'.", sev)
            sev = "high"

        return {
            "recommendationText": rec_text,
            "alertText": alert_dict,
            "severity": sev
        }

    except Exception as exc:
        logger.error(f"Failed to generate recommendation via Gemini API: {exc}")
        return fallback


# Waste / Queue prediction and recommendation logic
STALL_RECOMMENDATION_COOLDOWN: Dict[str, float] = {}
FOOD_STALLS = {
    "f1": {"name": "Northside Burgers", "zone": "z1", "cuisine": "Burgers & Fries"},
    "f2": {"name": "Taco Corner", "zone": "z2", "cuisine": "Mexican Street Tacos"},
    "f3": {"name": "Eastside Pizza", "zone": "z3", "cuisine": "Fresh Pizza Slices"},
    "f4": {"name": "Vegan Goals", "zone": "z4", "cuisine": "Plant-based Wraps"},
    "f5": {"name": "Metro Pretzel", "zone": "z5", "cuisine": "Pretzels & Churros"},
    "f6": {"name": "World Cup Cantina", "zone": "z6", "cuisine": "Global Bites & Drinks"}
}

CANNED_WASTE_RECOMMENDATIONS = {
    "f1": {
        "recommendationText": "Sanitation Alert: High volume at Northside Burgers (z1). Deploy 2 extra cleaning crew members and increase bin clearing frequency to every 15 minutes. Dispatch 1 queue manager to coordinate crowds.",
        "alertText": {
            "en": "Northside Burgers (Zone 1) is currently busy with a 15-minute queue. Try Vegan Goals in Zone 4 (3-minute queue) for faster service.",
            "es": "Northside Burgers (Zona 1) está lleno con una fila de 15 minutos. Pruebe Vegan Goals en la Zona 4 (fila de 3 minutos) para un servicio más rápido.",
            "fr": "Northside Burgers (Zone 1) est actuellement très fréquenté avec une file d'attente de 15 minutes. Essayez Vegan Goals en Zone 4 (3 minutes d'attente) pour un service plus rapide."
        },
        "severity": "medium"
    },
    "f2": {
        "recommendationText": "Sanitation Alert: High volume at Taco Corner (z2). Deploy 2 extra cleaning crew members and increase bin clearing frequency to every 15 minutes. Dispatch 1 queue manager to coordinate crowds.",
        "alertText": {
            "en": "Taco Corner (Zone 2) is experiencing a 20-minute queue. Try Eastside Pizza in Zone 3 (8-minute queue) to save time.",
            "es": "Taco Corner (Zona 2) tiene una fila de 20 minutos. Pruebe Eastside Pizza en la Zona 3 (fila de 8 minutos) para ahorrar tiempo.",
            "fr": "Taco Corner (Zone 2) a une file d'attente de 20 minutes. Essayez Eastside Pizza en Zone 3 (8 minutes d'attente) pour gagner du temps."
        },
        "severity": "medium"
    }
}

def is_stall_in_cooldown(stall_id: str) -> bool:
    last_time = STALL_RECOMMENDATION_COOLDOWN.get(stall_id)
    if last_time is None:
        return False
    return (time.time() - last_time) < 120

def set_stall_cooldown(stall_id: str):
    STALL_RECOMMENDATION_COOLDOWN[stall_id] = time.time()

def generate_waste_recommendation(stall_id: str, sales_count: float, settings: Settings) -> Dict[str, Any]:
    stall_info = FOOD_STALLS.get(stall_id, {"name": f"Stall {stall_id}", "zone": "z1", "cuisine": "Food"})
    stall_name = stall_info["name"]
    zone_id = stall_info["zone"]
    
    fallback = CANNED_WASTE_RECOMMENDATIONS.get(stall_id, {
        "recommendationText": f"Sanitation Alert: High volume at {stall_name} ({zone_id}). Deploy 1 extra cleaning crew member and empty bins every 20 minutes.",
        "alertText": {
            "en": f"{stall_name} ({zone_id}) is busy. Consider other nearby stalls to avoid queues.",
            "es": f"{stall_name} ({zone_id}) está concurrido. Considere otros puestos cercanos para evitar filas.",
            "fr": f"{stall_name} ({zone_id}) est très fréquenté. Pensez à d'autres stands à proximité pour éviter les files."
        },
        "severity": "medium"
    })

    if settings.demo_mode:
        logger.info("DEMO_MODE is active. Returning canned waste recommendation.")
        return fallback

    if not settings.gemini_api_key or settings.gemini_api_key == "dummy":
        logger.warning("No valid GEMINI_API_KEY. Using fallback waste recommendation.")
        return fallback

    api_url = "https://generativelanguage.googleapis.com/v1beta/models/gemini-1.5-flash:generateContent"
    headers = {
        "Content-Type": "application/json",
        "x-goog-api-key": settings.gemini_api_key
    }
    
    SYSTEM_INSTRUCTIONS_WASTE = """
You are GroundControl Stadium Sanitation and Crowd Control recommendation planner.
You monitor transaction volumes at stadium food stalls.
When a food stall experiences high transaction volume (salesCount >= 50), your task is to draft:
1. A staff-facing recommendation detailing how to allocate cleaning crew (e.g. bin emptying frequency, sanitation workers) and queue management resources to that stall's zone.
2. A public-facing alert in English (en), Spanish (es), and French (fr) suggesting alternative nearby food options to distribute the queue.

Food Stall Static Knowledge Base:
- f1: Northside Burgers (Zone: z1, Cuisine: Burgers & Fries)
- f2: Taco Corner (Zone: z2, Cuisine: Mexican Street Tacos)
- f3: Eastside Pizza (Zone: z3, Cuisine: Fresh Pizza Slices)
- f4: Vegan Goals (Zone: z4, Cuisine: Plant-based Wraps)
- f5: Metro Pretzel (Zone: z5, Cuisine: Pretzels & Churros)
- f6: World Cup Cantina (Zone: z6, Cuisine: Global Bites & Drinks)

Instructions:
1. Formulate a staff-facing recommendation detailing how to increase sanitation bin empty cycles or deploy extra clean-up crews to the stall's zone, and how to manage the queue.
2. Formulate corresponding public alerts in en, es, and fr recommending alternative stalls in other zones to direct fans away from the long queues.
3. The response must be a JSON object conforming to the schema.
4. Wherever a number of crew members, queue duration (minutes), or distance is estimated, you must state it as a number, not a vague adjective (e.g. use '2 sanitation crew' or '15 min queue' instead of 'some crew' or 'long queue').
"""

    prompt = (
        f"Generate a sanitation and queue recommendation for food stall '{stall_name}' (ID: {stall_id}) in zone '{zone_id}' "
        f"which has reached {sales_count} sales transactions.\n"
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
                    "text": SYSTEM_INSTRUCTIONS_WASTE
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
                        "description": "Staff-facing sanitation/queue recommendation suggestion"
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
                        "description": "Severity of this waste/queue alert"
                    }
                },
                "required": ["recommendationText", "alertText", "severity"]
            }
        }
    }

    try:
        response = httpx.post(api_url, json=payload, headers=headers, timeout=5.0)
        
        if response.status_code != 200:
            logger.error(f"Gemini Waste API returned error code {response.status_code}: {response.text}")
            return fallback

        res_data = response.json()
        raw_text = res_data["candidates"][0]["content"]["parts"][0]["text"]
        parsed = json.loads(raw_text)

        rec_text = parsed.get("recommendationText")
        alert_dict = parsed.get("alertText")
        sev = parsed.get("severity")

        if not rec_text or not alert_dict or not sev:
            logger.warning("Gemini waste recommendation response missing fields. Using fallback.")
            return fallback

        if sev not in ["low", "medium", "high", "critical"]:
            logger.warning("Invalid severity level '%s' from Gemini. Defaulting to 'medium'.", sev)
            sev = "medium"

        return {
            "recommendationText": rec_text,
            "alertText": alert_dict,
            "severity": sev
        }

    except Exception as exc:
        logger.error(f"Failed to generate waste recommendation via Gemini API: {exc}")
        return fallback

