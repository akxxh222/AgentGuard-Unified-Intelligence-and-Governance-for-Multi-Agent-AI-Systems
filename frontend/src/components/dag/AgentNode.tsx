"use client";

import { memo } from "react";
import { Handle, Position, type NodeProps } from "reactflow";
import StatusBadge from "@/components/dashboard/StatusBadge";
import type { AgentStatus, Framework } from "@/lib/types";

interface AgentNodeData {
  id: string;
  label: string;
  framework: Framework;
  status: AgentStatus;
  color: string;
}

function AgentNode({ data, selected }: NodeProps<AgentNodeData>) {
  return (
    <div
      className={`rounded-lg border px-3 py-2 min-w-[140px] transition-shadow ${
        selected ? "shadow-lg shadow-indigo-500/30" : ""
      }`}
      style={{
        borderColor: data.color,
        background: "#111118",
        boxShadow: selected ? `0 0 0 2px ${data.color}40` : "none",
      }}
    >
      <Handle type="target" position={Position.Left} />
      <div className="flex flex-col gap-1">
        <span className="text-xs font-mono text-slate-400">{data.framework}</span>
        <span className="text-sm font-semibold text-slate-100 truncate">{data.label}</span>
        <StatusBadge status={data.status} />
      </div>
      <Handle type="source" position={Position.Right} />
    </div>
  );
}

export default memo(AgentNode);
