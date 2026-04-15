# Harbor Platform - Complete Project Report

Date: 2026-04-03  
Project Type: Full-stack web platform (Final Year Project / Internship / Portfolio Case Study)

## 1. Project Overview

### Project Name
Harbor - Unified Career, Recruitment, and Academic Credential Platform

### Problem Statement
Students, recruiters, and universities often operate in disconnected systems:
- Students manage resumes in one tool, apply to jobs in another, and practice interviews elsewhere.
- Recruiters struggle to maintain a consistent candidate pipeline with reliable analytics.
- Universities and faculty maintain academic records and achievements separately from employability workflows.

This fragmentation causes duplicated effort, weak visibility, and low trust in candidate readiness data.

### Objective of the System
Harbor was built to provide one integrated platform that:
- Connects student profile growth, interview preparation, and job application workflows.
- Gives recruiters end-to-end visibility from posting jobs to scheduling interviews and exporting reports.
- Enables universities and faculty to manage records, courses, and recognition (Credentials/credentials) tied to employability.
- Uses AI services to improve resume quality and interview readiness.

### Target Users
1. Students: Build profile, upload/analyze resume, practice interviews, apply to jobs, track applications.
2. Recruiters: Post jobs, review and move applications through pipeline, schedule interviews, search/save candidates, generate reports.
3. Faculty and University Admins: Manage courses, enrollments, assignments, academic records, and credentialing workflows.

## 2. Key Features

### Student Dashboard and Career Workspace
The student workspace is implemented under the student route group and exposes a unified dashboard with:
- Achievement tracking (Credentials, credentials, engagement indicators).
- Job discovery and application submission.
- Resume analyzer and resume builder launch.
- Interview preparation modules (mock sessions, evaluator, question bank, performance tracking).

How it works end-to-end:
1. Student authentication resolves profile context.
2. Dashboard data is assembled server-side from profile, Credentials, credentials, and applications.
3. UI renders summary cards plus role-relevant quick actions.
4. Student can branch into jobs, profile, Credentials, resume, or interview prep.

### Recruiter Dashboard and Hiring Operations
Recruiter features are organized by org-scoped routes and include:
- Dashboard KPIs (active jobs, applications, shortlisted, hired).
- Job posting and lifecycle management (draft/active/closed).
- Application management with status transitions.
- Candidate views with filtering and save/unsave actions.
- Interview scheduling, rescheduling, and cancellation.
- Reports generation in CSV/Excel/PDF with history persistence.

How it works end-to-end:
1. Recruiter role is validated at page and server-action levels.
2. Recruiter/company context is resolved to include company-wide job visibility.
3. Applications are fetched and enriched with student and job data.
4. Status updates trigger persistence and notification side effects.
5. Scheduled interviews are persisted only for eligible candidates (shortlisted/accepted).
6. Reports are generated server-side and logged into report history.

### Faculty and University Dashboards
University and faculty portals provide institution-side controls:
- Admin dashboard for student/faculty/department overviews and quick operations.
- Faculty dashboard for course-oriented teaching analytics and activity.
- Course, enrollment, assignment, records, and project pages.

How it works end-to-end:
1. University/faculty user context is resolved from profile and role metadata.
2. Dashboard queries gather counts and recent operational items.
3. Faculty pages load scoped data (courses taught, enrollments, assignments, records).
4. Record verification and grading actions update academic data with audit fields.

### Interview Preparation Module
Interview preparation is implemented as a multi-module feature set:
- Mock Interview: role-based question sessions, AI evaluation per answer, persisted session history.
- Question Bank: filter/search questions by role/category/difficulty, bookmark and practice tracking.
- Answer Evaluator: one-off AI evaluation for custom question/answer pairs.
- Performance Tracker: trends, weak topics, and recent activity from practice/session data.
- Resources and Prep Cards: defined in module structure, with planned expansion.

Interview Prep revamp implemented in the latest phase:
1. The old static interview prep experience was replaced by modular, feature-specific routes:
   - Mock Interview
   - Question Bank
   - Answer Evaluator
   - Performance Tracker
