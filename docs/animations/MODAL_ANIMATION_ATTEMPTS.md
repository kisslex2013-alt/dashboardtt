# 📋 История попыток внедрения анимации изменения размера модального окна

## 📅 Дата создания: 2025-01-05

## 🎯 Цель

Реализовать плавную анимацию изменения размера модального окна `AboutModal` при переключении между вкладками (История, Планы, Технологии, Поддержка).

## 🔍 Анализ проблемы

### Контекст

- Модальное окно `AboutModal` имеет 4 вкладки с разным объемом контента
- При переключении вкладок высота окна резко меняется
- Внутри каждой вкладки есть аккордеоны (framer-motion), которые также меняют высоту
- Нужна плавная анимация изменения размера без конфликтов с аккордеонами

### Технические ограничения

- React обновляет DOM асинхронно
- CSS transition не работает с `height: auto`
- Необходимо измерять высоту до и после рендера
- Аккордеоны используют framer-motion с собственной анимацией

## 📝 Попытка 1: Базовая логика с useEffect

**Период:** Первая попытка  
**Подход:** Использование `useState` для хранения высоты и `useEffect` для отслеживания смены вкладки

**Код:**

```javascript
const [contentHeight, setContentHeight] = useState('auto')

useEffect(() => {
  if (contentRef.current && isOpen) {
    const currentHeight = contentRef.current.scrollHeight
    setContentHeight(`${currentHeight}px`)

    requestAnimationFrame(() => {
      if (contentRef.current) {
        const newHeight = contentRef.current.scrollHeight
        setContentHeight(`${newHeight}px`)

        setTimeout(() => {
          setContentHeight('auto')
        }, 300)
      }
    })
  }
}, [activeTab, isOpen])
```

**Результат:** ❌ Не сработало  
**Причина:** React обновляет DOM асинхронно, измерение высоты происходит до полного рендера нового контента

---

## 📝 Попытка 2: Двойной requestAnimationFrame

**Период:** Вторая попытка  
**Подход:** Использование двойного `requestAnimationFrame` для гарантии завершения рендера

**Код:**

```javascript
useEffect(() => {
  if (!contentRef.current || !isOpen) return

  const currentHeight = contentRef.current.scrollHeight
  setContentHeight(`${currentHeight}px`)

  requestAnimationFrame(() => {
    requestAnimationFrame(() => {
      setTimeout(() => {
        if (contentRef.current) {
          const newHeight = contentRef.current.scrollHeight
          if (Math.abs(newHeight - currentHeight) > 1) {
            setContentHeight(`${newHeight}px`)
          }
          setTimeout(() => {
            setContentHeight('auto')
          }, 300)
        }
      }, 10)
    })
  })
}, [activeTab, isOpen])
```

**Результат:** ❌ Не сработало  
**Причина:** Несмотря на двойной RAF, измерение происходит раньше, чем React полностью обновит DOM

---

## 📝 Попытка 3: useLayoutEffect с двойным RAF

**Период:** Третья попытка  
**Подход:** Использование `useLayoutEffect` для синхронного измерения высоты

**Код:**

```javascript
useLayoutEffect(() => {
  if (!isOpen || !contentRef.current) return

  const currentHeight = contentRef.current.scrollHeight
  const savedHeight = heightRef.current || currentHeight
  heightRef.current = currentHeight

  setContentHeight(`${savedHeight}px`)
  setIsAnimating(true)

  const rafId1 = requestAnimationFrame(() => {
    const rafId2 = requestAnimationFrame(() => {
      setTimeout(() => {
        if (!contentRef.current) return

        const newHeight = contentRef.current.scrollHeight
        if (Math.abs(newHeight - savedHeight) > 5) {
          heightRef.current = newHeight
          setContentHeight(`${newHeight}px`)

          setTimeout(() => {
            setContentHeight('auto')
            setIsAnimating(false)
          }, 300)
        } else {
          setContentHeight('auto')
          setIsAnimating(false)
        }
      }, 16)
    })
  })

  return () => {
    cancelAnimationFrame(rafId1)
  }
}, [activeTab, isOpen])
```

**Результат:** ⚠️ Частично работает  
**Причина:** Работает при увеличении размера, но не работает при уменьшении

---

## 📝 Попытка 4: Вариант 5 - Плавное затухание (fade-smooth)

**Период:** Четвертая попытка  
**Подход:** Реализация варианта 5 из primer - плавное затухание старого контента, затем изменение высоты, затем появление нового

**Ключевые особенности:**

- Использование `useLayoutEffect` для синхронного измерения
- Тройной RAF для гарантии полного рендера
- Затухание контента (fade-out) перед изменением высоты
- Появление нового контента (fade-in) после изменения высоты
- Изоляция от аккордеонов (только реагирует на `activeTab`)

