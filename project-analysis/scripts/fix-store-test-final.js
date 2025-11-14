import fs from 'fs'
import path from 'path'

const testFile = path.join(process.cwd(), 'src/store/__tests__/useEntriesStore.test.js')

let content = fs.readFileSync(testFile, 'utf8')

// Заменяем все вхождения clearAllEntries на clearEntries
content = content.replace(/clearAllEntries/g, 'clearEntries')

fs.writeFileSync(testFile, content, 'utf8')
console.log('✅ Исправлено')
