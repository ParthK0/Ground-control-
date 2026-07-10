from fastapi.testclient import TestClient
from app.main import create_app

def test_health_check_endpoint():
    app = create_app()
    with TestClient(app) as client:
        response = client.get("/health")
        assert response.status_code == 200
        assert response.json() == {"status": "ok"}

def test_transport_compare_endpoint():
    app = create_app()
    with TestClient(app) as client:
        response = client.get("/transport-compare")
        assert response.status_code == 200
        data = response.json()
        assert data["illustrative"] is True
        assert len(data["options"]) > 0
        assert data["options"][0]["mode"] == "Metro/transit"

def test_density_validation_endpoint():
    app = create_app()
    # Mock settings.demo_mode to true to bypass live firebase calls if needed
    from app.core.config import get_settings
    settings = get_settings()
    settings.demo_mode = True
    
    with TestClient(app) as client:
        # Invalid zone ID
        response = client.post("/density", json={
            "zoneId": "z99",
            "value": 100,
            "source": "manual"
        }, headers={"Authorization": f"Bearer {settings.staff_auth_secret}"})
        assert response.status_code == 400
        assert "Invalid zoneId" in response.json()["detail"]
        
        # Valid request
        response = client.post("/density", json={
            "zoneId": "z1",
            "value": 500,
            "source": "manual"
        }, headers={"Authorization": f"Bearer {settings.staff_auth_secret}"})
        assert response.status_code == 200
        assert response.json()["zoneId"] == "z1"
        assert response.json()["value"] == 500
