import { useState, useEffect, useRef, useMemo, useLayoutEffect } from 'react'

/**
 * Wrapper для контента модального окна с анимацией при изменении
 *
 * ВЕРСИЯ 3.0: Оптимизированная анимация
 * - Уменьшено количество requestAnimationFrame
 * - Использован useLayoutEffect для синхронных измерений
 * - Оптимизация производительности через useMemo
 * - Кэширование измерений высоты
 *
 * @param {React.ReactNode} children - Контент для отображения
 * @param {string|number} contentKey - Ключ для отслеживания смены контента
 * @param {number} fadeOutDuration - Длительность затухания (мс)
 * @param {number} heightDuration - Длительность изменения высоты (мс)
 */
export function AnimatedModalContent({
  children,
  contentKey,
  fadeOutDuration = 200,
  heightDuration = 300,
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
  const heightCacheRef = useRef(null)

  // Мемоизация children для предотвращения лишних ре-рендеров
  const memoizedChildren = useMemo(() => children, [children])

  useLayoutEffect(() => {
    // Проверяем, изменился ли ключ контента
    if (previousKeyRef.current === contentKey) {
      setDisplayedContent(memoizedChildren)
      return
    }

    const contentElement = contentRef.current
    if (!contentElement) {
      setDisplayedContent(memoizedChildren)
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

    // 1. Фиксируем текущую высоту (используем кэш если доступен)
    const currentHeight = heightCacheRef.current || contentElement.getBoundingClientRect().height
    contentElement.style.height = `${currentHeight}px`

    // 2. Включаем overflow: hidden
    setShouldHideOverflow(true)

    // 3. Начинаем затухание
    setIsChanging(true)

    // 4. После затухания меняем контент
    timeoutRefs.current.fadeOut = setTimeout(() => {
      setDisplayedContent(memoizedChildren)
      previousKeyRef.current = contentKey

      // 5. Измеряем новую высоту синхронно (useLayoutEffect уже выполнен)
      // Используем один requestAnimationFrame вместо двух
      requestAnimationFrame(() => {
        // Временно устанавливаем auto для измерения
        const tempHeight = contentElement.style.height
        contentElement.style.height = 'auto'
        const newHeight = contentElement.getBoundingClientRect().height
        contentElement.style.height = tempHeight

        // Кэшируем новую высоту
        heightCacheRef.current = newHeight

        // Анимируем к новой высоте
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
                heightCacheRef.current = null
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
  }, [contentKey, memoizedChildren, fadeOutDuration, heightDuration])

  return (
    <div
      ref={contentRef}
      style={{
        transition: shouldHideOverflow ? `height ${heightDuration}ms cubic-bezier(0.4, 0, 0.2, 1)` : 'none',
        overflow: shouldHideOverflow ? 'hidden' : 'visible',
        willChange: shouldHideOverflow ? 'height' : 'auto',
        WebkitBackfaceVisibility: 'hidden',
        backfaceVisibility: 'hidden',
        contain: 'layout style paint', // Оптимизация производительности
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
