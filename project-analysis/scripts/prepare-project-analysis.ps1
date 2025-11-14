# Скрипт для подготовки файлов проекта для анализа
# Создает папку project-analysis со всеми необходимыми файлами

$ErrorActionPreference = "Continue"
$targetFolder = "project-analysis"
$rootPath = Get-Location

Write-Host "Подготовка файлов для анализа проекта..." -ForegroundColor Cyan
Write-Host "Рабочая директория: $rootPath" -ForegroundColor Gray

# Удаляем старую папку если существует
if (Test-Path $targetFolder) {
    Write-Host "Удаление старой папки $targetFolder..." -ForegroundColor Yellow
    try {
        Remove-Item -Path $targetFolder -Recurse -Force -ErrorAction Stop
        Write-Host "  [OK] Старая папка удалена" -ForegroundColor Green
    } catch {
        Write-Host "  [ERROR] Ошибка при удалении: $_" -ForegroundColor Red
        exit 1
    }
}

# Создаем новую папку
try {
    New-Item -ItemType Directory -Path $targetFolder -Force | Out-Null
    Write-Host "[OK] Создана папка: $targetFolder" -ForegroundColor Green
} catch {
    Write-Host "[ERROR] Ошибка при создании папки: $_" -ForegroundColor Red
    exit 1
}

# Функция для безопасного копирования с прогрессом
function Copy-IfExists {
    param(
        [string]$Source,
        [string]$Destination
    )
    
    if (-not (Test-Path $Source)) {
        Write-Host "  [SKIP] $Source (не найден)" -ForegroundColor DarkGray
        return $false
    }
    
    try {
        Write-Host "  [COPY] $Source..." -ForegroundColor Yellow -NoNewline
        
        # Создаем родительскую директорию если нужно
        $destParent = Split-Path -Parent $Destination -ErrorAction SilentlyContinue
        if ($destParent -and -not (Test-Path $destParent)) {
            New-Item -ItemType Directory -Path $destParent -Force | Out-Null
        }
        
        # Копируем с обработкой ошибок
        $copyParams = @{
            Path = $Source
            Destination = $Destination
            Recurse = $true
            Force = $true
            ErrorAction = "Stop"
        }
        
        Copy-Item @copyParams
        
        Write-Host " [OK]" -ForegroundColor Green
        return $true
    } catch {
        Write-Host " [ERROR] Ошибка: $_" -ForegroundColor Red
        return $false
    }
}

Write-Host "`nКопирование папок..." -ForegroundColor Cyan
$folders = @(
    "src",
    "public",
    "scripts",
    "docs",
    "changelog",
    ".cursor\rules"
)

foreach ($folder in $folders) {
    Copy-IfExists -Source $folder -Destination "$targetFolder\$folder"
}

Write-Host "`nКопирование конфигурационных файлов..." -ForegroundColor Cyan
$configFiles = @(
    "package.json",
    "package-lock.json",
    "vite.config.js",
    "tailwind.config.js",
    "postcss.config.js",
    "eslint.config.js",
    "vitest.config.js",
    "index.html",
    "tsconfig.json",
    "tsconfig.node.json",
    ".prettierrc",
    ".prettierignore",
    "netlify.toml",
    "env.example.txt"
)

foreach ($file in $configFiles) {
    Copy-IfExists -Source $file -Destination "$targetFolder\$file"
}

# Копируем README если есть
if (Test-Path "README.md") {
    Copy-IfExists -Source "README.md" -Destination "$targetFolder\README.md"
}

Write-Host "`n[OK] Готово! Файлы скопированы в папку: $targetFolder" -ForegroundColor Green

# Вычисление размера с обработкой ошибок и таймаутом
Write-Host "`nВычисление размера папки..." -ForegroundColor Cyan
try {
    $files = Get-ChildItem -Path $targetFolder -Recurse -File -ErrorAction Stop
    $size = ($files | Measure-Object -Property Length -Sum -ErrorAction Stop).Sum / 1MB
    Write-Host "  Размер: $([math]::Round($size, 2)) MB" -ForegroundColor Yellow
    Write-Host "  Файлов: $($files.Count)" -ForegroundColor Yellow
} catch {
    Write-Host "  [WARNING] Не удалось вычислить размер: $_" -ForegroundColor Yellow
}

Write-Host "`nДля создания архива выполните:" -ForegroundColor Cyan
$archiveCommand = "Compress-Archive -Path $targetFolder -DestinationPath project-analysis.zip -Force"
Write-Host "  $archiveCommand" -ForegroundColor White
