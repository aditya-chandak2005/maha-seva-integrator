"""
Tests for Government Schemes, Document Services Separation,
Citizen Profile Vault Slidebar, and Zero Re-upload Auto-Attachment.
"""
import io
import unittest
from fastapi.testclient import TestClient
from app.main import app

class TestSchemesAndVault(unittest.TestCase):

    @classmethod
    def setUpClass(cls):
        cls.client = TestClient(app)

        # Login Rahul Deshmukh (Citizen with seeded vault documents)
        login_res = cls.client.post(
            "/api/v1/auth/login",
            data={"username": "rahul.deshmukh@mahaseva.gov.in", "password": "Citizen@2026"}
        )
        assert login_res.status_code == 200, f"Login failed: {login_res.json()}"
        cls.token = login_res.json()["access_token"]
        cls.headers = {"Authorization": f"Bearer {cls.token}"}

    def test_01_filter_services_by_scheme(self):
        """Test GET /api/v1/services with service_type=SCHEME"""
        res = self.client.get("/api/v1/services?service_type=SCHEME")
        self.assertEqual(res.status_code, 200)
        schemes = res.json()
        self.assertGreaterEqual(len(schemes), 8)

        codes = [s["code"] for s in schemes]
        self.assertIn("CENTRAL_PM_KISAN", codes)
        self.assertIn("MH_NAMO_SHETKARI", codes)
        self.assertIn("CENTRAL_PM_FASAL_BIMA", codes)
        self.assertIn("CENTRAL_PMEGP_MSME", codes)
        self.assertIn("MH_CMEGP_INDUSTRIAL", codes)
        self.assertIn("CENTRAL_AICTE_PRAGATI", codes)
        self.assertIn("MH_SHAHU_MAHARAJ_SCHOLARSHIP", codes)
        self.assertIn("MH_LADKI_BAHIN_YOJANA", codes)

        # Check scheme metadata
        pm_kisan = next(s for s in schemes if s["code"] == "CENTRAL_PM_KISAN")
        self.assertEqual(pm_kisan["service_type"], "SCHEME")
        self.assertEqual(pm_kisan["scheme_type"], "AGRICULTURE")
        self.assertEqual(pm_kisan["sponsor_type"], "CENTRAL")
        self.assertIn("₹6,000", pm_kisan["benefit_amount"])

    def test_02_filter_schemes_by_domain(self):
        """Test GET /api/v1/services with scheme_type=EDUCATION_SCHOLARSHIP"""
        res = self.client.get("/api/v1/services?service_type=SCHEME&scheme_type=EDUCATION_SCHOLARSHIP")
        self.assertEqual(res.status_code, 200)
        edu_schemes = res.json()
        self.assertGreaterEqual(len(edu_schemes), 2)
        codes = [s["code"] for s in edu_schemes]
        self.assertIn("CENTRAL_AICTE_PRAGATI", codes)
        self.assertIn("MH_SHAHU_MAHARAJ_SCHOLARSHIP", codes)

    def test_03_filter_services_by_document(self):
        """Test GET /api/v1/services with service_type=DOCUMENT"""
        res = self.client.get("/api/v1/services?service_type=DOCUMENT")
        self.assertEqual(res.status_code, 200)
        docs = res.json()
        self.assertGreaterEqual(len(docs), 10)
        codes = [s["code"] for s in docs]
        self.assertIn("MH_INCOME_CERT", codes)
        self.assertIn("MH_DOMICILE_CERT", codes)
        # Schemes should not appear in document services
        self.assertNotIn("CENTRAL_PM_KISAN", codes)

    def test_04_citizen_profile_and_vault(self):
        """Test GET /api/v1/citizen/profile returns demographics and verified vault items"""
        res = self.client.get("/api/v1/citizen/profile", headers=self.headers)
        self.assertEqual(res.status_code, 200)
        data = res.json()
        self.assertEqual(data["email"], "rahul.deshmukh@mahaseva.gov.in")
        self.assertIn("Rahul", data["full_name"])
        self.assertIsNotNone(data["aadhaar_number"])
        self.assertIsNotNone(data["pan_number"])
        self.assertEqual(data["profile_data"].get("beneficiary_category"), "FARMER")

        # Check vault documents
        vault = data["vault_documents"]
        self.assertGreaterEqual(len(vault), 6)
        vault_types = [d["document_type"] for d in vault]
        self.assertIn("AADHAAR", vault_types)
        self.assertIn("PAN", vault_types)
        self.assertIn("LAND_RECORD", vault_types)
        self.assertIn("INCOME_CERT", vault_types)
        self.assertIn("DOMICILE_CERT", vault_types)
        self.assertIn("BANK_PASSBOOK", vault_types)

    def test_05_update_citizen_profile(self):
        """Test PUT /api/v1/citizen/profile updates demographics and bank details"""
        update_data = {
            "full_name": "Rahul Suresh Deshmukh",
            "phone": "9820010001",
            "state_code": "MH",
            "aadhaar_number": "9820-4512-8890",
            "pan_number": "ABCDE1234F",
            "address": "42, Gram Panchayat Road, Ambegaon, Pune",
            "caste_category": "OBC",
            "beneficiary_category": "FARMER",
            "bank_account_number": "349921008745",
            "bank_ifsc": "SBIN0001234",
            "bank_name": "State Bank of India"
        }
        res = self.client.put("/api/v1/citizen/profile", json=update_data, headers=self.headers)
        self.assertEqual(res.status_code, 200)
        data = res.json()
        self.assertEqual(data["full_name"], "Rahul Suresh Deshmukh")
        self.assertEqual(data["profile_data"]["bank_account_number"], "349921008745")

    def test_06_vault_upload_and_delete(self):
        """Test POST and DELETE on /api/v1/citizen/vault"""
        file_content = b"%PDF-1.4 test certificate upload\n%%EOF"
        files = {"file": ("student_id.pdf", io.BytesIO(file_content), "application/pdf")}
        data = {"document_type": "MARKSHEET"}

        upload_res = self.client.post("/api/v1/citizen/vault/upload", files=files, data=data, headers=self.headers)
        self.assertEqual(upload_res.status_code, 200)
        uploaded = upload_res.json()
        doc_id = uploaded["id"]
        self.assertEqual(uploaded["document_type"], "MARKSHEET")
        self.assertEqual(uploaded["original_file_name"], "student_id.pdf")

        # Verify it shows up in profile vault
        prof_res = self.client.get("/api/v1/citizen/profile", headers=self.headers)
        self.assertEqual(prof_res.status_code, 200)
        v_ids = [d["id"] for d in prof_res.json()["vault_documents"]]
        self.assertIn(doc_id, v_ids)

        # Verify rejection of non-PDF file (.jpg / .png)
        png_content = b"\x89PNG\r\n\x1a\n fake image content"
        bad_format_files = {"file": ("avatar.png", io.BytesIO(png_content), "image/png")}
        bad_format_res = self.client.post("/api/v1/citizen/vault/upload", files=bad_format_files, data={"document_type": "AADHAAR"}, headers=self.headers)
        self.assertEqual(bad_format_res.status_code, 400)
        self.assertIn("strictly be uploaded in .pdf format", bad_format_res.json()["detail"])

        # Verify rejection of file exceeding 256KB
        oversized_content = b"%PDF-1.4 " + (b"X" * (260 * 1024)) + b"\n%%EOF"
        oversized_files = {"file": ("large_doc.pdf", io.BytesIO(oversized_content), "application/pdf")}
        oversized_res = self.client.post("/api/v1/citizen/vault/upload", files=oversized_files, data={"document_type": "AADHAAR"}, headers=self.headers)
        self.assertEqual(oversized_res.status_code, 400)
        self.assertIn("File exceeds maximum permissible size of 256KB", oversized_res.json()["detail"])

        # Delete document from vault
        del_res = self.client.delete(f"/api/v1/citizen/vault/{doc_id}", headers=self.headers)
        self.assertEqual(del_res.status_code, 200)
        self.assertTrue(del_res.json()["success"])

    def test_07_scheme_application_with_vault_auto_attachment(self):
        """Test POST /api/v1/applications with vault_document_ids links documents directly"""
        # Find PM-KISAN service id
        svc_res = self.client.get("/api/v1/services?service_type=SCHEME&scheme_type=AGRICULTURE")
        self.assertEqual(svc_res.status_code, 200)
        pm_kisan = next(s for s in svc_res.json() if s["code"] == "CENTRAL_PM_KISAN")
        svc_id = pm_kisan["id"]

        # Get citizen vault document ids
        prof_res = self.client.get("/api/v1/citizen/profile", headers=self.headers)
        vault_docs = prof_res.json()["vault_documents"]
        vault_ids = [d["id"] for d in vault_docs[:2]] # Attach first 2 vault docs

        # Clean up any existing applications for Rahul on this service so test is deterministic
        from app.core.database import SessionLocal
        from app.models import Application, ApplicationEvent, Document, Notification, SupportRequest, User
        _db = SessionLocal()
        _user = _db.query(User).filter(User.email == "rahul.deshmukh@mahaseva.gov.in").first()
        if _user:
            _existing = _db.query(Application).filter(Application.citizen_id == _user.id, Application.service_id == svc_id).all()
            for _e in _existing:
                _db.query(ApplicationEvent).filter(ApplicationEvent.application_id == _e.id).delete()
                _db.query(Document).filter(Document.application_id == _e.id).delete()
                _db.query(Notification).filter(Notification.application_id == _e.id).delete()
                _db.query(SupportRequest).filter(SupportRequest.application_id == _e.id).delete()
                _db.delete(_e)
            _db.commit()
        _db.close()

        app_payload = {
            "service_id": svc_id,
            "form_data": {
                "aadhaar_no": "9820-4512-8890",
                "land_survey_no": "42/A",
                "land_area_hectares": 2.5,
                "bank_account": "349921008745",
                "bank_ifsc": "SBIN0001234"
            },
            "status": "SUBMITTED",
            "vault_document_ids": vault_ids
        }

        app_res = self.client.post("/api/v1/applications", json=app_payload, headers=self.headers)
        self.assertIn(app_res.status_code, [200, 201])
        created_app = app_res.json()
        app_id = created_app["id"]
        app_number = created_app["application_number"]
        self.assertTrue(app_number.startswith("CENTRAL-"))

        # Verify attached documents are linked to the application
        detail_res = self.client.get(f"/api/v1/applications/{app_id}", headers=self.headers)
        self.assertEqual(detail_res.status_code, 200)
        attached_docs = detail_res.json()["documents"]
        self.assertEqual(len(attached_docs), len(vault_ids))

    def test_08_document_download_with_query_token(self):
        """Test GET /api/v1/documents/{id}/download supports ?token= query parameter and inline disposition"""
        prof_res = self.client.get("/api/v1/citizen/profile", headers=self.headers)
        vault_docs = prof_res.json()["vault_documents"]
        self.assertTrue(len(vault_docs) > 0)
        doc_id = vault_docs[0]["id"]

        # 1. Unauthenticated request without token should fail with 401
        unauth_res = self.client.get(f"/api/v1/documents/{doc_id}/download")
        self.assertEqual(unauth_res.status_code, 401)

        # 2. Query param ?token=<jwt> should succeed with 200 and inline disposition
        token = self.token
        query_res = self.client.get(f"/api/v1/documents/{doc_id}/download?token={token}")
        self.assertEqual(query_res.status_code, 200)
        self.assertEqual(query_res.headers.get("content-type"), "application/pdf")
        self.assertIn("inline", query_res.headers.get("content-disposition", ""))

        # 3. Header Bearer token should also succeed
        header_res = self.client.get(f"/api/v1/documents/{doc_id}/download", headers=self.headers)
        self.assertEqual(header_res.status_code, 200)
        self.assertIn("inline", header_res.headers.get("content-disposition", ""))

    def test_09_duplicate_application_prevention(self):
        """Test duplicate active application for same service is blocked with HTTP 400"""
        svc_res = self.client.get("/api/v1/services?service_type=SCHEME&scheme_type=AGRICULTURE")
        pm_kisan = next(s for s in svc_res.json() if s["code"] == "CENTRAL_PM_KISAN")
        svc_id = pm_kisan["id"]

        # Check-active endpoint should report active application
        check_res = self.client.get(f"/api/v1/applications/check-active?service_id={svc_id}", headers=self.headers)
        self.assertEqual(check_res.status_code, 200)
        check_data = check_res.json()
        self.assertTrue(check_data.get("has_active"))
        self.assertTrue(check_data.get("application_number").startswith("CENTRAL-"))

        # Attempt to submit duplicate application should fail with 400
        app_payload = {
            "service_id": svc_id,
            "form_data": {"aadhaar_no": "9820-4512-8890"},
            "status": "SUBMITTED"
        }
        dup_res = self.client.post("/api/v1/applications", json=app_payload, headers=self.headers)
        self.assertEqual(dup_res.status_code, 400)
        self.assertIn("Duplicate submissions are not permitted", dup_res.json().get("detail", ""))


if __name__ == "__main__":
    unittest.main()
