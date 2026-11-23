# Enterprise Interview Management System (IMS)
## Complete 12-Sprint Implementation Roadmap

**Document:** `docs/implementation-plan.md`  
**Status:** Approved Architectural Specification  
**Version:** 1.0.0 (Execution Roadmap)  
**Date:** November 2026  

---

### 1. Roadmap Architecture & Execution Philosophy

The development is partitioned into 12 logically sequenced sprints. Each sprint delivers a complete, testable, end-to-end slice of functionality encompassing Backend (Spring Boot 3.x), Database (MongoDB), and Frontend (Next.js App Router).

```
[Sprint 1: Architecture & Scaffolding]
       │
       ▼
[Sprint 2: Authentication & Authorization (JWT + First-Login Guard)]
       │
       ▼
[Sprint 3: User Management & Role Profiles]
       │
       ▼
[Sprint 4: Candidate & Job Management (Resume Upload & Deduplication)]
       │
       ▼
[Sprint 5: Application & 12-Stage Recruitment Pipeline]
       │
       ▼
[Sprint 6: Interview Scheduling & Multi-Interviewer Assignment]
       │
       ▼
[Sprint 7: Interviewer Availability & Atomic Conflict Guard]
       │
       ▼
[Sprint 8: Blind Scorecards & Evaluation Workflow]
       │
       ▼
[Sprint 9: Notifications & Reminders Engine]
       │
       ▼
[Sprint 10: Role-Specific Dashboards & Analytics Visualizers]
       │
       ▼
[Sprint 11: End-to-End Testing, Security Hardening & Concurrency Verification]
       │
       ▼
[Sprint 12: Dockerization, CI/CD Readiness & Deployment]
```

---

### 2. Sprint-by-Sprint Specifications

---

#### Sprint 1: Project Setup, Scaffolding & Base Architecture
- **Objectives:** Establish clean multi-module project structure for Spring Boot 3.x backend and Next.js frontend with Tailwind CSS and Shadcn UI.
- **Backend Tasks:**
  - Initialize Spring Boot 3.x project (`pom.xml`) with Java 21, Spring Web, Spring Data MongoDB, Spring Security, Validation, Lombok, MapStruct, Springdoc OpenAPI.
  - Configure MongoDB connection settings (`application.yml`), connection pooling, and auditing (`@EnableMongoAuditing`).
  - Create standard response envelope `ApiResponse<T>`, `ApiErrorResponse`, and `@RestControllerAdvice` global exception handler.
- **Frontend Tasks:**
  - Initialize Next.js 14/15 App Router project with TypeScript, Tailwind CSS, and Shadcn UI primitives.
  - Set up TanStack Query v5 provider, Axios client with interceptors, and Zustand session store.
- **Acceptance Criteria:** Backend health endpoint (`/actuator/health`) returns `UP`; Next.js renders responsive landing shell; API client communicates successfully.

---

#### Sprint 2: Authentication & Authorization (JWT + First-Login Guard)
- **Objectives:** Implement secure stateless authentication, BCrypt password hashing, JWT access/refresh token rotation, and first-login mandatory password change.
- **Backend Tasks:**
  - Build `User` entity, `UserRepository`, and `PasswordEncoder` bean (BCrypt strength 12).
  - Implement `JwtService` (token signing, claim parsing) and `JwtAuthenticationFilter`.
  - Implement `AuthController`: `POST /api/v1/auth/login`, `POST /api/v1/auth/refresh`, `POST /api/v1/auth/change-password`, `GET /api/v1/auth/me`.
  - Add security interceptor enforcing `requiresPasswordChange == true` blocks all non-auth endpoints.
- **Frontend Tasks:**
  - Build Login Page (`/(auth)/login`) with React Hook Form and Zod validation.
  - Build Mandatory Password Change Modal/Page (`/(auth)/change-password`).
  - Configure token storage, refresh interceptor in Axios, and route protection guards.
- **Acceptance Criteria:** User can log in, receives JWT; first-login user is blocked until password is changed; refreshed token works seamlessly.

---

#### Sprint 3: User Management & Role Profiles
- **Objectives:** Enable Admin to provision accounts, manage roles, and list interviewers.
- **Backend Tasks:**
  - Build `UserService` and `UserController` with `@PreAuthorize("hasRole('ADMIN')")`.
  - Endpoints: `POST /api/v1/users`, `GET /api/v1/users`, `GET /api/v1/users/{id}`, `PUT /api/v1/users/{id}`, `PATCH /api/v1/users/{id}/status`, `GET /api/v1/users/interviewers`.
  - Audit log recording of user creation and status changes.
