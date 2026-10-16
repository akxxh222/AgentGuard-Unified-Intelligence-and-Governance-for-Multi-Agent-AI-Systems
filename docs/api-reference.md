# API Reference

Base URL: `http://localhost:8000/api/v1`

## Authentication

All endpoints require `Authorization: Bearer <supabase_jwt>` header (except `/health`).

---

## Agents

### `GET /agents`
List all registered agents.

**Response**
```json
[
  {
    "id": "uuid",
    "name": "research-agent",
    "framework": "langchain",
    "status": "running",
    "created_at": "2026-10-16T00:00:00Z"
  }
]
```

### `GET /agents/{agent_id}`
Get a single agent by ID.

### `POST /agents`
Register a new agent.

**Body**
```json
{ "name": "string", "framework": "langchain|autogen|crewai", "metadata": {} }
```

---

## Tasks

### `GET /tasks`
List tasks. Supports `?agent_id=&status=&limit=` query params.

### `GET /tasks/{task_id}`
Get task details including all child events.

---

## Costs

### `GET /costs`
Aggregate cost summary across all agents.

**Response**
```json
{
  "total_tokens": 142000,
  "total_cost_usd": 0.284,
  "by_agent": [
    { "agent_id": "uuid", "tokens": 50000, "cost_usd": 0.10 }
  ]
}
```

### `GET /costs/{agent_id}`
Per-agent cost breakdown with time-series data.

---

## Escalations

### `GET /escalations`
List pending escalations requiring human review.

### `POST /escalations/{escalation_id}/resolve`
Mark an escalation as resolved.

**Body**
```json
{ "action": "approve|reject|snooze", "notes": "string" }
```

---

## WebSocket

### `WS /ws`
Real-time event stream.

**Message Types**

| type | payload |
|------|---------|
| `agent.status` | Agent status change |
| `task.created` | New task started |
| `task.completed` | Task finished |
| `event.raw` | Raw normalized event |
| `anomaly.detected` | Anomaly alert |
| `cost.update` | Cost threshold crossed |

**Example message**
```json
{
  "type": "anomaly.detected",
  "ts": "2026-10-16T10:00:00Z",
  "data": {
    "detector": "token_spike",
    "agent_id": "uuid",
    "severity": "high",
    "details": { "current": 15000, "baseline": 4000, "multiplier": 3.75 }
  }
}
```

---

## Health

### `GET /health`
Returns `{ "status": "ok" }`. No auth required.
