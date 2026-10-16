"use client";

import { useAgentStore } from "@/store/agentStore";
import { api } from "@/lib/api";
import type { Severity } from "@/lib/types";
import clsx from "clsx";

const SEVERITY_DOT: Record<Severity, string> = {
  low: "bg-slate-400",
  medium: "bg-yellow-400",
  high: "bg-orange-400",
  critical: "bg-red-400 animate-pulse",
};

export default function EscalationQueue() {
  const { escalations, resolveEscalation } = useAgentStore();

  async function handleResolve(id: string, action: "approve" | "reject") {
    await api.escalations.resolve(id, action);
    resolveEscalation(id);
  }

  return (
    <div>
      <h2 className="text-sm font-semibold text-slate-400 uppercase tracking-wider mb-3">
        Escalation Queue
        {escalations.length > 0 && (
          <span className="ml-2 bg-orange-500/10 text-orange-400 text-xs px-2 py-0.5 rounded-full border border-orange-500/20">
            {escalations.length} pending
          </span>
        )}
      </h2>

      {escalations.length === 0 ? (
        <p className="text-slate-500 text-sm">Queue is clear ✓</p>
      ) : (
        <div className="flex flex-col gap-2">
          {escalations.map((esc) => (
            <div
              key={esc.id}
              className="flex items-center justify-between border border-[#1e1e2e] rounded-lg px-4 py-3 bg-[#0a0a0f]"
            >
              <div className="flex items-center gap-3">
                <div className={clsx("w-2 h-2 rounded-full", SEVERITY_DOT[esc.severity])} />
                <div>
                  <p className="text-sm font-mono text-slate-200">{esc.detector}</p>
                  <p className="text-xs text-slate-500">{esc.agent_id.slice(0, 16)}…</p>
                </div>
              </div>
              <div className="flex gap-2">
                <button
                  id={`approve-${esc.id}`}
                  onClick={() => handleResolve(esc.id, "approve")}
                  className="text-xs px-3 py-1 rounded-md bg-emerald-500/10 text-emerald-400 border border-emerald-500/20 hover:bg-emerald-500/20 transition-colors"
                >
                  Approve
                </button>
                <button
                  id={`reject-${esc.id}`}
                  onClick={() => handleResolve(esc.id, "reject")}
                  className="text-xs px-3 py-1 rounded-md bg-red-500/10 text-red-400 border border-red-500/20 hover:bg-red-500/20 transition-colors"
                >
                  Reject
                </button>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
