"""Direct collector API for local agents and Redis-independent development."""
from fastapi import APIRouter, Query, Request, status
from app.api.websocket.manager import ws_manager
from app.models.event import Event

router = APIRouter()

def is_alert(event: Event) -> bool:
    return event.status.value in {"failed", "quarantined"} or event.event_type.value == "error"

@router.post("", status_code=status.HTTP_201_CREATED)
async def ingest_event(event: Event, request: Request):
    """Validate and ingest one canonical event without requiring Redis."""
    inserted = await request.app.state.store.ingest(event)
    data = event.model_dump(mode="json")
    if inserted:
        await ws_manager.broadcast("events", "agent_event", data)
        if is_alert(event):
            alert = await request.app.state.store.add_alert(event)
            await ws_manager.broadcast("alerts", "alert", alert)
        for finding in request.app.state.anomaly_engine.evaluate(event):
            alert = await request.app.state.store.add_detector_alert(event, finding)
            await ws_manager.broadcast("alerts", "alert", alert)
    return {"accepted": inserted, "event": data}

@router.get("")
async def list_events(request: Request, limit: int = Query(100, ge=1, le=500)):
    return [event.model_dump(mode="json") for event in await request.app.state.store.recent_events(limit)]

