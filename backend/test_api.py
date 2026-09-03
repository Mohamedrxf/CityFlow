# backend/test_api.py
"""
Backend API regression tests (Phase 15).

Run from the backend directory:

    venv\\Scripts\\python.exe -m unittest test_api -v

Uses FastAPI's TestClient (httpx is already a transitive dependency) and
stdlib unittest - no new packages required.
"""
import json
import os
import tempfile
import unittest
from datetime import datetime
from unittest import mock

from fastapi.testclient import TestClient

import incident_logger
from app import app

BACKEND_DIR = os.path.dirname(os.path.abspath(__file__))
TEST_IMAGE = os.path.join(BACKEND_DIR, "test_images", "traffic2.jpg")
UPLOAD_DIR = os.path.join(BACKEND_DIR, "temp_uploads")

client = TestClient(app)


def image_bytes():
    with open(TEST_IMAGE, "rb") as f:
        return f.read()


def multipart_fields(data, filename="cam.jpg"):
    return [
        ("north_image", (f"north_{filename}", data, "image/jpeg")),
        ("south_image", (f"south_{filename}", data, "image/jpeg")),
        ("east_image", (f"east_{filename}", data, "image/jpeg")),
        ("west_image", (f"west_{filename}", data, "image/jpeg")),
    ]


class TestHealth(unittest.TestCase):
    def test_health(self):
        r = client.get("/health")
        self.assertEqual(r.status_code, 200)
        self.assertEqual(r.json(), {"status": "ok", "model": "loaded"})


class TestCORS(unittest.TestCase):
    def test_allowed_origin_echoed(self):
        r = client.get("/health", headers={"Origin": "http://localhost:8080"})
        self.assertEqual(r.headers.get("access-control-allow-origin"), "http://localhost:8080")

    def test_disallowed_origin_gets_no_acao(self):
        r = client.get("/health", headers={"Origin": "http://evil.example.com"})
        self.assertNotIn("access-control-allow-origin", r.headers)


class TestPredictPath(unittest.TestCase):
    def test_valid_route(self):
        r = client.post(
            "/predict-path",
            json={"current_intersection": "INT_01", "destination": "HOSPITAL_A", "speed_mps": 11.0},
        )
        self.assertEqual(r.status_code, 200)
        body = r.json()
        self.assertEqual(body["path"][0], "INT_01")
        self.assertEqual(body["path"][-1], "HOSPITAL_A")
        self.assertIn("eta_seconds", body)
        self.assertIn("pre_clear_schedule", body)
        self.assertGreater(body["total_eta_seconds"], 0)

    def test_unknown_node_returns_400(self):
        r = client.post(
            "/predict-path",
            json={"current_intersection": "INVALID_NODE", "destination": "HOSPITAL_A", "speed_mps": 11.0},
        )
        self.assertEqual(r.status_code, 400)
        body = r.json()
        self.assertIn("detail", body)


class TestAnalyze(unittest.TestCase):
    def test_valid_image(self):
        r = client.post("/analyze", files=multipart_fields(image_bytes()))
        self.assertEqual(r.status_code, 200)
        body = r.json()
        self.assertEqual(body["intersection_id"], "JNC_001")
        self.assertIn(body["mode"], ("NORMAL", "EMERGENCY"))
        for direction in ("north", "south", "east", "west"):
            self.assertIn(direction, body["analysis"])
            self.assertIn(body["analysis"][direction]["traffic_level"], ("LOW", "MEDIUM", "HIGH"))
        self.assertIn("signal_plan", body)
        self.assertIn("reason", body)
        # request temp files cleaned up
        self.assertFalse(os.path.exists(os.path.join(UPLOAD_DIR, "north_cam.jpg")))

    def test_unsupported_file_type(self):
        r = client.post("/analyze", files=multipart_fields(b"not an image", "notes.txt"))
        self.assertEqual(r.status_code, 415)

    def test_traversal_filename_is_safe(self):
        r = client.post("/analyze", files=multipart_fields(image_bytes(), "../../test.jpg"))
        self.assertEqual(r.status_code, 200)
        self.assertFalse(os.path.exists(os.path.join(BACKEND_DIR, "test.jpg")))
        self.assertFalse(os.path.exists(os.path.join(UPLOAD_DIR, "north_test.jpg")))

    def test_oversized_upload(self):
        r = client.post(
            "/analyze",
            files=[
                ("north_image", ("north_big.jpg", b"\x00" * (11 * 1024 * 1024), "image/jpeg")),
                ("south_image", ("south_c.jpg", image_bytes(), "image/jpeg")),
                ("east_image", ("east_c.jpg", image_bytes(), "image/jpeg")),
                ("west_image", ("west_c.jpg", image_bytes(), "image/jpeg")),
            ],
        )
        self.assertEqual(r.status_code, 413)
        self.assertFalse(os.path.exists(os.path.join(UPLOAD_DIR, "north_big.jpg")))


