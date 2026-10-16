"use client";

import React from "react";
import type { AgentEvent } from "@/types";
import { Badge } from "@/components/ui/badge";

interface Props {
  event: AgentEvent | null;
}

export default function StepInspector({ event }: Props) {
  if (!event) {
    return (
      <div className="text-zinc-500 text-xs font-mono flex items-center justify-center h-full">
        Select an event to inspect parameters & outputs
      </div>
    );
  }

  return (
    <div className="flex flex-col gap-3 font-mono text-xs">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <Badge variant="running" className="text-[10px] uppercase font-bold">
            {event.event_type}
          </Badge>
          <Badge variant={event.framework} className="text-[10px]">
            {event.framework.toUpperCase()}
          </Badge>
        </div>
        <span className="text-[10px] text-zinc-500">{event.timestamp}</span>
      </div>

      <div className="grid grid-cols-3 gap-2 text-[11px]">
        <div className="bg-zinc-950/60 rounded p-2 border border-zinc-800">
          <p className="text-[10px] text-zinc-500 uppercase">Tokens In</p>
          <p className="font-semibold text-zinc-200 tabular-nums">
            {event.tokens_in.toLocaleString()}
          </p>
        </div>
        <div className="bg-zinc-950/60 rounded p-2 border border-zinc-800">
          <p className="text-[10px] text-zinc-500 uppercase">Tokens Out</p>
          <p className="font-semibold text-zinc-200 tabular-nums">
            {event.tokens_out.toLocaleString()}
          </p>
        </div>
        <div className="bg-zinc-950/60 rounded p-2 border border-zinc-800">
          <p className="text-[10px] text-zinc-500 uppercase">Cost (USD)</p>
          <p className="font-semibold text-emerald-400 tabular-nums">
            ${event.cost_usd.toFixed(4)}
          </p>
        </div>
      </div>

      <div className="space-y-1">
        <span className="text-[10px] text-zinc-500 uppercase font-semibold">
          Execution Payload
        </span>
        <pre className="bg-zinc-950 rounded-lg p-3 text-[11px] text-zinc-300 font-mono overflow-x-auto border border-zinc-800 max-h-64">
          {JSON.stringify(event.payload, null, 2)}
        </pre>
      </div>
    </div>
  );
}
