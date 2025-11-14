# Script to start single server in background without windows
$ErrorActionPreference = 'Continue'

$scriptPath = Split-Path -Parent $MyInvocation.MyCommand.Path
$projectRoot = Split-Path -Parent $scriptPath
Set-Location $projectRoot

Write-Host "=== Starting server in background (no windows) ===" -ForegroundColor Green

# 1. Stop all old processes first
Write-Host "Stopping old processes..." -ForegroundColor Yellow
try {
    pm2 stop all 2>$null | Out-Null
    pm2 delete all 2>$null | Out-Null
    Start-Sleep -Seconds 1
} catch {}

# 2. Check if process is already running
$pm2Status = pm2 list 2>$null
if ($pm2Status -and ($pm2Status | Select-String "time-tracker-dev")) {
    Write-Host "WARNING: Server already running! Use 'npm run stop' to stop" -ForegroundColor Yellow
    Write-Host "Or 'npm run restart' to restart" -ForegroundColor Yellow
    exit 0
}

# 3. Start PM2 via cmd in hidden mode
# Use cmd.exe to run PM2 in hidden window
$processInfo = New-Object System.Diagnostics.ProcessStartInfo
$processInfo.FileName = "cmd.exe"
$processInfo.Arguments = "/c pm2 start ecosystem.config.cjs"
$processInfo.WorkingDirectory = $projectRoot
$processInfo.WindowStyle = [System.Diagnostics.ProcessWindowStyle]::Hidden
$processInfo.UseShellExecute = $false
$processInfo.CreateNoWindow = $true
$processInfo.RedirectStandardOutput = $true
$processInfo.RedirectStandardError = $true

# Start process in background
try {
    $process = New-Object System.Diagnostics.Process
    $process.StartInfo = $processInfo
    $null = $process.Start()
    
    # Wait for launch (PM2 starts quickly)
    $process.WaitForExit(5000)
    
    # Wait a bit more for initialization
    Start-Sleep -Seconds 2
    
    # Check status
    $status = pm2 list 2>$null | Select-String "time-tracker-dev"
    if ($status) {
        Write-Host "OK: Server started successfully in background!" -ForegroundColor Green
        Write-Host ""
        Write-Host "Useful commands:" -ForegroundColor Cyan
        Write-Host "  npm run status  - Check status" -ForegroundColor White
        Write-Host "  npm run logs    - View logs" -ForegroundColor White
        Write-Host "  npm run stop    - Stop server" -ForegroundColor White
        Write-Host ""
        Write-Host "Server available at: http://localhost:5173" -ForegroundColor Green
    } else {
        Write-Host "WARNING: Failed to start server. Check logs:" -ForegroundColor Yellow
        Write-Host "  npm run logs" -ForegroundColor White
    }
} catch {
    Write-Host "ERROR: Startup error" -ForegroundColor Red
    Write-Host "Try starting manually: npm run start:visible" -ForegroundColor Yellow
    exit 1
}
