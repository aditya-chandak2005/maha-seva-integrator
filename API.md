# Maha-Seva Integrator — REST API Specification

**Base URL:** `http://127.0.0.1:8000/api/v1`  
**OpenAPI Swagger UI:** `http://127.0.0.1:8000/docs`  
**ReDoc UI:** `http://127.0.0.1:8000/redoc`  

All requests requiring authentication must pass the JWT token in the header:
```http
Authorization: Bearer <access_token>
```

---

## 1. System & Telemetry Endpoints

### `GET /health`
Returns system status, active environment, and PostgreSQL latency telemetry.
- **Response `200 OK`:**
  ```json
  {
    "status": "healthy",
    "timestamp": "2026-09-09T18:33:35.066721+00:00",
    "database": {
      "status": "connected",
      "latency_ms": 35.86,
      "engine": "PostgreSQL 18"
    },
    "environment": "development"
  }
  ```

### `GET /`
Root endpoint returning platform identity and documentation links.

---

## 2. Authentication Endpoints

### `POST /api/v1/auth/register`
Registers a new citizen account and returns an access token.
- **Request Body:**
  ```json
  {
    "full_name": "Aditya Patil",
    "email": "citizen@example.com",
    "phone": "9820011223",
    "password": "SecurePassword123"
  }
  ```
- **Response `200 OK`:** `TokenResponse`

### `POST /api/v1/auth/login`
Authenticates a citizen or government officer using OAuth2 credentials form.
- **Content-Type:** `application/x-www-form-urlencoded`
- **Body:** `username=<email>&password=<password>`
- **Response `200 OK`:**
  ```json
  {
    "access_token": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...",
    "token_type": "bearer",
    "user_id": 1,
    "full_name": "Aditya Patil",
    "email": "citizen@example.com",
    "role": "CITIZEN",
    "department_id": null
  }
  ```

### `GET /api/v1/auth/me`
Returns current authenticated user profile.
- **Headers:** `Authorization: Bearer <token>`
- **Response `200 OK`:** `UserResponse`

---

## 3. Department & Service Catalog Endpoints

### `GET /api/v1/departments`
Lists all active Maharashtra state government departments.

### `GET /api/v1/services/categories`
Lists all service categories (Certificates, Land Records, Urban Utilities, Welfare).

### `GET /api/v1/services`
Lists available services with optional query filters:
- Query parameters:
  - `q` (string): Search keyword
  - `department_id` (integer): Filter by department
  - `category_id` (integer): Filter by category

### `GET /api/v1/services/{id}`
Returns detailed service information, eligibility criteria, required documents list, and the dynamic JSON `form_schema`.

---

## 4. Application Lifecycle Endpoints

### `POST /api/v1/applications`
Submits a new service application. Generates a unique tracking reference number (e.g. `MH-REV-2026-00102`), creates an initial `SUBMITTED` timeline event, triggers external department adapter submission, and sends an in-app notification.
- **Headers:** `Authorization: Bearer <citizen_token>`
- **Request Body:**
  ```json
  {
    "service_id": 1,
    "form_data": {
      "applicant_name": "Aditya Patil",
      "aadhaar_number": "987654321012",
      "annual_income": 95000,
      "income_source": "Agriculture",
      "certificate_purpose": "Education & Scholarship",
      "district": "Pune",
      "taluka": "Haveli",
      "village_ward": "Kothrud"
    },
    "status": "SUBMITTED"
  }
  ```

### `GET /api/v1/applications/my`
Returns list of applications submitted by the current citizen.

### `GET /api/v1/applications/track/{application_number}`
Publicly accessible tracking endpoint returning status progression, department name, submission date, and timeline without requiring login.

### `GET /api/v1/applications/{id}`
Returns full dossier of an application including form responses, attached documents, and event timeline. Enforces ownership check for citizens and department-scoping for officers.

---

## 5. Document Management Endpoints

### `POST /api/v1/documents/upload`
Uploads a supporting document.
- **Content-Type:** `multipart/form-data`
- **Fields:**
  - `file`: Binary file (PDF, JPG, PNG; max 5MB)
  - `document_type`: String (e.g., `ID_PROOF`, `INCOME_PROOF`)
  - `application_id`: Optional Integer

### `GET /api/v1/documents/{id}/download`
Securely streams file download after validating role authorization.

---

## 6. Officer Workbench Endpoints

### `GET /api/v1/officer/applications`
Returns applications scoped to the authenticated officer's assigned department.
- **Headers:** `Authorization: Bearer <officer_token>`
- **Query parameters:** `status_filter`, `search`

### `PATCH /api/v1/officer/applications/{id}/status`
Transitions application state, creates an audit event, appends to timeline, and notifies the citizen.
- **Request Body:**
  ```json
  {
    "new_status": "APPROVED",
    "remarks": "Income eligibility verified against revenue records. Certificate sanctioned."
  }
  ```

### `POST /api/v1/officer/documents/{id}/verify`
Marks an attached document as `VERIFIED` or `REJECTED`.
- **Request Body:**
  ```json
  {
    "status": "VERIFIED",
    "remarks": "Aadhaar UID match confirmed."
  }
  ```

---

## 7. Administrative & Telemetry Endpoints

### `GET /api/v1/admin/analytics/overview`
Aggregated state-wide KPIs: total applications, clearance rate, status breakdown, and departmental throughput.
- **Headers:** `Authorization: Bearer <admin_token>`

### `GET /api/v1/admin/audit-logs`
Returns the append-only immutable audit trail with actor name, role, IP address, and operation payload.

---

## 8. Smart Assistant Endpoints

### `POST /api/v1/assistant/chat`
Conversational service discovery assistant grounded on the verified service catalog in English and Marathi.
- **Request Body:**
  ```json
  {
    "query": "I need income certificate for college admission",
    "language": "en"
  }
  ```