class TestIncidentLifecycle(unittest.TestCase):
    def setUp(self):
        # Isolate persistence from the real outputs/incidents.json
        fd, self.temp_path = tempfile.mkstemp(suffix=".json")
        os.close(fd)
        with open(self.temp_path, "w") as f:
            json.dump([], f)
        self.patcher = mock.patch.object(incident_logger, "INCIDENTS_FILE", self.temp_path)
        self.patcher.start()

    def tearDown(self):
        self.patcher.stop()
        os.remove(self.temp_path)

    def test_lifecycle(self):
        # create
        r = client.post("/start-incident", json={"ambulance_id": "AMB_TEST", "destination": "HOSPITAL_A"})
        self.assertEqual(r.status_code, 200)
        incident_id = r.json()["incident_id"]
        self.assertEqual(r.json()["status"], "ACTIVE")

        # persisted and listed exactly once
        incidents = client.get("/incidents").json()
        matches = [i for i in incidents if i["incident_id"] == incident_id]
        self.assertEqual(len(matches), 1)
        self.assertEqual(matches[0]["status"], "ACTIVE")

        # close
        r = client.post(f"/close-incident/{incident_id}")
        self.assertEqual(r.status_code, 200)
        self.assertEqual(r.json()["status"], "COMPLETED")

        # exactly one record, no duplicate ACTIVE record
        incidents = client.get("/incidents").json()
        matches = [i for i in incidents if i["incident_id"] == incident_id]
        self.assertEqual(len(matches), 1)
        self.assertEqual(matches[0]["status"], "COMPLETED")

        # closing again -> incident no longer active
        r = client.post(f"/close-incident/{incident_id}")
        self.assertEqual(r.json(), {"error": "Incident not found"})

    def test_report_finds_incident(self):
        r = client.post("/start-incident", json={"ambulance_id": "AMB_TEST", "destination": "HOSPITAL_A"})
        incident_id = r.json()["incident_id"]
        client.post(f"/close-incident/{incident_id}")

        r = client.post(f"/generate-report/{incident_id}")
        self.assertEqual(r.status_code, 200)
        body = r.json()
        self.assertEqual(body["incident_id"], incident_id)
        # incident must be found; Ollama availability is an environment concern
        self.assertIn("report", body)
        self.assertNotEqual(body["report"], "Incident not found")


