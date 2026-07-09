from fastapi import APIRouter
from starlette.status import HTTP_501_NOT_IMPLEMENTED

from app.models.stubs import NotImplementedResponse

router = APIRouter()


@router.get(
    "/transport-compare",
    response_model=NotImplementedResponse,
    status_code=HTTP_501_NOT_IMPLEMENTED,
)
async def compare_transport() -> NotImplementedResponse:
    return NotImplementedResponse(detail="Not implemented")
