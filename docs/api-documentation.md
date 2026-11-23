# Enterprise Interview Management System (IMS)
## REST API Specification & Contract

**Document:** `docs/api-documentation.md`  
**Status:** Approved Architectural Specification  
**Version:** 1.0.0 (OpenAPI 3.0 Aligned)  
**Date:** November 2026  

---

### 1. Global API Standards

- **Base URL:** `/api/v1`
- **Transport Security:** HTTPS required
- **Authentication:** HTTP Header `Authorization: Bearer <JWT_ACCESS_TOKEN>`
- **Content Type:** `application/json` (except multipart file uploads)
- **Standard Success Envelope (`ApiResponse<T>`):**
  ```json
  {
    "success": true,
    "message": "Operation completed successfully",
    "data": { ... },
    "timestamp": "2026-11-22T14:30:00Z"
  }
  ```
- **Standard Error Envelope (`ApiErrorResponse`):**
  ```json
  {
    "success": false,
    "errorCode": "INVALID_ARGUMENT",
    "message": "Validation failed for one or more fields",
    "errors": [
      {
        "field": "email",
        "rejectedValue": "invalid-email",
        "reason": "Must be a well-formed email address"
      }
    ],
    "timestamp": "2026-11-22T14:30:00Z"
  }
  ```

---

### 2. Authentication Endpoints (`/api/v1/auth`)

#### 2.1 Login
- **Endpoint:** `POST /api/v1/auth/login`
- **Role Required:** Public (PermitAll)
- **Request Body:**
  ```json
  {
    "email": "sarah.connor@acme.com",
    "password": "Password123!"
  }
  ```
- **Response Body (200 OK):**
  ```json
  {
    "success": true,
    "message": "Login successful",
    "data": {
      "accessToken": "eyJhbGciOiJIUzI1NiIsIn...",
      "refreshToken": "eyJhbGciOiJIUzI1NiIsIn...",
      "tokenType": "Bearer",
      "expiresIn": 3600,
      "user": {
        "id": "6550...01",
        "email": "sarah.connor@acme.com",
        "firstName": "Sarah",
        "lastName": "Connor",
        "role": "ROLE_HR",
        "department": "Talent Acquisition",
        "requiresPasswordChange": false
      }
    }
  }
  ```
- **Errors:** `401 Unauthorized` (Invalid credentials), `403 Forbidden` (Account disabled).

#### 2.2 Refresh Token
- **Endpoint:** `POST /api/v1/auth/refresh`
- **Role Required:** Public
- **Request Body:** `{ "refreshToken": "eyJhbGciOiJIUzI1Ni..." }`
- **Response Body (200 OK):** Refreshed `accessToken` and `refreshToken`.
- **Errors:** `401 Unauthorized` (Expired or revoked refresh token).

#### 2.3 Mandatory Change Password
- **Endpoint:** `POST /api/v1/auth/change-password`
- **Role Required:** Authenticated (Any role, including `requiresPasswordChange=true`)
- **Request Body:**
  ```json
  {
    "currentPassword": "TemporaryPassword123!",
    "newPassword": "NewSecurePassword456!",
    "confirmPassword": "NewSecurePassword456!"
  }
  ```
- **Validation:** Minimum 8 chars, 1 uppercase, 1 lowercase, 1 number, 1 special char. `newPassword` must match `confirmPassword`.
- **Response Body (200 OK):** `{ "success": true, "message": "Password changed successfully" }`

#### 2.4 Get Current User Profile
- **Endpoint:** `GET /api/v1/auth/me`
- **Role Required:** Authenticated
- **Response Body (200 OK):** User details, role, department, permissions.

---

### 3. User Management Endpoints (`/api/v1/users`)

#### 3.1 Provision User Account
- **Endpoint:** `POST /api/v1/users`
- **Role Required:** `ROLE_ADMIN`
- **Request Body:**
  ```json
  {
    "email": "david.ross@acme.com",
    "firstName": "David",
    "lastName": "Ross",
    "role": "ROLE_INTERVIEWER",
    "department": "Engineering",
    "temporaryPassword": "InitPassword2026!",
    "phoneNumber": "+1-555-0188",
    "skills": ["Java", "Distributed Systems"]
  }
  ```
- **Response Body (201 Created):** Created user summary (`requiresPasswordChange: true`).
- **Errors:** `409 Conflict` (Email already registered), `400 Bad Request` (Invalid role/fields).

