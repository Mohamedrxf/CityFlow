from fastapi import FastAPI, UploadFile, File, WebSocket, WebSocketDisconnect
from fastapi.middleware.cors import CORSMiddleware
from typing import List
import os
import shutil

from traffic_classifier import classify_traffic
from ambulance_detector import detect_ambulance
from rule_based_detector import detect_ambulance as rule_detect
from decision_engine import decide_mode
from signal_controller import generate_signal_plan

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


def save_file(file: UploadFile, suffix: str):
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

    decision = decide_mode(ambulance_direction)
    signal_plan = generate_signal_plan(decision["mode"], ambulance_direction)

    result = {
        "intersection_id": "JNC_001",
        "mode": decision["mode"],
        "analysis": analysis,
        "signal_plan": signal_plan,
        "reason": decision["reason"]
    }

    await broadcast(result)

    return result