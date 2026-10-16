# Teammate 1 Telemetry and Anomaly Design

## Purpose

Build Teammate 1's hackathon scope on branch `mem3`: a framework-neutral telemetry layer for LangChain, AutoGen, and CrewAI, followed by an anomaly engine that detects quantitative and semantic failures and issues active-governance commands.

The event contract in `milestones.md` is the source of truth. This work does not modify Teammate 2's backend models or database layer; it emits complete events and reports for that layer to consume and persist.

## Success Criteria

- Every supported framework emits the same validated event representation.
- Related callbacks preserve `trace_id` and `task_id` so downstream services can reconstruct a DAG.
- Adapter publishing failures never interrupt the monitored agent.
- The anomaly engine detects token spikes, repeated-tool loops, silent failures, semantic problems, and task-budget overruns.
- A repeated-tool loop creates a critical alert and one quarantine command per trace/tool incident.
- Failure events can produce a Phi-4 root-cause report without coupling the engine to PostgreSQL.
- Unit and integration tests run without live Redis, Ollama, or framework installations.

## Canonical Event Contract

`adapters/otel/schema.py` owns the adapter-side canonical model. It contains these milestone fields:

- `event_id`: generated UUID string.
- `agent_id`: non-empty string.
- `framework`: `langchain`, `autogen`, or `crewai`.
- `parent_agent_id`: optional string.
- `task_id`: non-empty string.
- `team_id`: non-empty string.
- `status`: `running`, `success`, `failed`, `paused`, or `quarantined`.
- `event_type`: `start`, `tool_call`, `llm_call`, `finish`, or `error`.
- `tokens_in` and `tokens_out`: non-negative integers.
- `cost_usd`: non-negative number.
- `timestamp`: UTC ISO-8601 string.
- `trace_id`: non-empty string, inherited when supplied and generated otherwise.
- `payload`: JSON-compatible object.

The model validates enum and numeric constraints and supports dictionary, JSON, and Redis-field serialization. The Redis representation uses one `payload` JSON field so consumers receive the same shape on every stream.

Model pricing is a small explicit mapping used to calculate `cost_usd` when framework callbacks provide a recognized model and token counts. Unknown models keep a zero cost and retain the model name in `payload` rather than guessing a price.

## Publishing Boundary

Adapters depend on an event-publisher interface rather than constructing Redis clients internally. The production Redis publisher appends canonical events to `agent.events`. Tests use a collecting in-memory publisher.

Publishing returns a success/failure result. Redis exceptions are logged and converted to failure results; they do not propagate through framework callbacks. The publisher accepts an injected Redis client for deterministic tests and creates its own client only in production configuration.

## Framework Adapters

The shared adapter base owns identity defaults, trace/task context, canonical event construction, and publishing. Framework adapters only translate native callbacks:

- LangChain maps chain, tool, LLM, and error callbacks to the five canonical event types.
- AutoGen wraps reply generation and emits start, finish, and error events without changing the wrapped return value or exception.
- CrewAI maps task, action/tool, crew completion, and failure callbacks.

Each adapter accepts caller-supplied `task_id`, `team_id`, and `trace_id`. A missing trace ID is generated at the start of a logical run and reused for its child callbacks. Framework packages remain optional imports so contract tests can run in a lightweight CI environment.

## Anomaly Detectors

All detectors consume canonical event dictionaries and return either no result or a normalized alert with `detector`, `agent_id`, `trace_id`, `severity`, and `details`.

### Token Spike

Maintain the most recent 20 token totals per agent. After at least five baseline samples, alert when the current total is greater than the baseline mean plus two standard deviations. The current sample is evaluated before entering the window.

### Loop Detector

Track consecutive tool calls by `(trace_id, agent_id, tool)`. Emit a critical alert at the fifth repeated call. Suppress duplicates for the same incident until a finish/error event closes the trace or a different tool breaks the consecutive sequence.

### Silent Failure

Track start events by `(trace_id, agent_id, task_id)`. A configurable timeout marks unfinished work as a high-severity alert. Inject the monotonic clock so tests do not sleep. Finish and error events clear pending work.

### Semantic Checker

Run only on output-bearing finish events. Send at most 1,000 output characters to Phi-4 through Ollama and require a JSON response containing `issue` and `reason`. Empty outputs, malformed responses, timeouts, and unavailable Ollama fail open and never block the event pipeline.

### Cost Runaway

Accumulate `cost_usd` by task. Emit a high-severity escalation once cumulative cost first exceeds the configured task budget. Suppress duplicates until that task finishes.

## Engine, Alerts, and Commands

The engine validates every input before detection. Invalid events create a diagnostic alert instead of raising out of the consumer loop. Each detector runs in isolation; one detector exception is logged and represented diagnostically while remaining detectors continue.

Alerts publish to `agent.alerts`. A critical loop alert additionally publishes one quarantine command to `agent.commands`. The command identifies the agent, task, trace, reason, and requested `quarantined` status.

The engine exposes a synchronous `evaluate` method for deterministic unit use and a stream-processing boundary for Redis integration. Network access remains outside detector logic.

## Root-Cause Analysis

On canonical error events, the engine can pass the bounded trace context and error payload to Phi-4. The result is a structured RCA event containing a summary, likely cause, and suggested next action. It is published with the other engine output; Teammate 2's backend owns database persistence.

RCA is best-effort. Ollama failures produce no RCA report and do not prevent statistical detection, alert publication, or command publication.

## Configuration

`anomaly/rules/default_rules.yaml` contains the production defaults:

- Token window of 20 and standard-deviation threshold of 2.
- Loop threshold of 5 repeated calls.
- Silent-failure timeout of 30 seconds.
- Semantic model `phi4`, enabled for finish events.
- Configurable per-task cost budget.

Constructor overrides remain available for focused tests. Configuration errors fail during engine construction with a clear message instead of silently choosing a different policy.

## Testing Strategy

Tests use real domain objects and injected boundaries rather than asserting on Redis mocks inside adapter implementations.

- Contract tests cover required fields, enum and numeric validation, UTC timestamps, serialization round-trips, and trace propagation.
- Publisher tests use an injected fake Redis client and verify `agent.events` plus exact serialized payloads.
- Adapter tests use fake framework objects and collecting publishers; live frameworks are not required.
- Detector tests cover normal, threshold, reset, malformed-input, and independent-agent/trace behavior.
- Semantic and RCA tests inject deterministic HTTP behavior for valid, malformed, timeout, and unavailable responses.
- Engine integration tests prove `event -> alert -> quarantine command`, duplicate suppression, invalid-event diagnostics, and detector isolation.
- A separately marked smoke test may exercise a real Redis service and is excluded from default CI.

## Delivery Sequence

1. Canonical contract and publisher abstraction.
2. Framework adapters converted to the canonical lifecycle.
3. Statistical detectors and cost-runaway detector.
4. Semantic checking and root-cause reporting.
5. Engine validation, alert publication, and quarantine-command integration.

Each slice follows test-driven development and is committed independently. No backend, frontend, or database implementation is included in this branch.
