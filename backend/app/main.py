import os
from fastapi import FastAPI, WebSocket, WebSocketDisconnect
from fastapi.middleware.cors import CORSMiddleware
from contextlib import asynccontextmanager

from app.models.database import init_db
from app.websocket.manager import manager

from app.api.zones import router as zones_router
from app.api.risk import router as risk_router
from app.api.predictions import router as predictions_router
from app.api.priorities import router as priorities_router
from app.api.resources import router as resources_router
from app.api.alerts import router as alerts_router
from app.api.citizens import router as citizens_router
from app.api.teams import router as teams_router
from app.api.dashboard import router as dashboard_router
from app.api.routes_api import router as routes_router
from app.api.scenario import router as scenario_router
from app.api.help_requests import router as help_requests_router
from app.api.shelters import router as shelters_router
from app.api.roads import router as roads_router

@asynccontextmanager
async def lifespan(app: FastAPI):
    # Initialize DB on startup
    init_db()
    
    if os.environ.get("VERCEL"):
        from app.seed_data import seed
        from app.models.database import SessionLocal
        from app.models.models import Zone
        db = SessionLocal()
        try:
            if not db.query(Zone).first():
                seed()
        finally:
            db.close()
            
    yield

app = FastAPI(title="DRIS Backend API", lifespan=lifespan)

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

app.include_router(dashboard_router)
app.include_router(zones_router)
app.include_router(risk_router)
app.include_router(predictions_router)
app.include_router(priorities_router)
app.include_router(resources_router)
app.include_router(alerts_router)
app.include_router(citizens_router)
app.include_router(teams_router)
app.include_router(routes_router)
app.include_router(scenario_router)
app.include_router(help_requests_router)
app.include_router(shelters_router)
app.include_router(roads_router)

@app.get("/api/health")
def health_check():
    return {"status": "ok"}

@app.websocket("/ws/{client_type}")
async def websocket_endpoint(websocket: WebSocket, client_type: str):
    await manager.connect(websocket, client_type)
    try:
        while True:
            data = await websocket.receive_text()
            # Handle incoming messages if needed
    except WebSocketDisconnect:
        manager.disconnect(websocket, client_type)
