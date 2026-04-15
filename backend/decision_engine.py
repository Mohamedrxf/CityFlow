import time

_cooldown_until = 0
COOLDOWN_SECONDS = 15

def decide_mode(ambulance_direction):
    global _cooldown_until

    if ambulance_direction:
        _cooldown_until = time.time() + COOLDOWN_SECONDS
        return {
            "mode": "EMERGENCY",
            "priority": "AMBULANCE",
            "reason": f"Ambulance detected on {ambulance_direction} approach"
        }

    if time.time() < _cooldown_until:
        return {
            "mode": "COOLDOWN",
            "priority": "RESTORE",
            "reason": "Ambulance cleared — restoring normal signals"
        }

    return {
        "mode": "NORMAL",
        "priority": "TRAFFIC",
        "reason": "No emergency vehicle detected"
    }