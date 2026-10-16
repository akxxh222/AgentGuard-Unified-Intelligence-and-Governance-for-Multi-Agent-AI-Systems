"""
Token spike detector.
Raises an alert when a single event's token count exceeds the rolling
per-agent mean by a configurable multiplier (default: 3×).
"""
from collections import defaultdict, deque
from typing import Any


class TokenSpikeDetector:
    """
    Statistical spike detector using a sliding window (last N events).
    """

    def __init__(self, multiplier: float = 3.0, window: int = 20) -> None:
        self._multiplier = multiplier
        self._window = window
        # agent_id → deque of recent total_token counts
        self._histories: dict[str, deque[int]] = defaultdict(lambda: deque(maxlen=window))

    def check(self, event: dict[str, Any]) -> dict[str, Any] | None:
        tokens = event.get("tokens") or event.get("payload", {}).get("usage")
        if not tokens:
            return None

        total = tokens.get("total", tokens.get("total_tokens", 0))
        if not total:
            return None

        agent_id = event.get("agent_id", "unknown")
        history = self._histories[agent_id]

        alert = None
        if len(history) >= 5:
            mean = sum(history) / len(history)
            if mean > 0 and total > mean * self._multiplier:
                alert = {
                    "detector": "token_spike",
                    "agent_id": agent_id,
                    "severity": "high" if total > mean * self._multiplier * 1.5 else "medium",
                    "details": {
                        "current_tokens": total,
                        "baseline_mean": round(mean, 1),
                        "multiplier": round(total / mean, 2),
                        "threshold": self._multiplier,
                    },
                }

        history.append(total)
        return alert
