from sqlalchemy.orm import Session
from datetime import datetime, timezone
from app.services.risk_assessment import calculate_all_risks
from app.services.prediction import predict_all_risks
from app.services.priority import calculate_priorities
from app.services.resource_optimization import optimize_allocation
from app.services.alert import generate_alerts_for_update
from app.models.schemas import PriorityResponse, AlertResponse

def process_update(db: Session) -> dict:
    risks = calculate_all_risks(db)
    predictions = predict_all_risks(db)
    priorities = calculate_priorities(db)
    assignments = optimize_allocation(db)
    alerts = generate_alerts_for_update(db, risks, priorities, assignments)
    
    # serialize objects for websocket
    pr_resp = [PriorityResponse(**p).model_dump() for p in priorities]
    al_resp = [AlertResponse.model_validate(a).model_dump() for a in alerts]
    
    return {
        "timestamp": datetime.now(timezone.utc).isoformat(),
        "risks": risks,
        "predictions": predictions,
        "priorities": pr_resp,
        "assignments": assignments.get('assignments', []),
        "alerts": al_resp
    }
