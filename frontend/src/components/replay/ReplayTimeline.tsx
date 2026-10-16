"use client";

import { useAgentStore } from "@/store/agentStore";
import { formatDistanceToNow } from "date-fns";

export default function ReplayTimeline() {
  const events = useAgentStore((s) => s.events);

  return (
    <div className="flex flex-col gap-0.5 h-full overflow-y-auto">
      <h2 className="text-sm font-semibold text-slate-400 uppercase tracking-wider mb-2 sticky top-0 bg-[#111118]">
        Event Timeline
      </h2>
      {events.length === 0 ? (
        <p className="text-slate-500 text-sm">No events yet.</p>
      ) : (
        <div className="flex flex-col gap-1">
          {events.map((ev, i) => (
            <div
              key={i}
              className="flex items-center gap-3 px-2 py-1.5 rounded hover:bg-white/[0.02] group"
            >
              <div className="w-1.5 h-1.5 rounded-full bg-indigo-500 shrink-0" />
              <span className="text-xs font-mono text-indigo-400 shrink-0 w-48 truncate">
                {ev.event_type}
              </span>
              <span className="text-xs text-slate-500 font-mono truncate flex-1">
                {ev.agent_id.slice(0, 12)}
              </span>
              <span className="text-xs text-slate-600 shrink-0">
                {formatDistanceToNow(new Date(ev.ts), { addSuffix: true })}
              </span>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
