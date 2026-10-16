"""
CrewAI event observer — hooks into CrewAI's event system to publish
agent and task events to Redis Streams.

Usage:
    from adapters.crewai.observer import ControlTowerObserver
    from crewai import Crew, Agent, Task

    observer = ControlTowerObserver()
    crew = Crew(agents=[...], tasks=[...])
    observer.attach(crew)
    crew.kickoff()
"""
import os
import time
from typing import Any

from adapters.base import BaseAdapter
from adapters.otel.schema import EventStatus, EventType, Framework
from adapters.publisher import EventPublisher, RedisEventPublisher

REDIS_URL = os.getenv("REDIS_URL", "redis://localhost:6379")
REDIS_STREAM_KEY = os.getenv("REDIS_STREAM_KEY", "agent.events")


class ControlTowerObserver:
    """
    CrewAI observer that captures crew/agent/task lifecycle events.
    Attaches via crewai's event hooks where available, or monkey-patches otherwise.
    """

    def __init__(
        self,
        agent_id: str = "crewai",
        agent_name: str = "",
        publisher: EventPublisher | None = None,
        task_id: str = "default",
        team_id: str = "default",
        parent_agent_id: str | None = None,
        trace_id: str | None = None,
        redis_url: str = REDIS_URL,
        stream_key: str = REDIS_STREAM_KEY,
    ) -> None:
        if publisher is None:
            import redis

            publisher = RedisEventPublisher(
                redis.from_url(redis_url, decode_responses=True),
                stream_key,
            )
        self._adapter = BaseAdapter(
            agent_id=agent_id,
            agent_name=agent_name,
            framework=Framework.CREWAI,
            publisher=publisher,
            task_id=task_id,
            team_id=team_id,
            parent_agent_id=parent_agent_id,
            trace_id=trace_id,
        )

    def _publish(self, event_type: EventType, status: EventStatus, payload: dict[str, Any]) -> None:
        self._adapter.publish_event(event_type, status, payload)

    def on_agent_action(self, agent_role: str, action: str, tool: str, tool_input: str, **kw) -> None:
        self._publish(
            EventType.TOOL_CALL,
            EventStatus.RUNNING,
            {
                "operation": "agent_action",
                "agent_role": agent_role,
                "action": action,
                "tool": tool,
                "tool_input": str(tool_input)[:500],
            },
        )

    def on_agent_finish(self, agent_role: str, output: str, **kw) -> None:
        self._publish(
            EventType.FINISH,
            EventStatus.SUCCESS,
            {"operation": "agent", "agent_role": agent_role, "output": str(output)[:1000]},
        )

    def on_task_start(self, task_description: str, agent_role: str, **kw) -> None:
        self._publish(
            EventType.START,
            EventStatus.RUNNING,
            {"operation": "task", "agent_role": agent_role, "task": task_description[:200]},
        )

    def on_task_end(self, task_description: str, agent_role: str, output: str, **kw) -> None:
        self._publish(
            EventType.FINISH,
            EventStatus.SUCCESS,
            {
                "operation": "task",
                "agent_role": agent_role,
                "task": task_description[:200],
                "output": str(output)[:1000],
            },
        )

    def on_crew_start(self, crew_name: str = "crew", **kw) -> None:
        self._publish(
            EventType.START,
            EventStatus.RUNNING,
            {"operation": "crew", "crew": crew_name},
        )

    def on_crew_end(self, crew_name: str = "crew", result: str = "", **kw) -> None:
        self._publish(
            EventType.FINISH,
            EventStatus.SUCCESS,
            {"operation": "crew", "crew": crew_name, "output": str(result)[:1000]},
        )

    def on_error(self, error: Exception, **kw: Any) -> None:
        self._publish(
            EventType.ERROR,
            EventStatus.FAILED,
            {"operation": "crew", "error": str(error)},
        )
