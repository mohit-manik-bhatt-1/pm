"""
Predictive Maintenance for Manufacturing - FastAPI Backend
Run: uvicorn main:app --reload
Docs: http://localhost:8000/docs
"""

from fastapi import FastAPI, Depends, HTTPException, WebSocket, WebSocketDisconnect
from fastapi.middleware.cors import CORSMiddleware
from fastapi.security import OAuth2PasswordRequestForm
from sqlalchemy.orm import Session
from sqlalchemy import func
from datetime import datetime
from typing import List

from database import engine, get_db, Base
import models
import schemas
from ml_service import prediction_service
from lstm_service import rul_service
from auth import hash_password, verify_password, create_access_token, get_current_user
from ws_manager import ws_manager

# Create tables if they don't exist (safe no-op if schema.sql already ran)
Base.metadata.create_all(bind=engine)

app = FastAPI(
    title="Predictive Maintenance API",
    description="Industrial IoT predictive maintenance backend - machine health, predictions, alerts, scheduling",
    version="0.5.0",  # 50% milestone
)

app.add_middleware(
    CORSMiddleware,
    allow_origins=[
        "http://localhost:5173",  # Vite dev server (default)
        "http://localhost:3000",  # in case frontend is served on 3000 (e.g. Docker/nginx)
        "http://127.0.0.1:5173",
    ],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)


@app.get("/")
def root():
    return {"message": "Predictive Maintenance API is running", "docs": "/docs"}


# ------------------------------------------------------------------
# Authentication
# ------------------------------------------------------------------
@app.post("/api/auth/register", response_model=schemas.UserOut)
def register(user: schemas.UserCreate, db: Session = Depends(get_db)):
    existing = db.query(models.User).filter(
        (models.User.username == user.username) | (models.User.email == user.email)
    ).first()
    if existing:
        raise HTTPException(status_code=400, detail="Username or email already registered")

    db_user = models.User(
        username=user.username,
        email=user.email,
        password_hash=hash_password(user.password),
        role=user.role,
    )
    db.add(db_user)
    db.commit()
    db.refresh(db_user)
    return db_user


@app.post("/api/auth/login", response_model=schemas.Token)
def login(form_data: OAuth2PasswordRequestForm = Depends(), db: Session = Depends(get_db)):
    user = db.query(models.User).filter(models.User.username == form_data.username).first()
    if not user or not verify_password(form_data.password, user.password_hash):
        raise HTTPException(status_code=401, detail="Incorrect username or password")

    token = create_access_token(data={"sub": user.username, "role": user.role})
    return {"access_token": token, "token_type": "bearer", "user": user}


@app.get("/api/auth/me", response_model=schemas.UserOut)
def get_me(current_user: models.User = Depends(get_current_user)):
    return current_user


# ------------------------------------------------------------------
# Machines
# ------------------------------------------------------------------
@app.get("/api/machines", response_model=List[schemas.MachineOut])
def list_machines(db: Session = Depends(get_db)):
    return db.query(models.Machine).all()


@app.get("/api/machines/{machine_id}", response_model=schemas.MachineOut)
def get_machine(machine_id: str, db: Session = Depends(get_db)):
    machine = db.query(models.Machine).filter(models.Machine.machine_id == machine_id).first()
    if not machine:
        raise HTTPException(status_code=404, detail="Machine not found")
    return machine


@app.post("/api/machines", response_model=schemas.MachineOut)
def create_machine(machine: schemas.MachineCreate, db: Session = Depends(get_db)):
    existing = db.query(models.Machine).filter(models.Machine.machine_id == machine.machine_id).first()
    if existing:
        raise HTTPException(status_code=400, detail="Machine ID already exists")
    db_machine = models.Machine(**machine.dict())
    db.add(db_machine)
    db.commit()
    db.refresh(db_machine)
    return db_machine


# ------------------------------------------------------------------
# Sensor readings
# ------------------------------------------------------------------
@app.post("/api/sensor-readings", response_model=schemas.SensorReadingOut)
async def ingest_reading(reading: schemas.SensorReadingIn, db: Session = Depends(get_db)):
    db_reading = models.SensorReading(**reading.dict())
    db.add(db_reading)
    db.commit()
    db.refresh(db_reading)

    # push to any connected dashboards in real time
    await ws_manager.broadcast({
        "type": "sensor_reading",
        "machine_id": db_reading.machine_id,
        "cycle": db_reading.cycle,
        "timestamp": db_reading.timestamp.isoformat(),
        "temperature_c": float(db_reading.temperature_c),
        "vibration_mm_s": float(db_reading.vibration_mm_s),
        "pressure_psi": float(db_reading.pressure_psi),
        "current_a": float(db_reading.current_a),
        "rpm": float(db_reading.rpm),
    })
    return db_reading


@app.get("/api/machines/{machine_id}/readings", response_model=List[schemas.SensorReadingOut])
def get_machine_readings(machine_id: str, limit: int = 100, db: Session = Depends(get_db)):
    return (
        db.query(models.SensorReading)
        .filter(models.SensorReading.machine_id == machine_id)
        .order_by(models.SensorReading.timestamp.desc())
        .limit(limit)
        .all()
    )


