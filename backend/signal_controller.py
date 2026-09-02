def generate_signal_plan(mode, ambulance_direction=None):
    signals = {"north": "RED", "south": "RED", "east": "RED", "west": "RED"}

    if mode == "EMERGENCY" and ambulance_direction:
        signals[ambulance_direction] = "GREEN"

    elif mode == "COOLDOWN":
        # Restore opposite pair gradually
        signals["north"] = "YELLOW"
        signals["south"] = "YELLOW"

    else:
        # Proper 2-phase normal rotation (you can make this time-based later)
        signals["north"] = "GREEN"
        signals["south"] = "GREEN"
        signals["east"] = "RED"
        signals["west"] = "RED"

    return signals