"""
Predictive Maintenance - Failure/Health-State Classification
Models: Random Forest, Gradient Boosting

Trains on engineered features from sensor_data.csv and predicts
health_state (Healthy / Warning / Critical).

Run: python train_classification.py
Outputs: saved_models/rf_model.pkl, saved_models/gb_model.pkl,
         saved_models/label_encoder.pkl, saved_models/scaler.pkl
"""

import pandas as pd
import numpy as np
import joblib
import json
from pathlib import Path

from sklearn.model_selection import train_test_split
from sklearn.ensemble import RandomForestClassifier, GradientBoostingClassifier
from sklearn.preprocessing import StandardScaler, LabelEncoder
from sklearn.metrics import accuracy_score, classification_report, confusion_matrix

BASE_DIR = Path(__file__).resolve().parent
DATA_PATH = BASE_DIR.parent / "data" / "sensor_data.csv"
SAVE_DIR = BASE_DIR / "saved_models"
SAVE_DIR.mkdir(exist_ok=True)

FEATURES = [
    "temperature_C", "vibration_mm_s", "pressure_psi",
    "current_A", "rpm", "cycle",
]
TARGET = "health_state"


def engineer_features(df):
    """Add rolling-window features per machine (captures trend, not just snapshot)."""
    df = df.sort_values(["machine_id", "cycle"]).copy()
    for col in ["temperature_C", "vibration_mm_s", "pressure_psi", "current_A", "rpm"]:
        df[f"{col}_roll_mean"] = (
            df.groupby("machine_id")[col].transform(lambda s: s.rolling(5, min_periods=1).mean())
        )
        df[f"{col}_roll_std"] = (
            df.groupby("machine_id")[col].transform(lambda s: s.rolling(5, min_periods=1).std().fillna(0))
        )
    return df


def main():
    print("Loading data...")
    df = pd.read_csv(DATA_PATH)
    df = engineer_features(df)

    feature_cols = FEATURES + [c for c in df.columns if "_roll_" in c]
    X = df[feature_cols]
    y = df[TARGET]

    le = LabelEncoder()
    y_enc = le.fit_transform(y)

    X_train, X_test, y_train, y_test = train_test_split(
        X, y_enc, test_size=0.2, random_state=42, stratify=y_enc
    )

    scaler = StandardScaler()
    X_train_scaled = scaler.fit_transform(X_train)
    X_test_scaled = scaler.transform(X_test)

    print("Training Random Forest...")
    rf = RandomForestClassifier(
        n_estimators=200, max_depth=12, min_samples_split=4,
        random_state=42, n_jobs=-1
    )
    rf.fit(X_train_scaled, y_train)
    rf_pred = rf.predict(X_test_scaled)
    rf_acc = accuracy_score(y_test, rf_pred)
    print(f"Random Forest Accuracy: {rf_acc:.4f}")
    print(classification_report(y_test, rf_pred, target_names=le.classes_))

    print("Training Gradient Boosting...")
    gb = GradientBoostingClassifier(
        n_estimators=150, max_depth=4, learning_rate=0.1, random_state=42
    )
    gb.fit(X_train_scaled, y_train)
    gb_pred = gb.predict(X_test_scaled)
    gb_acc = accuracy_score(y_test, gb_pred)
    print(f"Gradient Boosting Accuracy: {gb_acc:.4f}")
    print(classification_report(y_test, gb_pred, target_names=le.classes_))

    # Save artifacts
    joblib.dump(rf, SAVE_DIR / "rf_model.pkl")
    joblib.dump(gb, SAVE_DIR / "gb_model.pkl")
    joblib.dump(scaler, SAVE_DIR / "scaler.pkl")
    joblib.dump(le, SAVE_DIR / "label_encoder.pkl")
    joblib.dump(feature_cols, SAVE_DIR / "feature_cols.pkl")

    metrics = {
        "random_forest_accuracy": round(rf_acc, 4),
        "gradient_boosting_accuracy": round(gb_acc, 4),
        "feature_count": len(feature_cols),
        "train_rows": len(X_train),
        "test_rows": len(X_test),
        "classes": list(le.classes_),
    }
    with open(SAVE_DIR / "classification_metrics.json", "w") as f:
        json.dump(metrics, f, indent=2)

    print("\nSaved models to:", SAVE_DIR)
    print(json.dumps(metrics, indent=2))


if __name__ == "__main__":
    main()
