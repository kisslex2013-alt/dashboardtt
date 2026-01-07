# ПРОМПТ ДЛЯ AI В CURSOR: Исправление проблем с AnimatedCounter

## 🎯 ЦЕЛЬ

Исправить критические проблемы с анимацией чисел в компоненте AnimatedCounter, которые вызывают:

1. Мерцание всего экрана при выборе фильтра "ГОД" в StatisticsDashboard
2. Некорректную работу анимации при переходе к значению 0
3. Отображение фиксированных данных в PlanFactCompactView вместо актуальных

## 📋 КОНТЕКСТ

### Текущая проблемная реализация AnimatedCounter

Компонент использует **СЛОЖНЫЙ и НЕПРАВИЛЬНЫЙ** подход:

- Вызывает `spring.number.get()` внутри useEffect
- Имеет зависимость от `spring.number` в useEffect (вызывает циклы/пропуски)
- Использует ручное управление через `api.start()` с from/to
- Имеет несколько источников состояния (spring, previousValue, numericValue)

### Что УЖЕ НЕ СРАБОТАЛО (не использовать эти подходы):

❌ Таймауты (10ms, 50ms) для батчинга
❌ Дебаунсинг через setTimeout
❌ requestAnimationFrame для стабилизации
❌ Ключи на компонентах (key={`${title}-${value}`})
❌ previousValue.current для отслеживания изменений
❌ Проверки isInitialMount
❌ Комбинации вышеперечисленного

## ✅ РЕШЕНИЕ

Переписать AnimatedCounter используя **УПРОЩЕННЫЙ ПОДХОД** из официальной документации react-spring.

---

## 🔨 ЗАДАЧА 1: Переписать AnimatedCounter

### Файл для изменения:

`src/components/ui/AnimatedCounter.jsx`

### Текущий проблемный код (НЕ ИСПОЛЬЗОВАТЬ):

```javascript
// ❌ ПЛОХОЙ ПОДХОД - удалить
const [spring, api] = useSpring(() => ({
  number: numericValue || 0,
  config: springConfig,
}));

useEffect(() => {
  const currentSpringValue = spring.number.get(); // ❌ Проблема
  const fromValue = /* сложная логика */;
  api.start({
    from: { number: fromValue },
    to: { number: numericValue },
    config: springConfig,
  });
}, [numericValue, api, springConfig, spring.number]); // ❌ Проблема
```

### Новый правильный код (ИСПОЛЬЗОВАТЬ):

```javascript
import { useSpring, animated, config } from '@react-spring/web'
import { useRef, useMemo } from 'react'
import PropTypes from 'prop-types'

export function AnimatedCounter({
  value,
  prefix = '',
  suffix = '',
  decimals = 0,
  className = '',
  animationConfig = 'default',
  duration,
}) {
  // Парсинг значения
  const numericValue = useMemo(() => {
    if (typeof value === 'number') return value
    if (typeof value === 'string') {
      const cleaned = value.replace(/[^\d.-]/g, '')
      const parsed = parseFloat(cleaned)
      return isNaN(parsed) ? 0 : parsed
    }
    return 0
  }, [value])

  // Отслеживание первого рендера
  const isInitialMount = useRef(true)

  // Конфигурация анимации
  const springConfig = useMemo(() => {
    if (duration) {
      return { duration }
    }

    switch (animationConfig) {
      case 'slow':
        return config.slow
      case 'molasses':
        return config.molasses
      case 'gentle':
        return config.gentle
      case 'wobbly':
        return config.wobbly
      case 'stiff':
        return config.stiff
      default:
        return config.default
    }
  }, [animationConfig, duration])

  // ✅ ПРАВИЛЬНЫЙ ПОДХОД: Простое обновление значения
  // react-spring автоматически анимирует изменения
  const { number } = useSpring({
    number: numericValue,
    config: springConfig,
    immediate: isInitialMount.current, // Пропустить анимацию при первом рендере
    onStart: () => {
      if (isInitialMount.current) {
        isInitialMount.current = false
      }
    },
  })

  // Форматирование значения
  const formatValue = n => {
    if (isNaN(n) || !isFinite(n)) return '0'

    const rounded = decimals === 0 ? Math.round(n) : Number(n.toFixed(decimals))

    const formatted =
      decimals === 0
        ? rounded.toLocaleString('ru-RU')
        : rounded.toLocaleString('ru-RU', {
            minimumFractionDigits: decimals,
            maximumFractionDigits: decimals,
          })

    return `${prefix}${formatted}${suffix}`
  }

  return <animated.span className={className}>{number.to(formatValue)}</animated.span>
}

AnimatedCounter.propTypes = {
  value: PropTypes.oneOfType([PropTypes.number, PropTypes.string]).isRequired,
  prefix: PropTypes.string,
  suffix: PropTypes.string,
  decimals: PropTypes.number,
  className: PropTypes.string,
  animationConfig: PropTypes.oneOf(['default', 'slow', 'molasses', 'gentle', 'wobbly', 'stiff']),
  duration: PropTypes.number,
}
```

### Ключевые изменения:

