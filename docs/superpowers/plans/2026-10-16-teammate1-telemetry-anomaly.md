# Teammate 1 Telemetry and Anomaly Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Deliver canonical cross-framework telemetry and a tested anomaly/circuit-breaker pipeline on branch `mem1`.

**Architecture:** Framework callbacks build one validated Pydantic event model and publish through an injected boundary to Redis stream `agent.events`. The anomaly engine consumes that model, runs isolated detectors, and publishes alerts, RCA reports, and quarantine commands without coupling adapters to backend persistence.

**Tech Stack:** Python 3.11+, Pydantic 2, redis-py, OpenTelemetry SDK, LangChain Core callbacks, httpx, PyYAML, pytest.

**Spec:** `docs/superpowers/specs/2026-10-16-teammate1-telemetry-anomaly-design.md`

## Global Constraints

- `milestones.md` is the canonical contract: event/status enums, identifiers, token fields, cost, UTC timestamp, trace ID, and payload are required exactly as specified.
- Production stream names are `agent.events`, `agent.alerts`, and `agent.commands`.
- Telemetry and Ollama failures must never interrupt the monitored agent or stop processing other detectors.
- Do not modify `backend/`, `frontend/`, database schemas, or persistence code in this branch.
- Default tests must not require live Redis, Ollama, AutoGen, or CrewAI.
- Every production behavior follows red-green-refactor; run the focused test red before implementation and the full affected suite green before committing.

## Review Focus

- Non-JSON-compatible payload values: publishing returns `False` without raising into the agent callback (Task 1 test).
- Missing callback ancestry: adapters generate a valid trace context and never emit blank required identifiers (Tasks 2 and 3 tests).
- Zero-variance token history: a value above `mean + 2σ` still alerts when `σ == 0` (Task 5 test).
- Repeated events after quarantine: the engine emits one command per trace/tool incident and re-arms after trace completion (Task 7 test).
- Ollama markdown, malformed JSON, timeout, or connection failure: semantic checks and RCA fail open with no fabricated result (Task 6 tests).

---

### Task 1: Canonical Event Contract and Publisher Boundary

**Files:**
- Create: `adapters/publisher.py`
- Create: `adapters/tests/test_schema.py`
- Create: `adapters/tests/test_publisher.py`
- Modify: `adapters/otel/schema.py`
- Modify: `adapters/otel/exporter.py`
- Modify: `adapters/requirements.txt`

**Interfaces:**
- Produces: `Framework`, `EventStatus`, and `EventType` string enums.
- Produces: `UnifiedEvent(BaseModel)` with the exact milestone fields and `to_redis_payload() -> dict[str, str]`.
- Produces: `EventPublisher` protocol with `publish(event: UnifiedEvent) -> bool`.
- Produces: `RedisEventPublisher(client, stream_key="agent.events", max_stream_len=10_000)`.
- Produces: `CollectingEventPublisher.events: list[UnifiedEvent]` for tests and local use.

- [ ] **Step 1: Write failing contract tests**

Add tests named `test_canonical_event_contains_every_milestone_field`, `test_event_rejects_invalid_enum_and_negative_usage`, `test_timestamp_is_utc_and_ids_are_generated`, and `test_redis_payload_round_trips_exact_event`. Assert exact keys, UTC offset, generated UUID/trace strings, validation errors, and `UnifiedEvent.model_validate_json(payload["payload"]) == event`.

- [ ] **Step 2: Run contract tests to verify red**

Run: `python -m pytest adapters/tests/test_schema.py -v`

Expected: FAIL because the existing dataclass lacks milestone fields and validation.

- [ ] **Step 3: Implement the canonical model**

Implement the enums and Pydantic model in `adapters/otel/schema.py`. Use default factories for `event_id` and UTC `timestamp`; generate `trace_id` only when not supplied; validate non-empty required strings and non-negative tokens/cost.

- [ ] **Step 4: Run contract tests to verify green**

Run: `python -m pytest adapters/tests/test_schema.py -v`

Expected: all contract tests PASS.

- [ ] **Step 5: Write failing publisher tests**

Add `test_redis_publisher_uses_agent_events_and_exact_payload`, `test_redis_failure_returns_false`, `test_non_json_payload_returns_false_without_raising`, and `test_collecting_publisher_preserves_event_order`. Use an injected fake client with a recorded `xadd` call.

