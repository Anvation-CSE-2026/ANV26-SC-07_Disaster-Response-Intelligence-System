# DRIS — Disaster Response Intelligence System

> **Team:** WINMAC CODE | **Team ID:** ANV26-SC-07

**DRIS** is a real-time, disaster-agnostic decision-support platform that transforms changing disaster data into prioritized and optimized response actions.

> ⚠️ **Prototype Notice:** This is a 24-hour hackathon prototype using simulated data. It is NOT intended for real emergency deployment. All data, predictions, and recommendations are for demonstration purposes only.

## Core Intelligence Loop

```
NEW DATA → RISK ASSESSMENT → PREDICTION → PRIORITIZATION
    → RESOURCE OPTIMIZATION → ROUTE OPTIMIZATION → TARGETED ALERTS
    → NEW DATA → RECALCULATE
```

**Primary differentiator:** DRIS does not just predict or visualize a disaster. It continuously determines what should happen next.

## Tech Stack

| Layer | Technology |
|-------|-----------|
| Frontend | React + Vite + Tailwind CSS |
| Backend | Python + FastAPI |
| Real-Time | WebSockets |
| Database | SQLite |
| AI/ML | Python + Scikit-learn |
| Optimization | Google OR-Tools |
| Maps | Leaflet + OpenStreetMap |
| Routing | OSRM |
| Citizen Platform | React PWA |

## Three Interfaces

1. **Admin / Authority Dashboard** — Desktop-first command center with full operational view
2. **Rescue Team Mobile Interface** — Mobile-first assignment and navigation view
3. **Citizen / User Mobile PWA** — Mobile-first safety, alerts, and help-request app

## Quick Start

### Backend

```bash
cd backend
pip install -r requirements.txt
python -m app.seed_data      # Seed the database
uvicorn app.main:app --reload --port 8000
```

### Frontend

```bash
cd frontend
npm install
npm run dev
```

Then open:
- **Admin Dashboard:** http://localhost:5173/admin
- **Rescue Team:** http://localhost:5173/rescue
- **Citizen App:** http://localhost:5173/citizen

## Demo Scenario (Flood)

The Scenario Simulator (Admin → Scenario Simulator) lets you:

1. Adjust water level, rainfall, and rise rate
2. Block/unblock roads
3. Add help requests
4. Run auto-escalation

Every change triggers the full intelligence pipeline:
risk → prediction → priority → resource optimization → routing → alerts → WebSocket broadcast.

## Project Structure

```
dris/
├── backend/
│   ├── app/
│   │   ├── main.py              # FastAPI app entry
│   │   ├── api/                 # REST API routes
│   │   ├── models/              # SQLAlchemy models & Pydantic schemas
│   │   ├── services/            # Intelligence engine services
│   │   └── websocket/           # WebSocket manager
│   ├── seed_data.py
│   └── requirements.txt
├── frontend/
│   ├── src/
│   │   ├── pages/admin/         # Admin dashboard pages
│   │   ├── pages/rescue/        # Rescue team mobile pages
│   │   ├── pages/citizen/       # Citizen PWA pages
│   │   ├── components/          # Shared components
│   │   ├── services/            # API & WebSocket clients
│   │   └── hooks/               # Custom React hooks
│   ├── public/                  # PWA assets
│   └── package.json
└── README.md
```

## License

Hackathon prototype — WINMAC CODE (ANV26-SC-07)