# ------------------------------------------------------------------
# Predictions (ML inference)
# ------------------------------------------------------------------
@app.post("/api/predict")
async def predict_health(request: schemas.PredictRequest, model: str = "gb", db: Session = Depends(get_db)):
    """
    Runs a live sensor snapshot through the trained RF/GB model
    and persists the prediction. Set ?model=rf to use Random Forest
    instead of Gradient Boosting.
    """
    try:
        result = prediction_service.predict(request.dict(), model=model)
    except FileNotFoundError:
        raise HTTPException(
            status_code=503,
            detail="Models not trained yet. Run ml_models/train_classification.py first.",
        )

    db_prediction = models.Prediction(
        machine_id=request.machine_id,
        predicted_state=result["predicted_state"],
        confidence=result["confidence"],
        model_used=result["model_used"],
    )
    db.add(db_prediction)
    db.commit()
    db.refresh(db_prediction)

    # auto-generate an alert if state is Warning/Critical
    if result["predicted_state"] in ("Warning", "Critical"):
        severity = "High" if result["predicted_state"] == "Critical" else "Medium"
        alert = models.Alert(
            machine_id=request.machine_id,
            prediction_id=db_prediction.prediction_id,
            severity=severity,
            message=f"Machine {request.machine_id} predicted as {result['predicted_state']} "
                    f"({result['confidence']*100:.1f}% confidence)",
        )
        db.add(alert)
        db.commit()

        await ws_manager.broadcast({
            "type": "alert",
            "machine_id": request.machine_id,
            "severity": severity,
            "message": alert.message,
        })

    return {
        "machine_id": request.machine_id,
        "prediction_id": db_prediction.prediction_id,
        **result,
    }


@app.post("/api/predict-rul/{machine_id}")
def predict_rul(machine_id: str, db: Session = Depends(get_db)):
    """
    Predicts Remaining Useful Life using the LSTM model, based on the
    machine's last 20 sensor readings stored in the database.
    """
    readings = (
        db.query(models.SensorReading)
        .filter(models.SensorReading.machine_id == machine_id)
        .order_by(models.SensorReading.timestamp.asc())
        .all()
    )

    if len(readings) < 20:
        raise HTTPException(
            status_code=400,
            detail=f"Need at least 20 sensor readings for machine {machine_id}, have {len(readings)}",
        )

    sequence = [
        {
            "temperature_C": float(r.temperature_c),
            "vibration_mm_s": float(r.vibration_mm_s),
            "pressure_psi": float(r.pressure_psi),
            "current_A": float(r.current_a),
            "rpm": float(r.rpm),
        }
        for r in readings
    ]

    try:
        result = rul_service.predict(sequence)
    except FileNotFoundError:
        raise HTTPException(
            status_code=503,
            detail="LSTM model not trained yet. Run ml_models/train_lstm.py first.",
        )
    except ImportError:
        raise HTTPException(
            status_code=503,
            detail="TensorFlow not installed on this server. Run: pip install tensorflow",
        )

    return {"machine_id": machine_id, **result}


@app.get("/api/machines/{machine_id}/predictions", response_model=List[schemas.PredictionOut])
def get_machine_predictions(machine_id: str, limit: int = 50, db: Session = Depends(get_db)):
    return (
        db.query(models.Prediction)
        .filter(models.Prediction.machine_id == machine_id)
        .order_by(models.Prediction.predicted_at.desc())
        .limit(limit)
        .all()
    )


# ------------------------------------------------------------------
# Alerts
# ------------------------------------------------------------------
@app.get("/api/alerts", response_model=List[schemas.AlertOut])
def list_alerts(unresolved_only: bool = True, db: Session = Depends(get_db)):
    query = db.query(models.Alert)
    if unresolved_only:
        query = query.filter(models.Alert.is_resolved == False)  # noqa: E712
    return query.order_by(models.Alert.created_at.desc()).all()


@app.patch("/api/alerts/{alert_id}/resolve")
def resolve_alert(alert_id: int, db: Session = Depends(get_db)):
    alert = db.query(models.Alert).filter(models.Alert.alert_id == alert_id).first()
    if not alert:
        raise HTTPException(status_code=404, detail="Alert not found")
    alert.is_resolved = True
    alert.resolved_at = datetime.utcnow()
    db.commit()
    return {"message": "Alert resolved", "alert_id": alert_id}


# ------------------------------------------------------------------
# Maintenance scheduling
# ------------------------------------------------------------------
@app.post("/api/maintenance", response_model=schemas.MaintenanceScheduleOut)
def schedule_maintenance(item: schemas.MaintenanceScheduleIn, db: Session = Depends(get_db)):
    db_item = models.MaintenanceSchedule(**item.dict())
    db.add(db_item)
    db.commit()
    db.refresh(db_item)
    return db_item


@app.get("/api/maintenance", response_model=List[schemas.MaintenanceScheduleOut])
def list_maintenance(db: Session = Depends(get_db)):
    return db.query(models.MaintenanceSchedule).order_by(models.MaintenanceSchedule.scheduled_date).all()


# ------------------------------------------------------------------
# Analytics / Dashboard summary
# ------------------------------------------------------------------
@app.websocket("/ws/live")
async def websocket_live(websocket: WebSocket):
    """
    Real-time channel - dashboard connects here to receive live sensor
    readings and alerts as they're ingested (see simulate/live_sensor_simulator.py).
    """
    await ws_manager.connect(websocket)
    try:
        while True:
            # keep the connection open; client doesn't need to send anything
            await websocket.receive_text()
    except WebSocketDisconnect:
        ws_manager.disconnect(websocket)


@app.get("/api/analytics/summary")
def analytics_summary(db: Session = Depends(get_db)):
    total_machines = db.query(func.count(models.Machine.machine_id)).scalar()
    unresolved_alerts = (
        db.query(func.count(models.Alert.alert_id))
        .filter(models.Alert.is_resolved == False)  # noqa: E712
        .scalar()
    )
    state_counts = (
        db.query(models.Prediction.predicted_state, func.count(models.Prediction.prediction_id))
        .group_by(models.Prediction.predicted_state)
        .all()
    )
    return {
        "total_machines": total_machines,
        "unresolved_alerts": unresolved_alerts,
        "state_distribution": {state: count for state, count in state_counts},
    }
