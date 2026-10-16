"""
WebSocket connection manager — broadcasts events to all connected clients.
"""
import asyncio
import json
from typing import Any

import structlog
from fastapi import WebSocket

log = structlog.get_logger()


class WebSocketManager:
    """Manages active WebSocket connections and fan-outs events."""

    def __init__(self) -> None:
        self._connections: list[WebSocket] = []
        self._lock = asyncio.Lock()

    async def connect(self, ws: WebSocket) -> None:
        await ws.accept()
        async with self._lock:
            self._connections.append(ws)
        log.info("ws.client_connected", total=len(self._connections))

    async def disconnect(self, ws: WebSocket) -> None:
        async with self._lock:
            self._connections = [c for c in self._connections if c is not ws]
        log.info("ws.client_disconnected", total=len(self._connections))

    async def broadcast(self, event: dict[str, Any]) -> None:
        """Send JSON event to all connected clients."""
        message = json.dumps(event)
        dead: list[WebSocket] = []
        async with self._lock:
            connections = list(self._connections)
        for ws in connections:
            try:
                await ws.send_text(message)
            except Exception:
                dead.append(ws)
        for ws in dead:
            await self.disconnect(ws)

    @property
    def active_connections(self) -> int:
        return len(self._connections)


# Singleton
ws_manager = WebSocketManager()
