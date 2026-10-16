"""Separate event and governance WebSocket fan-out channels."""
import asyncio
from datetime import datetime, timezone
from fastapi import WebSocket

class WebSocketManager:
    def __init__(self) -> None: self._channels = {"events": set(), "alerts": set()}; self._lock = asyncio.Lock()
    async def connect(self, channel: str, websocket: WebSocket) -> None:
        await websocket.accept()
        async with self._lock: self._channels[channel].add(websocket)
        await websocket.send_json({"type": "connection_status", "timestamp": datetime.now(timezone.utc).isoformat(), "data": {"channel": channel, "connected": True}})
    async def disconnect(self, channel: str, websocket: WebSocket) -> None:
        async with self._lock: self._channels[channel].discard(websocket)
    async def broadcast(self, channel: str, message_type: str, data: dict) -> None:
        envelope = {"type": message_type, "timestamp": datetime.now(timezone.utc).isoformat(), "data": data}
        async with self._lock: clients = list(self._channels[channel])
        dead = []
        for client in clients:
            try: await client.send_json(envelope)
            except Exception: dead.append(client)
        for client in dead: await self.disconnect(channel, client)
    async def close(self) -> None:
        for channel in list(self._channels):
            async with self._lock: clients = list(self._channels[channel]); self._channels[channel].clear()
            for client in clients:
                try: await client.close(code=1001)
                except Exception: pass
ws_manager = WebSocketManager()
