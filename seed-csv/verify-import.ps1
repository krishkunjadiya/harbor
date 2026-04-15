# Harbor Database Verification Script
# Description: Verifies data integrity after Supabase import
# Date: January 31, 2026

param(
    [Parameter(Mandatory=$true)]
    [string]$ProjectRef,
    
    [Parameter(Mandatory=$true)]
    [string]$DatabasePassword
)

# Database connection string
$dbUrl = "postgresql://postgres:$DatabasePassword@db.$ProjectRef.supabase.co:5432/postgres"

Write-Host "`n🔍 Harbor Database Verification" -ForegroundColor Cyan
Write-Host "================================" -ForegroundColor Cyan
Write-Host "Project: $ProjectRef`n" -ForegroundColor Yellow

# Check if psql is installed
try {
    $null = Get-Command psql -ErrorAction Stop
} catch {
    Write-Host "❌ ERROR: PostgreSQL client (psql) not found!" -ForegroundColor Red
    exit 1
}

Write-Host "📊 Checking row counts..." -ForegroundColor Cyan
Write-Host ("-" * 50) -ForegroundColor Gray

# Expected row counts
$expectedCounts = @{
    "profiles" = 143
    "students" = 50
    "faculty" = 50
    "recruiters" = 50
    "courses" = 50
    "jobs" = 100
}

$query = @"
SELECT 'profiles' as table_name, COUNT(*) as count FROM profiles
UNION ALL SELECT 'students', COUNT(*) FROM students
UNION ALL SELECT 'faculty', COUNT(*) FROM faculty
UNION ALL SELECT 'recruiters', COUNT(*) FROM recruiters
UNION ALL SELECT 'courses', COUNT(*) FROM courses
UNION ALL SELECT 'jobs', COUNT(*) FROM jobs
UNION ALL SELECT 'enrollments', COUNT(*) FROM enrollments
UNION ALL SELECT 'grades', COUNT(*) FROM grades
UNION ALL SELECT 'assignments', COUNT(*) FROM assignments
UNION ALL SELECT 'projects', COUNT(*) FROM projects
ORDER BY table_name;
"@

$result = psql $dbUrl -t -c $query 2>&1

if ($LASTEXITCODE -eq 0) {
    $lines = $result -split "`n" | Where-Object { $_.Trim() -ne "" }
    
    foreach ($line in $lines) {
        $parts = $line.Trim() -split "\|"
        $tableName = $parts[0].Trim()
        $count = $parts[1].Trim()
        
        $expected = $expectedCounts[$tableName]
        $status = if ($expected -and $count -eq $expected) {
            "✅"
        } elseif ($expected) {
            "⚠️"
        } else {
            "ℹ️"
        }
        
        $color = if ($status -eq "✅") { "Green" } elseif ($status -eq "⚠️") { "Yellow" } else { "White" }
        
        $expectedText = if ($expected) { " (expected: $expected)" } else { "" }
        Write-Host "$status $tableName : $count$expectedText" -ForegroundColor $color
    }
} else {
    Write-Host "❌ Failed to get row counts" -ForegroundColor Red
    Write-Host $result -ForegroundColor Red
    exit 1
}

Write-Host "`n🔗 Checking foreign key integrity..." -ForegroundColor Cyan
Write-Host ("-" * 50) -ForegroundColor Gray

$fkChecks = @"
SELECT 'orphaned_students' as check_name, COUNT(*) as count FROM students s
LEFT JOIN profiles p ON s.profile_id = p.profile_id
WHERE p.profile_id IS NULL

UNION ALL

SELECT 'orphaned_faculty', COUNT(*) FROM faculty f
LEFT JOIN profiles p ON f.profile_id = p.profile_id
WHERE p.profile_id IS NULL

UNION ALL

SELECT 'orphaned_recruiters', COUNT(*) FROM recruiters r
LEFT JOIN profiles p ON r.profile_id = p.profile_id
WHERE p.profile_id IS NULL

UNION ALL

SELECT 'orphaned_jobs', COUNT(*) FROM jobs j
LEFT JOIN recruiters r ON j.recruiter_id = r.recruiter_id
WHERE r.recruiter_id IS NULL

UNION ALL

SELECT 'orphaned_courses_faculty', COUNT(*) FROM courses c
LEFT JOIN profiles p ON c.faculty_id = p.profile_id
WHERE p.profile_id IS NULL

UNION ALL

SELECT 'orphaned_grades_faculty', COUNT(*) FROM grades g
LEFT JOIN faculty f ON g.faculty_id = f.faculty_id
WHERE f.faculty_id IS NULL;
"@

$fkResult = psql $dbUrl -t -c $fkChecks 2>&1

if ($LASTEXITCODE -eq 0) {
    $fkLines = $fkResult -split "`n" | Where-Object { $_.Trim() -ne "" }
    
    $allPassed = $true
    foreach ($line in $fkLines) {
        $parts = $line.Trim() -split "\|"
        $checkName = $parts[0].Trim()
        $count = [int]$parts[1].Trim()
        
        if ($count -eq 0) {
            Write-Host "✅ $checkName : OK (0 orphaned records)" -ForegroundColor Green
        } else {
            Write-Host "❌ $checkName : FAILED ($count orphaned records)" -ForegroundColor Red
            $allPassed = $false
        }
    }
    
    if ($allPassed) {
        Write-Host "`n🎉 ALL FOREIGN KEY CHECKS PASSED!" -ForegroundColor Green
    } else {
        Write-Host "`n⚠️  Some foreign key violations found. Check data integrity." -ForegroundColor Yellow
    }
} else {
    Write-Host "❌ Failed to run FK checks" -ForegroundColor Red
    Write-Host $fkResult -ForegroundColor Red
}

