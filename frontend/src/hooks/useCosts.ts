"use client";

import { useEffect } from "react";
import { api } from "@/lib/api";
import { logger } from "@/lib/logger";
import { useAgentStore } from "@/store/agentStore";

export function useCosts(groupBy: "agent" | "team" | "task" = "agent") {
  const setCosts = useAgentStore((s) => s.setCosts);
  const costs = useAgentStore((s) => s.costs);

  useEffect(() => {
    let active = true;

    async function fetchCosts() {
      try {
        const data = await api.getCosts(groupBy);
        if (active) {
          setCosts(data);
        }
      } catch (err) {
        logger.error("Failed to load cost data", err);
      }
    }

    fetchCosts();
    const interval = setInterval(fetchCosts, 30_000);

    return () => {
      active = false;
      clearInterval(interval);
    };
  }, [groupBy, setCosts]);

  return costs;
}
