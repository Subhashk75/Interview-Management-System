# Enterprise Interview Management System (IMS)
## UI/UX Design System & Dashboard Specifications

**Document:** `docs/ui-ux-design.md`  
**Status:** Approved Architectural Document  
**Version:** 1.0.0  
**Date:** November 2026  

---

### 1. Visual Direction & Design Tokens

The **Interview Management System (IMS)** is built around a modern, enterprise-grade SaaS design aesthetic, leveraging **Tailwind CSS** and **Shadcn UI** (Radix UI primitives).

#### Core Design Principles:
1. **High Information Density with Low Visual Noise:** Use clean borders, subtle shadows, and crisp typography to display complex recruitment matrices without overwhelming the user.
2. **Strict Role-Driven UI Segregation:** The application must never present a one-size-fits-all dashboard. Each user role is routed to an interface containing only their authorized widgets, navigation routes, and actionable triggers.
3. **State Transparency:** Every candidate, interview, and application explicitly communicates its current state via color-coded badges, progress steppers, and clear timestamps.
4. **Accessible & Responsive:** WCAG 2.1 AA compliant, keyboard accessible (`Tab`, `Esc`, Command palette shortcuts), responsive across desktop (1920x1080), laptop (1366x768), and tablet screens.

#### Color Palette & Typography:
- **Primary:** Deep Slate / Indigo (`hsl(222.2, 47.4%, 11.2%)` / `#0f172a` primary, `#3b82f6` accent blue).
- **Surface / Background:** Soft neutral gray (`#f8fafc` light background, `#ffffff` card surface).
- **Semantic Badges:**
  - `SCHEDULED`: Blue (`bg-blue-100 text-blue-800 dark:bg-blue-900/30 dark:text-blue-300`)
  - `IN_PROGRESS`: Amber (`bg-amber-100 text-amber-800 dark:bg-amber-900/30 dark:text-amber-300`)
  - `COMPLETED` / `HIRED`: Emerald (`bg-emerald-100 text-emerald-800 dark:bg-emerald-900/30 dark:text-emerald-300`)
  - `CANCELLED` / `REJECTED`: Rose (`bg-rose-100 text-rose-800 dark:bg-rose-900/30 dark:text-rose-300`)
  - `FEEDBACK_PENDING`: Violet (`bg-violet-100 text-violet-800 dark:bg-violet-900/30 dark:text-violet-300`)
- **Typography:** Inter or system sans-serif font family. Crisp tabular figures (`font-mono`) for dates, timestamps, and metric counts.

---

### 2. Common Application Shell Architecture

Every authenticated user interacts with a standard, responsive application layout:

```
┌────────────────────────────────────────────────────────────────────────┐
│ [IMS Logo]   Search (Cmd+K)          [🔔 3]   [Theme]   [User Avatar ▾]│
├──────────────┬─────────────────────────────────────────────────────────┤
│              │ Home > Dashboard                                        │
│  📊 Dashboard│ ─────────────────────────────────────────────────────── │
│  👥 Users    │                                                         │
│  💼 Jobs     │                                                         │
│  👤 Candidates│                    MAIN CONTENT AREA                    │
│  📅 Interviews│                                                         │
│  📈 Analytics│                                                         │
│  ⚙️ Settings │                                                         │
│              │                                                         │
└──────────────┴─────────────────────────────────────────────────────────┘
```

#### Layout Components:
1. **Collapsible Sidebar:** Role-tailored navigation items with active route highlighting, badge counters (e.g., unread items, pending reviews), and collapse toggle for focus mode.
2. **Top Navigation Bar:**
   - Global quick-search input.
   - Real-time Notifications Bell with unread counter badge and dropdown preview.
   - User Profile Dropdown: Name, Role badge, Department, "Change Password", and "Sign Out" button.
3. **Breadcrumbs:** Contextual hierarchy path for instant backward navigation.
4. **Command Palette (`Cmd+K` / `Ctrl+K`):** Fast keyboard-driven jump to candidate profiles, active jobs, or scheduled interviews.

---

### 3. Role-Specific Dashboard Specifications

---

#### 3.1 Admin Dashboard (`/admin`)

*Target Persona:* IT Administrator & Head of People Operations  
*Primary Objective:* Monitor system health, user provisioning, account security, and audit logs.

