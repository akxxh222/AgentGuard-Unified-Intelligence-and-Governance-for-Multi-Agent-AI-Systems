"use client";

import React from "react";
import { GitBranch, Maximize2, RefreshCw } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";

interface LineageGraphProps {
  className?: string;
  traceId?: string;
}

export function LineageGraph({ className, traceId }: LineageGraphProps) {
  return (
    <div
      className={`relative w-full h-full min-h-[320px] rounded-lg border border-zinc-800 bg-zinc-950/60 bg-dot-grid flex flex-col ${className ?? ""}`}
    >
      {/* Graph Toolbar */}
      <div className="absolute top-3 left-3 z-10 flex items-center gap-2 bg-zinc-900/90 border border-zinc-800 rounded-md p-1 shadow-md">
        <Badge variant="outline" className="text-[10px] font-mono text-zinc-400">
          DAG Engine
        </Badge>
        {traceId && (
          <span className="text-[11px] font-mono text-zinc-300 px-1">
            {traceId}
          </span>
        )}
      </div>

      <div className="absolute top-3 right-3 z-10 flex items-center gap-1 bg-zinc-900/90 border border-zinc-800 rounded-md p-0.5 shadow-md">
        <Button
          variant="ghost"
          size="icon"
          className="h-7 w-7 text-zinc-400 hover:text-zinc-100"
          aria-label="Refresh layout"
          title="Refresh DAG layout"
        >
          <RefreshCw className="w-3.5 h-3.5" />
        </Button>
        <Button
          variant="ghost"
          size="icon"
          className="h-7 w-7 text-zinc-400 hover:text-zinc-100"
          aria-label="Fit view"
          title="Fit view"
        >
          <Maximize2 className="w-3.5 h-3.5" />
        </Button>
      </div>

      {/* Canvas Area */}
      <div className="flex-1 flex flex-col items-center justify-center p-6 text-center select-none">
        <div className="w-12 h-12 rounded-xl bg-zinc-900 border border-zinc-800 flex items-center justify-center text-emerald-400 mb-2 shadow-inner">
          <GitBranch className="w-6 h-6 animate-pulse" />
        </div>
        <div className="text-xs font-semibold text-zinc-200">
          Lineage DAG Topology Initialized
        </div>
        <p className="text-[11px] text-zinc-400 max-w-xs mt-1">
          Ready for @xyflow/react nodes (LangChain, AutoGen, CrewAI) and dagre hierarchical layouts.
        </p>
      </div>
    </div>
  );
}
