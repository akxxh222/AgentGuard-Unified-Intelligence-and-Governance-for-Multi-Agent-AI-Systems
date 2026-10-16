"""
Abstract base adapter interface.
All framework adapters must implement this contract.
"""
from abc import ABC, abstractmethod
from typing import Any


class BaseAdapter(ABC):
    """
    Base class for all agent telemetry adapters.

    Adapters are responsible for:
      1. Intercepting framework-specific events (callbacks, hooks, observers)
      2. Normalizing them into the shared UnifiedEvent dict format
      3. Publishing to Redis Streams via the OTEL exporter
    """

    def __init__(self, agent_id: str, agent_name: str, **kwargs: Any) -> None:
        self.agent_id = agent_id
        self.agent_name = agent_name
        self.config = kwargs

    @abstractmethod
    def on_event(self, event_type: str, payload: dict[str, Any]) -> None:
        """Called when a framework emits any telemetry event."""
        ...

    @abstractmethod
    def on_start(self, metadata: dict[str, Any]) -> None:
        """Called when an agent or chain starts."""
        ...

    @abstractmethod
    def on_end(self, output: dict[str, Any]) -> None:
        """Called when an agent or chain finishes."""
        ...

    @abstractmethod
    def on_error(self, error: Exception) -> None:
        """Called when an agent encounters an error."""
        ...

    def build_event(
        self,
        event_type: str,
        payload: dict[str, Any],
        framework: str,
        task_id: str | None = None,
    ) -> dict[str, Any]:
        """Helper to build a normalized event dict."""
        from datetime import datetime, timezone

        return {
            "agent_id": self.agent_id,
            "agent_name": self.agent_name,
            "task_id": task_id,
            "event_type": event_type,
            "framework": framework,
            "payload": payload,
            "ts": datetime.now(timezone.utc).isoformat(),
        }
