from fastapi import APIRouter, Depends
from sqlalchemy.orm import Session
from typing import List
from app.models.database import get_db
from app.models.models import Shelter
from app.models.schemas import ShelterResponse

router = APIRouter(prefix="/api/shelters", tags=["shelters"])

@router.get("", response_model=List[ShelterResponse])
def get_shelters(db: Session = Depends(get_db)):
    return db.query(Shelter).all()
