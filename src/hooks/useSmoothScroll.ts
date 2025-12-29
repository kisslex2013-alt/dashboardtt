import { useCallback } from 'react'

type ScrollBehavior = 'smooth' | 'auto' | 'instant'
type ScrollAlignment = 'start' | 'center' | 'end' | 'nearest'

interface SmoothScrollOptions {
  behavior?: ScrollBehavior
  block?: ScrollAlignment
  inline?: ScrollAlignment
}

interface UseSmoothScrollReturn {
  scrollToElement: (elementOrId: string | HTMLElement, offset?: number) => void
  scrollToTop: () => void
  scrollToBottom: () => void
}

/**
 * Хук для плавной прокрутки к элементу
 *
 * @param options - Опции прокрутки
 * @returns Функции для прокрутки
 */
export function useSmoothScroll(options: SmoothScrollOptions = {}): UseSmoothScrollReturn {
  const {
    behavior = 'smooth',
    block = 'start',
    inline = 'nearest',
  } = options

  const scrollToElement = useCallback(
    (elementOrId: string | HTMLElement, offset: number = 0): void => {
      let element: HTMLElement | null = null

      if (typeof elementOrId === 'string') {
        element = document.getElementById(elementOrId) || document.querySelector(elementOrId)
      } else if (elementOrId instanceof HTMLElement) {
        element = elementOrId
      }

      if (!element) {
        console.warn('Element not found for smooth scroll:', elementOrId)
        return
      }

      const elementPosition = element.getBoundingClientRect().top + window.pageYOffset
      const offsetPosition = elementPosition - offset

      window.scrollTo({
        top: offsetPosition,
        behavior,
      })
    },
    [behavior]
  )

  const scrollToTop = useCallback((): void => {
    window.scrollTo({
      top: 0,
      behavior,
    })
  }, [behavior])

  const scrollToBottom = useCallback((): void => {
    window.scrollTo({
      top: document.documentElement.scrollHeight,
      behavior,
    })
  }, [behavior])

  return {
    scrollToElement,
    scrollToTop,
    scrollToBottom,
  }
}
