# Phase 1: Research & Development (R&D)
## Document 05: Technical Recommendations & Architectural Decisions

**Project:** Enterprise Interview Management System (IMS)  
**Author:** Senior Software Architect & Principal Systems Engineer  
**Date:** November 2026  
**Status:** Approved Architectural Document  

---

### 1. Technology Stack Rationalization

The chosen technology stack balances modern enterprise performance, type safety, developer velocity, and maintainability.

```
┌────────────────────────────────────────────────────────────────────────┐
│                        FRONTEND PRESENTATION LAYER                     │
│        Next.js 14/15 (App Router) • TypeScript • Tailwind CSS         │
│          Shadcn UI (Radix Primitives) • Lucide React • Recharts        │
│       React Hook Form + Zod • TanStack Query v5 • Zustand Store        │
└───────────────────────────────────┬────────────────────────────────────┘
                                    │ HTTPS / REST (JSON)
                                    │ Bearer JWT (Access + Refresh)
┌───────────────────────────────────▼────────────────────────────────────┘
│                         BACKEND APPLICATION LAYER                      │
│            Java 21 LTS (Virtual Threads / Project Loom Ready)          │
│          Spring Boot 3.x • Spring Security 6 • Spring Validation       │
│               Lombok • MapStruct • Springdoc OpenAPI 3.0               │
└───────────────────────────────────┬────────────────────────────────────┘
                                    │ Spring Data MongoDB Driver
                                    │ Connection Pooling / SSL
┌───────────────────────────────────▼────────────────────────────────────┘
│                          DATA PERSISTENCE LAYER                        │
│                   MongoDB 7.x (MongoDB Atlas / Docker)                 │
│       Compound Indexes • Multi-Key Indexes • Document References       │
└────────────────────────────────────────────────────────────────────────┘
```

#### 1.1 Backend: Java 21 + Spring Boot 3.x
- **Java 21 LTS:** Enables modern language features (Records, Pattern Matching, Sealed Classes) and Virtual Threads (`spring.threads.virtual.enabled=true`) for non-blocking I/O with high concurrency and low memory overhead.
- **Spring Boot 3.x:** Enterprise foundation providing battle-tested dependency injection, embedded Tomcat, standardized configuration properties, and seamless Actuator health monitoring.
- **Spring Security 6:** Fine-grained method-level authorization via `@PreAuthorize("hasRole('HR')")`, stateless JWT authentication filter chain, and CORS configuration.
- **Spring Data MongoDB:** Native object-document mapping, reactive query derivation, aggregation pipeline builders, and schema index validation.
- **MapStruct & Lombok:** Reduces boilerplate code while ensuring zero-reflection, compile-time type-safe mappings between MongoDB Documents and REST API DTOs.
- **Bean Validation (Jakarta Validation):** Comprehensive declarative validation (`@NotBlank`, `@Email`, `@Future`, `@Size`) on all incoming request payloads.

#### 1.2 Frontend: Next.js (App Router) + TypeScript + Shadcn UI
- **Next.js App Router:** Modern routing conventions (`/admin`, `/hr`, `/interviewer`, `/hiring-manager`, `/candidate`), server components for secure layout rendering, and client components for interactive forms.
- **TypeScript (Strict Mode):** Complete static typing aligning frontend API contracts directly with backend DTOs.
- **Tailwind CSS & Shadcn UI:** Accessible, lightweight UI components built on Radix UI primitives. Avoids bulky runtime CSS-in-JS overhead while providing a modern enterprise SaaS appearance.
- **TanStack Query (React Query v5):** Client-side state synchronization, declarative data fetching, caching, deduplication, and optimistic mutations for smooth UI interactions.
- **React Hook Form + Zod:** Uncontrolled performant form inputs with schema-based client-side validation mirroring backend Bean Validation constraints.
- **Zustand:** Lightweight global state management for current user session, active role context, and UI shell toggles.
- **Recharts:** Responsive, declarative SVG charting for candidate conversion funnels, stage velocity, and interviewer workload visualization.

---

### 2. Concurrency Control & Double-Booking Prevention Strategy

A recurring flaw in basic interview scheduling systems is the **Read-Then-Write Race Condition**:
1. Recruiter A checks if Interviewer X is free on Friday 10:00 - 11:00 AM (Result: Free).
2. Recruiter B checks if Interviewer X is free on Friday 10:00 - 11:00 AM (Result: Free).
3. Recruiter A writes the interview record to the database (Success).
4. Recruiter B writes the interview record to the database (Success, but Interviewer X is now double-booked!).

