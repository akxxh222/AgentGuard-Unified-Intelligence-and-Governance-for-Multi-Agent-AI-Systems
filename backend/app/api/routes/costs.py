from datetime import datetime
from typing import Literal
from fastapi import APIRouter, Query, Request
from pydantic import BaseModel
router = APIRouter()
class CostSummary(BaseModel): group_id: str; group_by: str; tokens_in: int; tokens_out: int; total_cost_usd: float
@router.get("", response_model=list[CostSummary])
async def get_costs(request: Request, group_by: Literal["agent", "team", "task"] = "agent", start_time: datetime | None = None, end_time: datetime | None = None):
    return await request.app.state.cost_tracker.summary(group_by, start_time, end_time)