```
┌────────────────────────────────────────────────────────────────────────┐
│ Total Users: 124  │ HR Staff: 8  │ Interviewers: 95  │ Hiring Mgrs: 21 │
├───────────────────────────────────┬────────────────────────────────────┤
│ User Management Table             │ Recent System Activity             │
│ [ + Provision User ] [Filter ▾]   │ • 10:14 AM: Sarah (HR) added Alex M│
│ ───────────────────────────────── │ • 09:30 AM: David R changed pwd    │
│ Name    Email      Role   Status  │ • 08:45 AM: Admin added Engineering│
│ David R david@...  INTERV ACTIVE  │ • 08:00 AM: User login from 192... │
│ Sarah C sarah@...  HR     ACTIVE  │                                    │
│ [Edit] [Deactivate] [Reset Pwd]   │ [ View Full Audit Logs → ]         │
└───────────────────────────────────┴────────────────────────────────────┘
```

##### Key Widgets & Actions:
- **KPI Summary Cards:** Total Users, Active HR accounts, Active Interviewers, Hiring Managers, Pending Password Resets.
- **User Provisioning Modal:** Name, Email, Department, Role selection, and auto-generated temporary password.
- **User Actions:** Instant status toggle (Active/Inactive), role reassignment, and temporary password reset.
- **Audit Log Viewer:** Real-time stream of security and administrative actions with IP addresses and actor stamps.

---

#### 3.2 HR / Recruiter Dashboard (`/hr`)

*Target Persona:* Technical Recruiter & Recruitment Coordinator  
*Primary Objective:* Oversee active pipeline, coordinate multi-interviewer schedules, track pending feedback, and advance candidates.

```
┌────────────────────────────────────────────────────────────────────────┐
│ Active Jobs: 14 │ Total Candidates: 342 │ Today's Interviews: 6 │ Feedbk: 4
├────────────────────────────────────────────────────────────────────────┤
│ Quick Actions: [ + Schedule Interview ] [ + Add Candidate ] [ + Job ]  │
├───────────────────────────────────┬────────────────────────────────────┤
│ Today's Scheduled Interviews      │ Pending Scorecards Alert           │
│ • 10:00 AM: Alex Mercer (Tech R2) │ • David Ross (Backend Eng): 24h overdue│
│   Panel: David R, Elena M [Join]  │ • John Doe (Sys Design): 2h overdue│
│ • 02:00 PM: Priya Sharma (HR R1)  │ [ Send Scorecard Reminder Email ]  │
│   Panel: Sarah C [Join]           │                                    │
├───────────────────────────────────┴────────────────────────────────────┤
│ Candidate Pipeline Velocity (Kanban / Funnel View)                     │
│ [Applied: 85] ➔ [Screen: 24] ➔ [Interview: 12] ➔ [Offer: 3] ➔ [Hired: 1]│
└────────────────────────────────────────────────────────────────────────┘
```

##### Key Widgets & Actions:
- **Interactive Schedule Interview Wizard:** 3-step modal (Select Candidate & Job -> Choose Round & Time Slot -> Assign Interviewers with real-time conflict highlights).
- **Candidate Pipeline Kanban:** 12-stage visual board with drag-and-drop or one-click stage advancement.
- **Scorecard Turnaround Monitor:** Highlights interviewers with pending scorecards past the 24-hour SLA.
- **Resume Drawer:** Slide-out drawer displaying PDF resume preview side-by-side with candidate notes and interview logs.

---

#### 3.3 Interviewer Dashboard (`/interviewer`)

*Target Persona:* Senior Software Engineer, Engineering Manager, Product Lead  
*Primary Objective:* Review candidate background, view schedule, conduct interviews, and submit blind scorecards.

```
┌────────────────────────────────────────────────────────────────────────┐
│ Today's Interviews: 2 │ Upcoming This Week: 4 │ Pending Scorecards: 1  │
├────────────────────────────────────────────────────────────────────────┤
│ 🚨 ACTION REQUIRED: Scorecard Pending for Priya Sharma (Coding Round)  │
│ [ Complete Scorecard Now → ]                                           │
├───────────────────────────────────┬────────────────────────────────────┤
│ Today's Schedule                  │ My Availability Settings           │
│ • 03:00 PM - 04:00 PM             │ Weekly Capacity: 4 of 5 slots used │
│   Candidate: Alex Mercer          │ Mon: 09:00 - 12:00 [Active]        │
│   Round: System Architecture      │ Wed: 14:00 - 17:00 [Active]        │
│   [View Resume] [Open Meeting]    │ [ Update Availability Calendar ]   │
├───────────────────────────────────┴────────────────────────────────────┤
│ My Past Interview History & Evaluation Archive                         │
│ • Nov 18: James Liu (Frontend Lead) - Recommendation: STRONG_HIRE      │
│ • Nov 14: Maya Patel (Backend L4) - Recommendation: HIRE               │
└────────────────────────────────────────────────────────────────────────┘
```

