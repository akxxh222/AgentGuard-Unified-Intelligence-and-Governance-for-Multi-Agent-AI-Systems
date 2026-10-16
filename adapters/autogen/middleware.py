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

import redis

from adapters.otel.schema import UnifiedEvent

REDIS_URL = os.getenv("REDIS_URL", "redis://localhost:6379")
REDIS_STREAM_KEY = os.getenv("REDIS_STREAM_KEY", "agent_events")


class AutoGenMiddleware:
    """
    Wraps an AutoGen ConversableAgent to capture message events.
    """

    def __init__(
        self,
        agent: Any,
        agent_id: str,
        redis_url: str = REDIS_URL,
        stream_key: str = REDIS_STREAM_KEY,
    ) -> None:
        self.agent = agent
        self.agent_id = agent_id
        self._redis = redis.from_url(redis_url, decode_responses=True)
        self._stream_key = stream_key
        self._patch()

    def _publish(self, event: UnifiedEvent) -> None:
        try:
            self._redis.xadd(self._stream_key, event.to_redis_payload(), maxlen=10_000, approximate=True)
        except Exception:
            pass

    def _patch(self) -> None:
        """Monkey-patch generate_reply to capture LLM calls."""
        original_generate = self.agent.generate_reply

        @functools.wraps(original_generate)
        def patched_generate_reply(messages=None, sender=None, **kwargs):
            start = time.monotonic()
            self._publish(UnifiedEvent(
                event_type="agent.generate_reply.start",
                agent_id=self.agent_id,
                agent_name=getattr(self.agent, "name", ""),
                framework="autogen",
                payload={"message_count": len(messages) if messages else 0},
            ))
            try:
                result = original_generate(messages=messages, sender=sender, **kwargs)
                elapsed = (time.monotonic() - start) * 1000
                self._publish(UnifiedEvent(
                    event_type="agent.generate_reply.end",
                    agent_id=self.agent_id,
                    agent_name=getattr(self.agent, "name", ""),
                    framework="autogen",
                    payload={
                        "duration_ms": round(elapsed, 2),
                        "sender": getattr(sender, "name", str(sender)),
                    },
                ))
                return result
            except Exception as exc:
                self._publish(UnifiedEvent(
                    event_type="agent.generate_reply.error",
                    agent_id=self.agent_id,
                    agent_name=getattr(self.agent, "name", ""),
                    framework="autogen",
                    payload={"error": str(exc)},
                ))
                raise

        self.agent.generate_reply = patched_generate_reply


def instrument_autogen_agent(agent: Any, agent_id: str, **kwargs) -> AutoGenMiddleware:
    """Convenience function to instrument an AutoGen agent."""
    return AutoGenMiddleware(agent, agent_id, **kwargs)
