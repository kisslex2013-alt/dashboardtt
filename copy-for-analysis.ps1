# Скрипт для копирования файлов проекта для анализа
$targetFolder = "project-analysis"

Write-Host "Создаю папку для анализа проекта: $targetFolder" -ForegroundColor Cyan

# Удаляем старую папку если существует
if (Test-Path $targetFolder) {
    Remove-Item -Path $targetFolder -Recurse -Force
}

# Создаем новую папку
New-Item -ItemType Directory -Path $targetFolder -Force | Out-Null
New-Item -ItemType Directory -Path "$targetFolder\.cursor" -Force | Out-Null

Write-Host "Копирую исходный код..." -ForegroundColor Yellow
Copy-Item -Path "src" -Destination "$targetFolder\src" -Recurse -Force

Write-Host "Копирую публичные ресурсы..." -ForegroundColor Yellow
Copy-Item -Path "public" -Destination "$targetFolder\public" -Recurse -Force

Write-Host "Копирую скрипты..." -ForegroundColor Yellow
Copy-Item -Path "scripts" -Destination "$targetFolder\scripts" -Recurse -Force

Write-Host "Копирую документацию..." -ForegroundColor Yellow
Copy-Item -Path "docs" -Destination "$targetFolder\docs" -Recurse -Force

Write-Host "Копирую changelog..." -ForegroundColor Yellow
Copy-Item -Path "changelog" -Destination "$targetFolder\changelog" -Recurse -Force

Write-Host "Копирую правила проекта..." -ForegroundColor Yellow
Copy-Item -Path ".cursor\rules" -Destination "$targetFolder\.cursor\rules" -Recurse -Force

Write-Host "Копирую конфигурационные файлы..." -ForegroundColor Yellow
$configFiles = @(
    "package.json",
    "vite.config.js",
    "tailwind.config.js",
    "postcss.config.js",
    "eslint.config.js",
    "vitest.config.js",
    "index.html",
    "tsconfig.json",
    "tsconfig.node.json",
    ".prettierrc",
    "netlify.toml",
    "env.example.txt"
)

foreach ($file in $configFiles) {
    if (Test-Path $file) {
        Copy-Item -Path $file -Destination "$targetFolder\" -Force
        Write-Host "  ✓ $file" -ForegroundColor Green
    }
}

# Копируем README если есть
if (Test-Path "README.md") {
    Copy-Item -Path "README.md" -Destination "$targetFolder\" -Force
    Write-Host "  ✓ README.md" -ForegroundColor Green
}

Write-Host "`nФайлы успешно скопированы в папку: $targetFolder" -ForegroundColor Green
Write-Host "Размер папки:" -ForegroundColor Cyan
$size = (Get-ChildItem -Path $targetFolder -Recurse | Measure-Object -Property Length -Sum).Sum / 1MB
Write-Host "  $([math]::Round($size, 2)) MB" -ForegroundColor Cyan

