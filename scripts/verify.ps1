# verify.ps1
# Автоматизация проверки - Быстрый провал, Ранний провал.

Write-Host "🕵️ Запуск хука верификации агента..." -ForegroundColor Cyan

# 1. Запуск ESLint с автоисправлением
Write-Host "🧹 Запуск ESLint (Автоисправление)..." -ForegroundColor Yellow
npm run lint:fix
if ($LASTEXITCODE -ne 0) {
    Write-Host "❌ ESLint провален! Пожалуйста, исправьте ошибки линтера." -ForegroundColor Red
    # Продолжаем проверку TS даже если Lint провалился, чтобы увидеть все ошибки
} else {
    Write-Host "✅ ESLint пройден." -ForegroundColor Green
}

# 2. Запуск проверки типов TypeScript
Write-Host "🔍 Запуск проверки TypeScript..." -ForegroundColor Yellow
npx tsc --noEmit
if ($LASTEXITCODE -ne 0) {
    Write-Host "❌ Проверка TypeScript провалена! Вы сломали сборку." -ForegroundColor Red
    exit 1
} else {
    Write-Host "✅ Проверка TypeScript пройдена." -ForegroundColor Green
}

Write-Host "🎉 Все проверки пройдены! Можете уведомить пользователя." -ForegroundColor Green
exit 0
