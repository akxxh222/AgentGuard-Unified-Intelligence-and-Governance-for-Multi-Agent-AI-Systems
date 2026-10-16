"use client";

import React from "react";
import { ThemeToggle } from "./ThemeToggle";
import { Badge } from "@/components/ui/badge";
import { Radio, ShieldAlert } from "lucide-react";

export function Header() {
  return (
    <header className="h-14 border-b border-zinc-800/80 bg-zinc-950/80 px-4 flex items-center justify-between backdrop-blur-sm z-20">
      <div className="flex items-center gap-4">
        <div className="flex items-center gap-2 text-xs font-mono">
          <Badge
            variant="running"
            className="flex items-center gap-1.5 px-2 py-0.5"
          >
            <Radio className="w-3 h-3 animate-pulse text-emerald-400" />
            <span>STREAM: LIVE</span>
          </Badge>
          <span className="text-zinc-600">|</span>
          <span className="text-zinc-400">CLUSTER:</span>
          <span className="text-zinc-200 font-semibold">us-east-1a</span>
        </div>
      </div>

      <div className="flex items-center gap-3">
        {/* Quick telemetry indicators */}
        <div className="hidden sm:flex items-center gap-2 font-mono text-xs text-zinc-400 bg-zinc-900/60 border border-zinc-800/80 rounded-md px-2.5 py-1">
          <div className="flex items-center gap-1.5">
            <span className="w-2 h-2 rounded-full bg-status-running" />
            <span className="text-zinc-300 font-semibold tabular-nums">4</span>
            <span className="text-[10px] text-zinc-500 uppercase">Active</span>
          </div>
          <span className="text-zinc-700">•</span>
          <div className="flex items-center gap-1.5">
            <ShieldAlert className="w-3 h-3 text-status-escalating" />
            <span className="text-status-escalating font-semibold tabular-nums">
              1
            </span>
            <span className="text-[10px] text-zinc-500 uppercase">Escalation</span>
          </div>
          <span className="text-zinc-700">•</span>
          <div className="flex items-center gap-1">
            <span className="text-zinc-500 text-[10px]">COST:</span>
            <span className="text-zinc-200 font-semibold tabular-nums">
              $0.0428
            </span>
          </div>
        </div>

        {/* Theme toggle */}
        <ThemeToggle />
      </div>
    </header>
  );
}
