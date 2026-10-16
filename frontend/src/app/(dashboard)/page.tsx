"use client";

import React from "react";
import {
  Activity,
  ShieldAlert,
  Coins,
  RefreshCw,
  AlertTriangle,
  AlertCircle,
  CheckCircle2,
  XCircle,
  Clock,
  Radio,
} from "lucide-react";
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
  CardDescription,
} from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Skeleton } from "@/components/ui/skeleton";
import { StatusBadge } from "@/components/common/StatusBadge";
import { useCollectorPolling } from "@/hooks/useCollectorPolling";

export default function DashboardOverviewPage() {
  const {
    health,
    events,
    alerts,
    isLoading,
    error,
    lastPolled,
    refetch,
  } = useCollectorPolling(2000);

  const totalTokens = events.reduce((sum, e) => sum + (e.tokens_in + e.tokens_out), 0);
  const totalCost = events.reduce((sum, e) => sum + (e.cost_usd || 0), 0);
  const loopAlertsCount = alerts.filter((a) => a.detector === "loop").length;

  return (
    <div className="space-y-6 max-w-7xl mx-auto">
      {/* Top Banner: Product Title & Real-Time Health Indicator */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-3 border-b border-zinc-800/80">
        <div>
          <div className="flex items-center gap-2">
            <span className="text-[10px] font-mono tracking-widest text-emerald-400 uppercase bg-emerald-950/60 border border-emerald-800/60 px-2 py-0.5 rounded">
              AGENTGUARD CORE
            </span>
            <span className="text-zinc-600 font-mono text-xs">|</span>
            <span className="text-[11px] text-zinc-400 font-mono">
              LangChain • AutoGen • CrewAI
            </span>
          </div>
          <h1 className="text-xl sm:text-2xl font-bold tracking-tight text-zinc-100 mt-1">
            Agent Control Tower
          </h1>
          <p className="text-xs text-zinc-400">
            Real-time multi-agent telemetry orchestration, failure detectors & event mesh
          </p>
        </div>

        {/* Polling & Health Indicator */}
        <div className="flex items-center gap-3">
          <div className="flex items-center gap-2 font-mono text-xs">
            {health === "healthy" ? (
              <Badge
                variant="running"
                className="flex items-center gap-1.5 px-2.5 py-1 text-xs border border-emerald-500/30"
              >
                <Radio className="w-3.5 h-3.5 animate-pulse text-emerald-400" />
                <span>COLLECTOR: HEALTHY</span>
              </Badge>
            ) : health === "connecting" ? (
              <Badge
                variant="idle"
                className="flex items-center gap-1.5 px-2.5 py-1 text-xs border border-zinc-700"
              >
                <RefreshCw className="w-3.5 h-3.5 animate-spin text-zinc-400" />
                <span>CONNECTING...</span>
              </Badge>
            ) : (
              <Badge
                variant="alert"
                className="flex items-center gap-1.5 px-2.5 py-1 text-xs border border-amber-500/30"
              >
                <AlertTriangle className="w-3.5 h-3.5 text-amber-400" />
                <span>OFFLINE (MOCK READY)</span>
              </Badge>
            )}
          </div>

          <Button
            variant="outline"
            size="sm"
            onClick={refetch}
            className="h-8 text-xs border-zinc-800 bg-zinc-900/60 text-zinc-300 hover:text-zinc-100"
            title="Poll now"
          >
            <RefreshCw className="w-3 h-3 mr-1.5" />
            <span className="tabular-nums font-mono text-[11px]">
              {lastPolled || "2s"}
            </span>
          </Button>
        </div>
      </div>

      {/* Global Error Banner */}
      {error && !events.length && (
        <div className="p-3 rounded-lg border border-rose-900/50 bg-rose-950/20 text-rose-300 flex items-center justify-between text-xs font-mono">
          <div className="flex items-center gap-2">
            <XCircle className="w-4 h-4 text-rose-400" />
            <span>Collector error: {error}. Check backend server on port 8000.</span>
          </div>
          <Button
            size="sm"
            variant="ghost"
            onClick={refetch}
            className="h-6 text-[10px] text-rose-300 hover:bg-rose-900/40"
          >
            Retry
          </Button>
        </div>
      )}

      {/* Metric Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {/* Metric 1: Recent Events */}
        <Card className="bg-zinc-900/70 border-zinc-800/80">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-xs font-mono font-medium text-zinc-400 uppercase">
              Events Ingested
            </CardTitle>
            <Activity className="h-4 w-4 text-emerald-400" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold font-mono text-zinc-100 tabular-nums">
              {isLoading ? <Skeleton className="h-8 w-20" /> : events.length}
            </div>
            <p className="text-[11px] text-zinc-500 mt-1 flex items-center gap-1.5">
              <span className="w-1.5 h-1.5 rounded-full bg-status-running animate-pulse" />
              2-second polling stream
            </p>
          </CardContent>
        </Card>

        {/* Metric 2: Detected Loop Alerts */}
        <Card className="bg-zinc-900/70 border-zinc-800/80">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-xs font-mono font-medium text-zinc-400 uppercase">
              Loop Alerts
            </CardTitle>
            <ShieldAlert className="h-4 w-4 text-amber-400" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold font-mono text-amber-400 tabular-nums">
              {isLoading ? <Skeleton className="h-8 w-12" /> : loopAlertsCount}
            </div>
            <p className="text-[11px] text-zinc-500 mt-1">
              5 consecutive identical calls trigger
            </p>
          </CardContent>
        </Card>

        {/* Metric 3: Total Run Tokens */}
        <Card className="bg-zinc-900/70 border-zinc-800/80">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-xs font-mono font-medium text-zinc-400 uppercase">
              Total Tokens
            </CardTitle>
            <Clock className="h-4 w-4 text-zinc-400" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold font-mono text-zinc-100 tabular-nums">
              {isLoading ? (
                <Skeleton className="h-8 w-24" />
              ) : (
                totalTokens.toLocaleString()
              )}
            </div>
            <p className="text-[11px] text-zinc-500 mt-1">
              Prompt & completion unified
            </p>
          </CardContent>
        </Card>

        {/* Metric 4: Total Cost */}
        <Card className="bg-zinc-900/70 border-zinc-800/80">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-xs font-mono font-medium text-zinc-400 uppercase">
              Attributed Cost
            </CardTitle>
            <Coins className="h-4 w-4 text-emerald-400" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold font-mono text-emerald-400 tabular-nums">
              {isLoading ? <Skeleton className="h-8 w-20" /> : `$${totalCost.toFixed(4)}`}
            </div>
            <p className="text-[11px] text-zinc-500 mt-1">
              Real-time model pricing
            </p>
          </CardContent>
        </Card>
      </div>

      {/* Main Grid: Alerts Section + Recent Events Table */}
      <div className="space-y-6">
        {/* Section 1: Anomaly Alert Feed (Loop, Token-Spike, Cost) */}
        <Card className="bg-zinc-900/70 border-zinc-800/80">
          <CardHeader className="pb-3 border-b border-zinc-800/60 flex flex-row items-center justify-between">
            <div>
              <CardTitle className="text-sm font-semibold flex items-center gap-2">
                <ShieldAlert className="w-4 h-4 text-amber-400" />
                Detected Anomaly Alerts
              </CardTitle>
              <CardDescription className="text-xs text-zinc-400">
                Lightweight local detectors: loop (5 identical calls), token spike, and task cost runaways
              </CardDescription>
            </div>
            <Badge
              variant={alerts.length > 0 ? "alert" : "success"}
              className="text-[10px] font-mono"
            >
              {alerts.length} ALERTS
            </Badge>
          </CardHeader>

          <CardContent className="p-4">
            {isLoading ? (
              <div className="space-y-2">
                <Skeleton className="h-16 w-full" />
                <Skeleton className="h-16 w-full" />
              </div>
            ) : alerts.length === 0 ? (
              <div className="py-8 text-center text-zinc-500 text-xs font-mono flex flex-col items-center justify-center">
                <CheckCircle2 className="w-6 h-6 text-emerald-500/80 mb-2" />
                <span>Zero anomalies detected. All agent loops healthy.</span>
              </div>
            ) : (
              <div className="space-y-3">
                {alerts.map((alert) => {
                  const isCritical = alert.severity === "critical";
                  const isLoop = alert.detector === "loop";

                  return (
                    <div
                      key={alert.alert_id}
                      className={`p-3.5 rounded-lg border font-mono text-xs transition-colors ${
                        isCritical
                          ? "border-rose-800/60 bg-rose-950/20"
                          : "border-amber-800/60 bg-amber-950/20"
                      }`}
                    >
                      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 mb-2">
                        <div className="flex items-center gap-2">
                          {isCritical ? (
                            <AlertCircle className="w-4 h-4 text-status-quarantined shrink-0" />
                          ) : (
                            <AlertTriangle className="w-4 h-4 text-status-alert shrink-0" />
                          )}
                          <span className="font-bold text-zinc-100 uppercase">
                            {alert.detector.replace("_", " ")} DETECTED
                          </span>
                          <Badge
                            variant={isCritical ? "quarantined" : "alert"}
                            className="text-[9px] px-1.5 py-0 uppercase"
                          >
                            {alert.severity}
                          </Badge>
                          {isLoop && (
                            <Badge
                              variant="destructive"
                              className="text-[9px] px-1.5 py-0 uppercase bg-rose-600"
                            >
                              LOOP FAILURE
                            </Badge>
                          )}
                        </div>
                        <span className="text-[10px] text-zinc-500 tabular-nums">
                          {alert.created_at || "Recent"}
                        </span>
                      </div>

                      <p className="text-xs text-zinc-200 font-sans">{alert.message}</p>

                      {alert.rca && (
                        <div className="mt-2 text-[11px] text-zinc-400 bg-zinc-950/60 p-2 rounded border border-zinc-800/60">
                          <strong className="text-zinc-300">Root Cause / Reason:</strong>{" "}
                          {alert.rca}
                        </div>
                      )}

                      <div className="flex flex-wrap items-center gap-4 mt-2 pt-2 border-t border-zinc-800/50 text-[11px] text-zinc-400">
                        <span>
                          Agent: <strong className="text-zinc-300">{alert.agent_id}</strong>
                        </span>
                        <span>
                          Trace: <strong className="text-zinc-300">{alert.trace_id}</strong>
                        </span>
                        {alert.task_id && (
                          <span>
                            Task: <strong className="text-zinc-300">{alert.task_id}</strong>
                          </span>
                        )}
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </CardContent>
        </Card>

        {/* Section 2: Canonical Event Stream Table */}
        <Card className="bg-zinc-900/70 border-zinc-800/80">
          <CardHeader className="pb-3 border-b border-zinc-800/60 flex flex-row items-center justify-between">
            <div>
              <CardTitle className="text-sm font-semibold flex items-center gap-2">
                <Activity className="w-4 h-4 text-emerald-400" />
                Recent Events Stream
              </CardTitle>
              <CardDescription className="text-xs text-zinc-400">
                14-field canonical events normalized across LangChain, AutoGen, and CrewAI
              </CardDescription>
            </div>
            <Badge variant="outline" className="text-[10px] font-mono text-zinc-400">
              {events.length} Recent Events
            </Badge>
          </CardHeader>

          <CardContent className="p-0">
            {isLoading ? (
              <div className="p-6 space-y-3">
                <Skeleton className="h-8 w-full" />
                <Skeleton className="h-8 w-full" />
                <Skeleton className="h-8 w-full" />
              </div>
            ) : events.length === 0 ? (
              <div className="py-12 text-center text-zinc-500 text-xs font-mono">
                No events received yet. Start your demo agents to stream canonical telemetry.
              </div>
            ) : (
              <div className="overflow-x-auto">
                <Table>
                  <TableHeader>
                    <TableRow className="border-zinc-800 hover:bg-transparent">
                      <TableHead className="font-mono text-xs text-zinc-400">AGENT</TableHead>
                      <TableHead className="font-mono text-xs text-zinc-400">FRAMEWORK</TableHead>
                      <TableHead className="font-mono text-xs text-zinc-400">TYPE</TableHead>
                      <TableHead className="font-mono text-xs text-zinc-400">STATUS</TableHead>
                      <TableHead className="font-mono text-xs text-zinc-400 text-right">
                        TOKENS (IN/OUT)
                      </TableHead>
                      <TableHead className="font-mono text-xs text-zinc-400 text-right">
                        COST (USD)
                      </TableHead>
                      <TableHead className="font-mono text-xs text-zinc-400">TIME</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {events.map((event, idx) => (
                      <TableRow
                        key={event.event_id || idx}
                        className="border-zinc-800/60 font-mono text-xs hover:bg-zinc-800/40 transition-colors"
                      >
                        <TableCell className="font-semibold text-zinc-200">
                          {event.payload?.agent_name || event.agent_id}
                        </TableCell>
                        <TableCell>
                          <Badge variant={event.framework} className="text-[10px]">
                            {event.framework.toUpperCase()}
                          </Badge>
                        </TableCell>
                        <TableCell>
                          <span className="text-zinc-300 font-semibold">
                            {event.event_type}
                          </span>
                        </TableCell>
                        <TableCell>
                          <StatusBadge status={event.status} />
                        </TableCell>
                        <TableCell className="text-right text-zinc-200 tabular-nums">
                          {event.tokens_in.toLocaleString()} /{" "}
                          {event.tokens_out.toLocaleString()}
                        </TableCell>
                        <TableCell className="text-right text-emerald-400 tabular-nums font-semibold">
                          ${event.cost_usd ? event.cost_usd.toFixed(4) : "0.0000"}
                        </TableCell>
                        <TableCell className="text-zinc-400 text-[11px] tabular-nums">
                          {event.timestamp ? event.timestamp.slice(11, 19) : "now"}
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
