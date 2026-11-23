# Enterprise Interview Management System (IMS)

[![Java 21](https://img.shields.io/badge/Java-21%2B-blue.svg)](https://www.oracle.com/java/)
[![Spring Boot 3.x](https://img.shields.io/badge/Spring%20Boot-3.x-brightgreen.svg)](https://spring.io/projects/spring-boot)
[![Next.js](https://img.shields.io/badge/Next.js-App%20Router-black.svg)](https://nextjs.org/)
[![TypeScript](https://img.shields.io/badge/TypeScript-5.x-blue.svg)](https://www.typescriptlang.org/)
[![MongoDB](https://img.shields.io/badge/MongoDB-7.x-green.svg)](https://www.mongodb.com/)
[![Tailwind CSS](https://img.shields.io/badge/Tailwind%20CSS-3.x-38B2AC.svg)](https://tailwindcss.com/)
[![Shadcn UI](https://img.shields.io/badge/Shadcn%20UI-Radix-black.svg)](https://ui.shadcn.com/)

A modern, enterprise-grade, centralized **Interview Management System (IMS)** designed to streamline the complete talent acquisition interview lifecycle. The system provides role-isolated dashboards, automated multi-interviewer scheduling, atomic concurrency-safe conflict prevention, blind scorecard evaluations, and recruitment pipeline analytics.

---

## 🏛️ System Architecture & Technology Stack

### Backend
- **Language / Runtime:** Java 21 LTS (Virtual Threads enabled)
- **Framework:** Spring Boot 3.x, Spring Web, Spring Security 6
- **Database Access:** Spring Data MongoDB, MongoDB 7.x (MongoDB Atlas / Docker)
- **Security:** Stateless JWT Authentication (Access + Refresh Tokens), BCrypt password hashing, method-level authorization (`@PreAuthorize`), mandatory first-login password change enforcement
- **Validation & Mappers:** Jakarta Bean Validation, MapStruct, Lombok
- **API Documentation:** OpenAPI 3.0 / Swagger UI (`springdoc-openapi`)
- **Testing:** JUnit 5, Mockito, Spring Boot Test

### Frontend
- **Framework:** Next.js (App Router) with TypeScript (Strict Mode)
- **Styling & Components:** Tailwind CSS, Shadcn UI (Radix UI primitives), Lucide React icons
- **Form Management:** React Hook Form + Zod schema validation
- **State & Data Fetching:** TanStack Query (React Query v5), Zustand
- **Data Visualizations:** Recharts (Recruitment funnel, stage velocity, interviewer workload)

### Infrastructure & Deployment
- **Containerization:** Multi-stage Docker builds, Docker Compose orchestration
- **Environment Management:** Environment-based `.env` configuration for staging and production

---

## 👥 Role-Based Access Control (RBAC)

The system enforces strict permission boundaries across 5 distinct user roles:

1. **Admin (`ROLE_ADMIN`):** Account provisioning with temporary passwords, role management, user activation/deactivation, organizational departments, and centralized audit logging.
2. **HR / Recruiter (`ROLE_HR`):** Candidate creation, resume parsing/upload, job requisition management, multi-interviewer scheduling with conflict checks, pipeline stage progression, and recruitment velocity reports.
3. **Interviewer (`ROLE_INTERVIEWER`):** Assigned interview calendar, candidate resume review, availability slot management, structured evaluation submission, and **blind scorecard isolation** (cannot see peer scores until their own is submitted).
4. **Hiring Manager (`ROLE_HIRING_MANAGER`):** Department requisition monitoring, candidate debrief review, hiring approvals, and team interviewer workload/fatigue analytics.
5. **Candidate (`ROLE_CANDIDATE`):** View interview schedule in localized browser timezone, access video meeting links and round instructions, and submit rescheduling requests.

---

## 📑 Comprehensive Documentation Index

All architectural research, specifications, and execution roadmaps are fully documented:

### Phase 1: Research & Development (R&D)
- [Competitor Analysis (`research/competitor-analysis.md`)](file:///E:/My%20Project/Interview%20Management%20System/research/competitor-analysis.md): Deep-dive analysis of Greenhouse, Lever, Ashby, Workable, Zoho Recruit, SmartRecruiters, BambooHR, and GoodTime.
- [Feature Comparison Matrix (`research/feature-comparison.md`)](file:///E:/My%20Project/Interview%20Management%20System/research/feature-comparison.md): Feature benchmark matrix, opportunities, and scope boundaries.
- [Business Requirements Specification (`research/business-requirements.md`)](file:///E:/My%20Project/Interview%20Management%20System/research/business-requirements.md): Functional and non-functional requirements for all roles and the 12-stage pipeline.
- [Detailed User Workflows (`research/user-workflows.md`)](file:///E:/My%20Project/Interview%20Management%20System/research/user-workflows.md): Step-by-step user interaction flows with sequence diagrams.
- [Technical Recommendations (`research/technical-recommendations.md`)](file:///E:/My%20Project/Interview%20Management%20System/research/technical-recommendations.md): Concurrency control strategy, MongoDB indexing, and security architecture.

### System Architecture & Planning
- [System Architecture Specification (`docs/architecture.md`)](file:///E:/My%20Project/Interview%20Management%20System/docs/architecture.md): Modular monolith blueprint, clean layered structure, and security design.
- [Database Design & Data Model (`docs/database-design.md`)](file:///E:/My%20Project/Interview%20Management%20System/docs/database-design.md): Complete MongoDB collection schemas, relationships, indexes, and concurrency guard.
- [REST API Specification (`docs/api-documentation.md`)](file:///E:/My%20Project/Interview%20Management%20System/docs/api-documentation.md): OpenAPI-aligned endpoint specifications, request/response DTOs, and error codes.
- [UI/UX Design System (`docs/ui-ux-design.md`)](file:///E:/My%20Project/Interview%20Management%20System/docs/ui-ux-design.md): Design tokens, component specs, and wireframes for all 5 role dashboards.
- [Implementation Roadmap (`docs/implementation-plan.md`)](file:///E:/My%20Project/Interview%20Management%20System/docs/implementation-plan.md): 12-sprint execution plan with detailed tasks and acceptance criteria.
- [Testing Strategy & QA Plan (`docs/testing-strategy.md`)](file:///E:/My%20Project/Interview%20Management%20System/docs/testing-strategy.md): Testing pyramid, 16 critical test scenarios, and concurrency tests.
- [Production Deployment Guide (`docs/deployment-guide.md`)](file:///E:/My%20Project/Interview%20Management%20System/docs/deployment-guide.md): Docker, Docker Compose, and MongoDB Atlas configuration.
- [Development Progress Tracker (`docs/development-progress.md`)](file:///E:/My%20Project/Interview%20Management%20System/docs/development-progress.md): Live tracker tracking phase and sprint milestones.

---

## ⚡ Getting Started (Local Development)

### Prerequisites
- Java 21 LTS JDK
- Maven 3.9+
- Node.js 20+ & npm
- Docker & Docker Compose (or local MongoDB 7.x)

### Running with Docker Compose
```bash
# Clone the repository and navigate to the project root
git clone <repo-url>
cd "Interview Management System"

# Build and start MongoDB, Spring Boot backend, and Next.js frontend
docker compose up --build
```
- Frontend UI: `http://localhost:3000`
- Backend REST API: `http://localhost:8080/api/v1`
- Swagger UI / OpenAPI: `http://localhost:8080/swagger-ui.html`
- MongoDB: `localhost:27017`

---

## 🔒 Security Baseline
- **Zero-Trust Backend Authorization:** Spring Security enforces role permissions at the API controller and service layer via `@PreAuthorize`.
- **First-Login Enforcement:** Accounts created with temporary passwords cannot access any business functionality until their password is changed.
- **Blind Evaluation Privacy:** Interviewers cannot view peer scorecards until their own scorecard is submitted, eliminating anchoring bias.
- **Atomic Double-Booking Prevention:** Compound unique indexes and transactional reservation prevent simultaneous scheduling collisions.
