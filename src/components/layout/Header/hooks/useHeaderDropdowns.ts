import { useState, useRef, RefObject } from 'react'
import { useAnimationState } from '../../../../hooks/useAnimationState'

interface DropdownPosition {
  top: number
  right: number
}

interface UseHeaderDropdownsReturn {
  isDropdownOpen: boolean
  setIsDropdownOpen: (open: boolean) => void
  isColorSchemeDropdownOpen: boolean
  setIsColorSchemeDropdownOpen: (open: boolean) => void
  shouldMountDropdown: boolean
  isAnimatingDropdown: boolean
  isExitingDropdown: boolean
  dropdownRef: RefObject<HTMLDivElement | null>
  shouldMountColorSchemeDropdown: boolean
  isAnimatingColorSchemeDropdown: boolean
  isExitingColorSchemeDropdown: boolean
  colorSchemeDropdownRef: RefObject<HTMLDivElement | null>
  dropdownPosition: DropdownPosition
  setDropdownPosition: (pos: DropdownPosition) => void
  colorSchemeDropdownPosition: DropdownPosition
  setColorSchemeDropdownPosition: (pos: DropdownPosition) => void
}

export function useHeaderDropdowns(): UseHeaderDropdownsReturn {
  const [isDropdownOpen, setIsDropdownOpen] = useState(false)
  const [isColorSchemeDropdownOpen, setIsColorSchemeDropdownOpen] = useState(false)

  const dropdownAnimation = useAnimationState({
    isOpen: isDropdownOpen,
    duration: 300
  })

  // Для обратной совместимости с существующим кодом компонента используем те же имена
  const shouldMountDropdown = dropdownAnimation.shouldMount
  const isAnimatingDropdown = dropdownAnimation.isAnimating
  const isExitingDropdown = dropdownAnimation.isExiting
  const dropdownRef = useRef<HTMLDivElement | null>(null)

  const colorSchemeAnimation = useAnimationState({
    isOpen: isColorSchemeDropdownOpen,
    duration: 300
  })

  const shouldMountColorSchemeDropdown = colorSchemeAnimation.shouldMount
  const isAnimatingColorSchemeDropdown = colorSchemeAnimation.isAnimating
  const isExitingColorSchemeDropdown = colorSchemeAnimation.isExiting
  const colorSchemeDropdownRef = useRef<HTMLDivElement | null>(null)

  const [dropdownPosition, setDropdownPosition] = useState<DropdownPosition>({ top: 0, right: 0 })
  const [colorSchemeDropdownPosition, setColorSchemeDropdownPosition] = useState<DropdownPosition>({ top: 0, right: 0 })

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
