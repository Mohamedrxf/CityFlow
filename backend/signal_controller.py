def generate_signal_plan(mode, ambulance_direction=None):
    signals = {
        "north": "RED",
        "south": "RED",
        "east": "RED",
        "west": "RED"
    }

    if mode == "EMERGENCY" and ambulance_direction:
        signals[ambulance_direction] = "GREEN"
    else:
        # Normal cycle (simple placeholder)
        signals["north"] = "GREEN"
        signals["south"] = "GREEN"

    return signals
