# Maha-Seva Integrator — Implementation Roadmap

**Hackathon:** Smart India Hackathon 2026  
**Problem Statement:** SIH 2026 — PS-129 (SIH26129)  
**Organization:** Government of Maharashtra  
**Project:** Maha-Seva Integrator  

This roadmap governs the milestone-based development lifecycle. Each milestone delivers testable, verifiable capability with zero regressions.

---

## Milestone Overview

```text
[M0: Inspection & Blueprints] ──► [M1: Backend Foundation] ──► [M2: RBAC & Auth]
                                                                     │
[M5: Citizen Apps] ◄── [M4: Dynamic Forms] ◄── [M3: Departments & Services]
       │
       ▼
[M6: Document Management] ──► [M7: Workflow & Tracking] ──► [M8: Integration Adapters]
                                                                     │
[M11: Notifications] ◄── [M10: Admin & Analytics] ◄── [M9: Officer Dashboard]
       │
       ▼
[M12: Marathi Localization] ──► [M13: Smart Assistant] ──► [M14: Security Hardening]
                                                                     │
[M16: Final Deployment] ◄── [M15: Comprehensive Testing] ◄───────────┘
```

---

## Detailed Milestones

### MILESTONE 0 — Repository Inspection & Architecture (COMPLETED)
- **Objective:** Deep audit of existing repository, runtime environment, and PS-129 requirements.
- **Deliverables:**
  - `PROJECT_STATUS.md`: Environment, existing components, and gap analysis.
  - `ARCHITECTURE.md`: Full end-to-end system blueprints, diagrams, and schemas.
  - `ROADMAP.md`: Granular milestone execution plan.
  - UTF-8 normalization of dependencies and creation of `.env.example`.
- **Verification:** Backend starts on port 8000; PostgreSQL connects; documentation verified.

---

### MILESTONE 1 — Backend Foundation & Database Refactoring
- **Objective:** Establish the foundational relational data models, migration setup, and clean architecture.
- **Tasks:**
  - Define unified relational models in SQLAlchemy (`User`, `Role`, `Department`, `ServiceCategory`, `Service`, `Workflow`, `Application`, `Document`, `Notification`, `AuditLog`).
  - Create database migration/seeding scripts under `database/`.
  - Establish layered architecture packages (`core/`, `routers/`, `services/`, `repositories/`).
  - Implement health telemetry endpoint returning DB connection latency and system status.
- **Verification:** Automated tests verify database connectivity and model relationships.

---

### MILESTONE 2 — Authentication, Users & Role-Based Access Control (RBAC)
- **Objective:** Secure, multi-role authentication and authorization engine.
- **Tasks:**
  - Multi-role support: `CITIZEN`, `OFFICER`, `DEPARTMENT_ADMIN`, `SUPER_ADMIN`.
  - Department-scoping: Bind officers to specific government departments.
  - JWT generation and verification with role claims.
  - FastAPI dependency guards: `@require_roles(...)` and `@require_department(...)`.
  - Password hashing with Bcrypt (salt + 12 rounds).
- **Verification:** Unit tests verifying access isolation (e.g. Officer cannot access citizen-only actions; Officer A cannot view Department B applications).

---

### MILESTONE 3 — Departments, Categories & Government Service Catalog
- **Objective:** Database-backed government service directory for Maharashtra departments.
- **Tasks:**
  - Department entity management (Revenue, Urban Development, Rural Development, etc.).
  - Service categories (Certificates, Land Records, Social Welfare, Licenses).
  - Service catalog API with SLAs, fees, required documents, and eligibility rules.
  - Bilingual service labels (English and Marathi).
- **Verification:** API returns structured service catalog with department and category filtering.

---

### MILESTONE 4 — Service Search Engine & Dynamic Form Engine
- **Objective:** Discovery engine and schema-driven dynamic application forms.
- **Tasks:**
  - Search engine supporting exact, keyword, category, and fuzzy matching.
  - JSON-Schema based dynamic form configuration per service (`service_forms`).
  - Form field types: `TEXT`, `NUMBER`, `DATE`, `DROPDOWN`, `RADIO`, `CHECKBOX`, `ADDRESS`, `PHONE`, `EMAIL`, `FILE`, `TEXTAREA`.
  - Backend validation of submitted form responses against service schema.
- **Verification:** Test submitting valid and invalid form responses against defined schemas.

---

### MILESTONE 5 — Citizen Portal & Application Lifecycle
- **Objective:** Public-facing citizen portal (React/Vite) with draft and submission lifecycle.
- **Tasks:**
  - Scaffold React 18 + Vite + TypeScript frontend with Tailwind CSS.
  - Citizen landing page: Hero ("One Platform. Many Government Services."), Popular Services, Search.
  - Citizen authentication: Login, Registration, Profile.
  - Application builder: Dynamic form renderer, draft saving, and final submission.
  - Unique application number generator (e.g. `MH-REV-2026-00102`).
- **Verification:** Citizen submits application through the portal and receives unique application number.

---

### MILESTONE 6 — Document Management & Secure Storage
- **Objective:** Secure upload pipeline, validation, and storage abstraction.
- **Tasks:**
  - Secure storage abstraction (`StorageService` interface with LocalDisk implementation).
  - Validation: 5MB size limit, MIME whitelist (PDF, JPG, PNG), SHA-256 integrity hash.
  - Non-guessable storage naming and protected download routes with RBAC verification.
  - Document verification statuses: `UPLOADED`, `UNDER_REVIEW`, `VERIFIED`, `REJECTED`, `RESUBMISSION_REQUIRED`.
