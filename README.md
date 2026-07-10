# Predictive Maintenance for Manufacturing — Full Project

Industrial IoT predictive maintenance system — **Data + ML (RF/GB/LSTM) + MySQL + FastAPI + React.js**.
Poora project ek hi jagah, end-to-end.

## Folder Structure

```
pm/
├── data/
│   ├── generate_data.py         # synthetic IoT sensor data generator
│   └── sensor_data.csv          # generated dataset (5311 rows, 25 machines)
├── ml_models/
│   ├── train_classification.py  # Random Forest + Gradient Boosting (health_state)
│   ├── train_lstm.py            # LSTM for Remaining Useful Life (RUL)
│   └── saved_models/            # trained model artifacts (.pkl) + metrics.json
├── database/
│   └── schema.sql               # MySQL tables + sample seed data
├── backend/                     # FastAPI app
│   ├── main.py                  # all API routes
│   ├── database.py              # SQLAlchemy engine/session
│   ├── models.py                # ORM models
│   ├── schemas.py                # Pydantic schemas
│   ├── auth.py                  # JWT login/signup, password hashing
│   ├── ml_service.py             # loads RF/GB models, runs inference
│   ├── lstm_service.py           # loads LSTM model, predicts RUL
│   ├── ws_manager.py             # WebSocket connection manager
│   └── Dockerfile
├── frontend/                    # React.js app (dark indigo theme)
│   ├── src/
│   │   ├── pages/               # Login, Register, Dashboard, Machines, MachineDetail, Alerts, Maintenance
│   │   ├── components/          # Sidebar, StatCard, StateBadge, SensorChart
│   │   ├── context/              # AuthContext, useLiveFeed (WebSocket hook)
│   │   ├── api/client.js         # axios instance with JWT auto-attach
│   │   └── theme.js              # design tokens
│   ├── package.json
│   ├── vite.config.js
│   └── Dockerfile
├── simulate/
│   └── live_sensor_simulator.py # streams fake live sensor data for demo
├── docker-compose.yml           # runs MySQL + backend + frontend together
└── requirements.txt
```

## Quick Start — Option A: Docker (sabse aasan)

Agar Docker Desktop installed hai, ek hi command se poora stack chalega:
```bash
docker compose up --build
```
- Frontend: **http://localhost:3000**
- Backend docs: **http://localhost:8000/docs**

MySQL schema pehli baar container start hote hi auto-load ho jayega.
> Note: pehli build mein thoda time lagega (TensorFlow bada image hai).

## Quick Start — Option B: Manual local setup

### 1. Python environment + backend
```bash
cd pm
python -m venv venv
source venv/bin/activate      # Windows: venv\Scripts\activate
pip install -r requirements.txt
```

### 2. Data (already generated hai `data/sensor_data.csv`)
Regenerate karna ho to:
```bash
cd data && python generate_data.py
```

### 3. RF + Gradient Boosting models (already trained hain `ml_models/saved_models/`)
- Random Forest: **96.71%** accuracy
- Gradient Boosting: **97.46%** accuracy

Retrain karna ho to:
```bash
cd ml_models && python train_classification.py
```

### 4. LSTM model train karo (RUL prediction ke liye — isko TensorFlow chahiye)
```bash
cd ml_models && python train_lstm.py
```
Output: `saved_models/lstm_rul_model.h5` + `lstm_metrics.json`

### 5. MySQL database setup
```bash
mysql -u root -p < database/schema.sql
```
Ye `predictive_maintenance` database + 6 tables + 5 sample machines seed karega.

`backend/database.py` mein apne credentials set karo (ya env vars):
```bash
export DB_USER=root
export DB_PASSWORD=your_password
export DB_HOST=localhost
export DB_NAME=predictive_maintenance
```

### 6. Backend run karo
```bash
cd backend
uvicorn main:app --reload
```
Swagger docs: **http://localhost:8000/docs**

### 7. Frontend run karo (naya terminal)
```bash
cd frontend
npm install
npm run dev
```
Browser: **http://localhost:5173**

Backend kisi aur URL/port pe hai to `frontend/.env.example` ko `.env` mein copy karke
`VITE_API_BASE` update kar do.

### 8. Account banao
"Register" page se signup karo — automatically Engineer role milega aur login ho jaoge.

### 9. Live data ke liye simulator chalao (naya terminal)
```bash
cd pm
source venv/bin/activate
python simulate/live_sensor_simulator.py
```
5 machines ke liye fake sensor data har 2 second mein backend ko bhejta rahega.
Dashboard pe real-time updates dikhenge (sidebar mein "LIVE" green ho jayega).

## API Endpoints

| Method | Endpoint | Description |
|---|---|---|
| POST | `/api/auth/register` | Signup |
| POST | `/api/auth/login` | Login, JWT token milta hai |
| GET | `/api/auth/me` | Current user info |
| GET | `/api/machines` | Saare machines list |
| POST | `/api/machines` | Naya machine add karo |
| POST | `/api/sensor-readings` | Sensor reading ingest karo (+ live broadcast) |
| GET | `/api/machines/{id}/readings` | Machine ki readings history |
| POST | `/api/predict` | Live sensor snapshot se health predict karo (RF/GB) |
| GET | `/api/machines/{id}/predictions` | Machine ki prediction history |
| POST | `/api/predict-rul/{id}` | LSTM se Remaining Useful Life predict karo |
| GET | `/api/alerts` | Unresolved alerts |
| PATCH | `/api/alerts/{id}/resolve` | Alert resolve maro |
| POST | `/api/maintenance` | Maintenance schedule karo |
| GET | `/api/maintenance` | Saare scheduled maintenance |
| GET | `/api/analytics/summary` | Dashboard summary stats |
| WS | `/ws/live` | Real-time sensor/alert feed |

## Features Overview

- **Machine health monitoring** — live sensor readings per machine, trend charts
- **Failure prediction** — Random Forest / Gradient Boosting classify Healthy/Warning/Critical
- **Remaining Useful Life** — LSTM predicts cycles left before failure
- **Maintenance scheduling** — Preventive/Predictive/Corrective, status tracking
- **Alert notifications** — auto-generated on Warning/Critical predictions, real-time via WebSocket
- **Analytics dashboard** — fleet summary, live feed, active alerts
- **Authentication** — JWT-based login/signup, role-based access (Admin/Engineer/Viewer)

## Production ke liye aage ka kaam (optional)

- `JWT_SECRET_KEY` ko production mein strong random value se replace karo
- HTTPS enable karo (reverse proxy jaise Nginx/Caddy)
- Real IoT sensors se MQTT/OPC-UA gateway integrate karna (abhi simulator use ho raha hai)
- Rate limiting aur input validation harden karna
- CI/CD pipeline (GitHub Actions)

---
*Predictive Maintenance for Manufacturing — Industrial IoT Internship Project — Complete*
