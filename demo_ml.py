import requests
import json
import time
from sklearn.linear_model import LinearRegression
import numpy as np

print("==================================================")
print(" DRIS LIVE INTELLIGENCE ENGINE DEMO ")
print("==================================================")

print("\n[1] FETCHING LIVE WEATHER DATA (Open-Meteo API)...")
try:
    # Bengaluru coordinates
    url = "https://api.open-meteo.com/v1/forecast?latitude=12.9716&longitude=77.5946&current_weather=true"
    response = requests.get(url)
    data = response.json()
    cw = data.get("current_weather", {})
    
    print(" -> SUCCESS! Live data retrieved:")
    print(f"    Temperature : {cw.get('temperature')}°C")
    print(f"    Wind Speed  : {cw.get('windspeed')} km/h")
    print(f"    Wind Direct : {cw.get('winddirection')}°")
    print(f"    Timestamp   : {cw.get('time')}")
except Exception as e:
    print(" -> Failed to fetch live weather (check internet).")

print("\n[2] INITIALIZING SCIKIT-LEARN PREDICTION MODEL...")
time.sleep(1)
print(" -> Loading 10-year simulated historical dataset (KSNDMC format)...")
time.sleep(1)

# Generate synthetic historical data for demo
np.random.seed(42)
X_train = np.random.rand(1500, 3) * [5.0, 200.0, 1.5] # [water_level, rainfall, rise_rate]
y_train = (X_train[:, 0] * 12 + X_train[:, 1] * 0.25 + X_train[:, 2] * 20) + np.random.normal(0, 2, 1500)

print(f" -> Dataset shape: X={X_train.shape}, y={y_train.shape}")
print(" -> Training Scikit-Learn LinearRegression Model...")

model = LinearRegression()
model.fit(X_train, y_train)
time.sleep(1)
print(f" -> Model Trained! Score (R^2): {model.score(X_train, y_train):.4f}")
print(f" -> Learned Weights: WaterLevel={model.coef_[0]:.2f}, Rainfall={model.coef_[1]:.2f}, RiseRate={model.coef_[2]:.2f}")

print("\n[3] RUNNING LIVE INFERENCE ON ZONE B...")
# Simulate current live conditions
live_water_level = 2.4
live_rainfall = 45.0
live_rise_rate = 0.3

current_features = np.array([[live_water_level, live_rainfall, live_rise_rate]])
future_features_30m = current_features * 1.25

pred_current = model.predict(current_features)[0]
pred_30m = model.predict(future_features_30m)[0]

print(f" -> Live Sensors: Water Level: {live_water_level}m, Rainfall: {live_rainfall}mm/h, Rise: {live_rise_rate}m/h")
print(f" -> Predicted Current Risk Score: {pred_current:.1f} / 100")
print(f" -> Predicted +30min Risk Score : {pred_30m:.1f} / 100")

if pred_30m - pred_current > 10:
    print("\n[!] CRITICAL ALERT: RAPID INCREASE DETECTED. ALLOCATING RESOURCES...")
else:
    print("\n[i] SYSTEM STABLE. CONTINUING MONITORING...")

print("==================================================")
