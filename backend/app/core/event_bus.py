"""Redis Streams consumer with validate-before-ack semantics."""
import asyncio
import json
import redis.asyncio as aioredis
import logging
from app.api.websocket.manager import ws_manager
from app.config import settings
from app.core.log_normalizer import LogNormalizer

log = logging.getLogger(__name__)
class EventBus:
    def __init__(self, store, anomaly_engine) -> None:
        self.store = store; self.anomaly_engine = anomaly_engine; self._redis = None; self._task = None; self._running = False; self._normalizer = LogNormalizer()
    async def start(self) -> None:
        try:
            self._redis = aioredis.from_url(settings.REDIS_URL, decode_responses=False, socket_connect_timeout=2)
            await self._redis.ping()
            try: await self._redis.xgroup_create(settings.REDIS_STREAM_KEY, settings.REDIS_CONSUMER_GROUP, id="0", mkstream=True)
            except Exception: pass
            self._running = True; self._task = asyncio.create_task(self._consume_loop())
        except Exception as exc: log.warning("event_bus unavailable: %s", exc)
    async def stop(self) -> None:
        self._running = False
        if self._task: self._task.cancel(); await asyncio.gather(self._task, return_exceptions=True)
        if self._redis: await self._redis.aclose()
    async def ready(self) -> bool:
        try: return self._redis is not None and bool(await self._redis.ping())
        except Exception: return False
    async def _consume_loop(self) -> None:
        delay = .25
        while self._running:
            try:
                rows = await self._redis.xreadgroup(settings.REDIS_CONSUMER_GROUP, settings.REDIS_CONSUMER_NAME, {settings.REDIS_STREAM_KEY: ">"}, count=20, block=1000)
                for _, messages in rows:
                    for message_id, fields in messages: await self._handle(message_id, fields)
                delay = .25
            except asyncio.CancelledError: break
            except Exception as exc: log.error("event_bus read failed: %s", exc); await asyncio.sleep(delay); delay = min(delay * 2, 10)
    async def _handle(self, message_id, fields) -> None:
        try:
            event = self._normalizer.normalize(fields)
        except ValueError as exc:
            log.warning("invalid event %s: %s", message_id, exc)
            # Invalid messages are copied to a dead-letter stream then acknowledged.
            await self._redis.xadd(settings.REDIS_DEAD_LETTER_STREAM, {"original_id": message_id, "fields": json.dumps({str(k): str(v) for k,v in fields.items()}), "error": str(exc)})
            await self._redis.xack(settings.REDIS_STREAM_KEY, settings.REDIS_CONSUMER_GROUP, message_id); return
        inserted = await self.store.ingest(event)
        if inserted:
            data = event.model_dump(mode="json"); await ws_manager.broadcast("events", "agent_event", data)
            if event.status.value in {"failed", "quarantined"} or event.event_type.value == "error":
                alert = await self.store.add_alert(event)
                await ws_manager.broadcast("alerts", "alert", alert)
            for finding in self.anomaly_engine.evaluate(event):
                alert = await self.store.add_detector_alert(event, finding)
                await ws_manager.broadcast("alerts", "alert", alert)
        await self._redis.xack(settings.REDIS_STREAM_KEY, settings.REDIS_CONSUMER_GROUP, message_id)
