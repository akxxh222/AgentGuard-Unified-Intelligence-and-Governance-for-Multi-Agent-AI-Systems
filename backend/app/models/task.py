"""
Pydantic models for Task.
"""
from datetime import datetime
from typing import Any
from uuid import UUID

from pydantic import BaseModel


class TaskBase(BaseModel):
    agent_id: UUID
    type: str
    input: dict[str, Any] | None = None


class TaskCreate(TaskBase):
    pass


class Task(TaskBase):
    id: UUID
    status: str = "pending"
    output: dict[str, Any] | None = None
    started_at: datetime | None = None
    completed_at: datetime | None = None
    created_at: datetime

    model_config = {"from_attributes": True}
