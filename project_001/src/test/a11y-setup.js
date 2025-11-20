/**
 * ✅ A11Y: Настройка для accessibility тестирования с axe-core
 * 
 * Этот файл настраивает axe-core для автоматического тестирования
 * accessibility в компонентах React.
 */

import { expect } from 'vitest'
import * as axe from 'axe-core'

// Добавляем axe в глобальный контекст для использования в тестах
global.axe = axe

// Создаем кастомный матчер для проверки accessibility
expect.extend({
  toHaveNoViolations(received) {
    const { pass, violations } = received
    
    if (pass) {
      return {
        message: () => 'Expected accessibility violations, but none were found',
        pass: true,
      }
    }
    
    const violationMessages = violations
      .map(v => `  - ${v.id}: ${v.description}\n    Help: ${v.helpUrl}`)
      .join('\n')
    
    return {
      message: () => `Expected no accessibility violations, but found ${violations.length}:\n${violationMessages}`,
      pass: false,
    }
  },
})

