# Phase 1: Research & Development (R&D)
## Document 04: Detailed User Workflows & Interaction Specifications

**Project:** Enterprise Interview Management System (IMS)  
**Author:** Senior UI/UX Designer & Systems Architect  
**Date:** November 2026  
**Status:** Approved Architectural Document  

---

### 1. Overview of End-to-End Recruitment Journey

The recruitment process spans multiple actors operating concurrently across organizational departments. The diagram below illustrates the macro-level journey:

```
[ADMIN]              [HR RECRUITER]          [INTERVIEWER]         [HIRING MANAGER]        [CANDIDATE]
   │                       │                       │                       │                     │
   ├── Provision User ────►│                       │                       │                     │
   │   (Force Pwd Change)  │                       │                       │                     │
   │                       ├── Create Job & Rounds │                       │                     │
   │                       ├── Add Candidate ──────┼───────────────────────┼────────────────────►│
   │                       │   (Upload Resume)     │                       │                     │
   │                       ├── Schedule Round 1 ──►├── Accept/Decline      │                     ├── View Invite
   │                       │   (Conflict Check)    │                       │                     │   (Confirm)
   │                       │                       ├── Conduct Interview   │                     │
   │                       │                       ├── Submit Blind Feedback                     │
   │                       │                       │   (Scorecard Locked)  │                     │
   │                       ├── Review Feedback ────┼──────────────────────►├── Review Debrief    │
   │                       ├── Advance to Round 2  │                       │   & Approve         │
   │                       ├── Extend Offer ───────┼───────────────────────┼────────────────────►│ (Hired!)
```

---

### 2. Workflow 1: User Creation & Mandatory First-Login Password Change

```
[Admin]                       [IMS Frontend]                [Spring Boot Backend]             [MongoDB]
   │                                │                                │                            │
   ├── 1. POST /api/v1/users ──────►│                                │                            │
   │   (role, email, tempPwd)       ├── 2. Validate DTO ────────────►│                            │
   │                                │                                ├── 3. Hash pwd with BCrypt  │
   │                                │                                ├── 4. Set requiresChange=true
   │                                │                                ├── 5. Insert User document ─►
   │                                │◄── 6. 201 Created (UserDTO) ───┤                            │
   │◄── 7. Show success alert ──────┤                                │                            │
   │                                │                                │                            │
   ─────────────────────── NEW USER ONBOARDING ────────────────────────────                       │
   │                                │                                │                            │
[New User]                          │                                │                            │
   ├── 8. POST /api/v1/auth/login ─►│                                │                            │
   │   (email, tempPwd)             ├── 9. Verify Credentials ──────►│                            │
   │                                │                                ├── 10. Generate JWT token   │
   │                                │                                │   (claims: requiresPwd=true)
   │                                │◄── 11. 200 OK + JWT ───────────┤                            │
   │                                ├── 12. Check requiresPwd flag───┤                            │
   │◄── 13. Redirect to /change-pwd─┤                                │                            │
   │                                │                                │                            │
   ├── 14. Submit new password ────►│                                │                            │
   │   (oldPwd, newPwd, confirmPwd) ├── 15. POST /change-password ──►│                            │
   │                                │                                ├── 16. Verify old password  │
   │                                │                                ├── 17. Enforce strong policy│
   │                                │                                ├── 18. Update password hash │
   │                                │                                ├── 19. Set requiresChange=false
   │                                │                                ├── 20. Save User ──────────►│
   │                                │◄── 21. 200 OK (PasswordUpdated)┤                            │
   │◄── 22. Route to Role Dashboard─┤                                │                            │
```

#### Step-by-Step Execution Rules:
1. **Creation:** Admin provides User's Name, Email, Department, and Role (`HR`, `INTERVIEWER`, `HIRING_MANAGER`).
2. **Initial Credential State:** A temporary password is provided or auto-generated. Document property `requiresPasswordChange` is initialized to `true`.
3. **Security Interceptor:** When the user logs in with the temporary password, a JWT is issued containing the claim `pwd_change_required: true`.
4. **Endpoint Guard:** Any request to business endpoints (e.g., `/api/v1/interviews`, `/api/v1/candidates`) from a user whose token contains `pwd_change_required: true` is intercepted by `JwtAuthenticationFilter` and rejected with `403 Forbidden` (`ErrorCode.PASSWORD_CHANGE_REQUIRED`).
5. **Resolution:** The user successfully updates their password via `/api/v1/auth/change-password`, setting `requiresPasswordChange = false` in MongoDB, and receives a refreshed JWT unlocking full dashboard access.

---

### 3. Workflow 2: Candidate Management & Intelligent Deduplication

