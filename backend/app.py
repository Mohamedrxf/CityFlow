from fastapi import FastAPI, UploadFile, File, WebSocket, WebSocketDisconnect
from fastapi.middleware.cors import CORSMiddleware

from typing import List

from pydantic import BaseModel

import os
import shutil

from traffic_classifier import classify_traffic
from ambulance_detector import detect_ambulance
from rule_based_detector import detect_ambulance as rule_detect
from decision_engine import decide_mode
from signal_controller import generate_signal_plan

from path_predictor import predict_path_with_eta
from anomaly_detector import AnomalyDetector
from incident_logger import create_incident, close_incident, load_incidents
from report_generator import generate_incident_report

app = FastAPI(title="CityFlow Intelligent Traffic Control API")

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_methods=["*"],
    allow_headers=["*"],
)

UPLOAD_DIR = "temp_uploads"
os.makedirs(UPLOAD_DIR, exist_ok=True)

connected_clients: List[WebSocket] = []


# ─────────────────────────────────────────────────────────────
# Pydantic Models
# ─────────────────────────────────────────────────────────────
class PathRequest(BaseModel):
    current_intersection: str
    destination: str
    speed_mps: float = 11.0


class TelemetryRequest(BaseModel):
    ambulance_id: str
    position: str
    speed: float
    signal_state: str | None = None


class IncidentStartRequest(BaseModel):
    ambulance_id: str
    destination: str


class ReportRequest(BaseModel):
    incident_id: str


# ─────────────────────────────────────────────────────────────
# In-memory state
# ─────────────────────────────────────────────────────────────
active_detectors: dict[str, AnomalyDetector] = {}
active_incidents: dict[str, dict] = {}


# ─────────────────────────────────────────────────────────────
# Utility
# ─────────────────────────────────────────────────────────────
def save_file(file: UploadFile, suffix: str) -> str:
    path = os.path.join(UPLOAD_DIR, f"{suffix}_{file.filename}")
    with open(path, "wb") as buffer:
        shutil.copyfileobj(file.file, buffer)
    return path



@app.websocket("/ws")
async def websocket_endpoint(ws: WebSocket):
    await ws.accept()
    connected_clients.append(ws)
    try:
        while True:
            await ws.receive_text()
    except WebSocketDisconnect:
        connected_clients.remove(ws)


async def broadcast(event: dict):
    for client in connected_clients.copy():
        try:
            await client.send_json(event)
        except:
            connected_clients.remove(client)


@app.get("/health")
def health():
    return {"status": "ok", "model": "loaded"}



@app.post("/analyze")
async def analyze(
    north_image: UploadFile = File(...),
    south_image: UploadFile = File(...),
    east_image: UploadFile = File(...),
    west_image: UploadFile = File(...)
):
    images = {
        "north": save_file(north_image, "north"),
        "south": save_file(south_image, "south"),
        "east": save_file(east_image, "east"),
        "west": save_file(west_image, "west")
    }

    analysis = {}
    ambulance_direction = None
    ambulance_confidence = 0.0

    # Per-direction analysis
    for direction, path in images.items():
        traffic_level, edge_density = classify_traffic(path)
        detected, confidence = detect_ambulance(path)

        if not detected and 0.4 < confidence < 0.7:
            rule_result = rule_detect(path)
            if rule_result["ambulance_detected"]:
                detected = True
                confidence = 0.65

        analysis[direction] = {
            "traffic_level": traffic_level,
            "edge_density": round(edge_density, 3),
            "ambulance_detected": detected,
            "confidence": round(confidence, 2) if detected else None
        }

        if detected and confidence > ambulance_confidence:
            ambulance_direction = direction
            ambulance_confidence = confidence

    # Decision engine
    decision = decide_mode(ambulance_direction)

    # Signal plan
    signal_plan = generate_signal_plan(decision["mode"], ambulance_direction)

    result = {
        "intersection_id": "JNC_001",
        "mode": decision["mode"],
        "analysis": analysis,
        "signal_plan": signal_plan,
        "reason": decision["reason"]
    }


# ─────────────────────────────────────────────────────────────
# New Feature 1: Predictive Pre-clearing
# ─────────────────────────────────────────────────────────────
@app.post("/predict-path")
async def predict_path(req: PathRequest):
    result = predict_path_with_eta(
        req.current_intersection,
        req.destination,
        req.speed_mps
    )
    return result


# ─────────────────────────────────────────────────────────────
# New Feature 2: Telemetry Anomaly Detection via WebSocket
# ─────────────────────────────────────────────────────────────
@app.websocket("/ws/telemetry/{ambulance_id}")
async def telemetry_ws(websocket: WebSocket, ambulance_id: str):
    await websocket.accept()

    detector = AnomalyDetector(ambulance_id)
    active_detectors[ambulance_id] = detector

    try:
        while True:
            data = await websocket.receive_json()

            anomalies = detector.push_telemetry(
                position=data["position"],
                speed=data["speed"],
                signal_state=data.get("signal_state")
            )

            await websocket.send_json({
                "ambulance_id": ambulance_id,
                "anomalies": anomalies,
                "anomaly_count": len(anomalies)
            })

    except WebSocketDisconnect:
        if ambulance_id in active_detectors:
            del active_detectors[ambulance_id]


# ─────────────────────────────────────────────────────────────
# New Feature 3: Incident Lifecycle
# ─────────────────────────────────────────────────────────────
@app.post("/start-incident")
async def start_incident(req: IncidentStartRequest):
    incident = create_incident(req.ambulance_id, req.destination)
    active_incidents[incident["incident_id"]] = incident
    return incident


@app.post("/close-incident/{incident_id}")
async def end_incident(incident_id: str):
    if incident_id not in active_incidents:
        return {"error": "Incident not found"}

    incident = close_incident(active_incidents[incident_id])
    del active_incidents[incident_id]
    return incident


@app.post("/generate-report/{incident_id}")
async def generate_report(incident_id: str):
    incidents = load_incidents()
    incident = next((i for i in incidents if i["incident_id"] == incident_id), None)

    if not incident:
        return {"error": "Incident not found"}

    report = generate_incident_report(incident)
    return {
        "incident_id": incident_id,
        "report": report
    }


@app.get("/incidents")
async def get_all_incidents():
    return load_incidents()
