import { useState, useEffect, useRef, useCallback, RefObject } from 'react'

interface UseThreeStateAnimationOptions {
  animationDuration?: number
  animationName?: string
}

interface UseThreeStateAnimationReturn {
  shouldMount: boolean
  isAnimating: boolean
  isExiting: boolean
  elementRef: RefObject<HTMLElement | null>
  reset: () => void
}

export function useThreeStateAnimation(
  isOpen: boolean,
  options: UseThreeStateAnimationOptions = {}
): UseThreeStateAnimationReturn {
  const { animationDuration = 300, animationName = 'slideOut' } = options

  const [shouldMount, setShouldMount] = useState(false)
  const [isAnimating, setIsAnimating] = useState(false)
  const [isExiting, setIsExiting] = useState(false)
  const elementRef = useRef<HTMLElement | null>(null)

  useEffect(() => {
    if (isOpen) {
      setShouldMount(true)
      setIsExiting(false)
      const rafId = requestAnimationFrame(() => setIsAnimating(true))
      return () => cancelAnimationFrame(rafId)
    }
  }, [isOpen])

  useEffect(() => {
    if (!isOpen && shouldMount && !isExiting) {
      setIsAnimating(false)
      const rafId = requestAnimationFrame(() => setIsExiting(true))
      return () => cancelAnimationFrame(rafId)
    }
  }, [isOpen, shouldMount, isExiting])

  useEffect(() => {
    if (isExiting && elementRef.current) {
      const handleAnimationEnd = (e: AnimationEvent) => {
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

  const reset = useCallback(() => {
    setIsAnimating(false)
    setIsExiting(false)
    setShouldMount(false)
  }, [])

  return { shouldMount, isAnimating, isExiting, elementRef, reset }
}
