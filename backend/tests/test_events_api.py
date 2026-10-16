from fastapi.testclient import TestClient
from app.main import app

VALID_EVENT = {
    "event_id": "event-1", "agent_id": "agent-1", "framework": "langchain",
    "status": "running", "event_type": "start", "timestamp": "2026-10-16T10:00:00Z",
    "tokens_in": 10, "tokens_out": 3, "cost_usd": 0.002, "payload": {"source": "test"},
}

def client():
    return TestClient(app)

def test_valid_event_is_ingested_and_retrieved():
    with client() as api:
        result = api.post("/events", json=VALID_EVENT)
        assert result.status_code == 201 and result.json()["accepted"] is True
        events = api.get("/events?limit=1")
        assert events.status_code == 200
        assert events.json()[0]["event_id"] == "event-1"

def test_invalid_event_returns_422():
    with client() as api:
        result = api.post("/events", json={"agent_id": "missing-required-fields"})
        assert result.status_code == 422

def test_failed_event_creates_retrievable_alert():
    event = {**VALID_EVENT, "event_id": "event-failure", "status": "failed", "event_type": "error"}
    with client() as api:
        assert api.post("/events", json=event).status_code == 201
        alerts = api.get("/alerts?limit=100")
        assert alerts.status_code == 200
        assert alerts.json()[0]["event_id"] == "event-failure"

def test_event_limit_is_validated():
    with client() as api:
        assert api.get("/events?limit=501").status_code == 422

def test_five_consecutive_tool_calls_create_exactly_one_loop_alert():
    with client() as api:
        for index in range(5):
            event = {
                **VALID_EVENT,
                "event_id": f"loop-{index}",
                "agent_id": "looping-agent",
                "trace_id": "loop-trace",
                "event_type": "tool_call",
                "payload": {"tool": "retry_compile"},
            }
            assert api.post("/events", json=event).status_code == 201

        alerts = api.get("/alerts?limit=100").json()
        loop_alerts = [alert for alert in alerts if alert.get("detector") == "loop_detector"]
        assert len(loop_alerts) == 1
        assert loop_alerts[0]["details"]["iterations"] == 5
