"""
Normalized event schema for the Agent Control Tower OTEL exporter.
Defines the canonical shape of all events published to Redis Streams.
"""
from datetime import datetime, timezone
from enum import Enum
from typing import Any
from uuid import uuid4

from pydantic import BaseModel, ConfigDict, Field, field_validator


class Framework(str, Enum):
    LANGCHAIN = "langchain"
    AUTOGEN = "autogen"
    CREWAI = "crewai"


class EventStatus(str, Enum):
    RUNNING = "running"
    SUCCESS = "success"
    FAILED = "failed"
    PAUSED = "paused"
    QUARANTINED = "quarantined"


class EventType(str, Enum):
    START = "start"
    TOOL_CALL = "tool_call"
    LLM_CALL = "llm_call"
    FINISH = "finish"
    ERROR = "error"


class UnifiedEvent(BaseModel):
    """
    Canonical event schema — all adapters must produce this shape.

    This is published as JSON to the Redis stream ``agent.events``.
    """
    model_config = ConfigDict(extra="forbid")

    event_id: str = Field(default_factory=lambda: str(uuid4()))
    agent_id: str
    framework: Framework
    parent_agent_id: str | None = None
    task_id: str
    team_id: str
    status: EventStatus
    event_type: EventType
    tokens_in: int = Field(default=0, ge=0)
    tokens_out: int = Field(default=0, ge=0)
    cost_usd: float = Field(default=0.0, ge=0)
    timestamp: datetime = Field(default_factory=lambda: datetime.now(timezone.utc))
    trace_id: str = Field(default_factory=lambda: str(uuid4()))
    payload: dict[str, Any] = Field(default_factory=dict)

    @field_validator("event_id", "agent_id", "task_id", "team_id", "trace_id")
    @classmethod
    def require_non_empty_string(cls, value: str) -> str:
        if not value.strip():
            raise ValueError("must not be blank")
        return value

    @field_validator("parent_agent_id")
    @classmethod
    def reject_blank_parent(cls, value: str | None) -> str | None:
        if value is not None and not value.strip():
            raise ValueError("must not be blank")
        return value

    @field_validator("timestamp")
    @classmethod
    def require_timezone(cls, value: datetime) -> datetime:
        if value.tzinfo is None or value.utcoffset() is None:
            raise ValueError("timestamp must include a timezone")
        return value.astimezone(timezone.utc)

    def to_redis_payload(self) -> dict[str, str]:
        """Serialize the complete canonical event into one Redis field."""
        return {"payload": self.model_dump_json()}
