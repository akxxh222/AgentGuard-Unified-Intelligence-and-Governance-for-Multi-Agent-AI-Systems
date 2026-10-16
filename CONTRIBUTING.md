# Contributing to AgentGuard Core

AgentGuard Core is an early-stage toolkit for normalizing AI-agent telemetry, detecting anomalies, and inspecting events through a small collector and dashboard.

## Local setup

Use Python 3.11 or newer from the repository root:

```bash
python -m venv .venv
```

Activate it with `.venv\Scripts\Activate.ps1` on PowerShell or `source .venv/bin/activate` on Bash, then install the component requirements needed for your work:

```bash
python -m pip install -r adapters/requirements.txt -r anomaly/requirements.txt -r backend/requirements.txt
```

For the dashboard, use Node.js 20 and run `npm install` from `frontend/`.

## Tests and demo

```bash
python -m unittest discover -s demo/tests -v
python -m pytest adapters/tests anomaly/tests -q
python -m demo.run --dry-run
python -m demo.run --inject-loop
```

The final command requires a collector implementing `POST /events` and `GET /alerts`. No API key, Redis, database, or external model is needed by the demo itself.

## Conventions

- Keep changes small and scoped to one component.
- Preserve the canonical event contract and add tests for behavior changes.
- Use type hints, UTC timestamps, and deterministic fixtures.
- Never commit credentials, generated environments, dependency directories, or local logs.
- Avoid adding infrastructure or external services when an in-process test is sufficient.

## Branches and pull requests

Create a focused feature branch rather than committing directly to `main`. Open a pull request describing the change, verification commands, limitations, and any compatibility impact. Keep unrelated refactors out of the same pull request and ensure required CI checks pass.

## Bugs and features

Use the GitHub bug form with reproduction steps, environment details, and sanitized logs. Do not include secrets or private telemetry. Use the feature-request form to describe the problem, benefit, proposed behavior, and relevance to the MVP. Security issues must follow [SECURITY.md](SECURITY.md), not a public issue.

