"use client";

import React from "react";
import { useAgentStore } from "@/store/agentStore";
import AlertCard from "./AlertCard";
import { Badge } from "@/components/ui/badge";

export default function AlertFeed() {
  const alerts = useAgentStore((s) => s.alerts);

  return (
    <div className="flex flex-col gap-2 h-full font-mono">
      <div className="flex items-center justify-between mb-1">
        <h2 className="text-xs font-semibold text-zinc-400 uppercase tracking-wider">
          Anomaly Alerts
        </h2>
        {alerts.length > 0 && (
          <Badge variant="alert" className="text-[10px]">
            {alerts.length} ALERTS
          </Badge>
        )}
      </div>

      <div className="flex flex-col gap-2 overflow-y-auto max-h-72">
        {alerts.length === 0 ? (
          <p className="text-zinc-500 text-xs py-4 text-center">
            No active anomalies detected.
          </p>
        ) : (
          alerts.map((alert) => (
            <AlertCard key={alert.alert_id} alert={alert} />
          ))
        )}
      </div>
    </div>
  );
}
