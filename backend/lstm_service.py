"""
LSTM Inference Service - Remaining Useful Life (RUL) prediction.

Loads the trained LSTM model (ml_models/saved_models/lstm_rul_model.h5)
and predicts RUL from a sequence of recent sensor readings.

NOTE: requires `tensorflow` to be installed (see requirements.txt).
If the model hasn't been trained yet, /api/predict-rul will return
a 503 telling the user to run ml_models/train_lstm.py first.
"""

import numpy as np
import joblib
from pathlib import Path

MODEL_DIR = Path(__file__).resolve().parent.parent / "ml_models" / "saved_models"
SEQUENCE_LENGTH = 20
SENSOR_COLS = ["temperature_C", "vibration_mm_s", "pressure_psi", "current_A", "rpm"]


class RULPredictionService:
    def __init__(self):
        self.model = None
        self.scaler = None
        self._loaded = False

    def load(self):
        if self._loaded:
            return
        # imported lazily so the API can boot even without tensorflow installed,
        # as long as this service isn't actually used
        import tensorflow as tf
        self.model = tf.keras.models.load_model(MODEL_DIR / "lstm_rul_model.h5", compile=False)
        self.scaler = joblib.load(MODEL_DIR / "lstm_scaler.pkl")
        self._loaded = True

    def predict(self, readings: list[dict]):
        """
        readings: list of dicts (oldest -> newest), each containing
        temperature_C, vibration_mm_s, pressure_psi, current_A, rpm.
        Must contain at least SEQUENCE_LENGTH readings.
        """
        self.load()

        if len(readings) < SEQUENCE_LENGTH:
            raise ValueError(
                f"Need at least {SEQUENCE_LENGTH} historical readings, got {len(readings)}"
            )

        recent = readings[-SEQUENCE_LENGTH:]
        raw = np.array([[r[c] for c in SENSOR_COLS] for r in recent])
        scaled = self.scaler.transform(raw)
        X = scaled.reshape(1, SEQUENCE_LENGTH, len(SENSOR_COLS))

        rul_pred = float(self.model.predict(X, verbose=0)[0][0])
        return {"predicted_rul_cycles": round(max(0, rul_pred), 1)}


rul_service = RULPredictionService()
