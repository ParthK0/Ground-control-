from contextlib import asynccontextmanager
import logging
import time
from collections import defaultdict

from fastapi import FastAPI, Request
from fastapi.middleware.cors import CORSMiddleware
from fastapi.responses import JSONResponse
from starlette.middleware.base import BaseHTTPMiddleware
from starlette.types import ASGIApp

from app.core.config import get_settings
from app.routers import briefing, chat, density, health, incident, recommendations, transport, ops_summary, translate, waste
from app.services.firebase import initialize_firebase

logger = logging.getLogger(__name__)


# Custom middleware to limit the size of incoming requests (32 KB limit)
class LimitUploadSizeMiddleware(BaseHTTPMiddleware):
    def __init__(self, app: ASGIApp, max_upload_size: int = 32768):
        super().__init__(app)
        self.max_upload_size = max_upload_size

    async def dispatch(self, request: Request, call_next):
        if request.method in ("POST", "PUT", "PATCH"):
            content_length = request.headers.get("content-length")
            if content_length:
                try:
                    if int(content_length) > self.max_upload_size:
                        return JSONResponse(
                            status_code=413,
                            content={"detail": "Payload too large. Maximum size is 32 KB."}
                        )
                except ValueError:
                    return JSONResponse(
                        status_code=400,
                        content={"detail": "Invalid content-length header."}
                    )
            
            # Read body to enforce size ceiling for chunked/unstated lengths
            body = await request.body()
            if len(body) > self.max_upload_size:
                return JSONResponse(
                    status_code=413,
                    content={"detail": "Payload too large. Maximum size is 32 KB."}
                )

        return await call_next(request)


# Custom in-memory rate-limiting middleware (8 requests per minute)
RATE_LIMIT = 8
WINDOW_SECONDS = 60
request_history = defaultdict(list)

class RateLimitingMiddleware(BaseHTTPMiddleware):
    async def dispatch(self, request: Request, call_next):
        path = request.url.path
        # Only rate limit resource-intensive generation/database endpoints
        if any(prefix in path for prefix in ["/chat", "/briefing", "/translate", "/recommendations", "/incident"]):
            client_ip = request.client.host if request.client else "unknown"
            if client_ip == "testclient" or get_settings().demo_mode:
                return await call_next(request)
            now = time.time()
            
            # Filter timestamps to keep only current window
            timestamps = request_history[client_ip]
            timestamps = [t for t in timestamps if now - t < WINDOW_SECONDS]
            
            if len(timestamps) >= RATE_LIMIT:
                retry_after = int(WINDOW_SECONDS - (now - timestamps[0]))
                headers = {
                    "X-RateLimit-Limit": str(RATE_LIMIT),
                    "X-RateLimit-Remaining": "0",
                    "Retry-After": str(retry_after)
                }
                return JSONResponse(
                    status_code=429,
                    content={"detail": "Too many requests. Please try again later."},
                    headers=headers
                )
            
            timestamps.append(now)
            request_history[client_ip] = timestamps
            remaining = max(0, RATE_LIMIT - len(timestamps))

            response = await call_next(request)
            response.headers["X-RateLimit-Limit"] = str(RATE_LIMIT)
            response.headers["X-RateLimit-Remaining"] = str(remaining)
            return response
            
        return await call_next(request)


@asynccontextmanager
async def lifespan(app: FastAPI):
    app.state.local_density_store = []
    app.state.local_recommendations_store = []
    app.state.local_alerts_store = []
    app.state.local_incidents_store = []
    app.state.local_briefings_store = []
    try:
        app.state.firestore = initialize_firebase()
    except Exception as exc:
        logger.warning("Firebase Admin SDK was not initialized: %s", exc)
        app.state.firestore = None
    yield


def create_app() -> FastAPI:
    settings = get_settings()
    app = FastAPI(title="GroundControl API", lifespan=lifespan)

    app.add_middleware(RateLimitingMiddleware)
    app.add_middleware(LimitUploadSizeMiddleware)

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
    app.include_router(ops_summary.router)
    app.include_router(translate.router)
    app.include_router(waste.router)


    return app


app = create_app()
