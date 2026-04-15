"""
Deep Cross-Table Data Mismatch Analysis
Performs comprehensive validation across all CSV tables
"""

import csv
from collections import defaultdict
from pathlib import Path
import json

# Base directory
BASE_DIR = Path(r"E:\KRISH(PPSU)\Semester 6\Major Project\Harbor\seed-csv")

# Results storage
mismatches = []

def read_csv(filename):
    """Read CSV file and return list of dictionaries"""
    filepath = BASE_DIR / filename
    with open(filepath, 'r', encoding='utf-8') as f:
        return list(csv.DictReader(f))

def add_mismatch(category, source_table, source_column, record_id, record_name, expected, actual, difference, impact):
    """Add a mismatch to the results"""
    mismatches.append({
        'category': category,
        'source': f"{source_table}.{source_column}",
        'record_id': record_id,
        'record_name': record_name,
        'expected': expected,
        'actual': actual,
        'difference': difference,
        'impact': impact
    })

print("=" * 80)
print("CROSS-TABLE DATA VALIDATION ANALYSIS")
print("=" * 80)

# ============================================================================
# 1. FACULTY DATA MISMATCHES
# ============================================================================
print("\n[1/10] Analyzing Faculty Data Mismatches...")

faculty_data = read_csv('faculty.csv')
courses_data = read_csv('courses.csv')
enrollments_data = read_csv('course_enrollments.csv')

# Count actual courses per instructor
actual_courses_per_instructor = defaultdict(int)
for course in courses_data:
    actual_courses_per_instructor[course['instructor_id']] += 1

# Count actual students per instructor (via their coacourses)
actual_students_per_instructor = defaultdict(set)
for enrollment in enrollments_data:
    # Find course
    for course in courses_data:
        if course['id'] == enrollment['course_id']:
            instructor_id = course['instructor_id']
            actual_students_per_instructor[instructor_id].add(enrollment['student_id'])
            break

faculty_course_mismatches = 0
faculty_student_mismatches = 0

for faculty in faculty_data:
    fac_id = faculty['id']
    fac_name = faculty['name']
    
    # Check courses
    expected_courses = int(faculty['total_courses'])
    actual_courses = actual_courses_per_instructor.get(fac_id, 0)
    
    if expected_courses != actual_courses:
        faculty_course_mismatches += 1
        diff = actual_courses - expected_courses
        impact = "High" if abs(diff) > 2 else "Medium" if abs(diff) > 1 else "Low"
        add_mismatch(
            "Faculty Courses",
            "faculty",
            "total_courses",
            fac_id,
            fac_name,
            expected_courses,
            actual_courses,
            diff,
            impact
        )
    
    # Check students
    expected_students = int(faculty['total_students'])
    actual_students = len(actual_students_per_instructor.get(fac_id, set()))
    
    if expected_students != actual_students:
        faculty_student_mismatches += 1
        diff = actual_students - expected_students
        impact = "High" if abs(diff) > 50 else "Medium" if abs(diff) > 20 else "Low"
        add_mismatch(
            "Faculty Students",
            "faculty",
            "total_students",
            fac_id,
            fac_name,
            expected_students,
            actual_students,
            diff,
            impact
        )

print(f"   Faculty Course Mismatches: {faculty_course_mismatches}")
print(f"   Faculty Student Mismatches: {faculty_student_mismatches}")

# ============================================================================
# 2. COURSE ENROLLMENT MISMATCHES
# ============================================================================
print("\n[2/10] Analyzing Course Enrollment Mismatches...")

actual_enrollments_per_course = defaultdict(int)
for enrollment in enrollments_data:
    actual_enrollments_per_course[enrollment['course_id']] += 1

course_enrollment_mismatches = 0

for course in courses_data:
    course_id = course['id']
    course_name = course['name']
    
    expected_students = int(course['total_students'])
    actual_students = actual_enrollments_per_course.get(course_id, 0)
    
    if expected_students != actual_students:
        course_enrollment_mismatches += 1
        diff = actual_students - expected_students
        impact = "High" if abs(diff) > 20 else "Medium" if abs(diff) > 10 else "Low"
        add_mismatch(
            "Course Enrollments",
            "courses",
            "total_students",
            course_id,
            course_name,
            expected_students,
            actual_students,
            diff,
            impact
        )

print(f"   Course Enrollment Mismatches: {course_enrollment_mismatches}")

# ============================================================================
# 3. DEPARTMENT TOTALS MISMATCHES
# ============================================================================
print("\n[3/10] Analyzing Department Totals Mismatches...")

