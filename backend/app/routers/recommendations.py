from fastapi import APIRouter
from starlette.status import HTTP_501_NOT_IMPLEMENTED

from app.models.stubs import NotImplementedResponse

router = APIRouter()


@router.get(
    "/recommendations",
    response_model=NotImplementedResponse,
    status_code=HTTP_501_NOT_IMPLEMENTED,
)
async def list_recommendations() -> NotImplementedResponse:
    return NotImplementedResponse(detail="Not implemented")


@router.post(
    "/recommendations/{id}/approve",
    response_model=NotImplementedResponse,
    status_code=HTTP_501_NOT_IMPLEMENTED,
)
async def approve_recommendation(id: str) -> NotImplementedResponse:
    return NotImplementedResponse(detail="Not implemented")
