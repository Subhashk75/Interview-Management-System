# Enterprise Interview Management System (IMS)
## Database Design & Data Modeling Specification

**Document:** `docs/database-design.md`  
**Status:** Approved Architectural Document  
**Version:** 1.0.0 (Production Data Model)  
**Date:** November 2026  

---

### 1. Data Modeling Philosophy & Normalization Strategy

MongoDB 7.x is our document database. In modern enterprise systems, purely relational 3NF normalization introduces excessive `JOIN` overhead, while unconstrained embedding causes document bloating and concurrency contention. 

We apply the **Document Reference vs. Embedding Rule**:
- **Embed** when data has 1:1 or small, bounded 1:N cardinality, is always retrieved with the parent document, and does not have an independent lifecycle (e.g., `InterviewRound` inside `Job`, `RatingItem` inside `InterviewFeedback`, `StageTransition` inside `Application`).
- **Reference by String ID** when entities represent independent business aggregates with unbounded lifecycles, require independent updates, or are shared across different domains (e.g., `User`, `Candidate`, `Job`, `Application`, `Interview`).

---

### 2. Collection Schemas & Entity Definitions

---

#### 2.1 Collection: `users`
Represents internal organization actors (Admin, HR, Interviewer, Hiring Manager, Candidate).

```json
{
  "_id": "ObjectId('6550...01')",
  "email": "sarah.connor@acme.com",
  "passwordHash": "$2a$12$e8Y7z7r0M8Yy9u...",
  "firstName": "Sarah",
  "lastName": "Connor",
  "role": "ROLE_HR",
  "department": "Talent Acquisition",
  "status": "ACTIVE",
  "requiresPasswordChange": false,
  "phoneNumber": "+1-555-0199",
  "timezone": "America/New_York",
  "skills": ["Technical Sourcing", "Behavioral Interviewing"],
  "lastLoginAt": "2026-11-22T10:15:00Z",
  "createdAt": "2026-11-01T08:00:00Z",
  "updatedAt": "2026-11-22T10:15:00Z"
}
```

##### Critical Indexes:
- `db.users.createIndex({ email: 1 }, { unique: true })`
- `db.users.createIndex({ role: 1, status: 1 })`
- `db.users.createIndex({ department: 1 })`

---

#### 2.2 Collection: `candidates`
Stores central candidate identity and biographical information.

```json
{
  "_id": "ObjectId('6550...02')",
  "firstName": "Alex",
  "lastName": "Mercer",
  "email": "alex.mercer@gmail.com",
  "phoneNumber": "+1-555-0144",
  "currentTitle": "Senior Backend Engineer",
  "currentCompany": "Stripe",
  "experienceYears": 7,
  "skills": ["Java", "Spring Boot", "Distributed Systems", "MongoDB"],
  "resumeFile": {
    "fileId": "res_8839201a",
    "fileName": "Alex_Mercer_Resume_2026.pdf",
    "fileSize": 245012,
    "mimeType": "application/pdf",
    "storagePath": "/uploads/resumes/2026/11/res_8839201a.pdf",
    "uploadedAt": "2026-11-20T14:30:00Z"
  },
  "notes": "Referred by engineering director.",
  "createdBy": "ObjectId('6550...01')",
  "createdAt": "2026-11-20T14:30:00Z",
  "updatedAt": "2026-11-20T14:30:00Z"
}
```

##### Critical Indexes:
- `db.candidates.createIndex({ email: 1 }, { unique: true })`
- `db.candidates.createIndex({ skills: 1 })`
- `db.candidates.createIndex({ lastName: 1, firstName: 1 })`

---

#### 2.3 Collection: `jobs`
Represents an open organizational hiring requisition with custom interview rounds.

