# Код анимации модального окна TutorialModal

## 📋 Обзор

Документ содержит весь код анимации для модального окна TutorialModal, включая:

- Анимацию появления/исчезновения модального окна (BaseModal)
- Анимацию изменения размера при изменении окна браузера (ResizeObserver)
- Анимацию смены контента при переключении шагов (AnimatedModalContent)

---

## 1. BaseModal.jsx — Анимация панели модального окна

### Структура Dialog.Panel с анимацией:

```jsx
<Dialog.Panel
  ref={panelRef}
  className={`
    glass-effect rounded-xl p-6 w-full shadow-2xl
    max-h-[90vh] pointer-events-auto
    ${!isAnimating && !isExiting ? 'opacity-0 scale-95 translate-y-4' : ''}
    ${isAnimating && !isExiting ? 'animate-slide-up' : ''}
    ${isExiting ? 'animate-slide-out' : ''}
    ${sizeClasses[size]}
    ${className}
  `}
  style={{
    // НОВОЕ: CSS переменные для управления размерами
    '--panel-width': dimensions.width,
    '--panel-height': dimensions.height,
    width: isResizing ? 'var(--panel-width)' : undefined,
    height: isResizing ? 'var(--panel-height)' : undefined,
    transition: isResizing
      ? 'width 300ms cubic-bezier(0.4, 0, 0.2, 1), height 300ms cubic-bezier(0.4, 0, 0.2, 1)'
      : undefined,
    willChange: isResizing ? 'width, height' : undefined,
  }}
  onClick={(e) => e.stopPropagation()}
>
```

### Состояния для анимации:

```jsx
// Три состояния для контроля анимаций (Three-State Animation Control)
const [shouldMount, setShouldMount] = useState(false)
const [isAnimating, setIsAnimating] = useState(false)
const [isExiting, setIsExiting] = useState(false)

// НОВОЕ: Состояния для анимации resize
const [isResizing, setIsResizing] = useState(false)
const [dimensions, setDimensions] = useState({ width: 'auto', height: 'auto' })

const panelRef = useRef(null)
const overlayRef = useRef(null)
const resizeTimeoutRef = useRef(null)
const dimensionsRef = useRef({ width: 0, height: 0 })
```

### Логика открытия:

```jsx
// Логика открытия
useEffect(() => {
  if (isOpen) {
    setShouldMount(true)
    setIsExiting(false)
    // Для модальных окон используем одинарный RAF - двойной вызывает дергание
    const rafId = requestAnimationFrame(() => {
      setIsAnimating(true)
    })
    return () => cancelAnimationFrame(rafId)
  }
}, [isOpen])
```

### Логика закрытия:

```jsx
// Логика закрытия
useEffect(() => {
  if (!isOpen && shouldMount && !isExiting) {
    setIsExiting(true)
  }
}, [isOpen, shouldMount, isExiting])

// Слушатель окончания анимации исчезновения
useEffect(() => {
  if (isExiting && panelRef.current) {
    const handleAnimationEnd = e => {
      // Проверяем, что это именно наша exit анимация (slideDownOut или fadeOut)
      if (
        e.animationName === 'slideDownOut' ||
        e.animationName === 'fadeOut' ||
        e.animationName.includes('slideOut') ||
        e.animationName.includes('fadeOut')
      ) {
        // Сбрасываем все состояния после завершения анимации
        setIsAnimating(false)
        setIsExiting(false)
        setShouldMount(false)
      }
    }

    // Fallback на случай, если событие не сработает (например, при lazy loading)
    const fallbackTimer = setTimeout(() => {
      setIsAnimating(false)
      setIsExiting(false)
      setShouldMount(false)
    }, 350) // Немного больше длительности анимации (300ms + запас)

    const panel = panelRef.current
    panel.addEventListener('animationend', handleAnimationEnd)

    return () => {
      clearTimeout(fallbackTimer)
      panel?.removeEventListener('animationend', handleAnimationEnd)
    }
  }
}, [isExiting])
```

