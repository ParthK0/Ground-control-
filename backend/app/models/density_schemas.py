from typing import Literal
from pydantic import BaseModel, Field

class DensityRequest(BaseModel):
    zoneId: str = Field(..., alias="zoneId")
    value: float = Field(..., description="The count or value of density in the zone")
    source: Literal["manual", "simulated"] = Field(..., description="Source of the reading")

    class Config:
        populate_by_name = True

class DensityResponse(BaseModel):
    id: str
    zoneId: str = Field(..., alias="zoneId")
    value: float
    source: str
    timestamp: str

    class Config:
        populate_by_name = True
