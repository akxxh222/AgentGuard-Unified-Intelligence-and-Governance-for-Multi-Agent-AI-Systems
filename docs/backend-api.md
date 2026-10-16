# Backend API contract

The backend is unauthenticated for local development only. Start it with `cd backend; uvicorn app.main:app --reload`. `GET /health` reports process liveness; `GET /ready` reports Redis connectivity and must be used for dependency readiness.

## REST

`GET /agents` accepts `status`, `framework`, `team_id`, `task_id`, `limit` (1–500), and `offset`. It returns a paginated slice (an array) of agent state: `agent_id`, `framework`, `parent_agent_id`, `team_id`, `status`, `task_id`, `last_seen`, `tokens_in`, `tokens_out`, `cost_usd`, and `trace_id`. `GET /agents/{agent_id}` returns that same object or `404`.

`GET /costs?group_by=agent|team|task&start_time=<ISO-8601>&end_time=<ISO-8601>` returns objects shaped as `{group_id, group_by, tokens_in, tokens_out, total_cost_usd}`. Invalid group values receive FastAPI's `422` validation response.

`GET /escalations?status=pending&limit=100&offset=0` lists escalation records. `POST /escalations/{id}/approve` and `/reject` accept optional JSON `{ "comment": "..." }`; they return the updated record, `404` for an unknown ID, or `409` after a decision has been made. A decision is published to `agent.commands` when Redis is available; it is not proof that an agent resumed.

The legacy aliases under `/api/v1/agents`, `/api/v1/costs`, and `/api/v1/escalations` have identical behavior.

## WebSockets

Connect to `/ws/events` for accepted events and `/ws/alerts` for failures, quarantines, and escalation updates. Every message uses `{ "type": "agent_event|alert|escalation_update|connection_status", "timestamp": "ISO-8601", "data": {} }`. Delivery is best-effort, not durable; after reconnect, refresh REST state. Build DAG edges from `parent_agent_id`, and group related nodes with `trace_id`.

## Redis wire contract

Publish a single `payload` field containing JSON to stream `agent.events` (the legacy `REDIS_STREAM_KEY` remains configurable). Required keys are `event_id`, `agent_id`, `framework` (`langchain`, `autogen`, `crewai`), `status` (`running`, `success`, `failed`, `paused`, `quarantined`), `event_type` (`start`, `tool_call`, `llm_call`, `finish`, `error`), `timestamp`, and `payload`. Optional keys are `parent_agent_id`, `task_id`, `team_id`, `tokens_in`, `tokens_out`, `cost_usd`, and `trace_id`. Invalid records are copied to `agent.events.invalid` and never treated as valid.