#### Recommended Two-Tier Concurrency Strategy for MongoDB:

```
                  ┌───────────────────────────────────────────────┐
                  │          HR Scheduling Request                │
                  └───────────────────────┬───────────────────────┘
                                          │
                                          ▼
                  ┌───────────────────────────────────────────────┐
                  │ Tier 1: Application-Level Range Pre-Check     │
                  │ Check for active bookings overlapping:        │
                  │ [scheduledStart < reqEnd] AND                 │
                  │ [scheduledEnd > reqStart]                     │
                  │ for any interviewer in interviewerIds         │
                  └───────────────────────┬───────────────────────┘
                                          │ Passed
                                          ▼
                  ┌───────────────────────────────────────────────┐
                  │ Tier 2: Atomic Reservation & Index Guard      │
                  │ Use atomic slot locking or MongoDB            │
                  │ transactional write with status verification  │
                  │ status: SCHEDULED                             │
                  └───────────────────────┬───────────────────────┘
                                          │
                         ┌────────────────┴────────────────┐
                         ▼ Success                         ▼ Collided (409)
                  [Interview Created]              [Conflict Exception]
```

##### Detailed Mechanism:
1. **Tier 1 (Application Query Pre-Check):**
   ```java
   boolean isOverlapping = interviewRepository.existsByInterviewerIdsInAndStatusInAndScheduledStartLessThanAndScheduledEndGreaterThan(
       requestedInterviewerIds,
       List.of(InterviewStatus.SCHEDULED, InterviewStatus.IN_PROGRESS),
       requestedEnd,
       requestedStart
   );
   if (isOverlapping) {
       throw new ScheduleConflictException("One or more interviewers are already booked during this time window.");
   }
   ```
2. **Tier 2 (Atomic Concurrency Protection):**
   - For high-concurrency environments, each interviewer's booked time slots are registered using atomic `$push` or an explicit slot reservation collection `interviewer_bookings` with a compound unique key:
     `{ interviewerId: 1, date: 1, slotHour: 1 }` or MongoDB multi-document transactions (`@Transactional`) guaranteeing isolation.
   - If an insertion encounters an overlapping active slot, MongoDB throws a duplicate key/write collision error, caught and mapped to `409 Conflict`.

---

### 3. MongoDB Schema Design & Indexing Architecture

#### 3.1 Document Schema vs. Reference Strategy
- **Normalized References (`@DBRef` or `String id`):** Used for distinct business aggregates that evolve independently:
  - `User` (identity and credentials)
  - `Candidate` (personal background)
  - `Job` (position requisitions)
  - `Application` (links Candidate + Job + current Stage)
  - `Interview` (links Application + Round + Interviewers + Schedule)
- **Embedded Documents:** Used for tightly coupled, non-independent sub-entities:
  - `InterviewRound` embedded inside `Job` (each job owns its ordered rounds and specific evaluation rubrics).
  - `RatingItem` embedded inside `Scorecard` (scores and comments per criterion).
  - `AuditTransition` embedded inside `Application.stageHistory` (timeline of status changes).

#### 3.2 Critical MongoDB Indexes:

| Collection | Index Fields | Index Type | Purpose |
| :--- | :--- | :--- | :--- |
| `users` | `email` | Unique | Enforces single account per email address. |
| `users` | `role`, `status` | Compound | Fast retrieval of active interviewers or recruiters. |
| `candidates` | `email` | Unique | Deduplication of candidate profiles. |
| `applications` | `candidateId`, `jobId` | Unique Compound | Prevents duplicate applications for the same job. |
| `applications` | `stage`, `jobId` | Compound | Powers job-specific kanban boards and funnel counts. |
| `interviews` | `interviewerIds`, `scheduledStart`, `scheduledEnd` | Multi-Key Compound | High-performance conflict detection and calendar queries. |
| `interviews` | `applicationId`, `roundIndex` | Compound | Rapid lookup of interview history per application. |
| `interviews` | `status`, `scheduledStart` | Compound | Drives HR and Interviewer "Today's Interviews" dashboards. |
| `interview_feedback` | `interviewId`, `interviewerId` | Unique Compound | Prevents duplicate scorecards from the same interviewer. |
| `notifications` | `recipientId`, `isRead`, `createdAt` | Compound Desc | Instant retrieval of unread notifications for navigation bell. |
| `audit_logs` | `entityType`, `entityId`, `timestamp` | Compound Desc | Fast audit timeline construction. |

