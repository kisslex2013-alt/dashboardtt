# PM2 Hidden Start Script
$ErrorActionPreference = 'Continue'

$scriptPath = Split-Path -Parent $MyInvocation.MyCommand.Path
Set-Location $scriptPath

Write-Host "Starting PM2 in background mode..." -ForegroundColor Green

# Check if PM2 process is already running
try {
    $pm2List = pm2 list 2>$null
    if ($LASTEXITCODE -eq 0) {
        $myAppRunning = pm2 list | Select-String "my-app"
        if ($myAppRunning) {
            Write-Host "PM2 process 'my-app' is already running. Use 'npm run restart' to restart." -ForegroundColor Yellow
            exit 0
        }
    }
} catch {
    # Ignore errors
}

# Start PM2 via cmd in hidden mode
$processInfo = New-Object System.Diagnostics.ProcessStartInfo
$processInfo.FileName = "cmd.exe"
$processInfo.Arguments = "/c pm2 start ecosystem.config.cjs"
$processInfo.WorkingDirectory = $scriptPath
$processInfo.WindowStyle = [System.Diagnostics.ProcessWindowStyle]::Hidden
$processInfo.UseShellExecute = $false
$processInfo.CreateNoWindow = $true
$processInfo.RedirectStandardOutput = $true
$processInfo.RedirectStandardError = $true

$process = New-Object System.Diagnostics.Process
$process.StartInfo = $processInfo
$null = $process.Start()
$process.WaitForExit(3000)

if ($process.ExitCode -eq 0 -or $LASTEXITCODE -eq 0) {
    Write-Host "PM2 started successfully in background mode" -ForegroundColor Green
    Write-Host "Use 'npm run status' to check status" -ForegroundColor Yellow
    Write-Host "Use 'npm run logs' to view logs" -ForegroundColor Yellow
} else {
    Write-Host "Warning: PM2 may already be running or an error occurred" -ForegroundColor Yellow
    Write-Host "Check status: npm run status" -ForegroundColor Yellow
}
