from fastapi import APIRouter, Depends
from sqlalchemy.orm import Session
from typing import List
from app.models.database import get_db
from app.services.priority import calculate_priorities
from app.models.schemas import PriorityResponse

router = APIRouter(prefix="/api/priorities", tags=["priorities"])

@router.get("", response_model=List[PriorityResponse])
def get_priorities(db: Session = Depends(get_db)):
    return calculate_priorities(db)
