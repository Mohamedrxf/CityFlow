# backend/anomaly_detector.py
import time
from collections import deque
from typing import List, Optional

SEVERITY = {
    "CRITICAL": 1,
    "HIGH": 2,
    "MEDIUM": 3,
    "LOW": 4
}


class AnomalyDetector:
    def __init__(self, ambulance_id: str):
        self.ambulance_id = ambulance_id
        self.position_log = deque(maxlen=60)   # last 60 readings
        self.speed_log = deque(maxlen=30)       # last 30 readings
        self.expected_path = []                 # set from path predictor
        self.active_anomalies = []

    def set_expected_path(self, path: list):
        self.expected_path = path

    def push_telemetry(self, position: str, speed: float, signal_state: Optional[str] = None):
        """
        Call this every time you get a telemetry update from the ambulance.
        position: intersection ID (e.g. "INT_03")
        speed: in km/h
        signal_state: "RED" or "GREEN" at current intersection
        """
        self.position_log.append({
            "position": position,
            "time": time.time()
        })
        self.speed_log.append(speed)

        anomalies = self._analyze(position, speed, signal_state)
        self.active_anomalies = anomalies
        return anomalies

    def _analyze(self, current_pos: str, speed: float, signal_state: Optional[str]) -> list:
        anomalies = []

        # 1. Stuck at intersection (same position for 45+ seconds)
        if self._is_stuck():
            anomalies.append({
                "type": "stuck_at_intersection",
                "severity": "HIGH",
                "message": f"Ambulance {self.ambulance_id} stuck at {current_pos} for 45+ seconds",
                "intersection": current_pos,
                "timestamp": time.time()
            })

        # 2. Speed too low
        if self._speed_critically_low():
            anomalies.append({
                "type": "speed_drop",
                "severity": "MEDIUM",
                "message": f"Ambulance {self.ambulance_id} moving below 5 kmph",
                "intersection": current_pos,
                "timestamp": time.time()
            })

        # 3. Route deviation
        if self.expected_path and current_pos not in self.expected_path:
            anomalies.append({
                "type": "route_deviation",
                "severity": "HIGH",
                "message": f"Ambulance {self.ambulance_id} deviated from planned route at {current_pos}",
                "intersection": current_pos,
                "timestamp": time.time()
            })

        # 4. Signal not cleared (CRITICAL)
        if signal_state == "RED" and speed < 2:
            anomalies.append({
                "type": "signal_not_cleared",
                "severity": "CRITICAL",
                "message": f"Signal override FAILED at {current_pos} — ambulance stopped at RED",
                "intersection": current_pos,
                "timestamp": time.time()
            })

        # Sort by severity
        anomalies.sort(key=lambda x: SEVERITY[x["severity"]])
        return anomalies

    def _is_stuck(self) -> bool:
        if len(self.position_log) < 10:
            return False
        recent = list(self.position_log)[-10:]
        positions = set(p["position"] for p in recent)
        time_span = recent[-1]["time"] - recent[0]["time"]
        return len(positions) == 1 and time_span > 45

    def _speed_critically_low(self) -> bool:
        if len(self.speed_log) < 5:
            return False
        recent = list(self.speed_log)[-5:]
        return all(s < 5 for s in recent)

    def clear_anomalies(self):
        self.active_anomalies = []