```
[HR Recruiter]               [IMS Frontend]                 [Spring Boot Backend]             [MongoDB]
   │                                │                                │                            │
   ├── 1. Enter Candidate Data ────►│                                │                            │
   │   & Upload Resume (PDF)        ├── 2. Multipart Upload ────────►│                            │
   │                                │   (DTO + File)                 ├── 3. Validate File type/size
   │                                │                                ├── 4. Check duplicate email ─►
   │                                │                                │   (candidates.email index) │
   │                                │                                │                            │
   │                        [IF EMAIL ALREADY EXISTS]                │                            │
   │                                │◄── 5. 409 Conflict (Duplicate)─┤                            │
   │◄── 6. Prompt: Existing Profile─┤                                │                            │
   │   "Attach to new Job?"         │                                │                            │
   │                                │                                │                            │
   │                        [IF CANDIDATE IS UNIQUE]                 │                            │
   │                                │                                ├── 7. Save file to storage  │
   │                                │                                ├── 8. Save Candidate doc ───►
   │                                │                                ├── 9. Create Application doc─►
   │                                │                                │   (stage: APPLIED)         │
   │                                │◄── 10. 201 Created ────────────┤                            │
   │◄── 11. Show in Job Pipeline ───┤                                │                            │
```

#### Step-by-Step Execution Rules:
1. **Input Submission:** HR inputs Candidate First Name, Last Name, Email, Phone, Skills, and Experience, and uploads a resume file.
2. **File Validation:** The backend validates MIME type (`application/pdf`, `application/vnd.openxmlformats-officedocument.wordprocessingml.document`) and enforces a strict 10MB size limit.
3. **Deduplication Check:** A unique index on `candidates.email` guarantees data integrity. If a collision occurs, the recruiter can link the candidate's existing record to the new job without creating duplicate personal records.
4. **Application Association:** A new `Application` document is created referencing `candidateId` and `jobId`, initializing the candidate in the `APPLIED` recruitment stage.

---

### 4. Workflow 3: Concurrency-Safe Interview Scheduling

```
[HR Recruiter]               [IMS Frontend]                 [Spring Boot Backend]             [MongoDB]
   │                                │                                │                            │
   ├── 1. Select Candidate, Job, ──►│                                │                            │
   │   Round, Date & Interviewers   ├── 2. GET /interviews/avail ───►│                            │
   │                                │   (interviewers, date)         ├── 3. Query busy blocks ────►
   │                                │◄── 4. Return Availability Matrix┤                           │
   │◄── 5. Display visual slots ────┤                                │                            │
   │                                │                                │                            │
   ├── 6. Confirm Booking Slot ────►│                                │                            │
   │   (Round, Start, End, Mode,    ├── 7. POST /api/v1/interviews ─►│                            │
   │    MeetingLink, Interviewers)  │                                ├── 8. Pre-check conflicts   │
   │                                │                                ├── 9. Atomic Slot Insert ───►
   │                                │                                │   (with compound index guard)
   │                                │                                │                            │
   │                      [IF CONCURRENCY COLLISION DETECTED]        │                            │
   │                                │◄── 10. 409 Conflict ───────────┤ (Duplicate key error)      │
   │◄── 11. "Slot just booked by    ┤                                │                            │
   │   another recruiter. Choose alt"                                │                            │
   │                                │                                │                            │
   │                         [IF BOOKING SUCCEEDS]                   │                            │
   │                                │                                ├── 12. Create Interview doc ─►
   │                                │                                ├── 13. Update Application ──►
   │                                │                                │   (stage: INTERVIEW_SCHEDULED)
   │                                │                                ├── 14. Dispatch Async Alerts
   │                                │◄── 15. 201 Created (Interview)─┤   (Email/In-app to panel & cand)
   │◄── 16. Show Scheduled in UI ───┤                                │                            │
```

#### Step-by-Step Execution Rules:
1. **Slot Inspection:** Recruiter selects date and interviewers. Frontend renders a color-coded timeline highlighting interviewer busy blocks and existing interviews.
2. **Timezone Normalization:** Times chosen in recruiter's local time are converted to standard UTC ISO 8601 strings before transmission to the backend.
3. **Atomic Reservation:** Backend validates that none of the requested interviewers have overlapping active interviews (`status != CANCELLED`). The insertion relies on an atomic query and a compound unique lock or index, guaranteeing zero double-booking even under concurrent requests.
4. **Notification Dispatch:** System automatically dispatches asynchronous in-app notifications and email payloads to all assigned interviewers and the candidate.

---

### 5. Workflow 4: Interview Execution & Blind Scorecard Submission

