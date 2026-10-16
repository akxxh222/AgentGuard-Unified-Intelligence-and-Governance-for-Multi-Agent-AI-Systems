"""Publishing boundaries for canonical telemetry events."""

import logging
from typing import Any, Protocol

from adapters.otel.schema import UnifiedEvent

log = logging.getLogger(__name__)


class EventPublisher(Protocol):
    def publish(self, event: UnifiedEvent) -> bool:
        """Publish one event and report whether it was accepted."""
        ...


class RedisEventPublisher:
    def __init__(
        self,
        client: Any,
        stream_key: str = "agent.events",
        max_stream_len: int = 10_000,
    ) -> None:
        self._client = client
        self._stream_key = stream_key
        self._max_stream_len = max_stream_len

    def publish(self, event: UnifiedEvent) -> bool:
        try:
            payload = event.to_redis_payload()
            self._client.xadd(
                self._stream_key,
                payload,
                maxlen=self._max_stream_len,
                approximate=True,
            )
        except Exception as exc:
            log.warning("telemetry publish failed: %s", exc)
            return False
        return True


class CollectingEventPublisher:
    def __init__(self) -> None:
        self.events: list[UnifiedEvent] = []

    def publish(self, event: UnifiedEvent) -> bool:
        self.events.append(event)
        return True