- **Verification:** Upload sample PDF/images; verify file size and type rejections.

---

### MILESTONE 7 — Configurable Application Workflow & Real-Time Tracking
- **Objective:** Configurable state transitions and citizen tracking timeline.
- **Tasks:**
  - Application states: `DRAFT`, `SUBMITTED`, `UNDER_REVIEW`, `DOCUMENT_VERIFICATION`, `ADDITIONAL_INFORMATION_REQUIRED`, `PROCESSING`, `APPROVED`, `REJECTED`, `COMPLETED`.
  - Service-configurable workflow state machine.
  - Public & authenticated status tracking with step-by-step visual timeline.
  - Near real-time status updates via polling / SSE.
- **Verification:** Transition an application through each state; verify timeline and audit event persistence.

---

### MILESTONE 8 — Government Integration Adapter Framework
- **Objective:** Pluggable integration layer solving SIH PS-129 platform interoperability.
- **Tasks:**
  - Base adapter interface: `authenticate`, `submit_application`, `get_application_status`, `verify_document`, `cancel_application`.
  - Normalized data exchange models (`NormalizedApplicationStatus`, `NormalizedDocumentStatus`).
  - Realistic mock adapters clearly labeled: `MOCK GOVERNMENT INTEGRATION FOR SIH DEMONSTRATION` (Revenue Land Records, Aaple Sarkar, DigiLocker).
  - Status synchronization orchestrator.
- **Verification:** End-to-end simulated submission and status sync using mock adapters.

---

### MILESTONE 9 — Government Officer Workbench & Application Queue
- **Objective:** Dedicated, secure government officer dashboard.
- **Tasks:**
  - Department-scoped queue with search, filter (status, date, SLA urgency), and sorting.
  - Application detail workbench: Citizen details, form data, document viewer.
  - Officer actions: Verify/reject documents, request additional info, add remarks, advance status.
  - Department workload indicators and daily task counts.
- **Verification:** Officer verifies documents, enters remarks, advances status, and citizen portal reflects update.

---

### MILESTONE 10 — Super Admin Dashboard, Analytics & Department Management
- **Objective:** Administrative portal for platform governance and performance telemetry.
- **Tasks:**
  - Department and service management (create/edit services and schemas without code changes).
  - Analytics KPIs: Total applications, pending workload, SLA breach warnings, rejection rates.
  - Visual charts: Applications by department, status distribution, daily throughput.
  - Immutable audit trail explorer.
- **Verification:** Super admin creates a new service; service immediately appears in citizen directory.

---

### MILESTONE 11 — Notification System
- **Objective:** Multi-channel notification pipeline for citizen transparency.
- **Tasks:**
  - In-app notification bell and notification history center.
  - Event listeners on application state changes.
  - Extensible adapter architecture for SMS and Email.
  - Unread notification badges and mark-as-read actions.
- **Verification:** Status change in officer portal immediately produces an in-app notification for the citizen.

---

### MILESTONE 12 — Marathi / English Multilingual Localization (i18n)
- **Objective:** Complete native language accessibility for citizens across Maharashtra.
- **Tasks:**
  - `i18next` integration with English (`en.json`) and Marathi (`mr.json`).
  - Top navigation language switcher toggle.
  - Localized portal labels, form field hints, status badges, and notifications.
  - Dynamic service titles and descriptions translated in Marathi.
- **Verification:** Switch language toggle; verify seamless UI translation across citizen journeys.

---

### MILESTONE 13 — Smart Service Assistant (AI Discovery Layer)
- **Objective:** Citizen-centric discovery assistant to match natural language queries to verified services.
- **Tasks:**
  - Rule-based & semantic intent matching against database service catalog.
  - Grounded in verified service database (never hallucinates requirements or fees).
  - Suggested services with direct "Apply Now" links.
  - Pluggable AI backend (local mock / Gemini API adapter).
- **Verification:** Query "I want to apply for income proof" -> Assistant returns Revenue Income Certificate service.

---

### MILESTONE 14 — Security Hardening, Audit Logs & Rate Limiting
- **Objective:** Production-grade security compliance.
- **Tasks:**
  - Security headers (CSP, HSTS, X-Frame-Options, X-Content-Type-Options).
  - Slowapi / rate-limiting on auth and search endpoints.
  - Input sanitization against XSS and injection.
  - Role-based authorization test matrix.
- **Verification:** Run security audit; verify blocked unauthorized calls and invalid inputs.

---

### MILESTONE 15 — Automated Testing Suite & Verification
- **Objective:** Regression prevention and high test coverage.
- **Tasks:**
  - Unit tests for password hashing, token validation, and schema validation.
  - API integration tests for auth, service catalog, application submission, and officer actions.
  - End-to-end workflow tests simulating Citizen -> Officer -> Status Update -> Notification.
- **Verification:** `pytest` runs and passes 100% of test cases cleanly.

---

### MILESTONE 16 — Demonstration Guide, Docker & Final Handover
- **Objective:** Polish and packaging for winning Smart India Hackathon 2026 presentation.
- **Tasks:**
  - `DEMO_GUIDE.md`: Step-by-step presentation script for jury demonstration.
  - Seed script populating demo personas (Citizen, Revenue Officer, Super Admin) and sample applications.
  - Production-ready README with architectural diagrams, screenshots, and run commands.
  - Optional `docker-compose.yml` for containerized deployment.
- **Verification:** Clean run from scratch using demo accounts matches presentation script flawlessly.
