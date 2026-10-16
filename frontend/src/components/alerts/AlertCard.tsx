"use client";

import type { AnomalyAlert, Severity } from "@/lib/types";
import clsx from "clsx";

const SEVERITY_STYLES: Record<Severity, string> = {
  low: "border-l-slate-500 bg-slate-500/5",
  medium: "border-l-yellow-500 bg-yellow-500/5",
  high: "border-l-orange-500 bg-orange-500/5",
  critical: "border-l-red-500 bg-red-500/5",
};

const SEVERITY_TEXT: Record<Severity, string> = {
  low: "text-slate-400",
  medium: "text-yellow-400",
  high: "text-orange-400",
  critical: "text-red-400",
};

interface Props {
  alert: AnomalyAlert;
}

export default function AlertCard({ alert }: Props) {
  return (
    <div
      className={clsx(
        "border border-[#1e1e2e] border-l-2 rounded-lg px-3 py-2",
        SEVERITY_STYLES[alert.severity]
      )}
    >
      <div className="flex items-center justify-between mb-1">
        <span className={clsx("text-xs font-semibold font-mono", SEVERITY_TEXT[alert.severity])}>
          {alert.detector}
        </span>
        <span className="text-xs text-slate-500">{alert.severity.toUpperCase()}</span>
      </div>
      <p className="text-xs text-slate-400 font-mono truncate">{alert.agent_id}</p>
      {alert.details && (
        <p className="text-xs text-slate-500 mt-1 truncate">
          {JSON.stringify(alert.details).slice(0, 80)}
        </p>
      )}
    </div>
  );
}
