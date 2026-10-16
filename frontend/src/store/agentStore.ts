import { create } from "zustand";
import type {
  AgentEvent,
  Alert,
  Escalation,
  AgentSummary,
  CostAttribution,
} from "@/types";

interface AgentStoreState {
  // Data
  agents: AgentSummary[];
  events: AgentEvent[];
  alerts: Alert[];
  escalations: Escalation[];
  costs: CostAttribution[];
  selectedAgentId: string | null;
  selectedTraceId: string | null;
  isConnected: boolean;

  // Actions
  setAgents: (agents: AgentSummary[]) => void;
  upsertAgent: (agent: AgentSummary) => void;
  addEvent: (event: AgentEvent) => void;
  batchAddEvents: (events: AgentEvent[]) => void;
  addAlert: (alert: Alert) => void;
  setEscalations: (escalations: Escalation[]) => void;
  resolveEscalation: (id: string, status: "approved" | "rejected") => void;
  setCosts: (costs: CostAttribution[]) => void;
  setSelectedAgentId: (id: string | null) => void;
  setSelectedTraceId: (id: string | null) => void;
  setIsConnected: (connected: boolean) => void;
}

const MAX_EVENTS = 500;
const MAX_ALERTS = 100;

export const useAgentStore = create<AgentStoreState>((set) => ({
  agents: [],
  events: [],
  alerts: [],
  escalations: [],
  costs: [],
  selectedAgentId: null,
  selectedTraceId: null,
  isConnected: false,

  setAgents: (agents) => set({ agents }),

  upsertAgent: (agent) =>
    set((state) => {
      const idx = state.agents.findIndex((a) => a.agent_id === agent.agent_id);
      if (idx >= 0) {
        const next = [...state.agents];
        next[idx] = { ...next[idx], ...agent };
        return { agents: next };
      }
      return { agents: [...state.agents, agent] };
    }),

  addEvent: (event) =>
    set((state) => ({
      events: [event, ...state.events].slice(0, MAX_EVENTS),
    })),

  batchAddEvents: (newEvents) =>
    set((state) => ({
      events: [...newEvents, ...state.events].slice(0, MAX_EVENTS),
    })),

  addAlert: (alert) =>
    set((state) => ({
      alerts: [alert, ...state.alerts].slice(0, MAX_ALERTS),
    })),

  setEscalations: (escalations) => set({ escalations }),

  resolveEscalation: (id, status) =>
    set((state) => ({
      escalations: state.escalations.map((esc) =>
        esc.escalation_id === id
          ? {
              ...esc,
              status,
              resolved_at: new Date().toISOString(),
            }
          : esc
      ),
    })),

  setCosts: (costs) => set({ costs }),

  setSelectedAgentId: (selectedAgentId) => set({ selectedAgentId }),

  setSelectedTraceId: (selectedTraceId) => set({ selectedTraceId }),

  setIsConnected: (isConnected) => set({ isConnected }),
}));
