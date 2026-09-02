# backend/incident_logger.py
import json
import os
import time
from datetime import datetime


INCIDENTS_FILE = "outputs/incidents.json"


def load_incidents() -> list:
    if not os.path.exists(INCIDENTS_FILE):
        return []
    with open(INCIDENTS_FILE, "r") as f:
        return json.load(f)


def save_incident(incident: dict):
    incidents = load_incidents()
    # Update the existing record for this incident_id if present, otherwise append
    for i, existing in enumerate(incidents):
        if existing.get("incident_id") == incident.get("incident_id"):
            incidents[i] = incident
            break
    else:
        incidents.append(incident)
    os.makedirs("outputs", exist_ok=True)
    with open(INCIDENTS_FILE, "w") as f:
        json.dump(incidents, f, indent=2)


def create_incident(ambulance_id: str, destination: str) -> dict:
    """Call this when an ambulance emergency starts"""
    incident = {
        "incident_id": f"INC_{int(time.time())}",
        "ambulance_id": ambulance_id,
        "destination": destination,
        "start_time": datetime.now().isoformat(),
        "end_time": None,
        "route_taken": [],
        "signals_overridden": 0,
        "anomalies_detected": [],
        "total_time_mins": None,
        "status": "ACTIVE"
    }
    save_incident(incident)
    return incident


def close_incident(incident: dict) -> dict:
    """Call this when ambulance reaches hospital"""
    incident["end_time"] = datetime.now().isoformat()
    incident["status"] = "COMPLETED"
    
    start = datetime.fromisoformat(incident["start_time"])
    end = datetime.fromisoformat(incident["end_time"])
    incident["total_time_mins"] = round((end - start).seconds / 60, 1)
    
    save_incident(incident)
    return incident