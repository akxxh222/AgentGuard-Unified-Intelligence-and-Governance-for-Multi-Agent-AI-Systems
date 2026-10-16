import json
import pytest
from app.core.log_normalizer import LogNormalizer

VALID = {"event_id": "evt-1", "agent_id": "agent-1", "framework": "langchain", "status": "running", "event_type": "start", "timestamp": "2026-10-16T10:00:00Z", "payload": {}}

def test_normalizes_byte_encoded_redis_payload():
    event = LogNormalizer().normalize({b"payload": json.dumps(VALID).encode()})
    assert event.event_id == "evt-1"

@pytest.mark.parametrize("payload", ["{bad", {**VALID, "framework": "unknown"}, {k: v for k, v in VALID.items() if k != "event_id"}])
def test_rejects_malformed_events(payload):
    fields = {"payload": payload if isinstance(payload, str) else json.dumps(payload)}
    with pytest.raises(ValueError): LogNormalizer().normalize(fields)
