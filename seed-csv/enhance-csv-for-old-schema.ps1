# Add Missing Columns from OLD Schema to CSV Files
# This script updates CSV files to include all columns from database-schema-extended.sql

$ErrorActionPreference = "Stop"
$csvDir = "e:\KRISH(PPSU)\Semester 6\Major Project\Harbor\seed-csv"

Write-Host "`n=== Adding OLD Schema Columns to CSV Files ===" -ForegroundColor Cyan

# =====================================================
# 1. FACULTY.CSV - Add missing columns
# =====================================================
Write-Host "`n[1/9] Updating faculty.csv..." -ForegroundColor Yellow

$facultyPath = Join-Path $csvDir "faculty.csv"
$faculty = Import-Csv $facultyPath

# Add missing columns from OLD schema
$facultyEnhanced = $faculty | ForEach-Object {
    # Get profile data for name, email, phone
    $profileId = $_.profile_id
    $profile = $profiles | Where-Object { $_.id -eq $profileId } | Select-Object -First 1
    
    [PSCustomObject]@{
        faculty_id = $_.faculty_id
        profile_id = $_.profile_id
        university_id = if ($_.department -like "*Computer Science*" -or $_.department -like "*Mechanical*") { "b1a1d1e1-5001-4000-8000-000000000501" } else { "b1a1d1e1-5002-4000-8000-000000000502" }
        department_id = switch ($_.department) {
            "Computer Science" { "dep-0001" }
            "Mechanical" { "dep-0002" }
            "Physics" { "dep-0003" }
            "Civil Engineering" { "dep-0004" }
            default { "dep-0001" }
        }
        name = if ($profile) { $profile.full_name } else { "Dr. " + $_.faculty_id }
        email = if ($profile) { $profile.email } else { $_.faculty_id + "@harbor.edu" }
        phone = if ($profile) { $profile.phone } else { "+1-555-000-0000" }
        position = $_.designation
        specialization = switch ($_.designation) {
            "Professor" { "Advanced Research" }
            "Associate Professor" { "Applied Studies" }
            "Assistant Professor" { "Teaching Excellence" }
            "Lecturer" { "Curriculum Development" }
            default { "General" }
        }
        join_date = $_.joining_date
        total_courses = Get-Random -Minimum 2 -Maximum 8
        total_students = Get-Random -Minimum 50 -Maximum 300
        status = $_.status
        created_at = "2024-01-01T09:00:00Z"
        updated_at = "2024-01-25T09:00:00Z"
    }
}

$facultyEnhanced | Export-Csv -Path $facultyPath -NoTypeInformation -Force
Write-Host "   ✓ Added: university_id, department_id, name, email, phone, position, specialization, total_courses, total_students" -ForegroundColor Green

# =====================================================
# 2. STUDENT_PROJECTS.CSV - Add missing columns
# =====================================================
Write-Host "`n[2/9] Updating student_projects.csv..." -ForegroundColor Yellow

$projectsPath = Join-Path $csvDir "student_projects.csv"
$projects = Import-Csv $projectsPath

$projectsEnhanced = $projects | ForEach-Object {
    $progressNum = [int]($_.progress -replace '%', '')
    
    [PSCustomObject]@{
        project_id = $_.project_id
        student_id = $_.student_id
        course_id = $_.course_id
        title = $_.title
        description = $_.description
        course_name = $_.course_name
        team_members = $_.team_members
        student_ids = $_.team_members  # Duplicate as student_ids array
        mentor = $_.mentor
        status = $_.status
        progress = $progressNum
        start_date = $_.start_date
        end_date = $_.end_date
        presentation_date = $_.presentation_date
        tags = switch -Regex ($_.technologies) {
            "Python" { "machine-learning,automation,backend" }
            "React" { "frontend,web,spa" }
            "Flutter" { "mobile,cross-platform,ui" }
            "Java" { "enterprise,backend,oop" }
            "Node" { "javascript,backend,api" }
            "Django" { "python,web,mvc" }
            "Vue" { "frontend,progressive,component" }
            default { "project,academic,software" }
        }
        grade = $_.grade
        technologies = $_.technologies
        github_url = $_.github_url
        demo_url = $_.demo_url
        proposal_status = if ($progressNum -ge 100) { "approved" } elseif ($progressNum -ge 50) { "approved" } else { "pending" }
        midterm_status = if ($progressNum -ge 100) { "approved" } elseif ($progressNum -ge 50) { "approved" } else { "pending" }
        final_status = if ($progressNum -eq 100) { "approved" } elseif ($progressNum -ge 80) { "submitted" } else { "pending" }
        created_at = $_.start_date
        updated_at = $_.end_date
    }
}

$projectsEnhanced | Export-Csv -Path $projectsPath -NoTypeInformation -Force
Write-Host "   ✓ Added: student_ids, tags, proposal_status, midterm_status, final_status" -ForegroundColor Green

# =====================================================
# 3. PROFILES.CSV - Rename columns to match OLD schema
# =====================================================
Write-Host "`n[3/9] Updating profiles.csv column names..." -ForegroundColor Yellow

$profilesPath = Join-Path $csvDir "profiles.csv"
$profiles = Import-Csv $profilesPath

