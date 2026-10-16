# AgentGuard Core

AgentGuard Core is a lightweight, open-source telemetry and safety toolkit for AI agents. It normalizes LangChain, AutoGen, and CrewAI activity into one event contract so teams can inspect behavior and detect common failures without adopting a hosted observability platform.

## Why It Matters

Agent frameworks expose different callback formats. That fragmentation makes portable monitoring difficult and locks useful safety rules to one ecosystem. AgentGuard Core provides:

- One validated event format across three popular agent frameworks.
- Non-blocking instrumentation that does not interrupt the monitored agent.
- In-memory operation for tests and local tools, with optional Redis Streams transport.
- Deterministic loop, token-spike, and cost-runaway detection as the focused MVP.
- Apache-2.0 licensing for reuse and extension.

## Focused Architecture

```text
LangChain / AutoGen / CrewAI
             |
      Canonical adapters
             |
       UnifiedEvent model
             |
  In-memory or Redis publisher
             |
    Deterministic safety rules
             |
       Events and alerts
```

The canonical schema includes agent, task, team, framework, trace, lifecycle status, token usage, cost, timestamp, and JSON payload fields.

See [architecture.md](architecture.md) for the component boundaries, message contract, end-to-end demo flow, and deferred production features.

## Current Status

The integrated MVP includes framework adapters, a FastAPI collector, deterministic loop alerts, Redis transport, a multi-page Next.js dashboard, and a reproducible three-agent demo. The submission scope intentionally excludes hosted persistence, semantic LLM analysis, HITL workflows, and active quarantine commands.

See the project roadmap in the repository documentation. The local `milestones.md` file contains the time-boxed team plan and is intentionally ignored by Git.

## Quick Start

Python 3.11 or newer is recommended.

```bash
python -m pip install -r adapters/requirements.txt
python -m pip install -r anomaly/requirements.txt
python -m pip install -r backend/requirements.txt
python -m pytest adapters/tests anomaly/tests demo/tests -q

cd backend
uvicorn app.main:app --reload
```

In another terminal run `npm install && npm run dev` from `frontend/`. From the repository root, `python -m demo.run --inject-loop` submits the deterministic workflow and verifies that exactly one loop alert was created.

Minimal in-memory event example:

```python
from adapters.base import BaseAdapter
from adapters.otel.schema import EventStatus, EventType, Framework
from adapters.publisher import CollectingEventPublisher

publisher = CollectingEventPublisher()
adapter = BaseAdapter(
    agent_id="research-01",
    agent_name="Research Agent",
    framework=Framework.LANGCHAIN,
    publisher=publisher,
    task_id="task-01",
    team_id="demo-team",
)

adapter.publish_event(
    EventType.START,
    EventStatus.RUNNING,
    {"operation": "research"},
)

print(publisher.events[0].model_dump_json(indent=2))
```

## Repository Layout

- `adapters/` — canonical schema, publisher boundary, framework adapters, and tests.
- `anomaly/` — deterministic anomaly rules and tests.
- `backend/` — minimal collector scaffold.
- `frontend/` — minimal dashboard scaffold.
- `demo-agents/` — demonstration entry points.
- `docs/` — setup, architecture, API, design, and implementation notes.

## Contributing

Small, testable improvements are welcome. Read [CONTRIBUTING.md](CONTRIBUTING.md) before opening a pull request and report vulnerabilities according to [SECURITY.md](SECURITY.md).

## Roadmap

Post-submission opportunities include semantic validation, root-cause analysis, persistent storage, active quarantine commands, human approval workflows, trace replay, and a live dependency graph.

## License

Copyright 2026 AgentGuard Core contributors.

Licensed under the [Apache License 2.0](LICENSE).
