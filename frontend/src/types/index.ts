/**
 * Agent Control Tower (ACT) — Shared Type Contract
 * Matches the agreed 14-field event schema and proposed extensions.
 */

export type Framework = "langchain" | "autogen" | "crewai";

export type AgentStatus =
  | "running"
  | "success"
  | "failed"
  | "paused"
  | "quarantined"
  | "idle";

export type EventType = "start" | "tool_call" | "llm_call" | "finish" | "error";

export interface EventPayload {
  agent_name?: string;
  tool_name?: string;
  model?: string;
  output_preview?: string;
  depends_on?: string[];
  [key: string]: unknown;
}

/**
 * 14-field canonical event contract agreed across the team
 */
export interface AgentEvent {
  event_id: string;
  agent_id: string;
  framework: Framework;
  parent_agent_id: string | null;
  task_id: string;
  team_id: string;
  status: Exclude<AgentStatus, "idle">;
  event_type: EventType;
  tokens_in: number;
  tokens_out: number;
  cost_usd: number;
  timestamp: string; // ISO8601
  trace_id: string;
  payload: EventPayload;
}

export type DetectorType =
  | "token_spike"
  | "loop"
  | "silent_failure"
  | "semantic"
  | "cost_runaway";

export type AlertSeverity = "warning" | "critical";

export type AlertAction = "ALERT" | "QUARANTINE" | "ESCALATE";

export interface Alert {
  alert_id: string;
  agent_id: string;
  trace_id: string;
  task_id: string;
  team_id: string;
  detector: DetectorType;
  severity: AlertSeverity;
  action: AlertAction;
  message: string;
  rca: string | null;
  created_at: string;
  resolved: boolean;
}

export type EscalationStatus = "pending" | "approved" | "rejected";

export interface Escalation {
  escalation_id: string;
  agent_id: string;
  trace_id: string;
  task_id: string;
  reason: string;
  payload: Record<string, unknown>;
  status: EscalationStatus;
  created_at: string;
  resolved_at: string | null;
}

export interface AgentSummary {
  agent_id: string;
  agent_name?: string;
  framework: Framework;
  status: AgentStatus;
  current_task_id?: string;
  tokens_in: number;
  tokens_out: number;
  total_tokens: number;
  cost_usd: number;
  team_id: string;
  last_active: string;
}

export interface CostAttribution {
  dimension: "agent" | "team" | "task";
  id: string;
  name: string;
  tokens_in: number;
  tokens_out: number;
  total_tokens: number;
  cost_usd: number;
}

export type WsEnvelope =
  | { type: "event"; data: AgentEvent }
  | { type: "alert"; data: Alert }
  | { type: "escalation"; data: Escalation }
  | { type: "ping"; data: { timestamp: string } };
