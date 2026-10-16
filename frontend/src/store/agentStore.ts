/**
 * Zustand global store — single source of truth for all agent state.
 */
import { create } from "zustand";
import type { Agent, AgentEvent, AnomalyAlert, CostSummary, Escalation, Task } from "@/lib/types";

interface AgentStore {
  // State
  agents: Agent[];
  tasks: Task[];
  events: AgentEvent[];
  alerts: AnomalyAlert[];
  costs: CostSummary | null;
  escalations: Escalation[];
  connected: boolean;

  // Setters
  setAgents: (agents: Agent[]) => void;
  upsertAgent: (agent: Agent) => void;
  addTask: (task: Task) => void;
  updateTask: (task: Partial<Task> & { id: string }) => void;
  addEvent: (event: AgentEvent) => void;
  addAlert: (alert: AnomalyAlert) => void;
  setCosts: (costs: CostSummary) => void;
  setEscalations: (esc: Escalation[]) => void;
  resolveEscalation: (id: string) => void;
  setConnected: (v: boolean) => void;
}

export const useAgentStore = create<AgentStore>((set) => ({
  agents: [],
  tasks: [],
  events: [],
  alerts: [],
  costs: null,
  escalations: [],
  connected: false,

  setAgents: (agents) => set({ agents }),

  upsertAgent: (agent) =>
    set((s) => ({
      agents: s.agents.some((a) => a.id === agent.id)
        ? s.agents.map((a) => (a.id === agent.id ? agent : a))
        : [...s.agents, agent],
    })),

  addTask: (task) => set((s) => ({ tasks: [task, ...s.tasks].slice(0, 200) })),

  updateTask: (update) =>
    set((s) => ({
      tasks: s.tasks.map((t) => (t.id === update.id ? { ...t, ...update } : t)),
    })),

  addEvent: (event) =>
    set((s) => ({ events: [event, ...s.events].slice(0, 500) })),

  addAlert: (alert) =>
    set((s) => ({ alerts: [alert, ...s.alerts].slice(0, 100) })),

  setCosts: (costs) => set({ costs }),

  setEscalations: (escalations) => set({ escalations }),

  resolveEscalation: (id) =>
    set((s) => ({
      escalations: s.escalations.filter((e) => e.id !== id),
    })),

  setConnected: (connected) => set({ connected }),
}));
