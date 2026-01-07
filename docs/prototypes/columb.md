# ЗАДАЧА: Система изменения ширины столбцов по горячей клавише (как в Excel)

## ОПИСАНИЕ

Создать невидимую по умолчанию систему изменения ширины столбцов, которая:

1. Активируется по нажатию **Ctrl+Shift+R** (R = Resize)
2. Показывает вертикальные разделители между столбцами
3. Позволяет перетаскивать границы мышкой
4. Сохраняет настройки в localStorage
5. Деактивируется повторным нажатием той же комбинации или по Escape

## ФАЙЛЫ ДЛЯ СОЗДАНИЯ/ИЗМЕНЕНИЯ

1. **src/hooks/useColumnResize.js** (создать новый)
2. **src/components/entries/views/ListView.jsx** (модифицировать)
3. **src/components/entries/views/VirtualizedListView.jsx** (модифицировать)

## ШАГ 1: Создать хук useColumnResize.js

Создай файл `src/hooks/useColumnResize.js`:

```javascript
import { useState, useEffect, useCallback } from 'react'

/**
 * Хук для изменения ширины столбцов с сохранением в localStorage
 */
export function useColumnResize(storageKey = 'listview-column-widths') {
  // Режим изменения размеров (активируется по Ctrl+Shift+R)
  const [resizeMode, setResizeMode] = useState(false)

  // Текущие ширины столбцов (в px)
  const [columnWidths, setColumnWidths] = useState(() => {
    const saved = localStorage.getItem(storageKey)
    return saved
      ? JSON.parse(saved)
      : {
          percentMargin: 6, // Отступ для столбца "Проценты"
          insightsMargin: 48, // Отступ для столбца "Инсайты"
          totalMargin: 48, // Отступ для столбца "Итого"
        }
  })

  // Состояние перетаскивания
  const [dragging, setDragging] = useState(null)

  // Сохранение в localStorage при изменении
  useEffect(() => {
    localStorage.setItem(storageKey, JSON.stringify(columnWidths))
  }, [columnWidths, storageKey])

  // Обработчик горячей клавиши Ctrl+Shift+R
  useEffect(() => {
    const handleKeyDown = e => {
      // Ctrl+Shift+R для включения/выключения режима
      if (e.ctrlKey && e.shiftKey && e.key === 'R') {
        e.preventDefault()
        setResizeMode(prev => !prev)
      }
      // Escape для выхода из режима
      if (e.key === 'Escape' && resizeMode) {
        setResizeMode(false)
      }
    }

    window.addEventListener('keydown', handleKeyDown)
    return () => window.removeEventListener('keydown', handleKeyDown)
  }, [resizeMode])

  // Начало перетаскивания
  const handleDragStart = useCallback(column => {
    setDragging({ column, startX: 0 })
  }, [])

  // Перетаскивание
  const handleDrag = useCallback(
    e => {
      if (!dragging) return

      const deltaX = e.movementX
      const { column } = dragging

      setColumnWidths(prev => ({
        ...prev,
        [column]: Math.max(2, prev[column] + deltaX), // Минимум 2px
      }))
    },
    [dragging]
  )

  // Окончание перетаскивания
  const handleDragEnd = useCallback(() => {
    setDragging(null)
  }, [])

  // Сброс к значениям по умолчанию
  const resetWidths = useCallback(() => {
    setColumnWidths({
      percentMargin: 6,
      insightsMargin: 48,
      totalMargin: 48,
    })
  }, [])

  return {
    resizeMode,
    columnWidths,
    dragging,
    handleDragStart,
    handleDrag,
    handleDragEnd,
    resetWidths,
  }
}
```

## ШАГ 2: Создать компонент разделителя столбцов

Добавь в `src/hooks/useColumnResize.js` компонент разделителя:

