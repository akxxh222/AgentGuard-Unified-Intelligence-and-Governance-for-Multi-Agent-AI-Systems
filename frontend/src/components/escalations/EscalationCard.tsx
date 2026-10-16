import React from "react";
import { CheckCircle2, XCircle } from "lucide-react";
import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import type { Escalation } from "@/types";

interface EscalationCardProps {
  escalation: Escalation;
  onApprove?: (id: string) => void;
  onReject?: (id: string) => void;
}

export function EscalationCard({
  escalation,
  onApprove,
  onReject,
}: EscalationCardProps) {
  return (
    <Card className="bg-zinc-900/80 border-status-escalating/40">
      <CardHeader className="p-4 pb-2 flex flex-row items-center justify-between">
        <div className="flex items-center gap-2">
          <Badge variant="escalating" className="font-mono text-[10px]">
            {escalation.status.toUpperCase()}
          </Badge>
          <CardTitle className="text-sm font-mono font-semibold text-zinc-100">
            {escalation.agent_id}
          </CardTitle>
        </div>
        <span className="text-[10px] font-mono text-zinc-500">
          {escalation.escalation_id}
        </span>
      </CardHeader>

      <CardContent className="p-4 pt-2 font-mono text-xs space-y-3">
        <p className="text-zinc-300 font-sans text-xs">{escalation.reason}</p>

        <div className="flex items-center justify-end gap-2 pt-1">
          <Button
            variant="outline"
            size="sm"
            className="h-7 text-xs border-rose-900/60 bg-rose-950/20 text-rose-300 hover:bg-rose-900/40"
            onClick={() => onReject?.(escalation.escalation_id)}
          >
            <XCircle className="w-3.5 h-3.5 mr-1" />
            Reject
          </Button>
          <Button
            size="sm"
            className="h-7 text-xs bg-emerald-600 hover:bg-emerald-500 text-white font-semibold"
            onClick={() => onApprove?.(escalation.escalation_id)}
          >
            <CheckCircle2 className="w-3.5 h-3.5 mr-1" />
            Approve
          </Button>
        </div>
      </CardContent>
    </Card>
  );
}
