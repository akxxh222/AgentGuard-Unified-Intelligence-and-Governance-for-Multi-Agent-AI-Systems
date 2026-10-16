from fastapi import WebSocket, WebSocketDisconnect
from app.api.websocket.manager import ws_manager

async def _endpoint(websocket: WebSocket, channel: str):
    await ws_manager.connect(channel, websocket)
    try:
        while True: await websocket.receive_text()
    except WebSocketDisconnect: pass
    finally: await ws_manager.disconnect(channel, websocket)
async def events_endpoint(websocket: WebSocket): await _endpoint(websocket, "events")
async def alerts_endpoint(websocket: WebSocket): await _endpoint(websocket, "alerts")
