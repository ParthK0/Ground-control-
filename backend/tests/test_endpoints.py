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
    settings.demo_mode = True
    with TestClient(app) as client:
        response = client.post("/incident", json={
            "text": "A fan is injured and needs help near North Concourse z1"
        }, headers={"Authorization": f"Bearer {settings.staff_auth_secret}"})
        assert response.status_code == 200
        data = response.json()
        assert data["category"] == "medical"
        assert "North Medical Post" in data["draftResponse"]
        assert "0m" in data["draftResponse"]

# ─── Integration: /chat endpoint ──────────────────────────────────────────────

def test_chat_demo_mode_returns_answer():
    """Full pipeline: POST /chat in DEMO_MODE returns a valid answer."""
    app = create_app()
    settings = get_settings()
    settings.demo_mode = True

    with TestClient(app) as client:
        response = client.post("/chat", json={
            "message": "Where is the nearest accessible gate?",
            "language": "en"
        })
        assert response.status_code == 200
        data = response.json()
        assert "answer" in data
        assert len(data["answer"]) > 10
        assert "topic" in data

def test_chat_empty_message_rejected():
    """Empty message must be rejected with 422 validation error."""
    app = create_app()
    with TestClient(app) as client:
        response = client.post("/chat", json={
            "message": "",
            "language": "en"
        })
        assert response.status_code in (400, 422)

def test_chat_unsupported_language_defaults_gracefully():
    """Unsupported language code should be handled without 500 error."""
    app = create_app()
    settings = get_settings()
    settings.demo_mode = True

    with TestClient(app) as client:
        response = client.post("/chat", json={
            "message": "Where is Gate A?",
            "language": "xx"  # unsupported code
        })
        # Must not crash — either returns answer or validation error
        assert response.status_code in (200, 400, 422)

# ─── Integration: /briefing endpoint ──────────────────────────────────────────

def test_briefing_demo_mode_returns_sections():
    """Full pipeline: POST /briefing returns structured sections."""
    app = create_app()
    settings = get_settings()
    settings.demo_mode = True

    with TestClient(app) as client:
        response = client.post("/briefing", json={
            "role": "Gate Volunteer"
        }, headers={"Authorization": f"Bearer {settings.staff_auth_secret}"})
        assert response.status_code == 200
        data = response.json()
        assert "sections" in data
        assert len(data["sections"]) >= 3
        # Each section must have heading and body
        for section in data["sections"]:
            assert "heading" in section
            assert "body" in section
            assert len(section["heading"]) > 0
            assert len(section["body"]) > 0

def test_briefing_with_shift_context():
    """Shift context is appended as an extra section."""
    app = create_app()
    settings = get_settings()
    settings.demo_mode = True

    with TestClient(app) as client:
        response = client.post("/briefing", json={
            "role": "Crowd Control Coordinator",
            "shiftContext": "Zone 3 at 88% density tonight."
        }, headers={"Authorization": f"Bearer {settings.staff_auth_secret}"})
        assert response.status_code == 200
        data = response.json()
        # Shift context section should be included
        all_bodies = " ".join(s["body"] for s in data["sections"])
        assert "Zone 3" in all_bodies or "88%" in all_bodies

def test_briefing_requires_auth():
    """Briefing endpoint must reject unauthenticated requests."""
    app = create_app()
    with TestClient(app) as client:
        response = client.post("/briefing", json={"role": "Gate Volunteer"})
        assert response.status_code in (401, 403)

# ─── Integration: /incident classification ───────────────────────────────────

def test_incident_too_short_rejected():
    """Incident text must be non-empty."""
    app = create_app()
    settings = get_settings()
    settings.demo_mode = True
    with TestClient(app) as client:
        response = client.post("/incident", json={
            "text": ""
        }, headers={"Authorization": f"Bearer {settings.staff_auth_secret}"})
        # Empty text should be rejected by schema min_length=1
        assert response.status_code in (400, 422)

def test_incident_security_event_classified():
    """Security-type incident is classified in the correct category."""
    app = create_app()
    settings = get_settings()
    settings.demo_mode = True
    with TestClient(app) as client:
        response = client.post("/incident", json={
            "text": "Unruly fan attempting to access restricted area near South Concourse z2 — security team alerted"
        }, headers={"Authorization": f"Bearer {settings.staff_auth_secret}"})
        assert response.status_code == 200
        data = response.json()
        assert data["category"] in ("security", "crowd_control")
        assert data["severity"] in ("high", "critical", "medium", "low")
        assert len(data["draftResponse"]) > 10

def test_incident_response_has_required_fields():
    """Incident response must always include category, severity, draftResponse."""
    app = create_app()
    settings = get_settings()
    settings.demo_mode = True
    with TestClient(app) as client:
        response = client.post("/incident", json={
            "text": "Crowd crush risk at Gate C East Plaza — fans pushing at turnstile"
        }, headers={"Authorization": f"Bearer {settings.staff_auth_secret}"})
        assert response.status_code == 200
        data = response.json()
        assert "category" in data
        assert "severity" in data
        assert "draftResponse" in data
        # severity must be one of the allowed enum values
        assert data["severity"] in ("low", "medium", "high", "critical")
        # category must be one of the allowed enum values
        assert data["category"] in (
            "medical", "security", "crowd_control",
            "lost_person", "facility", "weather", "other"
        )
