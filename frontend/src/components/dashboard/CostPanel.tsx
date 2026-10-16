"use client";

import { useCosts } from "@/hooks/useCosts";
import { BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer } from "recharts";

export default function CostPanel() {
  const costs = useCosts();

  if (!costs) {
    return (
      <div className="flex items-center justify-center h-full text-slate-500 text-sm">
        Loading costs…
      </div>
    );
  }

  return (
    <div className="flex flex-col gap-4">
      <h2 className="text-sm font-semibold text-slate-400 uppercase tracking-wider">
        Cost Overview
      </h2>

      <div className="grid grid-cols-2 gap-3">
        <div className="bg-[#0a0a0f] rounded-lg p-3 border border-[#1e1e2e]">
          <p className="text-xs text-slate-500 mb-1">Total Tokens</p>
          <p className="text-xl font-semibold text-slate-100">
            {costs.total_tokens.toLocaleString()}
          </p>
        </div>
        <div className="bg-[#0a0a0f] rounded-lg p-3 border border-[#1e1e2e]">
          <p className="text-xs text-slate-500 mb-1">Total Cost</p>
          <p className="text-xl font-semibold text-emerald-400">
            ${costs.total_cost_usd.toFixed(4)}
          </p>
        </div>
      </div>

      <div className="h-40">
        <ResponsiveContainer width="100%" height="100%">
          <BarChart data={costs.by_agent.slice(0, 8)}>
            <XAxis
              dataKey="agent_id"
              tick={{ fontSize: 10, fill: "#94a3b8" }}
              tickFormatter={(v) => v.slice(0, 8)}
            />
            <YAxis tick={{ fontSize: 10, fill: "#94a3b8" }} />
            <Tooltip
              contentStyle={{ background: "#111118", border: "1px solid #1e1e2e", borderRadius: 8 }}
              labelStyle={{ color: "#e2e8f0" }}
            />
            <Bar dataKey="cost_usd" fill="#6366f1" radius={[4, 4, 0, 0]} />
          </BarChart>
        </ResponsiveContainer>
      </div>
    </div>
  );
}