**Код:**

```javascript
// Состояния
const contentRef = useRef(null)
const heightRef = useRef(null)
const previousTabRef = useRef(activeTab)
const isAnimatingRef = useRef(false)
const animationTimersRef = useRef([])
const [contentHeight, setContentHeight] = useState('auto')
const [isFadingOut, setIsFadingOut] = useState(false)
const [isAnimating, setIsAnimating] = useState(false)

// useLayoutEffect с полной логикой
useLayoutEffect(() => {
  // Очистка таймеров
  animationTimersRef.current.forEach(timer => {
    if (typeof timer === 'number') {
      clearTimeout(timer)
    } else {
      cancelAnimationFrame(timer)
    }
  })
  animationTimersRef.current = []

  if (!isOpen || !contentRef.current) {
    previousTabRef.current = activeTab
    isAnimatingRef.current = false
    setIsAnimating(false)
    setContentHeight('auto')
    setIsFadingOut(false)
    return
  }

  if (activeTab === previousTabRef.current && previousTabRef.current !== null) {
    return
  }

  if (isAnimatingRef.current) {
    isAnimatingRef.current = false
    setIsAnimating(false)
    setContentHeight('auto')
    setIsFadingOut(false)
  }

  const contentEl = contentRef.current
  const currentHeight = contentEl.scrollHeight
  const savedHeight = heightRef.current || currentHeight

  isAnimatingRef.current = true
  setIsAnimating(true)
  heightRef.current = currentHeight

  setContentHeight(`${savedHeight}px`)
  setIsFadingOut(true)

  const fadeOutTimer = setTimeout(() => {
    const rafId1 = requestAnimationFrame(() => {
      const rafId2 = requestAnimationFrame(() => {
        const rafId3 = requestAnimationFrame(() => {
          const measureTimer = setTimeout(() => {
            if (!contentRef.current || !isAnimatingRef.current) {
              isAnimatingRef.current = false
              setIsAnimating(false)
              return
            }

            const newHeight = contentRef.current.scrollHeight

            if (Math.abs(newHeight - savedHeight) > 5) {
              heightRef.current = newHeight
              setContentHeight(`${newHeight}px`)

              const fadeInTimer = setTimeout(() => {
                if (!isAnimatingRef.current) return

                setIsFadingOut(false)

                const autoTimer = setTimeout(() => {
                  if (!isAnimatingRef.current) return

                  setContentHeight('auto')
                  isAnimatingRef.current = false
                  setIsAnimating(false)
                  previousTabRef.current = activeTab
                  animationTimersRef.current = []
                }, 350)

                animationTimersRef.current.push(autoTimer)
              }, 50)

              animationTimersRef.current.push(fadeInTimer)
            } else {
              setIsFadingOut(false)
              setContentHeight('auto')
              isAnimatingRef.current = false
              setIsAnimating(false)
              previousTabRef.current = activeTab
              animationTimersRef.current = []
            }
          }, 30)

          animationTimersRef.current.push(measureTimer)
        })

        animationTimersRef.current.push(rafId3)
      })

      animationTimersRef.current.push(rafId2)
    })

    animationTimersRef.current.push(rafId1)
  }, 250)

  animationTimersRef.current.push(fadeOutTimer)

  return () => {
    animationTimersRef.current.forEach(timer => {
      if (typeof timer === 'number') {
        clearTimeout(timer)
      } else {
        cancelAnimationFrame(timer)
      }
    })
    animationTimersRef.current = []
    isAnimatingRef.current = false
    setIsAnimating(false)
  }
}, [activeTab, isOpen])
```

**CSS:**

```css
.modal-content-size-animation {
  position: relative;
}

.content-wrapper-fade {
  transition: opacity 0.25s ease-in-out;
}

.content-wrapper-fade.fade-out {
  opacity: 0;
  pointer-events: none;
}

.content-wrapper-fade.fade-in {
  opacity: 1;
  pointer-events: auto;
}

.content-wrapper-fade.fade-in > div:first-child {
  animation: fadeInUp 0.35s cubic-bezier(0.4, 0, 0.2, 1);
}

@keyframes fadeInUp {
  from {
    opacity: 0;
    transform: translateY(10px);
  }
  to {
    opacity: 1;
    transform: translateY(0);
  }
}
```

**Результат:** ⚠️ Работает частично  
**Проблемы:**

1. ✅ Работает при увеличении размера окна
2. ❌ Не работает при уменьшении размера окна
3. ⚠️ Дергается при открытии/закрытии аккордеонов
4. ⚠️ Не всегда срабатывает, возможны рывки

**Причины проблем:**