- [ ] **Step 6: Run publisher tests to verify red**

Run: `python -m pytest adapters/tests/test_publisher.py -v`

Expected: FAIL because the publisher protocol and implementations do not exist.

- [ ] **Step 7: Implement publishers and adapt the OTEL exporter**

Implement `EventPublisher`, `RedisEventPublisher`, and `CollectingEventPublisher` in `adapters/publisher.py`. Make `RedisStreamExporter` accept an `EventPublisher`, translate spans to canonical fields, and return `SpanExportResult.FAILURE` when publishing returns `False`. Add `pydantic>=2.7,<3` to adapter dependencies.

- [ ] **Step 8: Verify Task 1**

Run: `python -m pytest adapters/tests/test_schema.py adapters/tests/test_publisher.py -v`

Expected: all Task 1 tests PASS.

- [ ] **Step 9: Commit Task 1**

```bash
git add adapters/otel/schema.py adapters/otel/exporter.py adapters/publisher.py adapters/requirements.txt adapters/tests/test_schema.py adapters/tests/test_publisher.py
git commit -m "feat(adapters): add canonical event publishing"
```

### Task 2: Shared Adapter Context and Model Pricing

**Files:**
- Create: `adapters/pricing.py`
- Create: `adapters/tests/test_base_adapter.py`
- Create: `adapters/tests/test_pricing.py`
- Modify: `adapters/base.py`

**Interfaces:**
- Consumes: `UnifiedEvent`, its enums, and `EventPublisher` from Task 1.
- Produces: `calculate_cost(model: str | None, tokens_in: int, tokens_out: int) -> float` with zero for unknown models.
- Produces: `BaseAdapter.__init__(agent_id, agent_name, framework, publisher, task_id, team_id, parent_agent_id=None, trace_id=None)`.
- Produces: `BaseAdapter.build_event(event_type, status, payload, *, tokens_in=0, tokens_out=0, model=None) -> UnifiedEvent` and `publish_event(...) -> bool`.

- [ ] **Step 1: Write failing base/pricing tests**

Add `test_base_adapter_generates_and_reuses_trace_id`, `test_base_adapter_rejects_blank_task_or_team_id`, `test_publish_event_delegates_without_raising`, `test_known_model_cost_uses_input_and_output_rates`, and `test_unknown_model_cost_is_zero`. Use a minimal concrete test adapter and `CollectingEventPublisher`.

- [ ] **Step 2: Run tests to verify red**

Run: `python -m pytest adapters/tests/test_base_adapter.py adapters/tests/test_pricing.py -v`

Expected: FAIL because the shared context and pricing API do not exist.

- [ ] **Step 3: Implement shared behavior**

Add the explicit hackathon price map to `adapters/pricing.py`. Refactor `BaseAdapter` to own required identity/context, construct canonical events, calculate LLM cost, and convert publisher exceptions into `False`.

- [ ] **Step 4: Verify Task 2**

Run: `python -m pytest adapters/tests/test_base_adapter.py adapters/tests/test_pricing.py adapters/tests/test_schema.py adapters/tests/test_publisher.py -v`

Expected: all tests PASS.

- [ ] **Step 5: Commit Task 2**

```bash
git add adapters/base.py adapters/pricing.py adapters/tests/test_base_adapter.py adapters/tests/test_pricing.py
git commit -m "feat(adapters): add shared telemetry context"
```

### Task 3: LangChain Canonical Callback Adapter

**Files:**
- Modify: `adapters/langchain/tracer.py`
- Modify: `adapters/tests/test_langchain_adapter.py`

**Interfaces:**
- Consumes: Task 2 `BaseAdapter` behavior and injected `EventPublisher`.
- Produces: `ControlTowerTracer(..., publisher: EventPublisher | None = None)` implementing LangChain callback signatures.
- Mapping: chain start=`start/running`, chain end=`finish/success`, tools=`tool_call`, LLM callbacks=`llm_call`, callback errors=`error/failed`; native operation names live in `payload["operation"]`.

- [ ] **Step 1: Replace Redis-mock tests with failing canonical behavior tests**

Cover exact event/status mappings, parent/child run trace reuse, token/cost capture, generated context when an end callback lacks known ancestry, and publisher failure not escaping the callback.