##### Key Widgets & Actions:
- **Blind Scorecard Submission Form:**
  - Round instructions and evaluation rubric parameters displayed on top.
  - Interactive 1-5 star/button rating for each competency parameter.
  - Mandatory text inputs: Strengths (min 20 chars), Weaknesses (min 20 chars), Detailed notes.
  - Definitive recommendation selector (`STRONG_HIRE`, `HIRE`, `HOLD`, `REJECT`, `NEXT_ROUND`).
  - Strict Blind Privacy: Other panel members' submitted scores remain locked/hidden until the user clicks "Submit Scorecard".
- **Availability Calendar:** Weekly working slots and blackout holiday scheduler.

---

#### 3.4 Hiring Manager Dashboard (`/hiring-manager`)

*Target Persona:* Director of Engineering, VP of Product  
*Primary Objective:* Review team requisitions, approve candidate advances, inspect debrief scorecards, and monitor interviewer fatigue.

```
┌────────────────────────────────────────────────────────────────────────┐
│ Open Positions: 4 │ Candidates in Pipeline: 28 │ Approvals Pending: 2  │
├───────────────────────────────────┬────────────────────────────────────┤
│ Candidate Debriefs Ready          │ Interviewer Workload & Fatigue     │
│ • Alex Mercer (Lead Platform Eng) │ • David Ross: 5 interviews (CAP!)  │
│   Panel Consensus: 4.8 / 5.0      │ • Elena Miller: 2 interviews       │
│   Recommendations: 2 STRONG_HIRE  │ • Marcus Vance: 1 interview        │
│   [ Review Full Debrief & Approve ]│ [ Rebalance Interviewer Pools ]    │
├───────────────────────────────────┴────────────────────────────────────┤
│ Requisition Pipeline Funnel & Stage Duration Analytics                 │
│ Time to Hire: 21.4 days (Avg) | Offer Acceptance Rate: 84%             │
└────────────────────────────────────────────────────────────────────────┘
```

##### Key Widgets & Actions:
- **Consensus Debrief Matrix:** Visual heatmap showing how each interviewer evaluated the candidate across core competencies.
- **One-Click Approval / Rejection:** Approve candidate advancement to offer or request an additional tie-breaker round.
- **Interviewer Fatigue Gauge:** Recharts bar chart tracking weekly interviews conducted per engineer to prevent burnout.

---

#### 3.5 Candidate Portal (`/candidate`)

*Target Persona:* Job Applicant  
*Primary Objective:* Review interview invitation details, confirm attendance, or request a reschedule.

```
┌────────────────────────────────────────────────────────────────────────┐
│ Application: Lead Platform Engineer at Acme Corp                       │
│ Current Status: Round 2 - Technical & System Architecture              │
├────────────────────────────────────────────────────────────────────────┤
│ 📅 UPCOMING INTERVIEW DETAILS                                          │
│ Date: Wednesday, November 25, 2026                                     │
│ Time: 10:00 AM - 11:00 AM EST (Detected: Local Timezone)               │
│ Mode: Google Meet Video Call                                           │
│ Meeting Link: https://meet.google.com/abc-defg-hij                     │
│                                                                        │
│ Preparation Instructions:                                              │
│ "Please join with your favorite IDE open. We will design a distributed │
│ caching service together in the first half and do live coding in the   │
│ second half."                                                          │
│                                                                        │
│ [ Confirm Attendance ]    [ Request Reschedule ]                       │
└────────────────────────────────────────────────────────────────────────┘
```

##### Key Widgets & Actions:
- **Automatic Timezone Localization:** Automatically converts UTC interview times to candidate's browser timezone with clear timezone label.
- **One-Click Attendance Confirmation:** Confirms calendar presence.
- **Reschedule Request Dialog:** Enables candidate to submit preferred replacement dates and explanation notes directly to the recruiter.
- **Strict Privacy Barrier:** Scorecards, internal notes, and interviewer identities (if anonymous panels enabled) are strictly inaccessible.
