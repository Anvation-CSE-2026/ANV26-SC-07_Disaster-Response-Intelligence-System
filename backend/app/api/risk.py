from fastapi import APIRouter, Depends
from sqlalchemy.orm import Session
from typing import List
from app.models.database import get_db
from app.models.models import RiskAssessment
from app.models.schemas import RiskAssessmentResponse

router = APIRouter(prefix="/api/risk", tags=["risk"])

@router.get("", response_model=List[RiskAssessmentResponse])
def get_all_risks(db: Session = Depends(get_db)):
    # get latest for each zone (simple approach: just get last N or do a distinct)
    return db.query(RiskAssessment).order_by(RiskAssessment.timestamp.desc()).limit(100).all()

@router.get("/{zone_id}", response_model=List[RiskAssessmentResponse])
def get_zone_risk(zone_id: int, db: Session = Depends(get_db)):
    return db.query(RiskAssessment).filter(RiskAssessment.zone_id == zone_id).order_by(RiskAssessment.timestamp.desc()).all()
