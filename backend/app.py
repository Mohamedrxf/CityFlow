from fastapi import FastAPI, UploadFile, File
from fastapi.middleware.cors import CORSMiddleware
import os
import shutil

from traffic_classifier import classify_traffic
from ambulance_detector import detect_ambulance
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


def save_file(file: UploadFile, suffix: str):
    path = os.path.join(UPLOAD_DIR, f"{suffix}_{file.filename}")
    with open(path, "wb") as buffer:
        shutil.copyfileobj(file.file, buffer)
    return path


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

    # --- Per-direction analysis ---
    for direction, path in images.items():
        traffic_level, edge_density = classify_traffic(path)
        detected, confidence = detect_ambulance(path)

        analysis[direction] = {
            "traffic_level": traffic_level,
            "edge_density": round(edge_density, 3),
            "ambulance_detected": detected,
            "confidence": round(confidence, 2) if detected else None
        }

        if detected and confidence > ambulance_confidence:
            ambulance_direction = direction
            ambulance_confidence = confidence

    # --- Decision Engine ---
    decision = decide_mode(ambulance_direction)

    # --- Signal Plan ---
    signal_plan = generate_signal_plan(decision["mode"], ambulance_direction)

    return {
        "intersection_id": "JNC_001",
        "mode": decision["mode"],
        "analysis": analysis,
        "signal_plan": signal_plan,
        "reason": decision["reason"]
    }
