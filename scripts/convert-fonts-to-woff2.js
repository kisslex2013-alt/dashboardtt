/**
 * Скрипт для конвертации шрифтов TTF → WOFF2
 * Использует fontmin для конвертации
 */

import Fontmin from 'fontmin'
import { readdir, stat } from 'fs/promises'
import { join, dirname } from 'path'
import { fileURLToPath } from 'url'

const __filename = fileURLToPath(import.meta.url)
const __dirname = dirname(__filename)
const projectRoot = join(__dirname, '..')
const fontsDir = join(projectRoot, 'public', 'fonts')

/**
 * Конвертирует TTF файл в WOFF2
 * @param {string} ttfPath - Путь к TTF файлу
 * @param {string} outputDir - Директория для сохранения WOFF2 файла
 */
async function convertTTFToWOFF2(ttfPath, outputDir) {
  return new Promise((resolve, reject) => {
    const fontmin = new Fontmin()
      .src(ttfPath)
      .dest(outputDir)
      .use(
        Fontmin.ttf2woff2({
          deflate: true, // Максимальное сжатие
        })
      )

    fontmin.run((err, files) => {
      if (err) {
        reject(err)
      } else {
        resolve(files)
      }
    })
  })
}

/**
 * Основная функция
 */
async function main() {
  try {
    console.log('🔄 Начинаю конвертацию шрифтов TTF → WOFF2...\n')

    // Проверяем существование директории
    try {
      await stat(fontsDir)
    } catch (err) {
      console.error(`❌ Директория ${fontsDir} не найдена!`)
      process.exit(1)
    }

    // Получаем список файлов
    const files = await readdir(fontsDir)
    const ttfFiles = files.filter(file => file.endsWith('.ttf'))

    if (ttfFiles.length === 0) {
      console.log('⚠️  TTF файлы не найдены в директории fonts/')
      process.exit(0)
    }

    console.log(`📁 Найдено ${ttfFiles.length} TTF файлов:\n`)
    ttfFiles.forEach(file => console.log(`  - ${file}`))
    console.log('')

    // Конвертируем каждый файл
    for (const ttfFile of ttfFiles) {
      const ttfPath = join(fontsDir, ttfFile)
      const woff2FileName = ttfFile.replace('.ttf', '.woff2')

      console.log(`🔄 Конвертирую ${ttfFile} → ${woff2FileName}...`)

      try {
        const files = await convertTTFToWOFF2(ttfPath, fontsDir)
        console.log(`✅ Успешно: ${woff2FileName}\n`)
      } catch (err) {
        console.error(`❌ Ошибка при конвертации ${ttfFile}:`, err.message)
      }
    }

    console.log('✅ Конвертация завершена!')
    console.log('\n📝 Следующие шаги:')
    console.log('1. Обновите src/index.css с поддержкой WOFF2 и fallback на TTF')
    console.log('2. Протестируйте загрузку шрифтов в браузере')
    console.log('3. Проверьте визуальное отображение текста')
  } catch (err) {
    console.error('❌ Критическая ошибка:', err)
    process.exit(1)
  }
}

main()
