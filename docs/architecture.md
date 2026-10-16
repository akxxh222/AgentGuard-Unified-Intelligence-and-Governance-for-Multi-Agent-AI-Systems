# Architecture

## System Overview

Agent Control Tower ingests telemetry from AI agent frameworks, normalizes it into a unified schema, performs real-time anomaly detection, persists events in Supabase, and streams live updates to the frontend dashboard.

```
┌─────────────────────────────────────────────────────────┐
│                    AI Agent Frameworks                   │
│  LangChain callbacks │ AutoGen hooks │ CrewAI observers  │
└────────────────┬────────────────────────────────────────┘
                 │ normalized events (JSON)
                 ▼
┌────────────────────────────────┐
│        Adapters Layer          │  adapters/
│  OTEL Exporter → Redis Streams │
│  Framework-specific shims      │
└────────────────┬───────────────┘
                 │ Redis XADD  agent_events
                 ▼
┌────────────────────────────────────────────────────────────┐
│                     Backend (FastAPI)                       │  backend/
│                                                            │
│  ┌──────────────┐  ┌──────────────┐  ┌─────────────────┐  │
│  │  Event Bus   │  │ Log Normaliz.│  │  Cost Tracker   │  │
│  │ Redis XREAD  │→ │ Unified schema│→ │  Token pricing  │  │
│  └──────────────┘  └──────────────┘  └─────────────────┘  │
│                           │                                 │
│         ┌─────────────────▼────────────────┐               │
│         │         Supabase (PostgreSQL)     │               │
│         │  agents / tasks / events / costs  │               │
│         └──────────────────────────────────┘               │
│                                                            │
│  REST API /api/v1  +  WebSocket /ws                        │
└───────────────────────────┬────────────────────────────────┘
                            │
                            │  ┌──────────────────────┐
                            │  │   Anomaly Engine      │  anomaly/
                            │  │  token_spike         │
                            │  │  loop_detector       │
                            │  │  silent_failure      │
                            │  │  semantic_checker    │
                            │  │   (Phi-4/Ollama)     │
                            │  └──────────────────────┘
                            │
                            ▼
┌─────────────────────────────────────────────────────────┐
│                  Next.js Frontend                        │  frontend/
│  DAG Visualizer │ Cost Panel │ Alert Feed │ Escalation  │
└─────────────────────────────────────────────────────────┘
```

## Data Flow

1. **Agent runs** → framework-specific adapter captures telemetry
2. **Adapter** normalizes to `UnifiedEvent` schema and publishes to Redis Stream `agent_events`
3. **Backend event bus** (`core/event_bus.py`) consumes the stream
4. **Log normalizer** maps to DB models and persists to Supabase
5. **Anomaly engine** evaluates each event against detector rules
6. **Alerts** are escalated back through the event bus and pushed via WebSocket
7. **Frontend** receives events over WebSocket, updates Zustand store, re-renders React Flow DAG

## Supabase Schema (key tables)

| Table | Purpose |
|-------|---------|
| `agents` | Agent registry — id, name, framework, status |
| `tasks` | Task executions — agent_id, type, status, start/end |
| `events` | Raw normalized events from all agents |
| `costs` | Per-agent token + cost accounting |
| `escalations` | Anomaly escalations pending human review |

## Component Boundaries

- **Adapters** are pure producers — they never read from Redis
- **Backend** owns the DB schema and REST/WS API
- **Anomaly engine** can be used standalone (no network required)
- **Frontend** reads only through the Backend API / WebSocket
