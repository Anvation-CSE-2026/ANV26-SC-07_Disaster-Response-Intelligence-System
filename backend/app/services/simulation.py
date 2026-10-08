from sqlalchemy.orm import Session
from app.models.models import HazardReading, Road, HelpRequest, Zone, Disaster
from app.models.schemas import ScenarioApply

def apply_scenario(db: Session, params: ScenarioApply):
    # Get active disaster
    disaster = db.query(Disaster).filter(Disaster.status == 'active').first()
    disaster_id = disaster.id if disaster else 1

    reading = HazardReading(
        zone_id=params.zone_id,
        disaster_id=disaster_id,
        water_level=params.water_level,
        rainfall=params.rainfall,
        water_rise_rate=params.rise_rate
    )
    db.add(reading)
    
    for rb in params.road_blocks:
        road = db.query(Road).filter(Road.id == rb.road_id).first()
        if road:
            road.status = rb.status
            # Update zone accessibility based on road status
            if road.zone_id:
                zone = db.query(Zone).filter(Zone.id == road.zone_id).first()
                if zone:
                    blocked_roads = db.query(Road).filter(
                        Road.zone_id == zone.id,
                        Road.status.in_(['blocked', 'flooded', 'damaged'])
                    ).count()
                    total_roads = db.query(Road).filter(Road.zone_id == zone.id).count()
                    if total_roads > 0:
                        zone.accessibility = max(0.1, 1.0 - (blocked_roads / total_roads))
                    
    # Generate help requests
    if params.help_requests > 0:
        zone = db.query(Zone).filter(Zone.id == params.zone_id).first()
        for _ in range(params.help_requests):
            req = HelpRequest(
                zone_id=params.zone_id,
                type='rescue',
                latitude=zone.latitude + 0.002 if zone else 0.0,
                longitude=zone.longitude + 0.002 if zone else 0.0,
                priority=1
            )
            db.add(req)
    
    # Update zone help_request_count
    zone = db.query(Zone).filter(Zone.id == params.zone_id).first()
    if zone:
        pending_count = db.query(HelpRequest).filter(
            HelpRequest.zone_id == params.zone_id,
            HelpRequest.status == 'pending'
        ).count()
        zone.help_request_count = pending_count + params.help_requests
        
        # Update population exposure based on water level
        if params.water_level >= 3.0:
            zone.population_exposure = 'high'
        elif params.water_level >= 1.5:
            zone.population_exposure = 'medium'
        else:
            zone.population_exposure = 'low'
            
    db.commit()

def reset_scenario(db: Session):
    zones = db.query(Zone).all()
    disaster = db.query(Disaster).filter(Disaster.status == 'active').first()
    disaster_id = disaster.id if disaster else 1
    
    initial_data = {
        1: {'water_level': 1.2, 'rainfall': 25, 'rise_rate': 0.1},
        2: {'water_level': 2.0, 'rainfall': 45, 'rise_rate': 0.3},
        3: {'water_level': 1.5, 'rainfall': 35, 'rise_rate': 0.15},
        4: {'water_level': 0.8, 'rainfall': 15, 'rise_rate': 0.05},
        5: {'water_level': 1.8, 'rainfall': 40, 'rise_rate': 0.25},
    }
    
    for z in zones:
        data = initial_data.get(z.id, {'water_level': 1.0, 'rainfall': 20, 'rise_rate': 0.05})
        reading = HazardReading(
            zone_id=z.id,
            disaster_id=disaster_id,
            water_level=data['water_level'],
            rainfall=data['rainfall'],
            water_rise_rate=data['rise_rate']
        )
        db.add(reading)
        z.help_request_count = 0
        z.accessibility = 1.0
        z.population_exposure = 'medium' if z.population >= 25000 else 'low'
        
    roads = db.query(Road).all()
    for r in roads:
        r.status = 'open'
        
    # Clear pending help requests
    db.query(HelpRequest).filter(HelpRequest.status == 'pending').delete()
    db.commit()

def auto_escalate(db: Session, stage: int):
    zones = db.query(Zone).all()
    if not zones or len(zones) < 2:
        return
    
    target_zone = zones[1]  # Zone B (Bellandur)
    
    if stage == 1:
        params = ScenarioApply(
            zone_id=target_zone.id, water_level=1.5, rainfall=30,
            rise_rate=0.1, road_blocks=[], help_requests=2
        )
    elif stage == 2:
        roads = db.query(Road).filter(Road.zone_id == target_zone.id).all()
        rbs = [{'road_id': r.id, 'status': 'flooded'} for r in roads[:1]]
        params = ScenarioApply(
            zone_id=target_zone.id, water_level=2.8, rainfall=90,
            rise_rate=0.4, road_blocks=rbs, help_requests=5
        )
    elif stage == 3:
        roads = db.query(Road).filter(Road.zone_id == target_zone.id).all()
        rbs = [{'road_id': r.id, 'status': 'blocked'} for r in roads]
        params = ScenarioApply(
            zone_id=target_zone.id, water_level=4.0, rainfall=170,
            rise_rate=0.7, road_blocks=rbs, help_requests=10
        )
    else:
        return
        
    apply_scenario(db, params)