```javascript
// Добавь в конец файла useColumnResize.js

/**
 * Компонент вертикального разделителя между столбцами
 */
export function ColumnDivider({ column, onDragStart, isDragging }) {
  return (
    <div
      className="absolute top-0 bottom-0 w-1 cursor-col-resize hover:bg-blue-500 transition-colors"
      style={{
        right: '-2px',
        zIndex: 10,
        backgroundColor: isDragging ? '#3b82f6' : 'transparent',
      }}
      onMouseDown={e => {
        e.preventDefault()
        onDragStart(column)
      }}
      title={`Перетащите для изменения отступа столбца "${column}"`}
    >
      {/* Увеличенная область для захвата (невидимая) */}
      <div className="absolute inset-y-0 -left-2 -right-2" />
    </div>
  )
}
```

## ШАГ 3: Интегрировать в ListView.jsx

Модифицируй `ListView.jsx`:

```javascript
// В начале файла добавь импорт
import { useColumnResize, ColumnDivider } from '../../../hooks/useColumnResize'

// Внутри функции ListView (после строки с categories, dailyGoal)
export function ListView({
  entries,
  onEdit,
  selectionMode = false,
  selectedEntries = new Set(),
  onToggleSelection,
}) {
  const { categories, dailyGoal } = useSettingsStore()

  // ✅ ДОБАВИТЬ: Хук для изменения размеров столбцов
  const {
    resizeMode,
    columnWidths,
    dragging,
    handleDragStart,
    handleDrag,
    handleDragEnd,
    resetWidths,
  } = useColumnResize('listview-column-widths')

  // ✅ ДОБАВИТЬ: Обработчики перетаскивания на документе
  useEffect(() => {
    if (dragging) {
      document.addEventListener('mousemove', handleDrag)
      document.addEventListener('mouseup', handleDragEnd)
      return () => {
        document.removeEventListener('mousemove', handleDrag)
        document.removeEventListener('mouseup', handleDragEnd)
      }
    }
  }, [dragging, handleDrag, handleDragEnd])

  // ... остальной код ListView

  // В компоненте DayAccordion, в JSX summary добавить:

  // ✅ ИЗМЕНИТЬ строку 73 - добавить relative к grid-контейнеру:
  // БЫЛО:
  // <div className="relative px-3 py-2 grid grid-cols-[1fr_auto_auto_auto] ...">

  // СТАЛО:
  ;<div className="relative px-3 py-2 grid grid-cols-[1fr_auto_auto_auto] md:grid-cols-[1fr_auto_auto_auto] items-center hover:bg-gray-50/50 dark:hover:bg-gray-800/50 transition-colors">
    {/* ✅ ДОБАВИТЬ: Индикатор режима изменения размеров */}
    {resizeMode && (
      <div className="absolute top-0 left-0 px-2 py-0.5 bg-blue-500 text-white text-xs rounded-br-md z-20">
        Режим изменения столбцов (Esc для выхода)
      </div>
    )}

    {/* Дата */}
    <div className="flex items-center gap-2 min-w-0">
      <ChevronDown className="w-4 h-4 text-gray-500 dark:text-gray-400 transition-transform duration-200 details-chevron flex-shrink-0" />
      <span className="font-semibold text-gray-800 dark:text-white whitespace-nowrap">
        {formattedDate}
      </span>
    </div>

    {/* Проценты */}
    <div
      className="flex items-center gap-1.5 justify-center relative"
      style={{ minWidth: '70px', marginLeft: `${columnWidths.percentMargin}px` }}
    >
      {metrics.status && metrics.status.status && (
        <>
          {getStatusIcon(metrics.status)}
          <span
            className={`text-xs font-medium whitespace-nowrap ${getStatusTextColor(metrics.status)}`}
          >
            {progressPercent}%
          </span>
        </>
      )}

      {/* ✅ ДОБАВИТЬ: Разделитель столбцов (только в режиме изменения) */}
      {resizeMode && (
        <ColumnDivider
          column="percentMargin"
          onDragStart={handleDragStart}
          isDragging={dragging?.column === 'percentMargin'}
        />
      )}
    </div>

    {/* Инсайты */}
    <div
      className="hidden md:flex items-center gap-1.5 text-xs justify-start relative"
      style={{ minWidth: '280px', marginLeft: `${columnWidths.insightsMargin}px` }}
    >
      {/* ... содержимое инсайтов ... */}

      {/* ✅ ДОБАВИТЬ: Разделитель столбцов */}
      {resizeMode && (
        <ColumnDivider
          column="insightsMargin"
          onDragStart={handleDragStart}
          isDragging={dragging?.column === 'insightsMargin'}
        />
      )}
    </div>

    {/* Итого */}
    <div
      className="flex items-center gap-1.5 justify-end relative"
      style={{ minWidth: '120px', marginLeft: `${columnWidths.totalMargin}px` }}
    >
      {/* ... содержимое итого ... */}

      {/* ✅ ДОБАВИТЬ: Разделитель столбцов */}
      {resizeMode && (
        <ColumnDivider
          column="totalMargin"
          onDragStart={handleDragStart}
          isDragging={dragging?.column === 'totalMargin'}
        />
      )}
    </div>

    {/* ✅ ДОБАВИТЬ: Кнопка сброса (только в режиме изменения) */}
    {resizeMode && (
      <button
        onClick={resetWidths}
        className="absolute top-0 right-0 px-2 py-0.5 bg-red-500 text-white text-xs rounded-bl-md z-20 hover:bg-red-600"
        title="Сбросить к значениям по умолчанию"
      >
        Сброс
      </button>
    )}
  </div>
}
```