departments_data = read_csv('departments.csv')
students_data = read_csv('students.csv')

# Create mapping from department name to ID
dept_name_to_id = {}
for dept in departments_data:
    dept_name_to_id[dept['name']] = dept['id']

# Count actual students per department (using department name mapping)
actual_students_per_dept = defaultdict(int)
for student in students_data:
    dept_name = student.get('department', '')
    dept_id = dept_name_to_id.get(dept_name)
    if dept_id:
        actual_students_per_dept[dept_id] += 1

# Count actual faculty per department
actual_faculty_per_dept = defaultdict(int)
for faculty in faculty_data:
    actual_faculty_per_dept[faculty['department_id']] += 1

# Count actual courses per department
actual_courses_per_dept = defaultdict(int)
for course in courses_data:
    actual_courses_per_dept[course['department_id']] += 1

dept_student_mismatches = 0
dept_faculty_mismatches = 0
dept_course_mismatches = 0

for dept in departments_data:
    dept_id = dept['id']
    dept_name = dept['name']
    
    # Check students
    expected_students = int(dept['total_students'])
    actual_students = actual_students_per_dept.get(dept_id, 0)
    
    if expected_students != actual_students:
        dept_student_mismatches += 1
        diff = actual_students - expected_students
        impact = "High" if abs(diff) > 100 else "Medium" if abs(diff) > 50 else "Low"
        add_mismatch(
            "Department Students",
            "departments",
            "total_students",
            dept_id,
            dept_name,
            expected_students,
            actual_students,
            diff,
            impact
        )
    
    # Check faculty
    expected_faculty = int(dept['total_faculty'])
    actual_faculty = actual_faculty_per_dept.get(dept_id, 0)
    
    if expected_faculty != actual_faculty:
        dept_faculty_mismatches += 1
        diff = actual_faculty - expected_faculty
        impact = "High" if abs(diff) > 10 else "Medium" if abs(diff) > 5 else "Low"
        add_mismatch(
            "Department Faculty",
            "departments",
            "total_faculty",
            dept_id,
            dept_name,
            expected_faculty,
            actual_faculty,
            diff,
            impact
        )
    
    # Check courses
    expected_courses = int(dept['total_courses'])
    actual_courses = actual_courses_per_dept.get(dept_id, 0)
    
    if expected_courses != actual_courses:
        dept_course_mismatches += 1
        diff = actual_courses - expected_courses
        impact = "High" if abs(diff) > 20 else "Medium" if abs(diff) > 10 else "Low"
        add_mismatch(
            "Department Courses",
            "departments",
            "total_courses",
            dept_id,
            dept_name,
            expected_courses,
            actual_courses,
            diff,
            impact
        )

print(f"   Department Student Mismatches: {dept_student_mismatches}")
print(f"   Department Faculty Mismatches: {dept_faculty_mismatches}")
print(f"   Department Course Mismatches: {dept_course_mismatches}")

# ============================================================================
# 4. UNIVERSITY TOTALS MISMATCHES
# ============================================================================
print("\n[4/10] Analyzing University Totals Mismatches...")

universities_data = read_csv('universities.csv')

# Create mapping from university name to ID
uni_name_to_id = {}
for uni in universities_data:
    uni_name_to_id[uni['university_name']] = uni['id']

# Count actual students per university (using university name mapping)
actual_students_per_uni = defaultdict(int)
for student in students_data:
    uni_name = student.get('university', '')
    uni_id = uni_name_to_id.get(uni_name)
    if uni_id:
        actual_students_per_uni[uni_id] += 1

# Count actual faculty per university
actual_faculty_per_uni = defaultdict(int)
for faculty in faculty_data:
    actual_faculty_per_uni[faculty['university_id']] += 1

uni_student_mismatches = 0
uni_faculty_mismatches = 0

for uni in universities_data:
    uni_id = uni['id']
    uni_name = uni['university_name']
    
    # Check students
    expected_students = int(uni['total_students'])
    actual_students = actual_students_per_uni.get(uni_id, 0)
    
    if expected_students != actual_students:
        uni_student_mismatches += 1
        diff = actual_students - expected_students
        impact = "High" if abs(diff) > 500 else "Medium" if abs(diff) > 100 else "Low"
        add_mismatch(
            "University Students",
            "universities",
            "total_students",
            uni_id,
            uni_name,
            expected_students,
            actual_students,
            diff,
            impact
        )
    
    # Check faculty
    expected_faculty = int(uni['total_faculty'])
    actual_faculty = actual_faculty_per_uni.get(uni_id, 0)
    
    if expected_faculty != actual_faculty:
        uni_faculty_mismatches += 1
        diff = actual_faculty - expected_faculty
        impact = "High" if abs(diff) > 50 else "Medium" if abs(diff) > 20 else "Low"
        add_mismatch(
            "University Faculty",
            "universities",
            "total_faculty",
            uni_id,
            uni_name,
            expected_faculty,
            actual_faculty,
            diff,
            impact
        )

