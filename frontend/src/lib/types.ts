/**
 * Shared TypeScript types for the frontend.
 */

export type Framework = "langchain" | "autogen" | "crewai" | "custom";
export type AgentStatus = "idle" | "running" | "error" | "completed";
export type Severity = "low" | "medium" | "high" | "critical";

export interface Agent {
  id: string;
  name: string;
  framework: Framework;
  status: AgentStatus;
  created_at: string;
  updated_at: string;
  metadata?: Record<string, unknown>;
}

export interface Task {
  id: string;
  agent_id: string;
  type: string;
  status: "pending" | "running" | "completed" | "failed";
  input?: Record<string, unknown>;
  output?: Record<string, unknown>;
  started_at?: string;
  completed_at?: string;
  created_at: string;
}

export interface AgentEvent {
  id?: string;
  agent_id: string;
  task_id?: string;
  event_type: string;
  framework?: Framework;
  payload: Record<string, unknown>;
  tokens?: { prompt: number; completion: number; total: number };
  cost_usd?: number;
  ts: string;
}

export interface CostSummary {
  total_tokens: number;
  total_cost_usd: number;
  by_agent: Array<{ agent_id: string; tokens: number; cost_usd: number }>;
}

export interface Escalation {
  id: string;
  agent_id: string;
  detector: string;
  severity: Severity;
  details: Record<string, unknown>;
  status: "pending" | "resolved";
  created_at: string;
}

export interface AnomalyAlert {
  detector: string;
  agent_id: string;
  severity: Severity;
  details: Record<string, unknown>;
  ts: string;
}

// WebSocket message envelope
export type WsMessage =
  | { type: "agent.status"; data: Agent }
  | { type: "task.created"; data: Task }
  | { type: "task.completed"; data: Task }
  | { type: "event.raw"; ts: string; data: AgentEvent }
  | { type: "anomaly.detected"; ts: string; data: AnomalyAlert }
  | { type: "cost.update"; ts: string; data: CostSummary };

// React Flow Node/Edge types
export interface AgentNode {
  id: string;
  label: string;
  framework: Framework;
  status: AgentStatus;
}

export interface AgentEdge {
  source: string;
  target: string;
  label?: string;
  eventCount: number;
}
