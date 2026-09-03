from fastapi import FastAPI, UploadFile, File, WebSocket, WebSocketDisconnect, HTTPException
from fastapi.middleware.cors import CORSMiddleware

from typing import List

from pydantic import BaseModel

import os
from networkx import NodeNotFound

from traffic_classifier import classify_traffic
from ambulance_detector import detect_ambulance
from rule_based_detector import detect_ambulance as rule_detect
from decision_engine import decide_mode
from signal_controller import generate_signal_plan

from path_predictor import predict_path_with_eta
from anomaly_detector import AnomalyDetector
from incident_logger import create_incident, close_incident, load_incidents
from report_generator import generate_incident_report
from city_graph import get_path_distances

app = FastAPI(title="CityFlow Intelligent Traffic Control API")

CORS_ORIGIN = os.getenv("CITYFLOW_CORS_ORIGIN", "http://localhost:8080")

app.add_middleware(
    CORSMiddleware,
    allow_origins=[CORS_ORIGIN],
    allow_methods=["*"],
    allow_headers=["*"],
)

UPLOAD_DIR = os.path.join(os.path.dirname(__file__), "temp_uploads")
os.makedirs(UPLOAD_DIR, exist_ok=True)

# Upload safety limits (image analysis use case)
MAX_UPLOAD_BYTES = 10 * 1024 * 1024  # 10 MB per image
ALLOWED_IMAGE_EXTENSIONS = {".jpg", ".jpeg", ".png", ".webp"}


def _validate_upload(file: UploadFile) -> str:
    """Return a safe basename for the upload; reject anything unsafe/unsupported."""
    name = os.path.basename(file.filename or "").strip()
    if not name:
        raise HTTPException(status_code=400, detail="Missing or invalid filename")
    ext = os.path.splitext(name)[1].lower()
    if ext not in ALLOWED_IMAGE_EXTENSIONS:
        raise HTTPException(status_code=415, detail="Unsupported file type")
    return name


def save_file(file: UploadFile, suffix: str) -> str:
    name = _validate_upload(file)
    path = os.path.join(UPLOAD_DIR, f"{suffix}_{name}")
    size = 0
    try:
        with open(path, "wb") as buffer:
            while True:
                chunk = file.file.read(1024 * 1024)
                if not chunk:
                    break
                size += len(chunk)
                if size > MAX_UPLOAD_BYTES:
                    raise HTTPException(status_code=413, detail="Uploaded file too large")
                buffer.write(chunk)
    except HTTPException:
        if os.path.exists(path):
            os.remove(path)
        raise
    return path

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
    saved_paths: list[str] = []
    try:
        images = {
            "north": save_file(north_image, "north"),
            "south": save_file(south_image, "south"),
            "east": save_file(east_image, "east"),
            "west": save_file(west_image, "west")
        }
        saved_paths = list(images.values())

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

        return result
    finally:
        # Remove only the temporary files created by this request
        for p in saved_paths:
            try:
                if os.path.exists(p):
                    os.remove(p)
            except OSError:
                pass


# ─────────────────────────────────────────────────────────────
# New Feature 1: Predictive Pre-clearing
# ─────────────────────────────────────────────────────────────
@app.post("/predict-path")
async def predict_path(req: PathRequest):
    try:
        result = predict_path_with_eta(
            req.current_intersection,
            req.destination,
            req.speed_mps
        )
    except NodeNotFound:
        raise HTTPException(
            status_code=400,
            detail=f"Unknown intersection: '{req.current_intersection}' or '{req.destination}' is not in the city graph.",
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

            # Safe extraction — prevent crashes and false anomalies
            position = str(data.get("position", "UNKNOWN"))

            # Validate speed: must be a valid numeric value
            # Invalid speed (null, non-numeric string) must NOT become 0.0
            # because 0.0 is a legitimate stationary-ambulance reading
            # that would incorrectly trigger a speed_drop anomaly.
            raw_speed = data.get("speed")
            speed_valid = True
            if raw_speed is None:
                speed_valid = False
                speed = 0.0
            else:
                try:
                    speed = float(raw_speed)
                except (TypeError, ValueError):
                    speed_valid = False
                    speed = 0.0

            signal_state = data.get("signal_state")
            if signal_state is not None:
                signal_state = str(signal_state)

            # Only push valid telemetry to the anomaly detector
            if speed_valid:
                anomalies = detector.push_telemetry(
                    position=position,
                    speed=speed,
                    signal_state=signal_state
                )
            else:
                anomalies = []

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
    matching = [i for i in incidents if i["incident_id"] == incident_id]
    # Prefer the most recent record for this incident_id (handles legacy duplicates)
    incident = matching[-1] if matching else None

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


# ─────────────────────────────────────────────────────────────
# Driver Live-State
# ─────────────────────────────────────────────────────────────
DEFAULT_DEPARTURE = "INT_01"


@app.get("/api/driver/live")
async def driver_live_state():
    """Return authoritative driver live-state derived from active incidents
    and deterministic path/ETA computation. Only fields with a real backend
    source are included; all others are omitted and keep frontend defaults."""

    if not active_incidents:
        return {
            "corridor_active": False,
            "emergency_mode": False,
            "incident_status": "IDLE",
            "advisory": "No active incident. Standing by.",
        }

    incident = list(active_incidents.values())[-1]
    ambulance_id = incident["ambulance_id"]
    destination = incident["destination"]

    path_result = predict_path_with_eta(DEFAULT_DEPARTURE, destination)
    eta_seconds = path_result.get("total_eta_seconds", 0)
    path = path_result.get("path", [])
    total_distance_m = sum(get_path_distances(path)) if path else 0

    minutes = round(eta_seconds / 60) if eta_seconds else 0

    return {
        "incident_id": incident["incident_id"],
        "ambulance_id": ambulance_id,
        "hospital_name": destination,
        "eta_seconds": eta_seconds,
        "distance_km": round(total_distance_m / 1000, 2),
        "corridor_active": True,
        "emergency_mode": True,
        "incident_status": incident["status"],
        "advisory": f"Green corridor active to {destination}. ETA {minutes} min.",
    }
