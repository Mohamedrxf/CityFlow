from ultralytics import YOLO
import os

MODEL_PATH = os.path.join(
    os.path.dirname(__file__),
    "models",
    "ambulance_yolov8.pt"
)

model = YOLO(MODEL_PATH)

CONFIDENCE_THRESHOLD = 0.7  # 🚨 critical safety gate

def detect_ambulance(image_path: str):
    """
    Returns:
        (bool, float)
    """

    results = model(image_path, conf=0.25, verbose=False)

    best_confidence = 0.0

    for r in results:
        if r.boxes is None:
            continue

        for box in r.boxes:
            cls_id = int(box.cls[0])
            conf = float(box.conf[0])
            class_name = model.names[cls_id]

            if class_name == "ambulance":
                best_confidence = max(best_confidence, conf)

    # 🚨 decision gate
    if best_confidence >= CONFIDENCE_THRESHOLD:
        return True, best_confidence

    return False, best_confidence
