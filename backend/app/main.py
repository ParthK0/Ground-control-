from contextlib import asynccontextmanager
import logging

from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware

from app.core.config import get_settings
from app.routers import briefing, chat, density, health, incident, recommendations, transport
from app.services.firebase import initialize_firebase

logger = logging.getLogger(__name__)


@asynccontextmanager
async def lifespan(app: FastAPI):
    try:
        app.state.firestore = initialize_firebase()
    except ValueError as exc:
        logger.warning("Firebase Admin SDK was not initialized: %s", exc)
        app.state.firestore = None
    yield


def create_app() -> FastAPI:
    settings = get_settings()
    app = FastAPI(title="GroundControl API", lifespan=lifespan)

    app.add_middleware(
        CORSMiddleware,
        allow_origins=[settings.frontend_origin],
        allow_credentials=True,
        allow_methods=["GET", "POST"],
        allow_headers=["Authorization", "Content-Type"],
    )

    app.include_router(health.router)
    app.include_router(chat.router)
    app.include_router(density.router)
    app.include_router(recommendations.router)
    app.include_router(incident.router)
    app.include_router(briefing.router)
    app.include_router(transport.router)

    return app


app = create_app()