#### 3.2 List Users (Paginated & Filtered)
- **Endpoint:** `GET /api/v1/users?page=0&size=20&role=ROLE_INTERVIEWER&department=Engineering&search=David`
- **Role Required:** `ROLE_ADMIN`, `ROLE_HR`
- **Response Body (200 OK):** Page metadata, total elements, list of user summaries.

#### 3.3 Get User by ID
- **Endpoint:** `GET /api/v1/users/{id}`
- **Role Required:** `ROLE_ADMIN`, `ROLE_HR`, or Self
- **Response Body (200 OK):** User detail record.

#### 3.4 Update User
- **Endpoint:** `PUT /api/v1/users/{id}`
- **Role Required:** `ROLE_ADMIN`
- **Request Body:** Updated fields (`firstName`, `lastName`, `department`, `phoneNumber`, `skills`).

#### 3.5 Update User Status (Activate/Deactivate)
- **Endpoint:** `PATCH /api/v1/users/{id}/status`
- **Role Required:** `ROLE_ADMIN`
- **Request Body:** `{ "status": "INACTIVE" }`
- **Response Body (200 OK):** Updated user.

#### 3.6 Get Qualified Interviewers List
- **Endpoint:** `GET /api/v1/users/interviewers?department=Engineering&skill=Java`
- **Role Required:** `ROLE_HR`, `ROLE_ADMIN`, `ROLE_HIRING_MANAGER`
- **Response Body (200 OK):** List of active interviewers with their departments, skills, and current weekly workload count.

---

### 4. Candidate Management Endpoints (`/api/v1/candidates`)

#### 4.1 Create Candidate
- **Endpoint:** `POST /api/v1/candidates`
- **Role Required:** `ROLE_HR`, `ROLE_ADMIN`
- **Request Body:**
  ```json
  {
    "firstName": "Alex",
    "lastName": "Mercer",
    "email": "alex.mercer@gmail.com",
    "phoneNumber": "+1-555-0144",
    "currentTitle": "Senior Backend Engineer",
    "currentCompany": "Stripe",
    "experienceYears": 7,
    "skills": ["Java", "Spring Boot", "Distributed Systems"],
    "notes": "Strong background in payment systems."
  }
  ```
- **Response Body (201 Created):** Created candidate object.
- **Errors:** `409 Conflict` (Email already exists).

#### 4.2 List Candidates (Filtered & Paginated)
- **Endpoint:** `GET /api/v1/candidates?page=0&size=20&skill=Java&search=Mercer`
- **Role Required:** `ROLE_HR`, `ROLE_ADMIN`, `ROLE_HIRING_MANAGER`
- **Response Body (200 OK):** Paginated candidates.

#### 4.3 Get Candidate Details
- **Endpoint:** `GET /api/v1/candidates/{id}`
- **Role Required:** `ROLE_HR`, `ROLE_ADMIN`, `ROLE_HIRING_MANAGER`, or Assigned `ROLE_INTERVIEWER`
- **Response Body (200 OK):** Full candidate profile including resume download link and active applications.

#### 4.4 Upload Resume File
- **Endpoint:** `POST /api/v1/candidates/{id}/resume`
- **Role Required:** `ROLE_HR`, `ROLE_ADMIN`
- **Content-Type:** `multipart/form-data`
- **Form Data:** `file` (PDF, DOC, DOCX up to 10MB)
- **Response Body (200 OK):** Stored file metadata (`fileId`, `fileName`, `fileSize`, `uploadedAt`).

---

### 5. Job Opening Endpoints (`/api/v1/jobs`)

#### 5.1 Create Job Requisition
- **Endpoint:** `POST /api/v1/jobs`
- **Role Required:** `ROLE_HR`, `ROLE_ADMIN`
- **Request Body:**
  ```json
  {
    "title": "Lead Platform Engineer",
    "department": "Infrastructure",
    "location": "San Francisco, CA",
    "employmentType": "FULL_TIME",
    "description": "Architect core distributed systems...",
    "requirements": ["Java 21", "Kubernetes", "High Concurrency"],
    "targetHeadcount": 2,
    "hiringManagerId": "6550...10",
    "rounds": [
      {
        "roundIndex": 1,
        "name": "HR Phone Screen",
        "type": "BEHAVIORAL",
        "durationMinutes": 45,
        "instructions": "Evaluate communication and values.",
        "parameters": [
          { "name": "Communication", "weight": 1.0 },
          { "name": "Culture Fit", "weight": 1.0 }
        ]
      },
      {
        "roundIndex": 2,
        "name": "System Architecture",
        "type": "TECHNICAL",
        "durationMinutes": 60,
        "instructions": "Evaluate distributed architecture and concurrency.",
        "parameters": [
          { "name": "Distributed Systems", "weight": 1.5 },
          { "name": "Concurrency Control", "weight": 1.5 }
        ]
      }
    ]
  }
  ```
