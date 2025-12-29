import { useState, useEffect, useCallback } from 'react'

interface AnimationStateConfig {
  /**
   * Начальное состояние (открыто/закрыто)
   * @default false
   */
  isOpen?: boolean
  /**
   * Длительность анимации в мс
   * @default 200
   */
  duration?: number
  /**
   * Задержка перед размонтированием (если отличается от duration)
   */
  unmountDelay?: number
}

/**
 * Хук для управления состоянием анимации (монтирование -> анимация -> размонтирование)
 *
 * Жизненный цикл открытия:
 * 1. shouldMount = true (компонент рендерится)
 * 2. requestAnimationFrame -> isAnimating = true (запускается CSS transition)
 *
 * Жизненный цикл закрытия:
 * 1. isOpen становится false
 * 2. isExiting = true (запускается анимация выход)
 * 3. setTimeout -> shouldMount = false, isAnimating = false, isExiting = false
 */
export function useAnimationState({
  isOpen = false,
  duration = 200,
  unmountDelay,
}: AnimationStateConfig = {}) {
  const [shouldMount, setShouldMount] = useState(isOpen)
  const [isAnimating, setIsAnimating] = useState(false)
  const [isExiting, setIsExiting] = useState(false)

  useEffect(() => {
    let timeoutId: NodeJS.Timeout
    let animationFrameId: number

    if (isOpen) {
      setShouldMount(true)
      setIsExiting(false)
      // Даем браузеру отрисовать начальное состояние перед запуском анимации
      animationFrameId = requestAnimationFrame(() => {
        animationFrameId = requestAnimationFrame(() => {
          setIsAnimating(true)
        })
      })
    } else {
      if (shouldMount) {
        setIsExiting(true)
        setIsAnimating(false)
        timeoutId = setTimeout(() => {
          setShouldMount(false)
          setIsExiting(false)
        }, unmountDelay ?? duration)
      }
    }

    return () => {
      clearTimeout(timeoutId)
      cancelAnimationFrame(animationFrameId)
    }
  }, [isOpen, duration, unmountDelay, shouldMount])

  return {
    shouldMount,
    isAnimating,
    isExiting,
  }
}
