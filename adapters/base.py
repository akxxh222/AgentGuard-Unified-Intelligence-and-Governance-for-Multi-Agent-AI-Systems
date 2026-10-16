"""
Abstract base adapter interface.
All framework adapters must implement this contract.
"""
from typing import Any
from uuid import uuid4

from adapters.otel.schema import EventStatus, EventType, Framework, UnifiedEvent
from adapters.pricing import calculate_cost
from adapters.publisher import EventPublisher


class BaseAdapter:
    """
    Base class for all agent telemetry adapters.

    Adapters are responsible for:
      1. Intercepting framework-specific events (callbacks, hooks, observers)
      2. Normalizing them into the shared UnifiedEvent dict format
      3. Publishing to Redis Streams via the OTEL exporter
    """

    def __init__(
        self,
        agent_id: str,
        agent_name: str,
        framework: Framework,
        publisher: EventPublisher,
        task_id: str,
        team_id: str,
        parent_agent_id: str | None = None,
        trace_id: str | None = None,
    ) -> None:
        if not task_id.strip():
            raise ValueError("task_id must not be blank")
        if not team_id.strip():
            raise ValueError("team_id must not be blank")
        self.agent_id = agent_id
        self.agent_name = agent_name
        self.framework = framework
        self.publisher = publisher
        self.task_id = task_id
        self.team_id = team_id
        self.parent_agent_id = parent_agent_id
        self.trace_id = trace_id or str(uuid4())

    def build_event(
        self,
        event_type: EventType,
        status: EventStatus,
        payload: dict[str, Any],
        *,
        tokens_in: int = 0,
        tokens_out: int = 0,
        model: str | None = None,
    ) -> UnifiedEvent:
        event_payload = dict(payload)
        event_payload.setdefault("agent_name", self.agent_name)
        if model:
            event_payload.setdefault("model", model)
        return UnifiedEvent(
            agent_id=self.agent_id,
            framework=self.framework,
            parent_agent_id=self.parent_agent_id,
            task_id=self.task_id,
            team_id=self.team_id,
            status=status,
            event_type=event_type,
            tokens_in=tokens_in,
            tokens_out=tokens_out,
            cost_usd=calculate_cost(model, tokens_in, tokens_out),
            trace_id=self.trace_id,
            payload=event_payload,
        )

    def publish_event(
        self,
        event_type: EventType,
        status: EventStatus,
        payload: dict[str, Any],
        *,
        tokens_in: int = 0,
        tokens_out: int = 0,
        model: str | None = None,
    ) -> bool:
        event = self.build_event(
            event_type,
            status,
            payload,
            tokens_in=tokens_in,
            tokens_out=tokens_out,
            model=model,
        )
        try:
            return self.publisher.publish(event)
        except Exception:
            return False
