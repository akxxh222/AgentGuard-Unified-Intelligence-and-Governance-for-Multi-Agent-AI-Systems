"use client";

import React from "react";
import { useParams } from "next/navigation";
import Link from "next/link";
import { ArrowLeft, GitBranch, Play, RotateCcw, Share2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Card, CardHeader, CardTitle, CardDescription, CardContent } from "@/components/ui/card";

export default function TraceReplayPage() {
  const params = useParams();
  const traceId = (params?.traceId as string) || "tr-latest";

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-3 border-b border-zinc-800/60">
        <div className="flex items-center gap-3">
          <Link href="/traces">
            <Button
              variant="outline"
              size="icon"
              className="h-8 w-8 border-zinc-800 bg-zinc-900/60 text-zinc-400 hover:text-zinc-100"
              aria-label="Back to traces"
            >
              <ArrowLeft className="w-4 h-4" />
            </Button>
          </Link>
          <div>
            <div className="flex items-center gap-2">
              <span className="text-[10px] font-mono tracking-widest text-zinc-400 uppercase">
                TRACE REPLAY & AUDIT
              </span>
              <Badge variant="running" className="text-[10px] font-mono">
                RECORDED
              </Badge>
            </div>
            <h1 className="text-xl font-bold tracking-tight text-zinc-100 font-mono mt-0.5">
              {traceId}
            </h1>
          </div>
        </div>

        <div className="flex items-center gap-2">
          <Button
            variant="outline"
            size="sm"
            className="h-8 text-xs border-zinc-800 bg-zinc-900/60 text-zinc-300"
          >
            <RotateCcw className="w-3.5 h-3.5 mr-1.5" />
            Reset
          </Button>
          <Button
            size="sm"
            className="h-8 text-xs bg-emerald-600 hover:bg-emerald-500 text-white font-semibold"
          >
            <Play className="w-3.5 h-3.5 mr-1.5" />
            Replay Run
          </Button>
          <Button
            variant="outline"
            size="icon"
            className="h-8 w-8 border-zinc-800 bg-zinc-900/60 text-zinc-400 hover:text-zinc-100"
            aria-label="Export audit packet"
          >
            <Share2 className="w-4 h-4" />
          </Button>
        </div>
      </div>

      {/* DAG Visualization Canvas */}
      <Card className="bg-zinc-900/70 border-zinc-800/80">
        <CardHeader className="pb-3 border-b border-zinc-800/60 flex flex-row items-center justify-between">
          <div>
            <CardTitle className="text-sm font-semibold flex items-center gap-2">
              <GitBranch className="w-4 h-4 text-emerald-400" />
              Trace Lineage Graph
            </CardTitle>
            <CardDescription className="text-xs text-zinc-400">
              Topological DAG of calls with token and latency edges
            </CardDescription>
          </div>
        </CardHeader>
        <CardContent className="h-96 flex flex-col items-center justify-center p-6 text-center bg-dot-grid">
          <div className="w-12 h-12 rounded-xl bg-zinc-800/80 border border-zinc-700/80 flex items-center justify-center text-zinc-400 mb-3 shadow-inner">
            <GitBranch className="w-6 h-6 text-emerald-400" />
          </div>
          <h3 className="text-sm font-semibold text-zinc-200">
            Interactive Lineage Graph Container
          </h3>
          <p className="text-xs text-zinc-500 max-w-sm mt-1">
            Replays each decision step chronologically with slider controls, showing payload diffs and detector triggers.
          </p>
        </CardContent>
      </Card>
    </div>
  );
}
