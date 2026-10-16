"""
Adapter test suite — CrewAI observer.
"""
import pytest

from adapters.crewai.observer import ControlTowerObserver
from adapters.otel.schema import EventStatus, EventType
from adapters.publisher import CollectingEventPublisher


@pytest.fixture
def observer():
    publisher = CollectingEventPublisher()
    instance = ControlTowerObserver(
        agent_id="writer-01",
        agent_name="Writer",
        publisher=publisher,
        task_id="task-01",
        team_id="team-01",
    )
    instance.events = publisher.events
    return instance


def test_on_task_start_publishes(observer):
    observer.on_task_start(task_description="Research AI trends", agent_role="researcher")
    event = observer.events[0]
    assert (event.event_type, event.status) == (EventType.START, EventStatus.RUNNING)
    assert event.agent_id == "writer-01"
    assert event.trace_id and event.task_id == "task-01"


def test_on_crew_end_publishes(observer):
    observer.on_crew_end(crew_name="research_crew", result="All done.")
    event = observer.events[0]
    assert (event.event_type, event.status) == (EventType.FINISH, EventStatus.SUCCESS)
    assert event.payload["output"] == "All done."


def test_agent_action_maps_to_tool_call(observer):
    # Should not raise — adapters must be non-blocking
    observer.on_agent_action(
        agent_role="writer",
        action="Use Tool",
        tool="search",
        tool_input="latest AI news",
    )
    event = observer.events[0]
    assert event.event_type == EventType.TOOL_CALL
    assert event.payload["tool"] == "search"


def test_error_mapping_and_publisher_failure_are_non_blocking():
    class ExplodingPublisher:
        def publish(self, event):
            raise ConnectionError("offline")

    observer = ControlTowerObserver(
        agent_id="writer-01",
        publisher=ExplodingPublisher(),
        task_id="task-01",
        team_id="team-01",
    )
    observer.on_error(RuntimeError("crew failed"))
