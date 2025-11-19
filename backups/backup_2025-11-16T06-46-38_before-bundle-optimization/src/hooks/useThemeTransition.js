/**
 * 🎨 Хук для управления анимациями перехода темы
 * 
 * Поддерживает 5 различных концептов анимации:
 * 1. Circle Reveal - круговое раскрытие от кнопки переключения
 * 2. Fade Transition - плавное затухание/появление
 * 3. Wipe - горизонтальное стирание
 * 4. Blur Transition - размытие и появление
 * 5. Rotate Flip - вращение с переворотом
 */

import { useEffect, useRef, useState } from 'react'

/**
 * Хук для применения анимации перехода темы
 * @param {string} transitionType - тип анимации: 'circle', 'fade', 'wipe', 'blur', 'rotate'
 * @param {string} currentTheme - текущая тема: 'light' | 'dark'
 * @param {HTMLElement|null} triggerElement - элемент, от которого начинается анимация (для circle)
 */
export function useThemeTransition(transitionType = 'circle', currentTheme, triggerElement = null) {
  const overlayRef = useRef(null)
  const [isTransitioning, setIsTransitioning] = useState(false)
  const previousThemeRef = useRef(currentTheme)

  useEffect(() => {
    // Определяем изменение темы
    if (previousThemeRef.current !== currentTheme) {
      setIsTransitioning(true)
      previousThemeRef.current = currentTheme

      // Создаем overlay для анимации
      const overlay = document.createElement('div')
      overlay.className = `theme-transition-overlay theme-transition-${transitionType}`
      overlay.setAttribute('data-theme', currentTheme)
      overlay.setAttribute('data-transition', transitionType)
      document.body.appendChild(overlay)
      overlayRef.current = overlay

      // Устанавливаем позицию для circle reveal
      if (transitionType === 'circle' && triggerElement) {
        const rect = triggerElement.getBoundingClientRect()
        const centerX = rect.left + rect.width / 2
        const centerY = rect.top + rect.height / 2
        overlay.style.setProperty('--circle-x', `${centerX}px`)
        overlay.style.setProperty('--circle-y', `${centerY}px`)
      }

      // Запускаем анимацию
      requestAnimationFrame(() => {
        requestAnimationFrame(() => {
          overlay.classList.add('active')
        })
      })

      // Удаляем overlay после завершения анимации
      const duration = getTransitionDuration(transitionType)
      setTimeout(() => {
        overlay.classList.add('complete')
        setTimeout(() => {
          overlay.remove()
          setIsTransitioning(false)
        }, 100)
      }, duration)
    }
  }, [currentTheme, transitionType, triggerElement])

  return { isTransitioning, overlayRef }
}

/**
 * Получает длительность анимации в зависимости от типа
 */
function getTransitionDuration(type) {
  const durations = {
    circle: 600,
    fade: 400,
    wipe: 500,
    blur: 500,
    rotate: 600,
  }
  return durations[type] || 400
}

