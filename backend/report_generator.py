# backend/report_generator.py
import ollama  # pip install ollama
import json
import os


OLLAMA_MODEL = os.getenv("CITYFLOW_OLLAMA_MODEL", "llama3:8b")


def generate_incident_report(incident: dict) -> str:
    """
    Feed raw incident log to LLaMA3 → get professional report
    Same Ollama setup you used in OS³
    """

    prompt = f"""
You are CityFlow AI, a smart traffic management system assistant.
Generate a concise, professional incident report based on the data below.

Incident Data:
{json.dumps(incident, indent=2)}

Format your response exactly like this:

INCIDENT REPORT — {incident.get('incident_id', 'N/A')}
==========================================
📋 SUMMARY
[2-line summary of what happened]

🚑 AMBULANCE DETAILS
- ID: ...
- Destination: ...
- Response Time: ... minutes

🗺️ ROUTE TAKEN
[List intersections]

⚠️ ISSUES ENCOUNTERED
[List anomalies or "None detected"]

🔁 SIGNALS OVERRIDDEN
[Count and list]

✅ RECOMMENDATIONS
[2-3 actionable recommendations based on the incident]
"""

    try:
        response = ollama.chat(
            model=OLLAMA_MODEL,
            messages=[{"role": "user", "content": prompt}]
        )
        return response['message']['content']
    except Exception as e:
        return f"Report generation failed: {str(e)}"