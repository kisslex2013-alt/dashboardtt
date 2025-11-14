import fs from 'fs'
import path from 'path'

const testFile = path.join(process.cwd(), 'src/utils/__tests__/dateHelpers.test.js')

// Читаем файл
const content = fs.readFileSync(testFile, 'utf8')

// Находим строку с getYesterdayRange и исправляем её
const lines = content.split('\n')
const fixedLines = lines.map((line, index) => {
  // Ищем строку с .label).toBe и неправильной кодировкой для "Вчера"
  if (line.includes('.label') && line.includes('toBe') && line.includes('getYesterdayRange')) {
    // Заменяем любую строку в кавычках после toBe на правильную
    return line.replace(/toBe\('[^']*'\)/, "toBe('Вчера')")
  }
  // Также проверяем строки вокруг getYesterdayRange
  if (
    line.includes('getYesterdayRange') ||
    (index > 0 && lines[index - 1]?.includes('getYesterdayRange'))
  ) {
    if (line.includes('.label') && line.includes('toBe')) {
      // Находим неправильную кодировку и заменяем
      const match = line.match(/toBe\('([^']+)'\)/)
      if (match && match[1] !== 'Вчера' && match[1].length > 0) {
        return line.replace(/toBe\('[^']*'\)/, "toBe('Вчера')")
      }
    }
  }
  return line
})

// Также делаем глобальную замену всех неправильных вхождений
let fixedContent = fixedLines.join('\n')

// Ищем все вхождения неправильной кодировки для "Вчера" (может быть в разных формах)
// Заменяем все варианты неправильной кодировки на правильную
const wrongPatterns = [
  /toBe\('Р'С‡РµСЂР°'\)/g,
  /toBe\('Р'С‡РµСЂР°'\)/g,
  /\.label\)\.toBe\('[^']*Р'С‡РµСЂР°[^']*'\)/g,
]

wrongPatterns.forEach(pattern => {
  fixedContent = fixedContent.replace(pattern, match => {
    if (match.includes('.label')) {
      return ".label).toBe('Вчера')"
    }
    return "toBe('Вчера')"
  })
})

// Записываем обратно
fs.writeFileSync(testFile, fixedContent, 'utf8')
console.log('✅ Кодировка исправлена')