```json
{
  "_id": "ObjectId('6550...03')",
  "title": "Lead Platform Engineer",
  "department": "Infrastructure",
  "location": "San Francisco, CA (Hybrid)",
  "employmentType": "FULL_TIME",
  "description": "Architect high-throughput core streaming services...",
  "requirements": ["Java 21+", "Kubernetes", "High Concurrency"],
  "targetHeadcount": 2,
  "status": "ACTIVE",
  "hiringManagerId": "ObjectId('6550...10')",
  "recruiterId": "ObjectId('6550...01')",
  "rounds": [
    {
      "roundIndex": 1,
      "name": "HR Phone Screen",
      "type": "BEHAVIORAL",
      "durationMinutes": 45,
      "instructions": "Assess communication, career trajectory, and compensation alignment.",
      "parameters": [
        { "name": "Communication Clarity", "weight": 1.0 },
        { "name": "Cultural Values", "weight": 1.0 },
        { "name": "Role Motivation", "weight": 1.0 }
      ]
    },
    {
      "roundIndex": 2,
      "name": "Technical & System Architecture",
      "type": "TECHNICAL",
      "durationMinutes": 60,
      "instructions": "Dive into distributed state, cache invalidation, and concurrency control.",
      "parameters": [
        { "name": "Data Modeling & Architecture", "weight": 1.5 },
        { "name": "Concurrency & Performance", "weight": 1.5 },
        { "name": "Debugging & Problem Solving", "weight": 1.0 }
      ]
    },
    {
      "roundIndex": 3,
      "name": "Hiring Manager Debrief & Leadership",
      "type": "MANAGERIAL",
      "durationMinutes": 45,
      "instructions": "Assess leadership, mentorship, and cross-functional collaboration.",
      "parameters": [
        { "name": "Leadership & Ownership", "weight": 1.0 },
        { "name": "Team Collaboration", "weight": 1.0 }
      ]
    }
  ],
  "createdAt": "2026-11-15T09:00:00Z",
  "updatedAt": "2026-11-15T09:00:00Z"
}
```

##### Critical Indexes:
- `db.jobs.createIndex({ status: 1, department: 1 })`
- `db.jobs.createIndex({ recruiterId: 1 })`
- `db.jobs.createIndex({ hiringManagerId: 1 })`

---

#### 2.4 Collection: `applications`
Connects a candidate to a specific job opening and tracks the candidate's recruitment stage.

```json
{
  "_id": "ObjectId('6550...04')",
  "candidateId": "ObjectId('6550...02')",
  "jobId": "ObjectId('6550...03')",
  "currentStage": "INTERVIEW_SCHEDULED",
  "currentRoundIndex": 2,
  "stageHistory": [
    {
      "fromStage": "APPLIED",
      "toStage": "SCREENING",
      "changedBy": "ObjectId('6550...01')",
      "timestamp": "2026-11-20T15:00:00Z",
      "comment": "Resume matches criteria."
    },
    {
      "fromStage": "SCREENING",
      "toStage": "SHORTLISTED",
      "changedBy": "ObjectId('6550...01')",
      "timestamp": "2026-11-21T10:00:00Z",
      "comment": "Screening passed with Strong Yes."
    },
    {
      "fromStage": "SHORTLISTED",
      "toStage": "INTERVIEW_SCHEDULED",
      "changedBy": "ObjectId('6550...01')",
      "timestamp": "2026-11-22T09:00:00Z",
      "comment": "Scheduled Technical Architecture Round."
    }
  ],
  "overallRecommendation": "PENDING",
  "createdAt": "2026-11-20T14:35:00Z",
  "updatedAt": "2026-11-22T09:00:00Z"
}
```

##### Critical Indexes:
- `db.applications.createIndex({ candidateId: 1, jobId: 1 }, { unique: true })`
- `db.applications.createIndex({ jobId: 1, currentStage: 1 })`
- `db.applications.createIndex({ currentStage: 1 })`

---

#### 2.5 Collection: `interviews`
Represents an individual scheduled interview event.

