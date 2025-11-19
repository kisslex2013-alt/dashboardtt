/**
 * ✅ ТЕСТЫ: Тесты для changelogParser.js
 */

import { describe, it, expect } from 'vitest'
import { parseChangelog } from '../changelogParser'

describe('changelogParser', () => {
  it('should parse changelog with version', () => {
    const changelog = `## [1.0.0] - 2025-11-17

### РЕЛИЗ

#### Новые возможности
- Новая функция 1
- Новая функция 2
`

    const result = parseChangelog(changelog)
    expect(result).toHaveLength(1)
    expect(result[0].version).toBe('1.0.0')
    expect(result[0].date).toBe('2025-11-17')
  })

  it('should parse multiple versions', () => {
    const changelog = `## [1.0.0] - 2025-11-17

### РЕЛИЗ

#### Новые возможности
- Функция 1

## [1.1.0] - 2025-11-18

### РЕЛИЗ

#### Улучшения интерфейса
- Улучшение 1
`

    const result = parseChangelog(changelog)
    expect(result).toHaveLength(2)
    expect(result[0].version).toBe('1.0.0')
    expect(result[1].version).toBe('1.1.0')
  })

  it('should categorize changes', () => {
    const changelog = `## [1.0.0] - 2025-11-17

### РЕЛИЗ

#### Новые возможности
- Новая функция

#### Улучшения интерфейса
- Улучшение UI

#### Исправления ошибок
- Исправлен баг

#### Технические улучшения
- Оптимизация кода
`

    const result = parseChangelog(changelog)
    const newFeatures = result[0].categories['Новые возможности']
    const uiImprovements = result[0].categories['Улучшения интерфейса']
    const bugFixes = result[0].categories['Исправления ошибок']
    const techImprovements = result[0].categories['Технические улучшения']
    
    expect(newFeatures.some(item => item.text === 'Новая функция')).toBe(true)
    expect(uiImprovements.some(item => item.text === 'Улучшение UI')).toBe(true)
    expect(bugFixes.some(item => item.text === 'Исправлен баг')).toBe(true)
    expect(techImprovements.some(item => item.text === 'Оптимизация кода')).toBe(true)
  })

  it('should handle empty changelog', () => {
    const result = parseChangelog('')
    expect(result).toEqual([])
  })

  it('should handle changelog without version', () => {
    const changelog = `Some text without version header`
    const result = parseChangelog(changelog)
    expect(result).toEqual([])
  })

  it('should skip technical info lines', () => {
    const changelog = `## [1.0.0] - 2025-11-17

### РЕЛИЗ

#### Новые возможности
- Новая функция
**Версия**: 1.0.0
**Файлы**: file1.js, file2.js
`

    const result = parseChangelog(changelog)
    const items = result[0].categories['Новые возможности']
    expect(items.length).toBeGreaterThan(0)
    // Проверяем, что есть элемент с текстом "Новая функция"
    const hasNewFunction = items.some(item => {
      const text = typeof item === 'string' ? item : item.text || item
      return text.includes('Новая функция')
    })
    expect(hasNewFunction).toBe(true)
    
    // Проверяем, что техническая информация не включена
    const hasVersion = items.some(item => {
      const text = typeof item === 'string' ? item : item.text || item
      return text.includes('**Версия**')
    })
    expect(hasVersion).toBe(false)
  })

  it('should handle case-insensitive categories', () => {
    const changelog = `## [1.0.0] - 2025-11-17

### РЕЛИЗ

#### НОВЫЕ ВОЗМОЖНОСТИ
- Функция 1

#### новые возможности
- Функция 2
`

    const result = parseChangelog(changelog)
    const items = result[0].categories['Новые возможности']
    expect(items.length).toBeGreaterThan(0)
    expect(items.some(item => item.text === 'Функция 1')).toBe(true)
    expect(items.some(item => item.text === 'Функция 2')).toBe(true)
  })
})

