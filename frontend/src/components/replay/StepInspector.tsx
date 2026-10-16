"use client";

import type { AgentEvent } from "@/lib/types";

interface Props {
  event: AgentEvent | null;
}

export default function StepInspector({ event }: Props) {
  if (!event) {
    return (
      <div className="text-slate-500 text-sm flex items-center justify-center h-full">
        Select an event to inspect
      </div>
    );
  }

  return (
    <div className="flex flex-col gap-3">
      <div className="flex items-center gap-2">
        <span className="text-xs font-mono text-indigo-400">{event.event_type}</span>
        <span className="text-xs text-slate-500">{event.framework}</span>
      </div>

      {event.tokens && (
        <div className="grid grid-cols-3 gap-2">
          {(["prompt", "completion", "total"] as const).map((k) => (
            <div key={k} className="bg-[#0a0a0f] rounded p-2 border border-[#1e1e2e]">
              <p className="text-xs text-slate-500 capitalize">{k}</p>
              <p className="text-sm font-semibold text-slate-200">{event.tokens![k].toLocaleString()}</p>
            </div>
          ))}
        </div>
      )}

      <pre className="bg-[#0a0a0f] rounded-lg p-3 text-xs text-slate-300 font-mono overflow-x-auto border border-[#1e1e2e] max-h-64">
        {JSON.stringify(event.payload, null, 2)}
      </pre>
    </div>
  );
}
