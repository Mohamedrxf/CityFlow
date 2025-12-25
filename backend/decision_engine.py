def decide_mode(ambulance_direction):
    if ambulance_direction:
        return {
            "mode": "EMERGENCY",
            "priority": "AMBULANCE",
            "reason": f"Ambulance detected on {ambulance_direction} approach"
        }

    return {
        "mode": "NORMAL",
        "priority": "TRAFFIC",
        "reason": "No emergency vehicle detected"
    }
