import fs from 'fs'
import path from 'path'

const testFile = path.join(process.cwd(), 'src/utils/__tests__/paymentCalculations.test.js')

let content = fs.readFileSync(testFile, 'utf8')

// Исправляем тест - ноябрь имеет 30 дней
content = content.replace(
  'expect(period.end.getDate()).toBe(31);',
  'expect(period.end.getDate()).toBe(30);' // ноябрь имеет 30 дней
)

fs.writeFileSync(testFile, content, 'utf8')
console.log('✅ Тест исправлен')
