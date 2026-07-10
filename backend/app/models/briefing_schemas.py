from pydantic import BaseModel, Field
from typing import List, Literal, Optional

# Allowed volunteer roles per SEED_DATA.md and DEMO_BRIEFINGS
AllowedRole = Literal["Gate Volunteer", "Crowd Control Coordinator", "General Volunteer"]

class BriefingRequest(BaseModel):
    role: AllowedRole = Field(..., description="Volunteer role name — must be one of the allowed roles")
    shiftContext: Optional[str] = Field(None, description="Optional extra shift context details")

class BriefingSection(BaseModel):
    heading: str = Field(..., description="Short section heading")
    body: str = Field(..., description="Details and guidelines")

class BriefingResponse(BaseModel):
    id: str = Field(..., description="Unique briefing ID")
    role: str = Field(..., description="Volunteer role name")
    sections: List[BriefingSection] = Field(..., description="Structured sections of the briefing")
    timestamp: str = Field(..., description="Generation timestamp")
