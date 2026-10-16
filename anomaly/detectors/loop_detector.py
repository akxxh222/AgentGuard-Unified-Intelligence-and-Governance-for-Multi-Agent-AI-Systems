"""
Infinite loop detector.
Detects when an agent repeatedly invokes the same tool or action
beyond a configurable iteration limit.
"""
from collections import defaultdict
from typing import Any


class LoopDetector:
    """
    Tracks per-agent tool call repetitions in a sliding session.
    Session resets when a 'chain.end' or 'task.end' event is seen.
    """

    def __init__(self, max_iterations: int = 10) -> None:
        self._max = max_iterations
        # agent_id → { tool_name → count }
        self._counters: dict[str, dict[str, int]] = defaultdict(dict)

    def check(self, event: dict[str, Any]) -> dict[str, Any] | None:
        agent_id = event.get("agent_id", "unknown")
        event_type = event.get("event_type", "")

        # Reset on session end
        if event_type in ("chain.end", "task.end", "agent.finish", "crew.end"):
            self._counters[agent_id] = {}
            return None

        # Track tool invocations
        if "tool" not in event_type and "action" not in event_type:
            return None

        tool = (
            event.get("payload", {}).get("tool")
            or event.get("payload", {}).get("action")
            or "unknown_tool"
        )

        counts = self._counters[agent_id]
        counts[tool] = counts.get(tool, 0) + 1

        if counts[tool] == self._max:
            return {
                "detector": "loop_detector",
                "agent_id": agent_id,
                "severity": "critical",
                "details": {
                    "tool": tool,
                    "iterations": counts[tool],
                    "max_allowed": self._max,
                },
            }
        return None
