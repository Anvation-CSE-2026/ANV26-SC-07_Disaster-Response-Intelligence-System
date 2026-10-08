from fastapi import APIRouter, Depends
from sqlalchemy.orm import Session
from app.models.database import get_db
from app.models.schemas import ScenarioApply, ScenarioEscalate, FullUpdateResponse
from app.services.simulation import apply_scenario, reset_scenario, auto_escalate
from app.services.intelligence_engine import process_update
from app.websocket.manager import manager

router = APIRouter(prefix="/api/scenario", tags=["scenario"])

@router.post("/apply", response_model=FullUpdateResponse)
async def api_apply_scenario(params: ScenarioApply, db: Session = Depends(get_db)):
    apply_scenario(db, params)
    update_data = process_update(db)
    await manager.broadcast_all({"type": "full_update", "data": update_data})
    return update_data

@router.post("/reset")
async def api_reset_scenario(db: Session = Depends(get_db)):
    reset_scenario(db)
    update_data = process_update(db)
    await manager.broadcast_all({"type": "full_update", "data": update_data})
    return {"message": "Scenario reset to moderate"}

@router.post("/auto-escalate")
async def api_auto_escalate(params: ScenarioEscalate, db: Session = Depends(get_db)):
    auto_escalate(db, params.stage)
    update_data = process_update(db)
    await manager.broadcast_all({"type": "full_update", "data": update_data})
    return {"message": f"Auto escalated to stage {params.stage}"}
