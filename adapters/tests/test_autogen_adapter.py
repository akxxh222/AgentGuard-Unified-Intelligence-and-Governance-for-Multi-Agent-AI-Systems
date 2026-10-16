"""
Adapter test suite — AutoGen middleware.
"""
import json
from unittest.mock import MagicMock, patch

import pytest

from adapters.autogen.middleware import AutoGenMiddleware


@pytest.fixture
def mock_agent():
    agent = MagicMock()
    agent.name = "CodeAgent"
    agent.generate_reply.return_value = "Sure, here's the code."
    return agent


def test_middleware_wraps_generate_reply(mock_agent):
    with patch("adapters.autogen.middleware.redis") as mock_redis:
        mock_client = MagicMock()
        mock_redis.from_url.return_value = mock_client
        mw = AutoGenMiddleware(mock_agent, agent_id="code-01")

        messages = [{"role": "user", "content": "Write a hello world"}]
        result = mock_agent.generate_reply(messages=messages)

        assert result == "Sure, here's the code."
        # Two events: start + end
        assert mock_client.xadd.call_count == 2

        first_payload = json.loads(mock_client.xadd.call_args_list[0][0][1]["payload"])
        assert first_payload["event_type"] == "agent.generate_reply.start"
        assert first_payload["framework"] == "autogen"


def test_middleware_publishes_error_event(mock_agent):
    mock_agent.generate_reply.side_effect = RuntimeError("LLM timeout")

    with patch("adapters.autogen.middleware.redis") as mock_redis:
        mock_client = MagicMock()
        mock_redis.from_url.return_value = mock_client
        mw = AutoGenMiddleware(mock_agent, agent_id="code-01")

        with pytest.raises(RuntimeError):
            mock_agent.generate_reply(messages=[])

        payloads = [json.loads(c[0][1]["payload"]) for c in mock_client.xadd.call_args_list]
        error_events = [p for p in payloads if "error" in p["event_type"]]
        assert len(error_events) == 1
        assert "LLM timeout" in error_events[0]["payload"]["error"]
