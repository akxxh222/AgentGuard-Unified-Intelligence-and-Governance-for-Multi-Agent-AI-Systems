"""
Pydantic models for Event.
"""
from datetime import datetime
from typing import Any
from uuid import UUID

from pydantic import BaseModel


class Event(BaseModel):
    id: UUID
    agent_id: UUID | None = None
    task_id: UUID | None = None
    event_type: str
    payload: dict[str, Any]
    framework: str | None = None
    ts: datetime

    model_config = {"from_attributes": True}