- **Response Body (201 Created):** Created Job object.

#### 5.2 List Jobs
- **Endpoint:** `GET /api/v1/jobs?status=ACTIVE&department=Infrastructure`
- **Role Required:** `ROLE_HR`, `ROLE_ADMIN`, `ROLE_HIRING_MANAGER`
- **Response Body (200 OK):** List of jobs with applicant counts.

#### 5.3 Update Job Status
- **Endpoint:** `PATCH /api/v1/jobs/{id}/status`
- **Role Required:** `ROLE_HR`, `ROLE_ADMIN`
- **Request Body:** `{ "status": "CLOSED" }`

---

### 6. Application Management Endpoints (`/api/v1/applications`)

#### 6.1 Create Job Application
- **Endpoint:** `POST /api/v1/applications`
- **Role Required:** `ROLE_HR`, `ROLE_ADMIN`
- **Request Body:**
  ```json
  {
    "candidateId": "6550...02",
    "jobId": "6550...03"
  }
  ```
- **Response Body (201 Created):** Initialized application in stage `APPLIED`.
- **Errors:** `409 Conflict` (Candidate already has an active application for this job).

#### 6.2 Advance / Update Application Stage
- **Endpoint:** `PATCH /api/v1/applications/{id}/stage`
- **Role Required:** `ROLE_HR`, `ROLE_ADMIN`, `ROLE_HIRING_MANAGER`
- **Request Body:**
  ```json
  {
    "newStage": "SHORTLISTED",
    "comment": "Screening passed. Approved for technical panel."
  }
  ```
- **Response Body (200 OK):** Updated application with appended stage transition history.
- **Errors:** `400 Bad Request` (Invalid state transition).

#### 6.3 Get Pipeline Board View
- **Endpoint:** `GET /api/v1/applications/pipeline?jobId=6550...03`
- **Role Required:** `ROLE_HR`, `ROLE_ADMIN`, `ROLE_HIRING_MANAGER`
- **Response Body (200 OK):** Applications grouped by the 12 recruitment pipeline stages.

---

### 7. Interview Scheduling Endpoints (`/api/v1/interviews`)

#### 7.1 Schedule Interview
- **Endpoint:** `POST /api/v1/interviews`
- **Role Required:** `ROLE_HR`, `ROLE_ADMIN`
- **Request Body:**
  ```json
  {
    "applicationId": "6550...04",
    "roundIndex": 2,
    "scheduledStart": "2026-11-25T15:00:00Z",
    "scheduledEnd": "2026-11-25T16:00:00Z",
    "mode": "ONLINE",
    "meetingDetails": {
      "meetingUrl": "https://meet.google.com/xyz-uvwx-rst",
      "instructions": "Webcam required, bring your favorite IDE."
    },
    "interviewerIds": ["6550...11", "6550...12"]
  }
  ```
- **Validation:** `scheduledEnd` must be after `scheduledStart`. Interviewers must have no overlapping bookings.
- **Response Body (201 Created):** Scheduled interview object.
- **Errors:** `409 Conflict` (Interviewer double-booking detected).

#### 7.2 Check Interviewer Availability
- **Endpoint:** `GET /api/v1/interviews/availability?interviewerIds=6550...11,6550...12&date=2026-11-25`
- **Role Required:** `ROLE_HR`, `ROLE_ADMIN`
- **Response Body (200 OK):** Busy time windows and open available slots for the requested interviewers on that date.

#### 7.3 Reschedule Interview
- **Endpoint:** `PATCH /api/v1/interviews/{id}/reschedule`
- **Role Required:** `ROLE_HR`, `ROLE_ADMIN`
- **Request Body:**
  ```json
  {
    "newScheduledStart": "2026-11-26T14:00:00Z",
    "newScheduledEnd": "2026-11-26T15:00:00Z",
    "reason": "Candidate requested alternative time due to conflict."
  }
  ```
