"""Lifecycle-owned state repository; suitable for local development and tests."""
import asyncio
from datetime import datetime
from app.models.event import Event

class StateStore:
    def __init__(self) -> None:
        self._events: dict[str, Event] = {}; self._agents: dict[str, Event] = {}; self._alerts: dict[str, dict] = {}; self._escalations: dict[str, dict] = {}; self._lock = asyncio.Lock()
    async def ingest(self, event: Event) -> bool:
        async with self._lock:
            if event.event_id in self._events: return False
            self._events[event.event_id] = event; self._agents[event.agent_id] = event; return True
    async def agents(self, status=None, framework=None, team_id=None, task_id=None, limit=100, offset=0):
        rows = [e for e in self._agents.values() if (status is None or e.status.value == status) and (framework is None or e.framework.value == framework) and (team_id is None or e.team_id == team_id) and (task_id is None or e.task_id == task_id)]
        return sorted(rows, key=lambda e: e.timestamp, reverse=True)[offset:offset + limit]
    async def agent(self, agent_id: str): return self._agents.get(agent_id)
    async def events(self, start: datetime | None = None, end: datetime | None = None): return [e for e in self._events.values() if (start is None or e.timestamp >= start) and (end is None or e.timestamp <= end)]
    async def recent_events(self, limit: int):
        return sorted(self._events.values(), key=lambda event: event.timestamp, reverse=True)[:limit]
    async def add_alert(self, event: Event) -> dict:
        """Record one deterministic alert per event, making retries idempotent."""
        async with self._lock:
            alert = {"alert_id": event.event_id, "event_id": event.event_id, "agent_id": event.agent_id, "status": event.status.value, "event_type": event.event_type.value, "timestamp": event.timestamp, "trace_id": event.trace_id, "payload": event.payload}
            self._alerts.setdefault(event.event_id, alert)
            return self._alerts[event.event_id].copy()
    async def recent_alerts(self, limit: int):
        return sorted(self._alerts.values(), key=lambda alert: alert["timestamp"], reverse=True)[:limit]
    async def list_escalations(self, status=None, limit=100, offset=0):
        rows = list(self._escalations.values()); rows = [r for r in rows if status is None or r["status"] == status]
        return sorted(rows, key=lambda r: r["created_at"], reverse=True)[offset:offset + limit]
    async def decide(self, escalation_id: str, decision: str, comment: str | None):
        async with self._lock:
            row = self._escalations.get(escalation_id)
            if row is None: return None
            if row["status"] != "pending": return False
            row.update(status=decision, comment=comment, decided_at=datetime.utcnow().isoformat() + "Z"); return row.copy()
