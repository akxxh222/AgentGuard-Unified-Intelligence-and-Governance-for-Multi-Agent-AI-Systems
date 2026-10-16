"use client";

import { useMemo, useState } from "react";
import {
  Background,
  BackgroundVariant,
  Controls,
  MiniMap,
  ReactFlow,
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

type LineageNodeData = Record<string, unknown> & {
  label: string;
  kind: "agent" | "tool";
  agent?: AgentSummary;
  event?: AgentEvent;
};

type LineageNode = Node<LineageNodeData>;

export default function LineagePage() {
  const { events, alerts } = useAgentData();
  const agents = useMemo(() => deriveAgents(events), [events]);
  const [selected, setSelected] = useState<string | null>(null);

  const graph = useMemo<{ nodes: LineageNode[]; edges: Edge[] }>(() => {
    const nodes: LineageNode[] = agents.map((agent, index) => ({
      id: agent.id,
      position: { x: (index % 3) * 260, y: Math.floor(index / 3) * 190 },
      data: { label: agent.name, kind: "agent", agent },
      style: {
        background: "#111925",
        border: `1px solid ${COLORS[agent.framework]}`,
        borderRadius: 8,
        color: "#eef2f8",
        fontSize: 11,
        width: 170,
        padding: 12,
        boxShadow: alerts.some((alert) => alert.agent_id === agent.id)
          ? "0 0 0 3px #fb718533"
          : "none",
      },
    }));
    const edges: Edge[] = [];

    agents.forEach((agent) => {
      if (
        agent.parentAgentId &&
        agents.some((parent) => parent.id === agent.parentAgentId)
      ) {
        edges.push({
          id: `parent-${agent.parentAgentId}-${agent.id}`,
          source: agent.parentAgentId,
          target: agent.id,
          animated: true,
          style: { stroke: "#596a84" },
        });
      }
    });

    let toolIndex = 0;
    events
      .filter(
        (event) =>
          event.event_type === "tool_call" &&
          typeof event.payload.tool === "string",
      )
      .forEach((event) => {
        const toolName = String(event.payload.tool);
        const id = `tool-${event.agent_id}-${toolName}`;

        if (!nodes.some((node) => node.id === id)) {
          nodes.push({
            id,
            position: {
              x: 520 + (toolIndex % 2) * 220,
              y: 30 + Math.floor(toolIndex / 2) * 120,
            },
            data: { label: toolName, kind: "tool", event },
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
          toolIndex += 1;
        }

        const edgeId = `edge-${event.agent_id}-${id}`;
        if (!edges.some((edge) => edge.id === edgeId)) {
          edges.push({
            id: edgeId,
            source: event.agent_id,
            target: id,
            style: { stroke: "#334155" },
            label: "observed call",
          });
        }
      });

    return { nodes, edges };
  }, [agents, events, alerts]);

  const selectedNode = graph.nodes.find((node) => node.id === selected);
  const selectedData = selectedNode?.data;

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
          <ReactFlow
            nodes={graph.nodes}
            edges={graph.edges}
            onNodeClick={(_, node) => setSelected(node.id)}
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
              nodeColor={(node) => {
                const data = node.data as LineageNodeData;
                return data.kind === "tool"
                  ? "#42516a"
                  : (COLORS[data.agent?.framework ?? "custom"] ?? "#818cf8");
              }}
              maskColor="#080b12bb"
            />
          </ReactFlow>
        </Panel>
        <Panel title="Selection" className="lineage-detail">
          {selectedNode && selectedData ? (
            <div className="node-detail">
              <span className="eyebrow">{selectedData.kind.toUpperCase()}</span>
              <h2>{selectedData.label}</h2>
              {selectedData.agent ? (
                <>
                  <FrameworkBadge framework={selectedData.agent.framework} />
                  <StatusBadge status={selectedData.agent.status} />
                  <dl>
                    <dt>Agent ID</dt>
                    <dd className="mono">{selectedData.agent.id}</dd>
                    <dt>Parent</dt>
                    <dd className="mono">
                      {selectedData.agent.parentAgentId ?? "Root agent"}
                    </dd>
                    <dt>Task</dt>
                    <dd className="mono">{selectedData.agent.taskId}</dd>
                    <dt>Traces</dt>
                    <dd>{selectedData.agent.traces.length}</dd>
                  </dl>
                </>
              ) : (
                <>
                  <p>
                    Tool identity was observed in a canonical tool-call payload.
                  </p>
                  <code>{selectedData.label}</code>
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
