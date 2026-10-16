import React from "react";
import { ShieldAlert, AlertTriangle, AlertCircle, CheckCircle } from "lucide-react";
import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import type { Alert } from "@/types";

interface AlertListProps {
  alerts?: Alert[];
}

export function AlertList({ alerts = [] }: AlertListProps) {
  return (
    <Card className="bg-zinc-900/70 border-zinc-800/80">
      <CardHeader className="p-4 pb-2 flex flex-row items-center justify-between">
        <CardTitle className="text-xs font-mono font-medium text-zinc-400 uppercase flex items-center gap-1.5">
          <ShieldAlert className="w-4 h-4 text-amber-400" />
          Anomaly Alerts Feed
        </CardTitle>
        <Badge variant="alert" className="text-[10px] font-mono">
          {alerts.length} ALERTS
        </Badge>
      </CardHeader>

      <CardContent className="p-4 pt-2 font-mono text-xs">
        {alerts.length === 0 ? (
          <div className="py-6 text-center text-zinc-500 text-[11px] flex flex-col items-center justify-center">
            <CheckCircle className="w-5 h-5 text-emerald-500/80 mb-1" />
            <span>All systems nominal. No active anomalies.</span>
          </div>
        ) : (
          <div className="space-y-2">
            {alerts.map((alert) => (
              <div
                key={alert.alert_id}
                className="p-2.5 rounded bg-zinc-950/40 border border-zinc-800/60 flex items-start gap-2.5"
              >
                {alert.severity === "critical" ? (
                  <AlertCircle className="w-4 h-4 text-status-quarantined shrink-0 mt-0.5" />
                ) : (
                  <AlertTriangle className="w-4 h-4 text-status-alert shrink-0 mt-0.5" />
                )}
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2">
                    <span className="text-zinc-200 font-semibold">{alert.detector}</span>
                    <Badge
                      variant={alert.severity === "critical" ? "quarantined" : "alert"}
                      className="text-[9px] px-1 py-0"
                    >
                      {alert.action}
                    </Badge>
                    <span className="text-[10px] text-zinc-500">{alert.agent_id}</span>
                  </div>
                  <p className="text-[11px] text-zinc-400 font-sans mt-0.5 line-clamp-2">
                    {alert.message}
                  </p>
                </div>
              </div>
            ))}
          </div>
        )}
      </CardContent>
    </Card>
  );
}
