from fastapi import APIRouter, HTTPException, Request, Query
from pydantic import BaseModel, Field
from app.api.websocket.manager import ws_manager
router = APIRouter()
class Decision(BaseModel): comment: str | None = Field(default=None, max_length=2000)
@router.get("")
async def list_escalations(request: Request, status: str | None = None, limit: int = Query(100, ge=1, le=500), offset: int = Query(0, ge=0)): return await request.app.state.store.list_escalations(status, limit, offset)
async def decide(escalation_id: str, payload: Decision, request: Request, decision: str):
    row = await request.app.state.store.decide(escalation_id, decision, payload.comment)
    if row is None: raise HTTPException(404, "Escalation not found")
    if row is False: raise HTTPException(409, "Escalation has already been decided")
    bus = getattr(request.app.state, "event_bus", None)
    if bus and bus._redis:
        try: await bus._redis.xadd(request.app.state.settings.REDIS_COMMAND_STREAM, {"type": "escalation_decision", "escalation_id": escalation_id, "decision": decision})
        except Exception: pass
    await ws_manager.broadcast("alerts", "escalation_update", row); return row
@router.post("/{escalation_id}/approve")
async def approve(escalation_id: str, payload: Decision, request: Request): return await decide(escalation_id, payload, request, "approved")
@router.post("/{escalation_id}/reject")
async def reject(escalation_id: str, payload: Decision, request: Request): return await decide(escalation_id, payload, request, "rejected")
