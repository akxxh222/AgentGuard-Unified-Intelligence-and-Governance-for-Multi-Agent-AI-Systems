"""
Adapter test suite — AutoGen middleware.
"""
from unittest.mock import MagicMock

import pytest

from adapters.autogen.middleware import AutoGenMiddleware, instrument_autogen_agent
from adapters.otel.schema import EventStatus, EventType
from adapters.publisher import CollectingEventPublisher


@pytest.fixture
def mock_agent():
    agent = MagicMock()
    agent.name = "CodeAgent"
    agent.generate_reply.return_value = "Sure, here's the code."
    return agent


def test_middleware_wraps_generate_reply(mock_agent):
    publisher = CollectingEventPublisher()
    middleware = AutoGenMiddleware(
        mock_agent,
        agent_id="code-01",
        publisher=publisher,
        task_id="task-01",
        team_id="team-01",
    )

    result = mock_agent.generate_reply(messages=[{"role": "user", "content": "hello"}])

    assert result == "Sure, here's the code."
    start, finish = publisher.events
    assert (start.event_type, start.status) == (EventType.START, EventStatus.RUNNING)
    assert (finish.event_type, finish.status) == (EventType.FINISH, EventStatus.SUCCESS)
    assert finish.trace_id == start.trace_id
    assert finish.task_id == start.task_id == "task-01"
    assert middleware.agent is mock_agent


def test_middleware_publishes_error_event(mock_agent):
    mock_agent.generate_reply.side_effect = RuntimeError("LLM timeout")
    publisher = CollectingEventPublisher()
    AutoGenMiddleware(
        mock_agent,
        agent_id="code-01",
        publisher=publisher,
        task_id="task-01",
        team_id="team-01",
    )

    with pytest.raises(RuntimeError, match="LLM timeout"):
        mock_agent.generate_reply(messages=[])

    error = publisher.events[-1]
    assert (error.event_type, error.status) == (EventType.ERROR, EventStatus.FAILED)
    assert error.payload["error"] == "LLM timeout"


def test_instrumenting_same_agent_twice_does_not_duplicate_events(mock_agent):
    publisher = CollectingEventPublisher()
    first = instrument_autogen_agent(
        mock_agent,
        "code-01",
        publisher=publisher,
        task_id="task-01",
        team_id="team-01",
    )
    second = instrument_autogen_agent(
        mock_agent,
        "code-01",
        publisher=publisher,
        task_id="task-01",
        team_id="team-01",
    )

    mock_agent.generate_reply(messages=[])

    assert second is first
    assert len(publisher.events) == 2
