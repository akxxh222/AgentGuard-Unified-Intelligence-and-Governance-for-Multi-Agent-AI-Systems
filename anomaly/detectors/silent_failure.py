"""
Silent failure detector.
Raises an alert when an agent starts a task but does not emit a
completion event within the configured timeout window.
"""
import time
from typing import Any


class SilentFailureDetector:
    """
    Tracks pending agent starts and raises alerts when no corresponding
    end event arrives within `timeout_seconds`.
    """

    def __init__(self, timeout_seconds: int = 30) -> None:
        self._timeout = timeout_seconds
        # key = (agent_id, task_id) → start_epoch
        self._pending: dict[tuple[str, str], float] = {}

    def check(self, event: dict[str, Any]) -> dict[str, Any] | None:
        agent_id = event.get("agent_id", "unknown")
        task_id = event.get("task_id") or "default"
        event_type = event.get("event_type", "")
        key = (agent_id, task_id)

        # Register start events
        if event_type in ("chain.start", "task.start", "agent.generate_reply.start", "crew.start"):
            self._pending[key] = time.monotonic()
            return None

        # Clear on completion events
        if event_type in (
            "chain.end", "task.end", "agent.generate_reply.end",
            "crew.end", "llm.end", "agent.finish",
        ):
            self._pending.pop(key, None)
            return None

        # On every other event, scan for timed-out sessions
        now = time.monotonic()
        for (aid, tid), start in list(self._pending.items()):
            if now - start > self._timeout:
                del self._pending[(aid, tid)]
                return {
                    "detector": "silent_failure",
                    "agent_id": aid,
                    "severity": "high",
                    "details": {
                        "task_id": tid,
                        "elapsed_seconds": round(now - start, 1),
                        "timeout_seconds": self._timeout,
                    },
                }
        return None
