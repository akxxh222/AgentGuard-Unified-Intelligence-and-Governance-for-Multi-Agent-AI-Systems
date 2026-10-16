/**
 * useAgentStream — connects to the backend WebSocket and hydrates
 * the Zustand store with live events.
 */
"use client";

import { useEffect, useRef } from "react";
import { useAgentStore } from "@/store/agentStore";
import type { WsMessage } from "@/lib/types";

const WS_URL = process.env.NEXT_PUBLIC_WS_URL ?? "ws://localhost:8000/ws";
const RECONNECT_DELAY_MS = 3000;

export function useAgentStream() {
  const wsRef = useRef<WebSocket | null>(null);
  const { upsertAgent, addTask, updateTask, addEvent, addAlert, setCosts, setConnected } =
    useAgentStore();

  useEffect(() => {
    let cancelled = false;

    function connect() {
      if (cancelled) return;
      const ws = new WebSocket(WS_URL);
      wsRef.current = ws;

      ws.onopen = () => {
        setConnected(true);
      };

      ws.onmessage = (ev) => {
        try {
          const msg: WsMessage = JSON.parse(ev.data);
          switch (msg.type) {
            case "agent.status":
              upsertAgent(msg.data);
              break;
            case "task.created":
              addTask(msg.data);
              break;
            case "task.completed":
              updateTask(msg.data);
              break;
            case "event.raw":
              addEvent(msg.data);
              break;
            case "anomaly.detected":
              addAlert(msg.data);
              break;
            case "cost.update":
              setCosts(msg.data);
              break;
          }
        } catch {
          // Malformed message — ignore
        }
      };

      ws.onerror = () => setConnected(false);
      ws.onclose = () => {
        setConnected(false);
        if (!cancelled) {
          setTimeout(connect, RECONNECT_DELAY_MS);
        }
      };
    }

    connect();

    return () => {
      cancelled = true;
      wsRef.current?.close();
    };
  }, [addAlert, addEvent, addTask, setCosts, setConnected, upsertAgent, updateTask]);
}