---

## 2. ResizeObserver — Анимация при изменении размера окна браузера

```jsx
// НОВОЕ: ResizeObserver для отслеживания изменений размера при window resize
useEffect(() => {
  if (!isOpen || !panelRef.current) return

  const panel = panelRef.current

  // Инициализация начальных размеров
  const initDimensions = () => {
    const rect = panel.getBoundingClientRect()
    dimensionsRef.current = {
      width: rect.width,
      height: rect.height,
    }
  }

  initDimensions()

  const resizeObserver = new ResizeObserver(entries => {
    for (const entry of entries) {
      const { width, height } = entry.contentRect

      // Проверяем, действительно ли размеры изменились
      if (
        Math.abs(width - dimensionsRef.current.width) > 1 ||
        Math.abs(height - dimensionsRef.current.height) > 1
      ) {
        // Фиксируем текущие размеры для начала анимации
        setDimensions({
          width: `${dimensionsRef.current.width}px`,
          height: `${dimensionsRef.current.height}px`,
        })
        setIsResizing(true)

        // Очищаем предыдущий таймер
        if (resizeTimeoutRef.current) {
          clearTimeout(resizeTimeoutRef.current)
        }

        // Запускаем анимацию к новым размерам
        requestAnimationFrame(() => {
          setDimensions({
            width: `${width}px`,
            height: `${height}px`,
          })

          // После завершения анимации возвращаем auto
          resizeTimeoutRef.current = setTimeout(() => {
            setDimensions({ width: 'auto', height: 'auto' })
            setIsResizing(false)
            dimensionsRef.current = { width, height }
          }, 300) // Длительность transition
        })
      }
    }
  })

  resizeObserver.observe(panel)

  return () => {
    resizeObserver.disconnect()
    if (resizeTimeoutRef.current) {
      clearTimeout(resizeTimeoutRef.current)
    }
  }
}, [isOpen])
```

**Параметры анимации:**

- Длительность: `300ms`
- Easing: `cubic-bezier(0.4, 0, 0.2, 1)`
- Триггер: Изменение размера окна браузера

---

## 3. AnimatedModalContent.jsx — Анимация смены контента

### Полный код компонента:

```jsx
import { useState, useEffect, useRef } from 'react'

/**
 * Wrapper для контента модального окна с анимацией при изменении
 *
 * @param {React.ReactNode} children - Контент для отображения
 * @param {string|number} contentKey - Ключ для отслеживания смены контента
 * @param {number} fadeOutDuration - Длительность затухания (мс)
 * @param {number} heightDuration - Длительность изменения высоты (мс)
 */
export function AnimatedModalContent({
  children,
  contentKey,
  fadeOutDuration = 250,
  heightDuration = 350,
}) {
  const [isChanging, setIsChanging] = useState(false)
  const [displayedContent, setDisplayedContent] = useState(children)
  const contentRef = useRef(null)
  const previousKeyRef = useRef(contentKey)

  useEffect(() => {
    // Проверяем, изменился ли ключ контента
    if (previousKeyRef.current === contentKey) {
      // Ключ не изменился - просто обновляем контент
      setDisplayedContent(children)
      return
    }

    const contentElement = contentRef.current
    if (!contentElement) return

    // Ключ изменился - запускаем анимацию

    // 1. Фиксируем текущую высоту
    const currentHeight = contentElement.scrollHeight
    contentElement.style.height = `${currentHeight}px`

    // 2. Начинаем затухание
    setIsChanging(true)

    // 3. После затухания меняем контент
    setTimeout(() => {
      setDisplayedContent(children)
      previousKeyRef.current = contentKey

      // 4. Измеряем новую высоту и анимируем
      requestAnimationFrame(() => {
        const newHeight = contentElement.scrollHeight
        contentElement.style.height = `${newHeight}px`

        // 5. Запускаем появление
        setTimeout(() => {
          setIsChanging(false)

          // 6. Возвращаем auto после завершения
          setTimeout(() => {
            if (contentElement) {
              contentElement.style.height = 'auto'
            }
          }, heightDuration)
        }, 50)
      })
    }, fadeOutDuration)
  }, [contentKey, children, fadeOutDuration, heightDuration])

  return (
    <div
      ref={contentRef}
      className="mb-6"
      style={{
        transition: `height ${heightDuration}ms cubic-bezier(0.4, 0, 0.2, 1)`,
        overflow: isChanging ? 'hidden' : 'visible',
      }}
    >
      <div
        className="content-wrapper"
        style={{
          transition: `opacity ${fadeOutDuration}ms ease-in-out`,
          opacity: isChanging ? 0 : 1,
          pointerEvents: isChanging ? 'none' : 'auto',
        }}
      >
        {displayedContent}
      </div>
    </div>
  )
}
```

