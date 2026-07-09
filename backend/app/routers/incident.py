from fastapi import APIRouter
from starlette.status import HTTP_501_NOT_IMPLEMENTED

from app.models.stubs import NotImplementedResponse

router = APIRouter()


@router.post(
    "/incident",
    response_model=NotImplementedResponse,
    status_code=HTTP_501_NOT_IMPLEMENTED,
)
async def create_incident() -> NotImplementedResponse:
    return NotImplementedResponse(detail="Not implemented")
