import firebase_admin
from firebase_admin import credentials, firestore

from app.core.config import get_settings


def initialize_firebase() -> firestore.Client:
    """Initialize Firebase Admin SDK from backend-only environment variables."""
    if not firebase_admin._apps:
        settings = get_settings()
        private_key = settings.firebase_private_key.replace("\\n", "\n")
        credential = credentials.Certificate(
            {
                "type": "service_account",
                "project_id": settings.firebase_project_id,
                "private_key": private_key,
                "client_email": settings.firebase_client_email,
                "token_uri": "https://oauth2.googleapis.com/token",
            }
        )
        firebase_admin.initialize_app(credential, {"projectId": settings.firebase_project_id})

    return firestore.client()