### Логика анимации (пошагово):

1. **Фиксация текущей высоты** (мгновенно)

   ```jsx
   const currentHeight = contentElement.scrollHeight
   contentElement.style.height = `${currentHeight}px`
   ```

2. **Начало затухания** (мгновенно)

   ```jsx
   setIsChanging(true) // opacity: 0
   ```

3. **Смена контента** (через 250ms)

   ```jsx
   setTimeout(() => {
     setDisplayedContent(children)
     previousKeyRef.current = contentKey
   }, fadeOutDuration) // 250ms
   ```

4. **Измерение новой высоты** (через requestAnimationFrame)

   ```jsx
   requestAnimationFrame(() => {
     const newHeight = contentElement.scrollHeight
     contentElement.style.height = `${newHeight}px` // Анимация высоты
   })
   ```

5. **Появление нового контента** (через 50ms после изменения высоты)

   ```jsx
   setTimeout(() => {
     setIsChanging(false) // opacity: 1
   }, 50)
   ```

6. **Возврат auto** (через 350ms после изменения высоты)
   ```jsx
   setTimeout(() => {
     contentElement.style.height = 'auto'
   }, heightDuration) // 350ms
   ```

**Параметры анимации:**

- Fade-out: `250ms` (по умолчанию)
- Изменение высоты: `350ms` (по умолчанию)
- Fade-in: `50ms` задержка
- Easing высоты: `cubic-bezier(0.4, 0, 0.2, 1)`
- Easing opacity: `ease-in-out`

---

## 4. Использование в TutorialModal.jsx

### Импорт:

```jsx
import { AnimatedModalContent } from '../ui/AnimatedModalContent'
```

### Использование:

```jsx
<BaseModal
  isOpen={isOpen}
  onClose={handleSkip}
  title={currentStepData.title}
  titleIcon={Icon}
  size="large"
>
  {/* Индикатор шагов - БЕЗ анимации */}
  <div className="flex gap-2 mb-6">
    {steps.map((_, index) => (
      <div
        key={index}
        className={`flex-1 h-2 rounded-full transition-colors ${
          index === currentStep
            ? 'bg-blue-500'
            : index < currentStep
              ? 'bg-green-500'
              : 'bg-gray-300 dark:bg-gray-600'
        }`}
      />
    ))}
  </div>

  {/* Контент С анимацией */}
  <AnimatedModalContent contentKey={currentStep}>{currentStepData.content}</AnimatedModalContent>

  {/* Навигация - БЕЗ анимации */}
  <div className="flex justify-between items-center">{/* ... кнопки ... */}</div>
</BaseModal>
```

**Важно:** `contentKey={currentStep}` передается для отслеживания смены шагов.

---

## 5. CSS классы анимации

### Используемые классы:

- `animate-slide-up` - Появление модального окна (снизу вверх)
- `animate-slide-out` - Исчезновение модального окна (вниз)
- `animate-fade-in` - Появление overlay (fade in)
- `animate-fade-out` - Исчезновение overlay (fade out)

