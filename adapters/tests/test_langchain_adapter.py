"""
Adapter test suite — LangChain tracer.
"""
import json
from unittest.mock import MagicMock, patch
from uuid import uuid4

import pytest

from adapters.langchain.tracer import ControlTowerTracer


@pytest.fixture
def tracer():
    with patch("adapters.langchain.tracer.redis") as mock_redis:
        mock_client = MagicMock()
        mock_redis.from_url.return_value = mock_client
        t = ControlTowerTracer(agent_id="test-agent", agent_name="TestAgent")
        t._mock_client = mock_client
        yield t


def test_on_chain_start_publishes_event(tracer):
    run_id = uuid4()
    tracer.on_chain_start({"id": ["MyChain"]}, {}, run_id=run_id)
    tracer._mock_client.xadd.assert_called_once()
    call_args = tracer._mock_client.xadd.call_args
    payload = json.loads(call_args[0][1]["payload"])
    assert payload["event_type"] == "chain.start"
    assert payload["agent_id"] == "test-agent"
    assert payload["framework"] == "langchain"


def test_on_llm_end_captures_tokens(tracer):
    run_id = uuid4()
    response = MagicMock()
    response.llm_output = {
        "token_usage": {"prompt_tokens": 100, "completion_tokens": 50, "total_tokens": 150},
        "model_name": "gpt-4o",
    }
    response.generations = [[MagicMock()]]
    tracer.on_llm_end(response, run_id=run_id)
    call_args = tracer._mock_client.xadd.call_args
    payload = json.loads(call_args[0][1]["payload"])
    assert payload["usage"]["prompt_tokens"] == 100
    assert payload["usage"]["total_tokens"] == 150


def test_on_tool_start_publishes_tool_name(tracer):
    run_id = uuid4()
    tracer.on_tool_start({"name": "web_search"}, "AI news", run_id=run_id)
    call_args = tracer._mock_client.xadd.call_args
    payload = json.loads(call_args[0][1]["payload"])
    assert payload["payload"]["tool"] == "web_search"
