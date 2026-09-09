# Maha-Seva Integrator (महा-सेवा इंटिग्रेटर)

> **A Unified Digital Government Service Orchestration Platform**  
> Aligned with **Smart India Hackathon 2026** — Problem Statement **SIH26129 (PS-129)**  
> **Sponsoring Organization:** Government of Maharashtra  
> **Theme:** Smart Automation / Software Interoperability  

---

## 🏛️ Executive Summary

In public service delivery across Maharashtra, citizens often encounter fragmented departmental silos. A single citizen interaction (such as obtaining a certificate, business permit, or agricultural subsidy) requires navigating disparate departmental portals (Revenue, Municipal, Rural Development, Transport), managing redundant credentials, submitting duplicate documents, and enduring opaque manual verifications.

**Maha-Seva Integrator** solves this fundamental challenge by acting as a **centralized digital public service orchestration platform**. It integrates departmental backends through a modular **Integration Adapter Framework**, provides citizens with a single bilingual gateway (English & मराठी), streamlines dynamic form submissions, facilitates verified document management, and offers government officers an efficient verification workbench with complete audit transparency.

---

## 🌟 Key Platform Capabilities

- **Unified Citizen Gateway:** A single entry point for discovering, applying for, and tracking government services across multiple departments.
- **Dynamic Form Engine:** Schema-driven dynamic forms that adapt fields, validation rules, and document requirements based on database configuration—no frontend recoding required for new services.
- **Integration Adapter Framework:** Decouples core platform logic from external government departments via standardized adapters (`RevenueAdapter`, `MunicipalAdapter`, and verified `MockGovernmentAdapter` for SIH demonstration).
- **Secure Document Pipeline:** Enforces file type, size (5MB), and SHA-256 integrity validation with controlled, role-scoped access.
- **Government Officer Workbench:** Dedicated departmental queue enabling officers to inspect applications, verify/reject documents, input remarks, and transition application states.
- **Real-Time Tracking & Notifications:** Transparent, step-by-step visual status timeline with instant in-app alerts on status transitions.
- **Multilingual Support (i18n):** Complete localization in English and Marathi (`मराठी`).
- **Smart Service Assistant:** Semantic service discovery layer guiding citizens to the correct service without hallucinating official facts.
- **Immutable Audit Logging:** Append-only security and operational audit trail tracking every status alteration, document action, and administrative operation.

---

## 📐 System Architecture Overview

```mermaid
flowchart LR
    subgraph Citizens["Citizens"]
        Portal["Citizen Web Portal<br/>(English / मराठी)"]
        Assistant["Smart Service Assistant<br/>(AI Discovery)"]
    end

    subgraph CorePlatform["Maha-Seva Integrator Platform Core"]
        Gateway["API Gateway & Auth Proxy"]
        FastAPI["FastAPI Application Services"]
        
        subgraph Services["Core Modules"]
            Auth["RBAC & Auth"]
            Catalog["Service Catalog & Search"]
            Forms["Dynamic Form Engine"]
            Workflow["Application State Machine"]
            DocMgr["Secure Document Pipeline"]
            Notif["Notification Dispatcher"]
            Audit["Audit Logger"]
        end

        DB[(PostgreSQL 18)]
        Storage[(Secure File Storage)]
    end

    subgraph IntegrationLayer["Integration Adapter Framework"]
        AdapterEngine["Adapter Orchestrator"]
        RevAdapter["Revenue Adapter"]
        MunAdapter["Municipal Adapter"]
        MockAdapter["SIH Mock Adapter"]
    end

    subgraph GovtOfficers["Government Operations"]
        OfficerDesk["Officer Verification Workbench"]
        AdminDesk["Super Admin Telemetry"]
    end

    Portal --> Gateway
    Assistant --> Gateway
    OfficerDesk --> Gateway
    AdminDesk --> Gateway

    Gateway --> FastAPI
    FastAPI --> Services
    Services --> DB
    DocMgr --> Storage
    Workflow --> AdapterEngine

    AdapterEngine --> RevAdapter
    AdapterEngine --> MunAdapter
    AdapterEngine --> MockAdapter
```

---

## 🛠️ Technology Stack

| Layer | Technology | Rationale |
| :--- | :--- | :--- |
| **Backend API** | Python 3.13+, FastAPI, Pydantic v2 | High performance, asynchronous capability, auto OpenAPI documentation, strict type safety |
| **Database** | PostgreSQL 18, SQLAlchemy 2.0 | Enterprise-grade relational integrity, JSONB support for dynamic forms, indexed query performance |
| **Authentication** | JWT (HS256), Passlib (Bcrypt) | Stateless, secure, industry-standard role-based access control |
| **Frontend Portal** | React 18, Vite, TypeScript, Tailwind CSS | Accessible, responsive, lightning-fast rendering, government-grade UI design |
| **Localization** | i18next (English & मराठी) | Native language inclusion for all citizens of Maharashtra |
| **Integration** | Adapter Pattern (Python Abstract Base Classes) | Standardized interoperability with external government platforms |
| **Telemetry & Audit** | Custom Append-Only Audit Logger | Absolute accountability and regulatory compliance |

