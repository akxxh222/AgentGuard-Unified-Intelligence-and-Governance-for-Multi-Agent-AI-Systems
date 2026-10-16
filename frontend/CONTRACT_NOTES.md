# Agent Control Tower (ACT) — Contract & Architectural Notes

This document records all contract agreements, assumptions, data structures, and architectural decisions made for the frontend client in `/frontend`.

---

## 1. Canonical Shared Event Schema (14 Fields)
Every event streaming through Redis Streams / WebSocket `/ws/events` or retrieved via replay API strictly complies with the agreed 14-field schema:
1. `event_id`: UUID string identifying the unique event.
2. `agent_id`: Identifier of the agent originating or handling the step.
3. `framework`: `'langchain'` | `'autogen'` | `'crewai'`.
4. `parent_agent_id`: Upstream delegating agent ID, or `null` for root agents.
5. `task_id`: Current task execution unit identifier.
6. `team_id`: Team / organizational ownership ID (e.g. `infosec`, `core_platform`).
7. `status`: Current agent execution status (`'running'` | `'success'` | `'failed'` | `'paused'` | `'quarantined'`).
8. `event_type`: Operational lifecycle event (`'start'` | `'tool_call'` | `'llm_call'` | `'finish'` | `'error'`).
9. `tokens_in`: Number of input / prompt tokens (integer).
10. `tokens_out`: Number of output / completion tokens (integer).
11. `cost_usd`: Incremental cost in USD (float).
12. `timestamp`: ISO8601 string with millisecond precision.
13. `trace_id`: Distributed trace identifier across multi-agent hops.
14. `payload`: Flexible JSON context payload.

---

## 2. Proposed Extensions (Graceful Degradation)
To accommodate evolving backend capabilities without risking breaking changes:
- `payload.agent_name`: Optional display name; defaults to `agent_id`.
- `payload.tool_name`: Included on `tool_call` events.
- `payload.model`: Included on `llm_call` events.
- `payload.output_preview`: Text preview snippet of tool/agent output.
- `payload.depends_on`: Optional `string[]` of upstream agent IDs for fan-in DAG dependencies.
- `Alert`: `{ alert_id, agent_id, trace_id, task_id, team_id, detector ('token_spike'|'loop'|'silent_failure'|'semantic'|'cost_runaway'), severity ('warning'|'critical'), action ('ALERT'|'QUARANTINE'|'ESCALATE'), message, rca (string|null), created_at, resolved }`.
- `Escalation`: `{ escalation_id, agent_id, trace_id, task_id, reason, payload, status ('pending'|'approved'|'rejected'), created_at, resolved_at }`.

---

## 3. Communication Layer
- **No Direct Fetch / WebSocket**: Components interact exclusively through `src/lib/api.ts` and `src/lib/ws.ts`.
- **Teammate 2 Minimal Collector API Integration**:
  - `GET /health`: Healthcheck status (`{"status": "ok"}`).
  - `GET /events`: Ingests and returns up to 500 recent events.
  - `GET /alerts`: Ingests and returns up to 100 recent alerts.
- **Defensive Field Normalization**:
  - Handles variations like `event_id` vs `id`, `timestamp` vs `ts` vs `created_at`, `cost_usd` vs `cost`.
  - Maps detectors cleanly (`loop`, `token_spike`, `cost_runaway`, etc.).
  - Extracts RCA/reason from both `rca` and `reason` fields.
- **WebSocket Feeds**:
  - `/ws/events`: Raw real-time stream of `AgentEvent`.
  - `/ws/alerts`: Anomaly alerts and human escalations.
- **REST APIs**:
  - `GET /agents`, `GET /agents/{id}`
  - `GET /costs?group_by=agent|team|task`
  - `GET /escalations`, `POST /escalations/{id}/approve`, `POST /escalations/{id}/reject`
  - `GET /alerts`, `GET /alerts/{id}`
  - `GET /traces`, `GET /traces/{trace_id}/events`

---

## 4. Visual Language: "Air-Traffic Control Room"
- **Dark-First Density**:
  - Base Background: `zinc-950` (`--background: 240 10% 3.9%`)
  - Elevated Surfaces: `zinc-900` (`--card: 240 10% 6.5%`)
  - Thin Borders: `zinc-800` (`--border: 240 3.7% 15.9%`)
  - Subtle Dot Grid: Custom radial gradient `.bg-dot-grid` for the lineage DAG canvas.
- **Typography**:
  - UI Sans: `Inter` loaded via `next/font/google`.
  - Metrics / IDs / Monospace: `JetBrains Mono` loaded via `next/font/google`.
  - Tabular Numbers: Enforced `.tabular-nums` on all metrics and live counters.
- **Unified Status Palette (Across all components)**:
  - `running`: Emerald (`hsl(var(--status-running))`) with subtle heartbeat pulse.
  - `alert`: Amber (`hsl(var(--status-alert))`).
  - `quarantined`: Red (`hsl(var(--status-quarantined))`).
  - `escalating`: Sky (`hsl(var(--status-escalating))`).
  - `failed`: Rose (`hsl(var(--status-failed))`).
  - `success`: Muted emerald / slate (`hsl(var(--status-success))`).
  - `idle`: Zinc (`hsl(var(--status-idle))`).
- **Framework Color Identity**:
  - `langchain`: Teal (`hsl(var(--framework-langchain))`).
  - `autogen`: Violet (`hsl(var(--framework-autogen))`).
  - `crewai`: Orange (`hsl(var(--framework-crewai))`).

---

## 5. Next.js Routing & Layout Architecture
- Standard Next.js 14 App Router route group `src/app/(dashboard)/` contains the dashboard pages:
  - `/(dashboard)/page.tsx` -> `/` (Operations Control Tower overview)
  - `/(dashboard)/agents/[id]/page.tsx` -> `/agents/[id]` (Deep agent inspection)
  - `/(dashboard)/traces/page.tsx` -> `/traces` (Trace catalog)
  - `/(dashboard)/traces/[traceId]/page.tsx` -> `/traces/[traceId]` (Lineage DAG & replay)
  - `/(dashboard)/escalations/page.tsx` -> `/escalations` (HITL escalation interface)
  - `/(dashboard)/costs/page.tsx` -> `/costs` (Multi-dimension attribution)
  - `/(dashboard)/audit/page.tsx` -> `/audit` (Compliance ledger)
- **Note on Root Conflict**: The legacy `src/app/page.tsx` from the initial repository clone re-exports `(dashboard)/page.tsx`. To eliminate the Next.js duplicate route warning between `/` and `/(dashboard)/`, `src/app/page.tsx` should be removed (`git rm src/app/page.tsx`).

---

## 6. Docker & Deployment Snippet for Teammate 4
The `frontend/Dockerfile` is a multi-stage Alpine build using Next.js standalone output.
Docker Compose service definition:

```yaml
  frontend:
    build:
      context: ./frontend
      dockerfile: Dockerfile
      args:
        NEXT_PUBLIC_API_URL: http://localhost:8000
        NEXT_PUBLIC_WS_URL: ws://localhost:8000
    container_name: act-frontend
    ports:
      - "3000:3000"
    environment:
      - NEXT_PUBLIC_API_URL=http://localhost:8000
      - NEXT_PUBLIC_WS_URL=ws://localhost:8000
      - NEXT_PUBLIC_USE_MOCK=false
      - NODE_ENV=production
    depends_on:
      - backend
    restart: unless-stopped
```
