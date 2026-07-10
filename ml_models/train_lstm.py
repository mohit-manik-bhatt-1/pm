"""
Predictive Maintenance - Remaining Useful Life (RUL) Prediction
Model: LSTM (TensorFlow / Keras)

Uses sliding windows of sensor readings per machine to predict how many
cycles remain before failure.

NOTE: requires `tensorflow` (see requirements.txt). Run locally:
    pip install -r requirements.txt
    python train_lstm.py

Outputs: saved_models/lstm_rul_model.h5, saved_models/lstm_scaler.pkl
"""

import numpy as np
import pandas as pd
import joblib
import json
from pathlib import Path

from sklearn.preprocessing import MinMaxScaler
from sklearn.model_selection import train_test_split

import tensorflow as tf
from tensorflow.keras.models import Sequential
from tensorflow.keras.layers import LSTM, Dense, Dropout
from tensorflow.keras.callbacks import EarlyStopping

BASE_DIR = Path(__file__).resolve().parent
DATA_PATH = BASE_DIR.parent / "data" / "sensor_data.csv"
SAVE_DIR = BASE_DIR / "saved_models"
SAVE_DIR.mkdir(exist_ok=True)

SEQUENCE_LENGTH = 20  # cycles of history used to predict RUL
SENSOR_COLS = ["temperature_C", "vibration_mm_s", "pressure_psi", "current_A", "rpm"]

# cap RUL so the model isn't asked to distinguish "500 cycles left" from
# "600 cycles left" -- clip to a maintenance-relevant horizon
RUL_CAP = 150


def build_sequences(df):
    X, y = [], []
    scaler = MinMaxScaler()
    df[SENSOR_COLS] = scaler.fit_transform(df[SENSOR_COLS])

    for machine_id, group in df.groupby("machine_id"):
        group = group.sort_values("cycle")
        sensor_vals = group[SENSOR_COLS].values
        rul_vals = group["RUL"].clip(upper=RUL_CAP).values

        for i in range(len(group) - SEQUENCE_LENGTH):
            X.append(sensor_vals[i:i + SEQUENCE_LENGTH])
            y.append(rul_vals[i + SEQUENCE_LENGTH])

    return np.array(X), np.array(y), scaler


def build_model(input_shape):
    model = Sequential([
        LSTM(64, return_sequences=True, input_shape=input_shape),
        Dropout(0.2),
        LSTM(32),
        Dropout(0.2),
        Dense(16, activation="relu"),
        Dense(1),
    ])
    model.compile(optimizer="adam", loss="mse", metrics=["mae"])
    return model


def main():
    print("Loading data...")
    df = pd.read_csv(DATA_PATH)

    print("Building sequences (this creates sliding windows per machine)...")
    X, y, scaler = build_sequences(df)
    print(f"Sequences: {X.shape}, Targets: {y.shape}")

    X_train, X_test, y_train, y_test = train_test_split(
        X, y, test_size=0.2, random_state=42
    )

    model = build_model((SEQUENCE_LENGTH, len(SENSOR_COLS)))
    model.summary()

    early_stop = EarlyStopping(monitor="val_loss", patience=8, restore_best_weights=True)

    history = model.fit(
        X_train, y_train,
        validation_split=0.15,
        epochs=60,
        batch_size=32,
        callbacks=[early_stop],
        verbose=2,
    )

    test_loss, test_mae = model.evaluate(X_test, y_test, verbose=0)
    print(f"\nTest MAE (cycles): {test_mae:.2f}")

    model.save(SAVE_DIR / "lstm_rul_model.h5")
    joblib.dump(scaler, SAVE_DIR / "lstm_scaler.pkl")

    metrics = {
        "test_mae_cycles": round(float(test_mae), 2),
        "test_mse": round(float(test_loss), 2),
        "sequence_length": SEQUENCE_LENGTH,
        "rul_cap": RUL_CAP,
        "train_sequences": len(X_train),
        "test_sequences": len(X_test),
    }
    with open(SAVE_DIR / "lstm_metrics.json", "w") as f:
        json.dump(metrics, f, indent=2)

    print(json.dumps(metrics, indent=2))


if __name__ == "__main__":
    main()
