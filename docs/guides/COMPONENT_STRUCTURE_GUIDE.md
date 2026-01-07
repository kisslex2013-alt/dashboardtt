# 📐 Руководство по структуре компонентов

> Единые стандарты организации компонентов в проекте Time Tracker Dashboard

---

## 🏗️ Стандартная структура компонента

### Простые компоненты (1 файл)

```
ComponentName.tsx
```

Для простых компонентов без дополнительной логики достаточно одного файла.

**Пример:**
```
Button.tsx
Toggle.tsx
Badge.tsx
```

---

### Средние компоненты (с тестами)

```
ComponentName/
├── index.tsx          # Главный компонент
└── ComponentName.test.tsx  # Тесты (опционально)
```

**Пример:**
```
Card/
├── index.tsx
└── Card.test.tsx
```

---

### Сложные компоненты (полная структура)

```
ComponentName/
├── index.tsx                    # Главный компонент (100-200 строк)
├── ComponentName.tsx            # Альтернатива: сам компонент
├── ComponentName.test.tsx       # Тесты
├── ComponentName.stories.tsx    # Storybook (опционально)
├── README.md                    # Документация компонента
├── hooks/                       # Специфичные хуки компонента
│   ├── useComponentLogic.ts
│   └── useComponentState.ts
├── utils/                       # Вспомогательные функции
│   ├── componentHelpers.ts
│   └── componentFormatters.ts
├── types.ts                     # Типы компонента
└── constants.ts                # Константы компонента
```

**Пример:**
```
PaymentDatesSettingsModal/
├── index.tsx
├── PaymentCalendar.tsx
├── PaymentDateItem.tsx
├── hooks/
│   ├── usePaymentCalendar.ts
│   └── usePaymentValidation.ts
└── utils/
    └── calendarHelpers.ts
```

---

## 📝 Правила именования

### Файлы и директории

- **Компоненты**: PascalCase (`UserCard.tsx`, `PaymentModal.tsx`)
- **Хуки**: camelCase с префиксом `use` (`useAuth.ts`, `useTimer.ts`)
- **Утилиты**: camelCase (`formatDate.ts`, `calculateHours.ts`)
- **Константы**: UPPER_SNAKE_CASE (`API_BASE_URL.ts`, `DEFAULT_SETTINGS.ts`)
- **Типы/Интерфейсы**: PascalCase (`UserData.ts`, `ApiResponse.ts`)
- **Тесты**: `.test.ts` или `.test.tsx` (`Button.test.tsx`)
- **Stories**: `.stories.tsx` (`Button.stories.tsx`)

### Переменные и функции

- **Компоненты**: PascalCase (`const UserCard = () => {}`)
- **Функции**: camelCase (`const formatDate = () => {}`)
- **Константы**: UPPER_SNAKE_CASE (`const MAX_ENTRIES = 100`)
- **Приватные функции**: camelCase с префиксом `_` (опционально) (`const _internalHelper = () => {}`)

---

## 📦 Порядок импортов

### Стандартный порядок импортов:

```typescript
// 1. React и React-специфичные библиотеки
import { useState, useEffect, useCallback } from 'react'
import { useStore } from 'zustand'

// 2. Внешние библиотеки (третьи стороны)
import { format } from 'date-fns'
import { motion } from 'framer-motion'

// 3. Внутренние утилиты и типы
import { formatDate } from '../../utils/dateHelpers'
import { logger } from '../../utils/logger'
import type { TimeEntry } from '../../types'

// 4. Компоненты (от общих к специфичным)
import { Button } from '../ui/Button'
import { Modal } from '../ui/Modal'
import { EntryItem } from '../entries/EntryItem'

// 5. Хуки
import { useTimer } from '../../hooks/useTimer'
import { useEntries } from '../../hooks/useEntries'

// 6. Store селекторы
import { useEntriesStore } from '../../store/useEntriesStore'

// 7. Константы
import { DEFAULT_SETTINGS } from '../../constants'

// 8. Стили (если есть отдельный файл стилей)
import './ComponentName.css'
```

