# 🔍 Зум и панорамирование графиков

> Документация по интеграции функционала зума и панорамирования для графиков

## 📖 Содержание

1. [Введение](#введение)
2. [Компоненты](#компоненты)
3. [Примеры использования](#примеры-использования)
4. [API Reference](#api-reference)
5. [Keyboard Shortcuts](#keyboard-shortcuts)

---

## Введение

Для улучшения работы с большими наборами данных в графиках добавлена возможность зума и панорамирования.

### Возможности:

- ✅ **Зум in/out** с помощью кнопок или клавиатуры
- ✅ **Панорамирование** влево/вправо с помощью стрелок
- ✅ **Зум колесиком мыши** (с Ctrl/Cmd)
- ✅ **Сброс зума** одной кнопкой
- ✅ **Индикатор масштаба** (процент)
- ✅ **Keyboard shortcuts** для быстрого управления
- ✅ **Accessibility** - полная поддержка клавиатуры и ARIA-атрибутов

---

## Компоненты

### 1. ZoomableChartWrapper

Компонент-обертка для графиков, добавляющий UI контролы зума.

**Файл:** `src/components/charts/ZoomableChartWrapper.tsx`

**Особенности:**
- Отображает кнопки зума/панорамирования
- Показывает индикатор масштаба
- Поддерживает клавиатурные сокращения
- Автоматически управляет состоянием зума

### 2. useChartZoom

Хук для программного управления зумом без UI.

**Файл:** `src/hooks/useChartZoom.ts`

**Особенности:**
- Легкий хук без UI
- Подходит для custom реализаций
- Предоставляет все функции зума
- Совместим с Recharts Brush

---

## Примеры использования

### Пример 1: Простой зум с UI контролами

```tsx
import { ZoomableChartWrapper } from '../components/charts/ZoomableChartWrapper'
import { ComposedChart, Line, XAxis, YAxis, CartesianGrid, Tooltip } from 'recharts'

function MyChart({ data }) {
  return (
    <ZoomableChartWrapper
      dataLength={data.length}
      minDataPoints={5}
      enableMouseWheelZoom={true}
    >
      {({ startIndex, endIndex }) => (
        <ResponsiveContainer width="100%" height={350}>
          <ComposedChart data={data.slice(startIndex, endIndex)}>
            <CartesianGrid strokeDasharray="3 3" />
            <XAxis dataKey="date" />
            <YAxis />
            <Tooltip />
            <Line type="monotone" dataKey="value" stroke="#8884d8" />
          </ComposedChart>
        </ResponsiveContainer>
      )}
    </ZoomableChartWrapper>
  )
}
```

### Пример 2: Использование хука useChartZoom

```tsx
import { useChartZoom } from '../../hooks/useChartZoom'
import { ComposedChart, Line, XAxis, YAxis, Brush } from 'recharts'
import { ZoomIn, ZoomOut, RotateCcw } from 'lucide-react'

function MyCustomChart({ data }) {
  const {
    zoomState,
    zoomIn,
    zoomOut,
    resetZoom,
    panLeft,
    panRight,
    handleBrushChange,
    zoomPercentage,
    canZoomIn,
    canZoomOut,
  } = useChartZoom({
    dataLength: data.length,
    minDataPoints: 5,
  })

  return (
    <div className="relative">
      {/* Custom контролы */}
      <div className="absolute top-0 right-0 flex gap-2">
        <button onClick={zoomIn} disabled={!canZoomIn}>
          <ZoomIn />
        </button>
        <button onClick={zoomOut} disabled={!canZoomOut}>
          <ZoomOut />
        </button>
        <button onClick={resetZoom}>
          <RotateCcw />
        </button>
        <span>{zoomPercentage}%</span>
      </div>

      {/* График */}
      <ResponsiveContainer width="100%" height={350}>
        <ComposedChart data={data}>
          <XAxis dataKey="date" />
          <YAxis />
          <Line type="monotone" dataKey="value" stroke="#8884d8" />

          {/* Recharts Brush для визуального зума */}
          <Brush
            dataKey="date"
            height={30}
            stroke="#8884d8"
            startIndex={zoomState.startIndex}
            endIndex={zoomState.endIndex}
            onChange={handleBrushChange}
          />
        </ComposedChart>
      </ResponsiveContainer>
    </div>
  )
}
```

### Пример 3: Интеграция в CombinedChart

```tsx
import { ZoomableChartWrapper } from './ZoomableChartWrapper'

export function CombinedChart({ entries, dateFilter }) {
  // ... существующий код подготовки данных ...

  const chartData = useMemo(() => {
    // ... логика подготовки данных ...
  }, [entries, dateFilter])

  // Оборачиваем график в ZoomableChartWrapper
  return (
    <div ref={chartContainerRef} className="space-y-4">
      {/* Существующие контролы */}
      <div className="flex items-center justify-between">
        <ChartTypeSwitcher />
        <ChartExportButton onExport={handleExport} />
      </div>

      {/* График с зумом */}
      <ZoomableChartWrapper
        dataLength={chartData.length}
        minDataPoints={5}
        maxDataPoints={chartData.length}
        enableMouseWheelZoom={true}
      >
        {({ startIndex, endIndex }) => (
          <ResponsiveContainer width="100%" height={chartHeight}>
            <ComposedChart data={chartData.slice(startIndex, endIndex)}>
              {/* ... остальные компоненты графика ... */}
            </ComposedChart>
          </ResponsiveContainer>
        )}
      </ZoomableChartWrapper>
    </div>
  )
}
```

### Пример 4: Зум для графика с большими данными (>1000 точек)

```tsx
import { ZoomableChartWrapper } from '../components/charts/ZoomableChartWrapper'
import { useMemo } from 'react'

function LargeDataChart({ entries }) {
  // Предварительная обработка данных
  const chartData = useMemo(() => {
    // Преобразуем 10000+ записей в дневные агрегаты
    return aggregateByDay(entries)
  }, [entries])

  return (
    <ZoomableChartWrapper
      dataLength={chartData.length}
      minDataPoints={10}
      maxDataPoints={100} // Показываем максимум 100 дней за раз
      initialStartIndex={chartData.length - 30} // По умолчанию последние 30 дней
      initialEndIndex={chartData.length}
      enableMouseWheelZoom={true}
    >
      {({ startIndex, endIndex }) => (
        <ResponsiveContainer width="100%" height={400}>
          <ComposedChart data={chartData.slice(startIndex, endIndex)}>
            <CartesianGrid strokeDasharray="3 3" />
            <XAxis
              dataKey="date"
              tick={{ fontSize: 12 }}
              angle={-45}
              textAnchor="end"
            />
            <YAxis />
            <Tooltip />
            <Line type="monotone" dataKey="value" stroke="#8884d8" />
          </ComposedChart>
        </ResponsiveContainer>
      )}
    </ZoomableChartWrapper>
  )
}
```

---

## API Reference

### ZoomableChartWrapper Props

| Prop | Type | Default | Description |
|------|------|---------|-------------|
| `children` | `ReactNode \| ((zoomState: ZoomState) => ReactNode)` | required | Контент графика или функция для рендера |
| `dataLength` | `number` | required | Общее количество точек данных |
| `initialStartIndex` | `number` | `0` | Начальный индекс для зума |
| `initialEndIndex` | `number` | `dataLength` | Конечный индекс для зума |
| `minDataPoints` | `number` | `5` | Минимальное количество точек для отображения |
| `maxDataPoints` | `number` | `dataLength` | Максимальное количество точек для отображения |
| `enableMouseWheelZoom` | `boolean` | `true` | Включить зум колесиком мыши |
| `enableDragPan` | `boolean` | `false` | Включить панорамирование перетаскиванием (в разработке) |
| `onZoomChange` | `(startIndex: number, endIndex: number) => void` | `undefined` | Callback при изменении зума |
| `className` | `string` | `''` | Дополнительные CSS классы |

### useChartZoom Options

| Option | Type | Default | Description |
|--------|------|---------|-------------|
| `dataLength` | `number` | required | Общее количество точек данных |
| `initialStartIndex` | `number` | `0` | Начальный индекс |
| `initialEndIndex` | `number` | `dataLength` | Конечный индекс |
| `minDataPoints` | `number` | `5` | Минимальное количество точек |
| `maxDataPoints` | `number` | `dataLength` | Максимальное количество точек |

### useChartZoom Return Value

```typescript
{
  zoomState: { startIndex: number, endIndex: number }
  zoomIn: () => void
  zoomOut: () => void
  resetZoom: () => void
  panLeft: () => void
  panRight: () => void
  setZoom: (startIndex: number, endIndex: number) => void
  handleBrushChange: (e: { startIndex?: number, endIndex?: number }) => void
  canZoomIn: boolean
  canZoomOut: boolean
  canPanLeft: boolean
  canPanRight: boolean
  zoomPercentage: number
  windowSize: number
}
```

---

## Keyboard Shortcuts

### Зум

- **Ctrl/Cmd + Plus (+)** - Увеличить масштаб (zoom in)
- **Ctrl/Cmd + Minus (-)** - Уменьшить масштаб (zoom out)
- **Ctrl/Cmd + 0** - Сбросить масштаб (reset zoom)
- **Ctrl/Cmd + Колесико мыши** - Зум вверх/вниз

### Панорамирование

- **← (Arrow Left)** - Панорамировать влево
- **→ (Arrow Right)** - Панорамировать вправо

### Подсказки в UI

При наведении на график отображается подсказка:
```
Ctrl + колесико для зума, ← → для панорамирования
```

---

## Accessibility

### ARIA атрибуты

```tsx
<div
  role="region"
  aria-label="Масштабируемый график"
  tabIndex={0}
>
```

### Keyboard Navigation

- Все контролы доступны с клавиатуры
- Кнопки имеют `aria-label` и `title`
- График получает фокус для клавиатурных сокращений

### Screen Reader Support

- Кнопки озвучиваются с описанием действия
- Индикатор масштаба читается как текст
- Disabled кнопки корректно озвучиваются

---

## Производительность

### Оптимизации

1. **Slice данных** - отображаем только видимую часть:
   ```tsx
   data.slice(startIndex, endIndex)
   ```

2. **useMemo для данных** - кэшируем преобразования:
   ```tsx
   const chartData = useMemo(() => prepareData(entries), [entries])
   ```

3. **Debounce для зума** - можно добавить для плавности:
   ```tsx
   const debouncedZoom = useMemo(
     () => debounce(setZoom, 100),
     []
   )
   ```

### Рекомендации

- Для данных <100 точек зум не обязателен
- Для данных 100-1000 точек - рекомендуется
- Для данных >1000 точек - обязателен + виртуализация

---

## Следующие шаги

### Планируется добавить:

- [ ] Drag-to-zoom (выделение области мышью)
- [ ] Pinch-to-zoom для мобильных устройств
- [ ] Preset зумы (1 месяц, 3 месяца, год)
- [ ] Синхронизация зума между графиками
- [ ] Анимации переходов зума

---

## Troubleshooting

### Проблема: Зум не работает

**Решение:** Убедитесь что:
1. `dataLength` передан правильно
2. `children` - это функция или React node
3. График использует slice данных: `data.slice(startIndex, endIndex)`

### Проблема: Кнопки не отображаются

**Решение:** Проверьте:
1. Контейнер имеет `position: relative`
2. Z-index кнопок (по умолчанию `z-10`)
3. Нет конфликтов CSS стилей

### Проблема: Клавиатурные сокращения не работают

**Решение:**
1. График должен получить фокус (клик по нему)
2. Проверьте что `tabIndex={0}` установлен
3. События не блокируются родительскими элементами

---

**Дата создания:** 2025-11-16
**Версия:** 1.0
**Статус:** Реализовано
