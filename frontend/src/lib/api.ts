import { env } from "@/lib/env";
import { logger } from "@/lib/logger";
import type {
  AgentSummary,
  CostAttribution,
  Alert,
  Escalation,
  AgentEvent,
} from "@/types";

const BASE_URL = env.NEXT_PUBLIC_API_URL;

async function request<T>(endpoint: string, options?: RequestInit): Promise<T> {
  const url = `${BASE_URL}${endpoint}`;
  try {
    const res = await fetch(url, {
      ...options,
      headers: {
        "Content-Type": "application/json",
        ...options?.headers,
      },
    });

    if (!res.ok) {
      throw new Error(`API error ${res.status}: ${res.statusText}`);
    }

    return (await res.json()) as T;
  } catch (error) {
    logger.error(`Failed to fetch ${url}`, error);
    throw error;
  }
}

export const api = {
  // Teammate 2 — Minimal Collector API endpoints
  getHealth: () => request<{ status: string; version?: string }>("/health"),
  getEvents: () => request<AgentEvent[]>("/events"),
  getAlerts: () => request<Alert[]>("/alerts"),

  // Extended management endpoints
  getAgents: () => request<AgentSummary[]>("/agents"),
  getAgentById: (id: string) => request<AgentSummary>(`/agents/${encodeURIComponent(id)}`),
  getCosts: (groupBy: "agent" | "team" | "task" = "agent") =>
    request<CostAttribution[]>(`/costs?group_by=${groupBy}`),
  getAlertById: (id: string) => request<Alert>(`/alerts/${encodeURIComponent(id)}`),
  getEscalations: () => request<Escalation[]>("/escalations"),
  approveEscalation: (id: string, note?: string) =>
    request<{ success: boolean }>(`/escalations/${encodeURIComponent(id)}/approve`, {
      method: "POST",
      body: JSON.stringify({ note }),
    }),
  rejectEscalation: (id: string, reason?: string) =>
    request<{ success: boolean }>(`/escalations/${encodeURIComponent(id)}/reject`, {
      method: "POST",
      body: JSON.stringify({ reason }),
    }),
  getTraces: () =>
    request<Array<{ trace_id: string; root_agent: string; total_cost: number; duration_ms: number; started_at: string }>>("/traces"),
  getTraceEvents: (traceId: string) =>
    request<AgentEvent[]>(`/traces/${encodeURIComponent(traceId)}/events`),
};
