# ♿ Accessibility Testing Guide

## Обзор

Проект использует автоматическое тестирование accessibility (a11y) для обеспечения соответствия WCAG 2.1 Level AA.

## Инструменты

### 1. **eslint-plugin-jsx-a11y**
Статический анализ кода на наличие accessibility проблем.

**Использование:**
```bash
npm run lint:a11y
```

### 2. **axe-core**
Автоматическое тестирование accessibility в компонентах и E2E тестах.

**Unit тесты:**
```bash
npm run test:a11y
```

**E2E тесты:**
```bash
npm run test:e2e
```

## Структура тестов

### Unit тесты (Vitest)
- `src/components/ui/__tests__/*.a11y.test.jsx` - тесты для UI компонентов
- Используют `axe-core` для проверки компонентов

### E2E тесты (Playwright)
- `e2e/a11y.spec.js` - тесты для всего приложения
- Проверяют:
  - Отсутствие accessibility нарушений
  - Правильную иерархию заголовков
  - Наличие меток для форм
  - Наличие меток для кнопок
  - Контрастность цветов

## Правила WCAG 2.1 Level AA

### Основные требования:

1. **1.1.1 Non-text Content**: Все изображения имеют alt текст
2. **2.1.1 Keyboard**: Все интерактивные элементы доступны с клавиатуры
3. **2.4.3 Focus Order**: Логический порядок фокуса
4. **3.3.1 Error Identification**: Ошибки связаны с полями
5. **4.1.2 Name, Role, Value**: Правильные роли и имена элементов

## Примеры

### Тест компонента:
```jsx
import { describe, it, expect } from 'vitest'
import { render } from '@testing-library/react'
import { Button } from '../Button'
import * as axeCore from 'axe-core'

async function runAxe(container) {
  return new Promise((resolve) => {
    axeCore.run(container, (err, results) => {
      if (err) {
        resolve({ pass: false, violations: [{ id: 'error', description: err.message }] })
      } else {
        resolve({
          pass: results.violations.length === 0,
          violations: results.violations,
        })
      }
    })
  })
}

describe('Button Accessibility', () => {
  it('should have no accessibility violations', async () => {
    const { container } = render(<Button>Click me</Button>)
    const results = await runAxe(container)
    expect(results.pass).toBe(true)
  })
})
```

### E2E тест:
```js
import { test, expect } from '@playwright/test'
import AxeBuilder from '@axe-core/playwright'

test('should have no accessibility violations', async ({ page }) => {
  await page.goto('/')
  await page.waitForLoadState('networkidle')
  
  const accessibilityScanResults = await new AxeBuilder({ page })
    .withTags(['wcag2a', 'wcag2aa', 'wcag21aa'])
    .analyze()

  expect(accessibilityScanResults.violations).toEqual([])
})
```

## Рекомендации

1. **Всегда добавляйте aria-атрибуты** для интерактивных элементов
2. **Используйте семантические HTML элементы** (button, nav, main, etc.)
3. **Обеспечьте достаточный контраст** цветов (минимум 4.5:1 для текста)
4. **Тестируйте с клавиатуры** - все функции должны быть доступны без мыши
5. **Используйте screen readers** для проверки (NVDA, JAWS, VoiceOver)

## Полезные ссылки

- [WCAG 2.1 Guidelines](https://www.w3.org/WAI/WCAG21/quickref/)
- [axe-core Documentation](https://github.com/dequelabs/axe-core)
- [eslint-plugin-jsx-a11y](https://github.com/jsx-eslint/eslint-plugin-jsx-a11y)