2. A dedicated interview-prep schema was introduced for persistence:
   - questions
   - mock_sessions
   - bookmarks
   - practiced
3. Role detection was made dynamic using profile and skill signals (major, program, student skills, resume keywords, and user skills).
4. Question generation now combines database role-tagged questions with optional personalized AI question injection.
5. Session outcomes are persisted with structured JSON payloads and scored summaries.
6. Practice intelligence was added through bookmark toggles, practiced-question upserts, weak-topic detection, and score-trend analytics.

How it works end-to-end:
1. Role detection infers target interview role from major/program/skills/resume keywords.
2. Questions are fetched from DB and optionally prepended with a personalized AI question.
3. Each answer is evaluated through AI endpoint and normalized into structured feedback.
4. Final session is saved with score and JSON payloads.
5. Practiced-question records are upserted for progress analytics.

### Resume Analyzer
The resume analyzer supports file upload, asynchronous feedback, and profile persistence.

How it works end-to-end:
1. Student uploads resume to Supabase Storage.
2. Student row is updated with resume URL and analysis placeholders.
3. App triggers Python worker endpoint for resume analysis.
4. Worker parses document text and runs Gemini schema-constrained analysis.
5. Structured feedback is saved into student resume fields and rendered in UI.
6. UI polling handles delayed responses and retry flow when worker is unavailable.

### Job and Application System
The hiring core includes jobs and applications with full lifecycle support.

How it works end-to-end:
1. Recruiter creates job posting with role, compensation, requirements, and skills.
2. Student discovers active jobs and submits application (with optional cover letter).
3. Application record is created and job application counters are updated.
4. Recruiter updates status through reviewing/shortlist/reject/accept transitions.
5. Shortlisted/accepted candidates can be scheduled for interview.
6. Students track status in their applications view and can withdraw pending flows.

## 3. System Architecture

### High-Level Architecture
Harbor uses a layered architecture:
1. Frontend: Next.js App Router with role-based route groups and client/server component split.
2. Backend (application): Next.js server actions and API routes for business workflows.
3. Database: Supabase PostgreSQL with RLS, Auth, and Storage buckets.
4. AI integration: FastAPI Python worker for Gemini-powered analysis/evaluation/generation.
5. External integration: Reactive Resume SSO bridge.

### Data Flow Between Components
Typical request path:
1. User request enters Next.js middleware for authentication/session handling.
2. Role and page-level guards determine access.
3. Server actions query/mutate Supabase tables.
4. Client components hydrate and subscribe to realtime channels where needed.
5. For AI tasks, Next.js API routes proxy calls to Python worker endpoints.
6. Worker responses are normalized and persisted back to DB.

### Role-Based System Design
Routing and logic are partitioned by role:
- Student: student dashboard, jobs, applications, profile, interview prep, resume modules.
- Recruiter: org routes for dashboard, jobs, applications, candidates, interviews, analytics, reports.
- University/faculty: org routes for admin and faculty operations.

Role control is enforced at multiple layers:
1. Middleware route checks.
2. Page-level redirects.
3. Server action authorization checks against current profile context.
4. Database-level RLS policies.

## 4. Tech Stack

### Frontend
- Next.js 15 (App Router)
- React 19
- TypeScript 5
- Tailwind CSS 4
- Radix UI component primitives
- Phosphor icons
- React Hook Form + Zod
- TanStack Query

### Backend (Application Layer)
- Next.js server actions for domain mutations/queries
- Next.js API routes for AI proxying and SSO flows
- React cache-based auth/profile helpers for request-scoped deduplication

### Database
- Supabase PostgreSQL
- Row Level Security policies
- Supabase Storage buckets (avatars, resumes, credentials)
- Realtime subscriptions for selected recruiter flows

### Authentication
- Supabase Auth (auth.users)
- Extended user model in profiles
- Middleware session refresh and route gating
- Profile-driven role resolution (student/recruiter/university/admin, faculty via role metadata)

