# Harbor Resume Demo Automation Implementation Plan (2026-04-08)

## 1. Objective
Create a one-command, repeatable demo that:
- Logs into Harbor as a student
- Launches Resume Builder through SSO
- Creates or opens a resume automatically
- **Fills comprehensive resume sections and fields** (Basics, Experience, Education, Skills, Certifications, Projects, Languages, Interests)
- Exports PDF
- Records video output for professor demonstration

Primary outcome:
- A stable 8 to 15 minute automated demo run demonstrating full resume builder capability that can be repeated before presentation day.

## 2. Current Baseline (Already Present)
The project already includes critical building blocks:
- Harbor SSO init endpoint: `app/api/resume/sso/init/route.ts`
- Harbor SSO verify endpoint: `app/api/resume/sso/verify/route.ts`
- Student launch route: `app/(student)/student/resume-builder/page.tsx`
- Resume Builder SSO launch handler: `reactive_resume/src/routes/sso/launch.tsx`
- Resume creation dialog and sample option: `reactive_resume/src/dialogs/resume/index.tsx`
- Playwright dependency at root and benchmark script pattern in `scripts/nav-benchmark.js`

Implication:
- We do not need to build auth and integration from scratch.
- We only need a demo automation layer and recording pipeline.

## 3. Demo Modes
### Mode A: Comprehensive Field Fill (Recommended for class)
Flow:
1. Open Harbor
2. Login student
3. Click Open Resume Builder
4. Create sample resume
5. Open builder and fill extensive resume fields:
   - **Basics**: full name, headline, email, phone, location, summary
   - **Experience**: add 2 to 3 positions, fill role/company/location/dates and 2 to 3 bullets each
   - **Education**: add 2 to 3 entries, fill school/degree/field/dates/score
   - **Skills**: add 5 to 10 skill entries
   - **Certifications**: add 2 to 3 certification entries
   - **Projects**: add 1 to 2 projects with description and URL
   - **Languages**: add 2 to 3 languages with proficiency
   - **Interests**: add 2 to 3 interests
6. Export PDF
7. Download and verify

Expected time:
- 8 to 15 minutes typical
- 15 to 25 minutes on slow systems

### Mode B: Ultra-Comprehensive Fill (Optional)
Flow:
- Same as Mode A plus additional sections:
  - **Awards**: add 1 to 2 awards
  - **Publications**: add 1 to 2 publications
  - **Volunteer**: add 1 to 2 volunteer experiences
  - **References**: add contact references
  - **Custom Sections**: add custom fields if available

Expected time:
- 20 to 30 minutes

Recommendation:
- Use Mode A for live class presentation (comprehensive but bounded).
- Keep Mode B as extended proof-of-capability recording.

## 4. Target Deliverables
1. Automation script: `scripts/resume-demo-automation.js`
2. Helper script for process startup/shutdown: `scripts/run-resume-demo.ps1`
3. npm scripts in root `package.json`:
   - `demo:resume`
   - `demo:resume:record`
4. Output folders:
   - `artifacts/demo/videos/`
   - `artifacts/demo/screenshots/`
   - `artifacts/demo/pdfs/`
   - `artifacts/demo/logs/`
5. Quick-run guide in this document

## 5. Technical Design
### 5.1 Runtime
- Browser automation: Playwright (Chromium)
- Recording: Playwright context video recording
- Artifact capture: screenshot on each major milestone and on failure

### 5.2 Data Strategy
Use any existing student account:
- Provide credentials via environment variables or config file: `HARBOR_DEMO_EMAIL` and `HARBOR_DEMO_PASSWORD`
- Script will reuse provided credentials each run (no account creation needed)
- Ensure account has valid student role profile

Resume strategy:
- If existing resumes are present, open latest resume and continue
- If no resume is present, create sample resume from dialog action
- Resume is timestamped for unique identity on each run (avoids slugs conflicts)

### 5.3 Selector Strategy (Reliability)
Prefer selectors by role/text/label over CSS chains:
- `getByRole(...)`
- `getByText(...)`
- `getByLabel(...)`

Avoid brittle selectors tied to generated class names.

### 5.4 Credential Configuration
The script accepts credentials from any existing student account via environment variables:
```bash
# Set before running the script
export HARBOR_DEMO_EMAIL="your-student@university.edu"
export HARBOR_DEMO_PASSWORD="your-password"
npm run demo:resume
```

Alternative: Create a `.env.demo` file in root:
```
HARBOR_DEMO_EMAIL=your-student@university.edu
HARBOR_DEMO_PASSWORD=your-password
HARBOR_BASE_URL=http://localhost:3000
RESUME_APP_URL=http://localhost:3001
```

Then:
```bash
npm run demo:resume
```

Security note:
- Credentials are only used during automation run
- Never commit credentials to git
- Use `.env.demo` in `.gitignore` for safety

### 5.5 Failure Handling
- Step timeout boundaries (hard and soft)
- Retry once for slow navigation transitions
- Save screenshot and current URL on failure
- Write structured JSON log entry per step

## 6. Detailed Implementation Plan
## Phase 1: Script Scaffold (0.5 day)
Tasks:
1. Create `scripts/resume-demo-automation.js`
2. Add config section:
   - harbor base URL
   - resume app URL
   - student credentials (from env or config, not hardcoded)
   - timeouts
   - record flag
   - artifact output paths
   - field fill data (sample values for all sections)
