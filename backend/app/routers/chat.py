import logging
import json
from typing import Optional, Literal
import httpx
from fastapi import APIRouter, Depends, status
from pydantic import BaseModel, Field

from app.core.config import get_settings, Settings

logger = logging.getLogger(__name__)

router = APIRouter()

# Supported languages and topics per SEED_DATA.md and ARCHITECTURE.md
LanguageType = Literal['en', 'es', 'fr']
TopicType = Literal['wayfinding', 'accessibility', 'transport', 'general']

class ChatRequest(BaseModel):
    message: str = Field(..., description="The user's Q&A query")
    language: LanguageType = Field(..., description="Preferred response language")
    selectedZoneId: Optional[str] = Field(None, description="Optional active zone context ID")

class ChatResponse(BaseModel):
    answer: str = Field(..., description="The response message text")
    topic: TopicType = Field(..., description="The classified category/topic")

# Pre-written responses keyed by language and topic for DEMO_MODE and fallback safety
DEMO_RESPONSES = {
    "en": {
        "wayfinding": "To navigate Northgate Stadium, refer to the venue map. Gates A & B link to the North & South Concourses (z1 & z2), Gate C links to the East Gate Plaza (z3), and Gate D links to West Gate Plaza (z4). The nearest food stalls are Northside Burgers (z1, 5 min queue), Taco Corner (z2, 12 min queue), and Eastside Pizza (z3, 8 min queue). Restrooms are located in z1, z2, and z4 (accessible) and z3 (steps-only). Parking is in Lot A (92% occupancy), Lot B (45% occupancy), and Lot D (98% occupancy).",
        "accessibility": "Northgate Stadium is committed to accessibility. Gates A, B, and D provide fully accessible step-free routes. Note that Gate C (East Gate Plaza / z3) and Retail Row (z6) are steps-only and do not have ramp access.",
        "transport": "For eco-friendly transit, we recommend the Metro/transit option (35 min, 1.2 kg CO₂). Walking or biking takes 25–40 min with ~0 kg CO₂. Rideshare options emit 4.5 kg CO₂ (shared) to 8.0 kg CO₂ (private) per round trip.",
        "general": "Welcome to GroundControl! I can help you with wayfinding, accessibility info, or transport comparisons for Northgate Stadium. Please ask your question."
    },
    "es": {
        "wayfinding": "Para navegar por el Estadio Northgate, consulte el mapa. Las Puertas A y B conectan con las Explanadas Norte y Sur (z1 y z2), la Puerta C conecta con la Plaza Este (z3) y la Puerta D con la Plaza Oeste (z4). Los puestos de comida más cercanos son Northside Burgers (z1, 5 min de espera), Taco Corner (z2, 12 min de espera) y Eastside Pizza (z3, 8 min de espera). Los baños están en z1, z2 y z4 (accesibles) y z3 (solo escalones). El estacionamiento está disponible en Lot A (92% de ocupación), Lot B (45% de ocupación) y Lot D (98% de ocupación).",
        "accessibility": "El Estadio Northgate cuenta con rutas accesibles. Las Puertas A, B y D ofrecen accesos sin escalones. Tenga en cuenta que la Puerta C (Plaza de la Puerta Este / z3) y la Fila de Tiendas (z6) solo tienen escalones y no disponen de rampa.",
        "transport": "Para un viaje ecológico, recomendamos el Metro/transporte público (35 min, 1.2 kg de CO₂). Caminar o ir en bicicleta toma 25-40 min con ~0 kg de CO₂. Las opciones de viaje compartido emiten de 4.5 kg a 8.0 kg de CO₂ por viaje de ida y vuelta.",
        "general": "¡Bienvenido a GroundControl! Puedo ayudarle con la navegación, accesibilidad o comparación de transporte para el Estadio Northgate. Por favor, haga su consulta."
    },
    "fr": {
        "wayfinding": "Pour vous déplacer dans le Stade Northgate, consultez le plan. Les Portes A et B relient les halls Nord et Sud (z1 et z2), la Porte C relie l'Esplanade Est (z3) et la Porte D relie l'Esplanade Ouest (z4). Les stands de nourriture les plus proches sont Northside Burgers (z1, 5 min d'attente), Taco Corner (z2, 12 min d'attente) et Eastside Pizza (z3, 8 min d'attente). Des toilettes sont situées dans z1, z2 et z4 (accessibles) et z3 (escaliers uniquement). Le parking est disponible au Lot A (92% d'occupation), Lot B (45% d'occupation) et Lot D (98% d'occupation).",
        "accessibility": "Le Stade Northgate est accessible. Les Portes A, B et D proposent des itinéraires sans marches. Attention: la Porte C (Esplanade Est / z3) et la rangée des magasins (z6) ne disposent pas de rampe d'accès.",
        "transport": "Pour un trajet écologique, nous recommandons le Métro/transport (35 min, 1.2 kg CO₂). La marche ou le vélo prend 25–40 min avec ~0 kg CO₂. Les trajets partagés ou privés en voiture émettent de 4.5 kg à 8.0 kg CO₂.",
        "general": "Bienvenue sur GroundControl ! Je peux vous aider pour le guidage, l'accessibilité ou la comparaison des transports au Stade Northgate. Posez-moi votre question."
    }
}

