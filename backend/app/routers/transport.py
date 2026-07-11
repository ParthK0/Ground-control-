from fastapi import APIRouter, status
from app.models.transport_schemas import TransportCompareResponse, TransportModeOption

from app.core.weather import MOCK_WEATHER_SIGNAL

router = APIRouter()

STATIC_TRANSPORT_OPTIONS = [
    TransportModeOption(mode="Metro/transit", estTime="35 min", estCO2="1.2 kg"),
    TransportModeOption(mode="Rideshare (shared)", estTime="20 min", estCO2="4.5 kg"),
    TransportModeOption(mode="Rideshare (private)", estTime="18 min", estCO2="8.0 kg"),
    TransportModeOption(mode="Walking/biking (if applicable)", estTime="25–40 min", estCO2="~0 kg")
]

@router.get("/transport-compare", response_model=TransportCompareResponse, status_code=status.HTTP_200_OK)
async def compare_transport() -> TransportCompareResponse:
    reasoning = None
    if MOCK_WEATHER_SIGNAL.get("condition") in ["rain", "storm"]:
        reasoning = "rain incoming — metro beats rideshare pickup queues"
        
    return TransportCompareResponse(
        illustrative=True,
        options=STATIC_TRANSPORT_OPTIONS,
        reasoning=reasoning
    )

