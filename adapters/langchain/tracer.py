"""
LangChain callback handler that publishes telemetry to Redis Streams.

Usage:
    from adapters.langchain.tracer import ControlTowerTracer

    tracer = ControlTowerTracer(agent_id="research-01", agent_name="ResearchAgent")
    chain = MyChain(callbacks=[tracer])
"""
import os
from typing import Any
from uuid import UUID, uuid4

try:
    from langchain_core.callbacks import BaseCallbackHandler
except ImportError:  # pragma: no cover
    class BaseCallbackHandler:  # type: ignore[no-redef]
        pass

from adapters.base import BaseAdapter
from adapters.otel.schema import EventStatus, EventType, Framework
from adapters.publisher import EventPublisher, RedisEventPublisher


REDIS_URL = os.getenv("REDIS_URL", "redis://localhost:6379")
REDIS_STREAM_KEY = os.getenv("REDIS_STREAM_KEY", "agent.events")


class ControlTowerTracer(BaseCallbackHandler, BaseAdapter):
    """
    LangChain BaseCallbackHandler that streams events to Agent Control Tower
    via Redis Streams.
    """

    def __init__(
        self,
        agent_id: str,
        agent_name: str = "",
        publisher: EventPublisher | None = None,
        task_id: str = "default",
        team_id: str = "default",
        parent_agent_id: str | None = None,
        trace_id: str | None = None,
        redis_url: str = REDIS_URL,
        stream_key: str = REDIS_STREAM_KEY,
    ) -> None:
        BaseCallbackHandler.__init__(self)
        if publisher is None:
            import redis

            publisher = RedisEventPublisher(
                redis.from_url(redis_url, decode_responses=True),
                stream_key,
            )
        BaseAdapter.__init__(
            self,
            agent_id=agent_id,
            agent_name=agent_name,
            framework=Framework.LANGCHAIN,
            publisher=publisher,
            task_id=task_id,
            team_id=team_id,
            parent_agent_id=parent_agent_id,
            trace_id=trace_id,
        )
        self._run_map: dict[str, tuple[str, str]] = {}

    def _context(self, run_id: UUID, parent_run_id: UUID | None = None) -> BaseAdapter:
        key = str(run_id)
        if key not in self._run_map:
            parent = self._run_map.get(str(parent_run_id)) if parent_run_id else None
            task_id = parent[0] if parent else self.task_id or key
            trace_id = parent[1] if parent else self.trace_id or str(uuid4())
            self._run_map[key] = (task_id, trace_id)
        task_id, trace_id = self._run_map[key]
        return BaseAdapter(
            agent_id=self.agent_id,
            agent_name=self.agent_name,
            framework=self.framework,
            publisher=self.publisher,
            task_id=task_id,
            team_id=self.team_id,
            parent_agent_id=self.parent_agent_id,
            trace_id=trace_id,
        )

    def _publish(
        self,
        run_id: UUID,
        event_type: EventType,
        status: EventStatus,
        payload: dict[str, Any],
        *,
        parent_run_id: UUID | None = None,
        **usage: Any,
    ) -> None:
        try:
            self._context(run_id, parent_run_id).publish_event(
                event_type,
                status,
                payload,
                **usage,
            )
        except Exception:
            pass

    # ── LLM ──────────────────────────────────────────────────────────────────
    def on_llm_start(self, serialized: dict, prompts: list[str], *, run_id: UUID, **kwargs: Any) -> None:
        self._publish(
            run_id,
            EventType.LLM_CALL,
            EventStatus.RUNNING,
            {"operation": "llm", "serialized": serialized, "prompt_count": len(prompts)},
            parent_run_id=kwargs.get("parent_run_id"),
        )

    def on_llm_end(self, response: Any, *, run_id: UUID, **kwargs: Any) -> None:
        usage = response.llm_output.get("token_usage", {}) if response.llm_output else {}
        model = response.llm_output.get("model_name") if response.llm_output else None
        self._publish(
            run_id,
            EventType.LLM_CALL,
            EventStatus.SUCCESS,
            {"operation": "llm", "generations": len(response.generations)},
            tokens_in=int(usage.get("prompt_tokens", 0)),
            tokens_out=int(usage.get("completion_tokens", 0)),
            model=model,
        )
        self._run_map.pop(str(run_id), None)

    def on_llm_error(self, error: Exception, *, run_id: UUID, **kwargs: Any) -> None:
        self._publish(
            run_id,
            EventType.ERROR,
            EventStatus.FAILED,
            {"operation": "llm", "error": str(error)},
        )
        self._run_map.pop(str(run_id), None)

    # ── Chain ──────────────────────────────────────────────────────────────────
    def on_chain_start(self, serialized: dict, inputs: dict, *, run_id: UUID, **kwargs: Any) -> None:
        self._publish(
            run_id,
            EventType.START,
            EventStatus.RUNNING,
            {
                "operation": "chain",
                "chain": serialized.get("id", [])[-1] if serialized.get("id") else "",
            },
            parent_run_id=kwargs.get("parent_run_id"),
        )

    def on_chain_end(self, outputs: dict, *, run_id: UUID, **kwargs: Any) -> None:
        self._publish(
            run_id,
            EventType.FINISH,
            EventStatus.SUCCESS,
            {"operation": "chain", "output": outputs},
        )
        self._run_map.pop(str(run_id), None)

    # ── Tool ──────────────────────────────────────────────────────────────────
    def on_tool_start(self, serialized: dict, input_str: str, *, run_id: UUID, **kwargs: Any) -> None:
        self._publish(
            run_id,
            EventType.TOOL_CALL,
            EventStatus.RUNNING,
            {
                "operation": "tool",
                "tool": serialized.get("name", ""),
                "input": input_str[:500],
            },
            parent_run_id=kwargs.get("parent_run_id"),
        )

    def on_tool_end(self, output: str, *, run_id: UUID, **kwargs: Any) -> None:
        self._publish(
            run_id,
            EventType.TOOL_CALL,
            EventStatus.SUCCESS,
            {"operation": "tool", "output": output[:500]},
        )
        self._run_map.pop(str(run_id), None)