## ШАГ 4: То же самое для VirtualizedListView.jsx

Повтори аналогичные изменения в `VirtualizedListView.jsx`:

1. Добавь импорт `useColumnResize` и `ColumnDivider`
2. Добавь хук в начало компонента
3. Добавь разделители в те же места summary

## ШАГ 5: Добавить визуальную подсказку

Опционально: добавь toast-уведомление при активации режима.

В `ListView.jsx` после хука `useColumnResize`:

```javascript
// Показываем подсказку при входе в режим
useEffect(() => {
  if (resizeMode) {
    console.log('🔧 Режим изменения столбцов активирован! Ctrl+Shift+R или Esc для выхода')
  }
}, [resizeMode])
```

## РЕЗУЛЬТАТ

После реализации:

1. **Обычный режим**: Всё работает как раньше, разделители невидимы
2. **Нажми Ctrl+Shift+R**:
   - Появляются синие вертикальные разделители между столбцами
   - Появляется индикатор "Режим изменения столбцов"
   - Появляется кнопка "Сброс"
3. **Перетаскивай границы мышкой**: Меняется `marginLeft` столбцов в реальном времени
4. **Настройки сохраняются** в localStorage автоматически
5. **Нажми Esc или Ctrl+Shift+R снова**: Режим выключается, разделители исчезают

## ПРЕИМУЩЕСТВА

- ✅ Не загромождает UI постоянными элементами
- ✅ Интуитивно как в Excel
- ✅ Сохранение настроек между сессиями
- ✅ Возможность сброса к дефолтным значениям
- ✅ Работает отдельно для ListView и VirtualizedListView

## ДОПОЛНИТЕЛЬНЫЕ УЛУЧШЕНИЯ (опционально)

1. **Показать текущее значение при перетаскивании**:

```javascript
{
  resizeMode && dragging && (
    <div className="fixed top-4 right-4 bg-black text-white px-3 py-2 rounded-md z-50">
      {dragging.column}: {columnWidths[dragging.column]}px
    </div>
  )
}
```

2. **Snap к сетке** (прилипание к 4px, 8px, 12px и т.д.):

```javascript
const handleDrag = useCallback(
  e => {
    if (!dragging) return
    const deltaX = e.movementX
    const { column } = dragging

    setColumnWidths(prev => {
      const newValue = prev[column] + deltaX
      // Snap к сетке 4px
      const snapped = Math.round(newValue / 4) * 4
      return {
        ...prev,
        [column]: Math.max(2, snapped),
      }
    })
  },
  [dragging]
)
```

3. **Экспорт/импорт настроек** через JSON файл
