"""
SQLAlchemy ORM models - mirrors database/schema.sql
"""

from sqlalchemy import (
    Column, Integer, BigInteger, String, DECIMAL, DateTime, Date,
    Boolean, Text, Enum, ForeignKey, TIMESTAMP, func
)
from sqlalchemy.orm import relationship
from database import Base


class Machine(Base):
    __tablename__ = "machines"

    machine_id = Column(String(10), primary_key=True)
    machine_name = Column(String(100), nullable=False)
    machine_type = Column(String(50), nullable=False)
    location = Column(String(100))
    installed_date = Column(Date)
    status = Column(Enum("Running", "Idle", "Under Maintenance", "Decommissioned"), default="Running")
    created_at = Column(TIMESTAMP, server_default=func.now())

    readings = relationship("SensorReading", back_populates="machine")
    predictions = relationship("Prediction", back_populates="machine")
    alerts = relationship("Alert", back_populates="machine")
    schedules = relationship("MaintenanceSchedule", back_populates="machine")


class SensorReading(Base):
    __tablename__ = "sensor_readings"

    reading_id = Column(BigInteger, primary_key=True, autoincrement=True)
    machine_id = Column(String(10), ForeignKey("machines.machine_id", ondelete="CASCADE"))
    cycle = Column(Integer, nullable=False)
    timestamp = Column(DateTime, nullable=False)
    temperature_c = Column(DECIMAL(6, 2))
    vibration_mm_s = Column(DECIMAL(6, 3))
    pressure_psi = Column(DECIMAL(6, 2))
    current_a = Column(DECIMAL(6, 2))
    rpm = Column(DECIMAL(7, 1))

    machine = relationship("Machine", back_populates="readings")


class Prediction(Base):
    __tablename__ = "predictions"

    prediction_id = Column(BigInteger, primary_key=True, autoincrement=True)
    machine_id = Column(String(10), ForeignKey("machines.machine_id", ondelete="CASCADE"))
    reading_id = Column(BigInteger, ForeignKey("sensor_readings.reading_id", ondelete="SET NULL"))
    predicted_state = Column(Enum("Healthy", "Warning", "Critical"), nullable=False)
    confidence = Column(DECIMAL(5, 4))
    predicted_rul = Column(Integer)
    model_used = Column(String(50))
    predicted_at = Column(TIMESTAMP, server_default=func.now())

    machine = relationship("Machine", back_populates="predictions")


class Alert(Base):
    __tablename__ = "alerts"

    alert_id = Column(BigInteger, primary_key=True, autoincrement=True)
    machine_id = Column(String(10), ForeignKey("machines.machine_id", ondelete="CASCADE"))
    prediction_id = Column(BigInteger, ForeignKey("predictions.prediction_id", ondelete="SET NULL"))
    severity = Column(Enum("Low", "Medium", "High", "Critical"), nullable=False)
    message = Column(String(255), nullable=False)
    is_resolved = Column(Boolean, default=False)
    created_at = Column(TIMESTAMP, server_default=func.now())
    resolved_at = Column(TIMESTAMP, nullable=True)

    machine = relationship("Machine", back_populates="alerts")


class MaintenanceSchedule(Base):
    __tablename__ = "maintenance_schedule"

    schedule_id = Column(BigInteger, primary_key=True, autoincrement=True)
    machine_id = Column(String(10), ForeignKey("machines.machine_id", ondelete="CASCADE"))
    scheduled_date = Column(Date, nullable=False)
    maintenance_type = Column(Enum("Preventive", "Predictive", "Corrective"), nullable=False)
    assigned_to = Column(String(100))
    status = Column(Enum("Scheduled", "In Progress", "Completed", "Cancelled"), default="Scheduled")
    notes = Column(Text)
    created_at = Column(TIMESTAMP, server_default=func.now())
    completed_at = Column(TIMESTAMP, nullable=True)

    machine = relationship("Machine", back_populates="schedules")


class User(Base):
    __tablename__ = "users"

    user_id = Column(Integer, primary_key=True, autoincrement=True)
    username = Column(String(50), unique=True, nullable=False)
    email = Column(String(100), unique=True, nullable=False)
    password_hash = Column(String(255), nullable=False)
    role = Column(Enum("Admin", "Engineer", "Viewer"), default="Viewer")
    created_at = Column(TIMESTAMP, server_default=func.now())
