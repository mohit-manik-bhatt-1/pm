"""
ML Inference Service
Loads the trained Random Forest / Gradient Boosting classifiers
(and optionally the LSTM RUL model) and exposes a predict() helper
used by the FastAPI routes.
"""

import joblib
import numpy as np
from pathlib import Path

MODEL_DIR = Path(__file__).resolve().parent.parent / "ml_models" / "saved_models"


class PredictionService:
    def __init__(self):
        self.rf_model = None
        self.gb_model = None
        self.scaler = None
        self.label_encoder = None
        self.feature_cols = None
        self._loaded = False

    def load(self):
        """Lazy-load models on first use so the API can boot even if
        training hasn't been run yet."""
        if self._loaded:
            return
        self.rf_model = joblib.load(MODEL_DIR / "rf_model.pkl")
        self.gb_model = joblib.load(MODEL_DIR / "gb_model.pkl")
        self.scaler = joblib.load(MODEL_DIR / "scaler.pkl")
        self.label_encoder = joblib.load(MODEL_DIR / "label_encoder.pkl")
        self.feature_cols = joblib.load(MODEL_DIR / "feature_cols.pkl")
        self._loaded = True

    def _build_feature_row(self, payload: dict):
        """
        Builds a single-row feature vector matching training-time columns.
        Rolling features aren't available for a single live reading, so we
        seed them with the raw value (equivalent to a rolling window of 1).
        """
        base = {
            "temperature_C": payload["temperature_C"],
            "vibration_mm_s": payload["vibration_mm_s"],
            "pressure_psi": payload["pressure_psi"],
            "current_A": payload["current_A"],
            "rpm": payload["rpm"],
            "cycle": payload["cycle"],
        }
        for col in ["temperature_C", "vibration_mm_s", "pressure_psi", "current_A", "rpm"]:
            base[f"{col}_roll_mean"] = payload[col]
            base[f"{col}_roll_std"] = 0.0

        row = [base[c] for c in self.feature_cols]
        return np.array(row).reshape(1, -1)

    def predict(self, payload: dict, model: str = "gb"):
        self.load()
        X = self._build_feature_row(payload)
        X_scaled = self.scaler.transform(X)

        clf = self.gb_model if model == "gb" else self.rf_model
        pred_idx = clf.predict(X_scaled)[0]
        proba = clf.predict_proba(X_scaled)[0]

        state = self.label_encoder.inverse_transform([pred_idx])[0]
        confidence = float(np.max(proba))

        return {
            "predicted_state": state,
            "confidence": round(confidence, 4),
            "model_used": "GradientBoosting" if model == "gb" else "RandomForest",
        }


prediction_service = PredictionService()
