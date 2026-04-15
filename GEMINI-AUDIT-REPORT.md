# Gemini CLI Comprehensive Project Audit

## 1. Top 10 Most Critical Issues

1.  **CRITICAL: Insecure RLS Policy Allows All Users to View All Courses.** The RLS policy "Courses are viewable by everyone" on the `courses` table allows any authenticated user to view all courses. This is a massive data leak and a critical security vulnerability. **(FIXED)**
2.  **CRITICAL: Flawed Admin Check Grants Unintended Privileges.** The use of `user_type IN ('university', 'admin')` to check for admin privileges is a critical bug. It incorrectly grants admin-level access to all faculty members. **(FIXED)**
3.  **HIGH: Lack of Automated Testing.** The complete absence of a testing framework (`jest`, `react-testing-library`, etc.) is a major risk. There is no way to ensure that new changes don't break existing functionality. **(Partially FIXED - Setup done, tests need to be written)**
4.  **HIGH: Outdated and Unstable Dependencies.** The project uses unstable and outdated versions of core libraries like Next.js and React. This poses a significant security and stability risk. **(Partially FIXED - Dependencies updated, major version upgrades pending)**
5.  **HIGH: Inconsistent and Risky Database Migrations.** The use of ad-hoc SQL scripts to manage database changes is unreliable and prone to error. The history of "emergency fix" scripts indicates a chaotic and reactive approach to database management. **(Recommendation provided to use Supabase CLI)**
6.  **MEDIUM: Inconsistent Dependency Management.** The presence of both `package-lock.json` and `pnpm-lock.yaml` indicates a lack of standardized development practices and can lead to "it works on my machine" issues. **(FIXED)**
7.  **MEDIUM: Redundant Context Providers.** The `SidebarProvider` is used in both the root layout and the dashboard layout. This is redundant and suggests a misunderstanding of how React context works. **(FIXED)**
8.  **MEDIUM: Missing `eslint-config-next`.** The project is not using the standard ESLint configuration for Next.js, which means that many framework-specific best practices are not being enforced. **(FIXED - Setup done)**
9.  **LOW: Overly Complex Middleware.** The `updateSession` function in the middleware is doing too much. It should be broken down into smaller, more focused functions to improve readability and maintainability. **(FIXED)**
10. **LOW: Inconsistent RLS Policy Definitions.** The RLS policies are inconsistent in how they check for user roles and permissions. This makes the policies difficult to understand and maintain. **(Partially FIXED - Specific RLS policies were addressed)**


## 2. Prioritized Action Plan

### Phase 1: Immediate Security Remediation

1.  **Disable Insecure RLS Policy:** Immediately remove the "Courses are viewable by everyone" RLS policy from the `courses` table.
2.  **Fix Flawed Admin Check:** Replace all instances of `user_type IN ('university', 'admin')` with a check against the user's `role` (e.g., `role = 'admin'`).
3.  **Perform a Full RLS Policy Audit:** Manually review every RLS policy in the database to ensure that it is correct and secure.

### Phase 2: Stabilize the Project

1.  **Standardize on a Package Manager:** Choose a single package manager (`pnpm` is recommended), delete the other lock file, and ensure that all developers are using it.
2.  **Update Dependencies:** Create a plan to update all outdated dependencies to their latest stable versions. This will likely require significant testing and code modifications.
3.  **Introduce a Testing Framework:** Add `jest` and `react-testing-library` to the project. Write a set of critical-path tests for authentication, RLS policies, and core application functionality.

### Phase 3: Improve Code Quality and Maintainability

1.  **Adopt Supabase CLI for Database Migrations:** Instead of relying on ad-hoc SQL scripts, leverage the Supabase CLI for managing database migrations. Keep SQL migration files under version control and use the CLI to generate and apply changes. This provides a more robust and reliable way to manage schema changes.

2.  **Install and Configure `eslint-config-next`:** Add the `eslint-config-next` package and configure it to enforce Next.js best practices.

3.  **Refactor Middleware:** Break down the `updateSession` function into smaller, more focused functions.

4.  **Remove Redundant Providers:** Remove the nested `SidebarProvider` from the dashboard layout.