print(f"   University Student Mismatches: {uni_student_mismatches}")
print(f"   University Faculty Mismatches: {uni_faculty_mismatches}")

# ============================================================================
# 5. ENDORSEMENT COUNT MISMATCHES
# ============================================================================
print("\n[5/10] Analyzing Endorsement Count Mismatches...")

user_skills_data = read_csv('user_skills.csv')
skill_endorsements_data = read_csv('skill_endorsements.csv')

# Count actual endorsements per skill
actual_endorsements_per_skill = defaultdict(int)
for endorsement in skill_endorsements_data:
    actual_endorsements_per_skill[endorsement['skill_id']] += 1

endorsement_mismatches = 0

for skill in user_skills_data:
    skill_id = skill['id']
    skill_name = skill['skill_name']
    
    expected_endorsements = int(skill['endorsements'])
    actual_endorsements = actual_endorsements_per_skill.get(skill_id, 0)
    
    if expected_endorsements != actual_endorsements:
        endorsement_mismatches += 1
        diff = actual_endorsements - expected_endorsements
        impact = "High" if abs(diff) > 10 else "Medium" if abs(diff) > 5 else "Low"
        add_mismatch(
            "Skill Endorsements",
            "user_skills",
            "endorsements",
            skill_id,
            skill_name,
            expected_endorsements,
            actual_endorsements,
            diff,
            impact
        )

print(f"   Endorsement Count Mismatches: {endorsement_mismatches}")

# ============================================================================
# 6. GRADE CONSISTENCY MISMATCHES
# ============================================================================
print("\n[6/10] Analyzing Grade Consistency Mismatches...")

try:
    assignment_submissions_data = read_csv('assignment_submissions.csv')
    grades_data = read_csv('grades.csv')
    
    # Create lookup for grades table
    grades_lookup = {}
    for grade in grades_data:
        key = (grade['assignment_id'], grade['student_id'])
        grades_lookup[key] = float(grade['score']) if grade['score'] else None
    
    grade_mismatches = 0
    
    for submission in assignment_submissions_data:
        assignment_id = submission['assignment_id']
        student_id = submission['student_id']
        submission_grade = submission.get('grade', '')
        
        if submission_grade:
            key = (assignment_id, student_id)
            grades_score = grades_lookup.get(key)
            
            # Convert letter grade to numeric for comparison
            grade_map = {
                'A': 95, 'A-': 90, 'B+': 87, 'B': 83, 'B-': 80,
                'C+': 77, 'C': 73, 'C-': 70, 'D': 60, 'F': 50
            }
            
            submission_numeric = grade_map.get(submission_grade.strip())
            
            if submission_numeric and grades_score:
                # Allow 5 point tolerance
                if abs(submission_numeric - grades_score) > 5:
                    grade_mismatches += 1
                    diff = grades_score - submission_numeric
                    impact = "High" if abs(diff) > 20 else "Medium" if abs(diff) > 10 else "Low"
                    add_mismatch(
                        "Grade Consistency",
                        "assignment_submissions vs grades",
                        "grade/score",
                        submission['id'],
                        f"Student {student_id[:8]}...",
                        submission_grade,
                        f"{grades_score:.1f}",
                        f"{diff:.1f}",
                        impact
                    )
    
    print(f"   Grade Consistency Mismatches: {grade_mismatches}")
except FileNotFoundError as e:
    print(f"   Skipping: {e}")

# ============================================================================
# 7. JOB APPLICATION COUNT MISMATCHES
# ============================================================================
print("\n[7/10] Analyzing Job Application Count Mismatches...")

jobs_data = read_csv('jobs.csv')
job_applications_data = read_csv('job_applications.csv')

# Count actual applications per job
actual_applications_per_job = defaultdict(int)
for application in job_applications_data:
    actual_applications_per_job[application['job_id']] += 1

job_app_mismatches = 0

