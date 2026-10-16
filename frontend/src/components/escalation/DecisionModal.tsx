"use client";

import { useState } from "react";
import type { Escalation } from "@/types";
import { Button } from "@/components/ui/button";

interface Props {
  escalation: Escalation;
  onResolve: (action: "approve" | "reject", notes: string) => void;
  onClose: () => void;
}

export default function DecisionModal({ escalation, onResolve, onClose }: Props) {
  const [notes, setNotes] = useState("");
  const [action, setAction] = useState<"approve" | "reject">("approve");

  return (
    <div
      className="fixed inset-0 bg-black/70 backdrop-blur-sm flex items-center justify-center z-50 p-4"
      onClick={onClose}
    >
      <div
        className="bg-zinc-900 border border-zinc-800 rounded-xl p-6 w-full max-w-md shadow-2xl"
        onClick={(e) => e.stopPropagation()}
      >
        <h3 className="text-base font-semibold text-zinc-100 mb-1">
          Review Escalation Decision
        </h3>
        <p className="text-xs font-mono text-zinc-400 mb-4">
          Agent: {escalation.agent_id} • Task: {escalation.task_id}
        </p>

        <pre className="bg-zinc-950 rounded-lg p-3 text-[11px] text-zinc-300 font-mono overflow-x-auto mb-4 border border-zinc-800 max-h-48">
          {JSON.stringify(escalation.payload, null, 2)}
        </pre>

        <div className="flex gap-2 mb-4">
          {(["approve", "reject"] as const).map((a) => (
            <button
              key={a}
              type="button"
              id={`decision-${a}`}
              onClick={() => setAction(a)}
              className={`flex-1 py-1.5 rounded-md text-xs font-semibold border transition-colors ${
                action === a
                  ? a === "approve"
                    ? "bg-emerald-600 border-emerald-500 text-white"
                    : "bg-rose-600 border-rose-500 text-white"
                  : "bg-transparent border-zinc-800 text-zinc-400 hover:border-zinc-700"
              }`}
            >
              {a.toUpperCase()}
            </button>
          ))}
        </div>

        <textarea
          placeholder="Compliance audit notes..."
          value={notes}
          onChange={(e) => setNotes(e.target.value)}
          className="w-full bg-zinc-950 border border-zinc-800 rounded-lg p-2 text-xs text-zinc-200 placeholder-zinc-500 mb-4 resize-none focus:outline-none focus:border-zinc-700"
          rows={3}
        />

        <div className="flex gap-2">
          <Button
            variant="outline"
            onClick={onClose}
            className="flex-1 text-xs border-zinc-800 text-zinc-400"
          >
            Cancel
          </Button>
          <Button
            id="decision-confirm"
            onClick={() => onResolve(action, notes)}
            className="flex-1 text-xs bg-zinc-100 text-zinc-900 hover:bg-zinc-200 font-semibold"
          >
            Confirm Decision
          </Button>
        </div>
      </div>
    </div>
  );
}