def classify_topic_by_keywords(message: str) -> TopicType:
    """Helper keyword matcher to classify topics multilingually in fallback/demo scenarios."""
    msg = message.lower()
    
    # Accessibility keywords
    acc_keywords = [
        "access", "wheelchair", "step-free", "ramp", "disability", "disabl", "handicap", "elevator", "lift", 
        "accessible", "wheel", "chair", "stepless", "stairs", "silla de ruedas", "rampa", "ascensor", 
        "elevador", "escalones", "fauteuil roulant", "rampe", "ascenseur", "escalier", "step"
    ]
    if any(k in msg for k in acc_keywords):
        return "accessibility"
        
    # Transport keywords
    trans_keywords = [
        "metro", "bus", "train", "transit", "ride", "taxi", "uber", "lyft", "drive", "car", "co2", "emission", 
        "green", "transport", "bike", "walk", "emissions", "eco", "autobús", "tránsito", "viaje", "coche", 
        "bici", "caminar", "métro", "voiture", "émissions", "vélo", "marcher", "eco-transport"
    ]
    if any(k in msg for k in trans_keywords):
        return "transport"
        
    # Wayfinding keywords
    way_keywords = [
        "gate", "zone", "concourse", "plaza", "bridge", "find", "where", "how to get", "route", "direction", 
        "map", "seating", "seat", "block", "located", "locate", "puerta", "mapa", "dirección", "dónde", 
        "asiento", "porte", "carte", "où", "siège",
        "hungry", "food", "stall", "burger", "pizza", "taco", "eat", "washroom", "toilet", "restroom", "wc", "parking", "lot", "park"
    ]
    if any(k in msg for k in way_keywords):
        return "wayfinding"
        
    return "general"

SYSTEM_INSTRUCTIONS = """
You are GroundControl Matchday Assistant, a helpful AI copilot for fans attending Northgate Stadium (an unofficial FIFA World Cup 2026 concept).
Your task is to answer user questions using only the following official venue, gate, zone, and transport data. Do not make up any gates or accessibility information.

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

Food Stalls (Amenities):
- f1: Northside Burgers - Linked Zone: z1, Cuisine: Burgers & Fries, Queue Time: 5 min
- f2: Taco Corner - Linked Zone: z2, Cuisine: Mexican Street Tacos, Queue Time: 12 min
- f3: Eastside Pizza - Linked Zone: z3, Cuisine: Fresh Pizza Slices, Queue Time: 8 min
- f4: Vegan Goals - Linked Zone: z4, Cuisine: Plant-based Wraps, Queue Time: 3 min
- f5: Metro Pretzel - Linked Zone: z5, Cuisine: Pretzels & Churros, Queue Time: 15 min
- f6: World Cup Cantina - Linked Zone: z6, Cuisine: Global Bites & Drinks, Queue Time: 20 min

Washrooms (Amenities):
- w1: North Restrooms - Linked Zone: z1, Accessible: Yes/True, Notes: Male/Female/Gender-Neutral, step-free access
- w2: South Restrooms - Linked Zone: z2, Accessible: Yes/True, Notes: Male/Female, step-free access
- w3: East Plaza Restrooms - Linked Zone: z3, Accessible: No/False, Notes: Male/Female, steps-only (no wheelchair ramp)
- w4: West Plaza Restrooms - Linked Zone: z4, Accessible: Yes/True, Notes: Family/Gender-Neutral, step-free access
- w5: Fan Zone Restrooms - Linked Zone: z6, Accessible: No/False, Notes: Porta-potties, steps-only

Parking Areas (Amenities):
- p1: Lot A (North Parking) - Linked Gate/Zone: g1 / z1, Capacity: 1500 spaces, Occupancy Rate: 92%, Notes: Closest to North Concourse
- p2: Lot B (South Parking) - Linked Gate/Zone: g2 / z2, Capacity: 2000 spaces, Occupancy Rate: 45%, Notes: Recommended parking, step-free
- p3: Lot D (West VIP Lot) - Linked Gate/Zone: g4 / z4, Capacity: 500 spaces, Occupancy Rate: 98%, Notes: Permit only, accessible drop-off

Transport Comparison:
- Metro/transit: 35 min, 1.2 kg CO₂ impact per person (round trip)
- Rideshare (shared): 20 min, 4.5 kg CO₂ impact per person (round trip)
- Rideshare (private): 18 min, 8.0 kg CO₂ impact per person (round trip)
- Walking/biking: 25-40 min, ~0 kg CO₂ impact

Instructions:
1. Answer the user's question politely and accurately in the requested language.
2. The response must be a JSON object with two fields:
   - "answer": (string) The plain-text response text.
   - "topic": (string) Must be exactly one of: "wayfinding", "accessibility", "transport", or "general".
3. If the user mentions accessibility, step-free access, wheelchairs, or ramps, classify as "accessibility".
4. If the user asks about transit, METRO, rideshare, driving, CO2, or how to travel to the stadium, classify as "transport".
5. If the user asks about zones, gates, finding seating, or directions, classify as "wayfinding".
6. Keep the answers concise and tailored to the requested language.
7. Wherever a time, distance, or wait estimate is knowable from the data supplied (e.g. travel times, emissions, or capacities), you must state it as a number, not a vague adjective (e.g. use '35 min' or '1.2 kg CO₂' instead of 'a short ride' or 'low emissions').
"""

