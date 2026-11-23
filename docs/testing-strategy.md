# Enterprise Interview Management System (IMS)
## Comprehensive Testing Strategy & Quality Assurance Plan

**Document:** `docs/testing-strategy.md`  
**Status:** Approved Architectural Document  
**Version:** 1.0.0  
**Date:** November 2026  

---

### 1. Quality Assurance Philosophy & Testing Pyramid

The **Interview Management System (IMS)** enforces a rigorous, multi-tiered testing strategy ensuring enterprise reliability, data integrity, and strict security isolation.

```
                  ┌───────────────────────┐
                  │      E2E Tests        │  (Critical User Journeys)
                  │   Playwright / Cypress│
                  ├───────────────────────┤
                  │   Integration Tests   │  (Spring Boot MockMvc,
                  │  Spring Security & DB │   Embedded/Testcontainers Mongo)
                  ├───────────────────────┤
                  │      Unit Tests       │  (JUnit 5, Mockito,
                  │  Domain Services, DTOs│   Zod Schema Validation)
                  └───────────────────────┘
```

---

### 2. Execution Plan for the 16 Critical Test Scenarios

The system must validate and pass the following 16 end-to-end integration scenarios before production release:

| # | Critical Test Scenario | Verification Method & Expected Outcome |
| :- | :--- | :--- |
| **01** | **Admin Creates HR Account** | Admin submits `POST /api/v1/users` with role `ROLE_HR`. Backend hashes temporary password with BCrypt, sets `requiresPasswordChange = true`, and returns `201 Created`. |
| **02** | **First-Login Password Reset** | HR logs in with temporary password. System issues JWT with `pwd_change_required = true`. Calling `/api/v1/candidates` returns `403 Forbidden`. User executes `POST /api/v1/auth/change-password`; `requiresPasswordChange` becomes `false`; full access is granted. |
| **03** | **Candidate Creation & Deduplication** | HR creates candidate Alex Mercer with email `alex@test.com`. Record is persisted. Attempting to create a second candidate with the identical email throws `409 Conflict` via MongoDB unique index. |
| **04** | **Job Opening & Round Configuration** | HR creates "Senior Backend Engineer" with 3 configured interview rounds (Screening, Architecture, Leadership). All rounds persist in ordered sequence with rubric parameters. |
| **05** | **Application Association** | HR associates Alex Mercer with the Job. System creates `Application` document with initial stage `APPLIED`. Attempting duplicate association throws `409 Conflict`. |
| **06** | **Interview Scheduling** | HR schedules Round 1 for candidate. Application stage transitions to `INTERVIEW_SCHEDULED`. Scheduled start and end times persist in UTC. |
| **07** | **Multi-Interviewer Assignment** | HR assigns 2 interviewers (Elena and David) to a panel interview. Both user IDs are saved in `interviewerIds` array. |
| **08** | **Double-Booking & Conflict Guard** | A second recruiter attempts to book David for an interview overlapping Elena and David's slot. The system detects the conflict and rejects the booking with `409 Conflict`. |
| **09** | **Interviewer Schedule Isolation** | Interviewer David logs in and queries `/api/v1/interviews`. Only interviews where `interviewerIds` contains David's ID are returned; other interviewers' private sessions are omitted. |
| **10** | **Blind Feedback Submission** | Interviewer David submits structured scorecard (ratings 1-5, strengths, weaknesses, `STRONG_HIRE`). Scorecard persists with `isSubmitted = true`. Before submission, peer Elena cannot view David's feedback. |
| **11** | **HR Feedback Visibility** | Recruiter accesses `/api/v1/interviews/{id}/feedback`. System returns all submitted scorecards with complete competency breakdown and notes. |
| **12** | **Hiring Manager Review & Consensus** | Hiring Manager accesses application debrief view. System displays aggregated score averages and individual panel recommendations. |
| **13** | **Stage Progression (Next Round)** | HR advances candidate to Round 2. System updates `currentStage` to `ROUND_COMPLETED`, then to `INTERVIEW_SCHEDULED` for Round 2, logging an immutable audit record. |
| **14** | **Interview Rescheduling** | HR reschedules an interview due to candidate conflict. Original record transitions to `RESCHEDULED`, preserving history. A new linked interview is created with updated times. |
| **15** | **Notification Broadcast** | Scheduling or rescheduling events immediately trigger in-app notifications for candidate and interviewers, verified by querying `/api/v1/notifications`. |
| **16** | **Unauthorized Access Prevention** | An interviewer attempts to call `POST /api/v1/users` (Admin only) or `PATCH /api/v1/applications/{id}/stage` (HR only). Both requests are blocked by Spring Security with `403 Forbidden`. |

---

### 3. Concurrency & Race Condition Testing Plan

To rigorously verify the double-booking prevention engine, we execute multi-threaded concurrency tests using Java `ExecutorService` and `CountDownLatch`:

```java
@Test
void whenConcurrentScheduling_thenPreventDoubleBooking() throws InterruptedException {
    int concurrentThreads = 10;
    ExecutorService executor = Executors.newFixedThreadPool(concurrentThreads);
    CountDownLatch latch = new CountDownLatch(1);
    AtomicInteger successCount = new AtomicInteger(0);
    AtomicInteger conflictCount = new AtomicInteger(0);

    String interviewerId = "user_test_interviewer_1";
    Instant start = Instant.parse("2026-12-01T14:00:00Z");
    Instant end = Instant.parse("2026-12-01T15:00:00Z");

    for (int i = 0; i < concurrentThreads; i++) {
        executor.submit(() -> {
            try {
                latch.await(); // Synchronize all threads to fire simultaneously
                schedulingService.scheduleInterview(createScheduleRequest(interviewerId, start, end));
                successCount.incrementAndGet();
            } catch (ScheduleConflictException e) {
                conflictCount.incrementAndGet();
            } catch (Exception e) {
                // Unexpected error
            }
        });
    }

    latch.countDown(); // Release the latch
    executor.shutdown();
    executor.awaitTermination(5, TimeUnit.SECONDS);

    // EXACTLY one request must succeed; all other 9 must be rejected with 409
    assertEquals(1, successCount.get(), "Only one booking should succeed");
    assertEquals(9, conflictCount.get(), "Nine concurrent attempts should be rejected");
}
```

---

### 4. Negative Testing & Security Hardening Verification

1. **JWT Tampering:**
   - Modify payload of a signed JWT (e.g., changing role from `ROLE_INTERVIEWER` to `ROLE_ADMIN`). Verify backend signature verification fails and returns `401 Unauthorized`.
2. **Expired Token Invalidation:**
   - Attempt to call protected endpoints with an expired JWT. Verify `JwtAuthenticationFilter` rejects the token with token-expired code.
3. **Malicious Resume File Upload:**
   - Upload executable files (`.exe`, `.sh`) renamed with a `.pdf` extension. Verify Apache Tika / MIME validation detects the mismatch and rejects the file with `400 Bad Request`.
   - Upload files exceeding 10MB. Verify `MaxUploadSizeExceededException` is cleanly caught and returned.
4. **Blind Scorecard Leakage Attempt:**
   - Interviewer attempts to invoke `GET /api/v1/interviews/{id}/feedback` while their own scorecard has `isSubmitted: false`. Verify the response payload has zero peer evaluation details.
