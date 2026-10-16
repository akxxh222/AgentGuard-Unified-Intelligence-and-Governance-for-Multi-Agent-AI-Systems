"use client";

import React from "react";
import { ShieldAlert, CheckCircle2, XCircle, AlertTriangle } from "lucide-react";
import { Card, CardHeader, CardTitle, CardDescription, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";

export default function EscalationsPage() {
  return (
    <div className="space-y-6">
      {/* Title */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-2 border-b border-zinc-800/60">
        <div>
          <span className="text-[10px] font-mono tracking-widest text-status-escalating uppercase">
            HUMAN-IN-THE-LOOP (HITL) GOVERNANCE
          </span>
          <h1 className="text-xl sm:text-2xl font-bold tracking-tight text-zinc-100 mt-0.5">
            Human Escalation Interface
          </h1>
          <p className="text-xs text-zinc-400">
            Real-time approval or quarantine decisions for paused agent operations
          </p>
        </div>

        <div className="flex items-center gap-2">
          <Badge variant="escalating" className="font-mono text-xs px-2.5 py-1">
            1 PENDING ESCALATION
          </Badge>
        </div>
      </div>

      {/* Escalation Item Card */}
      <Card className="bg-zinc-900/80 border-status-escalating/40 shadow-lg shadow-sky-950/20">
        <CardHeader className="pb-3 border-b border-zinc-800/60 flex flex-row items-start justify-between">
          <div className="space-y-1">
            <div className="flex items-center gap-2">
              <Badge variant="escalating" className="font-mono text-[10px]">
                PAUSED FOR REVIEW
              </Badge>
              <Badge variant="crewai" className="font-mono text-[10px]">
                CREWAI
              </Badge>
              <span className="text-zinc-500 font-mono text-xs">esc-88219</span>
            </div>
            <CardTitle className="text-base font-semibold text-zinc-100 flex items-center gap-2">
              <AlertTriangle className="w-4 h-4 text-amber-400" />
              High Token Runaway Detected in Financial Extraction Agent
            </CardTitle>
            <CardDescription className="text-xs text-zinc-400">
              Agent has generated 48,200 tokens across 6 consecutive loop iterations without progress.
            </CardDescription>
          </div>

          <div className="flex items-center gap-2">
            <Button
              variant="outline"
              size="sm"
              className="h-8 text-xs border-rose-900/60 bg-rose-950/30 hover:bg-rose-900/50 text-rose-300"
            >
              <XCircle className="w-3.5 h-3.5 mr-1 text-rose-400" />
              Reject & Quarantine
            </Button>
            <Button
              size="sm"
              className="h-8 text-xs bg-emerald-600 hover:bg-emerald-500 text-white font-semibold"
            >
              <CheckCircle2 className="w-3.5 h-3.5 mr-1" />
              Approve Continuation
            </Button>
          </div>
        </CardHeader>
        <CardContent className="p-4 bg-zinc-950/40 font-mono text-xs space-y-3">
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 text-[11px]">
            <div>
              <span className="text-zinc-500 block">AGENT ID</span>
              <span className="text-zinc-200">fin_extract_01</span>
            </div>
            <div>
              <span className="text-zinc-500 block">TRACE ID</span>
              <span className="text-zinc-200">tr-8819b-crawl</span>
            </div>
            <div>
              <span className="text-zinc-500 block">DETECTOR</span>
              <span className="text-amber-400">loop / token_spike</span>
            </div>
            <div>
              <span className="text-zinc-500 block">COST AT PAUSE</span>
              <span className="text-zinc-200 tabular-nums">$0.0723</span>
            </div>
          </div>

          <div className="rounded border border-zinc-800 bg-zinc-900/90 p-3 text-[11px] text-zinc-300 overflow-x-auto">
            <span className="text-zinc-500 block mb-1 uppercase font-semibold text-[10px]">Pending Tool Invocation Context</span>
            <pre className="text-zinc-300">{JSON.stringify({
              action: "execute_batch_scrape",
              target_urls: ["https://api.finance.internal/v2/ledger", "https://api.finance.internal/v2/reconciliation"],
              max_retry: 5,
              reason: "Loop condition: identical tool arguments invoked 4 consecutive times with status code 429"
            }, null, 2)}</pre>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
