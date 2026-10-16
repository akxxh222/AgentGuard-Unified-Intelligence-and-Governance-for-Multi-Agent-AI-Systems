"use client";
import { useMemo, useState } from "react";
import {
  ReactFlow,
  Background,
  BackgroundVariant,
  Controls,
  MiniMap,
  type Edge,
  type Node,
} from "@xyflow/react";
import "@xyflow/react/dist/style.css";
import { FrameworkBadge, Panel, StatusBadge } from "@/components/ui";
import { useAgentData } from "@/hooks/useAgentData";
import { deriveAgents } from "@/lib/derive";
import type { AgentEvent, AgentSummary } from "@/lib/types";
const COLORS: Record<string, string> = {
  langchain: "#818cf8",
  autogen: "#22d3ee",
  crewai: "#fbbf24",
  custom: "#94a3b8",
};
type LineageNodeData =
  | { label: string; kind: "agent"; agent: AgentSummary }
  | { label: string; kind: "tool"; event: AgentEvent };
export default function LineagePage() {
  const { events, alerts } = useAgentData();
  const agents = useMemo(() => deriveAgents(events), [events]);
  const [selected, setSelected] = useState<string | null>(null);
  const graph = useMemo(() => {
    const nodes: Node<LineageNodeData>[] = agents.map((a, i) => ({
      id: a.id,
      position: { x: (i % 3) * 260, y: Math.floor(i / 3) * 190 },
      data: { label: a.name, kind: "agent", agent: a },
      style: {
        background: "#111925",
        border: `1px solid ${COLORS[a.framework]}`,
        borderRadius: 8,
        color: "#eef2f8",
        fontSize: 11,
        width: 170,
        padding: 12,
        boxShadow: alerts.some((x) => x.agent_id === a.id)
          ? "0 0 0 3px #fb718533"
          : "none",
      },
    }));
    const edges: Edge[] = [];
    agents.forEach((a) => {
      if (a.parentAgentId && agents.some((p) => p.id === a.parentAgentId))
        edges.push({
          id: `parent-${a.parentAgentId}-${a.id}`,
          source: a.parentAgentId,
          target: a.id,
          animated: true,
          style: { stroke: "#596a84" },
        });
    });
    let toolIndex = 0;
    events
      .filter(
        (e) =>
          e.event_type === "tool_call" && typeof e.payload.tool === "string"
      )
      .forEach((e) => {
        const id = `tool-${e.agent_id}-${String(e.payload.tool)}`;
        if (!nodes.some((n) => n.id === id)) {
          nodes.push({
            id,
            position: {
              x: 520 + (toolIndex % 2) * 220,
              y: 30 + Math.floor(toolIndex / 2) * 120,
            },
            data: { label: String(e.payload.tool), kind: "tool", event: e },
            style: {
              background: "#0c121b",
              border: "1px dashed #42516a",
              borderRadius: 20,
              color: "#aab6c8",
              fontSize: 10,
              width: 145,
              padding: 9,
            },
          });
          toolIndex++;
        }
        if (!edges.some((x) => x.id === `edge-${e.agent_id}-${id}`))
          edges.push({
            id: `edge-${e.agent_id}-${id}`,
            source: e.agent_id,
            target: id,
            style: { stroke: "#334155" },
            label: "observed call",
          });
      });
    return { nodes, edges };
  }, [agents, events, alerts]);
  const node = graph.nodes.find((n) => n.id === selected);
  return (
    <>
      <div className="page-intro">
        <p>
          Observed relationships from parent IDs and tool-call payloads. This is
          not a verified full causal execution DAG.
        </p>
        <span className="eyebrow">PAN · ZOOM · SELECT</span>
      </div>
      <div className="lineage-layout">
        <Panel className="lineage-canvas">
          <ReactFlow<Node<LineageNodeData>>
            nodes={graph.nodes}
            edges={graph.edges}
            onNodeClick={(_, n) => setSelected(n.id)}
            fitView
            minZoom={0.35}
            maxZoom={1.8}
          >
            <Background
              variant={BackgroundVariant.Dots}
              color="#263147"
              gap={18}
            />
            <Controls />
            <MiniMap
              nodeColor={(n) => {
                const data = n.data as LineageNodeData;
                return data.kind === "tool"
                  ? "#42516a"
                  : (COLORS[data.agent.framework] ?? "#818cf8");
              }}
              maskColor="#080b12bb"
            />
          </ReactFlow>
        </Panel>
        <Panel title="Selection" className="lineage-detail">
          {node ? (
            <div className="node-detail">
              <span className="eyebrow">{node.data.kind.toUpperCase()}</span>
              <h2>{node.data.label}</h2>
              {node.data.kind === "agent" ? (
                <>
                  <FrameworkBadge framework={node.data.agent.framework} />
                  <StatusBadge status={node.data.agent.status} />
                  <dl>
                    <dt>Agent ID</dt>
                    <dd className="mono">{node.data.agent.id}</dd>
                    <dt>Parent</dt>
                    <dd className="mono">
                      {node.data.agent.parentAgentId ?? "Root agent"}
                    </dd>
                    <dt>Task</dt>
                    <dd className="mono">{node.data.agent.taskId}</dd>
                    <dt>Traces</dt>
                    <dd>{node.data.agent.traces.length}</dd>
                  </dl>
                </>
              ) : (
                <>
                  <p>
                    Tool identity was observed in a canonical `tool_call`
                    payload.
                  </p>
                  <code>{node.id.replace(/^tool-[^-]+-/, "")}</code>
                </>
              )}
            </div>
          ) : (
            <div className="empty-state">
              <strong>Select a node</strong>
              <p>Inspect an agent or observed tool invocation.</p>
            </div>
          )}
        </Panel>
      </div>
    </>
  );
}
