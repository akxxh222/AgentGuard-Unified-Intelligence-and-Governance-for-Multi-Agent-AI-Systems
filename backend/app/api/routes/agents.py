from datetime import datetime
from fastapi import APIRouter, HTTPException, Query, Request
from pydantic import BaseModel
router = APIRouter()
class AgentResponse(BaseModel):
    agent_id: str; framework: str; parent_agent_id: str | None = None; team_id: str | None = None; status: str; task_id: str | None = None; last_seen: datetime; tokens_in: int; tokens_out: int; cost_usd: float; trace_id: str | None = None
def serialize(e): return {"agent_id": e.agent_id, "framework": e.framework.value, "parent_agent_id": e.parent_agent_id, "team_id": e.team_id, "status": e.status.value, "task_id": e.task_id, "last_seen": e.timestamp, "tokens_in": e.tokens_in, "tokens_out": e.tokens_out, "cost_usd": e.cost_usd, "trace_id": e.trace_id}
@router.get("", response_model=list[AgentResponse])
async def list_agents(request: Request, status: str | None = None, framework: str | None = None, team_id: str | None = None, task_id: str | None = None, limit: int = Query(100, ge=1, le=500), offset: int = Query(0, ge=0)):
    return [serialize(e) for e in await request.app.state.store.agents(status, framework, team_id, task_id, limit, offset)]
@router.get("/{agent_id}", response_model=AgentResponse)
async def get_agent(agent_id: str, request: Request):
    event = await request.app.state.store.agent(agent_id)
    if event is None: raise HTTPException(404, "Agent not found")
    return serialize(event)
