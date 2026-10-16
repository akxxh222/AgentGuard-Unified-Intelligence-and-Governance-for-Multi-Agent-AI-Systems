from fastapi import APIRouter, Query, Request

router = APIRouter()

@router.get("")
async def list_alerts(request: Request, limit: int = Query(100, ge=1, le=100)):
    """Return newest in-memory failure/governance alerts first."""
    return await request.app.state.store.recent_alerts(limit)
