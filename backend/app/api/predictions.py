from fastapi import APIRouter, Depends
from sqlalchemy.orm import Session
from typing import List
from app.models.database import get_db
from app.models.models import Prediction
from app.models.schemas import PredictionResponse

router = APIRouter(prefix="/api/predictions", tags=["predictions"])

@router.get("", response_model=List[PredictionResponse])
def get_predictions(db: Session = Depends(get_db)):
    # Latest predictions for each zone
    return db.query(Prediction).order_by(Prediction.timestamp.desc()).limit(100).all()

from app.services.macro_prediction import fetch_live_weather_and_predict

@router.get("/macro")
async def get_macro_predictions():
    return await fetch_live_weather_and_predict()
