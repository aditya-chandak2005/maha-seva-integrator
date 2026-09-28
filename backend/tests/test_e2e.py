"""
Maha-Seva Integrator - End-to-End Automated Test Suite
Tests API endpoints, RBAC enforcement, dynamic form submission,
officer status transitions, integration adapters, and smart assistant.
"""
import unittest
import json
import urllib.request
import urllib.error
import urllib.parse

BASE_URL = "http://127.0.0.1:8000/api/v1"
ROOT_URL = "http://127.0.0.1:8000"

def make_request(url, method="GET", data=None, headers=None):
    if headers is None:
        headers = {}
    
    encoded_data = None
    if data is not None:
        if isinstance(data, dict) and headers.get("Content-Type") == "application/x-www-form-urlencoded":
            encoded_data = urllib.parse.urlencode(data).encode("utf-8")
        else:
            encoded_data = json.dumps(data).encode("utf-8")
            if "Content-Type" not in headers:
                headers["Content-Type"] = "application/json"

    req = urllib.request.Request(url, data=encoded_data, headers=headers, method=method)
    try:
        with urllib.request.urlopen(req) as response:
            res_body = response.read().decode("utf-8")
            return response.status, json.loads(res_body) if res_body else {}
    except urllib.error.HTTPError as e:
        err_body = e.read().decode("utf-8")
        try:
            parsed = json.loads(err_body)
        except Exception:
            parsed = {"raw": err_body}
        return e.code, parsed


