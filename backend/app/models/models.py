from sqlalchemy import Boolean, Column, Integer, String, Float, ForeignKey, DateTime, Text
from sqlalchemy.orm import relationship
from datetime import datetime, timezone
from app.models.database import Base

def utcnow():
    return datetime.now(timezone.utc)

class Disaster(Base):
    __tablename__ = 'disasters'
    id = Column(Integer, primary_key=True, autoincrement=True)
    name = Column(String(100))
    type = Column(String(50))  # flood, fire, earthquake, cyclone, landslide, industrial
    status = Column(String(20))  # active, resolved, monitoring
    description = Column(Text, nullable=True)
    created_at = Column(DateTime, default=utcnow)
    updated_at = Column(DateTime, default=utcnow, onupdate=utcnow)

class Zone(Base):
    __tablename__ = 'zones'
    id = Column(Integer, primary_key=True)
    name = Column(String(100))
    disaster_id = Column(Integer, ForeignKey('disasters.id'))
    latitude = Column(Float)
    longitude = Column(Float)
    population = Column(Integer)
    area_sqkm = Column(Float)
    current_risk_score = Column(Float, default=0)
    risk_level = Column(String(20), default='low')  # low, medium, high, critical
    predicted_risk_15 = Column(Float, default=0)
    predicted_risk_30 = Column(Float, default=0)
    trend = Column(String(20), default='stable')  # increasing, decreasing, stable, rapid_increase
    accessibility = Column(Float, default=1.0)  # 0.0 (inaccessible) to 1.0 (fully accessible)
    help_request_count = Column(Integer, default=0)
    response_status = Column(String(30), default='monitoring')  # monitoring, responding, evacuating, secured
    population_exposure = Column(String(20), default='low')  # low, medium, high
    created_at = Column(DateTime, default=utcnow)
    updated_at = Column(DateTime, default=utcnow, onupdate=utcnow)

class HazardReading(Base):
    __tablename__ = 'hazard_readings'
    id = Column(Integer, primary_key=True)
    zone_id = Column(Integer, ForeignKey('zones.id'))
    disaster_id = Column(Integer, ForeignKey('disasters.id'))
    timestamp = Column(DateTime, default=utcnow)
    water_level = Column(Float, default=0)  # meters
    rainfall = Column(Float, default=0)  # mm/hr
    water_rise_rate = Column(Float, default=0)  # m/hr
    param_1 = Column(Float, nullable=True)  # fire_intensity, magnitude, wind_speed
    param_2 = Column(Float, nullable=True)  # spread_rate, building_damage, storm_distance
    param_3 = Column(Float, nullable=True)  # wind_speed, aftershock_risk, flood_risk

class RiskAssessment(Base):
    __tablename__ = 'risk_assessments'
    id = Column(Integer, primary_key=True)
    zone_id = Column(Integer, ForeignKey('zones.id'))
    timestamp = Column(DateTime, default=utcnow)
    risk_score = Column(Float)
    risk_level = Column(String(20))
    water_level_factor = Column(Float)
    rainfall_factor = Column(Float)
    rise_rate_factor = Column(Float)
    population_factor = Column(Float)
    accessibility_factor = Column(Float)
    help_request_factor = Column(Float)
    factors_json = Column(Text, nullable=True)  # JSON string of all factors

class Prediction(Base):
    __tablename__ = 'predictions'
    id = Column(Integer, primary_key=True)
    zone_id = Column(Integer, ForeignKey('zones.id'))
    timestamp = Column(DateTime, default=utcnow)
    current_risk = Column(Float)
    predicted_15min = Column(Float)
    predicted_30min = Column(Float)
    trend = Column(String(20))
    confidence = Column(Float, default=0.7)

class Resource(Base):
    __tablename__ = 'resources'
    id = Column(Integer, primary_key=True)
    name = Column(String(100))
    type = Column(String(50))  # rescue_team, ambulance, boat
    status = Column(String(20), default='available')  # available, assigned, on_site, busy, returning
    current_zone_id = Column(Integer, ForeignKey('zones.id'), nullable=True)
    assigned_zone_id = Column(Integer, ForeignKey('zones.id'), nullable=True)
    latitude = Column(Float)
    longitude = Column(Float)
    capacity = Column(Integer, default=1)
    speed_kmh = Column(Float, default=40)
    created_at = Column(DateTime, default=utcnow)
    updated_at = Column(DateTime, default=utcnow, onupdate=utcnow)

