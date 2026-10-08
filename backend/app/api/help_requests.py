from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session
from typing import List
from datetime import datetime, timezone
import math
from app.models.database import get_db
from app.models.models import HelpRequest, Citizen, Zone, Resource, ResourceAssignment, Alert
from app.models.schemas import HelpRequestCreate, HelpRequestResponse
from app.websocket.manager import manager

router = APIRouter(prefix="/api/help-requests", tags=["help-requests"])

def enrich_request(req, db):
    """Add citizen_name, zone_name, resource_name to a HelpRequest ORM object."""
    data = {
        "id": req.id,
        "zone_id": req.zone_id,
        "citizen_id": req.citizen_id,
        "assigned_resource_id": req.assigned_resource_id,
        "type": req.type,
        "status": req.status,
        "description": req.description,
        "latitude": req.latitude,
        "longitude": req.longitude,
        "priority": req.priority,
        "created_at": req.created_at.isoformat() if req.created_at else None,
        "resolved_at": req.resolved_at.isoformat() if req.resolved_at else None,
    }
    # Citizen name
    if req.citizen_id:
        citizen = db.query(Citizen).filter(Citizen.id == req.citizen_id).first()
        data["citizen_name"] = citizen.name if citizen else f"Citizen #{req.citizen_id}"
    else:
        data["citizen_name"] = "Anonymous"
    # Zone name
    zone = db.query(Zone).filter(Zone.id == req.zone_id).first()
    data["zone_name"] = zone.name if zone else f"Zone {req.zone_id}"
    # Resource name
    if req.assigned_resource_id:
        resource = db.query(Resource).filter(Resource.id == req.assigned_resource_id).first()
        data["resource_name"] = resource.name if resource else None
    else:
        data["resource_name"] = None
    return data

def calc_dist(lat1, lon1, lat2, lon2):
    if lat1 is None or lon1 is None: return 9999
    p = 0.017453292519943295
    a = 0.5 - math.cos((lat2 - lat1) * p)/2 + math.cos(lat1 * p) * math.cos(lat2 * p) * (1 - math.cos((lon2 - lon1) * p)) / 2
    return 12742 * math.asin(math.sqrt(a))

@router.get("")
def get_help_requests(db: Session = Depends(get_db)):
    requests = db.query(HelpRequest).order_by(HelpRequest.created_at.desc()).all()
    return [enrich_request(r, db) for r in requests]

@router.get("/for-team/{resource_id}")
def get_requests_for_team(resource_id: int, db: Session = Depends(get_db)):
    """Get help requests assigned to a specific rescue team/resource."""
    requests = db.query(HelpRequest).filter(
        HelpRequest.assigned_resource_id == resource_id,
        HelpRequest.status.in_(['dispatched', 'acknowledged'])
    ).order_by(HelpRequest.created_at.desc()).all()
    return [enrich_request(r, db) for r in requests]

@router.post("")
async def create_help_request(req: HelpRequestCreate, db: Session = Depends(get_db)):
    new_req = HelpRequest(
        zone_id=req.zone_id,
        type=req.type,
        description=req.description,
        latitude=req.latitude,
        longitude=req.longitude,
        citizen_id=req.citizen_id,
        priority=1
    )
    db.add(new_req)
    db.commit()
    db.refresh(new_req)
    
    await manager.broadcast_all({
        "type": "help_request_created",
        "data": enrich_request(new_req, db),
        "timestamp": datetime.now(timezone.utc).isoformat()
    })
    
    return enrich_request(new_req, db)

@router.put("/{request_id}/dispatch")
async def dispatch_request(request_id: int, db: Session = Depends(get_db)):
    """Admin dispatches a pending request to the nearest available rescue team."""
    help_req = db.query(HelpRequest).filter(HelpRequest.id == request_id).first()
    if not help_req:
        raise HTTPException(status_code=404, detail="Request not found")
    
    # Find nearest available resource
    available = db.query(Resource).filter(Resource.status == 'available').all()
    if not available:
        raise HTTPException(status_code=400, detail="No available rescue resources")
    
    nearest = min(available, key=lambda r: calc_dist(r.latitude, r.longitude, help_req.latitude, help_req.longitude))
    
    # Assign
    nearest.status = 'assigned'
    nearest.assigned_zone_id = help_req.zone_id
    help_req.assigned_resource_id = nearest.id
    help_req.status = 'dispatched'
    
    assignment = ResourceAssignment(
        resource_id=nearest.id,
        zone_id=help_req.zone_id,
        priority=1,
        status='active',
        reason=f"ADMIN-DISPATCHED: {help_req.type} request #{help_req.id}"
    )
    db.add(assignment)
    
    alert = Alert(
        type="resource",
        severity="warning",
        message=f"Dispatched {nearest.name} for {help_req.type} request #{help_req.id}",
        zone_id=help_req.zone_id,
        target_role="all"
    )
    db.add(alert)
    db.commit()
    
    await manager.broadcast_all({
        "type": "full_update",
        "data": {},
        "timestamp": datetime.now(timezone.utc).isoformat()
    })
    
    return enrich_request(help_req, db)

@router.put("/{request_id}/resolve")
async def resolve_request(request_id: int, db: Session = Depends(get_db)):
    """Rescue team marks a request as resolved/completed."""
    help_req = db.query(HelpRequest).filter(HelpRequest.id == request_id).first()
    if not help_req:
        raise HTTPException(status_code=404, detail="Request not found")
    
    help_req.status = 'resolved'
    help_req.resolved_at = datetime.now(timezone.utc)
    
    # Free up the assigned resource
    if help_req.assigned_resource_id:
        resource = db.query(Resource).filter(Resource.id == help_req.assigned_resource_id).first()
        if resource:
            resource.status = 'available'
            resource.assigned_zone_id = None
    
    alert = Alert(
        type="info",
        severity="info",
        message=f"Request #{help_req.id} ({help_req.type}) resolved successfully",
        zone_id=help_req.zone_id,
        target_role="all"
    )
    db.add(alert)
    db.commit()
    
    await manager.broadcast_all({
        "type": "full_update",
        "data": {},
        "timestamp": datetime.now(timezone.utc).isoformat()
    })
    
    return enrich_request(help_req, db)
@router.delete("/{request_id}")
async def delete_request(request_id: int, db: Session = Depends(get_db)):
    """Admin deletes a help request."""
    help_req = db.query(HelpRequest).filter(HelpRequest.id == request_id).first()
    if not help_req:
        raise HTTPException(status_code=404, detail="Request not found")
        
    if help_req.assigned_resource_id:
        resource = db.query(Resource).filter(Resource.id == help_req.assigned_resource_id).first()
        if resource and resource.assigned_zone_id == help_req.zone_id:
            resource.status = 'available'
            resource.assigned_zone_id = None
            
    db.delete(help_req)
    db.commit()
    
    await manager.broadcast_all({
        "type": "full_update",
        "data": {},
        "timestamp": datetime.now(timezone.utc).isoformat()
    })
    
    return {"message": "Deleted"}
