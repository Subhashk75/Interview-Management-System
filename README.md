# HireSync Pro — Enterprise Interview Management System

An enterprise-grade **Interview Management System (IMS)** and recruitment coordination engine built with TypeScript, Node.js/Express, MongoDB, and React.

---

## 🌟 Core Architectural Features

1. **Multi-Panelist Scheduling Engine (Interval Intersection):**
   - Discretizes working hours into fine-grained intervals.
   - Computes time intersections across multiple panel interviewers ($\bigcap_{i=1}^N \text{FreeTime}(Interviewer_i)$).
   - Enforces configurable inter-interview buffer times (e.g., 15 minutes) and daily/weekly interviewer quotas.

2. **Calendar Integration Layer (Google Calendar & Microsoft 365):**
   - Unified `ICalendarProvider` abstraction.
   - Google Calendar API v3 OAuth integration with automatic Google Meet link creation.
   - Proactive token refresh buffer (refreshes 5 minutes prior to expiry).
   - Built-in Mock adapter for offline testing and rapid local development.

3. **Anti-Bias Scorecard Blinding Gate:**
   - Evaluative scorecards with multi-competency 1–5 rubrics and overall hiring recommendations (`STRONG_NO` to `STRONG_YES`).
   - **Anti-Bias Blinding Policy:** Peer evaluations and scores submitted by other panelists remain strictly redacted/blinded until the requesting interviewer submits their own evaluation, preventing conformity bias and anchoring.

4. **Multi-Layer Concurrency & Double-Booking Prevention:**
   - Distributed mutex lock checking on slot reservation.
   - MongoDB database overlap range query (`startTime < requestedEnd && endTime > requestedStart`).
   - Optimistic Concurrency Control using atomic `version` integer increments.

5. **Self-Healing In-Memory Engine & Auto-Seeder:**
   - Connects to local/cloud MongoDB when configured.
   - Automatically falls back to an embedded in-memory MongoDB server (`mongodb-memory-server`) if no local daemon is running.
   - Pre-seeds realistic enterprise data (Organisations, Recruiters, Interviewers, Jobs, Rounds, Candidates, and Scorecards) on first launch.

---

## 🚀 Quick Start & Running Locally

### Prerequisites
- Node.js v18+ (tested on Node.js v24)
- npm v9+

### 1. Start Backend
```bash
cd backend
npm run dev
```
*The backend API will run on `http://localhost:5000` with the healthcheck available at `http://localhost:5000/api/v1/health`.*

### 2. Start Frontend
```bash
cd frontend
npm run dev
```
*The interactive dashboard will run on `http://localhost:5173`.*

---

## 👥 Demo Logins & Test Accounts

The system includes pre-configured demo accounts across all three major organizational roles. Use the top navbar role-switcher to switch personas with 1-click:

| Role | Name | Email | Password | Responsibilities |
| :--- | :--- | :--- | :--- | :--- |
| **Recruiter** | Alex Rivera | `recruiter@acme.com` | `Password123!` | Candidate pipeline, interview scheduling, conflict management |
| **Interviewer** | David Kim | `david.kim@acme.com` | `Password123!` | Technical coding panelist, blinded scorecard submissions |
| **Admin** | Sarah Connor | `admin@acme.com` | `Password123!` | Executive oversight, unblind reviews, capacity management |

---

## 📂 Project Structure

```text
interview-management-system/
├── backend/
│   ├── src/
│   │   ├── config/              # DB connection & environment schema
│   │   ├── middleware/          # JWT Auth, RBAC, Zod validation, error handler
│   │   ├── models/              # Candidate, Job, InterviewRound, Interview, Scorecard, User
│   │   ├── modules/
│   │   │   ├── auth/            # JWT authentication & user accounts
│   │   │   ├── calendar/        # Google Calendar API adapter & fallback service
│   │   │   ├── candidates/      # Candidate profile management
│   │   │   ├── dashboard/       # Aggregated KPIs and schedule stats
│   │   │   ├── jobs/            # Job requisitions & round sequencing
│   │   │   ├── scheduling/      # Slot generation & atomic booking engine
│   │   │   └── scorecards/      # Anti-bias blinded evaluation system
│   │   ├── scripts/             # Database seeder script
│   │   ├── utils/               # AES-256 encryption, logger, API envelopes
│   │   ├── app.ts               # Express app instance
│   │   ├── routes.ts            # Master API router
│   │   └── server.ts            # Server entry point
│   ├── package.json
│   └── tsconfig.json
├── frontend/
│   ├── src/
│   │   ├── components/          # Navbar, Sidebar, ScheduleModal, ScorecardModal
│   │   ├── context/             # AuthContext with 1-click role switcher
│   │   ├── pages/               # Dashboard, Candidates, Interviews, Scorecards, Interviewers, Settings
│   │   ├── services/            # Axios API client
│   │   ├── types/               # TypeScript interfaces & domain types
│   │   ├── App.tsx
│   │   └── main.tsx
│   ├── package.json
│   └── vite.config.ts
├── package.json                 # Monorepo scripts
└── README.md
```
