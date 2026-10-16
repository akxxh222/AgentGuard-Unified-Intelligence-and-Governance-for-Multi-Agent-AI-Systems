"""
Cost aggregation routes.
"""
from uuid import UUID

from fastapi import APIRouter
from supabase import create_client

from app.config import settings

router = APIRouter()
_sb = create_client(settings.SUPABASE_URL, settings.SUPABASE_SERVICE_ROLE_KEY)


@router.get("")
async def get_costs_summary():
    """Aggregate cost summary across all agents."""
    data = _sb.table("costs").select("agent_id, total_tokens, cost_usd").execute().data
    total_tokens = sum(r["total_tokens"] for r in data)
    total_cost = sum(float(r["cost_usd"]) for r in data)

    by_agent: dict[str, dict] = {}
    for row in data:
        aid = row["agent_id"]
        if aid not in by_agent:
            by_agent[aid] = {"agent_id": aid, "tokens": 0, "cost_usd": 0.0}
        by_agent[aid]["tokens"] += row["total_tokens"]
        by_agent[aid]["cost_usd"] += float(row["cost_usd"])

    return {
        "total_tokens": total_tokens,
        "total_cost_usd": round(total_cost, 6),
        "by_agent": list(by_agent.values()),
    }


@router.get("/{agent_id}")
async def get_agent_costs(agent_id: UUID):
    """Per-agent cost breakdown."""
    data = (
        _sb.table("costs")
        .select("*")
        .eq("agent_id", str(agent_id))
        .order("recorded_at", desc=True)
        .execute()
        .data
    )
    total_tokens = sum(r["total_tokens"] for r in data)
    total_cost = sum(float(r["cost_usd"]) for r in data)
    return {
        "agent_id": str(agent_id),
        "total_tokens": total_tokens,
        "total_cost_usd": round(total_cost, 6),
        "records": data,
    }
