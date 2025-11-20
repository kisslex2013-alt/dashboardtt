/**
 * Скрипт для конвертации изображений PNG → WebP
 * Использует sharp для конвертации
 */

import sharp from 'sharp'
import { readdir, stat } from 'fs/promises'
import { join, dirname } from 'path'
import { fileURLToPath } from 'url'

const __filename = fileURLToPath(import.meta.url)
const __dirname = dirname(__filename)
const projectRoot = join(__dirname, '..')
const imagesDir = join(projectRoot, 'public', 'images')

/**
 * Конвертирует PNG файл в WebP
 * @param {string} pngPath - Путь к PNG файлу
 * @param {string} outputPath - Путь для сохранения WebP файла
 */
async function convertPNGToWebP(pngPath, outputPath) {
  try {
    const metadata = await sharp(pngPath).metadata()
    const originalSize = metadata.width * metadata.height

    // Оптимизированные настройки для WebP
    await sharp(pngPath)
      .webp({
        quality: 85, // Баланс между качеством и размером
        effort: 6, // Максимальное сжатие (0-6)
        lossless: false, // Используем lossy для лучшего сжатия
      })
      .toFile(outputPath)

    return {
      success: true,
      originalSize: metadata.size,
      width: metadata.width,
      height: metadata.height,
    }
  } catch (err) {
    throw new Error(`Ошибка конвертации: ${err.message}`)
  }
}

/**
 * Получает размер файла в KB
 */
async function getFileSizeKB(filePath) {
  try {
    const stats = await stat(filePath)
    return (stats.size / 1024).toFixed(2)
  } catch (err) {
    return null
  }
}

/**
 * Основная функция
 */
async function main() {
  try {
    console.log('🔄 Начинаю конвертацию изображений PNG → WebP...\n')

    // Проверяем существование директории
    try {
      await stat(imagesDir)
    } catch (err) {
      console.error(`❌ Директория ${imagesDir} не найдена!`)
      process.exit(1)
    }

    // Получаем список файлов
    const files = await readdir(imagesDir)
    const pngFiles = files.filter(file => file.endsWith('.png'))

    if (pngFiles.length === 0) {
      console.log('⚠️  PNG файлы не найдены в директории images/')
      process.exit(0)
    }

    console.log(`📁 Найдено ${pngFiles.length} PNG файлов:\n`)
    for (const file of pngFiles) {
      const filePath = join(imagesDir, file)
      const size = await getFileSizeKB(filePath)
      console.log(`  - ${file} (${size} KB)`)
    }
    console.log('')

    // Конвертируем каждый файл
    let totalOriginalSize = 0
    let totalWebPSize = 0

    for (const pngFile of pngFiles) {
      const pngPath = join(imagesDir, pngFile)
      const webpFileName = pngFile.replace('.png', '.webp')
      const webpPath = join(imagesDir, webpFileName)

      console.log(`🔄 Конвертирую ${pngFile} → ${webpFileName}...`)

      try {
        const originalSize = await getFileSizeKB(pngPath)
        await convertPNGToWebP(pngPath, webpPath)
        const webpSize = await getFileSizeKB(webpPath)

        const savings = (((originalSize - webpSize) / originalSize) * 100).toFixed(1)
        totalOriginalSize += parseFloat(originalSize)
        totalWebPSize += parseFloat(webpSize)

        console.log(`✅ Успешно:`)
        console.log(`   Исходный размер: ${originalSize} KB`)
        console.log(`   WebP размер: ${webpSize} KB`)
        console.log(`   Экономия: ${savings}%\n`)
      } catch (err) {
        console.error(`❌ Ошибка при конвертации ${pngFile}:`, err.message)
      }
    }

    if (totalOriginalSize > 0) {
      const totalSavings = (
        ((totalOriginalSize - totalWebPSize) / totalOriginalSize) *
        100
      ).toFixed(1)
      console.log('📊 Итого:')
      console.log(`   Исходный размер: ${totalOriginalSize.toFixed(2)} KB`)
      console.log(`   WebP размер: ${totalWebPSize.toFixed(2)} KB`)
      console.log(
        `   Общая экономия: ${totalSavings}% (${(totalOriginalSize - totalWebPSize).toFixed(2)} KB)\n`
      )
    }

    console.log('✅ Конвертация завершена!')
    console.log('\n📝 Следующие шаги:')
    console.log('1. Обновите компоненты для использования WebP с fallback на PNG')
    console.log('2. Протестируйте отображение изображений в браузере')
    console.log('3. Проверьте поддержку WebP в целевых браузерах')
  } catch (err) {
    console.error('❌ Критическая ошибка:', err)
    process.exit(1)
  }
}

main()