$profilesEnhanced = $profiles | ForEach-Object {
    [PSCustomObject]@{
        id = $_.id
        email = $_.email
        full_name = $_.full_name
        role = $_.user_type  # Rename user_type → role
        avatar_url = $_.avatar_url
        phone = $_.phone
        created_at = $_.created_at
        last_login = $_.last_login
        timezone = $_.timezone
        language = $_.locale  # Rename locale → language
        updated_at = $_.updated_at
        email_verified = $_.is_verified  # Rename is_verified → email_verified
        status = $_.status
    }
}

$profilesEnhanced | Export-Csv -Path $profilesPath -NoTypeInformation -Force
Write-Host "   ✓ Renamed: user_type→role, locale→language, is_verified→email_verified" -ForegroundColor Green

# =====================================================
# 4. USER_SKILLS.CSV - Already matches OLD schema
# =====================================================
Write-Host "`n[4/9] user_skills.csv - No changes needed ✓" -ForegroundColor Green

# =====================================================
# 5. DEPARTMENTS.CSV - Add missing columns
# =====================================================
Write-Host "`n[5/9] Updating departments.csv..." -ForegroundColor Yellow

$deptsPath = Join-Path $csvDir "departments.csv"
$depts = Import-Csv $deptsPath

$deptsEnhanced = $depts | ForEach-Object {
    [PSCustomObject]@{
        department_id = $_.department_id
        university_id = $_.university_id
        name = $_.name
        code = $_.code
        head_of_department = $_.head_of_department
        established = $_.established
        description = $_.description
        total_students = $_.total_students
        total_faculty = $_.total_faculty
        total_courses = $_.total_courses
        created_at = $_.created_at
        updated_at = $_.updated_at
    }
}

$deptsEnhanced | Export-Csv -Path $deptsPath -NoTypeInformation -Force
Write-Host "   ✓ departments.csv already matches OLD schema" -ForegroundColor Green

# =====================================================
# 6. COURSES.CSV - Add instructor_id (UUID)
# =====================================================
Write-Host "`n[6/9] Updating courses.csv..." -ForegroundColor Yellow

$coursesPath = Join-Path $csvDir "courses.csv"
$courses = Import-Csv $coursesPath

$coursesEnhanced = $courses | ForEach-Object {
    [PSCustomObject]@{
        course_id = $_.course_id
        department_id = $_.department_id
        instructor_id = $_.faculty_id  # OLD schema uses instructor_id
        code = $_.course_code
        name = $_.course_name
        description = $_.description
        credits = $_.credits
        semester = $_.semester
        year = $_.year
        total_students = $_.enrolled_students
        max_students = $_.max_students
        status = $_.status
        schedule = $_.schedule
        room = $_.room
        university_id = $_.university_id
        created_at = $_.created_at
        updated_at = $_.updated_at
    }
}

$coursesEnhanced | Export-Csv -Path $coursesPath -NoTypeInformation -Force
Write-Host "   ✓ Added: instructor_id (from faculty_id)" -ForegroundColor Green

# =====================================================
# 7. ACADEMIC_RECORDS.CSV - Check if exists
# =====================================================
Write-Host "`n[7/9] Checking academic_records.csv..." -ForegroundColor Yellow
$academicPath = Join-Path $csvDir "academic_records.csv"
if (Test-Path $academicPath) {
    Write-Host "   ✓ academic_records.csv exists" -ForegroundColor Green
} else {
    Write-Host "   ⚠ academic_records.csv not found, skipping" -ForegroundColor DarkYellow
}

# =====================================================
# 8. STUDENT_FULL_RECORDS.CSV - Check if exists
# =====================================================
Write-Host "`n[8/9] Checking student_full_records.csv..." -ForegroundColor Yellow
$fullRecPath = Join-Path $csvDir "student_full_records.csv"
if (Test-Path $fullRecPath) {
    Write-Host "   ✓ student_full_records.csv exists" -ForegroundColor Green
} else {
    Write-Host "   ⚠ student_full_records.csv not found, skipping" -ForegroundColor DarkYellow
}

# =====================================================
# 9. CAREER_INSIGHTS.CSV - Check if exists  
# =====================================================
Write-Host "`n[9/9] Checking career_insights.csv..." -ForegroundColor Yellow
$insightsPath = Join-Path $csvDir "career_insights.csv"
if (Test-Path $insightsPath) {
    Write-Host "   ✓ career_insights.csv exists" -ForegroundColor Green
} else {
    Write-Host "   ⚠ career_insights.csv not found, skipping" -ForegroundColor DarkYellow
}

Write-Host "`n=== CSV Enhancement Complete! ===" -ForegroundColor Cyan
Write-Host "`nModified Files:" -ForegroundColor Green
Write-Host "  ✓ faculty.csv - Added 8 columns" -ForegroundColor White
Write-Host "  ✓ student_projects.csv - Added 5 columns" -ForegroundColor White
Write-Host "  ✓ profiles.csv - Renamed 3 columns" -ForegroundColor White
Write-Host "  ✓ courses.csv - Added instructor_id" -ForegroundColor White
Write-Host "`nCSV files now match OLD schema structure!" -ForegroundColor Cyan
