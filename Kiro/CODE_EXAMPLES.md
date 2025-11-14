# 💻 Примеры улучшений кода

## 1. ⚡ Виртуализация списка записей

### Текущая реализация (EntriesList.jsx)
Рендерит все записи сразу - медленно при >1000 записей

### Улучшенная версия с виртуализацией

```javascript
// src/components/entries/VirtualizedEntriesList.jsx
import { useVirtualizer } from '@tanstack/react-virtual'
import { useRef } from 'react'

export const VirtualizedEntriesList = ({ entries, onEditEntry }) => {
  const parentRef = useRef(null)
  
  const virtualizer = useVirtualizer({
    count: entries.length,
    getScrollElement: () => parentRef.current,
    estimateSize: () => 80, // Примерная высота строки
    overscan: 5, // Рендерить 5 дополнительных элементов
  })
  
  return (
    <div ref={parentRef} className="h-[600px] overflow-auto">
      <div
        style={{
          height: `${virtualizer.getTotalSize()}px`,
          position: 'relative',
        }}
      >
        {virtualizer.getVirtualItems().map((virtualRow) => {
          const entry = entries[virtualRow.index]
          return (
            <div
              key={entry.id}
              style={{
                position: 'absolute',
                top: 0,
                left: 0,
                width: '100%',
                height: `${virtualRow.size}px`,
                transform: `translateY(${virtualRow.start}px)`,
              }}
            >
              <EntryItem entry={entry} onEdit={onEditEntry} />
            </div>
          )
        })}
      </div>
    </div>
  )
}
```



## 2. 🧠 Мемоизация тяжелых вычислений

### Проблема в calculations.js
Пересчет статистики при каждом рендере

### Решение с useMemo

```javascript
// src/hooks/useStatistics.js
import { useMemo } from 'react'
import { calculateDailyStats } from '@utils/calculations'

export const useStatistics = (entries, dateRange) => {
  // Мемоизируем тяжелые вычисления
  const statistics = useMemo(() => {
    if (!entries.length) return null
    
    return calculateDailyStats(entries, dateRange)
  }, [entries, dateRange]) // Пересчет только при изменении данных
  
  return statistics
}
```

### Использование в компоненте

```javascript
// src/components/statistics/StatisticsOverview.jsx
import { useStatistics } from '@hooks/useStatistics'

export const StatisticsOverview = () => {
  const entries = useEntriesStore(state => state.entries)
  const dateRange = useSettingsStore(state => state.dateRange)
  
  // Вычисления происходят только при изменении entries или dateRange
  const stats = useStatistics(entries, dateRange)
  
  if (!stats) return <EmptyState />
  
  return (
    <div className="grid grid-cols-4 gap-4">
      <StatCard title="Всего часов" value={stats.totalHours} />
      <StatCard title="Доход" value={stats.totalIncome} />
      {/* ... */}
    </div>
  )
}
```



## 3. 🔐 Валидация с Zod

### Текущая проблема
Нет строгой валидации при импорте данных

### Решение с Zod схемами

```javascript
// src/schemas/entry.schema.js
import { z } from 'zod'

export const EntrySchema = z.object({
  id: z.string().uuid(),
  date: z.string().datetime(),
  start: z.string().regex(/^\d{2}:\d{2}$/, 'Формат времени: HH:MM'),
  end: z.string().regex(/^\d{2}:\d{2}$/, 'Формат времени: HH:MM'),
  category: z.string().min(1, 'Категория обязательна'),
  hours: z.number().positive('Часы должны быть положительными'),
  rate: z.number().positive().optional(),
  income: z.number().nonnegative().optional(),
  description: z.string().max(500).optional(),
}).refine(
  (data) => {
    // Проверка: end должен быть после start
    const [startH, startM] = data.start.split(':').map(Number)
    const [endH, endM] = data.end.split(':').map(Number)
    return (endH * 60 + endM) > (startH * 60 + startM)
  },
  { message: 'Время окончания должно быть после времени начала' }
)

export const ImportDataSchema = z.object({
  entries: z.array(EntrySchema),
  categories: z.array(z.object({
    id: z.string(),
    name: z.string().min(1),
    icon: z.string(),
    color: z.string().regex(/^#[0-9A-F]{6}$/i),
    rate: z.number().nonnegative(),
  })).optional(),
  settings: z.object({
    dailyGoal: z.number().positive(),
  }).optional(),
})
```

### Использование в ImportModal

