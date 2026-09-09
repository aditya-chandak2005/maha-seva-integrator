from typing import Dict, Optional
from app.integrations.base import BaseGovernmentAdapter
from app.integrations.mock_adapters import (
    MockRevenueAdapter,
    MockMunicipalAdapter,
    MockDigiLockerAdapter
)

class IntegrationOrchestrator:
    """
    Registry and Dispatcher for Department Integration Adapters.
    Prevents vendor lock-in and decouples platform core from external changes.
    """
    
    def __init__(self):
        self._adapters: Dict[str, BaseGovernmentAdapter] = {
            "MOCK_REV": MockRevenueAdapter(),
            "MOCK_MUN": MockMunicipalAdapter(),
            "MOCK_DL": MockDigiLockerAdapter(),
        }

    def get_adapter(self, integration_type: str) -> BaseGovernmentAdapter:
        adapter = self._adapters.get(integration_type)
        if not adapter:
            # Fallback to revenue mock if unspecified
            return self._adapters["MOCK_REV"]
        return adapter

orchestrator = IntegrationOrchestrator()
