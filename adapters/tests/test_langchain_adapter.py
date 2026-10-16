"""
Adapter test suite — LangChain tracer.
"""
from types import SimpleNamespace
from uuid import uuid4

from adapters.langchain.tracer import ControlTowerTracer
from adapters.otel.schema import EventStatus, EventType
from adapters.publisher import CollectingEventPublisher


def make_tracer(publisher=None):
    return ControlTowerTracer(
        agent_id="test-agent",
        agent_name="TestAgent",
        publisher=publisher or CollectingEventPublisher(),
        task_id="task-01",
        team_id="team-01",
    )


def test_chain_callbacks_emit_canonical_start_and_finish():
    publisher = CollectingEventPublisher()
    tracer = make_tracer(publisher)
    run_id = uuid4()
    tracer.on_chain_start({"id": ["MyChain"]}, {}, run_id=run_id)
    tracer.on_chain_end({"answer": "done"}, run_id=run_id)

    start, finish = publisher.events
    assert (start.event_type, start.status) == (EventType.START, EventStatus.RUNNING)
    assert (finish.event_type, finish.status) == (EventType.FINISH, EventStatus.SUCCESS)
    assert start.payload["operation"] == "chain"
    assert finish.trace_id == start.trace_id
    assert finish.task_id == start.task_id == "task-01"


def test_llm_end_captures_tokens_cost_and_parent_trace():
    publisher = CollectingEventPublisher()
    tracer = make_tracer(publisher)
    parent_run_id = uuid4()
    run_id = uuid4()
    tracer.on_chain_start({"id": ["MyChain"]}, {}, run_id=parent_run_id)
    tracer.on_llm_start({}, ["prompt"], run_id=run_id, parent_run_id=parent_run_id)
    response = SimpleNamespace(
        llm_output={
            "token_usage": {"prompt_tokens": 1_000_000, "completion_tokens": 1_000_000},
            "model_name": "gpt-4o",
        },
        generations=[["answer"]],
    )
    tracer.on_llm_end(response, run_id=run_id)

    chain_start, llm_start, llm_end = publisher.events
    assert llm_start.trace_id == chain_start.trace_id
    assert (llm_end.event_type, llm_end.status) == (EventType.LLM_CALL, EventStatus.SUCCESS)
    assert llm_end.tokens_in == 1_000_000
    assert llm_end.tokens_out == 1_000_000
    assert llm_end.cost_usd == 20.0
    assert llm_end.payload["model"] == "gpt-4o"


def test_tool_start_emits_canonical_tool_call():
    publisher = CollectingEventPublisher()
    tracer = make_tracer(publisher)
    run_id = uuid4()
    tracer.on_tool_start({"name": "web_search"}, "AI news", run_id=run_id)

    event = publisher.events[0]
    assert (event.event_type, event.status) == (EventType.TOOL_CALL, EventStatus.RUNNING)
    assert event.payload["tool"] == "web_search"
    assert event.trace_id
    assert event.task_id


def test_unknown_end_callback_generates_non_blank_context():
    publisher = CollectingEventPublisher()
    tracer = make_tracer(publisher)

    tracer.on_chain_end({"answer": "orphan"}, run_id=uuid4())

    event = publisher.events[0]
    assert event.trace_id
    assert event.task_id


def test_publisher_failure_does_not_escape_callback():
    class ExplodingPublisher:
        def publish(self, event):
            raise ConnectionError("offline")

    tracer = make_tracer(ExplodingPublisher())
    tracer.on_llm_error(RuntimeError("model failed"), run_id=uuid4())
