"use client";

import React from "react";
import { useAgentStore } from "@/store/agentStore";
import { formatDistanceToNow } from "date-fns";

export default function ReplayTimeline() {
  const events = useAgentStore((s) => s.events);

  return (
    <div className="flex flex-col gap-0.5 h-full overflow-y-auto">
      <h2 className="text-xs font-mono font-semibold text-zinc-400 uppercase tracking-wider mb-2 sticky top-0 bg-zinc-900/90 py-1">
        Event Timeline
      </h2>
      {events.length === 0 ? (
        <p className="text-zinc-500 text-xs">No events yet.</p>
      ) : (
        <div className="flex flex-col gap-1">
          {events.map((ev, i) => (
            <div
              key={ev.event_id || i}
              className="flex items-center gap-3 px-2 py-1.5 rounded hover:bg-zinc-800/40 group font-mono text-xs"
            >
              <div className="w-1.5 h-1.5 rounded-full bg-emerald-400 shrink-0" />
              <span className="text-xs text-emerald-400 shrink-0 w-36 truncate font-semibold">
                {ev.event_type}
              </span>
              <span className="text-xs text-zinc-400 truncate flex-1">
                {ev.agent_id}
              </span>
              <span className="text-xs text-zinc-500 shrink-0 tabular-nums">
                {ev.timestamp
                  ? formatDistanceToNow(new Date(ev.timestamp), { addSuffix: true })
                  : "recently"}
              </span>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
