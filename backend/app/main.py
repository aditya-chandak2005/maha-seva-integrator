import time
from datetime import datetime, timezone
from fastapi import FastAPI, Request
from fastapi.middleware.cors import CORSMiddleware
from sqlalchemy import text

from app.core.config import settings
from app.core.database import engine
from app.routers.auth import router as auth_router
from app.routers.departments import router as departments_router
from app.routers.services import router as services_router
from app.routers.applications import router as applications_router
from app.routers.documents import router as documents_router
from app.routers.officer import router as officer_router
from app.routers.admin import router as admin_router
from app.routers.notifications import router as notifications_router
from app.routers.assistant import router as assistant_router
from app.routers.citizen import router as citizen_router

# ============================================================
# FASTAPI APPLICATION DEFINITION
# ============================================================

app = FastAPI(
    title=settings.PROJECT_NAME,
    description="Unified Digital Government Service Orchestration Platform — Smart India Hackathon 2026 (SIH26129 / PS-129)",
    version="1.0.0",
    docs_url="/docs",
    redoc_url="/redoc",
    openapi_url="/openapi.json"
)

@app.on_event("startup")
def run_migrations():
    try:
        with engine.connect() as conn:
            conn.execute(text("ALTER TABLE services ADD COLUMN IF NOT EXISTS service_type VARCHAR(50) DEFAULT 'DOCUMENT';"))
            conn.execute(text("ALTER TABLE services ADD COLUMN IF NOT EXISTS scheme_type VARCHAR(50);"))
            conn.execute(text("ALTER TABLE services ADD COLUMN IF NOT EXISTS benefit_amount VARCHAR(150);"))
            conn.execute(text("ALTER TABLE services ADD COLUMN IF NOT EXISTS sponsor_type VARCHAR(50) DEFAULT 'STATE';"))
            conn.execute(text("ALTER TABLE users ADD COLUMN IF NOT EXISTS aadhaar_number VARCHAR(20);"))
            conn.execute(text("ALTER TABLE users ADD COLUMN IF NOT EXISTS pan_number VARCHAR(20);"))
            conn.execute(text("ALTER TABLE users ADD COLUMN IF NOT EXISTS profile_data JSONB;"))
            conn.commit()
            print("[OK] Startup migration verified successfully.")
    except Exception as e:
        print(f"[STARTUP MIGRATION NOTE] {e}")

# ============================================================
# CORS MIDDLEWARE (Allow Frontend Dev on Vite localhost:5173 etc.)
# ============================================================

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],  # Permits all origins for smooth local prototype evaluation
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# ============================================================
# SECURITY HEADERS & REQUEST TIMING MIDDLEWARE
# ============================================================

@app.middleware("http")
async def add_security_headers_and_timing(request: Request, call_next):
    start_time = time.time()
    response = await call_next(request)
    process_time = time.time() - start_time
    
    response.headers["X-Process-Time"] = str(round(process_time * 1000, 2)) + "ms"
    response.headers["X-Content-Type-Options"] = "nosniff"
    response.headers["X-Frame-Options"] = "DENY"
    response.headers["X-XSS-Protection"] = "1; mode=block"
    return response

# ============================================================
# ROUTE REGISTRATION (API v1)
# ============================================================

api_v1 = settings.API_V1_STR

app.include_router(auth_router, prefix=api_v1)
app.include_router(departments_router, prefix=api_v1)
app.include_router(services_router, prefix=api_v1)
app.include_router(applications_router, prefix=api_v1)
app.include_router(documents_router, prefix=api_v1)
app.include_router(officer_router, prefix=api_v1)
app.include_router(admin_router, prefix=api_v1)
app.include_router(notifications_router, prefix=api_v1)
app.include_router(assistant_router, prefix=api_v1)
app.include_router(citizen_router, prefix=api_v1)

# Backward-compatible auth routes
app.include_router(auth_router)

# ============================================================
# CORE TELEMETRY & ROOT ENDPOINTS
# ============================================================

@app.get("/")
def root():
    return {
        "project": settings.PROJECT_NAME,
        "slogan": settings.PROJECT_SLOGAN,
        "hackathon": "Smart India Hackathon 2026",
        "problem_statement": "SIH26129 (PS-129)",
        "organization": "Government of Maharashtra",
        "status": "online",
        "api_v1": settings.API_V1_STR,
        "documentation": "/docs"
    }

@app.get("/health")
@app.get("/api/v1/health")
def health_check():
    db_status = "unknown"
    db_latency_ms = None
    try:
        t0 = time.time()
        with engine.connect() as conn:
            conn.execute(text("SELECT 1"))
        db_latency_ms = round((time.time() - t0) * 1000, 2)
        db_status = "connected"
    except Exception as e:
        db_status = f"unhealthy: {str(e)}"

    return {
        "status": "healthy" if db_status == "connected" else "degraded",
        "timestamp": datetime.now(timezone.utc).isoformat(),
        "database": {
            "status": db_status,
            "latency_ms": db_latency_ms,
            "engine": "PostgreSQL 18"
        },
        "environment": settings.ENVIRONMENT
    }

@app.get("/database-test")
def database_test():
    with engine.connect() as connection:
        result = connection.execute(text("SELECT 1"))
        return {
            "database": "connected",
            "result": result.scalar()
        }
