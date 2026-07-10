import logging
import json
from typing import Optional, Literal
import requests
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
        "wayfinding": "To navigate Northgate Stadium, refer to the venue map. Gates A & B link to the North & South Concourses (z1 & z2), Gate C links to the East Gate Plaza (z3), and Gate D links to the West Gate Plaza (z4). The Metro Transit Bridge is z5 and Retail Row is z6.",
        "accessibility": "Northgate Stadium is committed to accessibility. Gates A, B, and D provide fully accessible step-free routes. Note that Gate C (East Gate Plaza / z3) and Retail Row (z6) are steps-only and do not have ramp access.",
        "transport": "For eco-friendly transit, we recommend the Metro/transit option (35 min, 1.2 kg CO₂). Walking or biking takes 25–40 min with ~0 kg CO₂. Rideshare options emit 4.5 kg CO₂ (shared) to 8.0 kg CO₂ (private) per round trip.",
        "general": "Welcome to GroundControl! I can help you with wayfinding, accessibility info, or transport comparisons for Northgate Stadium. Please ask your question."
    },
    "es": {
        "wayfinding": "Para navegar por el Estadio Northgate, consulte el mapa. Las Puertas A y B conectan con las Explanadas Norte y Sur (z1 y z2), la Puerta C conecta con la Plaza de la Puerta Este (z3) y la Puerta D con la Plaza de la Puerta Oeste (z4). El Puente del Metro es z5 y la Fila de Tiendas es z6.",
        "accessibility": "El Estadio Northgate cuenta con rutas accesibles. Las Puertas A, B y D ofrecen accesos sin escalones. Tenga en cuenta que la Puerta C (Plaza de la Puerta Este / z3) y la Fila de Tiendas (z6) solo tienen escalones y no disponen de rampa.",
        "transport": "Para un viaje ecológico, recomendamos el Metro/transporte público (35 min, 1.2 kg de CO₂). Caminar o ir en bicicleta toma 25-40 min con ~0 kg de CO₂. Las opciones de viaje compartido emiten de 4.5 kg a 8.0 kg de CO₂ por viaje de ida y vuelta.",
        "general": "¡Bienvenido a GroundControl! Puedo ayudarle con la navegación, accesibilidad o comparación de transporte para el Estadio Northgate. Por favor, haga su consulta."
    },
    "fr": {
        "wayfinding": "Pour vous déplacer dans le Stade Northgate, consultez le plan. Les Portes A et B relient les halls Nord et Sud (z1 et z2), la Porte C relie l'Esplanade de la Porte Est (z3) et la Porte D relie l'Esplanade de la Porte Ouest (z4). Le pont de transit du métro est z5 et la rangée des magasins est z6.",
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
        "asiento", "porte", "carte", "où", "siège"
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

    # Call Gemini API via REST with a 5-second timeout
    api_url = f"https://generativelanguage.googleapis.com/v1beta/models/gemini-1.5-flash:generateContent?key={settings.gemini_api_key}"
    
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
        response = requests.post(api_url, json=payload, headers={"Content-Type": "application/json"}, timeout=5.0)
        
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

    except requests.exceptions.RequestException as exc:
        logger.error(f"Request to Gemini API failed or timed out: {exc}")
        return fallback_response
    except (KeyError, IndexError, json.JSONDecodeError) as exc:
        logger.error(f"Failed to parse structured response from Gemini: {exc}")
        return fallback_response
