"use client";

import React from "react";
import { useCosts } from "@/hooks/useCosts";
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  Tooltip,
  ResponsiveContainer,
} from "recharts";

export default function CostPanel() {
  const costs = useCosts("agent");

  const totalTokens = costs.reduce((s, c) => s + c.total_tokens, 0);
  const totalCost = costs.reduce((s, c) => s + c.cost_usd, 0);

  return (
    <div className="flex flex-col gap-4 font-mono">
      <div className="flex items-center justify-between">
        <h2 className="text-xs font-semibold text-zinc-400 uppercase tracking-wider">
          Cost Attribution
        </h2>
        <span className="text-[10px] text-zinc-500">REAL-TIME</span>
      </div>

      <div className="grid grid-cols-2 gap-3">
        <div className="bg-zinc-950/60 rounded-lg p-3 border border-zinc-800">
          <p className="text-[10px] text-zinc-500 uppercase mb-1">Total Tokens</p>
          <p className="text-lg font-bold text-zinc-100 tabular-nums">
            {totalTokens.toLocaleString()}
          </p>
        </div>
        <div className="bg-zinc-950/60 rounded-lg p-3 border border-zinc-800">
          <p className="text-[10px] text-zinc-500 uppercase mb-1">Total Cost</p>
          <p className="text-lg font-bold text-emerald-400 tabular-nums">
            ${totalCost.toFixed(4)}
          </p>
        </div>
      </div>

      <div className="h-44 w-full">
        {costs.length === 0 ? (
          <div className="h-full flex items-center justify-center text-zinc-500 text-xs">
            No attribution vectors recorded.
          </div>
        ) : (
          <ResponsiveContainer width="100%" height="100%">
            <BarChart data={costs.slice(0, 8)}>
              <XAxis
                dataKey="name"
                tick={{ fontSize: 10, fill: "#71717a" }}
                tickFormatter={(v: string) => v.slice(0, 10)}
              />
              <YAxis tick={{ fontSize: 10, fill: "#71717a" }} />
              <Tooltip
                contentStyle={{
                  background: "#18181b",
                  border: "1px solid #27272a",
                  borderRadius: 6,
                  fontSize: 12,
                }}
                labelStyle={{ color: "#f4f4f5" }}
              />
              <Bar dataKey="cost_usd" fill="#10b981" radius={[4, 4, 0, 0]} />
            </BarChart>
          </ResponsiveContainer>
        )}
      </div>
    </div>
  );
}
