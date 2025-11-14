# ⚡ **PERFORMANCE & COMPARISON GUIDE**

**Версия:** v1.0  
**Дата:** 27.10.2025

---

## 🎯 **ЦЕЛЬ: React версия должна быть НЕ ХУЖЕ оригинала**

### **Метрики для сравнения:**

1. ⏱️ **Время загрузки** - первая отрисовка
2. 🖥️ **Memory usage** - потребление памяти
3. 🎬 **FPS** - плавность анимаций
4. 📦 **Bundle size** - размер финального файла
5. ⚡ **Interactivity** - время до интерактивности
6. 🔄 **Re-renders** - количество перерисовок

---

## 📊 **КАК ИЗМЕРИТЬ ПРОИЗВОДИТЕЛЬНОСТЬ**

### **1. Chrome DevTools Performance**

```javascript
// В коде добавь метки
performance.mark('timer-start')
// ... код таймера ...
performance.mark('timer-end')
performance.measure('timer', 'timer-start', 'timer-end')

// Посмотри результаты
const measures = performance.getEntriesByType('measure')
console.log(measures)
```

**В DevTools:**

1. Открой Performance tab (Cmd+Shift+E)
2. Нажми Record
3. Выполни действия (запусти таймер, открой модалку, etc.)
4. Останови запись
5. Анализируй:
   - **Scripting** - время выполнения JS
   - **Rendering** - время отрисовки
   - **Painting** - время рисования
   - **Layout** - пересчет позиций

---

### **2. React DevTools Profiler**

```jsx
import { Profiler } from 'react'

function onRenderCallback(
  id, // компонент который рендерился
  phase, // "mount" или "update"
  actualDuration, // время рендера
  baseDuration, // время без мемоизации
  startTime, // когда начал
  commitTime, // когда закоммитил
  interactions // Set взаимодействий
) {
  console.log(`${id} took ${actualDuration}ms to render`)
}

;<Profiler id="Timer" onRender={onRenderCallback}>
  <Timer />
</Profiler>
```

**В React DevTools:**

1. Открой Profiler tab
2. Нажми record
3. Взаимодействуй с приложением
4. Останови
5. Смотри:
   - Flame graph - какие компоненты долго рендерятся
   - Ranked chart - топ медленных компонентов
   - Component chart - история рендеров

---

### **3. Lighthouse (для финальной проверки)**

```bash
# В Chrome DevTools
1. Открой Lighthouse tab
2. Выбери категории: Performance, Accessibility
3. Нажми "Generate report"

# Целевые показатели:
Performance Score: > 90
First Contentful Paint: < 1.5s
Time to Interactive: < 3s
Speed Index: < 3.5s
Total Blocking Time: < 200ms
Largest Contentful Paint: < 2.5s
Cumulative Layout Shift: < 0.1
```

---

### **4. Bundle Analyzer**

```bash
# Установи
npm install -D rollup-plugin-visualizer

# vite.config.js
import { visualizer } from 'rollup-plugin-visualizer';

export default {
  plugins: [
    visualizer({
      open: true,
      gzipSize: true,
      brotliSize: true,
    })
  ]
}

# После билда откроется визуализация
npm run build
```

**Анализируй:**

- Самые большие зависимости
- Дублирование кода
- Неиспользуемые импорты

---

## 🚀 **ОПТИМИЗАЦИЯ REACT ПРИЛОЖЕНИЯ**

### **1. Мемоизация компонентов**

```jsx
// ❌ ПЛОХО - ререндерится каждый раз когда родитель обновляется
function ExpensiveComponent({ data }) {
  // Тяжелые вычисления
  const processed = heavyCalculation(data)
  return <div>{processed}</div>
}

// ✅ ХОРОШО - ререндерится только когда props меняются
const ExpensiveComponent = React.memo(({ data }) => {
  const processed = heavyCalculation(data)
  return <div>{processed}</div>
})

// ✅ ЕЩЕ ЛУЧШЕ - с кастомным сравнением
const ExpensiveComponent = React.memo(
  ({ data }) => {
    const processed = heavyCalculation(data)
    return <div>{processed}</div>
  },
  (prevProps, nextProps) => {
    // Вернуть true если НЕ нужно ререндерить
    return prevProps.data.id === nextProps.data.id
  }
)
```

