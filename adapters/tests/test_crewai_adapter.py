"""
Adapter test suite — CrewAI observer.
"""
import json
from unittest.mock import MagicMock, patch

import pytest

from adapters.crewai.observer import ControlTowerObserver


@pytest.fixture
def observer():
    with patch("adapters.crewai.observer.redis") as mock_redis:
        mock_client = MagicMock()
        mock_redis.from_url.return_value = mock_client
        obs = ControlTowerObserver()
        obs._mock_client = mock_client
        yield obs


def test_on_task_start_publishes(observer):
    observer.on_task_start(task_description="Research AI trends", agent_role="researcher")
    observer._mock_client.xadd.assert_called_once()
    payload = json.loads(observer._mock_client.xadd.call_args[0][1]["payload"])
    assert payload["event_type"] == "task.start"
    assert payload["framework"] == "crewai"
    assert payload["agent_id"] == "researcher"


def test_on_crew_end_publishes(observer):
    observer.on_crew_end(crew_name="research_crew", result="All done.")
    payload = json.loads(observer._mock_client.xadd.call_args[0][1]["payload"])
    assert payload["event_type"] == "crew.end"
    assert payload["payload"]["result_length"] == len("All done.")


def test_observer_does_not_raise_on_redis_failure(observer):
    observer._mock_client.xadd.side_effect = ConnectionError("Redis down")
    # Should not raise — adapters must be non-blocking
    observer.on_agent_action(
        agent_role="writer",
        action="Use Tool",
        tool="search",
        tool_input="latest AI news",
    )