for job in jobs_data:
    job_id = job['id']
    job_title = job['title']
    
    expected_apps = int(job['applications_count'])
    actual_apps = actual_applications_per_job.get(job_id, 0)
    
    if expected_apps != actual_apps:
        job_app_mismatches += 1
        diff = actual_apps - expected_apps
        impact = "High" if abs(diff) > 50 else "Medium" if abs(diff) > 20 else "Low"
        add_mismatch(
            "Job Applications",
            "jobs",
            "applications_count",
            job_id,
            job_title,
            expected_apps,
            actual_apps,
            diff,
            impact
        )

print(f"   Job Application Mismatches: {job_app_mismatches}")

# ============================================================================
# 8. STUDENT GPA MISMATCHES
# ============================================================================
print("\n[8/10] Analyzing Student GPA Mismatches...")

transcripts_data = read_csv('transcripts.csv')

# Create lookup for transcripts
transcripts_lookup = {}
for transcript in transcripts_data:
    transcripts_lookup[transcript['student_id']] = float(transcript['cumulative_gpa']) if transcript['cumulative_gpa'] else None

gpa_mismatches = 0

for student in students_data:
    student_id = student['id']
    student_identifier = student.get('student_id', student_id[:12] + '...')
    
    expected_gpa = float(student['gpa']) if student.get('gpa') else None
    actual_gpa = transcripts_lookup.get(student_id)
    
    if expected_gpa and actual_gpa:
        # Allow 0.1 tolerance
        if abs(expected_gpa - actual_gpa) > 0.1:
            gpa_mismatches += 1
            diff = actual_gpa - expected_gpa
            impact = "High" if abs(diff) > 1.0 else "Medium" if abs(diff) > 0.5 else "Low"
            add_mismatch(
                "Student GPA",
                "students vs transcripts",
                "gpa/cumulative_gpa",
                student_id,
                student_identifier,
                f"{expected_gpa:.2f}",
                f"{actual_gpa:.2f}",
                f"{diff:.2f}",
                impact
            )

print(f"   Student GPA Mismatches: {gpa_mismatches}")

# ============================================================================
# 9. ACADEMIC RECORDS VS ENROLLMENTS
# ============================================================================
print("\n[9/10] Analyzing Academic Records vs Enrollments...")

academic_records_data = read_csv('academic_records.csv')

# Create sets of (student_id, course_id) combinations
enrollment_combinations = set()
for enrollment in enrollments_data:
    enrollment_combinations.add((enrollment['student_id'], enrollment['course_id']))

academic_combinations = set()
for record in academic_records_data:
    academic_combinations.add((record['student_id'], record['course_id']))

# Find differences
only_in_enrollments = enrollment_combinations - academic_combinations
only_in_academic = academic_combinations - enrollment_combinations

print(f"   Records only in enrollments: {len(only_in_enrollments)}")
print(f"   Records only in academic_records: {len(only_in_academic)}")

for student_id, course_id in list(only_in_enrollments)[:10]:  # Limit to first 10
    add_mismatch(
        "Enrollment-Academic Mismatch",
        "course_enrollments",
        "student_id, course_id",
        f"{student_id[:8]}...+{course_id[:8]}...",
        "Record in enrollments only",
        "In academic_records",
        "Missing",
        -1,
        "Medium"
    )

for student_id, course_id in list(only_in_academic)[:10]:  # Limit to first 10
    add_mismatch(
        "Academic-Enrollment Mismatch",
        "academic_records",
        "student_id, course_id",
        f"{student_id[:8]}...+{course_id[:8]}...",
        "Record in academic_records only",
        "In enrollments",
        "Missing",
        -1,
        "Medium"
    )

# ============================================================================
# 10. PROJECT TEAM MEMBER COUNT
# ============================================================================
print("\n[10/10] Analyzing Project Team Member Counts...")

student_projects_data = read_csv('student_projects.csv')

team_count_mismatches = 0

for project in student_projects_data:
    project_id = project['id']
    project_title = project['title']
    
    # Parse team_members (JSON array)
    try:
        team_members = json.loads(project['team_members']) if project.get('team_members') else []
        student_ids = json.loads(project['student_ids']) if project.get('student_ids') else []
        
        team_count = len(team_members)
        student_count = len(student_ids)
        
        if team_count != student_count:
            team_count_mismatches += 1
            diff = student_count - team_count
            impact = "High" if abs(diff) > 3 else "Medium" if abs(diff) > 1 else "Low"
            add_mismatch(
                "Project Team Count",
                "student_projects",
                "team_members vs student_ids",
                project_id,
                project_title,
                team_count,
                student_count,
                diff,
                impact
            )
    except json.JSONDecodeError:
        pass

