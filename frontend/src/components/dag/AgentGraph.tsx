"use client";

import React from "react";
import {
  ReactFlow,
  Background,
  Controls,
  MiniMap,
  BackgroundVariant,
} from "@xyflow/react";
import "@xyflow/react/dist/style.css";
import { useDAG } from "@/hooks/useDAG";
import AgentNode from "./AgentNode";

const nodeTypes = { agentNode: AgentNode };

export default function AgentGraph() {
  const { nodes, edges } = useDAG();

  return (
    <div className="w-full h-full min-h-[300px]">
      <ReactFlow
        nodes={nodes}
        edges={edges}
        nodeTypes={nodeTypes}
        fitView
        className="bg-zinc-950"
      >
        <Background variant={BackgroundVariant.Dots} gap={16} size={1} color="#27272a" />
        <Controls className="!bg-zinc-900 !border-zinc-800 !fill-zinc-400" />
        <MiniMap
          nodeColor="#3f3f46"
          maskColor="rgba(9, 9, 11, 0.7)"
          className="!bg-zinc-900 !border-zinc-800"
        />
      </ReactFlow>
    </div>
  );
}
