from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session
from typing import List
from app.models.database import get_db
from app.models.models import Zone, HazardReading
from app.models.schemas import ZoneResponse, ZoneDetail

router = APIRouter(prefix="/api/zones", tags=["zones"])

@router.get("", response_model=List[ZoneResponse])
def get_zones(db: Session = Depends(get_db)):
    zones = db.query(Zone).all()
    return zones

@router.get("/{zone_id}", response_model=ZoneDetail)
def get_zone_detail(zone_id: int, db: Session = Depends(get_db)):
    zone = db.query(Zone).filter(Zone.id == zone_id).first()
    if not zone:
        raise HTTPException(status_code=404, detail="Zone not found")
    return zone

from app.models.schemas import ZoneCreate
from datetime import datetime, timezone
from app.services.intelligence_engine import process_update
from app.websocket.manager import manager

@router.post("", response_model=ZoneResponse)
async def create_zone(zone_in: ZoneCreate, db: Session = Depends(get_db)):
    # Create the zone
    zone = Zone(
        name=zone_in.name,
        latitude=zone_in.latitude,
        longitude=zone_in.longitude,
        population=zone_in.population,
        area_sqkm=zone_in.area_sqkm,
        disaster_id=zone_in.disaster_id,
        current_risk_score=0,
        risk_level='low',
        created_at=datetime.now(timezone.utc),
        updated_at=datetime.now(timezone.utc)
    )
    db.add(zone)
    db.commit()
    db.refresh(zone)
    
    # Create a baseline hazard reading for this new zone so the simulation doesn't crash
    hr = HazardReading(
        zone_id=zone.id,
        disaster_id=zone.disaster_id,
        water_level=0.1,
        rainfall=0,
        water_rise_rate=0.0
    )
    db.add(hr)
    db.commit()
    
    # Force process update
    process_update(db)
    await manager.broadcast_all({"type": "full_update", "data": {}, "timestamp": datetime.now(timezone.utc).isoformat()})
    return zone
    
@router.delete("/{zone_id}")
async def delete_zone(zone_id: int, db: Session = Depends(get_db)):
    zone = db.query(Zone).filter(Zone.id == zone_id).first()
    if not zone:
        raise HTTPException(status_code=404, detail="Zone not found")
        
    # Delete related records to avoid foreign key constraint failures
    from app.models.models import HazardReading, RiskAssessment, Prediction, ResourceAssignment, HelpRequest, Citizen, Alert, Shelter, Road, Resource
    
    # 1. Reassign resources currently at this zone
    resources = db.query(Resource).filter((Resource.current_zone_id == zone_id) | (Resource.assigned_zone_id == zone_id)).all()
    for r in resources:
        if r.current_zone_id == zone_id: r.current_zone_id = None
        if r.assigned_zone_id == zone_id: r.assigned_zone_id = None
    
    # 2. Delete dependent records
    db.query(HazardReading).filter(HazardReading.zone_id == zone_id).delete()
    db.query(RiskAssessment).filter(RiskAssessment.zone_id == zone_id).delete()
    db.query(Prediction).filter(Prediction.zone_id == zone_id).delete()
    db.query(ResourceAssignment).filter(ResourceAssignment.zone_id == zone_id).delete()
    db.query(HelpRequest).filter(HelpRequest.zone_id == zone_id).delete()
    db.query(Alert).filter(Alert.zone_id == zone_id).delete()
    
    db.query(Shelter).filter(Shelter.zone_id == zone_id).update({"zone_id": None})
    db.query(Road).filter(Road.zone_id == zone_id).update({"zone_id": None})
    db.query(Citizen).filter(Citizen.zone_id == zone_id).update({"zone_id": None})
    
    # 3. Delete the zone
    db.delete(zone)
    db.commit()
    
    # 4. Process update and broadcast
    process_update(db)
    await manager.broadcast_all({"type": "full_update", "data": {}, "timestamp": datetime.now(timezone.utc).isoformat()})
    
    return {"status": "success"}
