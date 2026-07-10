import pytest
from pydantic import ValidationError
from app.models.briefing_schemas import BriefingRequest
from app.models.density_schemas import DensityRequest

def test_briefing_request_schema():
    # Valid roles
    assert BriefingRequest(role="Gate Volunteer").role == "Gate Volunteer"
    assert BriefingRequest(role="Crowd Control Coordinator").role == "Crowd Control Coordinator"
    assert BriefingRequest(role="General Volunteer").role == "General Volunteer"
    
    # Invalid role should raise ValidationError
    with pytest.raises(ValidationError):
        BriefingRequest(role="Super Volunteer")

def test_density_request_schema():
    # Valid density request
    req = DensityRequest(zoneId="z1", value=250.5, source="manual")
    assert req.zoneId == "z1"
    assert req.value == 250.5
    assert req.source == "manual"
    
    # Invalid source should raise ValidationError
    with pytest.raises(ValidationError):
        DensityRequest(zoneId="z1", value=250.5, source="invalid_source")
