import json
from uuid import UUID

import pytest
from pydantic import ValidationError

from adapters.otel.schema import EventStatus, EventType, Framework, UnifiedEvent


def make_event(**overrides):
    values = {
        "agent_id": "research-01",
        "framework": Framework.LANGCHAIN,
        "parent_agent_id": None,
        "task_id": "task-01",
        "team_id": "team-01",
        "status": EventStatus.RUNNING,
        "event_type": EventType.START,
        "tokens_in": 0,
        "tokens_out": 0,
        "cost_usd": 0.0,
        "payload": {"operation": "chain"},
    }
    values.update(overrides)
    return UnifiedEvent(**values)


def test_canonical_event_contains_every_milestone_field():
    event = make_event()

    assert set(event.model_dump()) == {
        "event_id",
        "agent_id",
        "framework",
        "parent_agent_id",
        "task_id",
        "team_id",
        "status",
        "event_type",
        "tokens_in",
        "tokens_out",
        "cost_usd",
        "timestamp",
        "trace_id",
        "payload",
    }


@pytest.mark.parametrize(
    ("field", "value"),
    [
        ("framework", "unsupported"),
        ("status", "unknown"),
        ("event_type", "chain.start"),
        ("tokens_in", -1),
        ("tokens_out", -1),
        ("cost_usd", -0.01),
    ],
)
def test_event_rejects_invalid_enum_and_negative_usage(field, value):
    with pytest.raises(ValidationError):
        make_event(**{field: value})


def test_timestamp_is_utc_and_ids_are_generated():
    event = make_event()

    UUID(event.event_id)
    UUID(event.trace_id)
    assert event.timestamp.utcoffset().total_seconds() == 0


def test_redis_payload_round_trips_exact_event():
    event = make_event(
        tokens_in=10,
        tokens_out=4,
        cost_usd=0.002,
        payload={"operation": "llm", "nested": {"ok": True}},
    )

    redis_payload = event.to_redis_payload()

    assert set(redis_payload) == {"payload"}
    assert isinstance(json.loads(redis_payload["payload"]), dict)
    assert UnifiedEvent.model_validate_json(redis_payload["payload"]) == event
