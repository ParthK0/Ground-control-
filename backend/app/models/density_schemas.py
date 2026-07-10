from typing import Literal
from pydantic import BaseModel, Field, ConfigDict

class DensityRequest(BaseModel):
    model_config = ConfigDict(populate_by_name=True)
    zoneId: str = Field(..., description="ID of the zone matching SEED_DATA")
    value: float = Field(..., description="The count or value of density in the zone")
    source: Literal["manual", "simulated"] = Field(..., description="Source of the reading")

class DensityResponse(BaseModel):
    model_config = ConfigDict(populate_by_name=True)
    id: str
    zoneId: str = Field(..., description="ID of the zone matching SEED_DATA")
    value: float
    source: str
    timestamp: str
