export type Framework = "langchain" | "autogen" | "crewai" | "custom";
export type EventStatus = "running" | "success" | "failed" | "paused" | "quarantined";
export type AgentStatus = EventStatus | "idle" | "error" | "completed";
export type EventType = "start" | "tool_call" | "llm_call" | "finish" | "error" | string;
export type Severity = "low" | "medium" | "high" | "critical";
export type DataMode = "demo" | "live";
export type ConnectionState = "demo" | "checking" | "connected" | "disconnected";
export interface AgentEvent { event_id: string; agent_id: string; agent_name?: string; framework: Framework; parent_agent_id: string | null; task_id: string; team_id: string; status: EventStatus; event_type: EventType; tokens_in: number; tokens_out: number; cost_usd: number; timestamp: string; trace_id: string; payload: Record<string, unknown>; id?: string; ts?: string; tokens?: { prompt: number; completion: number; total: number }; }
export interface AnomalyAlert { alert_id: string; detector: string; agent_id: string; severity: Severity; description: string; timestamp: string; trace_id?: string; task_id?: string; details: Record<string, unknown>; synthetic?: boolean; ts?: string; }
export interface AgentSummary { id: string; name: string; framework: Framework; status: EventStatus; teamId: string; taskId: string; totalTokens: number; totalCost: number; lastSeen: string; parentAgentId: string | null; traces: string[]; }
export interface EndpointState { health: "idle" | "ok" | "error"; events: "idle" | "ok" | "unavailable" | "error"; alerts: "idle" | "ok" | "unavailable" | "error"; }
export interface AgentDataState { mode: DataMode; events: AgentEvent[]; alerts: AnomalyAlert[]; connection: ConnectionState; endpointState: EndpointState; loading: boolean; error: string | null; lastUpdated: string | null; collectorUrl: string; }
export interface Agent { id: string; name: string; framework: Framework; status: AgentStatus; created_at: string; updated_at: string; metadata?: Record<string, unknown>; }
export interface Task { id: string; agent_id: string; type: string; status: "pending" | "running" | "completed" | "failed"; input?: Record<string, unknown>; output?: Record<string, unknown>; started_at?: string; completed_at?: string; created_at: string; }
export interface CostSummary { total_tokens: number; total_cost_usd: number; by_agent: Array<{ agent_id: string; tokens: number; cost_usd: number }>; }
export interface Escalation { id: string; agent_id: string; detector: string; severity: Severity; details: Record<string, unknown>; status: "pending" | "resolved"; created_at: string; }
export type WsMessage = { type: "agent.status"; data: Agent } | { type: "task.created"; data: Task } | { type: "task.completed"; data: Task } | { type: "event.raw"; ts: string; data: AgentEvent } | { type: "anomaly.detected"; ts: string; data: AnomalyAlert } | { type: "cost.update"; ts: string; data: CostSummary };
export interface AgentNode { id: string; label: string; framework: Framework; status: AgentStatus; }
export interface AgentEdge { source: string; target: string; label?: string; eventCount: number; }
