# Data Persistence Issue Detection Script
# Run this in the Harbor project root directory

Write-Host "==================================================" -ForegroundColor Cyan
Write-Host "  DATA PERSISTENCE ISSUE DETECTOR" -ForegroundColor Cyan
Write-Host "==================================================" -ForegroundColor Cyan
Write-Host ""

# Issue 1: useState with hardcoded array data
Write-Host "[1] Searching for hardcoded arrays in useState..." -ForegroundColor Yellow
$hardcodedArrays = Get-ChildItem -Path "app" -Filter "*.tsx" -Recurse -ErrorAction SilentlyContinue | 
    Select-String -Pattern "useState\(\[[\s]*\{" -ErrorAction SilentlyContinue
if ($hardcodedArrays) {
    Write-Host "⚠️  Found hardcoded data in useState:" -ForegroundColor Red
    $hardcodedArrays | ForEach-Object {
        Write-Host "   - $($_.Path):$($_.LineNumber)" -ForegroundColor Gray
    }
} else {
    Write-Host "✅ No hardcoded arrays found" -ForegroundColor Green
}
Write-Host ""

# Issue 2: Hardcoded demo IDs
Write-Host "[2] Searching for hardcoded demo/mock IDs..." -ForegroundColor Yellow
$demoIds = Get-ChildItem -Path "app" -Filter "*.tsx" -Recurse -ErrorAction SilentlyContinue | 
    Select-String -Pattern "(demo-|current-|mock-).*-id" -ErrorAction SilentlyContinue
if ($demoIds) {
    Write-Host "⚠️  Found hardcoded IDs:" -ForegroundColor Red
    $demoIds | Select-Object -First 5 | ForEach-Object {
        Write-Host "   - $($_.Path):$($_.LineNumber) - $($_.Line.Trim())" -ForegroundColor Gray
    }
    if ($demoIds.Count -gt 5) {
        Write-Host "   ... and $($demoIds.Count - 5) more" -ForegroundColor Gray
    }
} else {
    Write-Host "✅ No hardcoded IDs found" -ForegroundColor Green
}
Write-Host ""

# Issue 3: TODO comments about getting actual IDs
Write-Host "[3] Searching for TODO comments about IDs/data..." -ForegroundColor Yellow
$todos = Get-ChildItem -Path "app" -Filter "*.tsx" -Recurse -ErrorAction SilentlyContinue | 
    Select-String -Pattern "TODO.*actual.*id|TODO.*Get.*user" -ErrorAction SilentlyContinue
if ($todos) {
    Write-Host "⚠️  Found TODO comments:" -ForegroundColor Red
    $todos | ForEach-Object {
        Write-Host "   - $($_.Path):$($_.LineNumber)" -ForegroundColor Gray
    }
} else {
    Write-Host "✅ No TODO comments about IDs found" -ForegroundColor Green
}
Write-Host ""

# Issue 4: Hardcoded user names/emails
Write-Host "[4] Searching for hardcoded user data..." -ForegroundColor Yellow
$hardcodedUsers = Get-ChildItem -Path "app" -Filter "*.tsx" -Recurse -ErrorAction SilentlyContinue | 
    Select-String -Pattern "(John Doe|Jane Smith|Dr\. Sarah|Dr\. Michael)" -ErrorAction SilentlyContinue
if ($hardcodedUsers) {
    Write-Host "⚠️  Found hardcoded user data:" -ForegroundColor Red
    $hardcodedUsers | Select-Object -First 3 | ForEach-Object {
        Write-Host "   - $($_.Path):$($_.LineNumber)" -ForegroundColor Gray
    }
    if ($hardcodedUsers.Count -gt 3) {
        Write-Host "   ... and $($hardcodedUsers.Count - 3) more" -ForegroundColor Gray
    }
} else {
    Write-Host "✅ No hardcoded user names found" -ForegroundColor Green
}
Write-Host ""

# Summary
Write-Host "==================================================" -ForegroundColor Cyan
Write-Host "  SUMMARY" -ForegroundColor Cyan
Write-Host "==================================================" -ForegroundColor Cyan

$issues = 0
if ($hardcodedArrays) { $issues++ }
if ($demoIds) { $issues++ }
if ($todos) { $issues++ }
if ($hardcodedUsers) { $issues++ }

if ($issues -eq 0) {
    Write-Host "✅ No major data persistence issues found!" -ForegroundColor Green
    Write-Host "   All data appears to be properly persisted to database." -ForegroundColor Green
} else {
    Write-Host "⚠️  Found $issues category/categories of potential issues" -ForegroundColor Red
    Write-Host "   Review the files listed above and ensure:" -ForegroundColor Yellow
    Write-Host "   1. All user actions persist to database immediately" -ForegroundColor Yellow
    Write-Host "   2. UI updates only after successful DB writes" -ForegroundColor Yellow
    Write-Host "   3. Proper error handling is in place" -ForegroundColor Yellow
    Write-Host "   4. No hardcoded demo data remains" -ForegroundColor Yellow
}

Write-Host ""
Write-Host "For detailed patterns and fixes, see:" -ForegroundColor Cyan
Write-Host "   - DATA-PERSISTENCE-AUDIT.md" -ForegroundColor Cyan
Write-Host "   - MOCK-DATA-REMOVAL-COMPLETE-GUIDE.md" -ForegroundColor Cyan
Write-Host ""
