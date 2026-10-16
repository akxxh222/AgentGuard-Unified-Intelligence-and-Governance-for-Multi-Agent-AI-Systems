"""
Pydantic models for Agent.
"""
from datetime import datetime
from typing import Any
from uuid import UUID

from pydantic import BaseModel


class AgentBase(BaseModel):
    name: str
    framework: str  # langchain | autogen | crewai | custom
    metadata: dict[str, Any] = {}


class AgentCreate(AgentBase):
    pass


class AgentUpdate(BaseModel):
    name: str | None = None
    status: str | None = None
    metadata: dict[str, Any] | None = None


class Agent(AgentBase):
    id: UUID
    status: str = "idle"
    created_at: datetime
    updated_at: datetime

    model_config = {"from_attributes": True}