### AI Integration
- Python FastAPI worker
- Google Gemini (gemini-2.5-flash) via structured JSON generation
- Retry logic (tenacity), schema enforcement, fallback behavior

### Third-Party and Utility Tooling
- XLSX for Excel/CSV export workflows
- jsPDF + autotable for PDF reports
- sentence-transformers/scikit-learn/scikit-fuzzy in worker for advanced analytics/matching modules

## 5. Database Design

### Core Identity Model
The system uses Supabase auth as the base identity layer and extends it with role-aware profile tables:
1. auth.users: authentication identities (managed by Supabase).
2. profiles: canonical application user table (id, email, user_type, role, metadata).
3. students, recruiters, universities, faculty, admin_staff: role-specific extensions linked by profile identifiers.

Why this design:
- Keeps auth concerns separate from business profile concerns.
- Supports role-specific fields without overloading a single users table.
- Enables role-based querying and RLS policy scoping.

### Job Marketplace Tables
1. jobs: recruiter/company postings, status, views/applications counters, compensation/requirements.
2. job_applications: student-to-job relationship with status workflow and timestamps.
3. saved_candidates: recruiter-level shortlisting/bookmarking layer for candidate curation.

Why this design:
- Normalized one-to-many job/application structure.
- Supports pipeline states and recruiter dashboards.
- Keeps candidate curation independent from final application status.

### Interview and Practice Tables
Interview preparation data model is explicit in migration scripts:
1. questions: role-tagged question bank.
2. mock_sessions: session-level summary plus serialized questions/answers JSON.
3. bookmarks: student-question bookmarks.
4. practiced: per-question practice score/timestamp.

Operational interview scheduling uses interviews table via server actions and queries, with fields inferred from implementation usage:
- recruiter_id, student_id, job_id, scheduled_at, status, meeting_link, notes, duration/type usage in UI.

Why this design:
- Separates practice/interview-readiness from recruiter interview scheduling.
- JSON fields preserve detailed attempt artifacts while keeping relational anchors for analytics.

### Required Key Tables (Requested)
1. users: represented by auth.users + profiles composite model.
2. jobs: job catalog and recruiter ownership.
3. applications: job_applications workflow state.
4. interviews: scheduled recruiter-student interactions.
5. questions: interview prep bank with tags and difficulty.
6. mock_sessions: persisted session outcomes and answer-level context.

### Additional Functional Tables
- generated_reports: recruiter report history with format/type/date-range metadata.
- notifications: user-targeted in-app notification stream.
- resume_user_links, resume_sso_audit, resume_sso_consumed_tokens: secure SSO integration tracking.
- user_skills, skills_taxonomy, student_taxonomy_skills: skill intelligence and discoverability.

## 6. Core Functional Flows

### Flow A: Student Applies for a Job
1. Student opens jobs page and active jobs are fetched server-side.
2. Student clicks Apply and submits optional cover letter.
3. Server action validates duplicate application conditions.
4. job_applications row is inserted with pending status.
5. Job application counters are incremented (RPC/fallback path).
6. Recruiter notification is created.
7. Student sees the entry in applications page with status tracking.

### Flow B: Recruiter Posts a Job
1. Recruiter opens job creation page and enters job metadata.
2. Client gathers selected skills and requirements.
3. Server action createJob persists posting with recruiter context.
4. Job appears in recruiter jobs list and dashboard stats.
5. Status can be updated across draft/active/closed lifecycle.

### Flow C: Recruiter Reviews Applications
1. Recruiter applications page loads company-scoped applications.
2. Data includes student and job context for decision-making.
3. Recruiter transitions statuses (pending -> reviewing -> shortlisted/rejected -> accepted).
4. Status update persists and student notification is generated.
5. Shortlisted/accepted candidates can be routed into interview scheduling.

### Flow D: Interview Scheduling
1. Recruiter opens interviews module, with eligible candidates derived from shortlisted/accepted applications.
2. Recruiter selects candidate and associated job, date/time, type, and meeting link.
3. Server action validates recruiter ownership and candidate eligibility.
4. interviews row is inserted with scheduled status.
5. Reschedule and cancel operations update the same record with authorization checks.

