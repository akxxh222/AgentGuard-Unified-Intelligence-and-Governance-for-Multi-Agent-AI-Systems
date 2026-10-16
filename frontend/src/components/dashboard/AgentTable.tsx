"use client";

import { useAgentStore } from "@/store/agentStore";
import StatusBadge from "./StatusBadge";
import { formatDistanceToNow } from "date-fns";

export default function AgentTable() {
  const agents = useAgentStore((s) => s.agents);

  return (
    <div>
      <h2 className="text-sm font-semibold text-slate-400 mb-3 uppercase tracking-wider">
        Agents
      </h2>
      {agents.length === 0 ? (
        <p className="text-slate-500 text-sm">No agents registered yet.</p>
      ) : (
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="text-left text-slate-500 border-b border-[#1e1e2e]">
                <th className="pb-2 pr-4 font-normal">Name</th>
                <th className="pb-2 pr-4 font-normal">Framework</th>
                <th className="pb-2 pr-4 font-normal">Status</th>
                <th className="pb-2 font-normal">Last Seen</th>
              </tr>
            </thead>
            <tbody>
              {agents.map((agent) => (
                <tr
                  key={agent.id}
                  className="border-b border-[#1e1e2e]/50 hover:bg-white/[0.02] transition-colors"
                >
                  <td className="py-2 pr-4 font-mono text-slate-200">{agent.name}</td>
                  <td className="py-2 pr-4">
                    <span className="text-xs px-2 py-0.5 rounded bg-indigo-500/10 text-indigo-400 font-mono">
                      {agent.framework}
                    </span>
                  </td>
                  <td className="py-2 pr-4">
                    <StatusBadge status={agent.status} />
                  </td>
                  <td className="py-2 text-slate-500 text-xs">
                    {formatDistanceToNow(new Date(agent.updated_at), { addSuffix: true })}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}
