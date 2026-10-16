"""FastAPI application and managed backend lifecycle."""
from contextlib import asynccontextmanager
from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from app.api.routes import agents, alerts, costs, escalations, events
from app.api.websocket.events import alerts_endpoint, events_endpoint
from app.api.websocket.manager import ws_manager
from app.config import settings
from app.core.cost_tracker import CostTracker
from app.core.database import StateStore
from app.core.event_bus import EventBus

@asynccontextmanager
async def lifespan(app: FastAPI):
    app.state.settings = settings; app.state.store = StateStore(); app.state.cost_tracker = CostTracker(app.state.store); app.state.event_bus = EventBus(app.state.store)
    await app.state.event_bus.start()
    try: yield
    finally: await app.state.event_bus.stop(); await ws_manager.close()

app = FastAPI(title="Agent Control Tower", version="0.2.0", lifespan=lifespan)
app.add_middleware(CORSMiddleware, allow_origins=settings.CORS_ORIGINS, allow_credentials=True, allow_methods=["*"], allow_headers=["*"])
for router, prefix, tag in ((agents.router, "/agents", "agents"), (costs.router, "/costs", "costs"), (escalations.router, "/escalations", "escalations")):
    app.include_router(router, prefix=prefix, tags=[tag])
app.include_router(events.router, prefix="/events", tags=["events"])
app.include_router(alerts.router, prefix="/alerts", tags=["alerts"])
app.include_router(agents.router, prefix="/api/v1/agents", tags=["agents"])
app.include_router(costs.router, prefix="/api/v1/costs", tags=["costs"])
app.include_router(escalations.router, prefix="/api/v1/escalations", tags=["escalations"])
app.add_api_websocket_route("/ws/events", events_endpoint); app.add_api_websocket_route("/ws/alerts", alerts_endpoint)
@app.get("/health", tags=["meta"])
async def health(): return {"status": "ok", "version": app.version}
@app.get("/ready", tags=["meta"])
async def ready():
    ok = await app.state.event_bus.ready()
    return {"status": "ready" if ok else "degraded", "redis": ok, "store": "in_memory"}
