from fastapi import APIRouter, Depends
from sqlalchemy.orm import Session
from app.models.database import get_db
from app.models.models import Citizen
from app.models.schemas import CitizenSafeCreate, CitizenReportCreate
from datetime import datetime, timezone
from app.websocket.manager import manager

router = APIRouter(prefix="/api/citizens", tags=["citizens"])

from app.models.models import Citizen, Shelter

@router.post("/safe")
async def mark_safe(citizen_data: CitizenSafeCreate, db: Session = Depends(get_db)):
    cit = db.query(Citizen).filter(Citizen.id == citizen_data.citizen_id).first()
    if cit:
        cit.status = 'safe'
        cit.last_update = datetime.now(timezone.utc)
        
        if citizen_data.shelter_id:
            shelter = db.query(Shelter).filter(Shelter.id == citizen_data.shelter_id).first()
            if shelter:
                shelter.current_occupancy += 1
                
        db.commit()
        await manager.broadcast_all({
            "type": "citizen_status_updated",
            "data": {"citizen_id": cit.id, "status": "safe"}
        })
    return {"message": "Marked as safe"}

@router.post("/report")
async def report_incident(report: CitizenReportCreate, db: Session = Depends(get_db)):
    cit = Citizen(
        name=report.name,
        phone=report.phone,
        zone_id=report.zone_id,
        latitude=report.latitude,
        longitude=report.longitude,
        status=report.status,
        last_update=datetime.now(timezone.utc)
    )
    db.add(cit)
    db.commit()
    
    await manager.broadcast_all({
        "type": "incident_reported",
        "data": {
            "citizen_id": cit.id,
            "zone_id": report.zone_id,
            "status": report.status,
            "latitude": report.latitude,
            "longitude": report.longitude
        }
    })
    return {"message": "Incident reported", "citizen_id": cit.id}