- **Response Body (200 OK):** Rescheduled interview with preserved history.

#### 7.4 Cancel Interview
- **Endpoint:** `PATCH /api/v1/interviews/{id}/cancel`
- **Role Required:** `ROLE_HR`, `ROLE_ADMIN`
- **Request Body:** `{ "reason": "Position filled or candidate withdrew." }`
- **Response Body (200 OK):** Updated interview status `CANCELLED`.

---

### 8. Interview Feedback & Scorecards (`/api/v1/interviews/{id}/feedback`)

#### 8.1 Submit Interview Scorecard
- **Endpoint:** `POST /api/v1/interviews/{id}/feedback`
- **Role Required:** Assigned `ROLE_INTERVIEWER`
- **Request Body:**
  ```json
  {
    "recommendation": "STRONG_HIRE",
    "parameterRatings": [
      { "parameterName": "Distributed Systems", "score": 5, "comments": "Deep knowledge." },
      { "parameterName": "Concurrency Control", "score": 4, "comments": "Solid understanding." }
    ],
    "strengths": "Demonstrated deep systems architecture expertise and clean coding.",
    "weaknesses": "Could communicate tradeoffs slightly more succinctly.",
    "detailedNotes": "One of the strongest technical candidates this quarter."
  }
  ```
- **Response Body (201 Created):** Saved scorecard.
- **Errors:** `409 Conflict` (Feedback already submitted for this interview), `403 Forbidden` (User not assigned to this interview).

#### 8.2 Get Interview Feedback (Blind Enforced)
- **Endpoint:** `GET /api/v1/interviews/{id}/feedback`
- **Role Required:** `ROLE_HR`, `ROLE_HIRING_MANAGER`, `ROLE_ADMIN`, or Assigned `ROLE_INTERVIEWER`
- **Blind Privacy Behavior:**
  - If requested by an `INTERVIEWER` who has **not** submitted feedback, the API returns an empty array `[]` (redacting peer scores).
  - If requested by an `INTERVIEWER` who **has** submitted feedback, or by `HR`/`HIRING_MANAGER`/`ADMIN`, all submitted scorecards are returned.

---

### 9. Notifications Endpoints (`/api/v1/notifications`)

#### 9.1 Get User Notifications
- **Endpoint:** `GET /api/v1/notifications?unreadOnly=true&page=0&size=20`
- **Role Required:** Authenticated
- **Response Body (200 OK):** List of notifications with unread count.

#### 9.2 Mark as Read
- **Endpoint:** `PATCH /api/v1/notifications/{id}/read`
- **Role Required:** Authenticated (Owner)
- **Response Body (200 OK):** `{ "success": true }`

#### 9.3 Mark All as Read
- **Endpoint:** `PATCH /api/v1/notifications/read-all`
- **Role Required:** Authenticated
- **Response Body (200 OK):** `{ "success": true }`

---

### 10. Analytics Endpoints (`/api/v1/analytics`)

#### 10.1 Role-Specific Dashboard Metrics
- **Endpoint:** `GET /api/v1/analytics/dashboard`
- **Role Required:** Authenticated
- **Response Body (200 OK):** Dynamically computed KPI metrics based on caller role:
  - **Admin:** Total users, active accounts, system activity.
  - **HR:** Active jobs, total candidates, scheduled interviews today, pending feedback count.
  - **Interviewer:** Today's interviews, upcoming interviews count, pending scorecards to fill.
  - **Hiring Manager:** Active requisitions, candidates in pipeline, pending hiring approvals.

#### 10.2 Recruitment Funnel & Conversion Analytics
- **Endpoint:** `GET /api/v1/analytics/pipeline?jobId=...`
- **Role Required:** `ROLE_HR`, `ROLE_ADMIN`, `ROLE_HIRING_MANAGER`
- **Response Body (200 OK):** Candidate count per stage, conversion percentage, stage drop-offs.

#### 10.3 Interviewer Workload & Balance Metrics
- **Endpoint:** `GET /api/v1/analytics/interviewers`
- **Role Required:** `ROLE_HR`, `ROLE_ADMIN`, `ROLE_HIRING_MANAGER`
- **Response Body (200 OK):** Interviewer load distribution (interviews conducted this week/month, average scorecard submission delay).
