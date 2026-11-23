# Enterprise Interview Management System (IMS)
## System Architecture Specification

**Document:** `docs/architecture.md`  
**Status:** Approved Architectural Specification  
**Version:** 1.0.0 (Production Blueprint)  
**Date:** November 2026  

---

### 1. Architectural Philosophy & Overview

The **Interview Management System (IMS)** is architected as a **modular monolith** optimized for enterprise stability, rapid operational iteration, strict role-based data security, and high developer velocity.

A modular monolith provides distinct, cleanly encapsulated domain boundaries within a single deployable artifact. This eliminates the operational latency, distributed transaction complexity, and network serialization overhead of microservices, while maintaining strict domain separation so modules can be decoupled into independent microservices if organizational scale demands it in the future.

```
┌────────────────────────────────────────────────────────────────────────┐
│                        NEXT.JS 14/15 APP ROUTER                        │
│   /admin        /hr        /interviewer    /hiring-manager   /candidate│
│   (Shadcn UI • Tailwind CSS • TanStack Query • React Hook Form + Zod)  │
└───────────────────────────────────┬────────────────────────────────────┘
                                    │ HTTPS (JSON / REST API)
                                    │ Bearer JWT (Access & Refresh)
┌───────────────────────────────────▼────────────────────────────────────┘
│                   SPRING BOOT 3.x REST CONTROLLERS                     │
│      AuthController | UserController | CandidateController             │
│      JobController  | ApplicationCtrl | InterviewController            │
│      FeedbackCtrl   | NotificationCtrl| AnalyticsController            │
└───────────────────────────────────┬────────────────────────────────────┘
                                    │ DTOs / Method Security (@PreAuthorize)
┌───────────────────────────────────▼────────────────────────────────────┘
│                         DOMAIN SERVICE LAYER                           │
│  - AuthenticationService           - InterviewSchedulingService        │
│  - UserService & ProfileManager    - ConcurrencyGuard & SlotManager    │
│  - CandidateManagementService      - BlindScorecardService             │
│  - JobPipelineService              - AsyncNotificationDispatcher       │
│  - ApplicationStateMachine         - AuditLoggingAspect & Service      │
└───────────────────────────────────┬────────────────────────────────────┘
                                    │ Spring Data Repositories & Mappers
┌───────────────────────────────────▼────────────────────────────────────┘
│                       DATA PERSISTENCE LAYER                           │
│                 MongoDB 7.x (MongoDB Atlas / Docker)                   │
│  users • candidates • jobs • applications • interviews • feedback      │
│  notifications • audit_logs • departments • interviewer_availability   │
└────────────────────────────────────────────────────────────────────────┘
```

---

### 2. Backend Modular Monolith Structure

The backend application is partitioned into 13 high-cohesion, low-coupling domain packages inside `com.ims.backend`:

1. **Authentication Module (`modules.auth`):**
   - JWT issuance, verification, refresh token rotation, and password reset flows.
   - Enforces the `requiresPasswordChange` policy.
2. **User Management Module (`modules.users`):**
   - Account provisioning, user profile updates, activation/deactivation, interviewer listings.
3. **Role & Permission Module (`modules.roles`):**
   - Enum-based authority definitions (`ROLE_ADMIN`, `ROLE_HR`, `ROLE_INTERVIEWER`, `ROLE_HIRING_MANAGER`, `ROLE_CANDIDATE`).
4. **Candidate Module (`modules.candidates`):**
   - Candidate demographic data, resume file management, and unique email deduplication.
5. **Job Management Module (`modules.jobs`):**
   - Open positions, job descriptions, department bindings, and configurable interview rounds.
6. **Application Management Module (`modules.applications`):**
   - Candidate job applications and state machine transitions across the 12 recruitment stages.
7. **Interview Scheduling Module (`modules.interviews`):**
   - Multi-interviewer scheduling, calendar date/time range coordination, meeting links, and modes.
8. **Interviewer Availability Module (`modules.availability`):**
   - Weekly working hours, custom date blocks, and free/busy query resolution.
9. **Interview Feedback Module (`modules.feedback`):**
   - Multi-parameter ratings, blind feedback redaction engine, strengths/weaknesses notes, and recommendations.
10. **Recruitment Pipeline Module (`modules.pipeline`):**
    - Stage transition validation, stage velocity calculations, and advancement rules.
11. **Notification Module (`modules.notifications`):**
    - Asynchronous event dispatcher for in-app alert storage and email simulation.
12. **Dashboard & Analytics Module (`modules.analytics`):**
    - Aggregation pipelines delivering role-specific metrics (pipeline conversion, interviewer load, pending feedback).
