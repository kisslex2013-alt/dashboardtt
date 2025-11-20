import { execSync } from 'child_process'
import { existsSync, mkdirSync, copyFileSync, readdirSync, statSync, writeFileSync } from 'fs'
import { join, dirname, basename } from 'path'
import { fileURLToPath } from 'url'

const __filename = fileURLToPath(import.meta.url)
const __dirname = dirname(__filename)
const projectRoot = join(__dirname, '..')

/**
 * Создает бекап текущего состояния проекта
 * Копирует все файлы из src/ в backups/backup_YYYY-MM-DD_HH-MM-SS/
 */
function createBackup(reason = 'manual') {
  const timestamp = new Date().toISOString().replace(/[:.]/g, '-').slice(0, 19)
  const backupName = `backup_${timestamp}_${reason}`
  const backupDir = join(projectRoot, 'backups', backupName)

  // Список директорий и файлов для бекапа
  const itemsToBackup = [
    'src',
    'public',
    'index.html',
    'vite.config.js',
    'package.json',
    'tailwind.config.js',
    'postcss.config.js',
    'vitest.config.js',
  ]

  console.log(`📦 Создание бекапа: ${backupName}`)

  try {
    // Создаем директорию бекапа
    if (!existsSync(backupDir)) {
      mkdirSync(backupDir, { recursive: true })
    }

    let filesBackedUp = 0

    // Копируем файлы и директории
    for (const item of itemsToBackup) {
      const sourcePath = join(projectRoot, item)
      const targetPath = join(backupDir, item)

      if (!existsSync(sourcePath)) {
        console.log(`⚠️  Пропущено (не найдено): ${item}`)
        continue
      }

      const stats = statSync(sourcePath)

      if (stats.isDirectory()) {
        // Рекурсивно копируем директорию
        copyDirectory(sourcePath, targetPath)
        filesBackedUp += countFiles(sourcePath)
      } else {
        // Копируем файл
        const targetDir = dirname(targetPath)
        if (!existsSync(targetDir)) {
          mkdirSync(targetDir, { recursive: true })
        }
        copyFileSync(sourcePath, targetPath)
        filesBackedUp++
      }
    }

    // Создаем файл с информацией о бекапе
    const backupInfo = {
      timestamp: new Date().toISOString(),
      reason,
      filesCount: filesBackedUp,
      gitCommit: getGitCommit(),
      gitBranch: getGitBranch(),
    }

    const infoPath = join(backupDir, 'backup-info.json')
    writeFileSync(infoPath, JSON.stringify(backupInfo, null, 2))

    console.log(`✅ Бекап создан: ${backupName}`)
    console.log(`   Файлов скопировано: ${filesBackedUp}`)
    console.log(`   Путь: ${backupDir}`)
    console.log(`   Git commit: ${backupInfo.gitCommit}`)
    console.log(`   Git branch: ${backupInfo.gitBranch}`)

    return { success: true, backupDir, backupName, filesBackedUp }
  } catch (error) {
    console.error('❌ Ошибка создания бекапа:', error.message)
    return { success: false, error: error.message }
  }
}

/**
 * Рекурсивно копирует директорию
 */
function copyDirectory(source, target) {
  if (!existsSync(target)) {
    mkdirSync(target, { recursive: true })
  }

  const items = readdirSync(source)

  for (const item of items) {
    const sourcePath = join(source, item)
    const targetPath = join(target, item)
    const stats = statSync(sourcePath)

    if (stats.isDirectory()) {
      copyDirectory(sourcePath, targetPath)
    } else {
      copyFileSync(sourcePath, targetPath)
    }
  }
}

/**
 * Подсчитывает количество файлов в директории
 */
function countFiles(dir) {
  let count = 0
  const items = readdirSync(dir)

  for (const item of items) {
    const itemPath = join(dir, item)
    const stats = statSync(itemPath)

    if (stats.isDirectory()) {
      count += countFiles(itemPath)
    } else {
      count++
    }
  }

  return count
}

/**
 * Получает текущий git commit hash
 */
function getGitCommit() {
  try {
    return execSync('git rev-parse HEAD', { cwd: projectRoot, encoding: 'utf-8' }).trim()
  } catch {
    return 'unknown'
  }
}

/**
 * Получает текущую git branch
 */
function getGitBranch() {
  try {
    return execSync('git rev-parse --abbrev-ref HEAD', { cwd: projectRoot, encoding: 'utf-8' }).trim()
  } catch {
    return 'unknown'
  }
}

// Запуск скрипта
const reason = process.argv[2] || 'manual'
const result = createBackup(reason)

if (!result.success) {
  process.exit(1)
}

