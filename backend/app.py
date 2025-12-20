from fastapi import FastAPI, UploadFile, File
from fastapi.middleware.cors import CORSMiddleware
import shutil
import os

from traffic_classifier import classify_traffic

app = FastAPI(title="CityFlow Traffic Analysis API")

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_methods=["*"],
    allow_headers=["*"],
)

UPLOAD_DIR = "temp_uploads"
os.makedirs(UPLOAD_DIR, exist_ok=True)


@app.post("/analyze-traffic")
async def analyze_traffic(file: UploadFile = File(...)):
    file_path = os.path.join(UPLOAD_DIR, file.filename)

    with open(file_path, "wb") as buffer:
        shutil.copyfileobj(file.file, buffer)

    traffic_level, edge_density = classify_traffic(file_path)

    delay_map = {
        "LOW": 0,
        "MEDIUM": 5,
        "HIGH": 10
    }

    delay_minutes = delay_map[traffic_level]

    return {
        "traffic_level": traffic_level,
        "edge_density": round(edge_density, 4),
        "delay_minutes": delay_minutes
    }
