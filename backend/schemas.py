"""
Pydantic schemas - request/response validation for the API
"""

from datetime import datetime, date
from typing import Optional
from pydantic import BaseModel


class MachineBase(BaseModel):
    machine_id: str
    machine_name: str
    machine_type: str
    location: Optional[str] = None
    installed_date: Optional[date] = None
    status: Optional[str] = "Running"


class MachineCreate(MachineBase):
    pass


class MachineOut(MachineBase):
    class Config:
        from_attributes = True


class SensorReadingIn(BaseModel):
    machine_id: str
    cycle: int
    timestamp: datetime
    temperature_c: float
    vibration_mm_s: float
    pressure_psi: float
    current_a: float
    rpm: float


class SensorReadingOut(SensorReadingIn):
    reading_id: int

    class Config:
        from_attributes = True


class PredictionOut(BaseModel):
    prediction_id: int
    machine_id: str
    predicted_state: str
    confidence: float
    predicted_rul: Optional[int]
    model_used: str
    predicted_at: datetime

    class Config:
        from_attributes = True


class AlertOut(BaseModel):
    alert_id: int
    machine_id: str
    severity: str
    message: str
    is_resolved: bool
    created_at: datetime

    class Config:
        from_attributes = True


class MaintenanceScheduleIn(BaseModel):
    machine_id: str
    scheduled_date: date
    maintenance_type: str
    assigned_to: Optional[str] = None
    notes: Optional[str] = None


class MaintenanceScheduleOut(MaintenanceScheduleIn):
    schedule_id: int
    status: str

    class Config:
        from_attributes = True


class UserCreate(BaseModel):
    username: str
    email: str
    password: str
    role: Optional[str] = "Viewer"


class UserOut(BaseModel):
    user_id: int
    username: str
    email: str
    role: str

    class Config:
        from_attributes = True


class Token(BaseModel):
    access_token: str
    token_type: str = "bearer"
    user: UserOut


class PredictRequest(BaseModel):
    """Raw sensor snapshot sent in for a live prediction."""
    machine_id: str
    cycle: int
    temperature_C: float
    vibration_mm_s: float
    pressure_psi: float
    current_A: float
    rpm: float
