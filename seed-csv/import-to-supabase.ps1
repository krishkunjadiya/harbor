# Harbor Database Import Script for Supabase
# Description: Imports all CSV files into Supabase (PostgreSQL) in correct order
# Date: January 31, 2026

param(
    [Parameter(Mandatory=$true)]
    [string]$ProjectRef,
    
    [Parameter(Mandatory=$true)]
    [string]$DatabasePassword,
    
    [string]$CsvFolder = "e:\KRISH(PPSU)\Semester 6\Major Project\Harbor\seed-csv"
)

# Colors for output
$Green = "Green"
$Red = "Red"
$Yellow = "Yellow"
$Cyan = "Cyan"

# Database connection string
$dbUrl = "postgresql://postgres:$DatabasePassword@db.$ProjectRef.supabase.co:5432/postgres"

Write-Host "`n🚀 Harbor Database Import Script" -ForegroundColor $Cyan
Write-Host "=================================" -ForegroundColor $Cyan
Write-Host "Project: $ProjectRef" -ForegroundColor $Yellow
Write-Host "CSV Folder: $CsvFolder" -ForegroundColor $Yellow
Write-Host "`n"

# Check if psql is installed
try {
    $null = Get-Command psql -ErrorAction Stop
} catch {
    Write-Host "❌ ERROR: PostgreSQL client (psql) not found!" -ForegroundColor $Red
    Write-Host "Install it from: https://www.postgresql.org/download/windows/" -ForegroundColor $Yellow
    exit 1
}

# Check if CSV folder exists
if (-not (Test-Path $CsvFolder)) {
    Write-Host "❌ ERROR: CSV folder not found: $CsvFolder" -ForegroundColor $Red
    exit 1
}

# Import order (CRITICAL - maintain FK integrity)
$importOrder = @(
    @{
        Name = "Master Tables"
        Tables = @("universities", "departments", "skills", "badges")
    },
    @{
        Name = "Profiles (CRITICAL)"
        Tables = @("profiles")
    },
    @{
        Name = "User Tables"
        Tables = @("students", "faculty", "recruiters", "admins")
    },
    @{
        Name = "Core Entities"
        Tables = @("courses", "jobs", "projects")
    },
    @{
        Name = "Relationships & Transactions"
        Tables = @(
            "enrollments", "assignments", "grades", "job_applications",
            "user_skills", "user_badges", "skill_endorsements",
            "project_members", "project_milestones", "assignment_submissions",
            "attendance", "notifications", "messages", "chat_groups",
            "chat_messages", "user_transactions"
        )
    },
    @{
        Name = "Views/Aggregates"
        Tables = @(
            "career_insights", "dashboard_stats", "academic_records",
            "student_full_records", "transcripts"
        )
    }
)

# Statistics
$totalTables = 0
$importedTables = 0
$failedTables = 0
$startTime = Get-Date

# Function to import a single table
function Import-Table {
    param(
        [string]$TableName,
        [string]$DbUrl,
        [string]$CsvPath
    )
    
    if (-not (Test-Path $CsvPath)) {
        Write-Host "  ⚠️  CSV file not found: $TableName.csv" -ForegroundColor $Yellow
        return $false
    }
    
    # Escape single quotes in path for SQL
    $escapedPath = $CsvPath -replace "'", "''"
    
    # Build COPY command
    $copyCommand = "\COPY $TableName FROM '$escapedPath' WITH (FORMAT csv, HEADER true, DELIMITER ',', QUOTE '""""')"
    
    # Execute import
    $result = psql $DbUrl -c $copyCommand 2>&1
    
    if ($LASTEXITCODE -eq 0) {
        # Get row count
        $countResult = psql $DbUrl -t -c "SELECT COUNT(*) FROM $TableName;" 2>&1
        $rowCount = $countResult.Trim()
        Write-Host "  ✅ $TableName imported successfully ($rowCount rows)" -ForegroundColor $Green
        return $true
    } else {
        Write-Host "  ❌ Failed to import $TableName" -ForegroundColor $Red
        Write-Host "     Error: $result" -ForegroundColor $Red
        return $false
    }
}

# Main import loop
foreach ($group in $importOrder) {
    Write-Host "`n📦 Importing: $($group.Name)" -ForegroundColor $Cyan
    Write-Host ("=" * 50) -ForegroundColor $Cyan
    
    foreach ($table in $group.Tables) {
        $totalTables++
        $csvPath = Join-Path $CsvFolder "$table.csv"
        
        Write-Host "`n  Importing $table..." -ForegroundColor $Yellow
        
        if (Import-Table -TableName $table -DbUrl $dbUrl -CsvPath $csvPath) {
            $importedTables++
        } else {
            $failedTables++
            
            # Ask user if they want to continue
            $response = Read-Host "  Continue with remaining tables? (y/n)"
            if ($response -ne 'y') {
                Write-Host "`n❌ Import aborted by user" -ForegroundColor $Red
                exit 1
            }
        }
    }
}

# Final summary
$endTime = Get-Date
$duration = $endTime - $startTime

Write-Host "`n`n" -NoNewline
Write-Host ("=" * 70) -ForegroundColor $Cyan
Write-Host "📊 IMPORT SUMMARY" -ForegroundColor $Cyan
Write-Host ("=" * 70) -ForegroundColor $Cyan
Write-Host "Total Tables:    $totalTables" -ForegroundColor $Yellow
Write-Host "Imported:        $importedTables" -ForegroundColor $Green
Write-Host "Failed:          $failedTables" -ForegroundColor $(if ($failedTables -gt 0) { $Red } else { $Green })
Write-Host "Duration:        $($duration.ToString('mm\:ss'))" -ForegroundColor $Yellow
Write-Host ("=" * 70) -ForegroundColor $Cyan

if ($failedTables -eq 0) {
    Write-Host "`n🎉 ALL TABLES IMPORTED SUCCESSFULLY!" -ForegroundColor $Green
    Write-Host "`nNext Steps:" -ForegroundColor $Cyan
    Write-Host "  1. Verify data in Supabase Dashboard" -ForegroundColor $Yellow
    Write-Host "  2. Run verification queries (see SUPABASE_IMPORT_GUIDE.md)" -ForegroundColor $Yellow
    Write-Host "  3. Enable RLS policies on all tables" -ForegroundColor $Yellow
    Write-Host "  4. Test with your application" -ForegroundColor $Yellow
} else {
    Write-Host "`n⚠️  Some tables failed to import. Check errors above." -ForegroundColor $Red
    Write-Host "See SUPABASE_IMPORT_GUIDE.md for troubleshooting." -ForegroundColor $Yellow
}

Write-Host "`n"