print(f"   Team Member Count Mismatches: {team_count_mismatches}")

# ============================================================================
# GENERATE REPORT
# ============================================================================
print("\n" + "=" * 80)
print("GENERATING COMPREHENSIVE REPORT")
print("=" * 80)

# Group by category and impact
high_impact = [m for m in mismatches if m['impact'] == 'High']
medium_impact = [m for m in mismatches if m['impact'] == 'Medium']
low_impact = [m for m in mismatches if m['impact'] == 'Low']

print(f"\nTotal Mismatches Found: {len(mismatches)}")
print(f"  High Impact: {len(high_impact)}")
print(f"  Medium Impact: {len(medium_impact)}")
print(f"  Low Impact: {len(low_impact)}")

# Generate markdown report
markdown_report = []
markdown_report.append("# CROSS-TABLE DATA MISMATCH ANALYSIS REPORT\n")
markdown_report.append(f"**Generated:** 2026-02-14\n")
markdown_report.append(f"**Total Mismatches:** {len(mismatches)}\n")
markdown_report.append(f"**Critical Issues (High Impact):** {len(high_impact)}\n\n")

markdown_report.append("## EXECUTIVE SUMMARY\n\n")
markdown_report.append("| Category | Mismatches | High | Medium | Low |\n")
markdown_report.append("|----------|------------|------|--------|-----|\n")

categories = {}
for m in mismatches:
    cat = m['category']
    if cat not in categories:
        categories[cat] = {'total': 0, 'high': 0, 'medium': 0, 'low': 0}
    categories[cat]['total'] += 1
    categories[cat][m['impact'].lower()] += 1

for cat, stats in sorted(categories.items()):
    markdown_report.append(f"| {cat} | {stats['total']} | {stats['high']} | {stats['medium']} | {stats['low']} |\n")

markdown_report.append("\n## DETAILED FINDINGS\n\n")

# Group mismatches by category
for category in sorted(categories.keys()):
    cat_mismatches = [m for m in mismatches if m['category'] == category]
    markdown_report.append(f"### {category}\n\n")
    markdown_report.append(f"**Total Issues:** {len(cat_mismatches)}\n\n")
    
    # Show high impact first, limit to 20 per category
    for impact_level in ['High', 'Medium', 'Low']:
        impact_items = [m for m in cat_mismatches if m['impact'] == impact_level]
        if impact_items:
            markdown_report.append(f"#### {impact_level} Impact ({len(impact_items)} issues)\n\n")
            
            for i, m in enumerate(impact_items[:20], 1):
                markdown_report.append(f"**Mismatch #{i}:**\n")
                markdown_report.append(f"```\n")
                markdown_report.append(f"Source: {m['source']}\n")
                markdown_report.append(f"Record ID: {m['record_id']}\n")
                markdown_report.append(f"Record: {m['record_name']}\n")
                markdown_report.append(f"Expected Value: {m['expected']}\n")
                markdown_report.append(f"Actual Value: {m['actual']}\n")
                markdown_report.append(f"Difference: {m['difference']}\n")
                markdown_report.append(f"```\n\n")
            
            if len(impact_items) > 20:
                markdown_report.append(f"*... and {len(impact_items) - 20} more {impact_level.lower()} impact issues*\n\n")

markdown_report.append("\n## RECOMMENDATIONS\n\n")
markdown_report.append("1. **Immediate Action Required:** Fix all High Impact mismatches\n")
markdown_report.append("2. **Priority:** Address Medium Impact mismatches that affect core metrics\n")
markdown_report.append("3. **Cleanup:** Review and correct Low Impact discrepancies\n")
markdown_report.append("4. **Prevention:** Implement foreign key constraints and triggers to maintain data integrity\n")
markdown_report.append("5. **Monitoring:** Set up automated validation checks in the application\n\n")

# Save report
report_path = BASE_DIR.parent / "DATA-MISMATCH-ANALYSIS-REPORT.md"
with open(report_path, 'w', encoding='utf-8') as f:
    f.write(''.join(markdown_report))

print(f"\n✅ Report saved to: {report_path}")

# Save JSON for further analysis
json_path = BASE_DIR.parent / "data_mismatches.json"
with open(json_path, 'w', encoding='utf-8') as f:
    json.dump(mismatches, f, indent=2)

print(f"✅ JSON data saved to: {json_path}")
print("\n" + "=" * 80)
print("ANALYSIS COMPLETE")
print("=" * 80)
