"""
AutoGen middleware — wraps AutoGen agent `generate_reply` and `receive`
methods to capture telemetry and publish to Redis Streams.

Usage:
    from adapters.autogen.middleware import instrument_autogen_agent
    from autogen import AssistantAgent

    agent = AssistantAgent(name="coder", llm_config={...})
    instrument_autogen_agent(agent, agent_id="code-01")
"""
import functools
import os
import time
from typing import Any

from adapters.base import BaseAdapter
from adapters.otel.schema import EventStatus, EventType, Framework
from adapters.publisher import EventPublisher, RedisEventPublisher

REDIS_URL = os.getenv("REDIS_URL", "redis://localhost:6379")
REDIS_STREAM_KEY = os.getenv("REDIS_STREAM_KEY", "agent.events")


class AutoGenMiddleware:
    """
    Wraps an AutoGen ConversableAgent to capture message events.
    """

    def __init__(
        self,
        agent: Any,
        agent_id: str,
        publisher: EventPublisher | None = None,
        task_id: str = "default",
        team_id: str = "default",
        parent_agent_id: str | None = None,
        trace_id: str | None = None,
        redis_url: str = REDIS_URL,
        stream_key: str = REDIS_STREAM_KEY,
    ) -> None:
        self.agent = agent
        self.agent_id = agent_id
        if publisher is None:
            import redis

            publisher = RedisEventPublisher(
                redis.from_url(redis_url, decode_responses=True),
                stream_key,
            )
        self._adapter = BaseAdapter(
            agent_id=agent_id,
            agent_name=getattr(agent, "name", ""),
            framework=Framework.AUTOGEN,
            publisher=publisher,
            task_id=task_id,
            team_id=team_id,
            parent_agent_id=parent_agent_id,
            trace_id=trace_id,
        )
        self._patch()

    def _publish(self, event_type: EventType, status: EventStatus, payload: dict[str, Any]) -> None:
        self._adapter.publish_event(event_type, status, payload)

    def _patch(self) -> None:
        """Monkey-patch generate_reply to capture LLM calls."""
        original_generate = self.agent.generate_reply

        @functools.wraps(original_generate)
        def patched_generate_reply(messages=None, sender=None, **kwargs):
            start = time.monotonic()
            self._publish(
                EventType.START,
                EventStatus.RUNNING,
                {"operation": "generate_reply", "message_count": len(messages) if messages else 0},
            )
            try:
                result = original_generate(messages=messages, sender=sender, **kwargs)
                elapsed = (time.monotonic() - start) * 1000
                self._publish(
                    EventType.FINISH,
                    EventStatus.SUCCESS,
                    {
                        "operation": "generate_reply",
                        "duration_ms": round(elapsed, 2),
                        "sender": getattr(sender, "name", str(sender)),
                        "output": str(result)[:1000],
                    },
                )
                return result
            except Exception as exc:
                self._publish(
                    EventType.ERROR,
                    EventStatus.FAILED,
                    {"operation": "generate_reply", "error": str(exc)},
                )
                raise

        self.agent.generate_reply = patched_generate_reply


def instrument_autogen_agent(agent: Any, agent_id: str, **kwargs) -> AutoGenMiddleware:
    """Convenience function to instrument an AutoGen agent."""
    existing = getattr(agent, "__dict__", {}).get("_act_middleware")
    if existing is not None:
        return existing
    middleware = AutoGenMiddleware(agent, agent_id, **kwargs)
    setattr(agent, "_act_middleware", middleware)
    return middleware
