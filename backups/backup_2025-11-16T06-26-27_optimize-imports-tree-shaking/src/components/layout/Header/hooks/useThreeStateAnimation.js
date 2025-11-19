import { useState, useEffect, useRef, useCallback } from 'react'

/**
 * Универсальный хук для управления трехсостоятельными анимациями
 * Используется для плавного открытия/закрытия dropdown, модалок и других элементов
 * 
 * Три состояния:
 * 1. shouldMount - элемент должен быть в DOM
 * 2. isAnimating - идет анимация появления
 * 3. isExiting - идет анимация исчезновения
 * 
 * @param {boolean} isOpen - внешнее состояние открытости
 * @param {Object} options - опции конфигурации
 * @param {number} options.animationDuration - длительность анимации в мс (по умолчанию 300)
 * @param {string} options.animationName - имя анимации для отслеживания (по умолчанию 'slideOut')
 * @returns {Object} объект с состоянием и методами
 */
export function useThreeStateAnimation(isOpen, options = {}) {
  const { animationDuration = 300, animationName = 'slideOut' } = options

  const [shouldMount, setShouldMount] = useState(false)
  const [isAnimating, setIsAnimating] = useState(false)
  const [isExiting, setIsExiting] = useState(false)
  const elementRef = useRef(null)

  // Логика открытия
  useEffect(() => {
    if (isOpen) {
      setShouldMount(true)
      setIsExiting(false)
      // Используем RAF для синхронизации с браузером
      const rafId = requestAnimationFrame(() => {
        setIsAnimating(true)
      })
      return () => cancelAnimationFrame(rafId)
    }
  }, [isOpen])

  // Логика закрытия
  useEffect(() => {
    if (!isOpen && shouldMount && !isExiting) {
      setIsAnimating(false)
      // RAF для синхронизации перед началом exit анимации
      const rafId = requestAnimationFrame(() => {
        setIsExiting(true)
      })
      return () => cancelAnimationFrame(rafId)
    }
  }, [isOpen, shouldMount, isExiting])

  // Слушатель окончания анимации исчезновения
  useEffect(() => {
    if (isExiting && elementRef.current) {
      const handleAnimationEnd = e => {
        if (
          e.animationName === 'slideDownOut' ||
          e.animationName === 'slideUpOut' ||
          e.animationName === 'fadeOut' ||
          e.animationName.includes(animationName)
        ) {
          setIsExiting(false)
          setShouldMount(false)
        }
      }

      // Fallback таймер на случай, если событие animationend не сработает
      const fallbackTimer = setTimeout(() => {
        setIsExiting(false)
        setShouldMount(false)
      }, animationDuration)

      elementRef.current.addEventListener('animationend', handleAnimationEnd)

      return () => {
        clearTimeout(fallbackTimer)
        elementRef.current?.removeEventListener('animationend', handleAnimationEnd)
      }
    }
  }, [isExiting, animationDuration, animationName])

  /**
   * Принудительный сброс состояния
   */
  const reset = useCallback(() => {
    setIsAnimating(false)
    setIsExiting(false)
    setShouldMount(false)
  }, [])

  return {
    shouldMount,
    isAnimating,
    isExiting,
    elementRef,
    reset,
  }
}

