from fastapi import APIRouter, Depends
from sqlalchemy.orm import Session
from typing import List
from app.models.database import get_db
from app.models.models import Resource, ResourceAssignment
from app.models.schemas import ResourceResponse, ResourceAssignmentResponse

router = APIRouter(prefix="/api/resources", tags=["resources"])

@router.get("", response_model=List[ResourceResponse])
def get_resources(db: Session = Depends(get_db)):
    return db.query(Resource).all()

from app.models.schemas import ResourceCreate
from datetime import datetime, timezone

@router.post("", response_model=ResourceResponse)
async def create_resource(res_in: ResourceCreate, db: Session = Depends(get_db)):
    resource = Resource(
        name=res_in.name,
        type=res_in.type,
        capacity=res_in.capacity,
        latitude=res_in.latitude,
        longitude=res_in.longitude,
        status='available',
        speed_kmh=40.0,
        created_at=datetime.now(timezone.utc),
        updated_at=datetime.now(timezone.utc)
    )
    db.add(resource)
    db.commit()
    db.refresh(resource)
    await manager.broadcast_all({"type": "resource_updated", "data": {}})
    return resource

from pydantic import BaseModel
from app.websocket.manager import manager

class ResourceAssign(BaseModel):
    zone_id: int

@router.get("/assignments", response_model=List[ResourceAssignmentResponse])
def get_assignments(db: Session = Depends(get_db)):
    return db.query(ResourceAssignment).order_by(ResourceAssignment.assigned_at.desc()).limit(50).all()

@router.put("/{resource_id}/assign")
async def manual_assign(resource_id: int, assign_data: ResourceAssign, db: Session = Depends(get_db)):
    res = db.query(Resource).filter(Resource.id == resource_id).first()
    if not res:
        return {"error": "Not found"}
    res.assigned_zone_id = assign_data.zone_id
    res.status = 'assigned'
    db.commit()
    
    await manager.broadcast_all({"type": "resource_updated", "data": {}})
    return {"message": "Assigned manually"}
