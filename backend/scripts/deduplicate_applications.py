"""
Database Deduplication Script:
Consolidates duplicate applications for the same citizen and service into a single primary application,
removes redundant duplicate application records and timeline events,
and creates a PostgreSQL partial unique index to permanently block future duplicate submissions.
"""
from collections import defaultdict
from sqlalchemy import text
from app.core.database import SessionLocal, engine
from app.models import Application, ApplicationEvent, Document, Notification, SupportRequest, Service, User

STATUS_PRIORITY = {
    "APPROVED": 10,
    "COMPLETED": 10,
    "ISSUED": 10,
    "UNDER_REVIEW": 8,
    "IN_REVIEW": 8,
    "PROCESSING": 7,
    "UNDER_SCRUTINY": 6,
    "ACTION_REQUIRED": 5,
    "SUBMITTED": 4,
    "REJECTED": 1,
    "CANCELLED": 1,
}

def deduplicate():
    db = SessionLocal()
    try:
        print("--- Step 1: Scanning for duplicate applications ---")
        all_apps = db.query(Application).order_by(Application.id.asc()).all()
        grouped = defaultdict(list)
        for app in all_apps:
            grouped[(app.citizen_id, app.service_id)].append(app)

        total_deleted = 0
        groups_deduplicated = 0

        for (citizen_id, service_id), apps in grouped.items():
            if len(apps) <= 1:
                continue

            # Separate active applications from rejected/cancelled
            active_apps = [a for a in apps if a.status not in ("REJECTED", "CANCELLED")]
            if len(active_apps) <= 1:
                continue

            groups_deduplicated += 1
            # Sort active apps: highest status priority first, then earliest submitted_at / lowest id
            active_apps.sort(
                key=lambda a: (-STATUS_PRIORITY.get(a.status, 0), a.submitted_at or a.id, a.id)
            )

            primary_app = active_apps[0]
            duplicate_apps = active_apps[1:]

            citizen = db.query(User).filter(User.id == citizen_id).first()
            service = db.query(Service).filter(Service.id == service_id).first()
            c_name = citizen.full_name if citizen else f"User #{citizen_id}"
            s_name = service.name if service else f"Service #{service_id}"

            print(f"\nConsolidating {len(active_apps)} active applications for {c_name} -> '{s_name}':")
            print(f"  [KEEP PRIMARY] ID {primary_app.id} ({primary_app.application_number}) - Status: {primary_app.status}")

            for dup in duplicate_apps:
                print(f"  [PURGE DUP]   ID {dup.id} ({dup.application_number}) - Status: {dup.status}")

                # 1. Clean up events
                db.query(ApplicationEvent).filter(ApplicationEvent.application_id == dup.id).delete()

                # 2. Handle documents
                dup_docs = db.query(Document).filter(Document.application_id == dup.id).all()
                for d in dup_docs:
                    # Check if primary already has this document type
                    exists_in_primary = db.query(Document).filter(
                        Document.application_id == primary_app.id,
                        Document.document_type == d.document_type
                    ).first()
                    if not exists_in_primary:
                        d.application_id = primary_app.id
                    else:
                        db.delete(d)

                # 3. Handle notifications
                db.query(Notification).filter(Notification.application_id == dup.id).update(
                    {Notification.application_id: primary_app.id}
                )

                # 4. Handle support requests
                db.query(SupportRequest).filter(SupportRequest.application_id == dup.id).update(
                    {SupportRequest.application_id: primary_app.id}
                )

                # 5. Delete duplicate application
                db.delete(dup)
                total_deleted += 1

        db.commit()
        print(f"\n--- Step 1 Complete: Consolidated {groups_deduplicated} groups, deleted {total_deleted} duplicate applications. ---")

        # Step 2: Apply PostgreSQL Partial Unique Index
        print("\n--- Step 2: Applying PostgreSQL partial unique index ---")
        with engine.connect() as conn:
            conn.execute(text("""
                CREATE UNIQUE INDEX IF NOT EXISTS uq_citizen_service_active_app 
                ON applications (citizen_id, service_id) 
                WHERE status NOT IN ('REJECTED', 'CANCELLED');
            """))
            conn.commit()
        print("Successfully ensured unique index 'uq_citizen_service_active_app' on applications table!")

    except Exception as e:
        db.rollback()
        print(f"Error during deduplication: {e}")
        raise
    finally:
        db.close()

if __name__ == "__main__":
    deduplicate()

