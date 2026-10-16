import React from "react";
import { describe, it, expect } from "vitest";
import { render, screen } from "@testing-library/react";
import { StatusBadge } from "@/components/common/StatusBadge";
import { AgentCard } from "@/components/agents/AgentCard";
import { useAgentStore } from "@/store/agentStore";
import type { AgentSummary } from "@/types";

describe("Agent Control Tower UI Shell & Teammate 3 Checklist", () => {
  it("renders status badges with accessible icon and text", () => {
    render(<StatusBadge status="running" />);
    expect(screen.getByText("Running")).toBeInTheDocument();

    render(<StatusBadge status="quarantined" />);
    expect(screen.getByText("Quarantined")).toBeInTheDocument();

    render(<StatusBadge status="failed" />);
    expect(screen.getByText("Failed")).toBeInTheDocument();
  });

  it("renders agent cards with framework badge and cost attribution", () => {
    const mockAgent: AgentSummary = {
      agent_id: "agent_test_01",
      agent_name: "Test Auditor",
      framework: "langchain",
      status: "running",
      tokens_in: 1000,
      tokens_out: 500,
      total_tokens: 1500,
      cost_usd: 0.0015,
      team_id: "security",
      last_active: new Date().toISOString(),
    };

    render(<AgentCard agent={mockAgent} />);
    expect(screen.getByText("Test Auditor")).toBeInTheDocument();
    expect(screen.getByText("LANGCHAIN")).toBeInTheDocument();
    expect(screen.getByText("$0.0015")).toBeInTheDocument();
  });

  it("manages bounded event and alert state in Zustand store", () => {
    const store = useAgentStore.getState();
    expect(store.events).toEqual([]);
    expect(store.alerts).toEqual([]);
    expect(store.isConnected).toBe(false);

    store.addEvent({
      event_id: "e-test-1",
      agent_id: "agent-1",
      framework: "langchain",
      parent_agent_id: null,
      task_id: "task-1",
      team_id: "team-1",
      status: "running",
      event_type: "tool_call",
      tokens_in: 100,
      tokens_out: 50,
      cost_usd: 0.0001,
      timestamp: new Date().toISOString(),
      trace_id: "tr-1",
      payload: {},
    });

    expect(useAgentStore.getState().events.length).toBe(1);
  });
});
