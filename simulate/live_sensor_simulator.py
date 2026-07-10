"""
Live Sensor Simulator

Simulates real IoT machines streaming sensor data into the backend,
so you can see the dashboard, charts, alerts, and predictions update
in real time without real hardware connected.

Run (after backend is up on http://localhost:8000):
    python live_sensor_simulator.py
"""

import time
import random
import requests
from datetime import datetime

API_BASE = "http://localhost:8000/api"
MACHINE_IDS = ["M001", "M002", "M003", "M004", "M005"]

# per-machine running cycle count + degradation state (in-memory only)
machine_state = {mid: {"cycle": 0, "degrading": False} for mid in MACHINE_IDS}


def generate_reading(machine_id):
    state = machine_state[machine_id]
    state["cycle"] += 1

    # randomly start a degradation trend to make the demo interesting
    if not state["degrading"] and random.random() < 0.02:
        state["degrading"] = True

    if state["degrading"]:
        temp = 65 + min(state["cycle"] % 100, 40) * 0.6 + random.uniform(-1, 1)
        vibration = 2.0 + min(state["cycle"] % 100, 40) * 0.1 + random.uniform(-0.1, 0.1)
        pressure = 100 - min(state["cycle"] % 100, 40) * 0.3 + random.uniform(-1, 1)
        current = 15 + min(state["cycle"] % 100, 40) * 0.15 + random.uniform(-0.3, 0.3)
        rpm = 1450 - min(state["cycle"] % 100, 40) * 3 + random.uniform(-15, 15)
    else:
        temp = 65 + random.uniform(-2, 2)
        vibration = 2.0 + random.uniform(-0.15, 0.15)
        pressure = 100 + random.uniform(-2, 2)
        current = 15 + random.uniform(-0.5, 0.5)
        rpm = 1450 + random.uniform(-20, 20)

    return {
        "machine_id": machine_id,
        "cycle": state["cycle"],
        "timestamp": datetime.utcnow().isoformat(),
        "temperature_c": round(temp, 2),
        "vibration_mm_s": round(vibration, 3),
        "pressure_psi": round(pressure, 2),
        "current_a": round(current, 2),
        "rpm": round(rpm, 1),
    }


def main():
    print(f"Streaming simulated sensor data for {len(MACHINE_IDS)} machines to {API_BASE}")
    print("Ctrl+C to stop.\n")

    while True:
        for machine_id in MACHINE_IDS:
            reading = generate_reading(machine_id)
            try:
                resp = requests.post(f"{API_BASE}/sensor-readings", json=reading, timeout=5)
                if resp.status_code == 200:
                    print(f"[{reading['timestamp']}] {machine_id} -> temp={reading['temperature_c']}C "
                          f"vib={reading['vibration_mm_s']} rpm={reading['rpm']}")

                    # every few cycles, also run it through the ML prediction endpoint
                    if reading["cycle"] % 5 == 0:
                        predict_payload = {
                            "machine_id": machine_id,
                            "cycle": reading["cycle"],
                            "temperature_C": reading["temperature_c"],
                            "vibration_mm_s": reading["vibration_mm_s"],
                            "pressure_psi": reading["pressure_psi"],
                            "current_A": reading["current_a"],
                            "rpm": reading["rpm"],
                        }
                        pred_resp = requests.post(f"{API_BASE}/predict", json=predict_payload, timeout=5)
                        if pred_resp.status_code == 200:
                            state = pred_resp.json()["predicted_state"]
                            print(f"    -> predicted state: {state}")
                else:
                    print(f"    ! failed ({resp.status_code}): {resp.text}")
            except requests.exceptions.ConnectionError:
                print("Backend not reachable - is uvicorn running on port 8000?")
                return

        time.sleep(2)  # one "tick" every 2 seconds across all machines


if __name__ == "__main__":
    try:
        main()
    except KeyboardInterrupt:
        print("\nSimulator stopped.")
