# Maha-Seva Integrator — Development Roadmap & Milestones

**Hackathon:** Smart India Hackathon 2026  
**Problem Statement:** SIH 2026 — PS-129 (SIH26129)  
**Organization:** Government of Maharashtra  
**Project:** Maha-Seva Integrator  

This roadmap details the sequential milestone execution strategy for building the end-to-end digital government service orchestration platform.

---

## Milestone Overview

```text
[M0] Inspection & Setup ────► [M1] Backend Foundation ────► [M2] Multi-Role RBAC
                                                                   │
┌──────────────────────────────────────────────────────────────────┘
▼
[M3] Departments & Services ─► [M4] Search & Dynamic Forms ─► [M5] Citizen Submission
                                                                   │
┌──────────────────────────────────────────────────────────────────┘
▼
[M6] Document Management ────► [M7] Workflow State Machine ─► [M8] Integration Adapters
                                                                   │
┌──────────────────────────────────────────────────────────────────┘
▼
[M9] Officer Dashboard ──────► [M10] Admin & Analytics ────► [M11] Notifications
                                                                   │
┌──────────────────────────────────────────────────────────────────┘
▼
[M12] Marathi Localization ──► [M13] Smart Assistant ──────► [M14] Security & Audits
                                                                   │
┌──────────────────────────────────────────────────────────────────┘
▼
[M15] Automated Testing ─────► [M16] Deployment & SIH Packaging
```

---

## Detailed Milestone Breakdown

### Milestone 0: Repository Inspection, Environment & Architecture (COMPLETED)
- **Objective:** Deep inspection of existing workspace, validation of official SIH PS-129 details, resolution of encoding/setup blockers, and architecture baseline.
- **Deliverables:**
  - `PROJECT_STATUS.md` diagnostic report.
  - `ARCHITECTURE.md` comprehensive system design.
  - `ROADMAP.md` milestone progression plan.
  - Updated `README.md` and `.env.example`.
  - Resolution of `requirements.txt` UTF-16LE encoding.
  - Verification of running FastAPI backend (PID 16452) and PostgreSQL 18.

---

### Milestone 1: Backend Foundation & Database Refactoring
- **Objective:** Clean architecture refactoring with unified multi-role database models, migration setup, and system health telemetry.
- **Tasks:**
  - Create layered directory structure (`core/`, `routers/`, `services/`, `repositories/`, `models/`, `schemas/`, `integrations/`).
  - Implement comprehensive SQLAlchemy ORM models: `User`, `Role`, `Department`, `ServiceCategory`, `Service`, `ServiceForm`, `Application`, `ApplicationEvent`, `Document`, `DocumentVerification`, `Notification`, `AuditLog`.
  - Configure database seeder and table creation routines.
  - Standardize error handling and response envelopes (`/api/v1/health`, `/api/v1/system-info`).

---

### Milestone 2: Authentication, Users & Role-Based Access Control (RBAC)
- **Objective:** Secure, role-aware authentication for Citizens, Officers, Department Admins, and Super Admins.
- **Tasks:**
  - Expand JWT payload with `role` and `department_id`.
  - Implement role dependency guards (`require_role`, `require_department`).
  - Create `/api/v1/auth/register`, `/api/v1/auth/login`, and `/api/v1/auth/me`.
  - Provide seed accounts for each role (`citizen@demo.gov.in`, `officer.revenue@demo.gov.in`, `admin@demo.gov.in`).

---

### Milestone 3: Departments, Categories & Government Service Catalog
- **Objective:** Data-driven service catalog representing Maharashtra government services.
- **Tasks:**
  - Seed verified Maharashtra departments (Revenue & Forest, Urban Development, Rural Development, Labour).
  - Seed core services (Income Certificate, Domicile Certificate, Non-Creamy Layer, Trade License, 7/12 Land Record Extract).
  - Create CRUD and query endpoints: `GET /api/v1/departments`, `GET /api/v1/services`.

---

### Milestone 4: Service Discovery, Search & Dynamic Form Engine
- **Objective:** Search engine and dynamic JSON schema form engine.
- **Tasks:**
  - Implement search with keyword, category, department, and fuzzy matching.
  - Define dynamic form schemas for each service in database (field types, validation rules, required documents).
  - Expose `GET /api/v1/services/{id}/form-schema`.

---

### Milestone 5: Citizen Portal & Application Engine
- **Objective:** Frontend citizen portal scaffold and end-to-end application submission.
- **Tasks:**
  - Scaffold React 18 + Vite + TypeScript frontend with Tailwind CSS.
  - Build public citizen landing page, service catalog, and service detail views.
  - Build dynamic form renderer in React rendering fields from API schema.
  - Implement draft saving and `POST /api/v1/applications` returning unique tracking numbers (`MH-***-2026-*****`).

