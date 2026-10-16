"use client";

import { useEffect, useState, useCallback, useRef } from "react";
import { api } from "@/lib/api";
import { env } from "@/lib/env";
import { logger } from "@/lib/logger";
import { useAgentStore } from "@/store/agentStore";
import { mockEvents, mockAlerts } from "@/mocks/mockData";
import type {
  AgentEvent,
  Alert,
  Framework,
  EventType,
  DetectorType,
  AlertAction,
} from "@/types";

export interface CollectorState {
  health: "healthy" | "unhealthy" | "connecting";
  events: AgentEvent[];
  alerts: Alert[];
  isLoading: boolean;
  error: string | null;
  lastPolled: string | null;
  refetch: () => void;
}

function normalizeEvent(raw: Record<string, unknown>): AgentEvent {
  const event_id = String(
    raw.event_id || raw.id || `evt-${Math.random().toString(36).substring(2, 9)}`
  );
  const agent_id = String(raw.agent_id || "unknown-agent");
  const framework = ((raw.framework as string)?.toLowerCase() as Framework) || "langchain";
  const parent_agent_id = raw.parent_agent_id ? String(raw.parent_agent_id) : null;
  const task_id = String(raw.task_id || "default_task");
  const team_id = String(raw.team_id || "general");
  const status = (raw.status as AgentEvent["status"]) || "running";
  const event_type = (raw.event_type as EventType) || "tool_call";

  const rawTokens = raw.tokens as Record<string, number> | undefined;
  const tokens_in =
    typeof raw.tokens_in === "number"
      ? raw.tokens_in
      : typeof rawTokens?.prompt === "number"
        ? rawTokens.prompt
        : 0;
  const tokens_out =
    typeof raw.tokens_out === "number"
      ? raw.tokens_out
      : typeof rawTokens?.completion === "number"
        ? rawTokens.completion
        : 0;

  const cost_usd =
    typeof raw.cost_usd === "number"
      ? raw.cost_usd
      : typeof raw.cost === "number"
        ? raw.cost
        : 0.0;

  const timestamp = String(
    raw.timestamp || raw.ts || raw.created_at || new Date().toISOString()
  );
  const trace_id = String(raw.trace_id || raw.task_id || "trace-0");
  const payload =
    typeof raw.payload === "object" && raw.payload !== null
      ? (raw.payload as Record<string, unknown>)
      : {};

  return {
    event_id,
    agent_id,
    framework,
    parent_agent_id,
    task_id,
    team_id,
    status,
    event_type,
    tokens_in,
    tokens_out,
    cost_usd,
    timestamp,
    trace_id,
    payload,
  };
}

function normalizeAlert(raw: Record<string, unknown>): Alert {
  const alert_id = String(
    raw.alert_id || raw.id || `alt-${Math.random().toString(36).substring(2, 9)}`
  );
  const agent_id = String(raw.agent_id || "unknown-agent");
  const trace_id = String(raw.trace_id || "");
  const task_id = String(raw.task_id || "");
  const team_id = String(raw.team_id || "general");

  const rawDetector = String(raw.detector || raw.type || raw.rule || "loop").toLowerCase();
  let detector: DetectorType = "loop";
  if (rawDetector.includes("spike") || rawDetector.includes("token")) {
    detector = "token_spike";
  } else if (rawDetector.includes("cost") || rawDetector.includes("budget")) {
    detector = "cost_runaway";
  } else if (rawDetector.includes("silent")) {
    detector = "silent_failure";
  } else if (rawDetector.includes("semantic")) {
    detector = "semantic";
  }

  const severity =
    raw.severity === "critical" || raw.severity === "high"
      ? "critical"
      : "warning";

  const action = (raw.action as AlertAction) || "ALERT";
  const message = String(
    raw.message || raw.reason || raw.details || "Anomaly detected in agent execution"
  );
  const rca = raw.rca
    ? String(raw.rca)
    : raw.reason
      ? String(raw.reason)
      : null;
  const created_at = String(
    raw.created_at || raw.timestamp || raw.ts || new Date().toISOString()
  );
  const resolved = Boolean(raw.resolved);

  return {
    alert_id,
    agent_id,
    trace_id,
    task_id,
    team_id,
    detector,
    severity,
    action,
    message,
    rca,
    created_at,
    resolved,
  };
}

export function useCollectorPolling(intervalMs: number = 2000): CollectorState {
  const [health, setHealth] = useState<"healthy" | "unhealthy" | "connecting">("connecting");
  const [events, setEvents] = useState<AgentEvent[]>([]);
  const [alerts, setAlerts] = useState<Alert[]>([]);
  const [isLoading, setIsLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);
  const [lastPolled, setLastPolled] = useState<string | null>(null);

  const batchAddEvents = useAgentStore((s) => s.batchAddEvents);
  const isMountedRef = useRef(true);

  const poll = useCallback(async () => {
    try {
      // 1. Poll /health
      const healthRes = await api.getHealth().catch(() => null);
      const isHealthy =
        healthRes?.status === "ok" || healthRes?.status === "healthy";

      // 2. Poll /events & /alerts
      let rawEvents: unknown[] = [];
      let rawAlerts: unknown[] = [];

      try {
        rawEvents = (await api.getEvents()) as unknown[];
        rawAlerts = (await api.getAlerts()) as unknown[];
      } catch (err) {
        if (env.NEXT_PUBLIC_USE_MOCK) {
          logger.info("Using mock collector data while backend is starting...");
          rawEvents = mockEvents;
          rawAlerts = mockAlerts;
        } else {
          throw err;
        }
      }

      const fetchedEvents: AgentEvent[] = Array.isArray(rawEvents)
        ? rawEvents.map((e) => normalizeEvent(e as Record<string, unknown>))
        : [];

      const fetchedAlerts: Alert[] = Array.isArray(rawAlerts)
        ? rawAlerts.map((a) => normalizeAlert(a as Record<string, unknown>))
        : [];

      if (isMountedRef.current) {
        setHealth(isHealthy ? "healthy" : "unhealthy");
        setEvents(fetchedEvents);
        setAlerts(fetchedAlerts);
        setError(null);
        setIsLoading(false);
        setLastPolled(new Date().toLocaleTimeString());

        // Sync with Zustand store
        if (fetchedEvents.length > 0) {
          batchAddEvents(fetchedEvents);
        }
      }
    } catch (err) {
      if (isMountedRef.current) {
        setHealth("unhealthy");
        const msg =
          err instanceof Error ? err.message : "Failed to connect to collector API";
        setError(msg);
        setIsLoading(false);
        setLastPolled(new Date().toLocaleTimeString());

        if (env.NEXT_PUBLIC_USE_MOCK) {
          setEvents(mockEvents);
          setAlerts(mockAlerts);
        }
      }
    }
  }, [batchAddEvents]);

  useEffect(() => {
    isMountedRef.current = true;
    poll();

    const timer = setInterval(() => {
      poll();
    }, intervalMs);

    return () => {
      isMountedRef.current = false;
      clearInterval(timer);
    };
  }, [poll, intervalMs]);

  return {
    health,
    events,
    alerts,
    isLoading,
    error,
    lastPolled,
    refetch: poll,
  };
}
