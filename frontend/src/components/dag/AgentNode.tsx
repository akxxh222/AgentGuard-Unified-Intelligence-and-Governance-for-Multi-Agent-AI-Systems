"use client";

import { memo } from "react";
import { Handle, Position, type NodeProps } from "@xyflow/react";
import { StatusBadge } from "@/components/common/StatusBadge";
import { Badge } from "@/components/ui/badge";
import type { AgentStatus, Framework } from "@/types";

interface AgentNodeData {
  id: string;
  label: string;
  framework: Framework;
  status: AgentStatus;
}

function AgentNode({ data, selected }: NodeProps) {
  const nodeData = data as unknown as AgentNodeData;

  return (
    <div
      className={`rounded-lg border px-3 py-2.5 min-w-[160px] bg-zinc-900/90 border-zinc-800 transition-all ${
        selected ? "ring-2 ring-primary shadow-lg shadow-primary/20" : ""
      }`}
    >
      <Handle type="target" position={Position.Left} className="!bg-zinc-600" />
      <div className="flex flex-col gap-1.5 font-mono">
        <div className="flex items-center justify-between gap-2">
          <Badge variant={nodeData?.framework || "default"} className="text-[9px] px-1 py-0">
            {nodeData?.framework?.toUpperCase()}
          </Badge>
          <StatusBadge status={nodeData?.status || "idle"} showIcon={false} />
        </div>
        <span className="text-xs font-semibold text-zinc-100 truncate">
          {nodeData?.label || nodeData?.id}
        </span>
      </div>
      <Handle type="source" position={Position.Right} className="!bg-zinc-600" />
    </div>
  );
}

export default memo(AgentNode);