class TestTelemetryWebSocket(unittest.TestCase):
    def test_malformed_telemetry_does_not_crash(self):
        with client.websocket_connect("/ws/telemetry/AMB_MALFORMED") as ws:
            ws.send_json({"not": "valid"})
            data = ws.receive_json()
            self.assertIn("ambulance_id", data)
            self.assertIn("anomalies", data)

    def test_wrong_type_speed_does_not_crash(self):
        """5 sequential string-speed messages must not crash the detector."""
        with client.websocket_connect("/ws/telemetry/AMB_WRONGTYPE") as ws:
            for _ in range(5):
                ws.send_json({"position": "INT_01", "speed": "fast"})
                data = ws.receive_json()
                self.assertIn("ambulance_id", data)
                self.assertIn("anomalies", data)

    def test_wrong_type_position_handled(self):
        with client.websocket_connect("/ws/telemetry/AMB_INT_POS") as ws:
            ws.send_json({"position": 123, "speed": 10.0})
            data = ws.receive_json()
            self.assertIn("ambulance_id", data)
            self.assertIn("anomalies", data)

    def test_sequential_valid_messages(self):
        with client.websocket_connect("/ws/telemetry/AMB_SEQ") as ws:
            for i in range(5):
                ws.send_json({"position": f"INT_0{i+1}", "speed": 10.0 + i})
                data = ws.receive_json()
                self.assertIn("ambulance_id", data)
                self.assertIn("anomalies", data)
                self.assertEqual(data["ambulance_id"], "AMB_SEQ")

    def test_invalid_speed_no_false_anomaly(self):
        """5x null speed must NOT trigger a false speed_drop anomaly."""
        with client.websocket_connect("/ws/telemetry/AMB_NULL_SPD") as ws:
            for _ in range(6):
                ws.send_json({"position": "INT_01", "speed": None})
                data = ws.receive_json()
                self.assertEqual(data["anomaly_count"], 0)

    def test_nonnumeric_speed_no_false_anomaly(self):
        """5x non-numeric speed must NOT trigger a false speed_drop anomaly."""
        with client.websocket_connect("/ws/telemetry/AMB_BAD_SPD") as ws:
            for _ in range(6):
                ws.send_json({"position": "INT_01", "speed": "fast"})
                data = ws.receive_json()
                self.assertEqual(data["anomaly_count"], 0)

    def test_missing_speed_no_false_anomaly(self):
        """5x missing speed must NOT trigger a false speed_drop anomaly."""
        with client.websocket_connect("/ws/telemetry/AMB_NO_SPD") as ws:
            for _ in range(6):
                ws.send_json({"position": "INT_01"})
                data = ws.receive_json()
                self.assertEqual(data["anomaly_count"], 0)

    def test_valid_zero_speed_triggers_anomaly(self):
        """Genuine speed=0.0 for 5+ readings SHOULD trigger speed_drop."""
        with client.websocket_connect("/ws/telemetry/AMB_ZERO") as ws:
            for i in range(6):
                ws.send_json({"position": "INT_01", "speed": 0.0})
                data = ws.receive_json()
                if i >= 4:
                    self.assertGreaterEqual(data["anomaly_count"], 1)
                    types = [a["type"] for a in data["anomalies"]]
                    self.assertIn("speed_drop", types)


class TestDriverLive(unittest.TestCase):
    def test_idle_state_no_incident(self):
        r = client.get("/api/driver/live")
        self.assertEqual(r.status_code, 200)
        body = r.json()
        self.assertFalse(body["corridor_active"])
        self.assertFalse(body["emergency_mode"])
        self.assertEqual(body["incident_status"], "IDLE")

    def test_live_response_contains_timestamp(self):
        """Backend-generated timestamp must be present and valid ISO-8601 UTC."""
        r = client.get("/api/driver/live")
        self.assertEqual(r.status_code, 200)
        body = r.json()
        self.assertIn("timestamp", body)
        # Verify parseable as ISO-8601
        parsed = datetime.fromisoformat(body["timestamp"].replace("Z", "+00:00"))
        self.assertIsNotNone(parsed)

    def test_live_active_incident_contains_timestamp(self):
        """Active incident response must also include a valid timestamp."""
        r = client.post("/start-incident", json={"ambulance_id": "AMB_TS", "destination": "HOSPITAL_A"})
        self.assertEqual(r.status_code, 200)
        incident_id = r.json()["incident_id"]

        r = client.get("/api/driver/live")
        self.assertEqual(r.status_code, 200)
        body = r.json()
        self.assertIn("timestamp", body)
        parsed = datetime.fromisoformat(body["timestamp"].replace("Z", "+00:00"))
        self.assertIsNotNone(parsed)

        # cleanup
        client.post(f"/close-incident/{incident_id}")

    def test_live_response_contains_route_progress(self):
        """Active incident response must include deterministic route_progress."""
        r = client.post("/start-incident", json={"ambulance_id": "AMB_RP", "destination": "HOSPITAL_A"})
        self.assertEqual(r.status_code, 200)
        incident_id = r.json()["incident_id"]

        r = client.get("/api/driver/live")
        self.assertEqual(r.status_code, 200)
        body = r.json()
        self.assertIn("route_progress", body)
        self.assertIsInstance(body["route_progress"], (int, float))
        self.assertGreaterEqual(body["route_progress"], 0.0)
        self.assertLessEqual(body["route_progress"], 100.0)

        # cleanup
        client.post(f"/close-incident/{incident_id}")

    def test_live_idle_has_no_route_progress(self):
        """Idle state must not include route_progress."""
        r = client.get("/api/driver/live")
        self.assertEqual(r.status_code, 200)
        body = r.json()
        self.assertNotIn("route_progress", body)


if __name__ == "__main__":
    unittest.main(verbosity=2)
