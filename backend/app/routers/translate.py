import logging
import httpx
import json
from fastapi import APIRouter, Depends, status, HTTPException
from pydantic import BaseModel, Field
from app.core.config import get_settings, Settings
from app.core.auth import require_staff_auth

logger = logging.getLogger(__name__)

router = APIRouter()

class TranslationRequest(BaseModel):
    text: str = Field(..., description="The source text to translate")
    fromLang: str = Field(..., description="The source language")
    toLang: str = Field(..., description="The target language")

class TranslationResponse(BaseModel):
    translated: str = Field(..., description="The translated text")

def translate_demo(text: str, from_lang: str, to_lang: str) -> str:
    text_lower = text.lower().strip()
    
    # Simple common stadium phrases in English mapped to other languages
    phrases = {
        "where is the nearest medical post?": {
            "Spanish": "¿Dónde está el puesto médico más cercano?",
            "Hindi": "निकटतम चिकित्सा पोस्ट कहाँ है?",
            "Arabic": "أين هو أقرب مركز طبي؟",
            "French": "Où se trouve le poste médical le plus proche?",
            "Japanese": "一番近い医療ポストはどこですか？",
            "Portuguese": "Onde fica o posto médico mais próximo?"
        },
        "please proceed to gate a.": {
            "Spanish": "Por favor, diríjase a la puerta A.",
            "Hindi": "कृपया गेट ए पर जाएं।",
            "Arabic": "يرجى الانتقال إلى البوابة أ.",
            "French": "Veuillez vous rendre à la porte A.",
            "Japanese": "ゲートAにお進みください。",
            "Portuguese": "Por favor, dirija-se ao portão A."
        }
    }
    
    # Bidirectional matching
    for eng_phrase, target_map in phrases.items():
        # Check if source text is the English phrase
        if eng_phrase in text_lower:
            for lang_key, val in target_map.items():
                if lang_key.lower() in to_lang.lower() or to_lang.lower() in lang_key.lower():
                    return val
        
        # Check if source text is one of the translated versions and target is English
        if "english" in to_lang.lower():
            for lang_key, val in target_map.items():
                if val.lower() in text_lower:
                    return eng_phrase.capitalize()

    # Generic mock response if no exact phrase matches
    return f"[Translated from {from_lang} to {to_lang}]: {text}"

@router.post("/translate", response_model=TranslationResponse, status_code=status.HTTP_200_OK)
async def translate(
    req: TranslationRequest,
    settings: Settings = Depends(get_settings),
    staff: dict = Depends(require_staff_auth)
) -> TranslationResponse:
    if not req.text.strip():
        return TranslationResponse(translated="")
        
    if settings.demo_mode:
        logger.info("DEMO_MODE is active. Returning mock translation.")
        translated = translate_demo(req.text, req.fromLang, req.toLang)
        return TranslationResponse(translated=translated)
        
    if not settings.gemini_api_key or settings.gemini_api_key == "dummy":
        logger.warning("No valid Gemini API key. Returning mock translation.")
        translated = translate_demo(req.text, req.fromLang, req.toLang)
        return TranslationResponse(translated=translated)
        
    # Call Gemini API to translate
    api_url = "https://generativelanguage.googleapis.com/v1beta/models/gemini-1.5-flash:generateContent"
    headers = {
        "Content-Type": "application/json",
        "x-goog-api-key": settings.gemini_api_key
    }
    
    system_instruction = (
        "You are an expert bidirectional translator for stadium operations volunteers and international fans.\n"
        "Your task is to translate the user input text from the specified source language (fromLang) into the target language (toLang).\n"
        "Keep the translation accurate, natural, and helpful for a stadium matchday environment.\n"
        "The response must be a JSON object with a single field: 'translated'."
    )
    
    prompt = f"Translate the following text.\nSource Language: {req.fromLang}\nTarget Language: {req.toLang}\nText:\n{req.text}"
    
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
                    "text": system_instruction
                }
            ]
        },
        "generationConfig": {
            "responseMimeType": "application/json",
            "responseSchema": {
                "type": "OBJECT",
                "properties": {
                    "translated": {
                        "type": "STRING",
                        "description": "The exact translated text"
                    }
                },
                "required": ["translated"]
            }
        }
    }
    
    try:
        async with httpx.AsyncClient() as client:
            response = await client.post(api_url, json=payload, headers=headers, timeout=5.0)
        if response.status_code != 200:
            logger.error(f"Gemini translation failed: {response.status_code} - {response.text}")
            translated = translate_demo(req.text, req.fromLang, req.toLang)
            return TranslationResponse(translated=translated)
            
        res_data = response.json()
        raw_text = res_data["candidates"][0]["content"]["parts"][0]["text"]
        parsed = json.loads(raw_text)
        translated = parsed.get("translated", "")
        if not translated:
            translated = translate_demo(req.text, req.fromLang, req.toLang)
        return TranslationResponse(translated=translated)
    except httpx.HTTPError as exc:
        logger.error(f"Gemini translation HTTP error: {exc}")
        translated = translate_demo(req.text, req.fromLang, req.toLang)
        return TranslationResponse(translated=translated)
    except Exception as exc:
        logger.error(f"Gemini translation exception: {exc}")
        translated = translate_demo(req.text, req.fromLang, req.toLang)
        return TranslationResponse(translated=translated)