```
[Interviewer A]              [Interviewer B]              [Spring Boot Backend]               [MongoDB]
   │                                │                                │                            │
   ├── 1. Open Assigned Interview ──┼───────────────────────────────►│                            │
   │   (View candidate & rubric)    │                                ├── 2. Check Permissions    │
   │◄── 3. Return Candidate + Rubric┼────────────────────────────────┤                            │
   │                                │                                │                            │
   ├── 4. Conduct Interview ────────┼────────────────────────────────┤                            │
   │                                ├── 5. Conduct Interview ────────┤                            │
   │                                │                                │                            │
   │  --- SUBMIT SCORECARD ---      │                                │                            │
   ├── 6. POST /interviews/{id}/feedback                            │                            │
   │   (Ratings, Notes, Rec) ───────┼───────────────────────────────►│                            │
   │                                │                                ├── 7. Save Scorecard A ─────►
   │                                │                                ├── 8. Mark submittedAt=NOW  │
   │◄── 9. 201 Created (Feedback) ──┼────────────────────────────────┤                            │
   │                                │                                │                            │
   │  --- BLIND PRIVACY CHECK ---   │                                │                            │
   │                                ├── 10. GET /interviews/{id}/feedback                         │
   │                                │   (Before submitting own feedback)                          │
   │                                │                                ├── 11. Backend detects B has│
   │                                │                                │   NOT submitted feedback   │
   │                                │◄── 12. Returns EMPTY / REDACTED┤ (Hides Interviewer A's data)│
   │                                │                                │                            │
   │                                ├── 13. POST /interviews/{id}/feedback                        │
   │                                │   (Interviewer B submits) ────►│                            │
   │                                │                                ├── 14. Save Scorecard B ────►
   │                                │◄── 15. 201 Created ────────────┤                            │
   │                                │                                │                            │
   │  --- CONSENSUS DEBRIEF ---     │                                │                            │
   ├── 16. GET /interviews/{id}/feedback (Both submitted) ──────────►│                            │
   │◄── 17. Returns ALL scorecards (Panel Consensus Visible) ────────┤                            │
```

#### Step-by-Step Execution Rules:
1. **Context Access:** Interviewer reviews candidate background, previous round high-level summaries (if permitted), and the specific rubric parameters assigned for this round.
2. **Submission:** Interviewer inputs scores (1-5) for each parameter, details qualitative strengths and growth areas, and selects a recommendation (`STRONG_HIRE`, `HIRE`, `HOLD`, `REJECT`, `NEXT_ROUND`).
3. **Blind Enforcement:** The backend API inspects the caller's ID. If the caller is an interviewer who has not yet submitted feedback for this interview, all other submitted scorecards are stripped from the response payload.
4. **Consensus Debrief:** Once an interviewer submits their own evaluation, or when an HR Recruiter / Hiring Manager accesses the feedback endpoint, the complete set of panel evaluations is revealed.

---

### 6. Workflow 5: Candidate Recruitment Pipeline & Decisioning

```
[HR / Hiring Manager]        [IMS Frontend]                 [Spring Boot Backend]             [MongoDB]
   │                                │                                │                            │
   ├── 1. Open Candidate Debrief ──►│                                │                            │
   │                                ├── 2. GET /applications/{id} ──►│                            │
   │                                │◄── 3. Return full history & ───┤                            │
   │                                │       aggregated scorecards    │                            │
   │◄── 4. Display Debrief View ────┤                                │                            │
   │   (Average rating, consensus)  │                                │                            │
   │                                │                                │                            │
   ├── 5. Action: Move to Next Round├── 6. PATCH /stage ────────────►│                            │
   │   (or SELECT / REJECT)         │   (newStage: NEXT_ROUND)       ├── 7. Validate transition   │
   │                                │                                ├── 8. Update Application ──►
   │                                │                                ├── 9. Record Audit Log ─────►
   │                                │◄── 10. 200 OK (Updated Stage) ─┤                            │
   │◄── 11. Pipeline updates live ──┤                                │                            │
```

#### Step-by-Step Execution Rules:
1. **Debrief Review:** HR and Hiring Manager inspect the aggregate score matrix, reviewing individual scores, radar graphs of competency averages, and comments.
2. **State Transition Validation:** When advancing a candidate, the system checks whether the current round has met the completion criteria (all scorecards submitted).
3. **Status Progression:** If approved for the next round, the application transitions to `ROUND_COMPLETED`, unlocking the scheduling button for Round N+1.
4. **Rejection Handling:** If rejected at any point, the application moves to `REJECTED`, and an optional notification template is queued to inform the candidate.

---

### 7. Workflow 6: Rescheduling & Cancellation

1. **Trigger:** Candidate contacts HR requesting a time change, an interviewer becomes unwell, or an emergency meeting conflicts with the schedule.
2. **Action by HR:** HR opens the scheduled interview and selects `Reschedule` or `Cancel`.
3. **Reason Tracking:** HR must enter a mandatory `reason` (e.g., "Candidate requested morning slot due to exam conflict", "Interviewer sudden illness").
4. **Historical Record Preservation:** The original interview record is not permanently deleted; its status is transitioned to `CANCELLED` or `RESCHEDULED`, preserving the audit history.
5. **New Slot Creation:** When rescheduling, a new linked interview record is created for the updated time interval.
6. **Notification Broadcast:** An automated cancellation/rescheduling notification is dispatched to all affected parties with updated calendar details.
