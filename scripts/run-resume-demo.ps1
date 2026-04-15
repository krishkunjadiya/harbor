param(
  [Parameter(Mandatory = $false)]
  [string]$StudentEmail,

  [Parameter(Mandatory = $false)]
  [string]$StudentPassword,

  [Parameter(Mandatory = $false)]
  [string]$HarborBaseUrl = "http://localhost:3000",

  [Parameter(Mandatory = $false)]
  [string]$ResumeBaseUrl = "http://localhost:3001",

  [Parameter(Mandatory = $false)]
  [switch]$NoRecord
)

$ErrorActionPreference = "Stop"

$repoRoot = (Resolve-Path (Join-Path $PSScriptRoot "..\")).Path
$logsRoot = Join-Path $repoRoot "artifacts\demo\orchestrator"
New-Item -ItemType Directory -Path $logsRoot -Force | Out-Null

if (-not $StudentEmail) {
  $StudentEmail = $env:HARBOR_DEMO_EMAIL
}

if (-not $StudentPassword) {
  $StudentPassword = $env:HARBOR_DEMO_PASSWORD
}

if (-not $StudentEmail -or -not $StudentPassword) {
  throw "Missing credentials. Pass -StudentEmail and -StudentPassword or set HARBOR_DEMO_EMAIL and HARBOR_DEMO_PASSWORD."
}

$env:HARBOR_DEMO_EMAIL = $StudentEmail
$env:HARBOR_DEMO_PASSWORD = $StudentPassword
$env:HARBOR_BASE_URL = $HarborBaseUrl
$env:RESUME_APP_URL = $ResumeBaseUrl
$env:DEMO_RECORD = $(if ($NoRecord.IsPresent) { "0" } else { "1" })

function Start-DevProcess {
  param(
    [string]$Name,
    [string]$Command,
    [string]$LogFile
  )

  Write-Host "Starting $Name..."
  $wrappedCommand = "$Command >> `"$LogFile`" 2>&1"
  return Start-Process -FilePath "cmd.exe" -ArgumentList "/c", $wrappedCommand -WorkingDirectory $repoRoot -PassThru
}

function Wait-UrlReady {
  param(
    [string]$Url,
    [int]$TimeoutSeconds = 300
  )

  $start = Get-Date
  while ((Get-Date) -lt $start.AddSeconds($TimeoutSeconds)) {
    try {
      $response = Invoke-WebRequest -Uri $Url -Method GET -UseBasicParsing -TimeoutSec 30
      if ($response.StatusCode -ge 200 -and $response.StatusCode -lt 500) {
        return $true
      }
    } catch {
      # Keep retrying.
    }

    Start-Sleep -Milliseconds 1000
  }

  return $false
}

function Wait-PortReady {
  param(
    [int]$Port,
    [int]$TimeoutSeconds = 180
  )

  $start = Get-Date
  while ((Get-Date) -lt $start.AddSeconds($TimeoutSeconds)) {
    try {
      $client = New-Object System.Net.Sockets.TcpClient
      $async = $client.BeginConnect('127.0.0.1', $Port, $null, $null)
      $connected = $async.AsyncWaitHandle.WaitOne(1000)

      if ($connected -and $client.Connected) {
        $client.EndConnect($async) | Out-Null
        $client.Close()
        return $true
      }

      $client.Close()
    } catch {
      # Keep retrying.
    }

    Start-Sleep -Milliseconds 1000
  }

  return $false
}

$harborLog = Join-Path $logsRoot "harbor-dev.log"
$resumeLog = Join-Path $logsRoot "resume-dev.log"

$harborProc = $null
$resumeProc = $null

try {
  $harborProc = Start-DevProcess -Name "Harbor" -Command "npm run dev:harbor" -LogFile $harborLog
  $resumeProc = Start-DevProcess -Name "Resume" -Command "npm run dev:resume" -LogFile $resumeLog

  Write-Host "Waiting for Harbor and Resume services..."

  if (-not (Wait-PortReady -Port 3000 -TimeoutSeconds 240)) {
    throw "Harbor port 3000 did not become ready in time. Check $harborLog"
  }

  if (-not (Wait-PortReady -Port 3001 -TimeoutSeconds 300)) {
    throw "Resume port 3001 did not become ready in time. Check $resumeLog"
  }

  if (-not (Wait-UrlReady -Url "$HarborBaseUrl" -TimeoutSeconds 300)) {
    throw "Harbor service did not become ready in time. Check $harborLog"
  }

  if (-not (Wait-UrlReady -Url "$ResumeBaseUrl" -TimeoutSeconds 360)) {
    throw "Resume service did not become ready in time. Check $resumeLog"
  }

  Write-Host "Services are ready. Running demo automation..."
  Push-Location $repoRoot
  try {
    & node scripts/resume-demo-automation.js
    if ($LASTEXITCODE -ne 0) {
      throw "Demo automation failed with exit code $LASTEXITCODE"
    }
  } finally {
    Pop-Location
  }

  Write-Host "Demo automation completed successfully."
} finally {
  Write-Host "Stopping dev services..."

  foreach ($proc in @($harborProc, $resumeProc)) {
    if ($null -ne $proc -and -not $proc.HasExited) {
      try {
        cmd /c "taskkill /PID $($proc.Id) /T /F" | Out-Null
      } catch {
        # Best effort cleanup.
      }
    }
  }
}