```json
{
  "_id": "ObjectId('6550...05')",
  "applicationId": "ObjectId('6550...04')",
  "candidateId": "ObjectId('6550...02')",
  "jobId": "ObjectId('6550...03')",
  "roundIndex": 2,
  "roundName": "Technical & System Architecture",
  "scheduledStart": "2026-11-25T15:00:00Z",
  "scheduledEnd": "2026-11-25T16:00:00Z",
  "mode": "ONLINE",
  "meetingDetails": {
    "meetingUrl": "https://meet.google.com/abc-defg-hij",
    "meetingPassword": "optional-pwd",
    "locationRoom": null,
    "instructions": "Please join with webcam enabled and coding environment ready."
  },
  "interviewerIds": [
    "ObjectId('6550...11')",
    "ObjectId('6550...12')"
  ],
  "interviewerResponses": [
    { "interviewerId": "ObjectId('6550...11')", "status": "ACCEPTED", "respondedAt": "2026-11-22T09:30:00Z" },
    { "interviewerId": "ObjectId('6550...12')", "status": "PENDING", "respondedAt": null }
  ],
  "status": "SCHEDULED",
  "cancellationReason": null,
  "rescheduledFromInterviewId": null,
  "feedbackStatus": "PENDING",
  "createdBy": "ObjectId('6550...01')",
  "createdAt": "2026-11-22T09:00:00Z",
  "updatedAt": "2026-11-22T09:30:00Z"
}
```

##### Critical Indexes:
- `db.interviews.createIndex({ interviewerIds: 1, scheduledStart: 1, scheduledEnd: 1, status: 1 })`
- `db.interviews.createIndex({ scheduledStart: 1, status: 1 })`
- `db.interviews.createIndex({ applicationId: 1, roundIndex: 1 })`
- `db.interviews.createIndex({ candidateId: 1 })`

---

#### 2.6 Collection: `interview_feedback`
Stores the immutable scorecard submitted by an interviewer.

```json
{
  "_id": "ObjectId('6550...06')",
  "interviewId": "ObjectId('6550...05')",
  "applicationId": "ObjectId('6550...04')",
  "candidateId": "ObjectId('6550...02')",
  "interviewerId": "ObjectId('6550...11')",
  "recommendation": "STRONG_HIRE",
  "parameterRatings": [
    {
      "parameterName": "Data Modeling & Architecture",
      "score": 5,
      "comments": "Excellent knowledge of MongoDB indexing patterns and sharding strategies."
    },
    {
      "parameterName": "Concurrency & Performance",
      "score": 4,
      "comments": "Clear explanation of Virtual Threads vs Reactive programming."
    },
    {
      "parameterName": "Debugging & Problem Solving",
      "score": 5,
      "comments": "Quickly isolated race conditions in the live scenario."
    }
  ],
  "overallScore": 4.67,
  "strengths": "Deep systems thinking, strong communication, pragmatic design tradeoffs.",
  "weaknesses": "Limited recent experience with legacy Spring XML configs (non-issue for us).",
  "detailedNotes": "Alex demonstrated exceptional competence across both system design and hands-on coding.",
  "isSubmitted": true,
  "submittedAt": "2026-11-25T16:20:00Z",
  "createdAt": "2026-11-25T16:05:00Z",
  "updatedAt": "2026-11-25T16:20:00Z"
}
```

##### Critical Indexes:
- `db.interview_feedback.createIndex({ interviewId: 1, interviewerId: 1 }, { unique: true })`
- `db.interview_feedback.createIndex({ applicationId: 1 })`
- `db.interview_feedback.createIndex({ candidateId: 1 })`

---

#### 2.7 Collection: `interviewer_availability`
Defines recurring weekly working blocks and special blackout dates for an interviewer.

```json
{
  "_id": "ObjectId('6550...07')",
  "userId": "ObjectId('6550...11')",
  "weeklySlots": [
    { "dayOfWeek": "MONDAY", "startTime": "09:00", "endTime": "12:00" },
    { "dayOfWeek": "WEDNESDAY", "startTime": "14:00", "endTime": "17:00" },
    { "dayOfWeek": "FRIDAY", "startTime": "10:00", "endTime": "13:00" }
  ],
  "blackoutDates": [
    { "startDate": "2026-12-24T00:00:00Z", "endDate": "2026-12-31T23:59:59Z", "reason": "Winter Holidays" }
  ],
  "maxInterviewsPerWeek": 5,
  "maxInterviewsPerDay": 2,
  "updatedAt": "2026-11-10T12:00:00Z"
}
```