### Flow E: Interview Preparation
1. Student enters interview prep and role is inferred from profile and skill signals.
2. Question bank returns role-relevant questions from the questions table using category/difficulty/role filters.
3. Optional personalized question is generated by AI and injected into the mock session set.
4. Student can bookmark questions and mark questions as practiced from the question bank.
5. Student answers each question; evaluator endpoint returns score, strengths, weaknesses, improved answer.
6. Session summary score is computed and saved to mock_sessions with questions_json and answers_json.
7. practiced table is upserted for per-question last_score and last_practiced_at.
8. Performance module aggregates trends, weak topics, and recent activity.

## 7. AI Features

### Resume Analysis
Input:
- studentId, fileUrl, filePath, documentType

Pipeline:
1. Worker extracts resume text from file.
2. Gemini prompt evaluates content quality, keyword match, structure, ATS compatibility.
3. Response is enforced to JSON schema with required fields.
4. App persists score and full feedback in student profile record.

Output:
- overall_score
- metrics object
- strengths and improvements
- found/missing keywords
- strategic suggestions

### Interview Answer Evaluation
Input:
- question, answer, role

Prompt behavior:
- AI is instructed to return strict JSON with score out of 10, exactly 2 strengths, exactly 2 weaknesses, and a 3-sentence improved answer.

Output normalization:
- Score is clamped to valid range.
- Missing fields are patched with deterministic fallback defaults.

### Personalized Question Generation
Input:
- role, top skills (capped list)

Prompt behavior:
- Generate exactly one practical scenario-based interview question under length constraints.

Output:
- Single question string for live session injection.

### Interview Prep AI Endpoints (Revamped)
1. Answer evaluation endpoint:
   - Accepts question, answer, and role.
   - Returns strict structured feedback used directly in mock session progression.
2. Personalized question endpoint:
   - Accepts role plus top skills.
   - Returns one role- and skill-specific practical interview question.
3. Both endpoints enforce authenticated access and timeout/error handling with actionable fallback messaging.

### Prompt and Reliability Strategy
1. Structured JSON schemas reduce brittle natural-language parsing.
2. Retry with exponential backoff increases resilience.
3. Timeout handling and mock fallback behavior keep UI responsive during worker/API outages.

## 8. Challenges Faced

### 1. Recruiter Analytics and Scope Mismatch
Problem:
- Recruiter analytics and application counts became inconsistent when filtering only by recruiter_id.

Resolution:
- Introduced company-aware scoping and policy fixes so recruiter and company contexts stay synchronized.

### 2. Reports Data Integrity Issues
Problem:
- Candidate/report joins had student profile mapping inconsistencies and poor empty-state behavior.

Resolution:
- Fixed profile/student mapping in report queries and ensured downloadable outputs even for zero-row ranges.

### 3. Authentication Latency and Redundant Calls
Problem:
- Repeated auth/profile fetches and broad middleware checks increased navigation latency.

Resolution:
- Added request-scoped auth/profile caching and narrowed middleware checks to routes that require gatekeeping.

### 4. Build Instability in Local Windows Environment
Problem:
- Stale .next artifacts and concurrent processes caused intermittent ENOENT/runtime build issues.

Resolution:
- Added clean build script chain and process hygiene guidance for stable build runs.

### 5. Skill Taxonomy Discovery Gaps
Problem:
- User searches for concrete skills (Python/C++) did not align with taxonomy title semantics.

Resolution:
- Added enhanced matching and backfill strategy using taxonomy example fields and seed data.

### 6. Interview Prep Modernization from Static to Data-Driven
Problem:
- Earlier interview prep UX contained static/mock content and incomplete action wiring.

Resolution:
- Rebuilt interview prep into a full data-driven module stack with:
   - role detection,
   - database question bank,
   - AI answer evaluator,
   - personalized question generation,
   - persisted mock sessions,
   - bookmark/practice tracking,
   - performance analytics dashboard.

