"""
WebSocket event endpoint — upgrades HTTP to WS and keeps the connection alive.
"""
import asyncio

import structlog
from fastapi import WebSocket, WebSocketDisconnect

from app.api.websocket.manager import ws_manager

log = structlog.get_logger()


async def ws_endpoint(websocket: WebSocket):
    """Accept WebSocket connection and hold until client disconnects."""
    await ws_manager.connect(websocket)
    try:
        while True:
            # Keep alive — client can send pings but we mostly push
            data = await asyncio.wait_for(websocket.receive_text(), timeout=30)
            log.debug("ws.message_received", data=data)
    except (WebSocketDisconnect, asyncio.TimeoutError):
        pass
    finally:
        await ws_manager.disconnect(websocket)
