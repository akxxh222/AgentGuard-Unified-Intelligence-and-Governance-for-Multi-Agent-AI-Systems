"""
Task routes.
"""
from uuid import UUID

from fastapi import APIRouter, HTTPException, Query
from supabase import create_client

from app.config import settings
from app.models.task import Task, TaskCreate

router = APIRouter()
_sb = create_client(settings.SUPABASE_URL, settings.SUPABASE_SERVICE_ROLE_KEY)


@router.get("", response_model=list[Task])
async def list_tasks(
    agent_id: UUID | None = Query(None),
    status: str | None = Query(None),
    limit: int = Query(50, le=200),
):
    q = _sb.table("tasks").select("*").order("created_at", desc=True).limit(limit)
    if agent_id:
        q = q.eq("agent_id", str(agent_id))
    if status:
        q = q.eq("status", status)
    return q.execute().data


@router.get("/{task_id}", response_model=Task)
async def get_task(task_id: UUID):
    response = _sb.table("tasks").select("*, events(*)").eq("id", str(task_id)).single().execute()
    if not response.data:
        raise HTTPException(status_code=404, detail="Task not found")
    return response.data


@router.post("", response_model=Task, status_code=201)
async def create_task(payload: TaskCreate):
    response = _sb.table("tasks").insert(payload.model_dump()).execute()
    return response.data[0]
