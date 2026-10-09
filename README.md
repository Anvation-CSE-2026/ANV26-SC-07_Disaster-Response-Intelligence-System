# DRIS — Disaster Response Intelligence System

> **Team:** WINMAC CODE | **Team ID:** ANV26-SC-07

**DRIS** is a real-time, disaster-agnostic decision-support platform that transforms changing disaster data into prioritized and optimized response actions.

> ⚠️ **Prototype Notice:** This is a 24-hour hackathon prototype using simulated data. It is NOT intended for real emergency deployment. All data, predictions, and recommendations are for demonstration purposes only.

## 🚀 Live Demo Links (Vercel)

The platform is fully deployed and accessible from anywhere. Choose your role below:
- 👑 **Admin Command Center:** [https://anv-26-sc-07-disaster-response-inte.vercel.app/admin](https://anv-26-sc-07-disaster-response-inte.vercel.app/admin)
- 🚁 **Rescue Team Dashboard:** [https://anv-26-sc-07-disaster-response-inte.vercel.app/rescue](https://anv-26-sc-07-disaster-response-inte.vercel.app/rescue)
- 📱 **Citizen Safety Portal:** [https://anv-26-sc-07-disaster-response-inte.vercel.app/citizen](https://anv-26-sc-07-disaster-response-inte.vercel.app/citizen)

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

Then open the application in your browser. From the main login page, you can select your role to access:
- **Admin Dashboard** 
- **Rescue Team Dashboard**
- **Citizen App**

## Demo Scenario (Flood)

The Scenario Simulator (Admin → Scenario Simulator) lets you:

1. Adjust water level, rainfall, and rise rate
2. Block/unblock roads
3. Add help requests
4. Run auto-escalation

Every change triggers the full intelligence pipeline:
risk → prediction → priority → resource optimization → routing → alerts → WebSocket broadcast.

## Vercel Deployment & Architecture Notes

This project is configured as a **Multi-Service Monorepo** for deployment on Vercel via the included `vercel.json`. 

- **Static Frontend:** Vercel automatically builds and serves the React/Vite frontend.
- **Serverless Backend:** The FastAPI backend is deployed as a Serverless Function.

### Important Notes on the Vercel Environment:
1. **Read-Only File System:** Vercel functions execute in a read-only environment. To support our local SQLite database on Vercel, the backend automatically detects if it is running in Vercel (`os.environ.get("VERCEL")`) and generates the database inside the temporary `/tmp/` folder.
2. **Auto-Seeding:** Because Vercel wipes the `/tmp/` folder whenever a function cold-starts, the `app/main.py` lifespan event checks if the database is empty upon startup. If it is, it automatically runs the `seed_data.py` script to instantly reload the simulated hackathon data.
3. **WebSockets Limitation:** Vercel's serverless functions do not support long-lived persistent WebSocket connections. While the API will function perfectly, real-time push updates via WebSockets will likely drop in the Vercel environment. For full WebSocket support, host the backend on a persistent platform (like Render or Railway).

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