Write-Host "`n🔐 Checking data types and formats..." -ForegroundColor Cyan
Write-Host ("-" * 50) -ForegroundColor Gray

$dataTypeChecks = @"
-- Check for invalid UUIDs in profiles
SELECT 'invalid_uuids_profiles' as check_name, COUNT(*) as count FROM profiles
WHERE profile_id !~ '^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$'

UNION ALL

-- Check for invalid emails
SELECT 'invalid_emails', COUNT(*) FROM profiles
WHERE email !~ '^[A-Za-z0-9._%+-]+@[A-Za-z0-9.-]+\.[A-Z|a-z]{2,}$'

UNION ALL

-- Check for invalid phone numbers
SELECT 'invalid_phones', COUNT(*) FROM profiles
WHERE phone IS NOT NULL AND phone !~ '^\+[0-9]{1,3}-[0-9]{3,5}-[0-9]{3,4}-[0-9]{4}$'

UNION ALL

-- Check for future dates in created_at
SELECT 'future_created_dates', COUNT(*) FROM profiles
WHERE created_at > NOW()

UNION ALL

-- Check for invalid grade values
SELECT 'invalid_grades', COUNT(*) FROM grades
WHERE marks_obtained < 0 OR marks_obtained > total_marks;
"@

$dataResult = psql $dbUrl -t -c $dataTypeChecks 2>&1

if ($LASTEXITCODE -eq 0) {
    $dataLines = $dataResult -split "`n" | Where-Object { $_.Trim() -ne "" }
    
    $allValid = $true
    foreach ($line in $dataLines) {
        $parts = $line.Trim() -split "\|"
        $checkName = $parts[0].Trim()
        $count = [int]$parts[1].Trim()
        
        if ($count -eq 0) {
            Write-Host "✅ $checkName : OK" -ForegroundColor Green
        } else {
            Write-Host "⚠️  $checkName : $count issues found" -ForegroundColor Yellow
            $allValid = $false
        }
    }
    
    if ($allValid) {
        Write-Host "`n🎉 ALL DATA TYPE CHECKS PASSED!" -ForegroundColor Green
    } else {
        Write-Host "`n⚠️  Some data type issues found." -ForegroundColor Yellow
    }
} else {
    Write-Host "ℹ️  Data type checks skipped (some tables may not exist)" -ForegroundColor Gray
}

Write-Host "`n📈 Database Statistics" -ForegroundColor Cyan
Write-Host ("-" * 50) -ForegroundColor Gray

$statsQuery = @"
SELECT 
    'Total Students' as metric, 
    COUNT(*)::text as value 
FROM students
UNION ALL
SELECT 'Total Faculty', COUNT(*)::text FROM faculty
UNION ALL
SELECT 'Total Recruiters', COUNT(*)::text FROM recruiters
UNION ALL
SELECT 'Total Courses', COUNT(*)::text FROM courses
UNION ALL
SELECT 'Total Jobs', COUNT(*)::text FROM jobs
UNION ALL
SELECT 'Total Enrollments', COUNT(*)::text FROM enrollments
UNION ALL
SELECT 'Total Job Applications', COUNT(*)::text FROM job_applications
UNION ALL
SELECT 'Average Student CGPA', ROUND(AVG(cgpa)::numeric, 2)::text FROM students
UNION ALL
SELECT 'Total Skills', COUNT(*)::text FROM skills
UNION ALL
SELECT 'Total Badges', COUNT(*)::text FROM badges;
"@

$statsResult = psql $dbUrl -t -c $statsQuery 2>&1

if ($LASTEXITCODE -eq 0) {
    $statsLines = $statsResult -split "`n" | Where-Object { $_.Trim() -ne "" }
    
    foreach ($line in $statsLines) {
        $parts = $line.Trim() -split "\|"
        $metric = $parts[0].Trim()
        $value = $parts[1].Trim()
        
        Write-Host "  $metric : $value" -ForegroundColor White
    }
}

Write-Host "`n" -NoNewline
Write-Host ("=" * 50) -ForegroundColor Cyan
Write-Host "✅ VERIFICATION COMPLETE" -ForegroundColor Green
Write-Host ("=" * 50) -ForegroundColor Cyan

Write-Host "`nNext Steps:" -ForegroundColor Cyan
Write-Host "  1. Review any warnings or issues above" -ForegroundColor Yellow
Write-Host "  2. Enable RLS policies on all tables" -ForegroundColor Yellow
Write-Host "  3. Set up authentication with Supabase Auth" -ForegroundColor Yellow
Write-Host "  4. Test your application endpoints" -ForegroundColor Yellow
Write-Host "  5. Configure backup strategy" -ForegroundColor Yellow

Write-Host "`n"
