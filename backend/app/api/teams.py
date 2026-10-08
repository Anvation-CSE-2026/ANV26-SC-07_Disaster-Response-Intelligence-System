from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session
from typing import List
from pydantic import BaseModel
from app.models.database import get_db
from app.models.models import Resource, TeamStatusUpdate as TeamStatusUpdateModel
from app.models.schemas import ResourceResponse, TeamStatusUpdate
from app.websocket.manager import manager

router = APIRouter(prefix="/api/teams", tags=["teams"])

class LocationUpdate(BaseModel):
    latitude: float
    longitude: float

@router.get("", response_model=List[ResourceResponse])
def get_teams(db: Session = Depends(get_db)):
    return db.query(Resource).filter(Resource.type == 'rescue_team').all()

from app.models.models import Zone, HelpRequest
from app.services.risk_assessment import calculate_zone_risk
from app.services.priority import calculate_priorities

@router.put("/{team_id}/status")
async def update_team_status(team_id: int, status_update: TeamStatusUpdate, db: Session = Depends(get_db)):
    team = db.query(Resource).filter(Resource.id == team_id).first()
    if not team:
        raise HTTPException(status_code=404, detail="Team not found")
        
    old_status = team.status
    team.status = status_update.status
    
    # If a team completes a rescue and becomes available
    if status_update.status == 'available' and team.assigned_zone_id:
        zone = db.query(Zone).filter(Zone.id == team.assigned_zone_id).first()
        if zone:
            # Resolve all pending help requests in this zone
            db.query(HelpRequest).filter(HelpRequest.zone_id == zone.id, HelpRequest.status == 'pending').update({"status": "resolved"})
            zone.help_request_count = 0
            db.commit()
            # Recalculate risk for this zone since help requests are 0
            calculate_zone_risk(db, zone.id)
            calculate_priorities(db) # Force priority recalculation
            
        team.assigned_zone_id = None
    
    update_log = TeamStatusUpdateModel(
        resource_id=team.id,
        old_status=old_status,
        new_status=status_update.status,
        notes=status_update.notes
    )
    db.add(update_log)
    db.commit()
    
    await manager.broadcast_all({
        "type": "team_status_updated",
        "data": {
            "team_id": team.id,
            "old_status": old_status,
            "new_status": status_update.status
        }
    })
    
    return {"message": "Status updated"}

@router.put("/{team_id}/location")
async def update_team_location(team_id: int, location: LocationUpdate, db: Session = Depends(get_db)):
    team = db.query(Resource).filter(Resource.id == team_id).first()
    if not team:
        raise HTTPException(status_code=404, detail="Team not found")
        
    team.latitude = location.latitude
    team.longitude = location.longitude
    db.commit()
    
    await manager.broadcast_all({
        "type": "team_location_updated",
        "data": {
            "team_id": team.id,
            "latitude": team.latitude,
            "longitude": team.longitude
        }
    })
    
    return {"message": "Location updated"}
