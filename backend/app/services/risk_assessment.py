import json
from sqlalchemy.orm import Session
from app.models.models import Zone, HazardReading, RiskAssessment

RISK_WEIGHTS = {
    'water_level': 0.30,
    'rainfall': 0.20,
    'water_rise_rate': 0.20,
    'population': 0.15,
    'accessibility': 0.10,
    'help_requests': 0.05
}

def normalize(val, min_val, max_val):
    if val <= min_val: return 0.0
    if val >= max_val: return 1.0
    return (val - min_val) / (max_val - min_val)

def population_exposure_score(population):
    if population < 10000: return 0.3
    if population < 30000: return 0.6
    return 1.0

def calculate_zone_risk(db: Session, zone_id: int) -> dict:
    zone = db.query(Zone).filter(Zone.id == zone_id).first()
    if not zone:
        return {}

    reading = db.query(HazardReading).filter(HazardReading.zone_id == zone_id).order_by(HazardReading.timestamp.desc()).first()
    
    water_level = reading.water_level if reading else 0.0
    rainfall = reading.rainfall if reading else 0.0
    rise_rate = reading.water_rise_rate if reading else 0.0

    wl_factor = normalize(water_level, 0, 5) * 100
    rf_factor = normalize(rainfall, 0, 200) * 100
    rr_factor = normalize(rise_rate, 0, 1) * 100
    pop_factor = population_exposure_score(zone.population) * 100
    acc_factor = (1.0 - zone.accessibility) * 100
    hr_factor = normalize(zone.help_request_count, 0, 20) * 100

    risk_score = (
        RISK_WEIGHTS['water_level'] * wl_factor +
        RISK_WEIGHTS['rainfall'] * rf_factor +
        RISK_WEIGHTS['water_rise_rate'] * rr_factor +
        RISK_WEIGHTS['population'] * pop_factor +
        RISK_WEIGHTS['accessibility'] * acc_factor +
        RISK_WEIGHTS['help_requests'] * hr_factor
    )

    risk_score = max(0.0, min(100.0, risk_score))

    if risk_score <= 30:
        level = 'low'
    elif risk_score <= 60:
        level = 'medium'
    elif risk_score <= 80:
        level = 'high'
    else:
        level = 'critical'

    factors = {
        'water_level_factor': wl_factor,
        'rainfall_factor': rf_factor,
        'rise_rate_factor': rr_factor,
        'population_factor': pop_factor,
        'accessibility_factor': acc_factor,
        'help_request_factor': hr_factor
    }

    zone.current_risk_score = risk_score
    zone.risk_level = level
    db.commit()

    assessment = RiskAssessment(
        zone_id=zone_id,
        risk_score=risk_score,
        risk_level=level,
        water_level_factor=wl_factor,
        rainfall_factor=rf_factor,
        rise_rate_factor=rr_factor,
        population_factor=pop_factor,
        accessibility_factor=acc_factor,
        help_request_factor=hr_factor,
        factors_json=json.dumps(factors)
    )
    db.add(assessment)
    db.commit()

    return {
        'zone_id': zone_id,
        'risk_score': risk_score,
        'risk_level': level,
        'factors': factors
    }

def calculate_all_risks(db: Session) -> list:
    zones = db.query(Zone).all()
    results = []
    for z in zones:
        res = calculate_zone_risk(db, z.id)
        if res:
            results.append(res)
    return results