##### Critical Indexes:
- `db.interviewer_availability.createIndex({ userId: 1 }, { unique: true })`

---

#### 2.8 Collection: `notifications`
Stores in-app real-time notifications for users.

```json
{
  "_id": "ObjectId('6550...08')",
  "recipientId": "ObjectId('6550...11')",
  "type": "INTERVIEW_ASSIGNED",
  "title": "New Interview Scheduled",
  "message": "You have been assigned to interview Alex Mercer on Nov 25 at 3:00 PM UTC.",
  "linkUrl": "/interviewer/interviews/6550...05",
  "isRead": false,
  "createdAt": "2026-11-22T09:00:00Z"
}
```

##### Critical Indexes:
- `db.notifications.createIndex({ recipientId: 1, isRead: 1, createdAt: -1 })`

---

#### 2.9 Collection: `audit_logs`
Enterprise audit trail capturing security and state transition events.

```json
{
  "_id": "ObjectId('6550...09')",
  "actorId": "ObjectId('6550...01')",
  "actorEmail": "sarah.connor@acme.com",
  "actorRole": "ROLE_HR",
  "action": "STAGE_TRANSITION",
  "entityType": "APPLICATION",
  "entityId": "6550...04",
  "details": {
    "fromStage": "SHORTLISTED",
    "toStage": "INTERVIEW_SCHEDULED",
    "roundIndex": 2
  },
  "ipAddress": "192.168.1.50",
  "userAgent": "Mozilla/5.0 ...",
  "timestamp": "2026-11-22T09:00:00Z"
}
```

##### Critical Indexes:
- `db.audit_logs.createIndex({ entityType: 1, entityId: 1, timestamp: -1 })`
- `db.audit_logs.createIndex({ actorId: 1, timestamp: -1 })`
- `db.audit_logs.createIndex({ timestamp: -1 })`

---

#### 2.10 Collection: `departments`
Organizational departments configured by Admin.

```json
{
  "_id": "ObjectId('6550...10')",
  "name": "Engineering",
  "code": "ENG",
  "description": "Software, Infrastructure, and Security Engineering",
  "status": "ACTIVE",
  "createdAt": "2026-11-01T08:00:00Z"
}
```

##### Critical Indexes:
- `db.departments.createIndex({ name: 1 }, { unique: true })`
- `db.departments.createIndex({ code: 1 }, { unique: true })`

---

### 3. Concurrency Control & Double-Booking Guard Strategy

To guarantee that no interviewer is scheduled twice for overlapping times across concurrent requests:

```
[Schedule Request: Start S, End E, Interviewers [I1, I2]]
                     │
                     ▼
  ┌────────────────────────────────────────────────────────┐
  │ Query: Active Interview Overlap                        │
  │ status IN ['SCHEDULED', 'IN_PROGRESS']                 │
  │ AND interviewerIds IN [I1, I2]                         │
  │ AND scheduledStart < E                                 │
  │ AND scheduledEnd > S                                   │
  └────────────────────────┬───────────────────────────────┘
                           │
             ┌─────────────┴─────────────┐
             ▼ Exists                    ▼ None Found
   [Throw 409 Conflict]       ┌────────────────────────────┐
                              │ Execute Atomic Transaction │
                              │ Write Interview Document   │
                              │ with Compound Unique Lock  │
                              └────────────────────────────┘
```

#### Multi-Document Transaction Support:
For high-concurrency production deployments with MongoDB Replica Sets, the `InterviewSchedulingService` executes within a Spring `@Transactional` block. If another transaction commits an overlapping interview during the scheduling window, a serialization collision is detected and the request is safely rejected with a clear conflict message.
