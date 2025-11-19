import { useState, useEffect, useRef, useCallback } from 'react'

/**
 * Хук для управления Quick Start панелью
 */
export function useQuickStart() {
  const [isQuickStartOpen, setIsQuickStartOpen] = useState(false)
  const [shouldMountQuickStart, setShouldMountQuickStart] = useState(false)
  const [isAnimatingQuickStart, setIsAnimatingQuickStart] = useState(false)
  const [isExitingQuickStart, setIsExitingQuickStart] = useState(false)
  const quickStartRef = useRef(null)
  const quickStartButtonRef = useRef(null)
  const [dropdownPosition, setDropdownPosition] = useState({ top: 0, right: 0 })

  // Логика открытия Quick Start dropdown
  useEffect(() => {
    if (isQuickStartOpen) {
      setShouldMountQuickStart(true)
      setIsExitingQuickStart(false)
      const rafId = requestAnimationFrame(() => {
        setIsAnimatingQuickStart(true)
      })
      return () => cancelAnimationFrame(rafId)
    }
  }, [isQuickStartOpen])

  // Логика закрытия Quick Start dropdown
  useEffect(() => {
    if (!isQuickStartOpen && shouldMountQuickStart && !isExitingQuickStart) {
      setIsAnimatingQuickStart(false)
      const rafId = requestAnimationFrame(() => {
        setIsExitingQuickStart(true)
      })
      return () => cancelAnimationFrame(rafId)
    }
  }, [isQuickStartOpen, shouldMountQuickStart, isExitingQuickStart])

  // Слушатель окончания анимации исчезновения Quick Start
  useEffect(() => {
    if (isExitingQuickStart && quickStartRef.current) {
      const handleAnimationEnd = e => {
        if (
          e.animationName === 'slideDownOut' ||
          e.animationName === 'slideUpOut' ||
          e.animationName.includes('slideOut')
        ) {
          setIsExitingQuickStart(false)
          setShouldMountQuickStart(false)
        }
      }

      const fallbackTimer = setTimeout(() => {
        setIsExitingQuickStart(false)
        setShouldMountQuickStart(false)
      }, 300)

      quickStartRef.current.addEventListener('animationend', handleAnimationEnd)

      return () => {
        clearTimeout(fallbackTimer)
        quickStartRef.current?.removeEventListener('animationend', handleAnimationEnd)
      }
    }
  }, [isExitingQuickStart])

  // Вычисляем позицию для portal dropdown
  useEffect(() => {
    if (shouldMountQuickStart && quickStartButtonRef.current) {
      const updatePosition = () => {
        const rect = quickStartButtonRef.current.getBoundingClientRect()
        const viewportWidth = window.innerWidth
        const offset = 8
        const dropdownWidth = 200

        let right = viewportWidth - rect.right

        if (right + dropdownWidth > viewportWidth) {
          right = Math.max(offset, viewportWidth - dropdownWidth - offset)
        }
        if (right < 0) {
          right = offset
        }

        setDropdownPosition({
          top: rect.bottom + offset,
          right,
        })
      }

      updatePosition()
      window.addEventListener('scroll', updatePosition, true)
      window.addEventListener('resize', updatePosition)

      return () => {
        window.removeEventListener('scroll', updatePosition, true)
        window.removeEventListener('resize', updatePosition)
      }
    }
  }, [shouldMountQuickStart])

  // Обработчик клика вне Quick Start dropdown
  const handleClickOutsideQuickStart = useCallback(event => {
    if (
      quickStartRef.current &&
      !quickStartRef.current.contains(event.target) &&
      quickStartButtonRef.current &&
      !quickStartButtonRef.current.contains(event.target)
    ) {
      setIsQuickStartOpen(false)
    }
  }, [])

  useEffect(() => {
    if (isQuickStartOpen) {
      document.addEventListener('mousedown', handleClickOutsideQuickStart)
      return () => document.removeEventListener('mousedown', handleClickOutsideQuickStart)
    }
  }, [isQuickStartOpen, handleClickOutsideQuickStart])

  return {
    isQuickStartOpen,
    setIsQuickStartOpen,
    shouldMountQuickStart,
    isAnimatingQuickStart,
    isExitingQuickStart,
    quickStartRef,
    quickStartButtonRef,
    dropdownPosition,
  }
}

