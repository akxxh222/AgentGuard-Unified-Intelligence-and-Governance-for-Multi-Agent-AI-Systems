# Security Policy

## Supported Version

Security fixes currently target the latest commit on `main`.

## Reporting a Vulnerability

Do not open a public issue for an unpatched vulnerability. Use GitHub's private vulnerability reporting feature for this repository. Include affected files, reproduction steps, impact, and any suggested mitigation.

Maintainers should acknowledge a report within 72 hours and coordinate disclosure after a fix is available.

## Security Boundaries

AgentGuard Core processes telemetry that may contain prompts, tool inputs, outputs, or identifiers. Deployers are responsible for redaction, access control, Redis security, retention, and compliance requirements. The current MVP is intended for local development and evaluation, not as a hardened multi-tenant service.
