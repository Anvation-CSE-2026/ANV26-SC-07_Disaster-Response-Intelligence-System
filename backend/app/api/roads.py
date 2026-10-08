from fastapi import APIRouter, Depends
from sqlalchemy.orm import Session
from typing import List
from app.models.database import get_db
from app.models.models import Road
from app.models.schemas import RoadResponse

router = APIRouter(prefix="/api/roads", tags=["roads"])

@router.get("", response_model=List[RoadResponse])
def get_roads(db: Session = Depends(get_db)):
    return db.query(Road).all()