class TestMahaSevaE2E(unittest.TestCase):

    @classmethod
    def setUpClass(cls):
        # 1. Login Citizen
        status, res = make_request(
            f"{BASE_URL}/auth/login",
            method="POST",
            data={"username": "citizen@mahaseva.gov.in", "password": "Citizen@2026"},
            headers={"Content-Type": "application/x-www-form-urlencoded"}
        )
        assert status == 200, f"Citizen login failed: {res}"
        cls.citizen_token = res["access_token"]
        cls.citizen_headers = {"Authorization": f"Bearer {cls.citizen_token}"}

        # Clean up existing test applications for this citizen so e2e test can submit cleanly
        from app.core.database import SessionLocal
        from app.models import Application, ApplicationEvent, Document, Notification, SupportRequest, User
        _db = SessionLocal()
        _u = _db.query(User).filter(User.email == "citizen@mahaseva.gov.in").first()
        if _u:
            _apps = _db.query(Application).filter(Application.citizen_id == _u.id).all()
            for _a in _apps:
                _db.query(ApplicationEvent).filter(ApplicationEvent.application_id == _a.id).delete()
                _db.query(Document).filter(Document.application_id == _a.id).delete()
                _db.query(Notification).filter(Notification.application_id == _a.id).delete()
                _db.query(SupportRequest).filter(SupportRequest.application_id == _a.id).delete()
                _db.delete(_a)
            _db.commit()
        _db.close()

        # 2. Login Revenue Officer
        status, res = make_request(
            f"{BASE_URL}/auth/login",
            method="POST",
            data={"username": "officer.revenue@mahaseva.gov.in", "password": "Officer@2026"},
            headers={"Content-Type": "application/x-www-form-urlencoded"}
        )
        assert status == 200, f"Officer login failed: {res}"
        cls.officer_token = res["access_token"]
        cls.officer_headers = {"Authorization": f"Bearer {cls.officer_token}"}

        # 3. Login Super Admin
        status, res = make_request(
            f"{BASE_URL}/auth/login",
            method="POST",
            data={"username": "admin@mahaseva.gov.in", "password": "Admin@2026"},
            headers={"Content-Type": "application/x-www-form-urlencoded"}
        )
        assert status == 200, f"Admin login failed: {res}"
        cls.admin_token = res["access_token"]
        cls.admin_headers = {"Authorization": f"Bearer {cls.admin_token}"}

    def test_01_health_and_telemetry(self):
        status, res = make_request(f"{ROOT_URL}/health")
        self.assertEqual(status, 200)
        self.assertEqual(res.get("status"), "healthy")
        self.assertEqual(res.get("database", {}).get("status"), "connected")

        status, res = make_request(f"{ROOT_URL}/database-test")
        self.assertEqual(status, 200)
        self.assertEqual(res.get("result"), 1)

    def test_02_auth_and_rbac(self):
        # Citizen profile
        status, res = make_request(f"{BASE_URL}/auth/me", headers=self.citizen_headers)
        self.assertEqual(status, 200)
        self.assertEqual(res["role"], "CITIZEN")

        # Officer profile
        status, res = make_request(f"{BASE_URL}/auth/me", headers=self.officer_headers)
        self.assertEqual(status, 200)
        self.assertEqual(res["role"], "OFFICER")
        self.assertEqual(res["department_id"], 1)

        # RBAC Check: Citizen cannot access officer queue
        status, res = make_request(f"{BASE_URL}/officer/applications", headers=self.citizen_headers)
        self.assertEqual(status, 403)

        # RBAC Check: Citizen cannot access admin telemetry
        status, res = make_request(f"{BASE_URL}/admin/analytics/overview", headers=self.citizen_headers)
        self.assertEqual(status, 403)

    def test_03_services_and_search(self):
        # List Departments
        status, res = make_request(f"{BASE_URL}/departments")
        self.assertEqual(status, 200)
        self.assertGreaterEqual(len(res), 4)

        # List Services
        status, res = make_request(f"{BASE_URL}/services")
        self.assertEqual(status, 200)
        self.assertGreaterEqual(len(res), 4)

        # Search for Income Certificate
        status, res = make_request(f"{BASE_URL}/services?q=Income")
        self.assertEqual(status, 200)
        self.assertTrue(any(s["code"] == "MH_INCOME_CERT" for s in res))

        # Get Service Detail & Form Schema
        status, res = make_request(f"{BASE_URL}/services/1")
        self.assertEqual(status, 200)
        self.assertEqual(res["code"], "MH_INCOME_CERT")
        self.assertIsNotNone(res.get("form_schema"))
        self.assertGreater(len(res["form_schema"]), 3)

    def test_04_application_workflow(self):
        # Submit new application as citizen
        app_payload = {
            "service_id": 1,
            "form_data": {
                "applicant_name": "Aditya Patil",
                "aadhaar_number": "999988887777",
                "annual_income": 110000,
                "income_source": "Salaried Employment",
                "certificate_purpose": "Education & Scholarship",
                "district": "Pune",
                "taluka": "Haveli",
                "village_ward": "Kothrud"
            },
            "status": "SUBMITTED"
        }
        status, res = make_request(
            f"{BASE_URL}/applications",
            method="POST",
            data=app_payload,
            headers=self.citizen_headers
        )
        self.assertEqual(status, 200)
        app_number = res["application_number"]
        app_id = res["id"]
        self.assertTrue(app_number.startswith("MH-REV-"))
        self.assertEqual(res["status"], "SUBMITTED")

        # Public tracking verification
        status, res = make_request(f"{BASE_URL}/applications/track/{app_number}")
        self.assertEqual(status, 200)
        self.assertEqual(res["application_number"], app_number)
        self.assertGreaterEqual(len(res["timeline"]), 1)

        # Officer queue inspection
        status, res = make_request(f"{BASE_URL}/officer/applications", headers=self.officer_headers)
        self.assertEqual(status, 200)
        self.assertTrue(any(a["application_number"] == app_number for a in res))

        # Officer advances status to UNDER_REVIEW
        status_update = {
            "new_status": "UNDER_REVIEW",
            "remarks": "Automated test: Document verification initiated by Tahsildar desk."
        }
        status, res = make_request(
            f"{BASE_URL}/officer/applications/{app_id}/status",
            method="PATCH",
            data=status_update,
            headers=self.officer_headers
        )
        self.assertEqual(status, 200)
        self.assertEqual(res["status"], "UNDER_REVIEW")

        # Verify Citizen In-App Notification was generated
        status, res = make_request(f"{BASE_URL}/notifications", headers=self.citizen_headers)
        self.assertEqual(status, 200)
        self.assertTrue(any(app_number in n["message"] for n in res))

    def test_05_mock_integration_adapters(self):
        import sys, os
        sys.path.insert(0, os.path.abspath(os.path.join(os.path.dirname(__file__), "..")))
        from app.integrations.mock_adapters import MockRevenueAdapter, MockMunicipalAdapter

        rev = MockRevenueAdapter()
        self.assertTrue(rev.is_mock)
        ack = rev.submit_application({"taluka": "Haveli"})
        self.assertEqual(ack["status"], "SUCCESS")
        self.assertIn("MOCK GOVERNMENT INTEGRATION", ack["disclaimer"])

        mun = MockMunicipalAdapter()
        self.assertTrue(mun.is_mock)
        ack = mun.submit_application({"municipal_body": "PMC"})
        self.assertEqual(ack["status"], "SUCCESS")
        self.assertIn("MOCK GOVERNMENT INTEGRATION", ack["disclaimer"])

    def test_06_smart_assistant(self):
        # English query
        status, res = make_request(
            f"{BASE_URL}/assistant/chat",
            method="POST",
            data={"query": "I need income certificate for college admission", "language": "en"}
        )
        self.assertEqual(status, 200)
        self.assertIn("Income Certificate", res["response"])
        self.assertGreater(len(res["suggested_services"]), 0)

        # Marathi query
        status, res = make_request(
            f"{BASE_URL}/assistant/chat",
            method="POST",
            data={"query": "मला उत्पन्नाचा दाखला काढायचा आहे", "language": "mr"}
        )
        self.assertEqual(status, 200)
        self.assertGreater(len(res["suggested_services"]), 0)

    def test_07_admin_telemetry_and_audit(self):
        # Super Admin Analytics
        status, res = make_request(f"{BASE_URL}/admin/analytics/overview", headers=self.admin_headers)
        self.assertEqual(status, 200)
        self.assertGreater(res["total_applications"], 0)
        self.assertGreater(len(res["department_workload"]), 0)

        # Super Admin Audit Logs
        status, res = make_request(f"{BASE_URL}/admin/audit-logs", headers=self.admin_headers)
        self.assertEqual(status, 200)
        self.assertGreater(len(res), 0)

    def test_08_multi_state_and_hindi(self):
        # 1. Multi-state filter: Karnataka (KA)
        status, res = make_request(f"{BASE_URL}/services?state_code=KA")
        self.assertEqual(status, 200)
        self.assertGreaterEqual(len(res), 2)
        self.assertTrue(all(s["state_code"] == "KA" for s in res))

        # 2. Multi-state filter: Delhi (DL)
        status, res = make_request(f"{BASE_URL}/services?state_code=DL")
        self.assertEqual(status, 200)
        self.assertGreaterEqual(len(res), 2)
        self.assertTrue(all(s["state_code"] == "DL" for s in res))

        # 3. Hindi Query to Smart Assistant
        status, res = make_request(
            f"{BASE_URL}/assistant/chat",
            method="POST",
            data={"query": "मुझे नया बिजली कनेक्शन चाहिए", "language": "hi"}
        )
        self.assertEqual(status, 200)
        self.assertTrue("विद्युत" in res["response"] or "बिजली" in res["response"] or "बेस्कॉम" in res["response"])
        self.assertGreater(len(res["suggested_services"]), 0)

        # 4. Multi-state application submission: BESCOM electricity in Karnataka
        ka_elec = next((s for s in res["suggested_services"] if s.get("state_code") == "KA" or "BESCOM" in s["name"]), None)
        if ka_elec:
            app_payload = {
                "service_id": ka_elec["id"],
                "form_data": {
                    "consumer_name": "Aditya Patil",
                    "property_pid": "089-W0123-99",
                    "sanctioned_load_kw": 5,
                    "bangalore_subdivision": "Indiranagar Sub-Division",
                    "property_address": "100 Feet Rd, Indiranagar, Bengaluru"
                },
                "status": "SUBMITTED"
            }
            status, app_res = make_request(
                f"{BASE_URL}/applications",
                method="POST",
                data=app_payload,
                headers=self.citizen_headers
            )
            self.assertEqual(status, 200)
            self.assertTrue(app_res["application_number"].startswith("KA-"))

    def test_09_all_india_states_and_key_validation(self):
        # 1. Key validation with empty or dummy key
        status, res = make_request(
            f"{BASE_URL}/assistant/validate-key",
            method="POST",
            data={"api_key": ""}
        )
        self.assertEqual(status, 200)
        self.assertFalse(res["valid"])

        # 2. Query services across diverse Indian States and UTs
        for st_code in ["RJ", "TN", "WB", "JK"]:
            status, res = make_request(f"{BASE_URL}/services?state_code={st_code}")
            self.assertEqual(status, 200)
            self.assertGreaterEqual(len(res), 1)
            self.assertTrue(all(s["state_code"] == st_code for s in res))

        # 3. Multi-turn chat with history
        history = [
            {"role": "user", "content": "I live in Rajasthan"},
            {"role": "assistant", "content": "Welcome! In Rajasthan, we provide Bonafide Resident Mool Niwas certificates and other citizen services."}
        ]
        status, res = make_request(
            f"{BASE_URL}/assistant/chat",
            method="POST",
            data={
                "query": "How do I get my bonafide residence proof?",
                "language": "en",
                "state_code": "RJ",
                "history": history
            }
        )
        self.assertEqual(status, 200)
        self.assertGreater(len(res["suggested_services"]), 0)

    def test_10_central_gov_and_educational_marksheets(self):
        # 1. Central Government services filter
        status, res = make_request(f"{BASE_URL}/services?state_code=CENTRAL")
        self.assertEqual(status, 200)
        self.assertGreaterEqual(len(res), 4)
        self.assertTrue(all(s["state_code"] == "CENTRAL" for s in res))
        self.assertTrue(any(s["code"] == "CBSE_MARKSHEET_VERIFY" for s in res))
        self.assertTrue(any(s["code"] == "NSP_SCHOLARSHIP" for s in res))
        self.assertTrue(any(s["code"] == "APAAR_ABC_ID" for s in res))

        # 2. Query Smart Assistant for school marksheet in English
        status, res = make_request(
            f"{BASE_URL}/assistant/chat",
            method="POST",
            data={"query": "How do I get my school marksheet document?", "language": "en"}
        )
        self.assertEqual(status, 200)
        self.assertIn("marksheet", res["response"].lower())
        self.assertGreater(len(res["suggested_services"]), 0)
        self.assertTrue(any("Marksheet" in s["name"] or "CBSE" in s["name"] for s in res["suggested_services"]))

        # 3. Query Smart Assistant for CBSE 10th marksheet
        status, res = make_request(
            f"{BASE_URL}/assistant/chat",
            method="POST",
            data={"query": "I need CBSE 10th marksheet and migration certificate", "language": "en"}
        )
        self.assertEqual(status, 200)
        self.assertIn("CBSE", res["response"])
        self.assertTrue(any(s["code"] == "CBSE_MARKSHEET_VERIFY" for s in res["suggested_services"]))

        # 4. Marathi school marksheet query
        status, res = make_request(
            f"{BASE_URL}/assistant/chat",
            method="POST",
            data={"query": "मला १० वी ची गुणपत्रिका हवी आहे", "language": "mr"}
        )
        self.assertEqual(status, 200)
        self.assertIn("गुणपत्रिका", res["response"])
        self.assertTrue(any("गुणपत्रिका" in (s.get("name_mr") or "") for s in res["suggested_services"]))

        # 5. Submit CBSE Marksheet Application
        cbse_service = next((s for s in res["suggested_services"] if s["code"] == "CBSE_MARKSHEET_VERIFY"), None)
        if not cbse_service:
            status_s, cbse_list = make_request(f"{BASE_URL}/services?q=CBSE")
            cbse_service = cbse_list[0] if cbse_list else None

        if cbse_service:
            app_payload = {
                "service_id": cbse_service["id"],
                "form_data": {
                    "class_level": "Class X (Secondary / 10th)",
                    "document_type": "Duplicate Marksheet / Marks Statement",
                    "exam_year": 2024,
                    "roll_number": "14125896",
                    "school_code": "08521",
                    "center_no": "8120"
                },
                "status": "SUBMITTED"
            }
            status, app_res = make_request(
                f"{BASE_URL}/applications",
                method="POST",
                data=app_payload,
                headers=self.citizen_headers
            )
            self.assertEqual(status, 200)
            self.assertTrue(app_res["application_number"].startswith("CENTRAL-CBSE-"))


if __name__ == "__main__":
    unittest.main()
