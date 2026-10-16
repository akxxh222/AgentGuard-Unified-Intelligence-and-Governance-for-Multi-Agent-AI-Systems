"use client";

import React from "react";
import Link from "next/link";
import { GitBranch, ArrowUpRight, Search, Clock, DollarSign } from "lucide-react";
import { Card, CardHeader, CardTitle, CardDescription, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";

export default function TracesListPage() {
  const mockTraces = [
    {
      traceId: "tr-9182a-sec-flow",
      rootAgent: "security_auditor",
      framework: "langchain" as const,
      status: "success" as const,
      eventsCount: 14,
      totalCost: 0.0142,
      duration: "4.2s",
      timestamp: "2 mins ago",
    },
    {
      traceId: "tr-7718b-code-gen",
      rootAgent: "engineer_lead",
      framework: "autogen" as const,
      status: "running" as const,
      eventsCount: 28,
      totalCost: 0.0215,
      duration: "18.6s",
      timestamp: "Just now",
    },
    {
      traceId: "tr-6321c-data-scrape",
      rootAgent: "research_agent",
      framework: "crewai" as const,
      status: "quarantined" as const,
      eventsCount: 9,
      totalCost: 0.0071,
      duration: "1.8s",
      timestamp: "12 mins ago",
    },
  ];

  return (
    <div className="space-y-6">
      {/* Title */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-2 border-b border-zinc-800/60">
        <div>
          <span className="text-[10px] font-mono tracking-widest text-zinc-400 uppercase">
            OBSERVABILITY & AUDIT
          </span>
          <h1 className="text-xl sm:text-2xl font-bold tracking-tight text-zinc-100 mt-0.5">
            Execution Traces & Lineage
          </h1>
          <p className="text-xs text-zinc-400">
            End-to-end multi-agent execution traces, call graphs, and token cost attribution
          </p>
        </div>

        <div className="flex items-center gap-2">
          <div className="relative w-64">
            <Search className="w-3.5 h-3.5 absolute left-2.5 top-2.5 text-zinc-500" />
            <Input
              placeholder="Filter by trace_id, agent..."
              className="h-8 pl-8 text-xs bg-zinc-900/60 border-zinc-800"
            />
          </div>
        </div>
      </div>

      {/* Traces List Card */}
      <Card className="bg-zinc-900/70 border-zinc-800/80">
        <CardHeader className="pb-3 border-b border-zinc-800/60">
          <CardTitle className="text-sm font-semibold flex items-center gap-2">
            <GitBranch className="w-4 h-4 text-emerald-400" />
            Recent Traces
          </CardTitle>
          <CardDescription className="text-xs text-zinc-400">
            Select a trace to view the interactive lineage DAG and step-by-step replay
          </CardDescription>
        </CardHeader>
        <CardContent className="p-0 divide-y divide-zinc-800/60 font-mono text-xs">
          {mockTraces.map((trace) => (
            <div
              key={trace.traceId}
              className="p-4 flex flex-col sm:flex-row sm:items-center justify-between gap-3 hover:bg-zinc-800/30 transition-colors"
            >
              <div className="space-y-1">
                <div className="flex items-center gap-2">
                  <span className="text-zinc-200 font-semibold">{trace.traceId}</span>
                  <Badge variant={trace.status} className="text-[10px]">
                    {trace.status.toUpperCase()}
                  </Badge>
                  <Badge variant={trace.framework} className="text-[10px]">
                    {trace.framework.toUpperCase()}
                  </Badge>
                </div>
                <div className="text-zinc-500 text-[11px] flex items-center gap-3">
                  <span>Root: <strong className="text-zinc-300">{trace.rootAgent}</strong></span>
                  <span>•</span>
                  <span>{trace.eventsCount} events</span>
                  <span>•</span>
                  <span className="flex items-center gap-1">
                    <Clock className="w-3 h-3" /> {trace.duration}
                  </span>
                  <span>•</span>
                  <span className="flex items-center gap-1">
                    <DollarSign className="w-3 h-3 text-emerald-400" /> ${trace.totalCost.toFixed(4)}
                  </span>
                </div>
              </div>

              <div className="flex items-center gap-3">
                <span className="text-zinc-500 text-[11px]">{trace.timestamp}</span>
                <Link href={`/traces/${trace.traceId}`}>
                  <Button
                    size="sm"
                    variant="outline"
                    className="h-8 text-xs border-zinc-700 bg-zinc-800/60 hover:bg-zinc-800 text-zinc-200"
                  >
                    View Lineage DAG
                    <ArrowUpRight className="w-3.5 h-3.5 ml-1" />
                  </Button>
                </Link>
              </div>
            </div>
          ))}
        </CardContent>
      </Card>
    </div>
  );
}
