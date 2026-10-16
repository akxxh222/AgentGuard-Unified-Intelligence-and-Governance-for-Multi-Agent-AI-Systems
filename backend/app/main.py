"""
FastAPI application entry point for Agent Control Tower backend.
"""
from contextlib import asynccontextmanager

import structlog
from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware

from app.api.routes import agents, costs, escalations, tasks
from app.api.websocket.manager import ws_manager
from app.config import settings
from app.core.event_bus import EventBus

log = structlog.get_logger()


@asynccontextmanager
async def lifespan(app: FastAPI):
    """Start background services on startup, graceful shutdown on exit."""
    log.info("agent_control_tower.startup", env=settings.ENVIRONMENT)
    event_bus = EventBus()
    await event_bus.start()
    app.state.event_bus = event_bus
    yield
    log.info("agent_control_tower.shutdown")
    await event_bus.stop()


app = FastAPI(
    title="Agent Control Tower",
    description="Real-time observability & control plane for multi-agent AI systems",
    version="0.1.0",
    lifespan=lifespan,
    docs_url="/docs",
    redoc_url="/redoc",
)

app.add_middleware(
    CORSMiddleware,
    allow_origins=settings.CORS_ORIGINS,
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# REST routers
app.include_router(agents.router, prefix="/api/v1/agents", tags=["agents"])
app.include_router(tasks.router, prefix="/api/v1/tasks", tags=["tasks"])
app.include_router(costs.router, prefix="/api/v1/costs", tags=["costs"])
app.include_router(escalations.router, prefix="/api/v1/escalations", tags=["escalations"])

# WebSocket
from app.api.websocket.events import ws_endpoint  # noqa: E402
app.add_api_websocket_route("/ws", ws_endpoint)


@app.get("/health", tags=["meta"])
async def health():
    return {"status": "ok", "version": "0.1.0"}
