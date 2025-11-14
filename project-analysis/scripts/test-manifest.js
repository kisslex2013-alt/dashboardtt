/**
 * Тестовый скрипт для проверки формата манифеста
 */

import { readFileSync, readdirSync, statSync, createReadStream } from 'fs'
import { join, dirname, relative } from 'path'
import { fileURLToPath } from 'url'
import { createHash } from 'crypto'

const __filename = fileURLToPath(import.meta.url)
const __dirname = dirname(__filename)
const rootDir = join(__dirname, '..')

function calculateFileHash(filePath) {
  const content = readFileSync(filePath)
  return createHash('sha256').update(content).digest('hex')
}

function collectFiles(dir, baseDir = dir, files = []) {
  const entries = readdirSync(dir, { withFileTypes: true })

  for (const entry of entries) {
    const fullPath = join(dir, entry.name)
    const relativePath = relative(baseDir, fullPath).replace(/\\/g, '/')

    if (entry.isDirectory()) {
      collectFiles(fullPath, baseDir, files)
    } else {
      const stats = statSync(fullPath)
      const hash = calculateFileHash(fullPath)
      const manifestPath = relativePath.startsWith('/') ? relativePath : '/' + relativePath
      files.push({
        path: relativePath,
        manifestPath,
        fullPath,
        size: stats.size,
        hash,
      })
    }
  }

  return files
}

const distPath = join(rootDir, 'dist')
const files = collectFiles(distPath, distPath)

const manifest = {}
for (const file of files) {
  manifest[file.manifestPath] = file.hash
}

console.log('Манифест (первые 10 записей):')
console.log(JSON.stringify(Object.fromEntries(Object.entries(manifest).slice(0, 10)), null, 2))
console.log(`\nВсего файлов: ${Object.keys(manifest).length}`)
console.log(`\nindex.html в манифесте: ${manifest['/index.html'] ? '✅ Да' : '❌ Нет'}`)
