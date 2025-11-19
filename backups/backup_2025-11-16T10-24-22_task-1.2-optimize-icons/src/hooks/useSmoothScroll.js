import { useCallback } from 'react'

/**
 * Хук для плавной прокрутки к элементу
 * 
 * @param {Object} options - Опции прокрутки
 * @param {string} options.behavior - Поведение прокрутки ('smooth' | 'auto' | 'instant')
 * @param {string} options.block - Вертикальное выравнивание ('start' | 'center' | 'end' | 'nearest')
 * @param {string} options.inline - Горизонтальное выравнивание ('start' | 'center' | 'end' | 'nearest')
 * @returns {Function} Функция для прокрутки к элементу
 */
export function useSmoothScroll(options = {}) {
  const {
    behavior = 'smooth',
    block = 'start',
    inline = 'nearest',
  } = options

  const scrollToElement = useCallback(
    (elementOrId, offset = 0) => {
      let element = null

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

  const scrollToTop = useCallback(() => {
    window.scrollTo({
      top: 0,
      behavior,
    })
  }, [behavior])

  const scrollToBottom = useCallback(() => {
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

