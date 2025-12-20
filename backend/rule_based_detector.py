import cv2
import numpy as np
from ultralytics import YOLO
import os
import time

# Load YOLO pretrained model (vehicle proposals only)
model = YOLO("yolov8n.pt")

# -------------------------------
# IOU for NMS
# -------------------------------
def iou(box1, box2):
    x1, y1, x2, y2 = box1
    x1b, y1b, x2b, y2b = box2

    xi1 = max(x1, x1b)
    yi1 = max(y1, y1b)
    xi2 = min(x2, x2b)
    yi2 = min(y2, y2b)

    inter_w = max(0, xi2 - xi1)
    inter_h = max(0, yi2 - yi1)
    inter_area = inter_w * inter_h

    area1 = (x2 - x1) * (y2 - y1)
    area2 = (x2b - x1b) * (y2b - y1b)

    union = area1 + area2 - inter_area
    return inter_area / union if union > 0 else 0

# -------------------------------
# STRICT ambulance rules
# -------------------------------
def is_white_vehicle(crop):
    hsv = cv2.cvtColor(crop, cv2.COLOR_BGR2HSV)
    lower_white = np.array([0, 0, 190])
    upper_white = np.array([180, 50, 255])

    mask = cv2.inRange(hsv, lower_white, upper_white)
    ratio = cv2.countNonZero(mask) / (crop.shape[0] * crop.shape[1])
    return ratio > 0.35   # STRICT


def has_red_markings(crop):
    hsv = cv2.cvtColor(crop, cv2.COLOR_BGR2HSV)

    lower_red1 = np.array([0, 80, 80])
    upper_red1 = np.array([10, 255, 255])
    lower_red2 = np.array([170, 80, 80])
    upper_red2 = np.array([180, 255, 255])

    mask1 = cv2.inRange(hsv, lower_red1, upper_red1)
    mask2 = cv2.inRange(hsv, lower_red2, upper_red2)

    red_ratio = cv2.countNonZero(mask1 + mask2) / (crop.shape[0] * crop.shape[1])
    return red_ratio > 0.025   # STRICT


def is_ambulance_shape(w, h):
    aspect = w / h if h > 0 else 0
    area = w * h
    return 1.7 < aspect < 3.2 and area > 7000


# -------------------------------
# MAIN FUNCTION
# -------------------------------
def detect_ambulance(image_path):
    image = cv2.imread(image_path)
    results = model(image)

    candidate_boxes = []

    for r in results:
        for box in r.boxes:
            conf = float(box.conf[0])
            cls = int(box.cls[0])

            # Only vehicle classes
            if cls not in [2, 5, 7]:  # car, bus, truck
                continue

            if conf < 0.6:  # HIGH confidence only
                continue

            x1, y1, x2, y2 = map(int, box.xyxy[0])
            crop = image[y1:y2, x1:x2]

            if crop.size == 0:
                continue

            w, h = x2 - x1, y2 - y1

            # ALL rules must pass
            if (
                is_ambulance_shape(w, h)
                and is_white_vehicle(crop)
                and has_red_markings(crop)
            ):
                candidate_boxes.append((x1, y1, x2, y2))

    # NMS to avoid duplicates
    final_boxes = []
    for box in candidate_boxes:
        keep = True
        for kept in final_boxes:
            if iou(box, kept) > 0.5:
                keep = False
                break
        if keep:
            final_boxes.append(box)

    # Draw result
    for (x1, y1, x2, y2) in final_boxes:
        cv2.rectangle(image, (x1, y1), (x2, y2), (0, 255, 0), 3)
        cv2.putText(
            image,
            "AMBULANCE",
            (x1, y1 - 10),
            cv2.FONT_HERSHEY_SIMPLEX,
            0.9,
            (0, 255, 0),
            2
        )

    # Save output
    os.makedirs("outputs", exist_ok=True)
    output_path = f"outputs/ambulance_detected_{int(time.time())}.jpg"
    cv2.imwrite(output_path, image)

    return {
        "ambulance_detected": len(final_boxes) > 0,
        "count": len(final_boxes),
        "output_image": output_path
    }
