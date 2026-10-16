"use client";

import React from "react";
import { useParams } from "next/navigation";
import { Bot, ArrowLeft, Activity, ShieldCheck, Cpu } from "lucide-react";
import Link from "next/link";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Card, CardHeader, CardTitle, CardDescription, CardContent } from "@/components/ui/card";

export default function AgentDetailPage() {
  const params = useParams();
  const agentId = (params?.id as string) || "demo-agent";

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between pb-3 border-b border-zinc-800/60">
        <div className="flex items-center gap-3">
          <Link href="/">
            <Button
              variant="outline"
              size="icon"
              className="h-8 w-8 border-zinc-800 bg-zinc-900/60 text-zinc-400 hover:text-zinc-100"
              aria-label="Back to dashboard"
            >
              <ArrowLeft className="w-4 h-4" />
            </Button>
          </Link>
          <div>
            <div className="flex items-center gap-2">
              <span className="text-[10px] font-mono tracking-widest text-zinc-400 uppercase">
                AGENT INSPECTION
              </span>
              <Badge variant="running" className="text-[10px] font-mono">
                RUNNING
              </Badge>
              <Badge variant="langchain" className="text-[10px] font-mono">
                LANGCHAIN
              </Badge>
            </div>
            <h1 className="text-xl font-bold tracking-tight text-zinc-100 font-mono mt-0.5">
              {agentId}
            </h1>
          </div>
        </div>

        <div className="flex items-center gap-2">
          <Button
            variant="destructive"
            size="sm"
            className="text-xs h-8 font-semibold"
          >
            Quarantine Agent
          </Button>
        </div>
      </div>

      {/* Metrics Row */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <Card className="bg-zinc-900/70 border-zinc-800/80">
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-xs font-mono text-zinc-400 uppercase">
              Assigned Task
            </CardTitle>
            <Activity className="w-4 h-4 text-emerald-400" />
          </CardHeader>
          <CardContent>
            <div className="text-sm font-semibold text-zinc-200">
              task_sec_audit_8819
            </div>
            <p className="text-[11px] text-zinc-400 mt-1">
              Started 3m ago • Team: Infosec
            </p>
          </CardContent>
        </Card>

        <Card className="bg-zinc-900/70 border-zinc-800/80">
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-xs font-mono text-zinc-400 uppercase">
              Model & Engine
            </CardTitle>
            <Cpu className="w-4 h-4 text-violet-400" />
          </CardHeader>
          <CardContent>
            <div className="text-sm font-semibold font-mono text-zinc-200">
              claude-3-5-sonnet
            </div>
            <p className="text-[11px] text-zinc-400 mt-1">
              LangChain RunnableSequence
            </p>
          </CardContent>
        </Card>

        <Card className="bg-zinc-900/70 border-zinc-800/80">
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-xs font-mono text-zinc-400 uppercase">
              Governance Status
            </CardTitle>
            <ShieldCheck className="w-4 h-4 text-emerald-400" />
          </CardHeader>
          <CardContent>
            <div className="text-sm font-semibold text-emerald-400">
              Nominal • 0 Violations
            </div>
            <p className="text-[11px] text-zinc-400 mt-1">
              Safety guardrails enforced
            </p>
          </CardContent>
        </Card>
      </div>

      {/* Detailed placeholder */}
      <Card className="bg-zinc-900/70 border-zinc-800/80">
        <CardHeader className="border-b border-zinc-800/60 pb-3">
          <CardTitle className="text-sm font-semibold flex items-center gap-2">
            <Bot className="w-4 h-4 text-zinc-300" />
            Execution Trace & Sub-Agent Invocations
          </CardTitle>
          <CardDescription className="text-xs text-zinc-400">
            Step-by-step decision sequence, tool parameters, and token cost attribution
          </CardDescription>
        </CardHeader>
        <CardContent className="p-8 text-center bg-dot-grid">
          <div className="max-w-md mx-auto space-y-2">
            <h3 className="text-sm font-semibold text-zinc-200">
              Agent Telemetry Ready
            </h3>
            <p className="text-xs text-zinc-400">
              Detailed agent view will bind to GET /agents/{agentId} and display live event logs, parent-child delegation traces, and parameter inspectors.
            </p>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
