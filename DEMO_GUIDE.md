# Maha-Seva Integrator — SIH 2026 Demonstration Guide

**Project Name:** Maha-Seva Integrator (महा-सेवा इंटिग्रेटर)  
**Hackathon:** Smart India Hackathon 2026  
**Problem Statement:** SIH26129 (PS-129) — System Integration and Software Interoperability among Government Digital Platforms  
**Sponsoring Organization:** Government of Maharashtra  
**Theme:** Smart Automation  

---

## 🎯 Demonstration Objective

To demonstrate to the SIH 2026 Evaluation Jury how **Maha-Seva Integrator** solves departmental fragmentation in public service delivery across Maharashtra through a unified citizen gateway, dynamic schema-driven applications, an Integration Adapter Framework, role-scoped officer verification workbenches, and immutable audit transparency.

---

## 🚀 Active Environment URLs

- **Citizen & Government Portal:** `http://127.0.0.1:5173/`
- **FastAPI Backend API Base:** `http://127.0.0.1:8000/`
- **Interactive Swagger Documentation:** `http://127.0.0.1:8000/docs`
- **System Health Telemetry:** `http://127.0.0.1:8000/health`

---

## 👥 Pre-Configured Demonstration Accounts

| Role | Email | Password | Scope & Department |
| :--- | :--- | :--- | :--- |
| **Citizen** | `citizen@mahaseva.gov.in` | `Citizen@2026` | Resident Public (All Services) |
| **Revenue Officer** | `officer.revenue@mahaseva.gov.in` | `Officer@2026` | Revenue & Forest Department (Tahsildar Desk) |
| **Municipal Officer** | `officer.municipal@mahaseva.gov.in` | `Officer@2026` | Urban Development Department (ULB Desk) |
| **Super Admin** | `admin@mahaseva.gov.in` | `Admin@2026` | State Platform Governance & Audit Oversight |

*Note: The login screen features **1-Click Quick Demo Login buttons** to seamlessly switch between personas during live evaluation.*

---

## 🎬 4-Part Demonstration Flow

### PART 1: Citizen Discovery & Dynamic Application Submission
1. **Open Citizen Portal:** Open `http://127.0.0.1:5173` in your browser.
2. **Language Localization:**
   - Click the language toggle button in the top navigation strip (`मराठी` / `English`).
   - Notice the complete instant UI translation (navigation, hero headings, status badges, buttons).
3. **Smart Service Assistant:**
   - Click the floating **"✨ AI Service Assistant"** button in the bottom-right corner.
   - Click one of the pre-configured prompt chips: *"I need an income certificate for my daughter's scholarship"* (or in Marathi: *"मुलीच्या शिष्यवृत्तीसाठी मला उत्पन्नाचा दाखला हवा आहे"*).
   - Explain to the jury: The assistant is strictly grounded on the verified service catalog and guides citizens to the exact right service without hallucinating rules or fees.
   - Click **"Apply Now"** directly from the assistant dialog.
4. **Service Inspection & Eligibility:**
   - Review the Income Certificate service overview: Department (Revenue & Forest), SLA (15 Days), Statutory Fee (₹33.60), and required documents (Aadhaar, Ration Card, Income Proof).
   - Click **"Proceed to Form"** (or Login using the 1-click **"Citizen"** demo button).
5. **Schema-Driven Dynamic Form:**
   - Fill in the form: Annual Family Income (e.g., `120000`), Income Source (Agriculture), Purpose (Scholarship), District (Pune), Taluka (Haveli), Village (Kothrud).
   - Explain to the jury: Forms are dynamically generated from database JSON schemas, allowing new services to be added without frontend deployments.
   - Click **"Continue to Documents"**.
6. **Document Attachment:**
   - Choose sample files for Aadhaar and Income proof.
   - Notice instant client-side format & size checks.
7. **Submit Application:**
   - Click **"Submit Application"**.
   - Instantly receive a unique state reference number (e.g. `MH-REV-2026-XXXXX`).
   - Copy or note this number.

---

### PART 2: Real-Time Status Tracking
1. Click **"Track Application Timeline"** (or click **"Track Application"** in the top navigation bar).
2. Enter the application reference number (e.g. `MH-REV-2026-00101` or your newly created number).
3. Show the jury:
   - Current status badge (`SUBMITTED` or `UNDER_REVIEW`).
   - Initial timeline checkpoint: *"Application submitted online by citizen"*.
   - Submitted form data snapshot.

---

### PART 3: Government Officer Verification & Decision
1. Click **"Logout"** in the top-right corner.
2. Click **"Login"** and select the 1-click **"Revenue Officer"** button (`officer.revenue@mahaseva.gov.in`).
3. The officer is taken directly to the **Department Verification Queue**:
   - Notice that the officer's queue is strictly scoped to Revenue Department applications.
   - Find the application submitted in Part 1.
4. Click **"Inspect & Action"**:
   - Inspect the applicant's verified profile and form answers.
   - Review the attached supporting documents.
   - Click **"Verify"** next to the attached documents.
5. Make an official status decision:
   - Select status transition: `PROCESSING` (Field Verification) or `APPROVED` (Issue Certificate).
   - Enter an official remark: *"Documents verified against revenue land records. Eligibility verified."*
   - Click **"Commit Status Decision"**.
   - Notice the instant confirmation and new entry appended to the action history.

---

### PART 4: Real-Time Synchronization & Citizen Transparency
1. Click **"Logout"** and log back in as **"Citizen"** (`citizen@mahaseva.gov.in`).
2. Go to **"Dashboard"** / **"Track Application"**:
   - Observe the updated status badge.
   - Observe the new timeline checkpoint showing the officer's name, role, official remarks, and timestamp.
3. Click the **Notification Bell** in the top navigation bar:
   - Notice the unread notification: *"Your application MH-REV-2026-... is now 'APPROVED'. Remark: Documents verified against revenue land records."*

---

### PART 5: Super Administrator Governance & Audit Trail
1. Click **"Logout"** and log in as **"Super Admin"** (`admin@mahaseva.gov.in`).
2. Click **"Admin Desk"** in the top navigation:
   - **Cross-Department Telemetry:** Review Total Applications, Pending Workload, Clearance Rates, and Active Services across departments.
   - **Departmental Throughput Table:** Show the comparative workload of Revenue vs. Urban Development vs. Rural Development departments.
   - **Immutable Audit Trail:** Show the live audit table capturing every login, status change, and document verification with actor names, roles, entity IDs, and timestamps.

---

## 🏆 Key Architecture Highlights for Evaluators

1. **PS-129 Alignment:** Unifies fragmented departmental systems using an **Integration Adapter Framework** (`BaseGovernmentAdapter` with mock implementations for SIH evaluation).
2. **Dynamic Form Engine:** Service schemas stored in PostgreSQL JSONB—zero code changes needed to introduce new services.
3. **Enterprise Security:** Salted Bcrypt hashing, stateless JWT with RBAC, department-scoped authorization guards, and strict Pydantic v2 input sanitization.
4. **Citizen Inclusivity:** Full Marathi (`मराठी`) and English localization, WCAG 2.1 AA accessibility standards, and a non-hallucinating AI service assistant.
