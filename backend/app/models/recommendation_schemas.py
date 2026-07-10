from pydantic import BaseModel, Field
from typing import Dict

class RecommendationResponse(BaseModel):
    id: str = Field(..., description="Unique recommendation ID")
    zoneId: str = Field(..., description="ID of the zone matching SEED_DATA")
    recommendationText: str = Field(..., description="Staff-facing recommendation suggestion")
    alertText: Dict[str, str] = Field(..., description="Multilingual alert notices keyed by en/es/fr")
    severity: str = Field(..., description="Recommendation severity (low/medium/high/critical)")
    status: str = Field(..., description="Current status (pending/approved)")
    timestamp: str = Field(..., description="Creation timestamp in ISO format")
