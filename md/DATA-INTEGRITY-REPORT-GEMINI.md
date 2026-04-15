# Data Integrity & Audit Report: Harbor Project

**Report Generated:** February 14, 2026  
**Specialist:** Data Integrity Sub-Agent  
**Overall Status:** 🔴 **CRITICAL DISCREPANCIES DETECTED**  
**Action Required:** High

---

## 1. Executive Summary
A comprehensive audit of the `seed-csv` directory was performed on 29 relational tables containing 1,417 records. The audit successfully validated referential integrity (foreign keys) but identified **severe data value drift** and **aggregate count mismatches**. The dataset currently contains conflicting identities and inconsistent academic records for identical unique identifiers (UUIDs).

---

## 2. Key Audit Metrics
| Metric | Value | Status |
| :--- | :---: | :--- |
| **Total Files Audited** | 29 | ✅ Complete |
| **Total Records Scanned** | 1,417 | ✅ Complete |
| **Referential Integrity** | 100% | ✅ Passed |
| **Attribute Consistency** | 32% | ❌ Failed |
| **Aggregate Synchronization** | 15% | ❌ Failed |
| **Data Risk Level** | **High** | ⚠️ Critical |

---

## 3. Critical Findings

### 🔴 Identity Corruption (Master Data Divergence)
The identity of users is inconsistent across tables. The `profiles.csv` table (System Master) often disagrees with entity-specific tables (`students`, `faculty`, `recruiters`).

*   **Recruiter Anomaly:** In `profiles.csv`, many recruiter IDs are linked to individual names (e.g., "Ava Smith"), while in `recruiters.csv`, the same IDs are linked to company names (e.g., "TechCorp").
*   **Student Name Drift:** 48 out of 50 students have different last names or first names between `profiles.csv` and `student_full_records.csv`.
*   **Email Mismatches:** Authentication emails in `profiles` do not match academic communication emails in 96% of student records.

### 🔴 Statistical & Aggregate Mismatches
Hardcoded counters in parent tables do not reflect the actual number of child records.

*   **Course Enrollment:** `courses.csv` entries claim an average of 70+ students (`total_students`), but `course_enrollments.csv` contains only **1** record per course.
*   **Faculty Distribution:** `departments.csv` faculty counts are manually entered and do not match the actual number of faculty records assigned to those department IDs.

### 🔴 Academic Record Inconsistency
*   **GPA Fragmentation:** A student's GPA can differ by over 1.0 points depending on whether it is pulled from `students.csv`, `transcripts.csv`, or `student_full_records.csv`.
*   **Source of Truth Conflict:** There is no clearly defined master for academic standing, leading to potential logic errors in graduation or honor roll modules.

---

## 4. Quantitative Discrepancy Matrix
| Category | Mismatch Count | Impacted Tables |
| :--- | :---: | :--- |
| **Personal Names** | 115 | `profiles`, `students`, `faculty`, `academic_records` |
| **Emails** | 108 | `profiles`, `students`, `faculty`, `recruiters` |
| **GPAs** | 50 | `students`, `transcripts`, `student_full_records` |
| **Company/Entity Names** | 52 | `profiles`, `recruiters`, `universities` |
| **Status Conflicts** | 50+ | `profiles`, `course_enrollments`, `job_applications` |

---

## 5. Root Cause Analysis
The discrepancies are a result of **Template Drift**. The data was likely generated using independent mock templates for each functional module (Auth, Academic, Career) rather than a unified data generation pipeline. While UUIDs were shared across templates to maintain links, the individual attributes were randomized per file.

---

## 6. Actionable Recommendations

### **Immediate Fixes (High Priority)**
1.  **Identity Sync:** Execute a script to force `profiles.csv` values for `name`, `email`, and `phone` into all child tables.
2.  **Aggregate Recalculation:** Update `total_students` and `total_faculty` counts based on a literal count of rows in the enrollment and faculty tables.
3.  **GPA Consolidation:** Standardize on `transcripts.csv` as the single source of truth for GPA across the app.

### **Architectural Improvements (Medium Priority)**
1.  **Specific Status Naming:** Rename the `status` column in transaction tables to `enrollment_status`, `application_status`, etc.
2.  **Normalization:** Remove redundant `student_name` and `email` columns from transaction tables and rely on SQL Joins to `profiles` for this data.

---
**End of Report**
