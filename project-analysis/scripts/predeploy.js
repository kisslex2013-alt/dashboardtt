/**
 * 🎓 Скрипт предварительной подготовки к деплою
 *
 * Выполняет:
 * 1. Обновление версии в package.json
 * 2. Обновление changelog.md
 * 3. Копирование changelog.md в public/changelog/changelog.md
 * 4. Копирование plans.md в public/plans.md (если изменился)
 */

import { readFileSync, writeFileSync, copyFileSync, existsSync, mkdirSync } from 'fs'
import { join, dirname } from 'path'
import { fileURLToPath } from 'url'
import { execSync } from 'child_process'

const __filename = fileURLToPath(import.meta.url)
const __dirname = dirname(__filename)
const rootDir = join(__dirname, '..')

/**
 * Увеличивает версию в формате semver
 */
function bumpVersion(version, level = 'patch') {
  const [major, minor, patch] = version.split('.').map(Number)
  if (level === 'major') return `${major + 1}.0.0`
  if (level === 'minor') return `${major}.${minor + 1}.0`
  return `${major}.${minor}.${patch + 1}`
}

/**
 * Обновляет версию в package.json
 */
function updatePackageVersion(newVersion) {
  const pkgPath = join(rootDir, 'package.json')
  const pkg = JSON.parse(readFileSync(pkgPath, 'utf8'))
  const oldVersion = pkg.version
  pkg.version = newVersion
  writeFileSync(pkgPath, JSON.stringify(pkg, null, 2) + '\n')
  console.log(`✅ Версия обновлена: ${oldVersion} → ${newVersion}`)
  return newVersion
}

/**
 * Обновляет changelog.md новой записью
 */
function updateChangelog(newVersion) {
  const changelogPath = join(rootDir, 'changelog', 'changelog.md')
  const date = new Date().toISOString().split('T')[0]

  // Читаем текущий changelog
  let content = readFileSync(changelogPath, 'utf8')

  // Формируем новую запись
  const newEntry = `## [${newVersion}] - ${date}

### 🚀 **РЕЛИЗ: Автоматический деплой**

#### Технические улучшения
- 🔄 Автоматическое обновление версии и деплой на Cloudflare Pages
- 📦 Оптимизация сборки и развертывания

---

`

  // Вставляем новую запись после заголовка
  const headerIndex = content.indexOf('# История изменений проекта')
  const insertIndex = content.indexOf('\n', headerIndex + 1) + 1

  content = content.slice(0, insertIndex) + newEntry + content.slice(insertIndex)

  writeFileSync(changelogPath, content, 'utf8')
  console.log(`✅ changelog.md обновлён: добавлена версия ${newVersion}`)
}

/**
 * Копирует changelog.md в public/changelog/changelog.md
 */
function copyChangelogToPublic() {
  const sourcePath = join(rootDir, 'changelog', 'changelog.md')
  const targetDir = join(rootDir, 'public', 'changelog')
  const targetPath = join(targetDir, 'changelog.md')

  // Создаем директорию, если не существует
  if (!existsSync(targetDir)) {
    mkdirSync(targetDir, { recursive: true })
  }

  copyFileSync(sourcePath, targetPath)
  console.log('✅ changelog.md скопирован в public/changelog/changelog.md')
}

/**
 * Копирует plans.md в public/plans.md (если исходный файл существует)
 */
function copyPlansToPublic() {
  // Проверяем несколько возможных путей
  const possibleSources = [
    join(rootDir, 'docs', 'plans', 'IMPLEMENTATION_PLAN.md'),
    join(rootDir, 'public', 'plans.md'), // Если уже есть в public
  ]

  const targetPath = join(rootDir, 'public', 'plans.md')

  // Ищем существующий файл
  let sourcePath = null
  for (const path of possibleSources) {
    if (existsSync(path)) {
      sourcePath = path
      break
    }
  }

  // Если исходный файл существует и отличается от целевого, копируем
  if (sourcePath && sourcePath !== targetPath) {
    copyFileSync(sourcePath, targetPath)
    console.log('✅ plans.md обновлён в public/plans.md')
  } else if (existsSync(targetPath)) {
    console.log('✅ plans.md уже актуален в public/plans.md')
  } else {
    console.log('⚠️ Исходный plans.md не найден, пропускаем копирование')
  }
}

/**
 * Обновляет версию в App.jsx
 */
function updateAppVersion(newVersion) {
  const appJsxPath = join(rootDir, 'src', 'App.jsx')

  try {
    let content = readFileSync(appJsxPath, 'utf8')

    // Ищем паттерн версии
    const versionPattern = /(Time Tracker Dashboard v)(\d+\.\d+\.\d+)/

    if (versionPattern.test(content)) {
      content = content.replace(versionPattern, `$1${newVersion}`)
      writeFileSync(appJsxPath, content, 'utf8')
      console.log(`✅ Версия в App.jsx обновлена: ${newVersion}`)
    } else {
      console.warn('⚠️ Паттерн версии не найден в App.jsx')
    }
  } catch (error) {
    console.warn('⚠️ Не удалось обновить версию в App.jsx:', error.message)
  }
}

// Основная логика
try {
  console.log('🚀 Начинаю подготовку к деплою...\n')

  // Читаем текущую версию (для отображения, не обновляем)
  const pkgPath = join(rootDir, 'package.json')
  const pkg = JSON.parse(readFileSync(pkgPath, 'utf8'))
  const currentVersion = pkg.version

  // * Автоматическое повышение версии отключено
  // Версию нужно менять вручную в package.json или через команду update-version
  // const newVersion = bumpVersion(currentVersion, 'patch');
  // updatePackageVersion(newVersion);
  // updateAppVersion(newVersion);
  // updateChangelog(newVersion);

  // Копируем changelog в public
  copyChangelogToPublic()

  // Копируем plans в public (если нужно)
  copyPlansToPublic()

  console.log('\n✅ Подготовка к деплою завершена успешно!')
  console.log(`📦 Текущая версия: ${currentVersion}`)
} catch (error) {
  console.error('❌ Ошибка при подготовке к деплою:', error)
  process.exit(1)
}
