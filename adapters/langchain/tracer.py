"""
LangChain callback handler that publishes telemetry to Redis Streams.

Usage:
    from adapters.langchain.tracer import ControlTowerTracer

    tracer = ControlTowerTracer(agent_id="research-01", agent_name="ResearchAgent")
    chain = MyChain(callbacks=[tracer])
"""
import json
from typing import Any
from uuid import UUID

import redis
from langchain_core.callbacks import BaseCallbackHandler
from langchain_core.messages import BaseMessage
from langchain_core.outputs import LLMResult

from adapters.otel.schema import TokenUsage, UnifiedEvent

import os

REDIS_URL = os.getenv("REDIS_URL", "redis://localhost:6379")
REDIS_STREAM_KEY = os.getenv("REDIS_STREAM_KEY", "agent_events")


class ControlTowerTracer(BaseCallbackHandler):
    """
    LangChain BaseCallbackHandler that streams events to Agent Control Tower
    via Redis Streams.
    """

    def __init__(
        self,
        agent_id: str,
        agent_name: str = "",
        redis_url: str = REDIS_URL,
        stream_key: str = REDIS_STREAM_KEY,
    ) -> None:
        super().__init__()
        self.agent_id = agent_id
        self.agent_name = agent_name
        self._redis = redis.from_url(redis_url, decode_responses=True)
        self._stream_key = stream_key
        self._run_map: dict[str, str] = {}  # run_id → task_id

    def _publish(self, event: UnifiedEvent) -> None:
        try:
            self._redis.xadd(self._stream_key, event.to_redis_payload(), maxlen=10_000, approximate=True)
        except Exception:
            pass  # Never block the agent

    # ── LLM ──────────────────────────────────────────────────────────────────
    def on_llm_start(self, serialized: dict, prompts: list[str], *, run_id: UUID, **kwargs: Any) -> None:
        self._publish(UnifiedEvent(
            event_type="llm.start",
            agent_id=self.agent_id,
            agent_name=self.agent_name,
            framework="langchain",
            task_id=self._run_map.get(str(run_id)),
            payload={"serialized": serialized, "prompt_count": len(prompts)},
        ))

    def on_llm_end(self, response: LLMResult, *, run_id: UUID, **kwargs: Any) -> None:
        usage = response.llm_output.get("token_usage", {}) if response.llm_output else {}
        token_usage = TokenUsage(
            prompt_tokens=usage.get("prompt_tokens", 0),
            completion_tokens=usage.get("completion_tokens", 0),
            total_tokens=usage.get("total_tokens", 0),
        ) if usage else None
        self._publish(UnifiedEvent(
            event_type="llm.end",
            agent_id=self.agent_id,
            agent_name=self.agent_name,
            framework="langchain",
            token_usage=token_usage,
            model=response.llm_output.get("model_name", "") if response.llm_output else "",
            task_id=self._run_map.get(str(run_id)),
            payload={"generations": len(response.generations)},
        ))

    def on_llm_error(self, error: Exception, *, run_id: UUID, **kwargs: Any) -> None:
        self._publish(UnifiedEvent(
            event_type="llm.error",
            agent_id=self.agent_id,
            agent_name=self.agent_name,
            framework="langchain",
            task_id=self._run_map.get(str(run_id)),
            payload={"error": str(error)},
        ))

    # ── Chain ──────────────────────────────────────────────────────────────────
    def on_chain_start(self, serialized: dict, inputs: dict, *, run_id: UUID, **kwargs: Any) -> None:
        self._publish(UnifiedEvent(
            event_type="chain.start",
            agent_id=self.agent_id,
            agent_name=self.agent_name,
            framework="langchain",
            task_id=str(run_id),
            payload={"chain": serialized.get("id", [])[-1] if serialized.get("id") else ""},
        ))

    def on_chain_end(self, outputs: dict, *, run_id: UUID, **kwargs: Any) -> None:
        self._publish(UnifiedEvent(
            event_type="chain.end",
            agent_id=self.agent_id,
            agent_name=self.agent_name,
            framework="langchain",
            task_id=str(run_id),
            payload={"output_keys": list(outputs.keys())},
        ))

    # ── Tool ──────────────────────────────────────────────────────────────────
    def on_tool_start(self, serialized: dict, input_str: str, *, run_id: UUID, **kwargs: Any) -> None:
        self._publish(UnifiedEvent(
            event_type="tool.start",
            agent_id=self.agent_id,
            agent_name=self.agent_name,
            framework="langchain",
            task_id=self._run_map.get(str(run_id)),
            payload={"tool": serialized.get("name", ""), "input": input_str[:500]},
        ))

    def on_tool_end(self, output: str, *, run_id: UUID, **kwargs: Any) -> None:
        self._publish(UnifiedEvent(
            event_type="tool.end",
            agent_id=self.agent_id,
            agent_name=self.agent_name,
            framework="langchain",
            task_id=self._run_map.get(str(run_id)),
            payload={"output_length": len(output)},
        ))
