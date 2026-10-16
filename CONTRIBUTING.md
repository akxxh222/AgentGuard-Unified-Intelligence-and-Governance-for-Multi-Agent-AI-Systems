# Contributing to AgentGuard Core

Thanks for helping make agent telemetry portable and safer.

## Before You Start

1. Check existing issues and open a focused issue for substantial changes.
2. Keep pull requests small and limited to one behavior.
3. Preserve the canonical event contract or clearly document a proposed version change.
4. Never make telemetry failures interrupt the monitored agent.

## Development

Use Python 3.11 or newer.

```bash
python -m pip install -r adapters/requirements.txt
python -m pip install -r anomaly/requirements.txt
python -m pytest adapters/tests anomaly/tests -v
```

Write a failing test before changing behavior. Tests must run without live Redis, Ollama, AutoGen, or CrewAI unless explicitly marked as integration tests.

## Pull Requests

- Explain the user-facing behavior and why it belongs in the focused core.
- Include tests for success, malformed input, and dependency failure where relevant.
- Update documentation when changing public interfaces.
- Confirm no credentials, local environment files, or planning notes are tracked.

By contributing, you agree that your contribution is licensed under Apache License 2.0.
