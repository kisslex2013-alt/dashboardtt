import { useState, useEffect, useRef } from 'react'

/**
 * Wrapper для контента модального окна с анимацией при изменении
 *
 * ВЕРСИЯ 2.0: Полностью исправленная анимация
 * - Корректно работает при увеличении и уменьшении
 * - Защита от быстрых переключений
 * - Оптимизация для Safari
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
  const [shouldHideOverflow, setShouldHideOverflow] = useState(false)

  const contentRef = useRef(null)
  const previousKeyRef = useRef(contentKey)
  const isAnimatingRef = useRef(false)
  const timeoutRefs = useRef({
    fadeOut: null,
    fadeIn: null,
    cleanup: null,
  })

  useEffect(() => {
    // Проверяем, изменился ли ключ контента
    if (previousKeyRef.current === contentKey) {
      setDisplayedContent(children)
      return
    }

    const contentElement = contentRef.current
    if (!contentElement) {
      setDisplayedContent(children)
      previousKeyRef.current = contentKey
      return
    }

    // Защита от быстрых переключений
    if (isAnimatingRef.current) {
      // Очищаем предыдущие таймеры
      Object.values(timeoutRefs.current).forEach(timeout => {
        if (timeout) clearTimeout(timeout)
      })
    }

    isAnimatingRef.current = true

    // 1. Фиксируем текущую высоту
    const currentHeight = contentElement.getBoundingClientRect().height
    contentElement.style.height = `${currentHeight}px`

    // 2. Включаем overflow: hidden
    setShouldHideOverflow(true)

    // 3. Начинаем затухание
    setIsChanging(true)

    // 4. После затухания меняем контент
    timeoutRefs.current.fadeOut = setTimeout(() => {
      setDisplayedContent(children)
      previousKeyRef.current = contentKey

      // 5. Измеряем новую высоту
      requestAnimationFrame(() => {
        contentElement.style.height = 'auto'
        const newHeight = contentElement.getBoundingClientRect().height
        contentElement.style.height = `${currentHeight}px`

        // 6. Анимируем к новой высоте
        requestAnimationFrame(() => {
          contentElement.style.height = `${newHeight}px`

          // 7. Запускаем fade-in
          timeoutRefs.current.fadeIn = setTimeout(() => {
            setIsChanging(false)

            // 8. Финальная очистка
            timeoutRefs.current.cleanup = setTimeout(() => {
              if (contentElement) {
                contentElement.style.height = 'auto'
                setShouldHideOverflow(false)
                isAnimatingRef.current = false
              }
            }, heightDuration)
          }, 50)
        })
      })
    }, fadeOutDuration)

    // Cleanup function
    return () => {
      Object.values(timeoutRefs.current).forEach(timeout => {
        if (timeout) clearTimeout(timeout)
      })
    }
  }, [contentKey, children, fadeOutDuration, heightDuration])

  return (
    <div
      ref={contentRef}
      className="mb-6"
      style={{
        transition: `height ${heightDuration}ms cubic-bezier(0.4, 0, 0.2, 1)`,
        overflow: shouldHideOverflow ? 'hidden' : 'visible',
        willChange: shouldHideOverflow ? 'height' : 'auto',
        WebkitBackfaceVisibility: 'hidden',
        backfaceVisibility: 'hidden',
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