3. Add reusable helpers:
   - `waitForSettled(page)`
   - `takeStepShot(page, name)`
   - `logStep(name, status, duration, details)`
   - `loadConfig()` to read env variables or config file
   - `fillFormField(page, label, value)` for generic form input
   - `waitForFieldUpdate(page, selector, expectedValue)` for validation
4. Create a centralized selector map for all form fields

Output:
- Script runs and can open Harbor home page and create artifact folders
- Config loading from environment variables demonstrated
- Form field filling helpers verified against at least one sample field

## Phase 2: Harbor Login + SSO Launch (0.5 day)
Tasks:
1. Automate Harbor login using any existing student credentials (from env or config)
2. Navigate to student dashboard
3. Click `Open Resume Builder`
4. Validate redirect to resume builder SSO route then dashboard/builder

Output:
- Bot reaches reactive_resume authenticated area without manual login using provided student account.

## Phase 3: Resume Creation + Comprehensive Field Filling (1 to 1.5 days)
Tasks:
1. Detect if resume list exists
2. If none, trigger `Create a Sample Resume`
3. Open latest resume in builder
4. Systematically fill all major resume sections:
   - **Basics**: name, headline, email, phone, location, summary (all fields)
   - **Experience**: add 2 to 3 complete positions (role, company, location, start/end dates, 2-3 bullets each)
   - **Education**: add 2 to 3 education entries (school, degree, field, start/end dates, score)
   - **Skills**: add 5 to 10 individual skills
   - **Certifications**: add 2 to 3 certification entries with issuer and date
   - **Projects**: add 1 to 2 projects with title, description, and URL
   - **Languages**: add 2 to 3 languages with proficiency level
   - **Interests**: add 2 to 3 interests/hobbies
5. Wait for autosave/idle between section updates (critical for UI reliability)
6. Verify each section updates in the PDF preview panel

Output:
- Resume is filled comprehensively across all major sections
- PDF preview shows full formatted content
- Bot demonstrates ability to navigate and fill complex nested UI forms

## Phase 4: Export + Artifacts (0.5 day)
Tasks:
1. Trigger export to PDF
2. Save download into `artifacts/demo/pdfs/`
3. Ensure video and logs are persisted
4. Save final screenshot showing completed resume

Output:
- Video, PDF, and logs available after one run.

## Phase 5: One-command Runner (0.5 day)
Tasks:
1. Create `scripts/run-resume-demo.ps1`:
   - start Harbor + resume apps
   - wait for health/port readiness
   - run automation script with comprehensive field filling
   - capture full run log with timing for each major section
   - stop background processes gracefully
2. Add npm script entries for easy launch
3. Add environment config examples in script comments

Output:
- Single command execution for full comprehensive demo.

## 7. Estimated Effort
- Development: 2 to 3 days (increased due to comprehensive field coverage)
- Selector mapping for all form fields: 0.5 to 1 day
- Stabilization and retry/timing tuning: 1 to 1.5 days
- Dry-runs before final presentation: 3 to 5 trial runs

Total practical effort:
- 4 to 5 days for polished professor-ready comprehensive automation.

## 8. Expected Runtime Per Demo
Mode A (Comprehensive Field Fill - recommended):
- 8 to 15 minutes typical
- 15 to 25 minutes on slow/unstable network or heavy autosave delays

Mode B (Ultra-Comprehensive - optional):
- 20 to 30 minutes typical
- 30+ minutes on slow systems

## 9. Acceptance Criteria
The implementation is complete when all conditions pass:
1. Single command starts full automated flow
2. Harbor login and SSO launch succeed without manual intervention
3. Resume is created/opened and edited automatically
4. PDF export file is generated
5. Video recording file is generated
6. On failure, screenshot + logs are available for diagnosis

## 10. Risk Register and Mitigation
Risk: Selector breaks after UI update
- Mitigation: role/text-based selectors and centralized selector map

Risk: Timing flakiness on slow device
- Mitigation: robust wait strategy and bounded retries

Risk: SSO token expiry in long run
- Mitigation: run flow immediately after launch, increase TTL only for demo if needed

Risk: Export/download popup behavior changes
- Mitigation: fallback to printer URL or alternate export trigger path

## 11. Dry-Run Protocol (Before Professor Demo)
1. Run full demo 24 hours before presentation
2. Verify artifacts exist:
   - video
   - final PDF
   - final screenshot
3. Run once again on presentation day morning
4. Keep latest successful artifacts as backup video proof

## 12. Live Presentation Strategy
Primary:
- Show pre-recorded stable video (best quality, no risk)

Secondary:
- Run live one-command automation in class if asked

Fallback:
- If live run fails due to network or port issue, immediately show pre-recorded artifact and explain logs.

## 13. Next Action Checklist
1. Implement `scripts/resume-demo-automation.js`
2. Implement `scripts/run-resume-demo.ps1`
3. Add npm scripts in root `package.json`
4. Execute 3 dry-runs and tune waits/selectors
5. Freeze a final professor-ready recording

---
Owner: Harbor Team
Status: Ready for implementation
Date: 2026-04-08
