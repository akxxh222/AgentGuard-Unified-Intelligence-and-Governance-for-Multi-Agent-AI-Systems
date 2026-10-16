"""
Log normalizer — converts framework-specific telemetry payloads
into the unified Agent Control Tower event schema.
"""
from datetime import datetime, timezone
from typing import Any


class LogNormalizer:
    """
    Translates raw adapter payloads (LangChain, AutoGen, CrewAI, OTEL)
    into a unified dictionary schema.

    Unified schema fields:
      - event_type: str
      - agent_id: str
      - task_id: str | None
      - framework: str
      - ts: ISO8601 string
      - payload: dict (original data)
      - tokens: { prompt, completion, total } | None
      - cost_usd: float | None
    """

    FRAMEWORK_KEYS = {
        "langchain": {"agent_id": "run_id", "event_type": "event"},
        "autogen": {"agent_id": "sender", "event_type": "type"},
        "crewai": {"agent_id": "agent_role", "event_type": "event_type"},
        "otel": {"agent_id": "resource.agent.id", "event_type": "name"},
    }

    def normalize(self, raw: dict[str, Any]) -> dict[str, Any]:
        framework = raw.get("framework", "unknown")
        mapping = self.FRAMEWORK_KEYS.get(framework, {})

        agent_id = raw.get(mapping.get("agent_id", "agent_id"), raw.get("agent_id", ""))
        event_type = raw.get(mapping.get("event_type", "event_type"), "unknown")
        ts = raw.get("ts", datetime.now(timezone.utc).isoformat())

        # Token extraction — best-effort across frameworks
        usage = raw.get("usage", raw.get("token_usage", {}))
        tokens = None
        if usage:
            tokens = {
                "prompt": usage.get("prompt_tokens", usage.get("input_tokens", 0)),
                "completion": usage.get("completion_tokens", usage.get("output_tokens", 0)),
                "total": usage.get("total_tokens", 0),
            }
            if not tokens["total"] and tokens["prompt"] is not None:
                tokens["total"] = tokens["prompt"] + tokens["completion"]

        return {
            "event_type": event_type,
            "agent_id": str(agent_id),
            "task_id": raw.get("task_id"),
            "framework": framework,
            "ts": ts,
            "payload": raw,
            "tokens": tokens,
            "cost_usd": raw.get("cost_usd"),
        }