**Когда использовать React.memo:**

- Компонент часто рендерится с одинаковыми props
- Компонент рендерится из-за родителя, а не из-за своих props
- Рендер компонента дорогой (тяжелые вычисления)

**Когда НЕ использовать:**

- Props всегда разные
- Компонент легкий (простой div)
- Overhead мемоизации больше чем рендер

---

### **2. useMemo для дорогих вычислений**

```jsx
function EntriesList({ entries }) {
  // ❌ ПЛОХО - пересчитывается при каждом рендере
  const sortedEntries = entries.sort((a, b) => b.date - a.date)
  const totalTime = entries.reduce((sum, e) => sum + e.duration, 0)
  const groupedByDate = entries.reduce((acc, e) => {
    // Сложная группировка
  }, {})

  // ✅ ХОРОШО - пересчитывается только когда entries меняются
  const sortedEntries = useMemo(() => {
    return entries.sort((a, b) => b.date - a.date)
  }, [entries])

  const totalTime = useMemo(() => {
    return entries.reduce((sum, e) => sum + e.duration, 0)
  }, [entries])

  const groupedByDate = useMemo(() => {
    return entries.reduce((acc, e) => {
      // Сложная группировка
    }, {})
  }, [entries])
}
```

**Когда использовать useMemo:**

- Тяжелые вычисления (сортировка, фильтрация больших массивов)
- Создание объектов/массивов для props
- Результат используется в зависимостях useEffect

**Когда НЕ использовать:**

- Простые вычисления (сложение, умножение)
- Вычисления быстрее чем overhead мемоизации

---

### **3. useCallback для функций**

```jsx
function Parent() {
  const [count, setCount] = useState(0)

  // ❌ ПЛОХО - новая функция при каждом рендере
  const handleClick = () => {
    console.log('clicked')
  }

  // ✅ ХОРОШО - та же функция между рендерами
  const handleClick = useCallback(() => {
    console.log('clicked')
  }, [])

  // Если функция использует state
  const handleIncrement = useCallback(() => {
    setCount(c => c + 1) // Функциональное обновление!
  }, []) // Пустые зависимости - безопасно

  return <ExpensiveChild onClick={handleClick} />
}

// Без useCallback ExpensiveChild будет ререндериться
// даже если обернут в React.memo
const ExpensiveChild = React.memo(({ onClick }) => {
  return <button onClick={onClick}>Click</button>
})
```

---

### **4. Виртуализация длинных списков**

```jsx
// Для ОЧЕНЬ длинных списков (100+ элементов)
import { FixedSizeList } from 'react-window'

function EntriesList({ entries }) {
  // ❌ ПЛОХО - рендерит ВСЕ элементы (медленно для 1000+ записей)
  return (
    <div>
      {entries.map(entry => (
        <EntryCard key={entry.id} entry={entry} />
      ))}
    </div>
  )

  // ✅ ХОРОШО - рендерит только видимые элементы
  const Row = ({ index, style }) => (
    <div style={style}>
      <EntryCard entry={entries[index]} />
    </div>
  )

  return (
    <FixedSizeList height={600} itemCount={entries.length} itemSize={100} width="100%">
      {Row}
    </FixedSizeList>
  )
}
```

**Установка:**

```bash
npm install react-window
```

**Когда использовать:**

- Список > 100 элементов
- Элементы сложные (тяжелый рендер)
- Заметны лаги при скролле

---

### **5. Code Splitting & Lazy Loading**

```jsx
// ❌ ПЛОХО - все компоненты загружаются сразу
import Statistics from './Statistics'
import SettingsModal from './SettingsModal'
import AboutModal from './AboutModal'

// ✅ ХОРОШО - загружаются только когда нужны
const Statistics = lazy(() => import('./Statistics'))
const SettingsModal = lazy(() => import('./modals/SettingsModal'))
const AboutModal = lazy(() => import('./modals/AboutModal'))

function App() {
  return (
    <Suspense fallback={<LoadingSpinner />}>
      {showStats && <Statistics />}
      {showSettings && <SettingsModal />}
      {showAbout && <AboutModal />}
    </Suspense>
  )
}
```

**Что lazy loading'ать:**

