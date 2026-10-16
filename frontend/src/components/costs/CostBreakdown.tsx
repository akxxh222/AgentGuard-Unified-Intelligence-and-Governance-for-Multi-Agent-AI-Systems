import React from "react";
import { Coins, TrendingUp } from "lucide-react";
import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/card";
import type { CostAttribution } from "@/types";

interface CostBreakdownProps {
  costs?: CostAttribution[];
}

export function CostBreakdown({ costs = [] }: CostBreakdownProps) {
  const total = costs.reduce((sum, c) => sum + c.cost_usd, 0);

  return (
    <Card className="bg-zinc-900/70 border-zinc-800/80">
      <CardHeader className="p-4 pb-2 flex flex-row items-center justify-between">
        <CardTitle className="text-xs font-mono font-medium text-zinc-400 uppercase flex items-center gap-1.5">
          <Coins className="w-4 h-4 text-amber-400" />
          Cost Attribution
        </CardTitle>
        <span className="text-xs font-mono font-bold text-zinc-200 tabular-nums">
          Total: ${total.toFixed(4)}
        </span>
      </CardHeader>

      <CardContent className="p-4 pt-2 font-mono text-xs">
        {costs.length === 0 ? (
          <div className="py-6 text-center text-zinc-500 text-[11px]">
            No cost attribution data loaded
          </div>
        ) : (
          <div className="space-y-2">
            {costs.map((item) => (
              <div
                key={item.id}
                className="flex items-center justify-between p-2 rounded bg-zinc-950/40 border border-zinc-800/60"
              >
                <div>
                  <span className="text-zinc-200 font-semibold">{item.name}</span>
                  <span className="text-zinc-500 text-[10px] block">
                    {item.total_tokens.toLocaleString()} tokens
                  </span>
                </div>
                <div className="text-right">
                  <span className="text-emerald-400 font-semibold tabular-nums">
                    ${item.cost_usd.toFixed(4)}
                  </span>
                  <div className="flex items-center justify-end gap-1 text-[10px] text-zinc-500">
                    <TrendingUp className="w-2.5 h-2.5" />
                    <span>{((item.cost_usd / (total || 1)) * 100).toFixed(1)}%</span>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </CardContent>
    </Card>
  );
}
