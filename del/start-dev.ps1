# PowerShell скрипт для запуска dev сервера
Set-Location "$PSScriptRoot"
Write-Host "=== Запуск dev сервера ===" -ForegroundColor Green
Write-Host "Директория: $(Get-Location)" -ForegroundColor Cyan
Write-Host ""
npm run dev

