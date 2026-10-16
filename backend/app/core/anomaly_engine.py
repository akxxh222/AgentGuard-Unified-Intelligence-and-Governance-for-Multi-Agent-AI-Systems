"""Small, deterministic anomaly engine used by the collector."""
from dataclasses import dataclass
from typing import Any

from app.models.event import Event


@dataclass
class _LoopState:
    tool: str
    count: int = 0
    alerted: bool = False


class AnomalyEngine:
    """Detect consecutive repeated tool calls within one agent trace."""

    def __init__(self, loop_threshold: int = 5) -> None:
        self.loop_threshold = loop_threshold
        self._loops: dict[tuple[str, str], _LoopState] = {}

    def evaluate(self, event: Event) -> list[dict[str, Any]]:
        key = (event.agent_id, event.trace_id or event.task_id or "default")
        if event.event_type.value != "tool_call":
            if event.event_type.value in {"finish", "error"}:
                self._loops.pop(key, None)
            return []

        tool = str(event.payload.get("tool") or event.payload.get("action") or "unknown_tool")
        state = self._loops.get(key)
        if state is None or state.tool != tool:
            state = self._loops[key] = _LoopState(tool=tool)
        state.count += 1
        if state.count == self.loop_threshold and not state.alerted:
            state.alerted = True
            return [{
                "detector": "loop_detector",
                "agent_id": event.agent_id,
                "severity": "critical",
                "details": {
                    "tool": tool,
                    "iterations": state.count,
                    "max_allowed": self.loop_threshold,
                },
            }]
        return []
