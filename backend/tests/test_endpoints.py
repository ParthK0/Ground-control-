from fastapi.testclient import TestClient
from app.main import create_app
from app.core.config import get_settings

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
        assert data["reasoning"] == "rain incoming — metro beats rideshare pickup queues"

def test_ops_summary_endpoint():
    app = create_app()
    settings = get_settings()
    with TestClient(app) as client:
        response = client.post(
            "/ops-summary", 
            headers={"Authorization": f"Bearer {settings.staff_auth_secret}"}
        )
        assert response.status_code == 200
        data = response.json()
        assert "summary" in data
        assert len(data["summary"]) > 20

def test_density_validation_endpoint():
    app = create_app()
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

def test_translate_endpoint():
    app = create_app()
    settings = get_settings()
    with TestClient(app) as client:
        response = client.post("/translate", json={
            "text": "where is the nearest medical post?",
            "fromLang": "English",
            "toLang": "Spanish"
        }, headers={"Authorization": f"Bearer {settings.staff_auth_secret}"})
        assert response.status_code == 200
        data = response.json()
        assert "translated" in data
        assert data["translated"] == "¿Dónde está el puesto médico más cercano?"

def test_food_stall_volume_endpoint():
    app = create_app()
    settings = get_settings()
    with TestClient(app) as client:
        # Invalid stall
        response = client.post("/food-stall-volume", json={
            "stallId": "f99",
            "salesCount": 10
        }, headers={"Authorization": f"Bearer {settings.staff_auth_secret}"})
        assert response.status_code == 400
        
        # Valid stall, under threshold
        response = client.post("/food-stall-volume", json={
            "stallId": "f1",
            "salesCount": 10
        }, headers={"Authorization": f"Bearer {settings.staff_auth_secret}"})
        assert response.status_code == 200
        data = response.json()
        assert data["status"] == "processed"
        assert data["recommendationCreated"] is False
        
        # Valid stall, over threshold
        from app.services.recommendation import STALL_RECOMMENDATION_COOLDOWN
        STALL_RECOMMENDATION_COOLDOWN.clear()
        
        response = client.post("/food-stall-volume", json={
            "stallId": "f1",
            "salesCount": 55
        }, headers={"Authorization": f"Bearer {settings.staff_auth_secret}"})
        assert response.status_code == 200
        data = response.json()
        assert data["status"] == "processed"
        assert data["recommendationCreated"] is True

def test_incident_resource_suggestion_endpoint():
    app = create_app()
    settings = get_settings()
    with TestClient(app) as client:
        response = client.post("/incident", json={
            "text": "A fan is injured and needs help near North Concourse z1"
        }, headers={"Authorization": f"Bearer {settings.staff_auth_secret}"})
        assert response.status_code == 200
        data = response.json()
        assert data["category"] == "medical"
        assert "North Medical Post" in data["draftResponse"]
        assert "0m" in data["draftResponse"]
