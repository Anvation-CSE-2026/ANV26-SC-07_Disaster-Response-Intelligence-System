from pydantic import BaseModel, ConfigDict
from typing import Optional, List, Dict, Any
from datetime import datetime

class ZoneResponse(BaseModel):
    id: int
    name: str
    latitude: float
    longitude: float
    population: int
    current_risk_score: float
    risk_level: str
    predicted_risk_30: float
    trend: str
    accessibility: float
    help_request_count: int
    response_status: str
    population_exposure: str
    
    model_config = ConfigDict(from_attributes=True)

class ZoneCreate(BaseModel):
    name: str
    latitude: float
    longitude: float
    population: int
    area_sqkm: float
    disaster_id: Optional[int] = 1

class HazardReadingResponse(BaseModel):
    id: int
    zone_id: int
    timestamp: datetime
    water_level: float
    rainfall: float
    water_rise_rate: float
    
    model_config = ConfigDict(from_attributes=True)

class ZoneDetail(ZoneResponse):
    area_sqkm: float
    population_exposure: str
    disaster_id: Optional[int]
    
    model_config = ConfigDict(from_attributes=True)

class RiskAssessmentResponse(BaseModel):
    id: int
    zone_id: int
    timestamp: datetime
    risk_score: float
    risk_level: str
    factors_json: Optional[str]
    
    model_config = ConfigDict(from_attributes=True)

class PredictionResponse(BaseModel):
    id: int
    zone_id: int
    timestamp: datetime
    current_risk: float
    predicted_15min: float
    predicted_30min: float
    trend: str
    confidence: float
    
    model_config = ConfigDict(from_attributes=True)

class PriorityResponse(BaseModel):
    zone_id: int
    zone_name: str
    priority_score: float
    priority_factors: Dict[str, Any]
    recommended_resource_type: Optional[str]
    
class ResourceResponse(BaseModel):
    id: int
    name: str
    type: str
    capacity: int
    status: str
    current_zone_id: Optional[int]
    assigned_zone_id: Optional[int]
    latitude: float
    longitude: float
    model_config = ConfigDict(from_attributes=True)

class ResourceCreate(BaseModel):
    name: str
    type: str
    capacity: int
    latitude: float
    longitude: float

class ResourceAssignmentResponse(BaseModel):
    id: int
    resource_id: int
    zone_id: int
    priority: int
    status: str
    reason: Optional[str]
    
    model_config = ConfigDict(from_attributes=True)

class RoadResponse(BaseModel):
    id: int
    name: str
    from_lat: float
    from_lng: float
    to_lat: float
    to_lng: float
    status: str
    
    model_config = ConfigDict(from_attributes=True)

class ShelterResponse(BaseModel):
    id: int
    name: str
    latitude: float
    longitude: float
    capacity: int
    current_occupancy: int
    status: str
    
    model_config = ConfigDict(from_attributes=True)

class HospitalResponse(BaseModel):
    id: int
    name: str
    latitude: float
    longitude: float
    capacity: int
    status: str
    
    model_config = ConfigDict(from_attributes=True)

class AlertCreate(BaseModel):
    type: str
    severity: str
    message: str
    zone_id: Optional[int] = None
    target_role: str = 'all'

class AlertResponse(BaseModel):
    id: int
    type: str
    severity: str
    message: str
    zone_id: Optional[int]
    zone_name: Optional[str] = None
    target_role: str
    is_read: bool
    created_at: datetime
    
    model_config = ConfigDict(from_attributes=True)

class HelpRequestCreate(BaseModel):
    zone_id: int
    type: str
    description: Optional[str] = None
    latitude: float
    longitude: float
    citizen_id: Optional[int] = None

class HelpRequestResponse(BaseModel):
    id: int
    zone_id: int
    citizen_id: Optional[int] = None
    assigned_resource_id: Optional[int] = None
    type: str
    status: str
    description: Optional[str]
    latitude: float
    longitude: float
    priority: int
    created_at: Optional[str] = None
    resolved_at: Optional[str] = None
    # Enriched fields (populated by the API, not ORM)
    citizen_name: Optional[str] = None
    zone_name: Optional[str] = None
    resource_name: Optional[str] = None
    
    model_config = ConfigDict(from_attributes=True)

class CitizenReportCreate(BaseModel):
    name: str
    phone: Optional[str] = None
    zone_id: Optional[int] = None
    latitude: Optional[float] = None
    longitude: Optional[float] = None
    status: str

class CitizenSafeCreate(BaseModel):
    citizen_id: int
    shelter_id: Optional[int] = None

class TeamStatusUpdate(BaseModel):
    status: str
    notes: Optional[str] = None

class RoadBlockInput(BaseModel):
    road_id: int
    status: str

class ScenarioApply(BaseModel):
    zone_id: int
    water_level: float
    rainfall: float
    rise_rate: float
    road_blocks: List[RoadBlockInput]
    help_requests: int

class ScenarioEscalate(BaseModel):
    stage: int

class DashboardSummary(BaseModel):
    active_disaster: Optional[str]
    affected_zones: int
    critical_zones: int
    available_teams: int
    available_ambulances: int
    available_boats: int
    active_help_requests: int
    blocked_roads: int
    system_status: str
    last_updated: datetime

class FullUpdateResponse(BaseModel):
    timestamp: str
    risks: List[Dict[str, Any]]
    predictions: List[Dict[str, Any]]
    priorities: List[PriorityResponse]
    assignments: List[Dict[str, Any]]
    alerts: List[AlertResponse]