- [ ] **Step 2: Run LangChain tests to verify red**

Run: `python -m pytest adapters/tests/test_langchain_adapter.py -v`

Expected: FAIL because callbacks still emit legacy event names and construct Redis directly.

- [ ] **Step 3: Implement the LangChain mapping**

Refactor `ControlTowerTracer` to use the shared adapter/publisher boundary. Maintain a run-context map keyed by LangChain UUID, inherit parent context when `parent_run_id` is provided, and discard completed entries.

- [ ] **Step 4: Verify Task 3**

Run: `python -m pytest adapters/tests/test_langchain_adapter.py adapters/tests/test_base_adapter.py adapters/tests/test_schema.py -v`

Expected: all tests PASS.

- [ ] **Step 5: Commit Task 3**

```bash
git add adapters/langchain/tracer.py adapters/tests/test_langchain_adapter.py
git commit -m "feat(adapters): normalize LangChain telemetry"
```

### Task 4: AutoGen and CrewAI Canonical Adapters

**Files:**
- Modify: `adapters/autogen/middleware.py`
- Modify: `adapters/crewai/observer.py`
- Modify: `adapters/tests/test_autogen_adapter.py`
- Modify: `adapters/tests/test_crewai_adapter.py`

**Interfaces:**
- Consumes: Task 2 shared adapter/publisher API.
- Produces: `AutoGenMiddleware(..., publisher: EventPublisher | None = None)` and unchanged `instrument_autogen_agent(...)` convenience API.
- Produces: `ControlTowerObserver(..., publisher: EventPublisher | None = None)` callback API.

- [ ] **Step 1: Write failing AutoGen behavior tests**

Test canonical start/finish/error output, stable task/trace context across a reply, preservation of the wrapped return value and exception, and no duplicate instrumentation when the same agent is wrapped twice.

- [ ] **Step 2: Run AutoGen tests to verify red**

Run: `python -m pytest adapters/tests/test_autogen_adapter.py -v`

Expected: FAIL on canonical fields, injected publishing, or duplicate wrapping.

- [ ] **Step 3: Implement AutoGen behavior and verify green**

Refactor the wrapper onto the shared boundary and mark the patched callable so repeated instrumentation returns the existing middleware.

Run: `python -m pytest adapters/tests/test_autogen_adapter.py -v`

Expected: all AutoGen tests PASS.

- [ ] **Step 4: Write failing CrewAI behavior tests**

Test canonical task/tool/finish/error mappings, supplied identity/context, output text retained for semantic checking, and publishing failure isolation.

- [ ] **Step 5: Run CrewAI tests to verify red**

Run: `python -m pytest adapters/tests/test_crewai_adapter.py -v`

Expected: FAIL because the observer emits legacy events and stores only output length.

- [ ] **Step 6: Implement CrewAI behavior and verify Task 4**

Refactor the observer onto the shared boundary and retain bounded output text in finish payloads.

Run: `python -m pytest adapters/tests/test_autogen_adapter.py adapters/tests/test_crewai_adapter.py -v`

Expected: all tests PASS.

- [ ] **Step 7: Commit Task 4**

```bash
git add adapters/autogen/middleware.py adapters/crewai/observer.py adapters/tests/test_autogen_adapter.py adapters/tests/test_crewai_adapter.py
git commit -m "feat(adapters): normalize AutoGen and CrewAI telemetry"
```

### Task 5: Statistical and Budget Detectors

**Files:**
- Create: `anomaly/detectors/cost_runaway.py`
- Modify: `anomaly/detectors/token_spike.py`
- Modify: `anomaly/detectors/loop_detector.py`
- Modify: `anomaly/detectors/silent_failure.py`
- Modify: `anomaly/tests/test_detectors.py`

**Interfaces:**
- Consumes: canonical event dictionaries from Task 1.
- Produces: `TokenSpikeDetector(window=20, stddev_threshold=2.0, min_samples=5)`.
- Produces: `LoopDetector(max_iterations=5)` with consecutive per-trace/tool tracking and incident suppression.
- Produces: `SilentFailureDetector(timeout_seconds=30, clock=time.monotonic)`.
- Produces: `CostRunawayDetector(budget_usd: float)` with one escalation per active task.

- [ ] **Step 1: Write failing token and loop tests**

