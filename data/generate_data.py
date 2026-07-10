"""
Synthetic Industrial IoT Sensor Data Generator
Predictive Maintenance for Manufacturing

Generates realistic multi-machine sensor time-series data with:
- Normal operating cycles
- Gradual degradation trends
- Failure events
- Remaining Useful Life (RUL) labels

Run: python generate_data.py
Output: sensor_data.csv (in the same folder)
"""

import numpy as np
import pandas as pd
from datetime import datetime, timedelta

np.random.seed(42)

NUM_MACHINES = 25
MACHINE_TYPES = ["CNC_Lathe", "Hydraulic_Press", "Conveyor_Motor", "Industrial_Pump", "Robotic_Arm"]
MAX_CYCLE_LENGTH = 300   # max cycles before failure for a healthy unit
MIN_CYCLE_LENGTH = 120   # min cycles before failure for a weaker unit


def generate_machine_series(machine_id, machine_type, start_time):
    """Simulate one machine's full life (run-to-failure) sensor trajectory."""
    life = np.random.randint(MIN_CYCLE_LENGTH, MAX_CYCLE_LENGTH)
    rows = []

    # baseline sensor characteristics per machine (unit-to-unit variability)
    base_temp = np.random.normal(65, 3)
    base_vibration = np.random.normal(2.0, 0.3)
    base_pressure = np.random.normal(100, 5)
    base_current = np.random.normal(15, 1.5)
    base_rpm = np.random.normal(1450, 40)

    degradation_start = int(life * np.random.uniform(0.55, 0.75))

    for cycle in range(1, life + 1):
        timestamp = start_time + timedelta(hours=cycle)
        rul = life - cycle  # remaining useful life

        if cycle < degradation_start:
            # healthy operation: small noise around baseline
            temp = base_temp + np.random.normal(0, 1.0)
            vibration = base_vibration + np.random.normal(0, 0.1)
            pressure = base_pressure + np.random.normal(0, 1.5)
            current = base_current + np.random.normal(0, 0.4)
            rpm = base_rpm + np.random.normal(0, 15)
            health_state = "Healthy"
        else:
            # degradation phase: trend worsens as failure approaches
            progress = (cycle - degradation_start) / max(1, (life - degradation_start))
            temp = base_temp + progress * np.random.uniform(15, 25) + np.random.normal(0, 1.2)
            vibration = base_vibration + progress * np.random.uniform(3, 5) + np.random.normal(0, 0.15)
            pressure = base_pressure - progress * np.random.uniform(10, 18) + np.random.normal(0, 1.5)
            current = base_current + progress * np.random.uniform(4, 7) + np.random.normal(0, 0.5)
            rpm = base_rpm - progress * np.random.uniform(80, 150) + np.random.normal(0, 20)
            health_state = "Warning" if progress < 0.75 else "Critical"

        failure_flag = 1 if cycle == life else 0

        rows.append({
            "machine_id": machine_id,
            "machine_type": machine_type,
            "timestamp": timestamp,
            "cycle": cycle,
            "temperature_C": round(temp, 2),
            "vibration_mm_s": round(vibration, 3),
            "pressure_psi": round(pressure, 2),
            "current_A": round(current, 2),
            "rpm": round(rpm, 1),
            "health_state": health_state,
            "RUL": rul,
            "failure": failure_flag,
        })

    return rows


def main():
    all_rows = []
    start = datetime(2025, 1, 1)

    for i in range(1, NUM_MACHINES + 1):
        machine_id = f"M{i:03d}"
        machine_type = MACHINE_TYPES[(i - 1) % len(MACHINE_TYPES)]
        machine_start = start + timedelta(days=np.random.randint(0, 10))
        all_rows.extend(generate_machine_series(machine_id, machine_type, machine_start))

    df = pd.DataFrame(all_rows)
    out_path = __file__.replace("generate_data.py", "sensor_data.csv")
    df.to_csv(out_path, index=False)
    print(f"Generated {len(df)} rows across {NUM_MACHINES} machines -> {out_path}")
    print(df.head())
    print("\nHealth state distribution:")
    print(df["health_state"].value_counts())


if __name__ == "__main__":
    main()
