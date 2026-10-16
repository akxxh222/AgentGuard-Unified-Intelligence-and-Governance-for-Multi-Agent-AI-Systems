"""
Redis Streams consumer — reads normalized agent events and fans out
to the WebSocket manager and anomaly engine.
"""
import asyncio
import json
from typing import Any

import redis.asyncio as aioredis
import structlog

from app.api.websocket.manager import ws_manager
from app.config import settings
from app.core.log_normalizer import LogNormalizer

log = structlog.get_logger()


class EventBus:
    """Consumes Redis Stream `agent_events` and dispatches to downstream consumers."""

    def __init__(self) -> None:
        self._redis: aioredis.Redis | None = None
        self._task: asyncio.Task | None = None
        self._running = False
        self._normalizer = LogNormalizer()

    async def start(self) -> None:
        self._redis = await aioredis.from_url(
            settings.REDIS_URL, decode_responses=True
        )
        # Ensure consumer group exists
        try:
            await self._redis.xgroup_create(
                settings.REDIS_STREAM_KEY,
                settings.REDIS_CONSUMER_GROUP,
                id="0",
                mkstream=True,
            )
        except Exception:
            pass  # group already exists

        self._running = True
        self._task = asyncio.create_task(self._consume_loop())
        log.info("event_bus.started", stream=settings.REDIS_STREAM_KEY)

    async def stop(self) -> None:
        self._running = False
        if self._task:
            self._task.cancel()
        if self._redis:
            await self._redis.aclose()
        log.info("event_bus.stopped")

    async def _consume_loop(self) -> None:
        while self._running:
            try:
                results: list[Any] = await self._redis.xreadgroup(  # type: ignore[union-attr]
                    groupname=settings.REDIS_CONSUMER_GROUP,
                    consumername=settings.REDIS_CONSUMER_NAME,
                    streams={settings.REDIS_STREAM_KEY: ">"},
                    count=10,
                    block=1000,
                )
                for _stream, messages in results:
                    for msg_id, fields in messages:
                        await self._handle(msg_id, fields)
            except asyncio.CancelledError:
                break
            except Exception as exc:
                log.error("event_bus.error", error=str(exc))
                await asyncio.sleep(1)

    async def _handle(self, msg_id: str, fields: dict[str, str]) -> None:
        try:
            raw = json.loads(fields.get("payload", "{}"))
            event = self._normalizer.normalize(raw)
            # Broadcast to all WebSocket clients
            await ws_manager.broadcast({"type": "event.raw", "ts": event.get("ts"), "data": event})
            # Acknowledge the message
            await self._redis.xack(  # type: ignore[union-attr]
                settings.REDIS_STREAM_KEY,
                settings.REDIS_CONSUMER_GROUP,
                msg_id,
            )
        except Exception as exc:
            log.error("event_bus.handle_error", msg_id=msg_id, error=str(exc))
