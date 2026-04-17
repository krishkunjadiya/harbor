# Harbor Technical Deep-Dive

Integrated Academic, Career & Recruitment Platform  
Connecting Education to Employment Seamlessly

Krish Kunjadiya · Parva Vaghasiya · Dhyan Patel  
Mentor: Mr. Ravirajsinh Chauhan · P. P. Savani University

---

## 1) What Harbor Technically Represents

Harbor is a unified, multi-role platform where students, recruiters, and universities operate on one shared system and one shared data layer.

- Students: maintain profiles, apply for jobs, receive AI feedback.
- Recruiters: post jobs, track applicants, evaluate with AI support, move candidates across pipeline stages.
- Universities: verify credentials, monitor placement metrics, and analyze employability outcomes.

This is not just a website with role-based pages. It is a coordinated workflow engine with strict access control and cross-role data visibility rules.

---

## 2) Why the Existing Ecosystem Is Fragmented (Technical View)

Most existing tools are domain-specific and disconnected:

- Student records live in academic systems.
- Resume and job applications live in job portals.
- Recruiter pipelines live in ATS tools.

Result:

- Duplicate data entry.
- Inconsistent identity records.
- No guaranteed synchronization of status updates.
- Missing end-to-end analytics.

At system level, this is a data consistency and orchestration problem, not only a UX problem.

---

## 3) Core Challenge: Right Information, Right Stakeholder, Right Time

This statement maps to three engineering requirements:

1. Right information:
   - Role-filtered and context-aware views.
   - Structured, validated profile data instead of raw documents.

2. Right stakeholder:
   - Strong authentication (who the user is).
   - Strong authorization (what the user can read/write).

3. Right time:
   - Event-driven state updates.
   - Near real-time notifications.
   - Consistent pipeline state across dashboards.

---

## 4) Problem Statements and Their Technical Meaning

### 4.1 Disconnected Platforms
No single lifecycle state machine exists across student application, recruiter review, and university outcomes.

### 4.2 No Unified Student Profile
Without normalized schema, every platform reconstructs student identity from scratch.

Needed:

- Canonical profile model.
- Academic record validation model.
- Resume and skills as queryable fields.

### 4.3 Poor Recruiter Insights
Recruiters currently evaluate unstructured resumes.

Needed:

- Resume parsing.
- Skill extraction.
- Job-profile matching.
- Explainable scoring.

### 4.4 Zero Employability Tracking
Universities cannot compute reliable placement KPIs without complete lifecycle data.

Needed:

- Event and status history.
- Aggregation by batch, department, and company.

### 4.5 No Real-Time Interaction
Manual and delayed communications slow hiring cycles.

Needed:

- Triggered notifications on status transitions.
- Shared timeline views.

### 4.6 Weak Interview Preparation
Generic prep does not align with real job context.

Needed:

- AI-generated prep tied to job description + candidate profile + application stage.

---

## 5) Project Objectives as Engineering Deliverables

### 5.1 Unified Role-Based Platform
- One codebase.
- Role-specific UI routes.
- Server-side permission validation.

### 5.2 End-to-End Hiring Pipeline
Model a controlled state flow:

- Applied
- Shortlisted
- Interview Scheduled
- Interviewed
- Offer Released
- Accepted or Rejected

Each transition must be validated and audited.

### 5.3 AI Resume Analysis
Pipeline:

- Ingestion.
- Extraction/parsing.
- Prompt orchestration.
- Scoring and feedback generation.
- Persistent storage of output.

### 5.4 Interview Preparation System
Generate personalized question sets and guidance grounded in actual application context.

### 5.5 Secure Multi-Role Access
- Auth for identity.
- RBAC and row-level policies for data boundaries.
- Principle of least privilege.

### 5.6 Real-Time Notifications and Analytics
- Domain events on actions.
- Notification records and delivery channels.
- Role-specific KPI dashboards.

---

## 6) Scope: Included vs Excluded (Strategic Engineering)

### Included
- Student dashboard and applications.
- Recruiter hiring pipeline.
- University analytics and credential workflows.
- AI scoring and prep.
- Multi-role authentication and authorization.
- Notification framework.

### Excluded (Phase-wise Design)
- Native iOS/Android apps.
- Enterprise SSO.
- Billing/subscription modules.
- Third-party ATS integrations.

These exclusions avoid premature complexity and keep the first release focused on core workflow integrity.

---

## 7) Harbor Solution Architecture

### 7.1 Role-Based Architecture
Different user experiences on top of a shared domain model.

### 7.2 Shared Data Layer
A single relational source of truth for:

- Users and roles.
- Profiles and academic records.
- Jobs and applications.
- Interview events, feedback, offers.
- Notifications and analytics facts.

### 7.3 AI-Powered Insight Layer
AI acts as an assistive layer, not a replacement for workflow authority.

### 7.4 Full Lifecycle Coverage
All hiring stages remain traceable, auditable, and queryable in one system.

---

## 8) Methodology and Process Flow

1. User onboarding and role provisioning.
2. Profile creation and credential validation.
3. Job publishing and job discovery.
4. Application submission with structured profile context.
5. AI scoring and recommendation.
6. Recruiter screening and progression.
7. Interview scheduling and feedback capture.
8. Offer management and final decisions.
9. University-level outcome analytics updates.

Important design principle: snapshot critical profile data at application time so historical evaluations remain reproducible.

---

