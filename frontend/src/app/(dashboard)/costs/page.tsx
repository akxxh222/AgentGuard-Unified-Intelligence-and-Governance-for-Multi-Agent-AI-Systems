"use client";

import React from "react";
import { Coins, Filter, Download } from "lucide-react";
import { Card, CardHeader, CardTitle, CardDescription, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";

export default function CostAttributionPage() {
  return (
    <div className="space-y-6">
      {/* Title */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-2 border-b border-zinc-800/60">
        <div>
          <span className="text-[10px] font-mono tracking-widest text-amber-400 uppercase">
            FINANCIAL OBSERVABILITY
          </span>
          <h1 className="text-xl sm:text-2xl font-bold tracking-tight text-zinc-100 mt-0.5">
            Cost Attribution
          </h1>
          <p className="text-xs text-zinc-400">
            Granular token and cost breakdown per agent, per team, and per task
          </p>
        </div>

        <div className="flex items-center gap-2">
          <Button
            variant="outline"
            size="sm"
            className="h-8 text-xs border-zinc-800 bg-zinc-900/60 text-zinc-300"
          >
            <Filter className="w-3.5 h-3.5 mr-1.5" />
            Group by Agent
          </Button>
          <Button
            size="sm"
            className="h-8 text-xs bg-zinc-100 text-zinc-900 hover:bg-zinc-200 font-semibold"
          >
            <Download className="w-3.5 h-3.5 mr-1.5" />
            Export CSV
          </Button>
        </div>
      </div>

      {/* Metrics Row */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <Card className="bg-zinc-900/70 border-zinc-800/80">
          <CardHeader className="pb-2">
            <CardTitle className="text-xs font-mono text-zinc-400 uppercase">
              Total Cost (24h)
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold font-mono text-zinc-100 tabular-nums">
              $14.8210
            </div>
            <p className="text-[11px] text-zinc-500 mt-1">
              +12.4% vs previous window
            </p>
          </CardContent>
        </Card>

        <Card className="bg-zinc-900/70 border-zinc-800/80">
          <CardHeader className="pb-2">
            <CardTitle className="text-xs font-mono text-zinc-400 uppercase">
              Total Tokens (24h)
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold font-mono text-zinc-100 tabular-nums">
              3,248,190
            </div>
            <p className="text-[11px] text-zinc-500 mt-1">
              68% prompt / 32% completion
            </p>
          </CardContent>
        </Card>

        <Card className="bg-zinc-900/70 border-zinc-800/80">
          <CardHeader className="pb-2">
            <CardTitle className="text-xs font-mono text-zinc-400 uppercase">
              Highest Cost Vector
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-sm font-semibold font-mono text-amber-400 truncate">
              security_auditor (LangChain)
            </div>
            <p className="text-[11px] text-zinc-500 mt-1">
              $6.42 accumulated (43.3% of total)
            </p>
          </CardContent>
        </Card>
      </div>

      {/* Cost Chart & Table Placeholder */}
      <Card className="bg-zinc-900/70 border-zinc-800/80">
        <CardHeader className="pb-3 border-b border-zinc-800/60">
          <CardTitle className="text-sm font-semibold flex items-center gap-2">
            <Coins className="w-4 h-4 text-amber-400" />
            Cost Distribution Charts
          </CardTitle>
          <CardDescription className="text-xs text-zinc-400">
            Interactive Recharts breakdown by framework, team allocation, and token trajectory
          </CardDescription>
        </CardHeader>
        <CardContent className="h-80 flex flex-col items-center justify-center p-6 text-center bg-dot-grid">
          <div className="w-12 h-12 rounded-xl bg-zinc-800/80 border border-zinc-700/80 flex items-center justify-center text-zinc-400 mb-3 shadow-inner">
            <Coins className="w-6 h-6 text-amber-400" />
          </div>
          <h3 className="text-sm font-semibold text-zinc-200">
            Recharts Financial Visualization Container
          </h3>
          <p className="text-xs text-zinc-500 max-w-sm mt-1">
            Bound to GET /costs?group_by=agent|team|task for real-time attribution analytics.
          </p>
        </CardContent>
      </Card>
    </div>
  );
}
