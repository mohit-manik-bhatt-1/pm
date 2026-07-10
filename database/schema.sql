-- ============================================================
-- Predictive Maintenance for Manufacturing - MySQL Schema
-- ============================================================

CREATE DATABASE IF NOT EXISTS predictive_maintenance
    CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

USE predictive_maintenance;

-- ------------------------------------------------------------
-- Machines master table
-- ------------------------------------------------------------
CREATE TABLE machines (
    machine_id      VARCHAR(10)  PRIMARY KEY,
    machine_name    VARCHAR(100) NOT NULL,
    machine_type    VARCHAR(50)  NOT NULL,
    location         VARCHAR(100),
    installed_date  DATE,
    status          ENUM('Running','Idle','Under Maintenance','Decommissioned') DEFAULT 'Running',
    created_at      TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- ------------------------------------------------------------
-- Raw sensor readings (time-series, high write volume)
-- ------------------------------------------------------------
CREATE TABLE sensor_readings (
    reading_id      BIGINT AUTO_INCREMENT PRIMARY KEY,
    machine_id      VARCHAR(10) NOT NULL,
    cycle           INT NOT NULL,
    timestamp       DATETIME NOT NULL,
    temperature_c   DECIMAL(6,2),
    vibration_mm_s  DECIMAL(6,3),
    pressure_psi    DECIMAL(6,2),
    current_a       DECIMAL(6,2),
    rpm             DECIMAL(7,1),
    FOREIGN KEY (machine_id) REFERENCES machines(machine_id) ON DELETE CASCADE,
    INDEX idx_machine_time (machine_id, timestamp)
);

-- ------------------------------------------------------------
-- Model predictions (health state + RUL) per reading
-- ------------------------------------------------------------
CREATE TABLE predictions (
    prediction_id     BIGINT AUTO_INCREMENT PRIMARY KEY,
    machine_id        VARCHAR(10) NOT NULL,
    reading_id        BIGINT,
    predicted_state   ENUM('Healthy','Warning','Critical') NOT NULL,
    confidence        DECIMAL(5,4),
    predicted_rul     INT,
    model_used        VARCHAR(50),
    predicted_at      TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (machine_id) REFERENCES machines(machine_id) ON DELETE CASCADE,
    FOREIGN KEY (reading_id) REFERENCES sensor_readings(reading_id) ON DELETE SET NULL,
    INDEX idx_machine_predicted (machine_id, predicted_at)
);

-- ------------------------------------------------------------
-- Alerts generated from predictions
-- ------------------------------------------------------------
CREATE TABLE alerts (
    alert_id        BIGINT AUTO_INCREMENT PRIMARY KEY,
    machine_id      VARCHAR(10) NOT NULL,
    prediction_id   BIGINT,
    severity        ENUM('Low','Medium','High','Critical') NOT NULL,
    message         VARCHAR(255) NOT NULL,
    is_resolved     BOOLEAN DEFAULT FALSE,
    created_at      TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    resolved_at     TIMESTAMP NULL,
    FOREIGN KEY (machine_id) REFERENCES machines(machine_id) ON DELETE CASCADE,
    FOREIGN KEY (prediction_id) REFERENCES predictions(prediction_id) ON DELETE SET NULL
);

-- ------------------------------------------------------------
-- Maintenance scheduling
-- ------------------------------------------------------------
CREATE TABLE maintenance_schedule (
    schedule_id      BIGINT AUTO_INCREMENT PRIMARY KEY,
    machine_id       VARCHAR(10) NOT NULL,
    scheduled_date   DATE NOT NULL,
    maintenance_type ENUM('Preventive','Predictive','Corrective') NOT NULL,
    assigned_to      VARCHAR(100),
    status           ENUM('Scheduled','In Progress','Completed','Cancelled') DEFAULT 'Scheduled',
    notes            TEXT,
    created_at       TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    completed_at     TIMESTAMP NULL,
    FOREIGN KEY (machine_id) REFERENCES machines(machine_id) ON DELETE CASCADE
);

-- ------------------------------------------------------------
-- Users (for dashboard login / role-based access)
-- ------------------------------------------------------------
CREATE TABLE users (
    user_id       INT AUTO_INCREMENT PRIMARY KEY,
    username      VARCHAR(50) UNIQUE NOT NULL,
    email         VARCHAR(100) UNIQUE NOT NULL,
    password_hash VARCHAR(255) NOT NULL,
    role          ENUM('Admin','Engineer','Viewer') DEFAULT 'Viewer',
    created_at    TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- ------------------------------------------------------------
-- Seed a few sample machines
-- ------------------------------------------------------------
INSERT INTO machines (machine_id, machine_name, machine_type, location, installed_date) VALUES
('M001', 'CNC Lathe Unit 1', 'CNC_Lathe', 'Shop Floor A', '2023-01-15'),
('M002', 'Hydraulic Press 1', 'Hydraulic_Press', 'Shop Floor A', '2023-02-10'),
('M003', 'Conveyor Motor 1', 'Conveyor_Motor', 'Shop Floor B', '2023-03-05'),
('M004', 'Industrial Pump 1', 'Industrial_Pump', 'Shop Floor B', '2023-04-20'),
('M005', 'Robotic Arm 1', 'Robotic_Arm', 'Shop Floor C', '2023-05-12');