1. **Уменьшение размера:** Transition не применяется правильно при уменьшении высоты
2. **Конфликт с аккордеонами:** Анимация срабатывает при изменении состояния аккордеонов внутри вкладок
3. **Timing issues:** Тройной RAF и задержки создают нестабильность

---

## 🔬 Технический анализ проблем

### Проблема 1: Уменьшение размера не анимируется

**Причина:**

- Transition активен только когда `isAnimating === true`
- При уменьшении размера transition может не успеть примениться
- Нужно гарантировать применение transition ДО изменения высоты

**Решение (попытка):**

- Установка `isAnimating` ДО изменения высоты
- Использование `requestAnimationFrame` перед установкой новой высоты
- Упрощение условия для transition (активен всегда когда `contentHeight !== 'auto'`)

**Результат:** ❌ Не помогло полностью

### Проблема 2: Конфликт с аккордеонами

**Причина:**

- Аккордеоны используют framer-motion с анимацией `height: auto`
- Изменение состояния аккордеонов меняет высоту контейнера
- `useLayoutEffect` с зависимостью `[activeTab, isOpen]` не должен реагировать на аккордеоны, но может неправильно измерять высоту

**Решение (попытка):**

- Добавление флага `isAnimatingRef` для предотвращения повторных запусков
- Проверка изменения `activeTab` перед запуском анимации
- Игнорирование изменений `expandedVersions`, `expandedSections`, `expandedTechs`

**Результат:** ⚠️ Частично помогло, но все еще есть проблемы

### Проблема 3: Рывки и нестабильность

**Причина:**

- Сложная цепочка таймеров и RAF
- Множественные проверки состояния
- Возможные race conditions

**Решение (попытка):**

- Улучшенная очистка таймеров
- Использование массива для хранения всех таймеров
- Правильный cleanup в return функции

**Результат:** ⚠️ Улучшило ситуацию, но не полностью

---

## 💡 Выводы и рекомендации

### Основные проблемы

1. **CSS transition с `height: auto`** - браузеры не могут анимировать переход от/к `auto`
2. **Синхронизация React и DOM** - измерение высоты происходит до полного рендера
3. **Конфликт с framer-motion** - аккордеоны имеют собственную анимацию
4. **Timing issues** - сложная цепочка таймеров создает нестабильность

### Рекомендации для новой реализации

1. **Использовать более простой подход** - меньше таймеров, больше прямых проверок
2. **Гарантировать применение transition** - использовать `requestAnimationFrame` для установки transition перед изменением высоты
3. **Изолировать от аккордеонов** - использовать `ResizeObserver` или другой механизм для отслеживания только изменений вкладок
4. **Рассмотреть альтернативы** - возможно, использовать `framer-motion` для всей анимации или библиотеку типа `react-spring`

---

## 📚 Ссылки на решения

- Primer: `time-tracker/primer/modal-size-animation/modal-size-variant-5-fade-smooth.html`
- Проблема: `time-tracker/problems/MODAL_TABS_ANIMATION_ISSUE.md`
- Документация: `time-tracker/docs/ANIMATION_IMPLEMENTATION_COMPLETE.md`

---

**Статус:** Требуется переработка с учетом всех выявленных проблем

---

## 📝 Попытка 6: CSS max-height с fade-out/fade-in (Вариант 1)

**Период:** 2025-01-05  
**Подход:** Использование `max-height` вместо `height` для анимации изменения размера

**Код:**

```javascript
const [maxHeight, setMaxHeight] = useState(2000)
const [isFadingOut, setIsFadingOut] = useState(false)

useLayoutEffect(() => {
  if (!contentRef.current || activeTab === previousTabRef.current) return

  const currentHeight = contentRef.current.scrollHeight
  setMaxHeight(currentHeight)
  setIsFadingOut(true)

  setTimeout(() => {
    requestAnimationFrame(() => {
      requestAnimationFrame(() => {
        const newHeight = contentRef.current.scrollHeight
        requestAnimationFrame(() => {
          setMaxHeight(newHeight)
          setTimeout(() => setIsFadingOut(false), 50)
        })
      })
    })
  }, 250)
}, [activeTab, isOpen])
```

**CSS:**

```css
.modal-content-size-animation {
  transition: max-height 0.35s cubic-bezier(0.4, 0, 0.2, 1);
}
```

**Результат:** ❌ Не работает при уменьшении размера  
**Причина неудачи:**

- CSS `max-height` transition не работает корректно при уменьшении размера
- Когда новое значение `max-height` меньше текущего, браузер может не анимировать переход
- Проблема синхронизации между установкой `max-height` и применением transition

**Вывод:** `max-height` не подходит для анимации изменения размера в обе стороны. Нужно использовать `height` с фиксированными значениями в пикселях, как в primer `modal-size-variant-5-fade-smooth.html`.
