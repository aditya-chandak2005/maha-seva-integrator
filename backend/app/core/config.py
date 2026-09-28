import os
from typing import List, Optional
from pydantic import BaseModel
from dotenv import load_dotenv

load_dotenv()

class Settings(BaseModel):
    PROJECT_NAME: str = "Maha-Seva Integrator"
    PROJECT_SLOGAN: str = "One Platform. Many Government Services."
    API_V1_STR: str = "/api/v1"
    ENVIRONMENT: str = os.getenv("ENVIRONMENT", "development")
    DEBUG: bool = os.getenv("DEBUG", "True").lower() in ("true", "1", "yes")

    DATABASE_URL: str = os.getenv(
        "DATABASE_URL",
        "postgresql://postgres:VVMMV@localhost:5432/maha_seva"
    )

    JWT_SECRET: str = os.getenv("JWT_SECRET", "maha-seva-super-secret-key-2026")
    JWT_ALGORITHM: str = os.getenv("JWT_ALGORITHM", "HS256")
    ACCESS_TOKEN_EXPIRE_MINUTES: int = int(os.getenv("ACCESS_TOKEN_EXPIRE_MINUTES", "1440"))
    GEMINI_API_KEY: Optional[str] = os.getenv("GEMINI_API_KEY", None)

    CORS_ORIGINS: List[str] = [
        "http://localhost:5173",
        "http://127.0.0.1:5173",
        "http://localhost:3000",
        "http://127.0.0.1:3000",
        "http://localhost:8000",
        "http://127.0.0.1:8000",
    ]

    UPLOAD_DIR: str = os.getenv("UPLOAD_DIR", os.path.join(os.getcwd(), "uploads"))
    MAX_UPLOAD_SIZE_KB: int = int(os.getenv("MAX_UPLOAD_SIZE_KB", "256"))
    MAX_UPLOAD_SIZE_MB: int = int(os.getenv("MAX_UPLOAD_SIZE_MB", "5"))
    ALLOWED_MIME_TYPES: List[str] = [
        "application/pdf"
    ]

    ENABLE_MOCK_GOV_INTEGRATIONS: bool = os.getenv(
        "ENABLE_MOCK_GOV_INTEGRATIONS", "True"
    ).lower() in ("true", "1", "yes")

settings = Settings()

# Ensure uploads directory exists
os.makedirs(settings.UPLOAD_DIR, exist_ok=True)