### Определение в animations.css:

```css
@keyframes slideUp {
  0% {
    opacity: 0;
    transform: translateY(20px);
  }
  100% {
    opacity: 1;
    transform: translateY(0);
  }
}

@keyframes slideDownOut {
  from {
    opacity: 1;
    transform: translateY(0);
  }
  to {
    opacity: 0;
    transform: translateY(20px);
  }
}

@keyframes fadeIn {
  from {
    opacity: 0;
  }
  to {
    opacity: 1;
  }
}

@keyframes fadeOut {
  from {
    opacity: 1;
  }
  to {
    opacity: 0;
  }
}

.animate-slide-up {
  animation: slideUp 300ms cubic-bezier(0.4, 0, 0.2, 1);
}

.animate-slide-out {
  animation: slideDownOut 300ms cubic-bezier(0.4, 0, 0.2, 1);
}

.animate-fade-in {
  animation: fadeIn 300ms ease-out;
}

.animate-fade-out {
  animation: fadeOut 300ms ease-in;
}
```

---

## 6. Итоговая структура анимаций

### Типы анимаций:

1. **Появление модального окна**
   - Класс: `animate-slide-up`
   - Длительность: `300ms`
   - Easing: `cubic-bezier(0.4, 0, 0.2, 1)`
   - Эффект: Снизу вверх с fade-in

2. **Исчезновение модального окна**
   - Класс: `animate-slide-out`
   - Длительность: `300ms`
   - Easing: `cubic-bezier(0.4, 0, 0.2, 1)`
   - Эффект: Вниз с fade-out

3. **Изменение размера окна браузера**
   - Технология: `ResizeObserver` + CSS `transition`
   - Длительность: `300ms`
   - Easing: `cubic-bezier(0.4, 0, 0.2, 1)`
   - Эффект: Плавное изменение width/height

4. **Изменение контента (смена шагов)**
   - Компонент: `AnimatedModalContent`
   - Fade-out: `250ms`
   - Изменение высоты: `350ms`
   - Fade-in: `50ms` задержка
   - Эффект: Fade-out → изменение высоты → fade-in

---

## 7. Технические детали

### Порядок выполнения анимации смены контента:

```
0ms:    Фиксация текущей высоты
0ms:    Начало fade-out (opacity: 1 → 0)
250ms:  Смена контента (пока opacity: 0)
250ms:  Измерение новой высоты (requestAnimationFrame)
250ms:  Анимация высоты (height: old → new, 350ms)
300ms:  Начало fade-in (opacity: 0 → 1)
600ms:  Возврат height: auto
```

### Используемые технологии:

- **React Hooks**: `useState`, `useEffect`, `useRef`
- **ResizeObserver API**: Для отслеживания изменений размера
- **requestAnimationFrame**: Для синхронизации с браузером
- **CSS Transitions**: Для плавных переходов
- **CSS Variables**: Для динамического управления размерами

### Оптимизация производительности:

- `willChange: 'width, height'` - Подсказка браузеру для оптимизации
- `requestAnimationFrame` - Синхронизация с циклом рендеринга
- Debouncing через `setTimeout` - Предотвращение лишних обновлений
- Условный рендеринг - `shouldMount` для контроля монтирования

---

## 8. Файлы проекта

### Основные файлы:

- `src/components/ui/BaseModal.jsx` - Базовый компонент модального окна
- `src/components/ui/AnimatedModalContent.jsx` - Компонент анимации контента
- `src/components/modals/TutorialModal.jsx` - Модальное окно обучения
- `src/styles/animations.css` - CSS анимации

### Зависимости:

- `@headlessui/react` - Dialog компонент
- `react` - React hooks
- `lucide-react` - Иконки

---

**Версия документа:** 1.0  
**Дата создания:** 2024-12-19  
**Последнее обновление:** 2024-12-19
