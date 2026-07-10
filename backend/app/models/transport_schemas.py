from pydantic import BaseModel, Field
from typing import List

class TransportModeOption(BaseModel):
    mode: str = Field(..., description="Transport mode name")
    estTime: str = Field(..., description="Estimated time to venue")
    estCO2: str = Field(..., description="Estimated CO2 round trip")

class TransportCompareResponse(BaseModel):
    illustrative: bool = Field(True, description="Always true to indicate mock/illustrative data")
    options: List[TransportModeOption] = Field(..., description="Available transport modes options")