Cover `mean + 2σ`, a zero-variance baseline, separate agent histories, maximum window length, fifth consecutive tool call, different-tool reset, trace-finish reset, and duplicate suppression.

- [ ] **Step 2: Run focused tests to verify red**

Run: `python -m pytest anomaly/tests/test_detectors.py -k "token or loop" -v`

Expected: FAIL because current detectors use a multiplier, cumulative tool counts, and legacy event names.

- [ ] **Step 3: Implement token and loop policies**

Use population standard deviation over prior samples and canonical token fields. Key loop state by trace and agent, count only consecutive `tool_call` events for the same tool, and clear on finish/error.

- [ ] **Step 4: Write failing silent-failure and cost tests**

Cover deterministic timeout without sleeping, finish/error cancellation, independent traces, cumulative task cost, one escalation per task, task-finish reset, and rejection of negative budgets.

- [ ] **Step 5: Run focused tests to verify red**

Run: `python -m pytest anomaly/tests/test_detectors.py -k "silent or cost" -v`

Expected: FAIL because clock injection and the cost detector do not exist.

- [ ] **Step 6: Implement silent-failure and cost policies**

Inject the clock, use canonical lifecycle enums, and add the task-budget accumulator with duplicate suppression.

- [ ] **Step 7: Verify Task 5**

Run: `python -m pytest anomaly/tests/test_detectors.py -v`

Expected: all detector tests PASS.

- [ ] **Step 8: Commit Task 5**

```bash
git add anomaly/detectors anomaly/tests/test_detectors.py
git commit -m "feat(anomaly): add statistical and budget detection"
```

### Task 6: Semantic Checking and Root-Cause Analysis

**Files:**
- Create: `anomaly/ollama.py`
- Create: `anomaly/rca.py`
- Create: `anomaly/tests/test_semantic_checker.py`
- Create: `anomaly/tests/test_rca.py`
- Modify: `anomaly/detectors/semantic_checker.py`

**Interfaces:**
- Produces: `OllamaClient(base_url, model, timeout, transport=None).generate_json(prompt: str) -> dict[str, Any] | None`.
- Produces: `SemanticChecker(client: OllamaClient).check(event) -> alert | None`.
- Produces: `RootCauseAnalyzer(client: OllamaClient).analyze(event, trace_events) -> dict[str, Any] | None` with `summary`, `likely_cause`, and `next_action`.

- [ ] **Step 1: Write failing Ollama/semantic tests**

Test valid JSON, JSON inside harmless surrounding text, markdown-only output, malformed JSON, HTTP failure, timeout, output truncation to 1,000 characters, non-finish events, and empty output. Assert all failure cases return no alert and raise nothing.

- [ ] **Step 2: Run semantic tests to verify red**

Run: `python -m pytest anomaly/tests/test_semantic_checker.py -v`

Expected: FAIL because transport injection and strict response validation do not exist.

- [ ] **Step 3: Implement shared Ollama client and semantic checker**

Move HTTP/JSON handling into `OllamaClient`; validate the required semantic response keys and keep network failures outside detector control flow.

- [ ] **Step 4: Write failing RCA tests**

Test error-only triggering, bounded trace context, exact structured result keys, malformed response, and unavailable Ollama. Assert no fabricated RCA on failure.

- [ ] **Step 5: Run RCA tests to verify red**

Run: `python -m pytest anomaly/tests/test_rca.py -v`

Expected: FAIL because the analyzer does not exist.

- [ ] **Step 6: Implement RCA and verify Task 6**

Implement `RootCauseAnalyzer` using the shared client and bounded canonical trace/error content.

Run: `python -m pytest anomaly/tests/test_semantic_checker.py anomaly/tests/test_rca.py -v`

Expected: all tests PASS.

- [ ] **Step 7: Commit Task 6**

```bash
git add anomaly/ollama.py anomaly/rca.py anomaly/detectors/semantic_checker.py anomaly/tests/test_semantic_checker.py anomaly/tests/test_rca.py
git commit -m "feat(anomaly): add semantic checks and root cause analysis"
```

### Task 7: Engine, Configuration, Alerts, and Quarantine Commands

**Files:**
- Create: `anomaly/publisher.py`
- Create: `anomaly/tests/test_engine.py`
- Modify: `anomaly/engine.py`
- Modify: `anomaly/rules/default_rules.yaml`
- Modify: `anomaly/requirements.txt`

