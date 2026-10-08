import numpy as np
from sklearn.linear_model import LinearRegression
from sqlalchemy.orm import Session
from datetime import timedelta
from app.models.models import Zone, HazardReading, Prediction

class SimplePredictor:
    def __init__(self):
        self.model = LinearRegression()
        self.is_trained = False

    def train(self, X, y):
        if len(X) > 0:
            self.model.fit(X, y)
            self.is_trained = True

    def predict(self, X):
        if self.is_trained:
            return self.model.predict(X)
        return [x[-1] for x in X] # fallback to current risk if not trained

predictor = SimplePredictor()

def train_model(db: Session):
    # Basic training using historical readings and mock target
    readings = db.query(HazardReading).order_by(HazardReading.timestamp.asc()).all()
    if len(readings) < 10:
        return
    
    X = []
    y = []
    # Simplified training approach for the prototype
    for r in readings:
        # features: water_level, rainfall, rise_rate
        feats = [r.water_level, r.rainfall, r.water_rise_rate]
        X.append(feats)
        # fake future risk logic for training
        target_risk = r.water_level * 10 + r.rainfall * 0.2 + r.water_rise_rate * 20
        y.append(target_risk)
        
    predictor.train(np.array(X), np.array(y))

def predict_zone_risk(db: Session, zone_id: int) -> dict:
    zone = db.query(Zone).filter(Zone.id == zone_id).first()
    if not zone:
        return {}

    reading = db.query(HazardReading).filter(HazardReading.zone_id == zone_id).order_by(HazardReading.timestamp.desc()).first()
    if not reading:
        return {}

    current_risk = zone.current_risk_score
    
    if predictor.is_trained:
        feats = np.array([[reading.water_level, reading.rainfall, reading.water_rise_rate]])
        # Simulating future feature changes for 15m and 30m
        feats_15 = feats * 1.1 
        feats_30 = feats * 1.2
        pred_15 = max(0, min(100, predictor.predict(feats_15)[0]))
        pred_30 = max(0, min(100, predictor.predict(feats_30)[0]))
    else:
        # Fallback extrapolation
        pred_15 = max(0, min(100, current_risk + reading.water_rise_rate * 5 + reading.rainfall * 0.1))
        pred_30 = max(0, min(100, current_risk + reading.water_rise_rate * 10 + reading.rainfall * 0.2))

    if pred_30 - current_risk > 15:
        trend = 'rapid_increase'
    elif pred_30 - current_risk > 5:
        trend = 'increasing'
    elif current_risk - pred_30 > 5:
        trend = 'decreasing'
    else:
        trend = 'stable'

    confidence = 0.7 if predictor.is_trained else 0.4

    prediction = Prediction(
        zone_id=zone_id,
        current_risk=current_risk,
        predicted_15min=pred_15,
        predicted_30min=pred_30,
        trend=trend,
        confidence=confidence
    )
    db.add(prediction)
    
    zone.predicted_risk_15 = pred_15
    zone.predicted_risk_30 = pred_30
    zone.trend = trend
    db.commit()

    return {
        'zone_id': zone_id,
        'current_risk': current_risk,
        'predicted_15min': pred_15,
        'predicted_30min': pred_30,
        'trend': trend,
        'confidence': confidence
    }

def predict_all_risks(db: Session) -> list:
    if not predictor.is_trained:
        train_model(db)
    zones = db.query(Zone).all()
    results = []
    for z in zones:
        res = predict_zone_risk(db, z.id)
        if res:
            results.append(res)
    return results
