import React from "react";
import Link from "next/link";
import { Bot, ArrowRight, Activity } from "lucide-react";
import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { StatusBadge } from "@/components/common/StatusBadge";
import type { AgentSummary } from "@/types";

interface AgentCardProps {
  agent: AgentSummary;
}

export function AgentCard({ agent }: AgentCardProps) {
  return (
    <Card className="bg-zinc-900/70 border-zinc-800/80 hover:border-zinc-700/80 transition-all">
      <CardHeader className="p-4 pb-2 flex flex-row items-center justify-between space-y-0">
        <div className="flex items-center gap-2.5">
          <div className="w-8 h-8 rounded-lg bg-zinc-800 border border-zinc-700 flex items-center justify-center text-zinc-300">
            <Bot className="w-4 h-4" />
          </div>
          <div>
            <CardTitle className="text-sm font-semibold text-zinc-100 font-mono">
              {agent.agent_name || agent.agent_id}
            </CardTitle>
            <div className="flex items-center gap-1.5 mt-0.5">
              <Badge variant={agent.framework} className="text-[10px] font-mono">
                {agent.framework.toUpperCase()}
              </Badge>
              <span className="text-[10px] text-zinc-500 font-mono">
                {agent.team_id}
              </span>
            </div>
          </div>
        </div>

        <StatusBadge status={agent.status} />
      </CardHeader>

      <CardContent className="p-4 pt-2 font-mono text-xs space-y-2">
        <div className="grid grid-cols-2 gap-2 text-[11px] bg-zinc-950/40 p-2 rounded border border-zinc-800/60">
          <div>
            <span className="text-zinc-500 block">TOKENS</span>
            <span className="text-zinc-200 tabular-nums flex items-center gap-1">
              <Activity className="w-3 h-3 text-zinc-400" />
              {agent.total_tokens.toLocaleString()}
            </span>
          </div>
          <div>
            <span className="text-zinc-500 block">COST</span>
            <span className="text-emerald-400 tabular-nums">
              ${agent.cost_usd.toFixed(4)}
            </span>
          </div>
        </div>

        <div className="flex items-center justify-between pt-1">
          <span className="text-[10px] text-zinc-400">
            Task: {agent.current_task_id || "idle"}
          </span>
          <Link href={`/agents/${agent.agent_id}`}>
            <Button
              variant="ghost"
              size="sm"
              className="h-7 text-[11px] text-zinc-400 hover:text-zinc-100 px-2"
            >
              Inspect
              <ArrowRight className="w-3 h-3 ml-1" />
            </Button>
          </Link>
        </div>
      </CardContent>
    </Card>
  );
}