- Модальные окна (не видны при старте)
- Графики (тяжелые библиотеки)
- Редко используемые компоненты
- Разные "страницы" (если есть роутинг)

---

### **6. Debounce & Throttle**

```jsx
// Для инпутов поиска
function SearchInput() {
  const [query, setQuery] = useState('')

  // ❌ ПЛОХО - фильтрует при каждой букве
  const filteredEntries = entries.filter(e => e.description.includes(query))

  // ✅ ХОРОШО - debounce (ждет паузу в наборе)
  const debouncedQuery = useMemo(() => {
    const handler = setTimeout(() => {
      // Поиск
    }, 300)
    return () => clearTimeout(handler)
  }, [query])

  // Или используй готовую библиотеку
  import { useDebouncedValue } from './hooks/useDebounce'
  const debouncedQuery = useDebouncedValue(query, 300)
}

// Для скролла
function InfiniteList() {
  // ❌ ПЛОХО - проверяет при каждом pixel скролла
  const handleScroll = e => {
    if (isNearBottom(e.target)) {
      loadMore()
    }
  }

  // ✅ ХОРОШО - throttle (максимум раз в 200ms)
  const handleScroll = useCallback(
    throttle(e => {
      if (isNearBottom(e.target)) {
        loadMore()
      }
    }, 200),
    []
  )
}
```

---

### **7. Избегать inline functions и objects**

```jsx
// ❌ ПЛОХО
function Parent() {
  return (
    <Child
      onClick={() => console.log('clicked')} // Новая функция!
      style={{ color: 'red' }} // Новый объект!
    />
  )
}

// ✅ ХОРОШО
function Parent() {
  const handleClick = useCallback(() => {
    console.log('clicked')
  }, [])

  const style = useMemo(() => ({ color: 'red' }), [])

  return <Child onClick={handleClick} style={style} />
}

// ✅ ЕЩЕ ЛУЧШЕ - вынести стили
const styles = { color: 'red' } // Снаружи компонента!

function Parent() {
  const handleClick = useCallback(() => {
    console.log('clicked')
  }, [])

  return <Child onClick={handleClick} style={styles} />
}
```

---

## 🔍 **СРАВНЕНИЕ С ОРИГИНАЛОМ**

### **Тест 1: Время загрузки**

```javascript
// Добавь в оба приложения (HTML и React)
performance.mark('app-start')

window.addEventListener('load', () => {
  performance.mark('app-loaded')
  performance.measure('load-time', 'app-start', 'app-loaded')

  const measure = performance.getEntriesByName('load-time')[0]
  console.log(`Load time: ${measure.duration}ms`)
})
```

**Целевой результат:** React версия не более чем на 20% медленнее

---

### **Тест 2: Memory usage**

```javascript
// Chrome DevTools > Memory > Take heap snapshot

// В оригинале:
// 1. Загрузи страницу
// 2. Создай 50 записей таймера
// 3. Take snapshot → запомни размер

// В React версии:
// 1. Загрузи страницу
// 2. Создай 50 записей таймера
// 3. Take snapshot → сравни размер

// Целевой результат: примерно одинаково ±10%
```

---

### **Тест 3: Таймер точность**

```javascript
// Проверь что таймер не отстает
let startTime = Date.now()
let timerValue = 0

setInterval(() => {
  timerValue++
  const actualSeconds = Math.floor((Date.now() - startTime) / 1000)
  const diff = Math.abs(actualSeconds - timerValue)

  if (diff > 1) {
    console.warn(`Timer drift: ${diff}s`)
  }
}, 1000)
```

**Целевой результат:** Дрифт < 1 секунды после 1 часа работы

---

### **Тест 4: FPS во время анимаций**

```javascript
// Используй Chrome DevTools > Rendering > Frame Rendering Stats

// Тест:
// 1. Открой glassmorphism модалку
// 2. Двигай мышкой по элементу (hover эффекты)
// 3. Смотри FPS

// Целевой результат: FPS > 30, желательно 60
```

---

### **Тест 5: localStorage операции**

```javascript
// Измерь скорость сохранения
const entries = Array(1000)
  .fill(null)
  .map((_, i) => ({
    id: i,
    duration: 3600,
    category: 'Work',
    description: 'Test',
  }))

console.time('save')
localStorage.setItem('entries', JSON.stringify(entries))
console.timeEnd('save')

console.time('load')
JSON.parse(localStorage.getItem('entries'))
console.timeEnd('load')

// Целевой результат: < 50ms для save и load
```