### Группировка импортов:

- Пустая строка между группами
- Сортировка внутри группы по алфавиту (опционально)
- Абсолютные импорты через алиасы (`@/`, `@components/`, `@utils/`)

---

## 🎯 Структура компонента внутри файла

### Порядок элементов в компоненте:

```typescript
// 1. Импорты (см. выше)

// 2. Типы и интерфейсы
interface ComponentProps {
  // ...
}

// 3. Константы компонента
const DEFAULT_VALUE = 100

// 4. Главный компонент
export function ComponentName({ prop1, prop2 }: ComponentProps) {
  // 4.1. Хуки состояния
  const [state, setState] = useState()
  
  // 4.2. Store селекторы
  const entries = useEntriesStore(state => state.entries)
  
  // 4.3. Вычисляемые значения (useMemo)
  const computed = useMemo(() => {
    // ...
  }, [dependencies])
  
  // 4.4. Обработчики событий (useCallback)
  const handleClick = useCallback(() => {
    // ...
  }, [dependencies])
  
  // 4.5. Эффекты (useEffect)
  useEffect(() => {
    // ...
  }, [dependencies])
  
  // 4.6. Ранние возвраты (early returns)
  if (!prop1) {
    return null
  }
  
  // 4.7. Рендер
  return (
    <div>
      {/* JSX */}
    </div>
  )
}

// 5. Экспорты (если есть дополнительные)
export { ComponentName as default }
```

---

## 📚 Документация компонентов

### JSDoc для компонентов

```typescript
/**
 * Компонент карточки пользователя
 *
 * @example
 * ```tsx
 * <UserCard
 *   name="Иван Иванов"
 *   email="ivan@example.com"
 *   avatar="/avatar.jpg"
 * />
 * ```
 */
export function UserCard({ name, email, avatar }: UserCardProps) {
  // ...
}
```

### README.md для сложных компонентов

Создавайте README.md для компонентов, которые:
- Имеют сложную логику (>300 строк)
- Используют несколько хуков
- Имеют подкомпоненты
- Требуют дополнительных объяснений

**Структура README.md:**
- Описание компонента
- Props и их типы
- Примеры использования
- Используемые хуки и утилиты
- Известные ограничения
- Связанные компоненты

---

## 🧪 Тестирование

### Расположение тестов

- Рядом с компонентом: `ComponentName.test.tsx`
- Или в отдельной папке `__tests__/` на уровне компонента

### Структура теста

```typescript
import { describe, it, expect } from 'vitest'
import { render, screen } from '@testing-library/react'
import { ComponentName } from './ComponentName'

describe('ComponentName', () => {
  it('should render correctly', () => {
    render(<ComponentName prop1="value" />)
    expect(screen.getByText('Expected Text')).toBeInTheDocument()
  })
})
```

---

## 🎨 Стилизация

### Tailwind CSS

Используйте Tailwind классы напрямую в JSX:

```tsx
<div className="flex items-center justify-between p-4 bg-white dark:bg-gray-800">
  {/* ... */}
</div>
```

### Группировка классов

Группируйте классы по категориям для читаемости:

```tsx
<div className="
  flex items-center justify-between    // Layout
  w-full h-12                          // Sizing
  px-4 py-2                            // Spacing
  text-lg font-semibold                // Typography
  bg-blue-600 text-white               // Colors
  rounded-lg shadow-md                 // Effects
  transition-colors duration-200       // Transitions
">
```

---

## 🔗 Связанные документы

- [Code Review Checklist](./CODE_REVIEW_CHECKLIST.md)
- [JSDoc Guidelines](./JSDOC_GUIDELINES.md)
- [Testing Guide](./TESTING_GUIDE.md)

---

**Последнее обновление:** 2025-11-17  
**Версия:** 1.0