- **Frontend Tasks:**
  - Build Admin Users Table with pagination, search, role filters, and status badges.
  - Build User Provisioning Dialog with auto-generated temporary password display.
- **Acceptance Criteria:** Admin can create HR, Interviewer, and Hiring Manager accounts; users appear in paginated lists; deactivation immediately revokes access.

---

#### Sprint 4: Candidate & Job Management
- **Objectives:** Candidate profile management with PDF resume upload, unique email deduplication, and job openings with configurable interview rounds.
- **Backend Tasks:**
  - Build `Candidate` and `Job` entities with validation.
  - Implement resume file storage service (local filesystem / S3-ready) with MIME and size verification.
  - Endpoints: `POST /api/v1/candidates`, `GET /api/v1/candidates`, `POST /api/v1/candidates/{id}/resume`, `POST /api/v1/jobs`, `GET /api/v1/jobs`.
- **Frontend Tasks:**
  - Build Candidates Table with resume download link and drawer details.
  - Build Add Candidate Form with drag-and-drop PDF resume uploader.
  - Build Job Creation Form with dynamic round configuration (round name, duration, rubric parameters).
- **Acceptance Criteria:** Duplicate email creation returns `409 Conflict`; resume uploads validate file type and size; jobs correctly store ordered round definitions.

---

#### Sprint 5: Application Management & 12-Stage Recruitment Pipeline
- **Objectives:** Link candidates to jobs; manage the 12-stage recruitment state machine with full transition audit history.
- **Backend Tasks:**
  - Build `Application` entity linking `candidateId`, `jobId`, `currentStage`, and `stageHistory`.
  - Implement state transition validation service enforcing allowable next stages.
  - Endpoints: `POST /api/v1/applications`, `GET /api/v1/applications`, `PATCH /api/v1/applications/{id}/stage`, `GET /api/v1/applications/pipeline`.
- **Frontend Tasks:**
  - Build 12-Stage Recruitment Pipeline Kanban Board with candidate cards.
  - Build Stage Advancement Modal capturing transition comments.
- **Acceptance Criteria:** Candidate cannot be associated with the same job twice; invalid stage transitions are rejected; stage history accurately records timestamps and actor IDs.

---

#### Sprint 6: Interview Scheduling & Multi-Interviewer Assignment
- **Objectives:** Schedule single and multi-interviewer interviews, assign rounds, configure meeting links, and normalize timezones.
- **Backend Tasks:**
  - Build `Interview` entity and repository.
  - Endpoints: `POST /api/v1/interviews`, `GET /api/v1/interviews`, `GET /api/v1/interviews/{id}`, `PATCH /api/v1/interviews/{id}/reschedule`, `PATCH /api/v1/interviews/{id}/cancel`.
  - Update `Application.currentStage` to `INTERVIEW_SCHEDULED`.
- **Frontend Tasks:**
  - Build Schedule Interview Wizard modal (Candidate, Round, Date/Time, Mode, Meeting URL, Interviewers).
  - Build Interview List and Calendar view.
- **Acceptance Criteria:** Interviews store UTC timestamps; frontend displays converted local time; rescheduling and cancellation preserve original audit records.

---

#### Sprint 7: Interviewer Availability & Atomic Conflict Guard
- **Objectives:** Prevent double-booking with atomic MongoDB queries and manage interviewer availability calendars.
- **Backend Tasks:**
  - Build `InterviewerAvailability` entity and repository.
  - Implement `ConcurrencyGuard`: atomic verification and unique slot reservation preventing overlapping interviews for any assigned interviewer.
  - Endpoints: `GET /api/v1/interviews/availability`, `PUT /api/v1/availability/my-slots`.
- **Frontend Tasks:**
  - Build Interviewer Availability Settings UI (weekly working hours, blackout dates).
  - Build Conflict Indicator in Schedule Wizard (visual warning when an interviewer is busy).
- **Acceptance Criteria:** Concurrent scheduling requests for the same interviewer at overlapping times guarantee that one succeeds and the other receives `409 Conflict`.

---

