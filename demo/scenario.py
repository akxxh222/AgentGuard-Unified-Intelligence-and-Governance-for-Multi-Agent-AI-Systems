"""Deterministic synthetic event generation for the local demo."""

from __future__ import annotations

from datetime import datetime, timedelta, timezone
from typing import Any
from uuid import NAMESPACE_URL, uuid4, uuid5

FRAMEWORKS = ("langchain", "autogen", "crewai")
BASE_TIME = datetime(2026, 1, 1, 12, 0, tzinfo=timezone.utc)


def _event(run_id: str, sequence: int, **values: Any) -> dict[str, Any]:
    event = {
        "event_id": str(uuid5(NAMESPACE_URL, f"agentguard:{run_id}:{sequence}")),
        "timestamp": (BASE_TIME + timedelta(milliseconds=sequence * 100)).isoformat().replace("+00:00", "Z"),
        **values,
    }
    validate_event(event)
    return event


def validate_event(event: dict[str, Any]) -> None:
    """Validate the fields required by the AgentGuard demo contract."""
    required = {
        "event_id", "event_type", "agent_id", "framework", "status",
        "trace_id", "task_id", "team_id", "payload", "timestamp",
    }
    missing = required.difference(event)
    if missing:
        raise ValueError(f"event missing required fields: {', '.join(sorted(missing))}")
    if event["framework"] not in FRAMEWORKS:
        raise ValueError(f"unsupported framework: {event['framework']}")
    if not isinstance(event["payload"], dict):
        raise ValueError("payload must be an object")
    parsed = datetime.fromisoformat(event["timestamp"].replace("Z", "+00:00"))
    if parsed.tzinfo is None or parsed.utcoffset() != timedelta(0):
        raise ValueError("timestamp must be a UTC timestamp")


def build_events(inject_loop: bool = False, run_id: str | None = None) -> list[dict[str, Any]]:
    """Build a stable three-agent workflow, optionally with five loop calls."""
    run_id = run_id or str(uuid4())
    trace_id = str(uuid5(NAMESPACE_URL, f"agentguard:{run_id}:trace"))
    team_id = "demo-content-team"
    specs: list[dict[str, Any]] = [
        dict(event_type="start", agent_id="researcher-01", agent_name="Researcher", framework="langchain", trace_id=trace_id, task_id="task-research", team_id=team_id, parent_agent_id=None, payload={"goal": "Collect release facts"}),
        dict(event_type="llm_call", agent_id="researcher-01", agent_name="Researcher", framework="langchain", trace_id=trace_id, task_id="task-research", team_id=team_id, parent_agent_id=None, payload={"model": "synthetic-local", "operation": "plan"}, tokens={"prompt": 120, "completion": 45, "total": 165}, cost_usd=0.0002),
        dict(event_type="tool_call", agent_id="researcher-01", agent_name="Researcher", framework="langchain", trace_id=trace_id, task_id="task-research", team_id=team_id, parent_agent_id=None, payload={"tool": "fixture_search", "query": "AgentGuard release facts"}),
        dict(event_type="finish", agent_id="researcher-01", agent_name="Researcher", framework="langchain", trace_id=trace_id, task_id="task-research", team_id=team_id, parent_agent_id=None, payload={"result": "facts-ready"}),
        dict(event_type="start", agent_id="coder-01", agent_name="CodeReviewer", framework="autogen", trace_id=trace_id, task_id="task-review", team_id=team_id, parent_agent_id="researcher-01", payload={"goal": "Validate examples"}),
        dict(event_type="llm_call", agent_id="coder-01", agent_name="CodeReviewer", framework="autogen", trace_id=trace_id, task_id="task-review", team_id=team_id, parent_agent_id="researcher-01", payload={"model": "synthetic-local", "operation": "review"}, tokens={"prompt": 90, "completion": 30, "total": 120}, cost_usd=0.0001),
        dict(event_type="tool_call", agent_id="coder-01", agent_name="CodeReviewer", framework="autogen", trace_id=trace_id, task_id="task-review", team_id=team_id, parent_agent_id="researcher-01", payload={"tool": "syntax_check", "target": "example.py"}),
    ]
    if inject_loop:
        repeated = dict(event_type="tool_call", agent_id="coder-01", agent_name="CodeReviewer", framework="autogen", trace_id=trace_id, task_id="task-review", team_id=team_id, parent_agent_id="researcher-01", payload={"tool": "retry_compile", "target": "example.py"})
        specs.extend(dict(repeated) for _ in range(5))
    specs.extend([
        dict(event_type="finish", agent_id="coder-01", agent_name="CodeReviewer", framework="autogen", trace_id=trace_id, task_id="task-review", team_id=team_id, parent_agent_id="researcher-01", payload={"result": "examples-valid"}),
        dict(event_type="start", agent_id="writer-01", agent_name="ReleaseWriter", framework="crewai", trace_id=trace_id, task_id="task-write", team_id=team_id, parent_agent_id="researcher-01", payload={"goal": "Write release summary"}),
        dict(event_type="llm_call", agent_id="writer-01", agent_name="ReleaseWriter", framework="crewai", trace_id=trace_id, task_id="task-write", team_id=team_id, parent_agent_id="researcher-01", payload={"model": "synthetic-local", "operation": "draft"}, tokens={"prompt": 140, "completion": 75, "total": 215}, cost_usd=0.0003),
        dict(event_type="tool_call", agent_id="writer-01", agent_name="ReleaseWriter", framework="crewai", trace_id=trace_id, task_id="task-write", team_id=team_id, parent_agent_id="researcher-01", payload={"tool": "format_markdown", "style": "concise"}),
        dict(event_type="finish", agent_id="writer-01", agent_name="ReleaseWriter", framework="crewai", trace_id=trace_id, task_id="task-write", team_id=team_id, parent_agent_id="researcher-01", payload={"result": "summary-ready"}),
    ])
    events = []
    for index, spec in enumerate(specs):
        spec = dict(spec)
        agent_name = spec.pop("agent_name")
        tokens = spec.pop("tokens", {})
        spec["status"] = "failed" if spec["event_type"] == "error" else ("success" if spec["event_type"] == "finish" else "running")
        spec["tokens_in"] = tokens.get("prompt", 0)
        spec["tokens_out"] = tokens.get("completion", 0)
        spec.setdefault("cost_usd", 0.0)
        spec["payload"] = {"agent_name": agent_name, **spec["payload"]}
        events.append(_event(run_id, index, **spec))
    return events

