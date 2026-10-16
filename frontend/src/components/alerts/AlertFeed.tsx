"use client";

import { useAgentStore } from "@/store/agentStore";
import AlertCard from "./AlertCard";

export default function AlertFeed() {
  const alerts = useAgentStore((s) => s.alerts);

  return (
    <div className="flex flex-col gap-2 h-full">
      <h2 className="text-sm font-semibold text-slate-400 uppercase tracking-wider">
        Anomaly Alerts
        {alerts.length > 0 && (
          <span className="ml-2 bg-red-500/10 text-red-400 text-xs px-2 py-0.5 rounded-full border border-red-500/20">
            {alerts.length}
          </span>
        )}
      </h2>
      <div className="flex flex-col gap-2 overflow-y-auto max-h-64">
        {alerts.length === 0 ? (
          <p className="text-slate-500 text-sm">No anomalies detected.</p>
        ) : (
          alerts.map((alert, i) => <AlertCard key={i} alert={alert} />)
        )}
      </div>
    </div>
  );
}
