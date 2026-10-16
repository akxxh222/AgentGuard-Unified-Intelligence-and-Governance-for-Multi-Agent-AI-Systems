"use client";

import AgentGraph from "@/components/dag/AgentGraph";
import AgentTable from "@/components/dashboard/AgentTable";
import CostPanel from "@/components/dashboard/CostPanel";
import AlertFeed from "@/components/alerts/AlertFeed";
import EscalationQueue from "@/components/escalation/EscalationQueue";
import { useAgentStream } from "@/hooks/useAgentStream";

export default function DashboardPage() {
  useAgentStream(); // Connect WebSocket and populate Zustand store

  return (
    <main className="min-h-screen bg-[#0a0a0f] text-slate-100 p-4">
      {/* Header */}
      <header className="flex items-center justify-between mb-6">
        <div className="flex items-center gap-3">
          <div className="w-8 h-8 rounded-lg bg-indigo-500 flex items-center justify-center text-white font-bold text-sm">
            ACT
          </div>
          <h1 className="text-xl font-semibold tracking-tight">Agent Control Tower</h1>
        </div>
        <span className="text-xs text-green-400 bg-green-400/10 px-3 py-1 rounded-full border border-green-400/20">
          ● Live
        </span>
      </header>

      {/* Main grid */}
      <div className="grid grid-cols-12 gap-4">
        {/* DAG — full width */}
        <section className="col-span-12 lg:col-span-8 h-96 rounded-xl border border-[#1e1e2e] bg-[#111118] overflow-hidden">
          <AgentGraph />
        </section>

        {/* Cost panel */}
        <section className="col-span-12 lg:col-span-4 rounded-xl border border-[#1e1e2e] bg-[#111118] p-4">
          <CostPanel />
        </section>

        {/* Agent table */}
        <section className="col-span-12 lg:col-span-8 rounded-xl border border-[#1e1e2e] bg-[#111118] p-4">
          <AgentTable />
        </section>

        {/* Alert feed */}
        <section className="col-span-12 lg:col-span-4 rounded-xl border border-[#1e1e2e] bg-[#111118] p-4">
          <AlertFeed />
        </section>

        {/* Escalation queue — full width */}
        <section className="col-span-12 rounded-xl border border-[#1e1e2e] bg-[#111118] p-4">
          <EscalationQueue />
        </section>
      </div>
    </main>
  );
}
