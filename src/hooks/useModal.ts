import { useState, useCallback } from 'react'

export interface UseModalReturn<T = any> {
  isOpen: boolean
  open: (data?: T) => void
  close: () => void
  toggle: () => void
  data: T | null
}

/**
 * 🪟 Generic hook for modal state management
 * Handles open/close state and optional data passing
 */
export function useModal<T = any>(initialState: boolean = false): UseModalReturn<T> {
  const [isOpen, setIsOpen] = useState(initialState)
  const [data, setData] = useState<T | null>(null)

  const open = useCallback((modalData?: T) => {
    if (modalData !== undefined) {
      setData(modalData)
    }
    setIsOpen(true)
  }, [])

  const close = useCallback(() => {
    setIsOpen(false)
    // Optional: Clear data on close after delay or keep it for exit animations
    // keeping it allows accessing data during exit animation
  }, [])

  const toggle = useCallback(() => {
    setIsOpen(prev => !prev)
  }, [])

  return { isOpen, open, close, toggle, data }
}
