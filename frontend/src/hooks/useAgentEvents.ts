"use client";

import { useEffect } from "react";
import { eventsWs, alertsWs } from "@/lib/ws";
import { useAgentStore } from "@/store/agentStore";
import type { AgentEvent, Alert, Escalation } from "@/types";

export function useAgentEvents() {
  const addEvent = useAgentStore((s) => s.addEvent);
  const addAlert = useAgentStore((s) => s.addAlert);
  const setEscalations = useAgentStore((s) => s.setEscalations);
  const escalations = useAgentStore((s) => s.escalations);
  const setIsConnected = useAgentStore((s) => s.setIsConnected);

  useEffect(() => {
    setIsConnected(true);

    const unsubscribeEvents = eventsWs.subscribe((envelope) => {
      if (envelope.type === "event") {
        addEvent(envelope.data as AgentEvent);
      }
    });

    const unsubscribeAlerts = alertsWs.subscribe((envelope) => {
      if (envelope.type === "alert") {
        addAlert(envelope.data as Alert);
      } else if (envelope.type === "escalation") {
        const esc = envelope.data as Escalation;
        setEscalations([esc, ...escalations]);
      }
    });

    return () => {
      unsubscribeEvents();
      unsubscribeAlerts();
      setIsConnected(false);
    };
  }, [addEvent, addAlert, setEscalations, escalations, setIsConnected]);
}

export const useAgentStream = useAgentEvents;
