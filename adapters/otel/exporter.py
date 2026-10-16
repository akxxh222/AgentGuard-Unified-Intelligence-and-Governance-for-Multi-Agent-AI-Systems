"""
Custom OpenTelemetry span exporter that publishes spans to Redis Streams.
Drop-in replacement for any OTEL exporter (console, Jaeger, etc.).
"""
import os
from typing import Sequence

import redis
from opentelemetry.sdk.trace import ReadableSpan
from opentelemetry.sdk.trace.export import SpanExporter, SpanExportResult

from adapters.otel.schema import EventStatus, EventType, Framework, UnifiedEvent
from adapters.publisher import EventPublisher, RedisEventPublisher

REDIS_URL = os.getenv("REDIS_URL", "redis://localhost:6379")
REDIS_STREAM_KEY = os.getenv("REDIS_STREAM_KEY", "agent.events")


class RedisStreamExporter(SpanExporter):
    """
    Exports OTEL spans to a Redis Stream as UnifiedEvent JSON payloads.

    Usage:
        from opentelemetry.sdk.trace import TracerProvider
        from opentelemetry.sdk.trace.export import BatchSpanProcessor

        provider = TracerProvider()
        provider.add_span_processor(
            BatchSpanProcessor(RedisStreamExporter())
        )
    """

    def __init__(
        self,
        redis_url: str = REDIS_URL,
        stream_key: str = REDIS_STREAM_KEY,
        max_stream_len: int = 10_000,
        publisher: EventPublisher | None = None,
    ) -> None:
        self._client = None
        if publisher is None:
            self._client = redis.from_url(redis_url, decode_responses=True)
            publisher = RedisEventPublisher(self._client, stream_key, max_stream_len)
        self._publisher = publisher

    def export(self, spans: Sequence[ReadableSpan]) -> SpanExportResult:
        try:
            published = all(self._publisher.publish(self._span_to_event(span)) for span in spans)
        except Exception:
            published = False
        return SpanExportResult.SUCCESS if published else SpanExportResult.FAILURE

    def shutdown(self) -> None:
        if self._client is not None:
            self._client.close()

    def _span_to_event(self, span: ReadableSpan) -> UnifiedEvent:
        attrs = dict(span.attributes or {})

        prompt = int(
            attrs.get("gen_ai.usage.prompt_tokens", attrs.get("gen_ai.usage.input_tokens", 0))
        )
        completion = int(
            attrs.get(
                "gen_ai.usage.completion_tokens",
                attrs.get("gen_ai.usage.output_tokens", 0),
            )
        )
        name = span.name.lower()
        failed = bool(span.status and span.status.status_code.name == "ERROR")
        if failed:
            event_type, status = EventType.ERROR, EventStatus.FAILED
        elif "tool" in name:
            event_type, status = EventType.TOOL_CALL, EventStatus.SUCCESS
        elif "llm" in name or "gen_ai" in name:
            event_type, status = EventType.LLM_CALL, EventStatus.SUCCESS
        else:
            event_type, status = EventType.FINISH, EventStatus.SUCCESS

        trace_id = format(span.context.trace_id, "032x") if span.context else None
        task_id = str(attrs.get("task.id") or trace_id or "unknown-task")

        values = dict(
            agent_id=str(attrs.get("agent.id", attrs.get("resource.agent.id", "unknown"))),
            framework=Framework(str(attrs.get("agent.framework", "langchain"))),
            parent_agent_id=attrs.get("parent_agent.id"),
            task_id=task_id,
            team_id=str(attrs.get("team.id", "default")),
            status=status,
            event_type=event_type,
            tokens_in=prompt,
            tokens_out=completion,
            cost_usd=float(attrs.get("gen_ai.usage.cost", 0.0)),
            payload={
                "operation": span.name,
                "agent_name": str(attrs.get("agent.name", "")),
                "model": str(attrs.get("gen_ai.request.model", attrs.get("llm.model_name", ""))),
                "span_id": format(span.context.span_id, "016x") if span.context else "",
                "status": span.status.status_code.name if span.status else "UNSET",
                "duration_ms": (
                    (span.end_time - span.start_time) / 1e6
                    if span.end_time and span.start_time
                    else None
                ),
                "attributes": attrs,
            },
        )
        if trace_id:
            values["trace_id"] = trace_id
        return UnifiedEvent(**values)
