from adapters.otel.schema import EventStatus, EventType, Framework, UnifiedEvent
from adapters.publisher import CollectingEventPublisher, RedisEventPublisher


class RecordingRedis:
    def __init__(self, error=None):
        self.calls = []
        self.error = error

    def xadd(self, *args, **kwargs):
        if self.error:
            raise self.error
        self.calls.append((args, kwargs))
        return "1-0"


def make_event(agent_id="agent-01", payload=None):
    return UnifiedEvent(
        agent_id=agent_id,
        framework=Framework.LANGCHAIN,
        task_id="task-01",
        team_id="team-01",
        status=EventStatus.RUNNING,
        event_type=EventType.START,
        payload=payload or {"operation": "chain"},
    )


def test_redis_publisher_uses_agent_events_and_exact_payload():
    client = RecordingRedis()
    event = make_event()

    assert RedisEventPublisher(client).publish(event) is True
    assert client.calls == [
        (
            ("agent.events", event.to_redis_payload()),
            {"maxlen": 10_000, "approximate": True},
        )
    ]


def test_redis_failure_returns_false():
    client = RecordingRedis(error=ConnectionError("offline"))

    assert RedisEventPublisher(client).publish(make_event()) is False


def test_non_json_payload_returns_false_without_raising():
    client = RecordingRedis()
    event = make_event(payload={"not_json": object()})

    assert RedisEventPublisher(client).publish(event) is False
    assert client.calls == []


def test_collecting_publisher_preserves_event_order():
    publisher = CollectingEventPublisher()
    first = make_event("agent-01")
    second = make_event("agent-02")

    assert publisher.publish(first) is True
    assert publisher.publish(second) is True
    assert publisher.events == [first, second]
