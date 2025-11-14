import fs from 'fs'
import path from 'path'

const testFile = path.join(process.cwd(), 'src/store/__tests__/useEntriesStore.test.js')

let content = fs.readFileSync(testFile, 'utf8')

// Исправляем тесты
const fixes = [
  // Добавляем vi.useFakeTimers в beforeEach
  {
    from: "describe('useEntriesStore', () => {\n  beforeEach(() => {",
    to: "describe('useEntriesStore', () => {\n  beforeEach(() => {\n    vi.useFakeTimers();",
  },
  // Добавляем afterEach для очистки таймеров
  {
    from: '    vi.clearAllMocks();\n  });',
    to: '    vi.clearAllMocks();\n  });\n\n  afterEach(() => {\n    vi.useRealTimers();\n  });',
  },
  // Исправляем название метода
  {
    from: 'clearAllEntries',
    to: 'clearEntries',
  },
]

fixes.forEach(({ from, to }) => {
  content = content.replace(from, to)
})

fs.writeFileSync(testFile, content, 'utf8')
console.log('✅ Тесты исправлены')
