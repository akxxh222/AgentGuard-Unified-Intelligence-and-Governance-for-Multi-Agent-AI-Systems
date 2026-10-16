"""
Custom OpenTelemetry span exporter that publishes spans to Redis Streams.
Drop-in replacement for any OTEL exporter (console, Jaeger, etc.).
"""
import json
import os
from typing import Sequence

import redis
from opentelemetry.sdk.trace import ReadableSpan
from opentelemetry.sdk.trace.export import SpanExporter, SpanExportResult

from adapters.otel.schema import TokenUsage, UnifiedEvent

REDIS_URL = os.getenv("REDIS_URL", "redis://localhost:6379")
REDIS_STREAM_KEY = os.getenv("REDIS_STREAM_KEY", "agent_events")


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
    ) -> None:
        self._client = redis.from_url(redis_url, decode_responses=True)
        self._stream_key = stream_key
        self._max_stream_len = max_stream_len

    def export(self, spans: Sequence[ReadableSpan]) -> SpanExportResult:
        try:
            pipe = self._client.pipeline(transaction=False)
            for span in spans:
                event = self._span_to_event(span)
                pipe.xadd(
                    self._stream_key,
                    event.to_redis_payload(),
                    maxlen=self._max_stream_len,
                    approximate=True,
                )
            pipe.execute()
            return SpanExportResult.SUCCESS
        except Exception:
            return SpanExportResult.FAILURE

    def shutdown(self) -> None:
        self._client.close()

    def _span_to_event(self, span: ReadableSpan) -> UnifiedEvent:
        attrs = dict(span.attributes or {})

        # Extract token usage from span attributes (GenAI semantic conventions)
        token_usage = None
        if "gen_ai.usage.prompt_tokens" in attrs or "gen_ai.usage.input_tokens" in attrs:
            prompt = attrs.get("gen_ai.usage.prompt_tokens", attrs.get("gen_ai.usage.input_tokens", 0))
            completion = attrs.get("gen_ai.usage.completion_tokens", attrs.get("gen_ai.usage.output_tokens", 0))
            token_usage = TokenUsage(
                prompt_tokens=int(prompt),
                completion_tokens=int(completion),
                total_tokens=int(prompt) + int(completion),
            )

        return UnifiedEvent(
            event_type=span.name,
            agent_id=str(attrs.get("agent.id", attrs.get("resource.agent.id", "unknown"))),
            agent_name=str(attrs.get("agent.name", "")),
            framework="otel",
            model=str(attrs.get("gen_ai.request.model", attrs.get("llm.model_name", ""))),
            task_id=str(attrs.get("task.id", "")),
            token_usage=token_usage,
            payload={
                "span_id": format(span.context.span_id, "016x") if span.context else "",
                "trace_id": format(span.context.trace_id, "032x") if span.context else "",
                "status": span.status.status_code.name if span.status else "UNSET",
                "duration_ms": (
                    (span.end_time - span.start_time) / 1e6
                    if span.end_time and span.start_time
                    else None
                ),
                "attributes": attrs,
            },
        )
