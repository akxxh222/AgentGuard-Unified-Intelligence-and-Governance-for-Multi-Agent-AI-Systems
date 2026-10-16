"use client";

import React from "react";
import { useAgentStore } from "@/store/agentStore";
import { api } from "@/lib/api";
import { logger } from "@/lib/logger";
import { CheckCircle2, XCircle, ShieldAlert } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";

export default function EscalationQueue() {
  const escalations = useAgentStore((s) => s.escalations);
  const resolveEscalation = useAgentStore((s) => s.resolveEscalation);

  async function handleApprove(id: string) {
    try {
      await api.approveEscalation(id);
      resolveEscalation(id, "approved");
    } catch (err) {
      logger.error("Failed to approve escalation", err);
    }
  }

  async function handleReject(id: string) {
    try {
      await api.rejectEscalation(id);
      resolveEscalation(id, "rejected");
    } catch (err) {
      logger.error("Failed to reject escalation", err);
    }
  }

  const pending = escalations.filter((e) => e.status === "pending");

  return (
    <div>
      <div className="flex items-center justify-between mb-3">
        <h2 className="text-xs font-mono font-semibold text-zinc-400 uppercase tracking-wider flex items-center gap-1.5">
          <ShieldAlert className="w-4 h-4 text-status-escalating" />
          Escalation Queue
        </h2>
        {pending.length > 0 && (
          <Badge variant="escalating" className="text-[10px] font-mono">
            {pending.length} PENDING
          </Badge>
        )}
      </div>

      {pending.length === 0 ? (
        <p className="text-zinc-500 text-xs font-mono py-4">Queue is clear ✓</p>
      ) : (
        <div className="flex flex-col gap-2">
          {pending.map((esc) => (
            <div
              key={esc.escalation_id}
              className="flex items-center justify-between border border-zinc-800 rounded-lg px-4 py-3 bg-zinc-950/60 font-mono text-xs"
            >
              <div className="flex items-center gap-3">
                <span className="w-2 h-2 rounded-full bg-status-escalating animate-pulse" />
                <div>
                  <p className="font-semibold text-zinc-200">{esc.agent_id}</p>
                  <p className="text-zinc-400 text-[11px] font-sans">{esc.reason}</p>
                </div>
              </div>
              <div className="flex gap-2">
                <Button
                  id={`approve-${esc.escalation_id}`}
                  size="sm"
                  variant="outline"
                  onClick={() => handleApprove(esc.escalation_id)}
                  className="h-7 text-xs border-emerald-800/60 bg-emerald-950/20 text-emerald-400 hover:bg-emerald-900/40"
                >
                  <CheckCircle2 className="w-3 h-3 mr-1" />
                  Approve
                </Button>
                <Button
                  id={`reject-${esc.escalation_id}`}
                  size="sm"
                  variant="outline"
                  onClick={() => handleReject(esc.escalation_id)}
                  className="h-7 text-xs border-rose-800/60 bg-rose-950/20 text-rose-400 hover:bg-rose-900/40"
                >
                  <XCircle className="w-3 h-3 mr-1" />
                  Reject
                </Button>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
