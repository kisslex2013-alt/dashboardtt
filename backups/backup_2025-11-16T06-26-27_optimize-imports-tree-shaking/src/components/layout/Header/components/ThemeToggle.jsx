import { useRef, useCallback } from 'react'
import { Moon, Sun } from '../../../../utils/icons'
import { useTheme, useSetTheme, useThemeTransitionType } from '../../../../store/useSettingsStore'
import { ThemeTransitionOverlay } from '../../../ui/ThemeTransitionOverlay'

/**
 * Компонент переключателя темы
 */
export function ThemeToggle() {
  const theme = useTheme()
  const setTheme = useSetTheme()
  const themeTransitionType = useThemeTransitionType()
  const themeButtonRef = useRef(null)

  /**
   * Получает длительность анимации
   */
  const getTransitionDuration = useCallback(
    type => {
      const durations = {
        circle: 600,
        fade: 400,
        wipe: 500,
        blur: 500,
        rotate: 600,
      }
      return durations[type] || 400
    },
    []
  )

  /**
   * Переключение темы с анимацией
   */
  const toggleTheme = useCallback(() => {
    const newTheme = theme === 'light' ? 'dark' : 'light'

    // Применяем анимацию перехода перед сменой темы
    if (themeTransitionType !== 'none') {
      // Создаем overlay для анимации
      const overlay = document.createElement('div')
      overlay.className = `theme-transition-overlay theme-transition-${themeTransitionType}`
      overlay.setAttribute('data-theme', newTheme)
      overlay.setAttribute('data-transition', themeTransitionType)
      document.body.appendChild(overlay)

      // Устанавливаем позицию для circle reveal
      if (themeTransitionType === 'circle' && themeButtonRef.current) {
        const rect = themeButtonRef.current.getBoundingClientRect()
        const centerX = rect.left + rect.width / 2
        const centerY = rect.top + rect.height / 2
        overlay.style.setProperty('--circle-x', `${centerX}px`)
        overlay.style.setProperty('--circle-y', `${centerY}px`)
      }

      // Запускаем анимацию
      requestAnimationFrame(() => {
        requestAnimationFrame(() => {
          overlay.classList.add('active')

          // Меняем тему в середине анимации
          const duration = getTransitionDuration(themeTransitionType)
          setTimeout(() => {
            setTheme(newTheme)
            document.documentElement.classList.toggle('dark')

            // Завершаем анимацию
            setTimeout(() => {
              overlay.classList.add('complete')
              setTimeout(() => overlay.remove(), 100)
            }, duration / 2)
          }, duration / 2)
        })
      })
    } else {
      // Без анимации - просто меняем тему
      setTheme(newTheme)
      document.documentElement.classList.toggle('dark')
    }
  }, [theme, setTheme, themeTransitionType, getTransitionDuration])

  return (
    <>
      <ThemeTransitionOverlay
        transitionType={themeTransitionType}
        currentTheme={theme}
        triggerElement={themeButtonRef.current}
      />
      <button
        ref={themeButtonRef}
        aria-label="Переключить тему"
        onClick={toggleTheme}
        className="glass-button p-2 rounded-lg transition-normal hover-lift-scale click-shrink"
        data-icon-id={theme === 'light' ? 'header-theme-light' : 'header-theme-dark'}
      >
        {theme === 'light' ? <Moon className="w-5 h-5" /> : <Sun className="w-5 h-5" />}
      </button>
    </>
  )
}