13. **Audit Logging Module (`modules.audit`):**
    - Aspect-oriented programming (AOP) interceptor logging all state transitions, user logins, and administrative actions.

---

### 3. Layered Architecture & Separation of Concerns

Each module strictly follows a four-tier clean layered pattern:

```
[REST Client / Browser]
         │
         ▼
 ┌───────────────┐
 │  Controllers  │ ◄── Handles HTTP requests, triggers @Valid, returns ApiResponse<T>
 └───────┬───────┘
         │ DTOs (Request / Response)
         ▼
 ┌───────────────┐
 │   Services    │ ◄── Enforces business rules, transactions, state machines, audit events
 └───────┬───────┘
         │ Domain Documents / Entities
         ▼
 ┌───────────────┐
 │ Repositories  │ ◄── Spring Data MongoDB query interfaces & Aggregation Pipelines
 └───────┬───────┘
         │ BSON Queries
         ▼
 ┌───────────────┐
 │    MongoDB    │ ◄── Documents with indexes, atomic operators, compound unique keys
 └───────────────┘
```

#### Strict Rules:
- **No Business Logic in Controllers:** Controllers are purely HTTP translation layers.
- **DTO Boundaries:** Internal MongoDB documents (`@Document`) are never exposed directly to REST clients. All interactions pass through strongly-typed DTOs mapped via MapStruct.
- **Domain Invariants Enforced in Services:** All cross-document validations (e.g., verifying an interviewer is not booked before scheduling) reside inside service methods.
- **Transactional Consistency:** Critical state modifications spanning multiple documents (e.g., updating an Application stage when all interview scorecards are submitted) use `@Transactional` where MongoDB replica sets are active.

---

### 4. Security Architecture

1. **Stateless JWT Authentication:**
   - Client sends credentials to `POST /api/v1/auth/login`.
   - On verification, backend signs an HMAC-SHA256 JWT access token (15-min expiration) containing subject ID, email, role, and the `requiresPasswordChange` claim.
   - Long-lived refresh token (7 days) returned in an HTTP-only secure cookie or token response.
2. **First-Login Password Reset Guard:**
   - A newly created user has `requiresPasswordChange = true`.
   - The custom `JwtAuthenticationFilter` validates every incoming request. If the user's token carries `pwd_change_required: true`, all endpoints except `POST /api/v1/auth/change-password` and `POST /api/v1/auth/logout` are immediately rejected with `403 Forbidden`.
3. **Role-Based Method Security:**
   - Spring Security's `@EnableMethodSecurity(prePostEnabled = true)` is activated.
   - Every service/controller method is guarded with explicit annotations, e.g.:
     - `@PreAuthorize("hasRole('ADMIN')")`
     - `@PreAuthorize("hasAnyRole('HR', 'ADMIN')")`
     - `@PreAuthorize("hasAnyRole('HR', 'HIRING_MANAGER', 'INTERVIEWER')")`
4. **Blind Scorecard Isolation:**
   - Interviewers can only see their own scorecard for an interview until their evaluation is formally submitted. The service layer redacts peer evaluations for interviewers who have not submitted feedback.

---

### 5. Frontend Architecture & Design System

The frontend is built using Next.js 14/15 App Router with TypeScript:
- **Route Groups by Role:**
  - `(auth)`: Login, First-Login Change Password, Forgot Password.
  - `(dashboard)/admin`: User provisioning, department setup, audit logs.
  - `(dashboard)/hr`: Candidate pipeline, job requisitions, schedule wizard, feedback review.
  - `(dashboard)/interviewer`: My interviews, availability calendar, blind scorecard form.
  - `(dashboard)/hiring-manager`: Pipeline overview, hiring approvals, team workload metrics.
  - `(dashboard)/candidate`: My interview invitations, meeting details, reschedule request.
- **State Synchronization:**
  - Server state: Handled by **TanStack Query (React Query v5)** with automatic caching, invalidation on mutations, and background refetching.
  - Client state: Handled by **Zustand** for current user session, active sidebar status, and modal states.
  - Form state: Handled by **React Hook Form** with **Zod** schema resolvers mirroring backend validation rules.
- **Component Primitives:**
  - Radix UI accessible primitives wrapped with Tailwind CSS via **Shadcn UI** (Dialog, DropdownMenu, Tabs, Sheet, Popover, Command, Calendar, Badge, Button, Input).
  - Data visualizations powered by **Recharts** (Bar, Line, Radar for scorecard competencies, Pie/Funnel for conversion).
