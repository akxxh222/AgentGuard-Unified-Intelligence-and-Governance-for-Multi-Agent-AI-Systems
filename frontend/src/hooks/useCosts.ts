/**
 * useCosts — fetches and subscribes to cost data.
 */
"use client";

import { useEffect } from "react";
import { api } from "@/lib/api";
import { useAgentStore } from "@/store/agentStore";

export function useCosts() {
  const { setCosts, costs } = useAgentStore();

  useEffect(() => {
    api.costs.summary().then(setCosts).catch(console.error);
    const interval = setInterval(() => {
      api.costs.summary().then(setCosts).catch(console.error);
    }, 30_000);
    return () => clearInterval(interval);
  }, [setCosts]);

  return costs;
}
