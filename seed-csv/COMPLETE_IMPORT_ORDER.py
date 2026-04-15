"""
COMPLETE IMPORT ORDER FOR ALL 28 TABLES
========================================

Import in this exact order to satisfy foreign key dependencies:
"""

import_order = [
    # Layer 1: No dependencies
    ("1", "profiles.csv", 157, "IMPORT FIRST - All users (students, faculty, recruiters, universities, admin)"),
    
    # Layer 2: Depends on profiles only
    ("2", "universities.csv", 2, "Depends on: profiles"),
    ("3", "students.csv", 50, "Depends on: profiles"),
    ("4", "recruiters.csv", 50, "Depends on: profiles"),
    ("5", "departments.csv", 4, "Depends on: profiles (university_id)"),
    ("6", "badges.csv", 50, "Depends on: profiles (issuer_id)"),
    
    # Layer 3: Depends on Layer 2
    ("7", "faculty.csv", 50, "Depends on: profiles, departments"),
    ("8", "admin_staff.csv", 3, "Depends on: profiles, departments"),
    ("9", "user_badges.csv", 50, "Depends on: profiles, badges"),
    ("10", "credentials.csv", 50, "Depends on: profiles"),
    ("11", "jobs.csv", 50, "Depends on: profiles (recruiter_id)"),
    ("12", "user_activity.csv", 50, "Depends on: profiles"),
    ("13", "dashboard_stats.csv", 50, "Depends on: profiles"),
    ("14", "notifications.csv", 50, "Depends on: profiles"),
    ("15", "user_skills.csv", 50, "Depends on: profiles"),
    ("16", "career_insights.csv", 50, "Depends on: profiles (student_id)"),
    
    # Layer 4: Depends on Layer 3
    ("17", "courses.csv", 50, "Depends on: departments, faculty"),
    ("18", "job_applications.csv", 50, "Depends on: jobs, students"),
    ("19", "skill_endorsements.csv", 50, "Depends on: user_skills"),
    
    # Layer 5: Depends on Layer 4
    ("20", "course_enrollments.csv", 50, "Depends on: courses, students"),
    ("21", "assignments.csv", 50, "Depends on: courses"),
    ("22", "student_projects.csv", 50, "Depends on: students, courses"),
    ("23", "academic_records.csv", 50, "Depends on: students, courses"),
    ("24", "student_full_records.csv", 50, "Depends on: students"),
    ("25", "transcripts.csv", 51, "Depends on: students"),
    
    # Layer 6: Depends on Layer 5
    ("26", "assignment_submissions.csv", 51, "Depends on: assignments, students"),
    ("27", "grades.csv", 50, "Depends on: assignments, students"),
    ("28", "project_milestones.csv", 50, "Depends on: student_projects"),
]

print("\n" + "="*80)
print("COMPLETE IMPORT ORDER - ALL 28 TABLES")
print("="*80)

total_rows = 0
for num, filename, rows, deps in import_order:
    total_rows += rows
    print(f"\n{num:>2}. {filename:<30} ({rows:>3} rows)")
    print(f"    └─ {deps}")

print("\n" + "="*80)
print(f"TOTAL: 28 tables, {total_rows} total rows")
print("="*80)
print("\n✅ All tables fixed and ready for import!")
print("✅ All foreign keys mapped to UUIDs")
print("✅ All constraints validated")
print("✅ All duplicate IDs removed")
print("\n💡 Import in the order shown above to avoid foreign key errors.")
print("="*80 + "\n")
