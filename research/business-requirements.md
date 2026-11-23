# Phase 1: Research & Development (R&D)
## Document 03: Comprehensive Business Requirements Specification (BRS)

**Project:** Enterprise Interview Management System (IMS)  
**Author:** Senior Product Analyst & Software Architect  
**Date:** November 2026  
**Status:** Approved Business Requirements Document  

---

### 1. Purpose & Scope

The purpose of the **Interview Management System (IMS)** is to automate, streamline, and govern the entire interview lifecycle for modern organizations. The system acts as the centralized source of truth for recruiters, hiring managers, interviewers, and candidates, eliminating coordination delays, interview scheduling conflicts, biased feedback loops, and communication gaps.

---

### 2. Stakeholders & User Roles

The system strictly enforces five distinct user roles. Each role is isolated by backend authorization rules and provided with a tailored user interface:

```
                  ┌───────────────────────────────────────────────┐
                  │                 ADMINISTRATOR                 │
                  │   System Governance, User Provisioning, Logs  │
                  └───────────────────────┬───────────────────────┘
                                          │
                  ┌───────────────────────┴───────────────────────┐
                  │                    HR / RECRUITER             │
                  │ Candidates, Jobs, Pipeline, Scheduling, Offers│
                  └──────┬─────────────────────────────────┬──────┘
                         │                                 │
        ┌────────────────┴──────────────┐   ┌──────────────┴────────────────┐
        │        HIRING MANAGER         │   │          INTERVIEWER          │
        │ Requisitions, Approvals, Team │   │ Conduct Interviews, Submit    │
        │ Workload & Funnel Analytics   │   │ Blind Scorecards, Set Avail.  │
        └───────────────────────────────┘   └───────────────────────────────┘
                                          │
                  ┌───────────────────────┴───────────────────────┐
                  │                   CANDIDATE                   │
                  │ View Invites, Confirm/Reschedule, Track Status│
                  └───────────────────────────────────────────────┘
```

#### 2.1 Role 1: Administrator (`ROLE_ADMIN`)
* **Primary Objective:** Ensure platform health, governance, user provisioning, and organizational setup.
* **Responsibilities & Permissions:**
  1. **User Provisioning:** Create user accounts for HR, Interviewers, and Hiring Managers with auto-generated or specified temporary passwords.
  2. **Account Lifecycle:** Activate, deactivate, edit, or unlock user accounts.
  3. **Role & Permission Management:** Assign and modify user roles.
  4. **System Configuration:** Manage organizational departments (Engineering, Product, Marketing, Sales, HR, etc.), interview round categories, and evaluation templates.
  5. **Audit Logging & Governance:** Access centralized audit logs detailing actor, action, timestamp, IP, and entity modifications.
  6. **Executive Analytics:** High-level platform metrics: total users, active accounts, system activity frequency.
* **Constraints:** Admin cannot submit interview scorecards on behalf of interviewers or silently alter candidate evaluations.

#### 2.2 Role 2: HR / Recruiter (`ROLE_HR`)
* **Primary Objective:** Execute end-to-end recruitment operations, candidate tracking, scheduling, and pipeline progression.
* **Responsibilities & Permissions:**
  1. **Candidate Management:** Create and update candidate profiles, upload resumes (PDF/DOCX), parse metadata, and inspect application histories.
  2. **Job Management:** Create, update, publish, pause, or close job openings. Define interview round sequences per job.
  3. **Application Association:** Link candidates to job openings, instantiating new recruitment applications.
  4. **Interview Scheduling:**
     - Select round, date, start time, end time, and interview mode (Online with URL, Offline with Room/Location, or Phone).
     - Assign one or multiple interviewers.
     - Real-time conflict inspection to ensure interviewers are not double-booked.
     - Reschedule or cancel interviews with mandatory reason tracking.
  5. **Pipeline Governance:** Advance candidates across stages, place applications on hold, release offers, or reject candidates.
  6. **Scorecard Review:** Review submitted scorecards and synthesize feedback for hiring managers.
  7. **Recruitment Analytics:** Track stage velocity, candidate volume, conversion ratios, and time-to-hire.

#### 2.3 Role 3: Interviewer (`ROLE_INTERVIEWER`)
* **Primary Objective:** Conduct objective, structured candidate evaluations and submit timely scorecards.
* **Responsibilities & Permissions:**
  1. **Schedule Visibility:** View assigned upcoming, today's, and past interviews with candidate resumes and round guidelines.
  2. **Assignment Acceptance:** Accept or decline interview assignments with note capabilities.
  3. **Availability Management:** Set weekly recurring availability windows or specific date-based free/busy blocks.
  4. **Scorecard Submission:**
     - Evaluate candidates on round-specific parameters on a 1-to-5 scale (1 = Unsatisfactory, 2 = Below Expectations, 3 = Meets Expectations, 4 = Exceeds Expectations, 5 = Exceptional).
     - Document structured qualitative feedback: Key Strengths, Areas for Development / Weaknesses, and Detailed Notes.
     - Provide a definitive recommendation: `STRONG_HIRE`, `HIRE`, `HOLD`, `REJECT`, `NEXT_ROUND`.
  5. **Interview History:** Access personal history of past conducted interviews and evaluations.
