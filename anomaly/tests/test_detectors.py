"""
Anomaly detector test suite.
"""
import pytest

from anomaly.detectors.loop_detector import LoopDetector
from anomaly.detectors.silent_failure import SilentFailureDetector
from anomaly.detectors.token_spike import TokenSpikeDetector


# ── TokenSpikeDetector ────────────────────────────────────────────────────────

class TestTokenSpikeDetector:
    def test_no_alert_below_threshold(self):
        det = TokenSpikeDetector(multiplier=3.0)
        event = lambda t: {"agent_id": "a1", "tokens": {"total": t}}
        for _ in range(10):
            assert det.check(event(1000)) is None
        assert det.check(event(2000)) is None  # 2× is fine

    def test_alert_above_threshold(self):
        det = TokenSpikeDetector(multiplier=3.0, window=20)
        event = lambda t: {"agent_id": "a1", "tokens": {"total": t}}
        for _ in range(10):
            det.check(event(1000))
        alert = det.check(event(5000))  # 5× spike
        assert alert is not None
        assert alert["detector"] == "token_spike"
        assert alert["severity"] in ("medium", "high")

    def test_no_alert_without_tokens(self):
        det = TokenSpikeDetector()
        assert det.check({"agent_id": "a1", "event_type": "chain.start"}) is None

    def test_separate_histories_per_agent(self):
        det = TokenSpikeDetector(multiplier=2.0)
        for _ in range(10):
            det.check({"agent_id": "a1", "tokens": {"total": 100}})
            det.check({"agent_id": "a2", "tokens": {"total": 1000}})
        # a1 should alert, a2 should not (its own baseline is high)
        alert_a1 = det.check({"agent_id": "a1", "tokens": {"total": 5000}})
        assert alert_a1 is not None


# ── LoopDetector ──────────────────────────────────────────────────────────────

class TestLoopDetector:
    def test_no_alert_below_max(self):
        det = LoopDetector(max_iterations=5)
        for _ in range(4):
            r = det.check({"agent_id": "a1", "event_type": "tool.start", "payload": {"tool": "search"}})
            assert r is None

    def test_alert_at_max(self):
        det = LoopDetector(max_iterations=5)
        for _ in range(4):
            det.check({"agent_id": "a1", "event_type": "tool.start", "payload": {"tool": "search"}})
        alert = det.check({"agent_id": "a1", "event_type": "tool.start", "payload": {"tool": "search"}})
        assert alert is not None
        assert alert["detector"] == "loop_detector"
        assert alert["severity"] == "critical"
        assert alert["details"]["tool"] == "search"

    def test_reset_on_chain_end(self):
        det = LoopDetector(max_iterations=3)
        for _ in range(3):
            det.check({"agent_id": "a1", "event_type": "tool.start", "payload": {"tool": "search"}})
        det.check({"agent_id": "a1", "event_type": "chain.end"})
        # After reset, should not alert
        assert det.check({"agent_id": "a1", "event_type": "tool.start", "payload": {"tool": "search"}}) is None


# ── SilentFailureDetector ─────────────────────────────────────────────────────

class TestSilentFailureDetector:
    def test_no_alert_when_completed(self):
        det = SilentFailureDetector(timeout_seconds=60)
        det.check({"agent_id": "a1", "task_id": "t1", "event_type": "chain.start"})
        result = det.check({"agent_id": "a1", "task_id": "t1", "event_type": "chain.end"})
        assert result is None

    def test_alert_when_timed_out(self):
        import time
        det = SilentFailureDetector(timeout_seconds=0)  # Immediate timeout
        det.check({"agent_id": "a1", "task_id": "t1", "event_type": "chain.start"})
        time.sleep(0.01)
        # Trigger scan
        alert = det.check({"agent_id": "a1", "task_id": "t1", "event_type": "llm.start"})
        assert alert is not None
        assert alert["detector"] == "silent_failure"
