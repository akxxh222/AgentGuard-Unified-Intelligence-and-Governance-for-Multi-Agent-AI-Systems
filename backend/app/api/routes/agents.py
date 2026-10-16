"""
Agent CRUD routes.
"""
from uuid import UUID

from fastapi import APIRouter, HTTPException
from supabase import create_client

from app.config import settings
from app.models.agent import Agent, AgentCreate, AgentUpdate

router = APIRouter()
_sb = create_client(settings.SUPABASE_URL, settings.SUPABASE_SERVICE_ROLE_KEY)


@router.get("", response_model=list[Agent])
async def list_agents():
    response = _sb.table("agents").select("*").order("created_at", desc=True).execute()
    return response.data


@router.get("/{agent_id}", response_model=Agent)
async def get_agent(agent_id: UUID):
    response = _sb.table("agents").select("*").eq("id", str(agent_id)).single().execute()
    if not response.data:
        raise HTTPException(status_code=404, detail="Agent not found")
    return response.data


@router.post("", response_model=Agent, status_code=201)
async def create_agent(payload: AgentCreate):
    response = _sb.table("agents").insert(payload.model_dump()).execute()
    return response.data[0]


@router.patch("/{agent_id}", response_model=Agent)
async def update_agent(agent_id: UUID, payload: AgentUpdate):
    updates = {k: v for k, v in payload.model_dump().items() if v is not None}
    response = (
        _sb.table("agents").update(updates).eq("id", str(agent_id)).execute()
    )
    if not response.data:
        raise HTTPException(status_code=404, detail="Agent not found")
    return response.data[0]


@router.delete("/{agent_id}", status_code=204)
async def delete_agent(agent_id: UUID):
    _sb.table("agents").delete().eq("id", str(agent_id)).execute()