class ResourceAssignment(Base):
    __tablename__ = 'resource_assignments'
    id = Column(Integer, primary_key=True)
    resource_id = Column(Integer, ForeignKey('resources.id'))
    zone_id = Column(Integer, ForeignKey('zones.id'))
    priority = Column(Integer)
    status = Column(String(20), default='recommended')  # recommended, assigned, active, completed
    reason = Column(Text, nullable=True)
    assigned_at = Column(DateTime, default=utcnow)
    completed_at = Column(DateTime, nullable=True)

class Road(Base):
    __tablename__ = 'roads'
    id = Column(Integer, primary_key=True)
    name = Column(String(100))
    from_lat = Column(Float)
    from_lng = Column(Float)
    to_lat = Column(Float)
    to_lng = Column(Float)
    zone_id = Column(Integer, ForeignKey('zones.id'), nullable=True)
    status = Column(String(20), default='open')  # open, blocked, flooded, damaged
    updated_at = Column(DateTime, default=utcnow, onupdate=utcnow)

class Shelter(Base):
    __tablename__ = 'shelters'
    id = Column(Integer, primary_key=True)
    name = Column(String(200))
    zone_id = Column(Integer, ForeignKey('zones.id'), nullable=True)
    latitude = Column(Float)
    longitude = Column(Float)
    capacity = Column(Integer)
    current_occupancy = Column(Integer, default=0)
    status = Column(String(20), default='open')  # open, full, closed
    contact = Column(String(100), nullable=True)

class Hospital(Base):
    __tablename__ = 'hospitals'
    id = Column(Integer, primary_key=True)
    name = Column(String(200))
    latitude = Column(Float)
    longitude = Column(Float)
    capacity = Column(Integer)
    status = Column(String(20), default='operational')

class Citizen(Base):
    __tablename__ = 'citizens'
    id = Column(Integer, primary_key=True)
    name = Column(String(100))
    phone = Column(String(20), nullable=True)
    zone_id = Column(Integer, ForeignKey('zones.id'), nullable=True)
    latitude = Column(Float, nullable=True)
    longitude = Column(Float, nullable=True)
    status = Column(String(20), default='unknown')  # safe, needs_help, evacuated, unknown
    last_update = Column(DateTime, nullable=True)

class HelpRequest(Base):
    __tablename__ = 'help_requests'
    id = Column(Integer, primary_key=True)
    citizen_id = Column(Integer, ForeignKey('citizens.id'), nullable=True)
    zone_id = Column(Integer, ForeignKey('zones.id'))
    assigned_resource_id = Column(Integer, ForeignKey('resources.id'), nullable=True)
    type = Column(String(50))  # rescue, medical, food_water, other
    description = Column(Text, nullable=True)
    status = Column(String(20), default='pending')  # pending, acknowledged, dispatched, resolved
    latitude = Column(Float)
    longitude = Column(Float)
    priority = Column(Integer, default=3)  # 1=highest
    created_at = Column(DateTime, default=utcnow)
    resolved_at = Column(DateTime, nullable=True)

class Alert(Base):
    __tablename__ = 'alerts'
    id = Column(Integer, primary_key=True)
    type = Column(String(50))  # critical, warning, info, resource, road, citizen
    severity = Column(String(20))  # critical, high, medium, low
    message = Column(Text)
    zone_id = Column(Integer, ForeignKey('zones.id'), nullable=True)
    target_role = Column(String(20), default='all')  # all, admin, rescue_team, citizen
    is_read = Column(Boolean, default=False)
    created_at = Column(DateTime, default=utcnow)

class TeamStatusUpdate(Base):
    __tablename__ = 'team_status_updates'
    id = Column(Integer, primary_key=True)
    resource_id = Column(Integer, ForeignKey('resources.id'))
    old_status = Column(String(20))
    new_status = Column(String(20))
    timestamp = Column(DateTime, default=utcnow)
    notes = Column(Text, nullable=True)
