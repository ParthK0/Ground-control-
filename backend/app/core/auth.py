import logging
from fastapi import Depends, HTTPException, status
from fastapi.security import HTTPBearer, HTTPAuthorizationCredentials
from firebase_admin import auth

from app.core.config import get_settings, Settings

logger = logging.getLogger(__name__)
security = HTTPBearer()

def require_staff_auth(
    credentials: HTTPAuthorizationCredentials = Depends(security),
    settings: Settings = Depends(get_settings)
) -> dict:
    """
    Dependency that extracts the HTTP Bearer token and verifies it as a Firebase ID token.
    If the token matches staff_auth_secret, accepts it immediately as a bypass.
    Otherwise, if Firebase is configured, verifies it against Firebase Admin SDK.
    """
    token = credentials.credentials
    if not token:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Missing authorization credentials"
        )
    
    # 1. Local secret bypass check (works regardless of Firebase configuration)
    if token == settings.staff_auth_secret:
        return {"uid": "demo_staff", "email": "staff@groundcontrol.com"}

    # 2. Live Firebase Token verification (if Firebase is configured and not stubbed)
    if settings.firebase_project_id and settings.firebase_project_id != "test":
        try:
            decoded_token = auth.verify_id_token(token)
            return decoded_token
        except Exception as exc:
            logger.error(f"Firebase token verification failed: {exc}")
            raise HTTPException(
                status_code=status.HTTP_401_UNAUTHORIZED,
                detail="Invalid or expired Firebase ID token"
            )

    # 3. If token did not match secret and Firebase is not configured
    raise HTTPException(
        status_code=status.HTTP_401_UNAUTHORIZED,
        detail="Invalid staff authorization token"
    )
