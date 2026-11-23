# Phase 1: Research & Existing Solution Analysis
## Document 02: Feature Comparison Matrix

**Project:** Interview Management System (IMS)  
**Author:** Senior Software Architect & Product Researcher  
**Status:** Approved Architectural Document  
**Date:** November 2026  

---

### Comparative Feature Matrix

The following matrix compares core interview management and recruitment operations across the eight benchmarked competitors against the planned **Interview Management System (IMS)**.

*Legend:*
* **Full (●):** Native, fully supported out-of-the-box.
* **Partial (◐):** Basic or semi-automated support requiring manual coordination.
* **Add-on / Tiered ($):** Requires expensive enterprise tier, specialized add-on, or 3rd-party plugin.
* **None (○):** Not natively supported or requires external workaround.

| Category / Feature | Greenhouse | Lever | Ashby | Workable | Zoho Recruit | Recruitee | SmartRecruiters | GoodTime | Proposed IMS (Our Solution) |
| :--- | :---: | :---: | :---: | :---: | :---: | :---: | :---: | :---: | :---: |
| **1. Candidate Management** | | | | | | | | | |
| Candidate Profile & Resume Storage | ● | ● | ● | ● | ● | ● | ● | ○ | **● (Full)** |
| Automatic Candidate Deduplication | ● | ● | ● | ◐ | ◐ | ◐ | ● | ○ | **● (Strict Email/Phone Index)** |
| Multi-Job Application Association | ● | ● | ● | ● | ● | ● | ● | ○ | **● (Dedicated Application Schema)** |
| Stage History & Timeline Audit Log | ● | ● | ● | ● | ◐ | ● | ● | ◐ | **● (Full Audit Trail)** |
| **2. Pipeline & Round Customization** | | | | | | | | | |
| Configurable Interview Rounds per Job | ● | ● | ● | ● | ● | ● | ● | ● | **● (Dynamic Round Config)** |
| Round Stage Gates (Enforced order) | ● | ◐ | ● | ◐ | ◐ | ◐ | ● | ● | **● (Validated State Machine)** |
| Reusable Pipeline Templates | ● | ● | ● | ● | ● | ● | ● | ● | **● (Preset & Custom Pipelines)** |
| **3. Interview Scheduling & Panels** | | | | | | | | | |
| Single & Multi-Interviewer Panel Scheduling | ● | ● | ● | ● | ◐ | ● | ● | ● | **● (Atomic Multi-Assignee)** |
| Conflict Detection (Double-booking check) | ● | ● | ● | ◐ | ◐ | ◐ | ● | ● | **● (Atomic Concurrency Guard)** |
| Meeting Link / Location Integration | ● | ● | ● | ● | ● | ● | ● | ● | **● (Online/Offline/Phone Modes)** |
| Timezone Normalization (Candidate vs Panel) | ● | ● | ● | ● | ◐ | ● | ● | ● | **● (UTC Storage with TZ Offsets)** |
| Interview Rescheduling & Cancellation | ● | ● | ● | ● | ● | ● | ● | ● | **● (Full State Transition & Log)** |
| **4. Interviewer Load & Assignment** | | | | | | | | | |
| Skill & Expertise-Based Assignment | ◐ | ◐ | ● | ○ | ◐ | ○ | ◐ | ● | **● (Skill Tag Matching)** |
| Interviewer Workload & Fatigue Monitoring | $ | ◐ | ● | ○ | ○ | ○ | ◐ | ● | **● (Native Workload Analytics)** |
| Dynamic Interviewer Swap / Replacement | $ | ○ | ● | ○ | ○ | ○ | ○ | ● | **● (Scheduled Re-assignment)** |
| **5. Structured Evaluation & Scorecards** | | | | | | | | | |
| Structured Rubric / Criteria Evaluation | ● | ● | ● | ◐ | ◐ | ◐ | ● | ○ | **● (Multi-Attribute Scoring 1-5)** |
| Standardized Recommendations (Strong Hire, etc.) | ● | ● | ● | ● | ● | ● | ● | ○ | **● (5-Tier Standard Recommendation)** |
| **Blind Feedback Privacy** (Hidden until submitted) | ● | ◐ | ● | ○ | ○ | ○ | ● | ○ | **● (Strict RBAC Blind Isolation)** |
| Qualitative Strengths & Weaknesses Notes | ● | ● | ● | ● | ● | ● | ● | ○ | **● (Dedicated Feedback Schema)** |
| **6. User Roles & Security** | | | | | | | | | |
| Distinct Role Dashboards (Admin/HR/Interviewer/Manager) | ◐ | ◐ | ● | ◐ | ◐ | ◐ | ◐ | ◐ | **● (Strict Role-Isolated UIs)** |
| Mandatory First-Login Password Reset | ◐ | ◐ | ◐ | ◐ | ◐ | ◐ | ◐ | ○ | **● (Enforced Flag on User Entity)** |
| Backend API RBAC Enforcement | ● | ● | ● | ● | ● | ● | ● | ● | **● (FastAPI Security Dependencies)** |
| Audit Trail of Administrative Actions | ● | ◐ | ● | ◐ | ◐ | ◐ | ● | ◐ | **● (Mongo `activity_logs` Collection)** |
| **7. Candidate Experience** | | | | | | | | | |
| Automated Email Invites & Calendar Invites | ● | ● | ● | ● | ● | ● | ● | ● | **● (Async Notification Dispatcher)** |
| Interview Instructions & Prep Materials | ● | ● | ● | ● | ◐ | ● | ● | ● | **● (Per-Round Instruction Payloads)** |
| Candidate Self-Service Portal / Status View | $ | ◐ | ● | ◐ | ◐ | ◐ | ◐ | ● | **● (Secure Tokenized Candidate View)** |
| **8. Analytics & Reporting** | | | | | | | | | |
| Pipeline Conversion & Stage Velocity | ● | ● | ● | ● | ◐ | ● | ● | ◐ | **● (Manager Analytics Dashboard)** |
| Interviewer Performance & Scorecard Turnaround | $ | ◐ | ● | ○ | ○ | ○ | ◐ | ● | **● (Pending Feedback SLA Tracking)** |
| System Health & Activity Metrics | ● | ◐ | ● | ◐ | ◐ | ◐ | ● | ○ | **● (Admin Metrics Dashboard)** |

