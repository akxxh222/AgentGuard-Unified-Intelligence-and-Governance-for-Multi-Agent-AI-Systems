"use client";

import type { AgentStatus } from "@/lib/types";
import clsx from "clsx";

const CONFIG: Record<AgentStatus, { label: string; classes: string }> = {
  idle: { label: "Idle", classes: "bg-slate-500/10 text-slate-400 border-slate-500/20" },
  running: { label: "Running", classes: "bg-indigo-500/10 text-indigo-400 border-indigo-500/20" },
  error: { label: "Error", classes: "bg-red-500/10 text-red-400 border-red-500/20" },
  completed: { label: "Done", classes: "bg-emerald-500/10 text-emerald-400 border-emerald-500/20" },
  success: { label: "Success", classes: "bg-emerald-500/10 text-emerald-400 border-emerald-500/20" },
  failed: { label: "Failed", classes: "bg-red-500/10 text-red-400 border-red-500/20" },
  paused: { label: "Paused", classes: "bg-yellow-500/10 text-yellow-400 border-yellow-500/20" },
  quarantined: { label: "Quarantined", classes: "bg-red-500/10 text-red-400 border-red-500/20" },
};

interface Props {
  status: AgentStatus;
}

export default function StatusBadge({ status }: Props) {
  const { label, classes } = CONFIG[status] ?? CONFIG.idle;
  return (
    <span className={clsx("text-xs px-2 py-0.5 rounded-full border font-medium", classes)}>
      {status === "running" && <span className="inline-block w-1.5 h-1.5 rounded-full bg-current mr-1 animate-pulse" />}
      {label}
    </span>
  );
}
