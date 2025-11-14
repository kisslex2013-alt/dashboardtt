import fs from 'fs'
import path from 'path'

const testFile = path.join(process.cwd(), 'src/utils/__tests__/dateHelpers.test.js')

// Читаем файл
const content = fs.readFileSync(testFile, 'utf8')

// Находим и заменяем все вхождения неправильной кодировки для "Вчера"
// Используем более агрессивный подход - заменяем любую строку после .label).toBe в блоке getYesterdayRange
const lines = content.split('\n')
let inYesterdayBlock = false
const fixedLines = lines.map(line => {
  if (line.includes('getYesterdayRange')) {
    inYesterdayBlock = true
  }
  if (inYesterdayBlock && line.includes('.label') && line.includes('toBe')) {
    inYesterdayBlock = false
    // Заменяем всю строку toBe на правильную
    return line.replace(/toBe\('.*?'\)/, "toBe('Вчера')")
  }
  if (line.includes('describe(') || line.includes('it(')) {
    inYesterdayBlock = false
  }
  return line
})

// Также делаем прямую замену всех возможных вариантов
let fixedContent = fixedLines.join('\n')

// Прямая замена всех вариантов неправильной кодировки
fixedContent = fixedContent.replace(
  /expect\(range\)\.toHaveProperty\('start'\);\s*expect\(range\)\.toHaveProperty\('end'\);\s*expect\(range\.label\)\.toBe\('.*?'\);/g,
  match => {
    // Проверяем, что это блок getYesterdayRange по контексту
    const context = fixedContent.substring(
      Math.max(0, fixedContent.indexOf(match) - 200),
      fixedContent.indexOf(match) + match.length
    )
    if (context.includes('getYesterdayRange')) {
      return match.replace(/\.toBe\('.*?'\)/, ".toBe('Вчера')")
    }
    return match
  }
)

// Еще одна попытка - найти строку 155 и заменить её
const lineNumber = 155
const allLines = fixedContent.split('\n')
if (
  allLines[lineNumber - 1] &&
  allLines[lineNumber - 1].includes('.label') &&
  allLines[lineNumber - 1].includes('toBe')
) {
  allLines[lineNumber - 1] = allLines[lineNumber - 1].replace(/toBe\('.*?'\)/, "toBe('Вчера')")
  fixedContent = allLines.join('\n')
}

// Записываем обратно
fs.writeFileSync(testFile, fixedContent, 'utf8')
console.log('✅ Исправлено')