---

### Milestone 6: Document Management & Verification Engine
- **Objective:** Secure file upload pipeline and verification lifecycle.
- **Tasks:**
  - Build multipart file upload endpoint (`POST /api/v1/documents/upload`).
  - Enforce file type (PDF, JPEG, PNG), size limit (5MB), and SHA-256 hash.
  - Implement document verification states (`UPLOADED`, `UNDER_REVIEW`, `VERIFIED`, `REJECTED`).
  - Build frontend document upload and preview widget.

---

### Milestone 7: Application Workflow, State Machine & Timeline Tracking
- **Objective:** Enforceable state machine and citizen tracking timeline.
- **Tasks:**
  - Implement workflow transition validator (`DRAFT` -> `SUBMITTED` -> `UNDER_REVIEW` -> `DOCUMENT_VERIFICATION` -> `PROCESSING` -> `APPROVED` / `REJECTED` -> `COMPLETED`).
  - Record each transition in `application_events`.
  - Build interactive visual tracking timeline on frontend (`/track/{application_number}`).

---

### Milestone 8: Government Integration Adapter Framework & Mock Adapters
- **Objective:** Implement PS-129 core interoperability adapter architecture.
- **Tasks:**
  - Define `BaseGovernmentAdapter` interface.
  - Implement `MaharashtraRevenueAdapter`, `UrbanLocalBodyAdapter`, and `MockGovernmentAdapter`.
  - Label all mock integrations clearly: `MOCK GOVERNMENT INTEGRATION — FOR SIH DEMONSTRATION`.
  - Simulate external department acknowledgement, document checks, and status callbacks.

---

### Milestone 9: Government Officer Dashboard & Verification Queue
- **Objective:** Operational workbench for government officers.
- **Tasks:**
  - Build Officer Dashboard UI with department metrics (Pending, In Review, Approved, SLA breach).
  - Build application queue with filters, priority sorting, and search.
  - Build officer application review screen (Citizen info, form values, document verification modal, remarks).
  - Allow officers to verify/reject documents and change application statuses with audit logging.

---

### Milestone 10: Super Admin & Department Admin Analytics
- **Objective:** Administrative monitoring, service configuration, and analytics.
- **Tasks:**
  - Build platform-wide telemetry dashboard (Applications by department, status distribution, average SLA days).
  - Service configuration interface for admins to edit fees, SLAs, and dynamic form fields.
  - Integration health monitor checking adapter status.

---

### Milestone 11: Notification System
- **Objective:** Event-driven notification dispatch.
- **Tasks:**
  - Implement notification manager triggered by status changes and document reviews.
  - Expose `GET /api/v1/notifications` and `PATCH /api/v1/notifications/{id}/read`.
  - Build in-app notification bell and popover in citizen and officer portals.

---

### Milestone 12: Multilingual Support (English & Marathi)
- **Objective:** Accessible bilingual interface for Maharashtra citizens.
- **Tasks:**
  - Configure `i18next` with `en.json` and `mr.json`.
  - Translate all navigation, common UI elements, status badges, and service names.
  - Implement prominent language toggle (English / मराठी) in header.

---

### Milestone 13: Smart Service Assistant (AI Discovery Layer)
- **Objective:** Conversational service discovery for citizens with low digital literacy.
- **Tasks:**
  - Implement intent understanding and semantic search matching citizen plain-language queries to official services.
  - Use verified database catalog as ground truth; explicitly guard against hallucinating government rules.
  - Provide interactive chat widget on citizen portal.

---

### Milestone 14: Security Hardening & Audit System
- **Objective:** Enterprise compliance and security verification.
- **Tasks:**
  - Implement immutable audit logger capturing actor, role, IP, entity ID, and diffs.
  - Audit log viewer for Super Admins.
  - Enforce strict security headers, CORS origin verification, and rate limiting.

---

### Milestone 15: Automated Testing & Verification
- **Objective:** High test coverage and stability.
- **Tasks:**
  - Write backend unit tests with `pytest` for auth, RBAC, workflows, and dynamic forms.
  - Write API integration tests for complete citizen submission and officer approval flows.
  - Frontend build and lint verification.

---

### Milestone 16: Packaging, Demonstration Guide & Presentation Readiness
- **Objective:** Final packaging for SIH 2026 jury demonstration.
- **Tasks:**
  - Create `DEMO_GUIDE.md` with step-by-step presentation script.
  - Create `API.md` documenting REST endpoints.
  - Ensure local end-to-end execution without external internet/credentials required.
