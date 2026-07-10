from pydantic import BaseModel, Field
from typing import Optional

class IncidentRequest(BaseModel):
    text: str = Field(..., min_length=1, description="Raw incident description text")

class IncidentResponse(BaseModel):
    id: str = Field(..., description="Unique incident ID")
    text: str = Field(..., description="Raw incident text")
    category: str = Field(..., description="Classified category (medical/security/crowd_control/lost_person/facility/weather/other)")
    severity: Optional[str] = Field(None, description="Classified severity (low/medium/high/critical or null)")
    draftResponse: str = Field(..., description="Draft response suggestion for staff")
    draftComms: str = Field(..., description="Draft communications message")
    status: str = Field("new", description="Incident status (e.g. new, flagged)")
    flagged: bool = Field(False, description="Whether the incident needs manual staff classification review")
    timestamp: str = Field(..., description="Report timestamp")
