/**
 * useDAG — derives React Flow nodes and edges from the Zustand agent store.
 */
"use client";

import { useMemo } from "react";
import type { Node, Edge } from "reactflow";
import { useAgentStore } from "@/store/agentStore";

const FRAMEWORK_COLORS: Record<string, string> = {
  langchain: "#6366f1",
  autogen: "#10b981",
  crewai: "#f59e0b",
  custom: "#94a3b8",
};

export function useDAG() {
  const { agents, events } = useAgentStore();

  const nodes: Node[] = useMemo(
    () =>
      agents.map((agent, i) => ({
        id: agent.id,
        type: "agentNode",
        position: { x: (i % 4) * 220, y: Math.floor(i / 4) * 180 },
        data: {
          id: agent.id,
          label: agent.name,
          framework: agent.framework,
          status: agent.status,
          color: FRAMEWORK_COLORS[agent.framework] ?? "#6366f1",
        },
      })),
    [agents]
  );

  const edges: Edge[] = useMemo(() => {
    // Build edges from event pairs (source → target based on task chains)
    const seen = new Set<string>();
    const result: Edge[] = [];
    for (const e of events) {
      if (!e.agent_id || !e.task_id) continue;
      const id = `${e.agent_id}-${e.task_id}`;
      if (!seen.has(id)) {
        seen.add(id);
        result.push({
          id,
          source: e.agent_id,
          target: e.task_id,
          label: e.event_type,
          animated: true,
        });
      }
    }
    return result.slice(0, 50);
  }, [events]);

  return { nodes, edges };
}
