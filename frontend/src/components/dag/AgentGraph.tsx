"use client";

import ReactFlow, {
  Background,
  Controls,
  MiniMap,
  BackgroundVariant,
} from "reactflow";
import "reactflow/dist/style.css";
import { useDAG } from "@/hooks/useDAG";
import AgentNode from "./AgentNode";

const nodeTypes = { agentNode: AgentNode };

export default function AgentGraph() {
  const { nodes, edges } = useDAG();

  return (
    <ReactFlow
      nodes={nodes}
      edges={edges}
      nodeTypes={nodeTypes}
      fitView
      className="bg-[#0a0a0f]"
    >
      <Background variant={BackgroundVariant.Dots} gap={16} size={1} color="#1e1e2e" />
      <Controls className="!bg-[#111118] !border-[#1e1e2e]" />
      <MiniMap
        nodeColor={(n) => n.data?.color ?? "#6366f1"}
        maskColor="rgba(10,10,15,0.7)"
        className="!bg-[#111118] !border-[#1e1e2e]"
      />
    </ReactFlow>
  );
}
