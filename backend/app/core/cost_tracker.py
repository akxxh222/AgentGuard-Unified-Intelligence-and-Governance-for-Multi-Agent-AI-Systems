"""
Cost tracker — persists per-event token usage + cost to Supabase.
Uses model-specific pricing tables.
"""
from typing import Any

import structlog
from supabase import create_client

from app.config import settings

log = structlog.get_logger()

# USD per 1K tokens (prompt / completion)
MODEL_PRICING: dict[str, tuple[float, float]] = {
    "gpt-4o": (0.005, 0.015),
    "gpt-4o-mini": (0.00015, 0.0006),
    "gpt-4-turbo": (0.01, 0.03),
    "gpt-3.5-turbo": (0.0005, 0.0015),
    "claude-3-5-sonnet": (0.003, 0.015),
    "claude-3-haiku": (0.00025, 0.00125),
    "gemini-1.5-pro": (0.00125, 0.005),
    "default": (0.001, 0.002),
}


def _estimate_cost(model: str, prompt_tokens: int, completion_tokens: int) -> float:
    price_in, price_out = MODEL_PRICING.get(model, MODEL_PRICING["default"])
    return round(
        (prompt_tokens / 1000) * price_in + (completion_tokens / 1000) * price_out, 6
    )


class CostTracker:
    def __init__(self) -> None:
        self._sb = create_client(settings.SUPABASE_URL, settings.SUPABASE_SERVICE_ROLE_KEY)

    def record(self, event: dict[str, Any]) -> None:
        tokens = event.get("tokens")
        if not tokens:
            return

        model = event.get("payload", {}).get("model", "default")
        prompt_t = tokens.get("prompt", 0)
        completion_t = tokens.get("completion", 0)
        total_t = tokens.get("total", prompt_t + completion_t)
        cost = _estimate_cost(model, prompt_t, completion_t)

        try:
            self._sb.table("costs").insert(
                {
                    "agent_id": event.get("agent_id"),
                    "task_id": event.get("task_id"),
                    "model": model,
                    "prompt_tokens": prompt_t,
                    "completion_tokens": completion_t,
                    "total_tokens": total_t,
                    "cost_usd": cost,
                }
            ).execute()

            # Alert if cumulative cost exceeds threshold
            if cost >= settings.COST_ALERT_THRESHOLD_USD:
                log.warning(
                    "cost_tracker.threshold_exceeded",
                    agent_id=event.get("agent_id"),
                    cost=cost,
                )
        except Exception as exc:
            log.error("cost_tracker.record_error", error=str(exc))
