"""
Escalation routes — surface anomaly alerts for human review.
"""
from uuid import UUID

from fastapi import APIRouter, HTTPException
from pydantic import BaseModel
from supabase import create_client

from app.config import settings

router = APIRouter()
_sb = create_client(settings.SUPABASE_URL, settings.SUPABASE_SERVICE_ROLE_KEY)


class ResolvePayload(BaseModel):
    action: str  # approve | reject | snooze
    notes: str | None = None


@router.get("")
async def list_escalations(status: str = "pending"):
    return (
        _sb.table("escalations")
        .select("*")
        .eq("status", status)
        .order("created_at", desc=True)
        .execute()
        .data
    )


@router.post("/{escalation_id}/resolve")
async def resolve_escalation(escalation_id: UUID, payload: ResolvePayload):
    result = (
        _sb.table("escalations")
        .update(
            {
                "status": "resolved",
                "resolved_by": payload.action,
                "notes": payload.notes,
            }
        )
        .eq("id", str(escalation_id))
        .execute()
    )
    if not result.data:
        raise HTTPException(status_code=404, detail="Escalation not found")
    return result.data[0]
