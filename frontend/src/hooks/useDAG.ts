"use client";

import { useMemo } from "react";
import type { Node, Edge } from "@xyflow/react";
import { useAgentStore } from "@/store/agentStore";

export function useDAG() {
  const agents = useAgentStore((s) => s.agents);
  const events = useAgentStore((s) => s.events);

  const nodes: Node[] = useMemo(
    () =>
      agents.map((agent, i) => ({
        id: agent.agent_id,
        type: "agentNode",
        position: { x: (i % 3) * 240, y: Math.floor(i / 3) * 160 },
        data: {
          id: agent.agent_id,
          label: agent.agent_name || agent.agent_id,
          framework: agent.framework,
          status: agent.status,
        },
      })),
    [agents]
  );

  const edges: Edge[] = useMemo(() => {
    const seen = new Set<string>();
    const result: Edge[] = [];

    for (const e of events) {
      if (!e.parent_agent_id) continue;
      const id = `${e.parent_agent_id}->${e.agent_id}`;
      if (!seen.has(id)) {
        seen.add(id);
        result.push({
          id,
          source: e.parent_agent_id,
          target: e.agent_id,
          label: `${e.tokens_in + e.tokens_out} tok`,
          animated: e.status === "running",
        });
      }
    }

    return result.slice(0, 100);
  }, [events]);

  return { nodes, edges };
}