## 9) Layered System Architecture Deep Explanation

### 9.1 Presentation Layer (Next.js)
- Role-aware dashboards.
- SSR/modern rendering for performance and secure data handling.
- Modular route structure.

### 9.2 Application Layer (Server Actions)
- Business logic executes server-side.
- Reduced API surface complexity.
- Strong server-side validation and authorization gates.

### 9.3 Data Layer (Supabase + PostgreSQL)
- Relational consistency and ACID transactions.
- Built-in auth and file storage.
- Row-level security for role-safe access.

### 9.4 AI Layer (FastAPI + Gemini)
- Microservice-style AI orchestration.
- Resume scoring and interview prep generation.
- Decoupled AI service allows graceful degradation on failure.

---

## 10) Tech Stack Rationale

### Frontend
- Next.js + React: componentized, scalable UI and routing.
- TypeScript: type safety and lower runtime bug rate.
- Tailwind CSS + Radix UI: design consistency plus accessible primitives.

### Backend and Data
- Supabase: auth, storage, managed platform services.
- PostgreSQL: robust relational modeling and analytics queries.
- Server Actions: secure mutation and business logic orchestration.

### AI
- FastAPI: performant Python service layer.
- Gemini API: semantic evaluation and content generation.
- NLP parsing: converts raw resumes into structured signals.

### Testing and QA
- Jest: unit and integration-level confidence for logic modules.
- Playwright: end-to-end workflow validation across roles.
- CI/CD: automated quality gates before deployment.

---

## 11) Core Feature Engineering Details

### Role-Specific Dashboards
- Shared component system with role-specific data contracts.
- Personalized task views and metrics by role.

### End-to-End Job Lifecycle
- Controlled state transitions.
- Transition validation rules.
- Timeline logging for auditability.

### Real-Time Notifications
- Event creation on important state changes.
- User-targeted delivery and unread tracking.

### AI Resume Analyzer
- Parsing and feature extraction.
- Job relevance scoring.
- Explainable improvement feedback.

### Interview Prep Engine
- Candidate-job-context-driven prompt generation.
- Stage-aware mock interview content.

---

## 12) Output and Result Interpretation

A fully functional multi-role system should satisfy:

- Complete role journeys without manual intervention.
- Accurate authorization at UI, server, and data policy levels.
- Stable AI assistance with fallback mechanisms.
- Reliable event, status, and notification consistency.
- Analytics computed from authoritative transactional data.

---

## 13) Advantages of Harbor (Technical Value)

### Unified Ecosystem
Reduces integration overhead and synchronization errors.

### Faster Hiring
Automation and visibility reduce recruiter cycle time.

### AI Feedback Quality
Transforms unstructured resumes into actionable insights.

### Real-Time Awareness
Improves coordination through immediate status visibility.

### Secure Data Handling
Role-based controls protect sensitive information and maintain governance.

---

## 14) Limitations and Current Trade-offs

### No Mobile App
Web-first strategy; responsive design is mandatory until native channels are added.

### AI Scalability Constraints
Higher volume increases inference cost and latency; needs queued processing and optimization.

### Partial Governance
Advanced enterprise controls and audit tooling are future work.

### Polling-Based AI
Operationally simpler, but less efficient than event-driven architecture.

---

## 15) Future Scope as Technical Roadmap

### Mobile Applications
- API contract stabilization.
- Mobile auth/session hardening.
- Offline and sync strategies.

### AI Job Recommendations
- Content-based + behavioral hybrid matching.
- Feedback loops and continuous relevance tuning.

### Queue-Based AI Processing
- Message queue and worker pools.
- Retry strategy and dead-letter handling.
- Idempotent job processing.

### Advanced Analytics
- Materialized views and aggregation pipelines.
- Cohort, trend, and departmental performance insights.

### Enterprise Features
- SSO via SAML/OIDC.
- Multi-org hierarchy and delegated administration.
- Compliance-grade audit logging.

---

## 16) Real-World Applications

### Universities
Placement tracking, credential governance, and employability optimization.

### Recruitment Firms
Faster candidate filtering and pipeline management with AI support.

### EdTech Platforms
Career-readiness integration within learning pathways.

### Career Portals
Structured profile intelligence and direct employer matchmaking.

---

## 17) Conclusion (Technical)

Harbor is a shared-workflow, shared-data, AI-assisted hiring platform that addresses structural fragmentation between academia and recruitment.

Its core strengths are:

- Unified relational data model.
- Strict multi-role security.
- End-to-end workflow orchestration.
- Practical AI integration.
- Scalable architecture path for production growth.

From education to employment, Harbor creates a single operational thread across all stakeholders.

---

## 18) Viva-Ready Technical One-Liners

- The primary problem is not just UI fragmentation; it is cross-domain data inconsistency.
- Harbor solves this through a unified domain model and controlled lifecycle transitions.
- AI in Harbor is assistive and explainable, not authoritative.
- Security is enforced across frontend visibility, server validation, and row-level data policy.
- The scalability roadmap transitions from synchronous/polling operations to queue-driven asynchronous processing.

---

## 19) Suggested Metrics for Demonstration

- Application-to-shortlist conversion rate.
- Time-to-shortlist and time-to-offer.
- AI feedback turnaround latency.
- Interview scheduling turnaround.
- Offer acceptance rate.
- Department-wise placement ratio.
- Role-based unauthorized access blocks.
