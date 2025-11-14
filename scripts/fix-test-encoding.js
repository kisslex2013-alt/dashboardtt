import fs from 'fs'
import path from 'path'

const testFile = path.join(process.cwd(), 'src/utils/__tests__/dateHelpers.test.js')

// Читаем файл
let content = fs.readFileSync(testFile, 'utf8')

// Исправляем все неправильные строки с кириллицей
const fixes = [
  { wrong: "toBe('СЃРµРіРѕРґРЅСЏ')", correct: "toBe('сегодня')" },
  { wrong: "toBe('РІС‡РµСЂР°')", correct: "toBe('вчера')" },
  { wrong: "toBe('Р·Р°РІС‚СЂР°')", correct: "toBe('завтра')" },
  { wrong: "toBe('3 РґРЅРµР№ РЅР°Р·Р°Рґ')", correct: "toBe('3 дней назад')" },
  { wrong: "toBe('РЎРµРіРѕРґРЅСЏ')", correct: "toBe('Сегодня')" },
  { wrong: "toBe('Р'С‡РµСЂР°')", correct: "toBe('Вчера')" },
  { wrong: "toBe('РўРµРєСѓС‰Р°СЏ РЅРµРґРµР»СЏ')", correct: "toBe('Текущая неделя')" },
  { wrong: "toBe('РўРµРєСѓС‰РёР№ РјРµСЃСЏС†')", correct: "toBe('Текущий месяц')" },
  { wrong: "toBe('РўРµРєСѓС‰РёР№ РіРѕРґ')", correct: "toBe('Текущий год')" },
  // Дополнительные варианты с неправильной кодировкой
  { wrong: /toBe\('Р'С‡РµСЂР°'\)/g, correct: "toBe('Вчера')" },
  { wrong: /\.label\)\.toBe\('Р'С‡РµСЂР°'\)/g, correct: ".label).toBe('Вчера')" },
]

fixes.forEach(({ wrong, correct }) => {
  if (wrong instanceof RegExp) {
    content = content.replace(wrong, correct)
  } else {
    content = content.replace(
      new RegExp(wrong.replace(/[.*+?^${}()|[\]\\]/g, '\\$&'), 'g'),
      correct
    )
  }
})

// Записываем обратно
fs.writeFileSync(testFile, content, 'utf8')
console.log('✅ Кодировка исправлена')
