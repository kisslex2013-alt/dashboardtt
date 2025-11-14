# Скрипт для остановки всех процессов сервера
$ErrorActionPreference = 'Continue'

$scriptPath = Split-Path -Parent $MyInvocation.MyCommand.Path
$projectRoot = Split-Path -Parent $scriptPath
Set-Location $projectRoot

Write-Host "=== Остановка всех процессов сервера ===" -ForegroundColor Red

# 1. Останавливаем все PM2 процессы
Write-Host "Остановка PM2 процессов..." -ForegroundColor Yellow
pm2 stop all 2>$null | Out-Null
pm2 delete all 2>$null | Out-Null
Write-Host "OK: PM2 процессы остановлены" -ForegroundColor Green

# 2. Останавливаем все процессы Node.js связанные с проектом
Write-Host "Остановка Node.js процессов..." -ForegroundColor Yellow
$nodeProcesses = Get-Process -Name "node" -ErrorAction SilentlyContinue
$stopped = 0
foreach ($proc in $nodeProcesses) {
    try {
        $wmiProc = Get-WmiObject Win32_Process -Filter "ProcessId = $($proc.Id)" -ErrorAction SilentlyContinue
        if ($wmiProc -and $wmiProc.CommandLine) {
            if ($wmiProc.CommandLine -like "*vite*" -or $wmiProc.CommandLine -like "*time-tracker*" -or $wmiProc.CommandLine -like "*TTM_module*") {
                Stop-Process -Id $proc.Id -Force -ErrorAction SilentlyContinue
                $stopped++
                Write-Host "OK: Остановлен Node.js (PID: $($proc.Id))" -ForegroundColor Green
            }
        }
    } catch {
        # Игнорируем ошибки
    }
}
if ($stopped -eq 0) {
    Write-Host "OK: Node.js процессы Vite не найдены" -ForegroundColor Gray
}

# 3. Останавливаем процессы CMD связанные с проектом
Write-Host "Очистка консольных окон CMD..." -ForegroundColor Yellow
$cmdProcesses = Get-Process -Name "cmd" -ErrorAction SilentlyContinue
foreach ($proc in $cmdProcesses) {
    try {
        $wmiProc = Get-WmiObject Win32_Process -Filter "ProcessId = $($proc.Id)" -ErrorAction SilentlyContinue
        if ($wmiProc -and $wmiProc.CommandLine) {
            if ($wmiProc.CommandLine -like "*vite*" -or $wmiProc.CommandLine -like "*time-tracker*" -or $wmiProc.CommandLine -like "*npm*" -or $wmiProc.CommandLine -like "*pm2*") {
                Stop-Process -Id $proc.Id -Force -ErrorAction SilentlyContinue
                Write-Host "OK: Остановлен CMD (PID: $($proc.Id))" -ForegroundColor Green
            }
        }
    } catch {
        # Игнорируем ошибки
    }
}

Write-Host ""
Write-Host "=== Все процессы остановлены ===" -ForegroundColor Green
Write-Host "Подождите 2 секунды..." -ForegroundColor Yellow
Start-Sleep -Seconds 2