1. ✅ Убран `api.start()` и ручное управление
2. ✅ Убран `useEffect` с зависимостью от `spring.number`
3. ✅ Убран `previousValue.current`
4. ✅ Убран `spring.number.get()`
5. ✅ Добавлен флаг `immediate` для пропуска анимации при первом рендере
6. ✅ Используется прямое обновление через `number: numericValue`
7. ✅ Мемоизация парсинга значения и конфигурации

---

## 🔨 ЗАДАЧА 2: Исправить StatisticsDashboard

### Файл для изменения:

`src/components/statistics/StatisticsDashboard.jsx` (или аналогичный)

### Проблема:

При смене фильтра "ГОД" все AnimatedCounter обновляются одновременно, вызывая мерцание.

### Решение:

Использовать `React.startTransition` для батчинга обновлений.

### Код для добавления:

```javascript
import { useTransition, startTransition } from 'react'

// В компоненте StatisticsDashboard

// Добавить состояние для отслеживания перехода
const [isPending, startPendingTransition] = useTransition()

// Обработчик смены фильтра
const handleFilterChange = newFilter => {
  // Оборачиваем обновление в transition для батчинга
  startTransition(() => {
    setPeriodFilter(newFilter)
  })
}

// В useEffect для пересчета статистики
useEffect(() => {
  // Если используется Worker, оборачиваем результат в transition
  const calculateStats = async () => {
    const result = await calculateStatisticsInWorker(entries, periodFilter)

    startTransition(() => {
      setCurrentStats(result)
    })
  }

  calculateStats()
}, [entries, periodFilter])
```

### Альтернативный подход (если startTransition не помогает):

```javascript
// Добавить флаг для отключения анимации при смене фильтра
const [isFilterChanging, setIsFilterChanging] = useState(false)

const handleFilterChange = newFilter => {
  setIsFilterChanging(true)
  setPeriodFilter(newFilter)

  // Восстановить анимацию после завершения обновления
  setTimeout(() => {
    setIsFilterChanging(false)
  }, 100)
}

// В AnimatedCounter передать флаг immediate
;<AnimatedCounter
  value={totalHours}
  immediate={isFilterChanging} // Пропустить анимацию при смене фильтра
  {...otherProps}
/>
```

**ВНИМАНИЕ:** Для этого нужно добавить проп `immediate` в AnimatedCounter:

```javascript
// В AnimatedCounter.jsx
export function AnimatedCounter({
  value,
  immediate: forceImmediate = false, // Новый проп
  // ... остальные пропсы
}) {
  const { number } = useSpring({
    number: numericValue,
    config: springConfig,
    immediate: forceImmediate || isInitialMount.current, // Использовать проп
    // ...
  })
}
```

---

## 🔨 ЗАДАЧА 3: Исправить PlanFactCompactView

### Файл для изменения:

`src/components/statistics/PlanFactCompactView.jsx` (или аналогичный)

### Проблема:

AnimatedCounter показывает фиксированные данные, не обновляется при изменении entries.

### Решение:

Убрать ключи из AnimatedCounter и убедиться, что useMemo правильно обновляется.

### Код для проверки:

```javascript
// Убедиться, что зависимости useMemo полные
const planFactData = useMemo(() => {
  const today = new Date()
  const currentDay = today.getDate()
  const currentMonth = today.getMonth()
  const currentYear = today.getFullYear()

  // Пересчитать данные на основе entries
  const todayEntries = entries.filter(e => {
    const entryDate = new Date(e.date)
    return (
      entryDate.getDate() === currentDay &&
      entryDate.getMonth() === currentMonth &&
      entryDate.getFullYear() === currentYear
    )
  })

  // ... остальная логика

  return {
    day: calculatedDay,
    week: calculatedWeek,
    month: calculatedMonth,
    // ...
  }
}, [entries]) // ✅ Убедиться, что entries в зависимостях

// Использовать AnimatedCounter БЕЗ ключей
;<AnimatedCounter
  value={planFactData.day}
  // НЕ добавлять key!
  {...otherProps}
/>
```

### Если проблема все еще есть:

```javascript
// Добавить useEffect для логирования изменений
useEffect(() => {
  console.log('📊 PlanFactData updated:', planFactData)
}, [planFactData])

// Проверить, обновляется ли planFactData при изменении entries
useEffect(() => {
  console.log('📝 Entries changed:', entries.length)
}, [entries])
```

---

## 📊 ТЕСТИРОВАНИЕ

После внесения изменений протестировать:

### Тест 1: Базовая анимация

```
1. Открыть приложение
2. Добавить новую запись времени
3. ОЖИДАЕТСЯ: Плавная анимация изменения чисел
4. ПРОВЕРИТЬ: Нет резких скачков
```

### Тест 2: Переход к 0

```
1. Выбрать фильтр "Сегодня" (когда нет данных)
2. ОЖИДАЕТСЯ: Плавная анимация от текущего значения до 0
3. ПРОВЕРИТЬ: Нет резкого перехода
```

### Тест 3: Смена фильтра "ГОД"

```
1. Выбрать фильтр "ГОД"
2. ОЖИДАЕТСЯ: Плавная смена значений без мерцания
3. ПРОВЕРИТЬ: Весь экран не мигает
```

