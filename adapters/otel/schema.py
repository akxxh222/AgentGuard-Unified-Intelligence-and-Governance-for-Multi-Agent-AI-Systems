"""
Normalized event schema for the Agent Control Tower OTEL exporter.
Defines the canonical shape of all events published to Redis Streams.
"""
from dataclasses import dataclass, field
from datetime import datetime, timezone
from typing import Any


@dataclass
class TokenUsage:
    prompt_tokens: int = 0
    completion_tokens: int = 0
    total_tokens: int = 0
    cost_usd: float | None = None


@dataclass
class UnifiedEvent:
    """
    Canonical event schema — all adapters must produce this shape.

    This is published as JSON to the Redis Stream `agent_events`.
    """
    event_type: str
    agent_id: str
    framework: str
    payload: dict[str, Any] = field(default_factory=dict)
    agent_name: str = ""
    task_id: str | None = None
    model: str | None = None
    token_usage: TokenUsage | None = None
    ts: str = field(default_factory=lambda: datetime.now(timezone.utc).isoformat())

    def to_redis_payload(self) -> dict[str, str]:
        """Serialize to flat dict for Redis XADD fields."""
        import json
        return {
            "payload": json.dumps({
                "event_type": self.event_type,
                "agent_id": self.agent_id,
                "agent_name": self.agent_name,
                "framework": self.framework,
                "task_id": self.task_id,
                "model": self.model,
                "usage": {
                    "prompt_tokens": self.token_usage.prompt_tokens,
                    "completion_tokens": self.token_usage.completion_tokens,
                    "total_tokens": self.token_usage.total_tokens,
                    "cost_usd": self.token_usage.cost_usd,
                } if self.token_usage else None,
                "payload": self.payload,
                "ts": self.ts,
            })
        }
