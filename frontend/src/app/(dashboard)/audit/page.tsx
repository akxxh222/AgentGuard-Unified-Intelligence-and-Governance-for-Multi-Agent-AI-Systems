"use client";

import React from "react";
import { FileCheck2, ShieldCheck, Download, Search } from "lucide-react";
import { Card, CardHeader, CardTitle, CardDescription, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";

export default function AuditLogPage() {
  const auditLogs = [
    {
      id: "aud-001",
      timestamp: "2026-10-16 11:15:24",
      action: "QUARANTINE_AGENT",
      actor: "ANOMALY_ENGINE",
      agentId: "fin_extract_01",
      reason: "Infinite loop detector triggered on consecutive 429 rate limit responses",
      severity: "critical" as const,
    },
    {
      id: "aud-002",
      timestamp: "2026-10-16 11:12:08",
      action: "APPROVE_ESCALATION",
      actor: "USER: admin@enterprise.ai",
      agentId: "engineer_lead",
      reason: "Approved tool execution for destructive SQL schema migration",
      severity: "warning" as const,
    },
    {
      id: "aud-003",
      timestamp: "2026-10-16 11:05:41",
      action: "POLICY_ENFORCEMENT",
      actor: "GUARDRAIL_MESH",
      agentId: "research_agent",
      reason: "Redacted PII detected in LLM prompt output",
      severity: "warning" as const,
    },
  ];

  return (
    <div className="space-y-6">
      {/* Title */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-2 border-b border-zinc-800/60">
        <div>
          <span className="text-[10px] font-mono tracking-widest text-emerald-400 uppercase">
            REGULATORY & ENTERPRISE COMPLIANCE
          </span>
          <h1 className="text-xl sm:text-2xl font-bold tracking-tight text-zinc-100 mt-0.5">
            Audit Log & Decision Governance
          </h1>
          <p className="text-xs text-zinc-400">
            Immutable log of all human approvals, automated quarantine actions, and safety violations
          </p>
        </div>

        <div className="flex items-center gap-2">
          <div className="relative w-64">
            <Search className="w-3.5 h-3.5 absolute left-2.5 top-2.5 text-zinc-500" />
            <Input
              placeholder="Search audit trail..."
              className="h-8 pl-8 text-xs bg-zinc-900/60 border-zinc-800"
            />
          </div>
          <Button
            size="sm"
            className="h-8 text-xs bg-zinc-100 text-zinc-900 hover:bg-zinc-200 font-semibold"
          >
            <Download className="w-3.5 h-3.5 mr-1.5" />
            Export Audit Ledger
          </Button>
        </div>
      </div>

      {/* Audit Log Card */}
      <Card className="bg-zinc-900/70 border-zinc-800/80">
        <CardHeader className="pb-3 border-b border-zinc-800/60 flex flex-row items-center justify-between">
          <div>
            <CardTitle className="text-sm font-semibold flex items-center gap-2">
              <FileCheck2 className="w-4 h-4 text-emerald-400" />
              Immutable Governance Ledger
            </CardTitle>
            <CardDescription className="text-xs text-zinc-400">
              Cryptographically verifiable trace of compliance interventions
            </CardDescription>
          </div>
          <Badge variant="outline" className="text-[10px] font-mono text-emerald-400 border-emerald-800/60">
            <ShieldCheck className="w-3 h-3 mr-1 text-emerald-400" /> SOC2 / ISO 27001 Ready
          </Badge>
        </CardHeader>
        <CardContent className="p-0 divide-y divide-zinc-800/60 font-mono text-xs">
          {auditLogs.map((log) => (
            <div
              key={log.id}
              className="p-4 flex flex-col sm:flex-row sm:items-start justify-between gap-3 hover:bg-zinc-800/30 transition-colors"
            >
              <div className="space-y-1">
                <div className="flex items-center gap-2">
                  <span className="text-zinc-200 font-bold">{log.action}</span>
                  <Badge
                    variant={log.severity === "critical" ? "quarantined" : "alert"}
                    className="text-[10px]"
                  >
                    {log.severity.toUpperCase()}
                  </Badge>
                  <span className="text-zinc-400 text-[11px]">• Agent: {log.agentId}</span>
                </div>
                <p className="text-zinc-400 text-xs font-sans mt-0.5">{log.reason}</p>
                <div className="text-[11px] text-zinc-400">Actor: {log.actor}</div>
              </div>

              <span className="text-zinc-400 text-[11px] shrink-0">{log.timestamp}</span>
            </div>
          ))}
        </CardContent>
      </Card>
    </div>
  );
}