---

### In-Depth Synthesis & Key Industry Trends

1. **Structured Hiring Beats Ad-Hoc Notes:**
   * Competitors that rely on unstructured free-form comments (e.g., standard ATS notes) suffer from high inter-rater variance and bias.
   * Greenhouse and Ashby succeed because they require structured attribute scoring (e.g., Problem Solving, Technical Breadth, System Design, Communication) with explicit recommendations.
   * **IMS Decision:** We will implement structured scorecard kits linked directly to interview rounds.

2. **The Scheduling Concurrency Bottleneck:**
   * In fast-growing companies, multiple recruiters frequently attempt to book interviewers simultaneously.
   * In systems without atomic concurrency guards (such as legacy Zoho Recruit or basic custom systems), double-booking occurs, requiring awkward cancellations and candidate friction.
   * **IMS Decision:** Concurrency-safe scheduling with database-enforced compound index conflict checks and transactional slot locking.

3. **Interviewer Burnout & Workload Equity:**
   * Interview fatigue is one of the top causes of senior engineer turnover in tech organizations.
   * Ashby and GoodTime differentiate themselves heavily on interviewer workload tracking.
   * **IMS Decision:** Native Interviewer Workload metrics on the Manager and HR dashboards showing completed, scheduled, and pending interviews per interviewer.

4. **Security & Role Hygiene:**
   * In enterprise recruiting, interviewers should never see candidate salary, offers, or colleagues' private comments until their own evaluations are committed.
   * **IMS Decision:** Strict backend RBAC and blind feedback isolation implemented at the API and repository layer, not merely hidden in the frontend UI.