### 7. Student Flow Completeness Gaps (Audit Findings)
Problem:
- Some student-facing flows remained partially implemented (for example saved jobs persistence and some university-student action wiring).

Resolution:
- Documented issue list and prioritized targeted persistence/integration work packages.

## 9. Improvements and Optimizations

### Performance Improvements
1. Parallelized server-side dashboard queries via Promise.all.
2. Cached auth/profile lookup per request to avoid duplicate network calls.
3. Reduced middleware overhead by short-circuiting non-protected paths.
4. Added indexes and optimized recruiter/company query paths.

### UX Improvements
1. Rich dashboard cards and segmented tabs for role-specific workflows.
2. Realtime recruiter application updates with browser notification support.
3. Resume analyzer polling/retry UX for long-running AI operations.
4. Report preview metrics and live refresh for confidence before export.
5. Interview prep was redesigned into modular, task-specific pages (mock interview, evaluator, question bank, performance) with persisted progress.

### Code Structure Improvements
1. Clear separation of responsibilities:
   - database.ts for query-heavy reads.
   - mutations.ts for write and workflow actions.
   - interview.ts for prep-domain logic.
   - reports.ts for export/report workflows.
2. Shared utilities for date formatting, auth caching, and Supabase client setup.
3. Type interfaces for core domain entities and interview modules.
4. Interview-prep logic is now isolated in dedicated server actions and typed models, reducing coupling with generic student pages.

## 10. Security and Access Control

### Role-Based Access
- Middleware and page guards restrict protected routes to authenticated users.
- Role checks are repeated in sensitive server actions (student/recruiter/university context validation).

### Route Protection
- Middleware matcher excludes static assets/API where appropriate and applies auth checks to protected and dynamic org routes.
- Auth page redirects route signed-in users to role-specific dashboards.

### Data Validation and Authorization
1. Server actions validate ownership and role before mutation.
2. Interview scheduling validates candidate eligibility and job ownership.
3. Resume SSO endpoints sanitize return path and enforce role restrictions.
4. SSO verify/link endpoints require shared-secret authorization.

### Database Security (RLS)
- Tables use row-level policies for own-data and role-scoped access patterns.
- generated_reports policies restrict report history to creator recruiter.
- Interview prep tables enforce student-only access for personal practice data.
- Resume SSO audit/token-consumption tables are service-role controlled.

### Token and Replay Protection
- Resume SSO token claims include jti and exp.
- Consumed token store blocks replay by unique jti persistence.
- Audit logs capture issuance/verification/link actions with metadata.

## 11. Future Enhancements

1. Persist student saved jobs with dedicated table and hydration logic.
2. Formalize interviews table migration in repository SQL to remove schema drift risk.
3. Move Python worker in-memory async job state to Redis or DB-backed queue for horizontal scale.
4. Complete assignment submission and enrollment mutation wiring in all student/faculty paths.
5. Add first-class organization/tenant entity for cleaner multi-org boundaries.
6. Add comprehensive observability: structured logs, tracing, and alerting for AI and DB paths.
7. Expand interview prep planned modules (resources/prep cards) into fully dynamic flows.
8. Add compliance-grade export/deletion workflows for institutional governance requirements.

## 12. Conclusion

Harbor delivers a substantial full-stack implementation that unifies academic achievement data, student readiness tooling, and recruiter hiring operations in one platform.

What was achieved:
1. Multi-role architecture with practical student, recruiter, and university workflows.
2. End-to-end job and application pipeline with interview scheduling and reporting.
3. AI-enhanced resume analysis and interview coaching integrated into core student experience.
4. Strong security posture through layered authorization, RLS, and SSO hardening.
5. Ongoing optimization work that improved query efficiency, dashboard consistency, and operational reliability.

Impact:
Harbor moves beyond a static academic portal or isolated job board by creating a connected employability ecosystem where verified achievements, practical readiness, and hiring decisions are part of the same data and product surface.

This makes the system suitable not only as a final-year project submission, but also as a portfolio-grade case study and technical reference for production-oriented full-stack design.

