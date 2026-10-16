# Setup Guide

## Prerequisites

| Tool | Version |
|------|---------|
| Docker & Docker Compose | v2.x |
| Python | 3.11+ |
| Node.js | 20+ |
| Ollama | latest |

## 1. Clone & Configure

```bash
git clone https://github.com/<org>/agent-control-tower.git
cd agent-control-tower
cp .env.example .env
```

Edit `.env` with your **Supabase** credentials:
- `SUPABASE_URL` — your project URL from supabase.com
- `SUPABASE_SERVICE_ROLE_KEY` — settings → API → service_role key
- `DATABASE_URL` — settings → Database → Connection string (URI mode)

## 2. Supabase Schema

Run the following SQL in your Supabase project's **SQL editor**:

```sql
-- agents
CREATE TABLE agents (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name TEXT NOT NULL,
  framework TEXT NOT NULL CHECK (framework IN ('langchain','autogen','crewai','custom')),
  status TEXT NOT NULL DEFAULT 'idle',
  metadata JSONB DEFAULT '{}',
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now()
);

-- tasks
CREATE TABLE tasks (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  agent_id UUID REFERENCES agents(id) ON DELETE CASCADE,
  type TEXT NOT NULL,
  status TEXT NOT NULL DEFAULT 'pending',
  input JSONB,
  output JSONB,
  started_at TIMESTAMPTZ,
  completed_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ DEFAULT now()
);

-- events
CREATE TABLE events (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  agent_id UUID REFERENCES agents(id),
  task_id UUID REFERENCES tasks(id),
  event_type TEXT NOT NULL,
  payload JSONB NOT NULL,
  framework TEXT,
  ts TIMESTAMPTZ DEFAULT now()
);

-- costs
CREATE TABLE costs (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  agent_id UUID REFERENCES agents(id),
  task_id UUID REFERENCES tasks(id),
  model TEXT,
  prompt_tokens INT DEFAULT 0,
  completion_tokens INT DEFAULT 0,
  total_tokens INT DEFAULT 0,
  cost_usd NUMERIC(10,6) DEFAULT 0,
  recorded_at TIMESTAMPTZ DEFAULT now()
);

-- escalations
CREATE TABLE escalations (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  agent_id UUID REFERENCES agents(id),
  detector TEXT NOT NULL,
  severity TEXT NOT NULL DEFAULT 'medium',
  details JSONB,
  status TEXT NOT NULL DEFAULT 'pending',
  resolved_by TEXT,
  notes TEXT,
  created_at TIMESTAMPTZ DEFAULT now(),
  resolved_at TIMESTAMPTZ
);

-- indexes
CREATE INDEX idx_events_agent_id ON events(agent_id);
CREATE INDEX idx_events_ts ON events(ts DESC);
CREATE INDEX idx_costs_agent_id ON costs(agent_id);
CREATE INDEX idx_escalations_status ON escalations(status);
```

## 3. Start Services

```bash
make dev
```

This starts: Redis, Backend (FastAPI), Frontend (Next.js), Ollama.

## 4. Pull Ollama Models

```bash
make pull-models
```

This pulls `phi4` for the semantic checker anomaly detector.

## 5. Run Demo Agents

```bash
make demo
```

Spins up LangChain research agent, AutoGen code agent, and CrewAI writer agent simultaneously and sends real telemetry to the dashboard.

## 6. Access

| Service | URL |
|---------|-----|
| Frontend Dashboard | http://localhost:3000 |
| Backend API | http://localhost:8000 |
| API Docs (Swagger) | http://localhost:8000/docs |
| Redis | localhost:6379 |
