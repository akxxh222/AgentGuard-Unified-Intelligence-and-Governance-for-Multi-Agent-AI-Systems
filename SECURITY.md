# Security Policy

## Supported versions

AgentGuard Core is an early-stage hackathon MVP. Only the latest commit on the default branch is considered for security fixes; there are no supported release branches or long-term support versions yet.

## Reporting a vulnerability

If the repository has GitHub private vulnerability reporting enabled, use **Security → Report a vulnerability**. Otherwise, contact a repository maintainer privately through their GitHub profile before sharing details. If no private channel is available, open a minimal public issue requesting maintainer contact without disclosing exploit details, credentials, private telemetry, or reproduction secrets. This fallback cannot guarantee confidentiality.

Never put API keys, access tokens, database credentials, private agent prompts, or unsanitized logs in an issue, discussion, pull request, or demo output. Revoke any credential that is accidentally exposed.

## Current limitations

- The MVP does not provide production authentication, authorization, multitenancy, rate limiting, or hardened access controls.
- Local endpoints and telemetry may contain sensitive prompts, tool inputs, or outputs.
- The demo and collector are intended for trusted local development networks.
- Detector alerts are advisory and must not be treated as a security boundary.

AgentGuard Core is not production-hardened. Deploying it on a public network without additional controls is unsupported.