* **Constraints & Privacy:**
  - **Blind Submission:** Cannot see other panel members' evaluations for a candidate until their own scorecard is submitted.
  - Cannot alter candidate application stages directly (only submit recommendations).
  - No access to confidential compensation data, internal HR offer calculations, or candidates assigned to other interviewers.

#### 2.4 Role 4: Hiring Manager (`ROLE_HIRING_MANAGER`)
* **Primary Objective:** Supervise hiring for their department, approve stage progressions, and review aggregate panel feedback.
* **Responsibilities & Permissions:**
  1. **Pipeline Oversight:** Monitor candidate progression across all requisitions owned by their department.
  2. **Feedback Synthesis:** Access combined scorecard debriefs, comparing panel ratings, qualitative notes, and recommendations.
  3. **Stage Progression Approvals:** Approve or reject hiring recommendations (e.g., advancing to Final Round or Offer Release).
  4. **Team Workload Analytics:** Monitor interviewer participation, fatigue metrics, and turnaround times across engineering/product staff.

#### 2.5 Role 5: Candidate (`ROLE_CANDIDATE`)
* **Primary Objective:** Provide candidates with a professional, transparent, and frictionless interview experience.
* **Responsibilities & Permissions:**
  1. **Invitation & Schedule Review:** View scheduled interview date, time (in candidate's local timezone), mode, meeting link, and preparation instructions.
  2. **Reschedule / Confirmation Requests:** Confirm attendance or submit an interview reschedule request with preferred time alternatives.
  3. **Profile Management:** Update personal contact details and view application status where enabled.
* **Strict Privacy Guard:** Candidates must **never** access internal scorecards, interviewer notes, reviewer ratings, or internal hiring discussions.

---

### 3. Recruitment Pipeline State Machine

Every candidate application follows a deterministic, audited lifecycle:

```
[APPLIED] 
    │
    ▼
[SCREENING] ───────────────► [REJECTED]
    │
    ▼
[SHORTLISTED] ─────────────► [REJECTED]
    │
    ▼
[INTERVIEW_SCHEDULED] ◄───┐
    │                     │ (Next Round)
    ▼                     │
[INTERVIEW_IN_PROGRESS]   │
    │                     │
    ▼                     │
[FEEDBACK_PENDING]        │
    │                     │
    ▼                     │
[ROUND_COMPLETED] ────────┘
    │
    ├──────────────────────► [ON_HOLD]
    ├──────────────────────► [REJECTED]
    │
    ▼
[SELECTED]
    │
    ▼
[OFFER_RELEASED] ──────────► [REJECTED] / [OFFER_DECLINED]
    │
    ▼
[HIRED]
```

#### Stage Transition Rules
1. **Application Creation:** Automatically enters `APPLIED`.
2. **HR Screening:** Recruiter reviews resume -> moves to `SCREENING` or `REJECTED`.
3. **Shortlisting:** Candidate approved for interview rounds -> moves to `SHORTLISTED`.
4. **Interview Booking:** Scheduling Round 1 transitions application to `INTERVIEW_SCHEDULED`.
5. **Interview Execution:** System/HR marks interview as initiated -> `INTERVIEW_IN_PROGRESS`.
6. **Post-Interview:** Once interview end time passes, application enters `FEEDBACK_PENDING` until all assigned interviewers submit scorecards.
7. **Round Completion:** When scorecards are in, application reaches `ROUND_COMPLETED`.
8. **Advancement Decision:**
   - Advance to subsequent round: Application returns to `INTERVIEW_SCHEDULED` for Round N+1.
   - Manager decision: Advance to `SELECTED`, place `ON_HOLD`, or mark `REJECTED`.
9. **Finalization:** `SELECTED` leads to `OFFER_RELEASED`, concluding with `HIRED`.
10. **Audit Log:** Every transition records `previousStage`, `newStage`, `changedByUserId`, `timestamp`, and `comment`.

---

### 4. Detailed Functional Requirements

#### FR-01: User Provisioning & Authentication
- Support secure authentication via JSON Web Tokens (access token + refresh token).
- Passwords must be hashed using BCrypt (work factor 12).
- When Admin creates an account, `requiresPasswordChange` is set to `true`.
- On first login, the user must be redirected to change their temporary password; all other endpoints reject requests with `403 FORBIDDEN (PASSWORD_CHANGE_REQUIRED)`.

#### FR-02: Candidate Management & Deduplication
- Mandatory fields: First Name, Last Name, Email, Phone, Skills (Array), Experience (Years), Resume URL/Metadata.
- System must enforce uniqueness on candidate email to prevent duplicate candidate records.
- If a recruiter creates a candidate whose email matches an existing record, the system prompts: "Candidate already exists. Would you like to create a new application for this candidate?"

#### FR-03: Job Opening & Pipeline Specification
- Jobs specify: Title, Department, Location, Employment Type (Full-time, Part-time, Contract), Description, Requirements, Target Headcount, Status (DRAFT, ACTIVE, PAUSED, CLOSED).
- Configurable Interview Rounds: Each job contains an ordered list of rounds:
  - Sequence Index (1, 2, 3...)
  - Round Name (e.g., "HR Screening", "Technical Coding", "System Architecture", "Leadership & Values")
  - Round Description & Interviewer Instructions
  - Evaluation Parameters (e.g., "Problem Solving", "Coding Rigor", "Architectural Depth", "Communication")

#### FR-04: Interview Scheduling & Concurrency Safety
- An interview must specify: Application ID, Round ID, Scheduled Start (UTC), Scheduled End (UTC), Mode (ONLINE, OFFLINE, TELEPHONIC), Meeting Link / Room Info, and Assigned Interviewer IDs.
- **Availability Pre-Check:** The system queries existing active interviews for the requested interviewers within `[Start, End]`.
- **Atomic Concurrency Guard:** The database schema enforces that no interviewer can be booked in overlapping time intervals. If two coordinators schedule the same interviewer at the exact same instant, one succeeds and the other fails with `409 CONFLICT: Interviewer has an overlapping schedule`.
- Both start and end times must be stored in UTC format (ISO 8601). Frontend displays them converted to the user's localized browser timezone.

#### FR-05: Structured Scorecard & Blind Evaluation
- Each assigned interviewer submits one scorecard per interview.
- Mandatory fields:
  - Overall Recommendation: `STRONG_HIRE`, `HIRE`, `HOLD`, `REJECT`, `NEXT_ROUND`.
  - Parameter Ratings: Array of `{ parameterName: String, score: Integer (1-5), comments: String }`.
  - Strengths: Text (minimum 20 characters).
  - Weaknesses: Text (minimum 20 characters).
  - General Notes: Markdown text.
- **Blind Submission Rule:** When an interviewer requests `GET /api/v1/interviews/{id}/feedback`, the backend checks if the requester has submitted their feedback. If not, only their own draft/empty feedback is returned; peers' scorecards are redacted.
- **Immutability:** Once submitted, a scorecard cannot be edited or deleted without explicit Admin authorization.

#### FR-06: Notifications & Communication
- Asynchronous notifications generated for:
  - Interview Scheduled -> Candidate, Interviewer, HR.
  - Interview Rescheduled / Cancelled -> Candidate, Interviewer, HR.
  - Scorecard Pending Reminder -> Interviewer (sent after interview completion).
  - Scorecard Submitted -> HR, Hiring Manager.
  - Application Status Changed -> Candidate (where external notifications enabled).

#### FR-07: Dashboards & Reporting
- Dashboards customized per role:
  - **Admin:** User statistics, system logs, role distribution.
  - **HR:** Today's interviews, upcoming interviews, active jobs, candidate pipeline counts, pending feedback count.
  - **Interviewer:** My upcoming interviews, today's schedule, pending scorecards to fill, availability settings.
  - **Hiring Manager:** Requisition progress, department candidate funnel, interviewer workload balance.
  - **Candidate:** My upcoming interviews, meeting links, instructions, confirmation button.

---

### 5. Non-Functional Requirements (NFR)

| ID | Category | Requirement Specification |
| :--- | :--- | :--- |
| **NFR-01** | **Performance** | API response time for standard CRUD operations must be < 150ms at p95 under standard load. |
| **NFR-02** | **Concurrency** | The scheduling engine must handle concurrent booking attempts without data corruption or double-booking. |
| **NFR-03** | **Security** | Zero-trust backend authorization (`@PreAuthorize`); HTTPS in transit; BCrypt password hashing; JWT HMAC-SHA256 / RSA. |
| **NFR-04** | **Data Isolation** | Strict candidate privacy: interviewers cannot view salary or other candidates; candidates cannot view scorecards. |
| **NFR-05** | **Scalability** | Stateless Spring Boot backend instances allowing horizontal scaling; MongoDB sharding/indexing readiness. |
| **NFR-06** | **Reliability** | Database indexes designed to prevent full-collection scans; graceful exception handling with standardized API errors. |
| **NFR-07** | **Auditability** | All state changes (user status, candidate stage, interview status) produce persistent, timestamped audit records. |
| **NFR-08** | **Responsiveness** | Next.js frontend fully responsive across desktop (1920x1080), laptop (1366x768), and tablet/mobile views. |
