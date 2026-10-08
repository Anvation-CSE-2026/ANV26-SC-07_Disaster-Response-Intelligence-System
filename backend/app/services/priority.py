from sqlalchemy.orm import Session
from app.models.models import Zone, Road, HelpRequest

def normalize(val, min_val, max_val):
    if val <= min_val: return 0.0
    if val >= max_val: return 1.0
    return (val - min_val) / (max_val - min_val)

def calculate_priorities(db: Session) -> list:
    zones = db.query(Zone).all()
    results = []

    for zone in zones:
        pop_exp = 1.0 if zone.population_exposure == 'high' else (0.6 if zone.population_exposure == 'medium' else 0.3)
        
        urgency_factor = 0
        if zone.trend == 'rapid_increase': urgency_factor = 100
        elif zone.trend == 'increasing': urgency_factor = 60
        elif zone.trend == 'decreasing': urgency_factor = 20
        else: urgency_factor = 40

        score = (
            0.35 * zone.current_risk_score +
            0.20 * zone.predicted_risk_30 +
            0.20 * pop_exp * 100 +
            0.10 * urgency_factor +
            0.10 * (1 - zone.accessibility) * 100 +
            0.05 * normalize(zone.help_request_count, 0, 20) * 100
        )

        flooded_roads = db.query(Road).filter(Road.zone_id == zone.id, Road.status.in_(['flooded', 'blocked', 'damaged'])).count()
        medical_reqs = db.query(HelpRequest).filter(HelpRequest.zone_id == zone.id, HelpRequest.type == 'medical', HelpRequest.status == 'pending').count()

        resource_type = 'none'
        if zone.risk_level == 'critical':
            if flooded_roads > 0: resource_type = 'boat'
            else: resource_type = 'rescue_team'
        elif zone.risk_level == 'high':
            if medical_reqs > 0: resource_type = 'ambulance'
            else: resource_type = 'rescue_team'
        elif zone.risk_level == 'medium':
            resource_type = 'rescue_team'

        factors = {
            'risk_contrib': 0.35 * zone.current_risk_score,
            'pred_contrib': 0.20 * zone.predicted_risk_30,
            'pop_contrib': 0.20 * pop_exp * 100,
            'urgency_contrib': 0.10 * urgency_factor,
            'access_contrib': 0.10 * (1 - zone.accessibility) * 100,
            'help_contrib': 0.05 * normalize(zone.help_request_count, 0, 20) * 100
        }

        results.append({
            'zone_id': zone.id,
            'zone_name': zone.name,
            'priority_score': score,
            'priority_factors': factors,
            'recommended_resource_type': resource_type
        })

    results.sort(key=lambda x: x['priority_score'], reverse=True)
    return results
