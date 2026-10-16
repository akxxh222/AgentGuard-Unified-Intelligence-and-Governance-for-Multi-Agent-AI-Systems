/**
 * REST API client — thin wrapper around fetch.
 */

const API_URL = process.env.NEXT_PUBLIC_API_URL ?? "http://localhost:8000";

async function request<T>(path: string, init?: RequestInit): Promise<T> {
  const res = await fetch(`${API_URL}${path}`, {
    headers: { "Content-Type": "application/json", ...init?.headers },
    ...init,
  });
  if (!res.ok) {
    throw new Error(`API ${res.status}: ${path}`);
  }
  return res.json() as Promise<T>;
}

import type { Agent, Task, CostSummary, Escalation } from "./types";

export const api = {
  agents: {
    list: () => request<Agent[]>("/api/v1/agents"),
    get: (id: string) => request<Agent>(`/api/v1/agents/${id}`),
  },
  tasks: {
    list: (params?: { agent_id?: string; status?: string }) => {
      const qs = new URLSearchParams(params as Record<string, string>).toString();
      return request<Task[]>(`/api/v1/tasks${qs ? `?${qs}` : ""}`);
    },
  },
  costs: {
    summary: () => request<CostSummary>("/api/v1/costs"),
    byAgent: (id: string) => request<CostSummary>(`/api/v1/costs/${id}`),
  },
  escalations: {
    list: () => request<Escalation[]>("/api/v1/escalations"),
    resolve: (id: string, action: string, notes?: string) =>
      request(`/api/v1/escalations/${id}/resolve`, {
        method: "POST",
        body: JSON.stringify({ action, notes }),
      }),
  },
};
