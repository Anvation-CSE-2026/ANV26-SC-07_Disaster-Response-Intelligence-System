from fastapi import APIRouter, Depends
from sqlalchemy.orm import Session
from datetime import datetime, timezone
from app.models.database import get_db
from app.models.models import Disaster, Zone, Resource, HelpRequest, Road
from app.models.schemas import DashboardSummary

router = APIRouter(prefix="/api/dashboard", tags=["dashboard"])

@router.get("/summary", response_model=DashboardSummary)
def get_dashboard_summary(db: Session = Depends(get_db)):
    disaster = db.query(Disaster).filter(Disaster.status == 'active').first()
    active_disaster_name = disaster.name if disaster else "None"
    
    affected_zones = db.query(Zone).count()
    critical_zones = db.query(Zone).filter(Zone.risk_level == 'critical').count()
    
    available_teams = db.query(Resource).filter(Resource.type == 'rescue_team', Resource.status == 'available').count()
    available_ambulances = db.query(Resource).filter(Resource.type == 'ambulance', Resource.status == 'available').count()
    available_boats = db.query(Resource).filter(Resource.type == 'boat', Resource.status == 'available').count()
    
    active_help_requests = db.query(HelpRequest).filter(HelpRequest.status == 'pending').count()
    blocked_roads = db.query(Road).filter(Road.status.in_(['blocked', 'damaged', 'flooded'])).count()
    
    return DashboardSummary(
        active_disaster=active_disaster_name,
        affected_zones=affected_zones,
        critical_zones=critical_zones,
        available_teams=available_teams,
        available_ambulances=available_ambulances,
        available_boats=available_boats,
        active_help_requests=active_help_requests,
        blocked_roads=blocked_roads,
        system_status="Operational",
        last_updated=datetime.now(timezone.utc)
    )