---

### 4. Security & Authentication Architecture

```
                  ┌───────────────────────────────────────────────┐
                  │                 CLIENT REQUEST                │
                  │         Authorization: Bearer <JWT>           │
                  └───────────────────────┬───────────────────────┘
                                          │
                                          ▼
                  ┌───────────────────────────────────────────────┐
                  │           JwtAuthenticationFilter             │
                  │ 1. Validate JWT Signature (HMAC / RSA)        │
                  │ 2. Check Expiration & Claims                  │
                  │ 3. If requiresPasswordChange == true AND      │
                  │    path != "/api/v1/auth/change-password":    │
                  │    RETURN 403 (PASSWORD_CHANGE_REQUIRED)      │
                  └───────────────────────┬───────────────────────┘
                                          │ Validated
                                          ▼
                  ┌───────────────────────────────────────────────┐
                  │      Spring Security SecurityContext          │
                  │ Principal: UserDetails | Authorities: ROLE_*  │
                  └───────────────────────┬───────────────────────┘
                                          │
                                          ▼
                  ┌───────────────────────────────────────────────┐
                  │          @PreAuthorize Method Guard           │
                  │ e.g. @PreAuthorize("hasAnyRole('HR','ADMIN')")│
                  └───────────────────────────────────────────────┘
```

#### Key Security Implementations:
1. **Stateless JWT Tokens:**
   - **Access Token:** Short-lived (15–60 minutes), contains `sub` (userId), `email`, `role`, and `requiresPasswordChange`.
   - **Refresh Token:** Long-lived (7 days), stored securely as an HTTP-only cookie or hashed in the database, used exclusively to rotate access tokens.
2. **Password Policy:**
   - Passwords hashed using `BCryptPasswordEncoder` with strength factor 12.
   - Passwords must have a minimum of 8 characters, at least one uppercase letter, one lowercase letter, one digit, and one special symbol.
3. **Strict Blind Scorecard Visibility Engine:**
   - Scorecards are hidden from interviewers until they submit their own evaluation.
   - Controlled via service-layer filter:
     ```java
     public List<FeedbackResponseDTO> getInterviewFeedback(String interviewId, CurrentUser user) {
         List<Feedback> allFeedback = feedbackRepository.findByInterviewId(interviewId);
         if (user.hasRole("ROLE_HR") || user.hasRole("ROLE_HIRING_MANAGER") || user.hasRole("ROLE_ADMIN")) {
             return mapper.toDtoList(allFeedback);
         }
         // Interviewer role: verify if caller has submitted their own feedback
         boolean callerSubmitted = allFeedback.stream()
             .anyMatch(f -> f.getInterviewerId().equals(user.getId()));
         if (!callerSubmitted) {
             // Redact other interviewers' evaluations
             return Collections.emptyList();
         }
         return mapper.toDtoList(allFeedback);
     }
     ```

---

### 5. Architectural Quality Standards

1. **Clean Layered Architecture:**
   - `Controllers`: Accept DTOs, trigger validation (`@Valid`), delegate directly to services, return `ResponseEntity<ApiResponse<T>>`. No business decisions or database calls in controllers.
   - `Services`: Own transactional boundaries, enforce domain invariants, manage entity state transitions, coordinate notifications and audit logs.
   - `Repositories`: Clean Spring Data MongoDB interfaces with typed query methods.
   - `DTOs / Mappers`: MapStruct handles clean bidirectional conversion.
2. **Standardized API Response Envelope:**
   ```json
   {
     "success": true,
     "message": "Interview scheduled successfully",
     "data": { ... },
     "timestamp": "2026-11-22T14:30:00Z"
   }
   ```
3. **Centralized Global Exception Handling:**
   - `@RestControllerAdvice` catching `MethodArgumentNotValidException`, `ScheduleConflictException`, `ResourceNotFoundException`, `UnauthorizedException`, and `AccessDeniedException`.
   - Structured error payload:
   ```json
   {
     "success": false,
     "errorCode": "SCHEDULE_CONFLICT",
     "message": "Interviewer John Doe is already assigned to an interview during this time window.",
     "errors": [],
     "timestamp": "2026-11-22T14:30:00Z"
   }
   ```