---

## 📋 **PERFORMANCE CHECKLIST**

### **Перед финальным релизом проверь:**

```
□ Bundle size:
  □ Gzip < 500KB
  □ Нет дублированных библиотек
  □ Tree shaking работает

□ Lighthouse scores:
  □ Performance > 90
  □ Accessibility > 90
  □ Best Practices > 90

□ React DevTools Profiler:
  □ Нет компонентов с >50ms рендером
  □ Нет лишних ререндеров
  □ Используется мемоизация где нужно

□ Memory:
  □ Нет утечек памяти
  □ Heap стабильный после 10 минут использования
  □ Memory usage < 100MB

□ Network:
  □ CSS/JS минифицированы
  □ Сжатие gzip/brotli
  □ Lazy loading для больших компонентов

□ Runtime:
  □ Таймер точный
  □ Нет laggy анимаций
  □ localStorage операции быстрые
  □ Звуки проигрываются без задержки

□ User Experience:
  □ TTI < 3s
  □ FCP < 1.5s
  □ No layout shifts
  □ Smooth 60fps animations
```

---

## 🛠️ **DEBUGGING PERFORMANCE**

### **Найти медленные компоненты:**

```jsx
// Добавь в подозрительный компонент
function SlowComponent() {
  const renderCount = useRef(0)

  useEffect(() => {
    renderCount.current++
    console.log(`SlowComponent rendered ${renderCount.current} times`)
  })

  console.time('SlowComponent render')
  // ... компонент ...
  console.timeEnd('SlowComponent render')
}
```

---

### **Найти лишние ререндеры:**

```jsx
// Установи
npm install why-did-you-render

// wdyr.js
import React from 'react';
import whyDidYouRender from '@welldone-software/why-did-you-render';

if (process.env.NODE_ENV === 'development') {
  whyDidYouRender(React, {
    trackAllPureComponents: true,
  });
}

// main.jsx
import './wdyr'; // Перед импортом App!
import App from './App';
```

Покажет в консоли почему компонент перерендерился!

---

### **Профилирование production билда:**

```bash
# Собери с source maps
npm run build -- --sourcemap

# Открой в Chrome
# DevTools > Performance
# Загрузи source maps
# Теперь видишь настоящие имена функций!
```

---

## 💡 **QUICK WINS ДЛЯ ПРОИЗВОДИТЕЛЬНОСТИ**

### **1. Оптимизация изображений**

```jsx
// Используй правильный формат
.png → .webp (меньше размер)

// Lazy loading изображений
<img loading="lazy" src="image.webp" />

// Responsive images
<img
  srcSet="small.webp 480w, large.webp 1080w"
  sizes="(max-width: 600px) 480px, 1080px"
/>
```

---

### **2. Оптимизация шрифтов**

```css
/* Только нужные начертания */
@import url('https://fonts.googleapis.com/css2?family=Inter:wght@400;600;700&display=swap');

/* Не загружать пока не нужны */
font-display: swap;
```

---

### **3. Минификация CSS**

```javascript
// vite.config.js
export default {
  build: {
    cssCodeSplit: true,
    minify: 'esbuild',
  },
}
```

---

### **4. Используй правильные dependencies**

```bash
# ❌ ПЛОХО
npm install moment  # 67KB

# ✅ ХОРОШО
npm install date-fns  # 13KB (tree-shakeable)
```

---

## 🎯 **ФИНАЛЬНАЯ ПРОВЕРКА**

### **Сравни с оригиналом:**

```markdown
# Metrics Comparison

## Load Time

- Original HTML: 1.2s
- React version: 1.4s ✅ (в пределах нормы)

## Bundle Size

- Original HTML: 11KB (один файл)
- React version: 450KB (gzipped) ✅

## Memory Usage

- Original HTML: 8MB
- React version: 12MB ✅ (приемлемо)

## FPS

- Original HTML: 60fps
- React version: 58fps ✅

## Functionality

- All features migrated: ✅
- Visual identical: ✅
- Performance acceptable: ✅
```

---

**Если все метрики в порядке - миграция успешна! 🎉**