**Interfaces:**
- Consumes: all detectors, canonical `UnifiedEvent`, and `RootCauseAnalyzer`.
- Produces: `StreamPublisher.publish(stream: str, message: dict[str, Any]) -> bool` plus collecting and Redis implementations.
- Produces: `EngineResult(alerts: list[dict], commands: list[dict], rca: dict | None)`.
- Produces: `AnomalyEngine.evaluate(event: UnifiedEvent | Mapping[str, Any]) -> EngineResult` and `process(event) -> EngineResult`.

- [ ] **Step 1: Write failing configuration tests**

Test YAML defaults of window 20, standard-deviation threshold 2, loop threshold 5, timeout 30, semantic model `phi4`, and a positive task budget. Test invalid/missing types fail at engine construction with a specific configuration error.

- [ ] **Step 2: Write failing engine integration tests**

Cover valid-event detector fan-out, invalid-event diagnostic alert, detector exception isolation, alert publication to `agent.alerts`, critical loop publication to `agent.commands`, one command per incident, re-arming after finish, bounded per-trace history, and RCA inclusion on error events.

- [ ] **Step 3: Run engine tests to verify red**

Run: `python -m pytest anomaly/tests/test_engine.py -v`

Expected: FAIL because typed results, validated configuration, publishing, diagnostics, commands, and RCA integration do not exist.

- [ ] **Step 4: Implement publishing and engine orchestration**

Add injected stream publishers, load and validate YAML at construction, validate input with `UnifiedEvent`, maintain bounded history per trace for RCA, isolate each detector, build normalized diagnostics, publish results, and emit a quarantine command for each newly critical loop incident.

- [ ] **Step 5: Verify Task 7**

Run: `python -m pytest anomaly/tests/test_engine.py anomaly/tests/test_detectors.py anomaly/tests/test_semantic_checker.py anomaly/tests/test_rca.py -v`

Expected: all anomaly tests PASS.

- [ ] **Step 6: Commit Task 7**

```bash
git add anomaly/engine.py anomaly/publisher.py anomaly/rules/default_rules.yaml anomaly/requirements.txt anomaly/tests/test_engine.py
git commit -m "feat(anomaly): integrate alerts and quarantine commands"
```

### Task 8: Redis Smoke Test, Usage Documentation, and Full Verification

**Files:**
- Create: `pytest.ini`
- Create: `adapters/tests/test_redis_smoke.py`
- Modify: `docs/setup.md`
- Modify: `docs/api-reference.md`

**Interfaces:**
- Consumes: production publishers and canonical contracts from Tasks 1-7.
- Produces: opt-in `integration` pytest marker and documented event/alert/command stream contracts.

- [ ] **Step 1: Write the opt-in Redis smoke test**

Mark `test_real_redis_event_round_trip` as `integration`; publish a canonical event, read it from `agent.events`, validate it back into `UnifiedEvent`, and skip with an explicit reason when Redis is unavailable.

- [ ] **Step 2: Verify the smoke test is excluded by default**

Run: `python -m pytest adapters/tests/test_schema.py adapters/tests/test_redis_smoke.py -v`

Expected: schema tests PASS, one integration test is deselected, and the command exits 0.

- [ ] **Step 3: Document adapter usage and stream contracts**

Update setup instructions with dependency installation and optional Redis smoke invocation. Document canonical event fields and the `agent.events`, `agent.alerts`, and `agent.commands` payload responsibilities.

- [ ] **Step 4: Run complete Teammate 1 verification**

Run: `python -m pytest adapters/tests anomaly/tests -v`

Expected: all default adapter/anomaly tests PASS, with the live Redis test deselected.

Run: `python -m compileall -q adapters anomaly`

Expected: exit code 0 and no output.

- [ ] **Step 5: Verify repository scope and formatting**

Run: `git diff --check main...HEAD`

Expected: exit code 0 and no output.

Run: `git diff --name-only main...HEAD`

Expected: only `adapters/`, `anomaly/`, `docs/`, and root `pytest.ini` paths.

- [ ] **Step 6: Commit Task 8**

```bash
git add pytest.ini adapters/tests/test_redis_smoke.py docs/setup.md docs/api-reference.md
git commit -m "docs: document telemetry and anomaly streams"
```
