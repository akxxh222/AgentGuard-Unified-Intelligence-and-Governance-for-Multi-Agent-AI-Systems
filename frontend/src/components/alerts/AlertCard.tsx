"use client";

import React from "react";
import type { Alert } from "@/types";
import { Badge } from "@/components/ui/badge";
import { AlertCircle, AlertTriangle } from "lucide-react";

interface Props {
  alert: Alert;
}

export default function AlertCard({ alert }: Props) {
  const isCritical = alert.severity === "critical";

  return (
    <div
      className={`border rounded-lg p-2.5 bg-zinc-950/60 font-mono text-xs transition-colors ${
        isCritical
          ? "border-status-quarantined/40 hover:border-status-quarantined/70"
          : "border-status-alert/40 hover:border-status-alert/70"
      }`}
    >
      <div className="flex items-center justify-between mb-1.5">
        <span className="flex items-center gap-1.5 font-semibold text-zinc-200">
          {isCritical ? (
            <AlertCircle className="w-3.5 h-3.5 text-status-quarantined" />
          ) : (
            <AlertTriangle className="w-3.5 h-3.5 text-status-alert" />
          )}
          {alert.detector}
        </span>
        <Badge
          variant={isCritical ? "quarantined" : "alert"}
          className="text-[9px] px-1.5 py-0 uppercase"
        >
          {alert.action}
        </Badge>
      </div>

      <p className="text-[11px] text-zinc-300 font-sans line-clamp-2">{alert.message}</p>

      <div className="flex items-center justify-between mt-2 pt-1 border-t border-zinc-800/60 text-[10px] text-zinc-500">
        <span>Agent: {alert.agent_id}</span>
        <span>Trace: {alert.trace_id}</span>
      </div>
    </div>
  );
}
