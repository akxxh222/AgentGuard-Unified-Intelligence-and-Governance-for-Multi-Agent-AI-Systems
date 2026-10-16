# 🕹️ Agent Control Tower

A real-time observability and control plane for multi-agent AI systems — built for the MLH Hackathon.

## Overview

Agent Control Tower provides a unified dashboard to monitor, debug, and control AI agents built with LangChain, AutoGen, and CrewAI. It ingests telemetry via OpenTelemetry, detects anomalies in real-time, and surfaces actionable alerts through a beautiful Next.js frontend.

## Architecture

```
AI Agents (LangChain / AutoGen / CrewAI)
        │
        ▼  (OTEL / callback / hook)
   [Adapters Layer]
        │
        ▼  Redis Streams
   [Backend API / Event Bus]
        │
        ▼  Supabase (PostgreSQL)
   [Anomaly Engine]
        │
        ▼  WebSocket
   [Next.js Frontend Dashboard]
```

## Tech Stack

| Layer | Technology |
|-------|-----------|
| Adapters | Python, OpenTelemetry, LangChain Callbacks, AutoGen Hooks, CrewAI Events |
| Backend | FastAPI, Redis Streams, Supabase |
| Anomaly | Statistical detectors + Phi-4 via Ollama |
| Frontend | Next.js 14, React Flow, Zustand, Tailwind CSS |
| Infra | Docker Compose, Redis, Supabase, Ollama |

## Quick Start

```bash
# Copy environment variables
cp .env.example .env
# Edit .env with your Supabase credentials

# Start all services
make dev

# Run the demo agents
make demo

# Run tests
make test
```

## Team Structure

| Teammate | Owns |
|----------|------|
| Teammate 1 (Jk) | `adapters/`, `anomaly/` |
| Teammate 2 | `backend/` |
| Teammate 3 | `frontend/` |
| Teammate 4 | `demo-agents/`, `infra/` |

## License

MIT
