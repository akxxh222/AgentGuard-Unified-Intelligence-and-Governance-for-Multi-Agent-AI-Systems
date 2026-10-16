"use client";

import { useState } from "react";
import type { Escalation } from "@/lib/types";

interface Props {
  escalation: Escalation;
  onResolve: (action: string, notes: string) => void;
  onClose: () => void;
}

export default function DecisionModal({ escalation, onResolve, onClose }: Props) {
  const [notes, setNotes] = useState("");
  const [action, setAction] = useState<"approve" | "reject" | "snooze">("approve");

  return (
    <div className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center z-50" onClick={onClose}>
      <div
        className="bg-[#111118] border border-[#1e1e2e] rounded-xl p-6 w-full max-w-md shadow-2xl"
        onClick={(e) => e.stopPropagation()}
      >
        <h3 className="text-lg font-semibold text-slate-100 mb-1">Review Escalation</h3>
        <p className="text-xs font-mono text-slate-400 mb-4">{escalation.detector} — {escalation.severity.toUpperCase()}</p>

        <pre className="bg-[#0a0a0f] rounded-lg p-3 text-xs text-slate-300 font-mono overflow-x-auto mb-4 border border-[#1e1e2e]">
          {JSON.stringify(escalation.details, null, 2)}
        </pre>

        <div className="flex gap-2 mb-4">
          {(["approve", "reject", "snooze"] as const).map((a) => (
            <button
              key={a}
              id={`decision-${a}`}
              onClick={() => setAction(a)}
              className={`flex-1 py-1.5 rounded-md text-xs border transition-colors ${
                action === a
                  ? "bg-indigo-500 border-indigo-500 text-white"
                  : "bg-transparent border-[#1e1e2e] text-slate-400 hover:border-indigo-500/50"
              }`}
            >
              {a.charAt(0).toUpperCase() + a.slice(1)}
            </button>
          ))}
        </div>

        <textarea
          placeholder="Optional notes…"
          value={notes}
          onChange={(e) => setNotes(e.target.value)}
          className="w-full bg-[#0a0a0f] border border-[#1e1e2e] rounded-lg p-2 text-sm text-slate-200 placeholder-slate-600 mb-4 resize-none focus:outline-none focus:border-indigo-500/50"
          rows={3}
        />

        <div className="flex gap-2">
          <button
            onClick={onClose}
            className="flex-1 py-2 rounded-lg border border-[#1e1e2e] text-slate-400 text-sm hover:bg-white/[0.02] transition-colors"
          >
            Cancel
          </button>
          <button
            id="decision-confirm"
            onClick={() => onResolve(action, notes)}
            className="flex-1 py-2 rounded-lg bg-indigo-500 hover:bg-indigo-600 text-white text-sm transition-colors"
          >
            Confirm
          </button>
        </div>
      </div>
    </div>
  );
}
