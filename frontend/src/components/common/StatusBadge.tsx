import React from "react";
import { Badge } from "@/components/ui/badge";
import {
  Activity,
  AlertTriangle,
  ShieldBan,
  HelpCircle,
  XCircle,
  CheckCircle2,
  MinusCircle,
} from "lucide-react";
import type { AgentStatus } from "@/types";

interface StatusBadgeProps {
  status: AgentStatus;
  className?: string;
  showIcon?: boolean;
}

const statusConfig: Record<
  AgentStatus,
  {
    label: string;
    variant: "running" | "alert" | "quarantined" | "escalating" | "failed" | "success" | "idle";
    icon: React.ComponentType<{ className?: string }>;
  }
> = {
  running: {
    label: "Running",
    variant: "running",
    icon: Activity,
  },
  alert: {
    label: "Alert",
    variant: "alert",
    icon: AlertTriangle,
  },
  quarantined: {
    label: "Quarantined",
    variant: "quarantined",
    icon: ShieldBan,
  },
  escalating: {
    label: "Escalating",
    variant: "escalating",
    icon: HelpCircle,
  },
  failed: {
    label: "Failed",
    variant: "failed",
    icon: XCircle,
  },
  success: {
    label: "Success",
    variant: "success",
    icon: CheckCircle2,
  },
  paused: {
    label: "Paused",
    variant: "escalating",
    icon: HelpCircle,
  },
  idle: {
    label: "Idle",
    variant: "idle",
    icon: MinusCircle,
  },
};

export function StatusBadge({
  status,
  className,
  showIcon = true,
}: StatusBadgeProps) {
  const config = statusConfig[status] || statusConfig.idle;
  const Icon = config.icon;

  return (
    <Badge
      variant={config.variant}
      className={`font-mono text-[10px] uppercase inline-flex items-center gap-1.5 px-2 py-0.5 ${className ?? ""}`}
    >
      {showIcon && (
        <Icon
          className={`w-3 h-3 ${status === "running" ? "animate-pulse" : ""}`}
        />
      )}
      <span>{config.label}</span>
    </Badge>
  );
}
