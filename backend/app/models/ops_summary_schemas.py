from pydantic import BaseModel, Field

class OpsSummaryResponse(BaseModel):
    summary: str = Field(..., description="Synthesized plain-language operational summary paragraph")
