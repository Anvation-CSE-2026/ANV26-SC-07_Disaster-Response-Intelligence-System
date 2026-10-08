from sqlalchemy.orm import Session
from app.models.models import Alert, Zone

def create_alert(db: Session, type_str: str, severity: str, message: str, zone_id: int = None, target_role: str = 'all'):
    alert = Alert(
        type=type_str,
        severity=severity,
        message=message,
        zone_id=zone_id,
        target_role=target_role
    )
    db.add(alert)
    db.commit()
    db.refresh(alert)
    return alert

def get_recent_alerts(db: Session, role: str = 'all', limit: int = 50):
    query = db.query(Alert)
    if role != 'all':
        query = query.filter(Alert.target_role.in_(['all', role]))
    return query.order_by(Alert.created_at.desc()).limit(limit).all()

def generate_alerts_for_update(db: Session, risk_results: list, priority_results: list, assignment_results: dict):
    new_alerts = []
    
    # Check for critical risks
    for risk in risk_results:
        if risk['risk_level'] == 'critical':
            z = db.query(Zone).filter(Zone.id == risk['zone_id']).first()
            alert = create_alert(
                db, 'critical', 'critical',
                f"CRITICAL RISK in {z.name}. Evacuation may be necessary.",
                z.id, 'all'
            )
            new_alerts.append(alert)

    # Check for unmet zones
    for uz_id in assignment_results.get('unmet_zones', []):
        z = db.query(Zone).filter(Zone.id == uz_id).first()
        alert = create_alert(
            db, 'resource', 'high',
            f"Resource shortage for {z.name}. Unable to allocate recommended resources.",
            z.id, 'admin'
        )
        new_alerts.append(alert)
        
    return new_alerts
