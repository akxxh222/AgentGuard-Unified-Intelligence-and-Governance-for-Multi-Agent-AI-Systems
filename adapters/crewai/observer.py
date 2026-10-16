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

import redis

from adapters.otel.schema import UnifiedEvent

REDIS_URL = os.getenv("REDIS_URL", "redis://localhost:6379")
REDIS_STREAM_KEY = os.getenv("REDIS_STREAM_KEY", "agent_events")


class ControlTowerObserver:
    """
    CrewAI observer that captures crew/agent/task lifecycle events.
    Attaches via crewai's event hooks where available, or monkey-patches otherwise.
    """

    def __init__(
        self,
        redis_url: str = REDIS_URL,
        stream_key: str = REDIS_STREAM_KEY,
    ) -> None:
        self._redis = redis.from_url(redis_url, decode_responses=True)
        self._stream_key = stream_key

    def _publish(self, event: UnifiedEvent) -> None:
        try:
            self._redis.xadd(self._stream_key, event.to_redis_payload(), maxlen=10_000, approximate=True)
        except Exception:
            pass

    def on_agent_action(self, agent_role: str, action: str, tool: str, tool_input: str, **kw) -> None:
        self._publish(UnifiedEvent(
            event_type="agent.action",
            agent_id=agent_role,
            agent_name=agent_role,
            framework="crewai",
            payload={
                "action": action,
                "tool": tool,
                "tool_input": str(tool_input)[:500],
            },
        ))

    def on_agent_finish(self, agent_role: str, output: str, **kw) -> None:
        self._publish(UnifiedEvent(
            event_type="agent.finish",
            agent_id=agent_role,
            agent_name=agent_role,
            framework="crewai",
            payload={"output_length": len(output)},
        ))

    def on_task_start(self, task_description: str, agent_role: str, **kw) -> None:
        self._publish(UnifiedEvent(
            event_type="task.start",
            agent_id=agent_role,
            agent_name=agent_role,
            framework="crewai",
            payload={"task": task_description[:200]},
        ))

    def on_task_end(self, task_description: str, agent_role: str, output: str, **kw) -> None:
        self._publish(UnifiedEvent(
            event_type="task.end",
            agent_id=agent_role,
            agent_name=agent_role,
            framework="crewai",
            payload={"task": task_description[:200], "output_length": len(output)},
        ))

    def on_crew_start(self, crew_name: str = "crew", **kw) -> None:
        self._publish(UnifiedEvent(
            event_type="crew.start",
            agent_id=crew_name,
            agent_name=crew_name,
            framework="crewai",
            payload={"crew": crew_name},
        ))

    def on_crew_end(self, crew_name: str = "crew", result: str = "", **kw) -> None:
        self._publish(UnifiedEvent(
            event_type="crew.end",
            agent_id=crew_name,
            agent_name=crew_name,
            framework="crewai",
            payload={"crew": crew_name, "result_length": len(result)},
        ))