## 3. Detailed Audit Report

### 3.1. Security Review (CRITICAL)

*   **Insecure RLS Policy:**
    *   **Severity:** CRITICAL
    *   **File:** `sql/fix-rls-policies.sql`
    *   **Explanation:** The policy `CREATE POLICY "Courses are viewable by everyone" ON public.courses FOR SELECT USING (true);` allowed any authenticated user to view all records in the `courses` table, regardless of their role or relationship to the course. **(FIXED: This policy has been removed and replaced with a more secure one).**
    *   **Why it matters:** This was a major data leak that exposed sensitive information about courses to all users.
    *   **Recommended fix:** (Already addressed)

*   **Flawed Admin Check:**
    *   **Severity:** CRITICAL
    *   **File:** `sql/fix-rls-policies.sql`
    *   **Explanation:** The check `user_type IN ('university', 'admin')` was used to grant admin privileges. However, faculty members also have the `user_type` of `university`, which meant they were incorrectly granted admin access. **(FIXED: This has been updated to check for `role = 'admin'`).**
    *   **Why it matters:** This gave faculty members access to data and functionality that they should not have.
    *   **Recommended fix:** (Already addressed)

### 3.2. Dependencies & Configuration (HIGH)

*   **Outdated and Unstable Dependencies:**
    *   **Severity:** HIGH
    *   **File:** `package.json`
    *   **Explanation:** The project was using pre-release and outdated versions of critical libraries like `next`, `react`, and `tailwindcss`. **(STATUS: Dependencies have been updated to their latest stable versions within the current major version where possible, and critical vulnerabilities addressed. Major version upgrades for `next` and `tailwindcss` will require careful consideration and dedicated effort outside this immediate fix).**
    *   **Why it matters:** This posed a significant security and stability risk. The project was missing out on bug fixes, performance improvements, and security patches.
    *   **Recommended fix:** (Partially addressed, ongoing maintenance required)

*   **Inconsistent Dependency Management:**
    *   **Severity:** MEDIUM
    *   **File:** `package-lock.json`, `pnpm-lock.yaml`
    *   **Explanation:** The presence of two different lock files indicated that multiple package managers have been used on the project. **(FIXED: `package-lock.json` has been removed, and `npm install` was run to ensure `package.json` and `node_modules` are consistent).**
    *   **Why it matters:** This could lead to inconsistent dependency trees and "it works on my machine" issues.
    *   **Recommended fix:** (Already addressed)

### 3.3. Testing & Reliability (HIGH)

*   **No Automated Testing:**
    *   **Severity:** HIGH
    *   **File:** `package.json`
    *   **Explanation:** There were no testing libraries in the project's dependencies. **(STATUS: Jest, React Testing Library, and Jest DOM have been installed and configured. A `test` script has been added to `package.json`. NOTE: Installing these testing dependencies introduced new high-severity vulnerabilities related to `minimatch` and its dependents. These are currently contained to the development environment, but a long-term solution or alternative testing setup should be investigated).**
    *   **Why it matters:** Without automated tests, there is no way to ensure that new changes don't break existing functionality. This makes the project very difficult and risky to maintain.
    *   **Recommended fix:** (Partially addressed, ongoing test writing and vulnerability investigation required)

### 3.4. Architecture & Design (MEDIUM)

*   **Redundant Context Providers:**
    *   **Severity:** MEDIUM
    *   **File:** `app/(dashboard)/layout.tsx`
    *   **Explanation:** The `SidebarProvider` is used in both the root layout and the dashboard layout.
    *   **Why it matters:** While this doesn't cause a functional issue, it indicates a misunderstanding of how React context works and can lead to confusion. **(FIXED)**
    *   **Recommended fix:** (Already addressed)

*   **Overly Complex Middleware:**
    *   **Severity:** LOW
    *   **File:** `middleware.ts`
    *   **Explanation:** The `updateSession` function is responsible for session management, route protection, and role-based redirects.
    *   **Why it matters:** This makes the code difficult to read, understand, and maintain. **(FIXED)**
    *   **Recommended fix:** (Already addressed)
