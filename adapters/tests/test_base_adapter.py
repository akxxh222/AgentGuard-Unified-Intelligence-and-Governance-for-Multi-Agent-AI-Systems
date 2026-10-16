import pytest

from adapters.base import BaseAdapter
from adapters.otel.schema import EventStatus, EventType, Framework
from adapters.publisher import CollectingEventPublisher


class ExplodingPublisher:
    def publish(self, event):
        raise ConnectionError("offline")


def make_adapter(publisher=None, **overrides):
    values = {
        "agent_id": "agent-01",
        "agent_name": "Research Agent",
        "framework": Framework.LANGCHAIN,
        "publisher": publisher or CollectingEventPublisher(),
        "task_id": "task-01",
        "team_id": "team-01",
    }
    values.update(overrides)
    return BaseAdapter(**values)


def test_base_adapter_generates_and_reuses_trace_id():
    adapter = make_adapter()

    first = adapter.build_event(EventType.START, EventStatus.RUNNING, {"operation": "chain"})
    second = adapter.build_event(EventType.TOOL_CALL, EventStatus.RUNNING, {"tool": "search"})

    assert first.trace_id
    assert second.trace_id == first.trace_id
    assert second.task_id == "task-01"
    assert second.team_id == "team-01"


@pytest.mark.parametrize(("field", "value"), [("task_id", ""), ("team_id", "  ")])
def test_base_adapter_rejects_blank_task_or_team_id(field, value):
    with pytest.raises(ValueError, match=field):
        make_adapter(**{field: value})


def test_publish_event_delegates_without_raising():
    collecting = CollectingEventPublisher()
    adapter = make_adapter(publisher=collecting)

    assert adapter.publish_event(
        EventType.LLM_CALL,
        EventStatus.SUCCESS,
        {"operation": "llm"},
        tokens_in=1_000_000,
        tokens_out=1_000_000,
        model="gpt-4o",
    ) is True
    assert collecting.events[0].cost_usd == 20.0
    assert collecting.events[0].payload["agent_name"] == "Research Agent"

    failing = make_adapter(publisher=ExplodingPublisher())
    assert failing.publish_event(EventType.ERROR, EventStatus.FAILED, {"error": "boom"}) is False
