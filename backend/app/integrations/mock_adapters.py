import uuid
from datetime import datetime, timezone
from typing import Dict, Any
from app.integrations.base import BaseGovernmentAdapter

class MockRevenueAdapter(BaseGovernmentAdapter):
    """
    MOCK GOVERNMENT INTEGRATION FOR SIH DEMONSTRATION
    Simulates Maharashtra Revenue and Forest Department (e.g. Aaple Sarkar / MahaOnline Revenue Gateway).
    """

    @property
    def adapter_id(self) -> str:
        return "MOCK_REV"

    @property
    def department_code(self) -> str:
        return "REV"

    @property
    def is_mock(self) -> bool:
        return True

    def submit_application(self, application_data: Dict[str, Any]) -> Dict[str, Any]:
        ack_id = f"REV-EXT-{datetime.now().strftime('%Y%m%d')}-{uuid.uuid4().hex[:6].upper()}"
        return {
            "status": "SUCCESS",
            "external_reference": ack_id,
            "department": "Revenue and Forest Department, Maharashtra",
            "sub_divisional_office": application_data.get("taluka", "Pune Central"),
            "sla_days": 15,
            "disclaimer": "MOCK GOVERNMENT INTEGRATION FOR SIH DEMONSTRATION",
            "acknowledged_at": datetime.now(timezone.utc).isoformat()
        }

    def get_application_status(self, external_reference: str) -> Dict[str, Any]:
        return {
            "external_reference": external_reference,
            "normalized_status": "UNDER_REVIEW",
            "department_status": "PENDING_TAHSILDAR_SIGNATURE",
            "last_synced_at": datetime.now(timezone.utc).isoformat(),
            "disclaimer": "MOCK GOVERNMENT INTEGRATION FOR SIH DEMONSTRATION"
        }

    def verify_document(self, document_data: Dict[str, Any]) -> Dict[str, Any]:
        return {
            "status": "VERIFIED",
            "document_type": document_data.get("document_type"),
            "verification_authority": "Revenue Records Registry (Mock)",
            "verified_at": datetime.now(timezone.utc).isoformat(),
            "disclaimer": "MOCK GOVERNMENT INTEGRATION FOR SIH DEMONSTRATION"
        }

    def cancel_application(self, external_reference: str) -> bool:
        return True


class MockMunicipalAdapter(BaseGovernmentAdapter):
    """
    MOCK GOVERNMENT INTEGRATION FOR SIH DEMONSTRATION
    Simulates Urban Development Department & Municipal Corporation Gateway (BMC/PMC/TMC).
    """

    @property
    def adapter_id(self) -> str:
        return "MOCK_MUN"

    @property
    def department_code(self) -> str:
        return "UDD"

    @property
    def is_mock(self) -> bool:
        return True

    def submit_application(self, application_data: Dict[str, Any]) -> Dict[str, Any]:
        ack_id = f"MUN-EXT-{datetime.now().strftime('%Y%m%d')}-{uuid.uuid4().hex[:6].upper()}"
        return {
            "status": "SUCCESS",
            "external_reference": ack_id,
            "department": "Urban Development Department (Municipal Gateway)",
            "ward_office": application_data.get("municipal_body", "PMC Central"),
            "sla_days": 7,
            "disclaimer": "MOCK GOVERNMENT INTEGRATION FOR SIH DEMONSTRATION",
            "acknowledged_at": datetime.now(timezone.utc).isoformat()
        }

    def get_application_status(self, external_reference: str) -> Dict[str, Any]:
        return {
            "external_reference": external_reference,
            "normalized_status": "DOCUMENT_VERIFICATION",
            "department_status": "HOSPITAL_RECORD_MATCH_PENDING",
            "last_synced_at": datetime.now(timezone.utc).isoformat(),
            "disclaimer": "MOCK GOVERNMENT INTEGRATION FOR SIH DEMONSTRATION"
        }

    def verify_document(self, document_data: Dict[str, Any]) -> Dict[str, Any]:
        return {
            "status": "VERIFIED",
            "document_type": document_data.get("document_type"),
            "verification_authority": "Municipal Registrar Registry (Mock)",
            "verified_at": datetime.now(timezone.utc).isoformat(),
            "disclaimer": "MOCK GOVERNMENT INTEGRATION FOR SIH DEMONSTRATION"
        }

    def cancel_application(self, external_reference: str) -> bool:
        return True


class MockDigiLockerAdapter(BaseGovernmentAdapter):
    """
    MOCK GOVERNMENT INTEGRATION FOR SIH DEMONSTRATION
    Simulates DigiLocker / Aadhaar identity & document verification.
    """

    @property
    def adapter_id(self) -> str:
        return "MOCK_DL"

    @property
    def department_code(self) -> str:
        return "CENTRAL"

    @property
    def is_mock(self) -> bool:
        return True

    def submit_application(self, application_data: Dict[str, Any]) -> Dict[str, Any]:
        return {"status": "SUCCESS"}

    def get_application_status(self, external_reference: str) -> Dict[str, Any]:
        return {"status": "ACTIVE"}

    def verify_document(self, document_data: Dict[str, Any]) -> Dict[str, Any]:
        return {
            "status": "VERIFIED",
            "issuer": "DigiLocker India / UIDAI Aadhaar",
            "sha256_match": True,
            "verified_at": datetime.now(timezone.utc).isoformat(),
            "disclaimer": "MOCK GOVERNMENT INTEGRATION FOR SIH DEMONSTRATION"
        }

    def cancel_application(self, external_reference: str) -> bool:
        return True
