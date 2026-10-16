"use client";

import React from "react";
import { useAgentStore } from "@/store/agentStore";
import { StatusBadge } from "@/components/common/StatusBadge";
import { Badge } from "@/components/ui/badge";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";

export default function AgentTable() {
  const agents = useAgentStore((s) => s.agents);

  return (
    <div>
      <div className="flex items-center justify-between mb-3">
        <h2 className="text-xs font-mono font-semibold text-zinc-400 uppercase tracking-wider">
          Monitored Fleet
        </h2>
        <span className="text-[10px] font-mono text-zinc-500">
          {agents.length} AGENTS
        </span>
      </div>

      {agents.length === 0 ? (
        <div className="py-8 text-center text-zinc-500 text-xs font-mono">
          No agents connected to the control tower yet.
        </div>
      ) : (
        <Table>
          <TableHeader>
            <TableRow className="border-zinc-800 hover:bg-transparent">
              <TableHead className="font-mono text-xs text-zinc-400">AGENT</TableHead>
              <TableHead className="font-mono text-xs text-zinc-400">FRAMEWORK</TableHead>
              <TableHead className="font-mono text-xs text-zinc-400">STATUS</TableHead>
              <TableHead className="font-mono text-xs text-zinc-400">TASK</TableHead>
              <TableHead className="font-mono text-xs text-zinc-400 text-right">TOKENS</TableHead>
              <TableHead className="font-mono text-xs text-zinc-400 text-right">COST (USD)</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {agents.map((agent) => (
              <TableRow
                key={agent.agent_id}
                className="border-zinc-800/60 font-mono text-xs hover:bg-zinc-800/40"
              >
                <TableCell className="font-semibold text-zinc-200">
                  {agent.agent_name || agent.agent_id}
                </TableCell>
                <TableCell>
                  <Badge variant={agent.framework} className="text-[10px]">
                    {agent.framework.toUpperCase()}
                  </Badge>
                </TableCell>
                <TableCell>
                  <StatusBadge status={agent.status} />
                </TableCell>
                <TableCell className="text-zinc-400 text-[11px]">
                  {agent.current_task_id || "idle"}
                </TableCell>
                <TableCell className="text-right text-zinc-200 tabular-nums">
                  {agent.total_tokens?.toLocaleString() ?? 0}
                </TableCell>
                <TableCell className="text-right text-emerald-400 tabular-nums font-semibold">
                  ${agent.cost_usd ? agent.cost_usd.toFixed(4) : "0.0000"}
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      )}
    </div>
  );
}
