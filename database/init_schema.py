"""
Maha-Seva Integrator - Database Schema Initialization
Initializes and synchronizes all relational tables in PostgreSQL.
"""
import sys
import os

if sys.stdout.encoding != "utf-8":
    try:
        sys.stdout.reconfigure(encoding="utf-8")
    except Exception:
        pass

# Add backend directory to sys.path
sys.path.insert(0, os.path.abspath(os.path.join(os.path.dirname(__file__), "..", "backend")))

from sqlalchemy import text
from app.core.database import engine, Base
import app.models  # Ensure all models are registered with Base

def init_db():
    print("==================================================")
    print("Maha-Seva Integrator - Initializing Database Schema")
    print("==================================================")
    
    with engine.connect() as conn:
        # Drop legacy empty tables with CASCADE to allow fresh aligned schema
        print("Synchronizing schema definitions...")
        legacy_tables = [
            "verification_requests", "application_documents",
            "application_status_history", "documents",
            "application_events", "applications",
            "service_forms", "services", "service_categories",
            "departments", "notifications", "audit_logs",
            "support_requests", "users", "roles"
        ]
        for t in legacy_tables:
            conn.execute(text(f"DROP TABLE IF EXISTS {t} CASCADE;"))
        conn.commit()
    
    # Re-create all tables cleanly
    Base.metadata.create_all(bind=engine)
    print("[SUCCESS] All tables created with full schema alignment in PostgreSQL.")

if __name__ == "__main__":
    init_db()
