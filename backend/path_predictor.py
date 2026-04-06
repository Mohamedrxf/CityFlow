# backend/path_predictor.py
from city_graph import get_shortest_path, get_path_distances

AVERAGE_AMBULANCE_SPEED_MPS = 11  # ~40 kmph in city


def predict_path_with_eta(
    current_intersection: str,
    destination: str,
    speed_mps: float = AVERAGE_AMBULANCE_SPEED_MPS
) -> dict:
    """
    Predicts the full path and ETA at each intersection.
    Returns path + seconds until ambulance reaches each node.
    """
    path = get_shortest_path(current_intersection, destination)
    
    if not path:
        return {"path": [], "eta_seconds": [], "pre_clear_schedule": []}

    distances = get_path_distances(path)

    # Calculate cumulative ETA at each intersection
    eta_seconds = []
    cumulative = 0
    for dist in distances:
        cumulative += dist / speed_mps
        eta_seconds.append(round(cumulative, 1))

    # Pre-clear schedule: clear signal X seconds BEFORE ambulance arrives
    PRE_CLEAR_BUFFER = 8  # seconds early to clear signal
    pre_clear_schedule = []
    for i, intersection in enumerate(path[1:], 0):  # skip current
        clear_at = max(0, eta_seconds[i] - PRE_CLEAR_BUFFER)
        pre_clear_schedule.append({
            "intersection": intersection,
            "clear_at_seconds": clear_at,
            "ambulance_arrives_at": eta_seconds[i]
        })

    return {
        "path": path,
        "eta_seconds": eta_seconds,
        "pre_clear_schedule": pre_clear_schedule,
        "total_eta_seconds": eta_seconds[-1] if eta_seconds else 0
    }