### Тест 4: Актуальность данных в PlanFactCompactView

```
1. Добавить запись времени на сегодня
2. ОЖИДАЕТСЯ: AnimatedCounter показывает обновленное значение
3. ПРОВЕРИТЬ: Анимация отображает актуальные данные
```

### Тест 5: Производительность

```
1. Добавить множество записей (50+)
2. Переключать фильтры быстро
3. ОЖИДАЕТСЯ: Плавная работа без лагов
4. ПРОВЕРИТЬ: FPS не падает, нет зависаний
```

---

## 🚨 КРИТИЧЕСКИЕ ТРЕБОВАНИЯ

### ЧТО ДЕЛАТЬ:

✅ Использовать упрощенный подход с `useSpring({ number: value })`
✅ Убрать все `api.start()` и ручное управление
✅ Убрать `spring.number.get()` из useEffect
✅ Убрать зависимость от `spring.number` в useEffect
✅ Использовать `immediate` флаг для первого рендера
✅ Использовать `startTransition` для батчинга обновлений
✅ Мемоизировать парсинг значения и конфигурацию
✅ Убрать ключи из AnimatedCounter в PlanFactCompactView

### ЧЕГО НЕ ДЕЛАТЬ:

❌ НЕ использовать `setTimeout` или `debounce` для "исправления" анимации
❌ НЕ использовать `requestAnimationFrame` для стабилизации
❌ НЕ добавлять ключи на AnimatedCounter (key={...})
❌ НЕ использовать `previousValue.current` для отслеживания
❌ НЕ добавлять сложную логику с множественными источниками состояния
❌ НЕ использовать `spring.number.get()` внутри useEffect
❌ НЕ добавлять зависимость `spring.number` в useEffect

---

## 📝 ЧЕКЛИСТ ВЫПОЛНЕНИЯ

Отметьте каждый пункт после выполнения:

- [ ] Переписан AnimatedCounter с использованием упрощенного подхода
- [ ] Убран useEffect с api.start()
- [ ] Убран previousValue.current
- [ ] Добавлен immediate флаг для первого рендера
- [ ] Добавлена мемоизация парсинга и конфигурации
- [ ] В StatisticsDashboard добавлен startTransition (или immediate проп)
- [ ] В PlanFactCompactView убраны ключи из AnimatedCounter
- [ ] Проверены зависимости useMemo для planFactData
- [ ] Пройдены все 5 тестов
- [ ] Нет мерцания при смене фильтра "ГОД"
- [ ] Анимация работает корректно при переходе к 0
- [ ] PlanFactCompactView показывает актуальные данные
- [ ] Производительность в норме (нет лагов)

---

## 💡 ДОПОЛНИТЕЛЬНЫЕ РЕКОМЕНДАЦИИ

### Если проблемы остаются:

#### Вариант 1: Полностью отключить анимацию при смене фильтров

```javascript
const { number } = useSpring({
  number: numericValue,
  config: springConfig,
  immediate: forceImmediate || isInitialMount.current || isFilterChanging,
})
```

#### Вариант 2: Использовать разные конфигурации для разных случаев

```javascript
const effectiveConfig = isLargeChange(numericValue, previousValue)
  ? config.stiff // Быстрая анимация для больших изменений
  : springConfig // Обычная анимация для малых изменений
```

#### Вариант 3: Использовать CSS transitions как fallback

```css
/* Если react-spring все еще проблемный */
.animated-number {
  transition: all 0.3s ease-out;
}
```

### Отладка:

```javascript
// Добавить логирование для отладки
const { number } = useSpring({
  number: numericValue,
  config: springConfig,
  immediate: isInitialMount.current,
  onStart: () => {
    console.log('🎬 Animation started:', { from: number.get(), to: numericValue })
  },
  onRest: () => {
    console.log('✅ Animation completed:', number.get())
  },
})
```

---

## 🎯 ОЖИДАЕМЫЙ РЕЗУЛЬТАТ

После выполнения всех задач:

- ✅ Анимация работает плавно и корректно
- ✅ Нет мерцания при смене фильтров
- ✅ Переход к 0 анимируется правильно
- ✅ PlanFactCompactView показывает актуальные данные
- ✅ Производительность в норме
- ✅ Код проще и понятнее
- ✅ Меньше источников состояния
- ✅ Нет конфликтов между ручным и автоматическим управлением

---

## 📞 ЕСЛИ ЧТО-ТО НЕ РАБОТАЕТ

1. **Проверьте консоль на ошибки**
2. **Убедитесь, что react-spring установлен правильно:** `npm list @react-spring/web`
3. **Проверьте, что все import'ы корректны**
4. **Используйте логирование для отладки (см. раздел "Отладка")**
5. **Создайте минимальный пример для изоляции проблемы**

---

**ВАЖНО:** Следуйте решению ТОЧНО как описано. Все попытки с таймаутами, debounce, ключами и сложной логикой УЖЕ НЕ СРАБОТАЛИ. Используйте ТОЛЬКО упрощенный подход из документации react-spring.
