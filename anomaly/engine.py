"""
Anomaly detection engine — orchestrates all detectors and emits alerts.
"""
from typing import Any

import structlog

from anomaly.detectors.loop_detector import LoopDetector
from anomaly.detectors.semantic_checker import SemanticChecker
from anomaly.detectors.silent_failure import SilentFailureDetector
from anomaly.detectors.token_spike import TokenSpikeDetector

log = structlog.get_logger()


class AnomalyEngine:
    """
    Orchestrates all anomaly detectors.
    Call `evaluate(event)` for every incoming event.
    Returns a list of alert dicts (empty if no anomalies detected).
    """

    def __init__(self, config: dict[str, Any] | None = None) -> None:
        cfg = config or {}
        self._detectors = [
            TokenSpikeDetector(multiplier=cfg.get("token_spike_multiplier", 3.0)),
            LoopDetector(max_iterations=cfg.get("loop_max_iterations", 5)),
            SilentFailureDetector(timeout_seconds=cfg.get("silent_failure_timeout", 30)),
            SemanticChecker(
                ollama_base_url=cfg.get("ollama_base_url", "http://localhost:11434"),
                model=cfg.get("ollama_model", "phi4"),
            ),
        ]

    def evaluate(self, event: dict[str, Any]) -> list[dict[str, Any]]:
        """
        Run all detectors against an event.
        Returns list of anomaly alert dicts.
        Each alert: { detector, agent_id, severity, details }
        """
        alerts: list[dict[str, Any]] = []
        for detector in self._detectors:
            try:
                alert = detector.check(event)
                if alert:
                    log.warning(
                        "anomaly.detected",
                        detector=alert.get("detector"),
                        agent_id=alert.get("agent_id"),
                        severity=alert.get("severity"),
                    )
                    alerts.append(alert)
            except Exception as exc:
                log.error("anomaly.detector_error", detector=type(detector).__name__, error=str(exc))
        return alerts