#### Sprint 8: Blind Scorecards & Evaluation Workflow
- **Objectives:** Enable interviewers to submit structured scorecards with strict blind privacy enforcement.
- **Backend Tasks:**
  - Build `InterviewFeedback` entity with parameter ratings, strengths, weaknesses, and recommendations.
  - Service logic enforcing blind submission: redacting other panelists' evaluations until the requesting interviewer submits their own.
  - Endpoints: `POST /api/v1/interviews/{id}/feedback`, `GET /api/v1/interviews/{id}/feedback`.
  - Update application to `FEEDBACK_PENDING` / `ROUND_COMPLETED`.
- **Frontend Tasks:**
  - Build Blind Scorecard Form with rubric parameter scoring (1-5), strengths, weaknesses, and recommendation tags.
  - Build Consensus Debrief View for HR and Hiring Managers aggregating all panel scorecards.
- **Acceptance Criteria:** Interviewer cannot see peer evaluations before submitting; scorecard becomes immutable upon submission; HR sees combined debrief view.

---

#### Sprint 9: Notifications & Reminders Engine
- **Objectives:** Dispatch asynchronous in-app alerts and simulated email notifications on scheduling events, cancellations, and overdue scorecards.
- **Backend Tasks:**
  - Build `Notification` entity and `AsyncNotificationDispatcher` using Spring `@Async`.
  - Endpoints: `GET /api/v1/notifications`, `PATCH /api/v1/notifications/{id}/read`, `PATCH /api/v1/notifications/read-all`.
  - Scheduled cron task flagging scorecards pending > 24 hours.
- **Frontend Tasks:**
  - Build Notification Bell in TopNav with live unread badge and dropdown preview.
  - Build Notifications Drawer/Page with mark-as-read actions.
- **Acceptance Criteria:** Scheduling an interview immediately generates in-app notifications for the candidate and all interviewers; overdue scorecards trigger reminder flags.

---

#### Sprint 10: Role-Specific Dashboards & Analytics Visualizers
- **Objectives:** Deliver dedicated dashboards for Admin, HR, Interviewer, Hiring Manager, and Candidate with interactive Recharts.
- **Backend Tasks:**
  - Build `AnalyticsService` with MongoDB aggregation pipelines: recruitment funnel conversion, time-to-hire, interviewer workload counts, scorecard turnaround averages.
  - Endpoints: `GET /api/v1/analytics/dashboard`, `GET /api/v1/analytics/pipeline`, `GET /api/v1/analytics/interviewers`.
- **Frontend Tasks:**
  - Implement `/admin` dashboard (system metrics, user counts, activity log).
  - Implement `/hr` dashboard (today's schedule, pipeline velocity, overdue feedback).
  - Implement `/interviewer` dashboard (my interviews, pending scorecards, my availability).
  - Implement `/hiring-manager` dashboard (requisitions, pending approvals, interviewer fatigue chart).
  - Implement `/candidate` portal (my invitation, meeting link, reschedule dialog).
- **Acceptance Criteria:** Each role accesses only their authorized dashboard; charts render smoothly; analytics accurately reflect database state.

---

#### Sprint 11: End-to-End Testing, Security Hardening & Concurrency Verification
- **Objectives:** Comprehensive automated test coverage, security verification, and high-concurrency race condition testing.
- **Backend Tasks:**
  - JUnit 5 & Mockito unit tests for all domain services.
  - Spring Boot MockMvc integration tests for authentication, RBAC method security, and candidate workflows.
  - Multi-threaded concurrency test proving double-booking prevention under simultaneous requests.
- **Frontend Tasks:**
  - Form validation tests, authentication state recovery tests, and error boundary verification.
- **Acceptance Criteria:** 16 critical test scenarios pass; zero unauthorized data leakage; concurrency tests pass with zero double bookings.

---

#### Sprint 12: Dockerization, CI/CD Readiness & Deployment
- **Objectives:** Package the entire system into production-ready Docker containers with Docker Compose, environment configuration, and deployment documentation.
- **Tasks:**
  - Multi-stage Dockerfile for Spring Boot backend (Eclipse Temurin JDK 21 Alpine).
  - Multi-stage Dockerfile for Next.js frontend (Node 20 Alpine, standalone build).
  - `docker-compose.yml` orchestrating MongoDB 7, Backend, and Frontend with health checks.
  - Comprehensive `README.md` and `docs/deployment-guide.md`.
- **Acceptance Criteria:** Running `docker compose up --build` brings up the complete system; all health checks pass; end-to-end functionality operates flawlessly out-of-the-box.
