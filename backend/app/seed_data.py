from sqlalchemy.orm import Session
from app.models.database import SessionLocal, init_db, engine
from app.models.models import (
    Disaster, Zone, HazardReading, Resource, Road, Shelter, Hospital, HelpRequest, Citizen, Alert, Base
)
from app.services.intelligence_engine import process_update
import random
from datetime import datetime, timedelta, timezone

def clear_db():
    Base.metadata.drop_all(bind=engine)
    init_db()

def seed():
    clear_db()
    db = SessionLocal()
    
    # Disaster
    disaster = Disaster(
        name='Karnataka Disaster Response (Simulated)',
        type='flood',
        status='active',
        description='State-wide intelligent monitoring.'
    )
    db.add(disaster)
    db.commit()

    # Zones
    zones = [
        # Main Districts
        Zone(name='Bengaluru District', disaster_id=disaster.id, latitude=12.9716, longitude=77.5946, population=13000000, area_sqkm=741.0),
        Zone(name='Mangaluru District', disaster_id=disaster.id, latitude=12.8698, longitude=74.8430, population=700000, area_sqkm=200.0),
        Zone(name='Udupi District', disaster_id=disaster.id, latitude=13.3409, longitude=74.7421, population=150000, area_sqkm=70.0),
        Zone(name='Kodagu District', disaster_id=disaster.id, latitude=12.3375, longitude=75.8069, population=550000, area_sqkm=4102.0),
        Zone(name='Mysuru District', disaster_id=disaster.id, latitude=12.2958, longitude=76.6394, population=1200000, area_sqkm=152.0),
        
        # Predefined Sub-Zones (Bengaluru)
        Zone(name='Koramangala (Bengaluru)', disaster_id=disaster.id, latitude=12.9352, longitude=77.6245, population=25000, area_sqkm=5.0),
        Zone(name='Bellandur (Bengaluru)', disaster_id=disaster.id, latitude=12.9256, longitude=77.6762, population=35000, area_sqkm=8.0),
        Zone(name='Whitefield (Bengaluru)', disaster_id=disaster.id, latitude=12.9698, longitude=77.7500, population=20000, area_sqkm=12.0),
        
        # Predefined Sub-Zones (Mangaluru)
        Zone(name='Panambur (Mangaluru)', disaster_id=disaster.id, latitude=12.9515, longitude=74.8141, population=15000, area_sqkm=10.0),
        Zone(name='Surathkal (Mangaluru)', disaster_id=disaster.id, latitude=13.0033, longitude=74.7946, population=20000, area_sqkm=15.0)
    ]
    db.add_all(zones)
    db.commit()

    # Initial Readings
    readings = []
    # Districts
    readings.append(HazardReading(zone_id=zones[0].id, disaster_id=disaster.id, water_level=1.2, rainfall=25, water_rise_rate=0.1))
    readings.append(HazardReading(zone_id=zones[1].id, disaster_id=disaster.id, water_level=3.0, rainfall=85, water_rise_rate=0.4))
    readings.append(HazardReading(zone_id=zones[2].id, disaster_id=disaster.id, water_level=2.5, rainfall=60, water_rise_rate=0.3))
    readings.append(HazardReading(zone_id=zones[3].id, disaster_id=disaster.id, water_level=1.8, rainfall=120, water_rise_rate=0.2))
    readings.append(HazardReading(zone_id=zones[4].id, disaster_id=disaster.id, water_level=0.5, rainfall=10, water_rise_rate=0.05))
    
    # Sub-zones
    readings.append(HazardReading(zone_id=zones[5].id, disaster_id=disaster.id, water_level=1.5, rainfall=30, water_rise_rate=0.15))
    readings.append(HazardReading(zone_id=zones[6].id, disaster_id=disaster.id, water_level=2.1, rainfall=45, water_rise_rate=0.25))
    readings.append(HazardReading(zone_id=zones[7].id, disaster_id=disaster.id, water_level=1.1, rainfall=20, water_rise_rate=0.08))
    readings.append(HazardReading(zone_id=zones[8].id, disaster_id=disaster.id, water_level=2.8, rainfall=75, water_rise_rate=0.35))
    readings.append(HazardReading(zone_id=zones[9].id, disaster_id=disaster.id, water_level=3.2, rainfall=90, water_rise_rate=0.45))
    
    db.add_all(readings)
    db.commit()

    # Historical Readings (for predictions)
    now = datetime.now(timezone.utc)
    for z in zones:
        # Find the reading for this zone
        curr_reading = next((r for r in readings if r.zone_id == z.id), None)
        if not curr_reading:
            continue
            
        for i in range(20, 0, -1):
            past_time = now - timedelta(minutes=15 * i)
            base_wl = max(0, curr_reading.water_level - (i * 0.05))
            base_rf = max(0, curr_reading.rainfall - (i * 1.5))
            hr = HazardReading(
                zone_id=z.id, 
                disaster_id=disaster.id,
                timestamp=past_time,
                water_level=base_wl + random.uniform(-0.1, 0.1),
                rainfall=base_rf + random.uniform(-2, 2),
                water_rise_rate=curr_reading.water_rise_rate + random.uniform(-0.02, 0.02)
            )
            db.add(hr)
    db.commit()

    # Resources
    resources = [
        Resource(name='Rescue Team BLR', type='rescue_team', latitude=12.9700, longitude=77.5900),
        Resource(name='Rescue Team MANG', type='rescue_team', latitude=12.8700, longitude=74.8500),
        Resource(name='Rescue Team UDU', type='rescue_team', latitude=13.3400, longitude=74.7400),
        Resource(name='Ambulance KOD', type='ambulance', latitude=12.3300, longitude=75.8000),
        Resource(name='Ambulance MYS', type='ambulance', latitude=12.2900, longitude=76.6300),
        Resource(name='Coast Guard Boat MANG', type='boat', latitude=12.8600, longitude=74.8300)
    ]
    db.add_all(resources)
    db.commit()

    # Roads
    roads = [
        Road(name='NH48 Bengaluru', zone_id=zones[0].id, from_lat=12.971, from_lng=77.594, to_lat=12.980, to_lng=77.600, status='open'),
        Road(name='NH66 Mangaluru', zone_id=zones[1].id, from_lat=12.869, from_lng=74.843, to_lat=12.880, to_lng=74.850, status='open'),
        Road(name='NH66 Udupi', zone_id=zones[2].id, from_lat=13.340, from_lng=74.742, to_lat=13.350, to_lng=74.750, status='open'),
        Road(name='Madikeri Ghat Rd', zone_id=zones[3].id, from_lat=12.337, from_lng=75.806, to_lat=12.350, to_lng=75.810, status='open'),
        Road(name='Mysuru Ring Rd', zone_id=zones[4].id, from_lat=12.295, from_lng=76.639, to_lat=12.300, to_lng=76.640, status='open')
    ]
    db.add_all(roads)
    db.commit()

    # Shelters
    shelters = [
        Shelter(name='Kanteerava Stadium BLR', zone_id=zones[0].id, latitude=12.972, longitude=77.595, capacity=2000),
        Shelter(name='Nehru Maidan MANG', zone_id=zones[1].id, latitude=12.870, longitude=74.844, capacity=1500),
        Shelter(name='Ajjarakadu Ground UDU', zone_id=zones[2].id, latitude=13.341, longitude=74.743, capacity=1000),
        Shelter(name='Madikeri Fort Camp KOD', zone_id=zones[3].id, latitude=12.338, longitude=75.807, capacity=800),
        Shelter(name='Chamundi Vihar MYS', zone_id=zones[4].id, latitude=12.296, longitude=76.640, capacity=1200)
    ]
    db.add_all(shelters)
    db.commit()

    # Hospitals
    hospitals = [
        Hospital(name='Victoria Hospital BLR', latitude=12.963, longitude=77.574, capacity=500),
        Hospital(name='Wenlock Hospital MANG', latitude=12.865, longitude=74.842, capacity=300)
    ]
    db.add_all(hospitals)
    db.commit()

    # Help Requests
    for _ in range(4):
        hr = HelpRequest(
            zone_id=zones[1].id,
            type=random.choice(['rescue', 'medical', 'food_water']),
            latitude=12.9256 + random.uniform(-0.01, 0.01),
            longitude=77.6762 + random.uniform(-0.01, 0.01),
            priority=random.randint(1, 3)
        )
        db.add(hr)
    db.commit()

    # Run Intelligence Engine Initial Setup
    print("Running initial intelligence engine pass...")
    process_update(db)

    print("Database seeded successfully.")
    db.close()

if __name__ == "__main__":
    seed()
