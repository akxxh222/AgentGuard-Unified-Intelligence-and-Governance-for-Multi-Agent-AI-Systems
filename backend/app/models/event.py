"""Canonical event contract consumed from Redis Streams."""
from datetime import datetime
from enum import Enum
from typing import Any
from pydantic import BaseModel, ConfigDict, Field

class Framework(str, Enum):
    langchain = "langchain"
    autogen = "autogen"
    crewai = "crewai"
class AgentStatus(str, Enum):
    running = "running"
    success = "success"
    failed = "failed"
    paused = "paused"
    quarantined = "quarantined"
class EventType(str, Enum):
    start = "start"
    tool_call = "tool_call"
    llm_call = "llm_call"
    finish = "finish"
    error = "error"
class Event(BaseModel):
    """Version-one wire contract. IDs are strings to support framework IDs."""
    model_config = ConfigDict(extra="forbid")
    event_id: str = Field(min_length=1)
    agent_id: str = Field(min_length=1)
    framework: Framework
    parent_agent_id: str | None = None
    task_id: str | None = None
    team_id: str | None = None
    status: AgentStatus
    event_type: EventType
    tokens_in: int = Field(default=0, ge=0)
    tokens_out: int = Field(default=0, ge=0)
    cost_usd: float = Field(default=0.0, ge=0)
    timestamp: datetime
    trace_id: str | None = None
    payload: dict[str, Any] = Field(default_factory=dict)
