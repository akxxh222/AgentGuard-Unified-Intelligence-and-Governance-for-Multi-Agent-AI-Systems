"""
Semantic checker — uses Phi-4 via Ollama to sanity-check agent outputs.
Flags hallucinations, contradictions, and off-topic responses.
"""
import os
from typing import Any

import httpx


class SemanticChecker:
    """
    Calls the local Ollama Phi-4 model to evaluate agent output quality.
    Only runs on events that carry output text (e.g., chain.end, agent.finish).
    """

    PROMPT_TEMPLATE = """You are an AI output quality auditor.

Agent output: "{output}"

Evaluate for: hallucinations, contradictions, incoherence, or clearly off-topic content.
Respond with ONLY a JSON object: {{"issue": true/false, "reason": "brief reason or null"}}
"""

    def __init__(
        self,
        ollama_base_url: str = "http://localhost:11434",
        model: str = "phi4",
        timeout: float = 10.0,
    ) -> None:
        self._base_url = ollama_base_url.rstrip("/")
        self._model = model
        self._timeout = timeout

    def check(self, event: dict[str, Any]) -> dict[str, Any] | None:
        event_type = event.get("event_type", "")
        # Only check output-bearing events
        if event_type not in ("chain.end", "agent.finish", "task.end", "crew.end"):
            return None

        payload = event.get("payload", {})
        output = payload.get("output") or payload.get("result") or ""
        if not output or len(str(output)) < 20:
            return None

        try:
            result = self._call_ollama(str(output)[:1000])
            if result.get("issue"):
                return {
                    "detector": "semantic_checker",
                    "agent_id": event.get("agent_id", "unknown"),
                    "severity": "medium",
                    "details": {
                        "reason": result.get("reason", "Semantic issue detected"),
                        "model": self._model,
                        "output_snippet": str(output)[:200],
                    },
                }
        except Exception:
            pass  # Semantic checker is best-effort, never block the pipeline

        return None

    def _call_ollama(self, output_text: str) -> dict[str, Any]:
        import json
        prompt = self.PROMPT_TEMPLATE.format(output=output_text)
        response = httpx.post(
            f"{self._base_url}/api/generate",
            json={"model": self._model, "prompt": prompt, "stream": False},
            timeout=self._timeout,
        )
        response.raise_for_status()
        raw_text = response.json().get("response", "{}")
        # Parse the JSON Phi-4 returns
        start = raw_text.find("{")
        end = raw_text.rfind("}") + 1
        if start >= 0 and end > start:
            return json.loads(raw_text[start:end])
        return {"issue": False, "reason": None}
