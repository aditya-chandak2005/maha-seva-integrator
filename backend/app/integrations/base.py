from abc import ABC, abstractmethod
from typing import Dict, Any, Optional

class BaseGovernmentAdapter(ABC):
    """
    Abstract Base Class for Government Department System Integrations.
    Normalizes communication between Maha-Seva Integrator and disparate
    departmental databases, legacy SOAP/REST endpoints, and portals.
    """
    
    @property
    @abstractmethod
    def adapter_id(self) -> str:
        """Unique identifier of the integration adapter (e.g., MOCK_REV, MOCK_MUN)"""
        pass

    @property
    @abstractmethod
    def department_code(self) -> str:
        """Department code associated with this adapter (e.g., REV, UDD)"""
        pass

    @property
    @abstractmethod
    def is_mock(self) -> bool:
        """Indicates whether this is a mock adapter for demonstration purposes"""
        pass

    @abstractmethod
    def submit_application(self, application_data: Dict[str, Any]) -> Dict[str, Any]:
        """
        Submits normalized application payload to external government department.
        Returns external acknowledgment payload including department tracking reference.
        """
        pass

    @abstractmethod
    def get_application_status(self, external_reference: str) -> Dict[str, Any]:
        """
        Queries external department for live status updates.
        Returns normalized status object.
        """
        pass

    @abstractmethod
    def verify_document(self, document_data: Dict[str, Any]) -> Dict[str, Any]:
        """
        Submits document metadata/hash to department or DigiLocker for automated validation.
        """
        pass

    @abstractmethod
    def cancel_application(self, external_reference: str) -> bool:
        """
        Cancels an application in the external department system if permitted.
        """
        pass