```javascript
// src/components/modals/ImportModal.jsx
import { ImportDataSchema } from '@/schemas/entry.schema'

export const ImportModal = ({ onImport }) => {
  const handleFileUpload = async (file) => {
    try {
      const text = await file.text()
      const data = JSON.parse(text)
      
      // Валидация с Zod
      const validatedData = ImportDataSchema.parse(data)
      
      // Данные валидны, можно импортировать
      onImport(validatedData, 'replace')
      showSuccess('Данные успешно импортированы')
      
    } catch (error) {
      if (error instanceof z.ZodError) {
        // Показываем понятные ошибки валидации
        const errors = error.errors.map(e => 
          `${e.path.join('.')}: ${e.message}`
        ).join('\n')
        showError(`Ошибка валидации:\n${errors}`)
      } else {
        showError('Ошибка чтения файла')
      }
    }
  }
  
  return (
    // ... JSX
  )
}
```



## 4. 🎨 Улучшенные skeleton screens

### Текущая реализация
Простой SkeletonCard без деталей

### Улучшенная версия с пульсацией

```javascript
// src/components/ui/SkeletonLoader.jsx
export const SkeletonLoader = ({ variant = 'card' }) => {
  const variants = {
    card: (
      <div className="glass-effect rounded-xl p-6 animate-pulse">
        <div className="h-4 bg-gray-300 dark:bg-gray-700 rounded w-1/4 mb-4"></div>
        <div className="h-8 bg-gray-300 dark:bg-gray-700 rounded w-1/2 mb-2"></div>
        <div className="h-3 bg-gray-300 dark:bg-gray-700 rounded w-3/4"></div>
      </div>
    ),
    
    table: (
      <div className="space-y-3 animate-pulse">
        {[...Array(5)].map((_, i) => (
          <div key={i} className="flex gap-4">
            <div className="h-12 bg-gray-300 dark:bg-gray-700 rounded w-1/6"></div>
            <div className="h-12 bg-gray-300 dark:bg-gray-700 rounded w-2/6"></div>
            <div className="h-12 bg-gray-300 dark:bg-gray-700 rounded w-1/6"></div>
            <div className="h-12 bg-gray-300 dark:bg-gray-700 rounded w-2/6"></div>
          </div>
        ))}
      </div>
    ),
    
    chart: (
      <div className="glass-effect rounded-xl p-6 animate-pulse">
        <div className="h-4 bg-gray-300 dark:bg-gray-700 rounded w-1/3 mb-6"></div>
        <div className="flex items-end gap-2 h-64">
          {[...Array(12)].map((_, i) => (
            <div
              key={i}
              className="bg-gray-300 dark:bg-gray-700 rounded-t flex-1"
              style={{ height: `${Math.random() * 100}%` }}
            ></div>
          ))}
        </div>
      </div>
    ),
  }
  
  return variants[variant] || variants.card
}
```

### Использование

```javascript
// src/components/statistics/StatisticsOverview.jsx
import { SkeletonLoader } from '@/components/ui/SkeletonLoader'

export const StatisticsOverview = () => {
  const { data, isLoading } = useStatistics()
  
  if (isLoading) {
    return (
      <div className="grid grid-cols-4 gap-4">
        <SkeletonLoader variant="card" />
        <SkeletonLoader variant="card" />
        <SkeletonLoader variant="card" />
        <SkeletonLoader variant="card" />
      </div>
    )
  }
  
  return (
    // ... реальный контент
  )
}
```



## 5. 📱 Улучшенное мобильное меню с жестами

### Текущая реализация
Простое открытие/закрытие

### Улучшенная версия с swipe

```javascript
// src/components/layout/MobileMenu.jsx
import { motion, useMotionValue, useTransform, PanInfo } from 'framer-motion'
import { useState } from 'react'

export const MobileMenu = ({ isOpen, onClose, children }) => {
  const y = useMotionValue(0)
  const opacity = useTransform(y, [0, 300], [1, 0])
  
  const handleDragEnd = (event: MouseEvent, info: PanInfo) => {
    // Если свайп вниз больше 150px - закрываем
    if (info.offset.y > 150) {
      onClose()
    }
  }
  
  return (
    <motion.div
      initial={{ y: '100%' }}
      animate={{ y: isOpen ? 0 : '100%' }}
      exit={{ y: '100%' }}
      transition={{ type: 'spring', damping: 30, stiffness: 300 }}
      drag="y"
      dragConstraints={{ top: 0, bottom: 300 }}
      dragElastic={0.2}
      onDragEnd={handleDragEnd}
      style={{ y, opacity }}
      className="fixed inset-x-0 bottom-0 z-50 bg-white dark:bg-gray-800 rounded-t-3xl shadow-2xl"
    >
      {/* Индикатор свайпа */}
      <div className="flex justify-center pt-3 pb-2">
        <div className="w-12 h-1.5 bg-gray-300 dark:bg-gray-600 rounded-full" />
      </div>
      
      <div className="p-6 max-h-[80vh] overflow-y-auto">
        {children}
      </div>
    </motion.div>
  )
}
```

