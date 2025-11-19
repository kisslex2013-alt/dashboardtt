import { useState, useEffect, useRef, useCallback } from 'react'

/**
 * Хук для управления выпадающими меню в Header
 * Управляет состоянием открытия/закрытия и анимациями
 */
export function useHeaderDropdowns() {
  const [isDropdownOpen, setIsDropdownOpen] = useState(false)
  const [isColorSchemeDropdownOpen, setIsColorSchemeDropdownOpen] = useState(false)

  // Три состояния для контроля анимаций (Three-State Animation Control)
  const [shouldMountDropdown, setShouldMountDropdown] = useState(false)
  const [isAnimatingDropdown, setIsAnimatingDropdown] = useState(false)
  const [isExitingDropdown, setIsExitingDropdown] = useState(false)
  const dropdownRef = useRef(null)

  // Состояния для выпадающего списка цветовых схем
  const [shouldMountColorSchemeDropdown, setShouldMountColorSchemeDropdown] = useState(false)
  const [isAnimatingColorSchemeDropdown, setIsAnimatingColorSchemeDropdown] = useState(false)
  const [isExitingColorSchemeDropdown, setIsExitingColorSchemeDropdown] = useState(false)
  const colorSchemeDropdownRef = useRef(null)

  const [dropdownPosition, setDropdownPosition] = useState({ top: 0, right: 0 })
  const [colorSchemeDropdownPosition, setColorSchemeDropdownPosition] = useState({ top: 0, right: 0 })

  // Логика открытия основного dropdown
  useEffect(() => {
    if (isDropdownOpen) {
      setShouldMountDropdown(true)
      setIsExitingDropdown(false)
      const rafId = requestAnimationFrame(() => {
        setIsAnimatingDropdown(true)
      })
      return () => cancelAnimationFrame(rafId)
    }
  }, [isDropdownOpen])

  // Логика закрытия основного dropdown
  useEffect(() => {
    if (!isDropdownOpen && shouldMountDropdown && !isExitingDropdown) {
      setIsAnimatingDropdown(false)
      const rafId = requestAnimationFrame(() => {
        setIsExitingDropdown(true)
      })
      return () => cancelAnimationFrame(rafId)
    }
  }, [isDropdownOpen, shouldMountDropdown, isExitingDropdown])

  // Слушатель окончания анимации исчезновения основного dropdown
  useEffect(() => {
    if (isExitingDropdown && dropdownRef.current) {
      const handleAnimationEnd = e => {
        if (
          e.animationName === 'slideDownOut' ||
          e.animationName === 'slideUpOut' ||
          e.animationName.includes('slideOut')
        ) {
          setIsExitingDropdown(false)
          setShouldMountDropdown(false)
        }
      }

      const fallbackTimer = setTimeout(() => {
        setIsExitingDropdown(false)
        setShouldMountDropdown(false)
      }, 300)

      dropdownRef.current.addEventListener('animationend', handleAnimationEnd)

      return () => {
        clearTimeout(fallbackTimer)
        dropdownRef.current?.removeEventListener('animationend', handleAnimationEnd)
      }
    }
  }, [isExitingDropdown])

  // Логика открытия color scheme dropdown
  useEffect(() => {
    if (isColorSchemeDropdownOpen) {
      setShouldMountColorSchemeDropdown(true)
      setIsExitingColorSchemeDropdown(false)
      const rafId = requestAnimationFrame(() => {
        setIsAnimatingColorSchemeDropdown(true)
      })
      return () => cancelAnimationFrame(rafId)
    }
  }, [isColorSchemeDropdownOpen])

  // Логика закрытия color scheme dropdown
  useEffect(() => {
    if (!isColorSchemeDropdownOpen && shouldMountColorSchemeDropdown && !isExitingColorSchemeDropdown) {
      setIsAnimatingColorSchemeDropdown(false)
      const rafId = requestAnimationFrame(() => {
        setIsExitingColorSchemeDropdown(true)
      })
      return () => cancelAnimationFrame(rafId)
    }
  }, [isColorSchemeDropdownOpen, shouldMountColorSchemeDropdown, isExitingColorSchemeDropdown])

  // Слушатель окончания анимации исчезновения color scheme dropdown
  useEffect(() => {
    if (isExitingColorSchemeDropdown && colorSchemeDropdownRef.current) {
      const handleAnimationEnd = e => {
        if (
          e.animationName === 'slideDownOut' ||
          e.animationName === 'slideUpOut' ||
          e.animationName.includes('slideOut')
        ) {
          setIsExitingColorSchemeDropdown(false)
          setShouldMountColorSchemeDropdown(false)
        }
      }

      const fallbackTimer = setTimeout(() => {
        setIsExitingColorSchemeDropdown(false)
        setShouldMountColorSchemeDropdown(false)
      }, 300)

      colorSchemeDropdownRef.current.addEventListener('animationend', handleAnimationEnd)

      return () => {
        clearTimeout(fallbackTimer)
        colorSchemeDropdownRef.current?.removeEventListener('animationend', handleAnimationEnd)
      }
    }
  }, [isExitingColorSchemeDropdown])

  return {
    isDropdownOpen,
    setIsDropdownOpen,
    isColorSchemeDropdownOpen,
    setIsColorSchemeDropdownOpen,
    shouldMountDropdown,
    isAnimatingDropdown,
    isExitingDropdown,
    dropdownRef,
    shouldMountColorSchemeDropdown,
    isAnimatingColorSchemeDropdown,
    isExitingColorSchemeDropdown,
    colorSchemeDropdownRef,
    dropdownPosition,
    setDropdownPosition,
    colorSchemeDropdownPosition,
    setColorSchemeDropdownPosition,
  }
}

