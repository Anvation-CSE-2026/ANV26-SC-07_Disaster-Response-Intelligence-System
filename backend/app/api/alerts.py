from fastapi import APIRouter, Depends
from sqlalchemy.orm import Session
from typing import List, Optional
from app.models.database import get_db
from app.models.schemas import AlertResponse, AlertCreate
from app.services.alert import get_recent_alerts, create_alert
from app.websocket.manager import manager

router = APIRouter(prefix="/api/alerts", tags=["alerts"])

@router.get("")
def get_alerts(role: str = 'admin', limit: int = 50, db: Session = Depends(get_db)):
    from app.models.models import Zone
    alerts = get_recent_alerts(db, role, limit)
    result = []
    for a in alerts:
        data = AlertResponse.model_validate(a).model_dump()
        if a.zone_id:
            zone = db.query(Zone).filter(Zone.id == a.zone_id).first()
            if zone:
                data['zone_name'] = zone.name
        result.append(data)
    return result

@router.post("", response_model=AlertResponse)
async def post_alert(alert: AlertCreate, db: Session = Depends(get_db)):
    new_alert = create_alert(db, alert.type, alert.severity, alert.message, alert.zone_id, alert.target_role)
    await manager.broadcast_to_role({"type": "alert_created", "data": AlertResponse.model_validate(new_alert).model_dump()}, alert.target_role)
    return new_alert

@router.delete("/{alert_id}")
async def delete_alert(alert_id: int, db: Session = Depends(get_db)):
    from app.models.models import Alert
    alert = db.query(Alert).filter(Alert.id == alert_id).first()
    if alert:
        db.delete(alert)
        db.commit()
        await manager.broadcast_all({"type": "alert_deleted", "data": {"id": alert_id}})
    return {"status": "success"}
