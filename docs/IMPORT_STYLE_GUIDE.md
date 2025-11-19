# 📦 Руководство по стилю импортов

> Единые стандарты организации импортов во всём проекте Time Tracker Dashboard

---

## 📋 Порядок импортов

### Стандартный порядок (обязательный):

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

---

## 🎯 Правила группировки

### Пустые строки между группами

```typescript
// ✅ ПРАВИЛЬНО
import { useState } from 'react'

import { format } from 'date-fns'

import { formatDate } from '../../utils/dateHelpers'

// ❌ НЕПРАВИЛЬНО
import { useState } from 'react'
import { format } from 'date-fns'
import { formatDate } from '../../utils/dateHelpers'
```

### Сортировка внутри группы

Внутри каждой группы импорты можно сортировать по алфавиту (опционально):

```typescript
// ✅ ПРАВИЛЬНО (сортировка по алфавиту)
import { useEffect, useCallback, useState } from 'react'

// ✅ ТАКЖЕ ПРАВИЛЬНО (логическая группировка)
import { useState, useEffect } from 'react'
import { useCallback, useMemo } from 'react'
```

---

## 🔗 Типы импортов

### Named imports (предпочтительно)

```typescript
// ✅ ПРАВИЛЬНО
import { useState, useEffect } from 'react'
import { format, parseISO } from 'date-fns'

// ❌ ИЗБЕГАТЬ (если не требуется)
import * as React from 'react'
import * as dateFns from 'date-fns'
```

### Default imports

```typescript
// ✅ ПРАВИЛЬНО (для компонентов с default export)
import Button from './Button'
import Modal from './Modal'

// ✅ ПРАВИЛЬНО (для библиотек с default export)
import React from 'react' // если нужно
```

### Type imports

```typescript
// ✅ ПРАВИЛЬНО (для типов)
import type { TimeEntry } from '../../types'
import type { ComponentProps } from './types'

// ✅ ПРАВИЛЬНО (смешанный импорт)
import { formatDate, type DateRange } from '../../utils/dateHelpers'
```

---

## 📍 Абсолютные импорты (алиасы)

### Использование алиасов

Проект использует следующие алиасы (настроены в `vite.config.js`):

```typescript
// ✅ ПРАВИЛЬНО (использование алиасов)
import { formatDate } from '@/utils/dateHelpers'
import { Button } from '@components/ui/Button'
import { useTimer } from '@hooks/useTimer'
import { useEntriesStore } from '@store/useEntriesStore'

// ❌ ИЗБЕГАТЬ (относительные пути для глубокой вложенности)
import { formatDate } from '../../../../utils/dateHelpers'
```

### Доступные алиасы:

- `@/` → `src/`
- `@components/` → `src/components/`
- `@store/` → `src/store/`
- `@hooks/` → `src/hooks/`
- `@utils/` → `src/utils/`
- `@constants/` → `src/constants/`
- `@styles/` → `src/styles/`

---

## 🎨 Примеры

### Простой компонент

```typescript
import { useState } from 'react'

import { Button } from '../ui/Button'

export function SimpleComponent() {
  const [count, setCount] = useState(0)
  
  return (
    <Button onClick={() => setCount(count + 1)}>
      Count: {count}
    </Button>
  )
}
```

### Сложный компонент

```typescript
import { useState, useEffect, useCallback, useMemo } from 'react'
import { format, startOfDay, endOfDay } from 'date-fns'
import { motion } from 'framer-motion'

import { formatDate } from '@/utils/dateHelpers'
import { logger } from '@/utils/logger'
import type { TimeEntry } from '@/types'

import { Button } from '@components/ui/Button'
import { Modal } from '@components/ui/Modal'
import { EntryItem } from '@components/entries/EntryItem'

import { useTimer } from '@hooks/useTimer'
import { useEntries } from '@hooks/useEntries'

import { useEntriesStore } from '@store/useEntriesStore'

import { DEFAULT_SETTINGS } from '@constants'

import './ComponentName.css'
```

### Компонент с типами

```typescript
import { useState } from 'react'

import type { ComponentProps } from './types'
import type { TimeEntry } from '@/types'

import { formatDate } from '@/utils/dateHelpers'

import { Button } from '../ui/Button'
```

---

## ⚠️ Частые ошибки

### ❌ Неправильный порядок

```typescript
// ❌ НЕПРАВИЛЬНО
import { formatDate } from '../../utils/dateHelpers'
import { useState } from 'react'
import { Button } from '../ui/Button'
```

### ❌ Смешивание групп

```typescript
// ❌ НЕПРАВИЛЬНО
import { useState } from 'react'
import { formatDate } from '../../utils/dateHelpers'
import { format } from 'date-fns'
```

### ❌ Отсутствие пустых строк

```typescript
// ❌ НЕПРАВИЛЬНО
import { useState } from 'react'
import { format } from 'date-fns'
import { formatDate } from '../../utils/dateHelpers'
```

### ✅ Правильный вариант

```typescript
// ✅ ПРАВИЛЬНО
import { useState } from 'react'

import { format } from 'date-fns'

import { formatDate } from '../../utils/dateHelpers'

import { Button } from '../ui/Button'
```

---

## 🔧 Настройка ESLint

Для автоматической проверки порядка импортов используйте ESLint правило:

```javascript
// eslint.config.js
import { importOrder } from 'eslint-plugin-import'

export default {
  rules: {
    'import/order': [
      'error',
      {
        groups: [
          'builtin',
          'external',
          'internal',
          'parent',
          'sibling',
          'index',
        ],
        'newlines-between': 'always',
        alphabetize: {
          order: 'asc',
          caseInsensitive: true,
        },
      },
    ],
  },
}
```

---

## 📝 Checklist для code review

При проверке импортов убедитесь, что:

- [ ] Импорты упорядочены по группам
- [ ] Пустые строки между группами
- [ ] Используются алиасы для глубокой вложенности
- [ ] Типы импортируются через `import type`
- [ ] Неиспользуемые импорты удалены
- [ ] Нет циклических зависимостей

---

## 🔗 Связанные документы

- [Component Structure Guide](./COMPONENT_STRUCTURE_GUIDE.md)
- [Code Review Checklist](./CODE_REVIEW_CHECKLIST.md)
- [ESLint Configuration](../eslint.config.js)

---

**Последнее обновление:** 2025-11-17  
**Версия:** 1.0

