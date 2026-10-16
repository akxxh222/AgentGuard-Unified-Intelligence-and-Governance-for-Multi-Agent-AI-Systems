-- ─────────────────────────────────────────────────────────────────────────────
-- Agent Control Tower — Supabase SQL schema
-- Run this in your Supabase project's SQL editor.
-- ─────────────────────────────────────────────────────────────────────────────

-- agents
CREATE TABLE IF NOT EXISTS agents (
  id          UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name        TEXT NOT NULL,
  framework   TEXT NOT NULL CHECK (framework IN ('langchain','autogen','crewai','custom')),
  status      TEXT NOT NULL DEFAULT 'idle',
  metadata    JSONB DEFAULT '{}',
  created_at  TIMESTAMPTZ DEFAULT now(),
  updated_at  TIMESTAMPTZ DEFAULT now()
);

-- tasks
CREATE TABLE IF NOT EXISTS tasks (
  id            UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  agent_id      UUID REFERENCES agents(id) ON DELETE CASCADE,
  type          TEXT NOT NULL,
  status        TEXT NOT NULL DEFAULT 'pending',
  input         JSONB,
  output        JSONB,
  started_at    TIMESTAMPTZ,
  completed_at  TIMESTAMPTZ,
  created_at    TIMESTAMPTZ DEFAULT now()
);

-- events
CREATE TABLE IF NOT EXISTS events (
  id          UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  agent_id    UUID REFERENCES agents(id),
  task_id     UUID REFERENCES tasks(id),
  event_type  TEXT NOT NULL,
  payload     JSONB NOT NULL,
  framework   TEXT,
  ts          TIMESTAMPTZ DEFAULT now()
);

-- costs
CREATE TABLE IF NOT EXISTS costs (
  id                UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  agent_id          UUID REFERENCES agents(id),
  task_id           UUID REFERENCES tasks(id),
  model             TEXT,
  prompt_tokens     INT DEFAULT 0,
  completion_tokens INT DEFAULT 0,
  total_tokens      INT DEFAULT 0,
  cost_usd          NUMERIC(10,6) DEFAULT 0,
  recorded_at       TIMESTAMPTZ DEFAULT now()
);

-- escalations
CREATE TABLE IF NOT EXISTS escalations (
  id           UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  agent_id     UUID REFERENCES agents(id),
  detector     TEXT NOT NULL,
  severity     TEXT NOT NULL DEFAULT 'medium',
  details      JSONB,
  status       TEXT NOT NULL DEFAULT 'pending',
  resolved_by  TEXT,
  notes        TEXT,
  created_at   TIMESTAMPTZ DEFAULT now(),
  resolved_at  TIMESTAMPTZ
);

-- Indexes
CREATE INDEX IF NOT EXISTS idx_events_agent_id   ON events(agent_id);
CREATE INDEX IF NOT EXISTS idx_events_ts         ON events(ts DESC);
CREATE INDEX IF NOT EXISTS idx_costs_agent_id    ON costs(agent_id);
CREATE INDEX IF NOT EXISTS idx_escalations_status ON escalations(status);

-- updated_at trigger for agents
CREATE OR REPLACE FUNCTION update_updated_at()
RETURNS TRIGGER AS $$
BEGIN NEW.updated_at = now(); RETURN NEW; END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS agents_updated_at ON agents;
CREATE TRIGGER agents_updated_at
  BEFORE UPDATE ON agents
  FOR EACH ROW EXECUTE FUNCTION update_updated_at();