---

## 📁 Repository Structure

```text
maha-seva-integrator/
├── README.md                  # Project overview & quickstart (This file)
├── PROJECT_STATUS.md          # Diagnostic status & environment verification
├── ARCHITECTURE.md            # In-depth architectural specifications
├── ROADMAP.md                 # 17-step implementation roadmap (M0 - M16)
├── backend/                   # Python FastAPI Backend
│   ├── app/
│   │   ├── main.py            # FastAPI entrypoint & route registration
│   │   ├── database.py        # SQLAlchemy engine & session factory
│   │   ├── models.py          # Relational ORM models
│   │   └── auth.py            # JWT authentication & registration
│   ├── .env.example           # Configuration template
│   ├── requirements.txt       # Python dependencies (UTF-8 normalized)
│   └── .venv/                 # Local Python virtual environment
├── database/                  # Schema DDL, migrations, and seed scripts
├── docs/                      # Architectural and API documentation
│   ├── api/                   # OpenAPI contracts & endpoint specifications
│   ├── architecture/          # Blueprints & sequence diagrams
│   └── workflows/             # Departmental workflow configurations
├── frontend/                  # React + TypeScript Citizen & Officer Portal
└── mock-services/             # Mock external government systems for SIH demo
```

---

## 🚀 Quickstart & Setup Guide

### 1. Prerequisites
- **Python:** Version 3.11 or higher
- **PostgreSQL:** Version 14 or higher (Active local service on port 5432)
- **Node.js:** Version 18 or higher (with npm)
- **Git**

### 2. Backend Setup
```powershell
# Navigate to backend directory
cd backend

# Activate existing virtual environment (Windows PowerShell)
.\.venv\Scripts\Activate.ps1

# (Optional) If installing dependencies into a fresh virtual environment:
# pip install -r requirements.txt

# Configure environment variables
# Copy .env.example to .env and adjust PostgreSQL credentials if needed
# Example: DATABASE_URL=postgresql://postgres:password@localhost:5432/maha_seva

# Start backend development server
uvicorn app.main:app --reload --host 127.0.0.1 --port 8000
```
- **API Base:** `http://127.0.0.1:8000`
- **Interactive OpenAPI Documentation:** `http://127.0.0.1:8000/docs`
- **Health Telemetry:** `http://127.0.0.1:8000/health`
- **Database Status:** `http://127.0.0.1:8000/database-test`

---

## 👥 Role-Based Access Matrix

| Role | Target Persona | Permissions & Scope |
| :--- | :--- | :--- |
| `CITIZEN` | Resident / Public | Register, discover services, dynamic form submission, document uploads, real-time tracking, in-app notifications. |
| `OFFICER` | Department Verifier | Secure login, department-scoped queue, document verification, status advancement, official remarks entry. |
| `DEPARTMENT_ADMIN` | Department Head | Department officer management, department service configuration, SLA monitoring, workload analytics. |
| `SUPER_ADMIN` | State Platform Admin | Cross-departmental governance, new service schemas, integration adapter health, compliance audit logs. |

---

## 🎬 Smart India Hackathon Demonstration Scenario

The end-to-end prototype is structured around a complete evaluation flow:

1. **Part 1 — Citizen Discovery & Application:**
   - Citizen opens the bilingual portal (Marathi/English).
   - Citizen searches for *"Income Certificate"* via search or the Smart Service Assistant.
   - Citizen views verified eligibility and required documents.
   - Citizen logs in, completes the schema-driven dynamic form, uploads required documents, and submits.
   - Unique application tracking number is issued (`MH-REV-2026-XXXXX`).
2. **Part 2 — Government Officer Verification:**
   - Revenue Officer logs into the secure officer workbench.
   - Application appears in the department's operational queue.
   - Officer inspects submitted information and views uploaded documents.
   - Officer verifies documents, enters remarks, and moves the application to processing/approval.
3. **Part 3 — Real-Time Citizen Synchronization:**
   - Citizen's tracking view updates in real-time with visual status progression.
   - Citizen receives an instant in-app notification confirming progress.
4. **Part 4 — Administrative Telemetry & Audit:**
   - Super Admin logs in to showcase departmental SLAs, application status distributions, and the immutable security audit trail.

---

## 📚 Documentation Index

- [PROJECT_STATUS.md](./PROJECT_STATUS.md) — Comprehensive technical diagnostic and environment audit.
- [ARCHITECTURE.md](./ARCHITECTURE.md) — Complete end-to-end system architecture specification.
- [ROADMAP.md](./ROADMAP.md) — Milestone-based implementation plan (Milestones 0 through 16).

---

## 📄 License

This project is developed for the **Smart India Hackathon 2026** under the [MIT License](./LICENSE).