@router.post(
    "/chat",
    response_model=ChatResponse,
    status_code=status.HTTP_200_OK,
)
async def chat(request_data: ChatRequest, settings: Settings = Depends(get_settings)) -> ChatResponse:
    # Ensure language is lowercase for lookup safety
    lang = request_data.language.lower()
    if lang not in ["en", "es", "fr"]:
        lang = "en"

    # 1. DEMO_MODE Env Check
    if settings.demo_mode:
        logger.info("DEMO_MODE is active. Returning pre-written response.")
        matched_topic = classify_topic_by_keywords(request_data.message)
        answer = DEMO_RESPONSES[lang][matched_topic]
        return ChatResponse(answer=answer, topic=matched_topic)

    # 2. Live Gemini Call with context injected
    matched_topic = classify_topic_by_keywords(request_data.message)
    fallback_response = ChatResponse(answer=DEMO_RESPONSES[lang][matched_topic], topic=matched_topic)

    if not settings.gemini_api_key or settings.gemini_api_key == "dummy":
        logger.warning("No valid GEMINI_API_KEY. Using fallback response.")
        return fallback_response

    # Call Gemini API via REST with a 5-second timeout and header auth
    api_url = "https://generativelanguage.googleapis.com/v1beta/models/gemini-1.5-flash:generateContent"
    headers = {
        "Content-Type": "application/json",
        "x-goog-api-key": settings.gemini_api_key
    }
    
    prompt = f"User Message: {request_data.message}\n"
    if request_data.selectedZoneId:
        prompt += f"Active Selected Zone ID Context: {request_data.selectedZoneId}\n"
    prompt += f"Requested Language: {request_data.language}\n"

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
                    "answer": {
                        "type": "STRING",
                        "description": "Plain-text response in the user's requested language"
                    },
                    "topic": {
                        "type": "STRING",
                        "enum": ["wayfinding", "accessibility", "transport", "general"],
                        "description": "The category/topic of the user question"
                    }
                },
                "required": ["answer", "topic"]
            }
        }
    }

    try:
        async with httpx.AsyncClient() as client:
            response = await client.post(api_url, json=payload, headers=headers, timeout=5.0)
        
        if response.status_code != 200:
            logger.error(f"Gemini API returned error code {response.status_code}: {response.text}")
            return fallback_response

        res_data = response.json()
        raw_text = res_data["candidates"][0]["content"]["parts"][0]["text"]
        parsed = json.loads(raw_text)

        # Validate structured fields
        answer_text = parsed.get("answer")
        topic_text = parsed.get("topic")

        if not answer_text or topic_text not in ["wayfinding", "accessibility", "transport", "general"]:
            logger.warning("Gemini response missing required fields or enum value. Using fallback.")
            return fallback_response

        return ChatResponse(answer=answer_text, topic=topic_text)

    except httpx.HTTPError as exc:
        logger.error(f"Request to Gemini API failed or timed out: {exc}")
        return fallback_response
    except (KeyError, IndexError, json.JSONDecodeError) as exc:
        logger.error(f"Failed to parse structured response from Gemini: {exc}")
        return fallback_response
