import { useState, useEffect, useRef, useCallback, RefObject } from 'react'
import { useAnimationState } from '../../../../hooks/useAnimationState'

interface DropdownPosition {
  top: number
  right: number
}

interface UseQuickStartReturn {
  isQuickStartOpen: boolean
  setIsQuickStartOpen: (open: boolean) => void
  shouldMountQuickStart: boolean
  isAnimatingQuickStart: boolean
  isExitingQuickStart: boolean
  quickStartRef: RefObject<HTMLDivElement | null>
  quickStartButtonRef: RefObject<HTMLButtonElement | null>
  dropdownPosition: DropdownPosition
}

export function useQuickStart(): UseQuickStartReturn {
  const [isQuickStartOpen, setIsQuickStartOpen] = useState(false)
  const quickStartRef = useRef<HTMLDivElement | null>(null)
  const quickStartButtonRef = useRef<HTMLButtonElement | null>(null)

  const animation = useAnimationState({
    isOpen: isQuickStartOpen,
    duration: 300
  })

  // Используем свойства из объекта animation
  const shouldMountQuickStart = animation.shouldMount
  const isAnimatingQuickStart = animation.isAnimating
  const isExitingQuickStart = animation.isExiting

  const [dropdownPosition, setDropdownPosition] = useState<DropdownPosition>({ top: 0, right: 0 })

  useEffect(() => {
    if (shouldMountQuickStart && quickStartButtonRef.current) {
      const updatePosition = () => {
        const rect = quickStartButtonRef.current!.getBoundingClientRect()
        const viewportWidth = window.innerWidth
        const offset = 8
        const dropdownWidth = 200

        let right = viewportWidth - rect.right
        if (right + dropdownWidth > viewportWidth) {
          right = Math.max(offset, viewportWidth - dropdownWidth - offset)
        }
        if (right < 0) right = offset

        setDropdownPosition({ top: rect.bottom + offset, right })
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

  const handleClickOutsideQuickStart = useCallback((event: MouseEvent) => {
    if (
      quickStartRef.current &&
      !quickStartRef.current.contains(event.target as Node) &&
      quickStartButtonRef.current &&
      !quickStartButtonRef.current.contains(event.target as Node)
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
