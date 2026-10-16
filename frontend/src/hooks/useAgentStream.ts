"use client";

import { useEffect } from "react";
import { eventsWs, alertsWs } from "@/lib/ws";
import { useAgentStore } from "@/store/agentStore";
import type { AgentEvent, Alert, Escalation } from "@/types";

/**
 * useAgentStream — routes WebSocket messages through src/lib/ws.ts into the Zustand store.
 * Complies with the rule: Components never call WebSocket directly.
 */
export function useAgentStream() {
  const addEvent = useAgentStore((s) => s.addEvent);
  const addAlert = useAgentStore((s) => s.addAlert);
  const setEscalations = useAgentStore((s) => s.setEscalations);
  const escalations = useAgentStore((s) => s.escalations);
  const setIsConnected = useAgentStore((s) => s.setIsConnected);

  useEffect(() => {
    setIsConnected(true);

    const unsubEvents = eventsWs.subscribe((envelope) => {
      if (envelope.type === "event") {
        addEvent(envelope.data as AgentEvent);
      }
    });

    const unsubAlerts = alertsWs.subscribe((envelope) => {
      if (envelope.type === "alert") {
        addAlert(envelope.data as Alert);
      } else if (envelope.type === "escalation") {
        const esc = envelope.data as Escalation;
        setEscalations([esc, ...escalations]);
      }
    });

    return () => {
      unsubEvents();
      unsubAlerts();
      setIsConnected(false);
    };
  }, [addEvent, addAlert, setEscalations, escalations, setIsConnected]);
}
