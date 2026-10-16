# AgentGuard Core

AgentGuard Core is an open-source toolkit for normalizing AI-agent telemetry, detecting anomalous behavior, and inspecting events through a minimal collector and dashboard. Its deterministic demo requires no hosted LLM.

## The problem

Multi-agent applications emit incompatible callbacks and can silently loop, consume unexpected tokens, or exceed task budgets. AgentGuard provides one event vocabulary and a small observation pipeline so these failures are visible and testable.

## MVP status and features

The repository contains framework callback paths for LangChain, AutoGen, and CrewAI; a shared Redis-oriented event representation; loop, token-spike, silent-failure, and cost-tracking components; a FastAPI service scaffold; a one-page Next.js dashboard; and a deterministic three-agent demo. Integration is still in progress: the current collector does not implement `POST /events` or `GET /alerts`, and its event bus does not invoke the detector pipeline.

## Architecture

```text
Framework callbacks / deterministic demo
                  | canonical events
                  v
       collector ingestion API
                  | detectors
                  v
       alerts and monitoring dashboard
```

Redis publishing is optional architecture support; the deterministic demo itself needs only Python's standard library.

## Quick start

Requires Python 3.11+.

```bash
python -m venv .venv
# PowerShell: .venv\Scripts\Activate.ps1
# Bash: source .venv/bin/activate
python -m pip install -r adapters/requirements.txt -r anomaly/requirements.txt -r backend/requirements.txt
python -m unittest discover -s demo/tests -v
python -m demo.run --dry-run
```

## Running the deterministic demo

Generate and validate the fixed scenario without any service:

```bash
python -m demo.run --dry-run
```

When a compatible collector is running, use `python -m demo.run --collector-url http://localhost:8000`. The URL can also be set with `AGENTGUARD_COLLECTOR_URL`. Run `python -m demo.run --help` for timeout and pacing options.

## Loop anomaly demonstration

```bash
python -m demo.run --inject-loop --collector-url http://localhost:8000
```

This emits five adjacent, identical `tool_call` events for one AutoGen agent and trace. It reports confirmation only if the collector accepts all events and returns exactly one matching new loop alert from `GET /alerts`. This branch's collector does not yet provide those endpoints, so full integration is currently blocked.

## Framework adapters

- `adapters/langchain/`: chain, LLM, and tool callbacks.
- `adapters/autogen/`: `generate_reply` instrumentation.
- `adapters/crewai/`: crew, task, and agent observer callbacks.
- `adapters/otel/`: shared Redis payload and OTEL span exporter.

## API endpoints

The FastAPI scaffold currently exposes `/health`, agent/task/cost/escalation routes under `/api/v1`, and `/ws`. The MVP contract expected by the demo is `POST /events` plus `GET /alerts`; these routes are pending collector integration and are not presented as working endpoints.

## Testing

```bash
python -m unittest discover -s demo/tests -v
python -m pytest adapters/tests anomaly/tests -q
cd frontend && npm run build
```

The pytest command requires the component requirements. Frontend setup uses `npm install` in `frontend/`.

## Repository structure

- `demo/` — deterministic event scenario, HTTP client, and tests.
- `adapters/` — framework and OTEL telemetry adapters.
- `anomaly/` — anomaly detectors and tests.
- `backend/` — FastAPI service scaffold.
- `frontend/` — Next.js monitoring dashboard.
- `docs/` — legacy architecture, API, and setup notes.
- `.github/` — CI, pull-request, and issue templates.

## Known limitations

- Collector ingestion and alert-query endpoints are not wired on this branch.
- The detector engine is not connected to the backend event bus.
- The existing loop detector defaults to ten total calls rather than the MVP's five consecutive calls.
- Authentication, authorization, multitenancy, rate limiting, and production hardening are absent.
- Existing Redis/Supabase infrastructure is legacy scaffolding and is not required by the deterministic demo.

## Roadmap

Ollama/Phi-4 semantic checks, root-cause analysis, database persistence, human approval workflows, quarantine commands, trace replay, an interactive dependency DAG, authentication and multitenancy, and production deployment remain roadmap work.

## Contributing

See [CONTRIBUTING.md](CONTRIBUTING.md) for setup, conventions, issue reporting, and pull-request guidance.

## Security

Follow [SECURITY.md](SECURITY.md). Never publish credentials or private telemetry; the MVP is not production-hardened.

## License

Licensed under the Apache License, Version 2.0. See [LICENSE](LICENSE).
