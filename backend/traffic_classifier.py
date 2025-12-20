import cv2
import numpy as np

# Thresholds (will be calibrated)
LOW_THRESHOLD    = 0.1441
MEDIUM_THRESHOLD = 0.2222


def extract_edge_density(image_path):
    img = cv2.imread(image_path)

    if img is None:
        raise ValueError(f"Cannot read image: {image_path}")

    gray = cv2.cvtColor(img, cv2.COLOR_BGR2GRAY)
    edges = cv2.Canny(gray, 50, 150)

    edge_pixels = np.sum(edges > 0)
    total_pixels = edges.size

    edge_density = edge_pixels / total_pixels
    return edge_density


def classify_traffic(image_path):
    edge_density = extract_edge_density(image_path)

    if edge_density < LOW_THRESHOLD:
        return "LOW", edge_density
    elif edge_density < MEDIUM_THRESHOLD:
        return "MEDIUM", edge_density
    else:
        return "HIGH", edge_density
