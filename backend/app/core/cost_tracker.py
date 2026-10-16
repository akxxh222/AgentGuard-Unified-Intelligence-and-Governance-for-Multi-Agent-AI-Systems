"""Idempotent aggregation from persisted event records."""
from collections import defaultdict
from datetime import datetime
from typing import Literal
from app.models.event import Event

class CostTracker:
    def __init__(self, store) -> None: self.store = store
    async def record(self, event: Event) -> bool: return await self.store.ingest(event)
    async def summary(self, group_by: Literal["agent", "task", "team"], start: datetime | None = None, end: datetime | None = None) -> list[dict]:
        totals = defaultdict(lambda: {"tokens_in": 0, "tokens_out": 0, "total_cost_usd": 0.0})
        for event in await self.store.events(start, end):
            key = getattr(event, f"{group_by}_id")
            if key is not None:
                row = totals[key]; row["tokens_in"] += event.tokens_in; row["tokens_out"] += event.tokens_out; row["total_cost_usd"] += event.cost_usd
        return [{"group_id": k, "group_by": group_by, **v, "total_cost_usd": round(v["total_cost_usd"], 6)} for k, v in sorted(totals.items())]
