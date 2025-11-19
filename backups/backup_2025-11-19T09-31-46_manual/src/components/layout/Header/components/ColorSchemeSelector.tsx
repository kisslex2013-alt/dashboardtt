import { useRef, useEffect, useCallback, useState } from 'react'
import { createPortal } from 'react-dom'
import { Palette, Sparkles } from '../../../../utils/icons'
import { useColorScheme, useSetColorScheme, useThemeTransitionType } from '../../../../store/useSettingsStore'
import { useHeaderDropdowns } from '../hooks/useHeaderDropdowns'

/**
 * Компонент выбора цветовой схемы
 */
export function ColorSchemeSelector() {
  const colorScheme = useColorScheme()
  const setColorScheme = useSetColorScheme()
  const themeTransitionType = useThemeTransitionType()
  const colorSchemeButtonRef = useRef(null)

  const {
    isColorSchemeDropdownOpen,
    setIsColorSchemeDropdownOpen,
    shouldMountColorSchemeDropdown,
    isAnimatingColorSchemeDropdown,
    isExitingColorSchemeDropdown,
    colorSchemeDropdownRef,
    colorSchemeDropdownPosition,
    setColorSchemeDropdownPosition,
  } = useHeaderDropdowns()

  // Устанавливаем позицию dropdown при открытии
  useEffect(() => {
    if (isColorSchemeDropdownOpen && colorSchemeButtonRef.current) {
      const rect = colorSchemeButtonRef.current.getBoundingClientRect()
      setColorSchemeDropdownPosition({
        top: rect.bottom + 8,
        right: window.innerWidth - rect.right,
      })
    }
  }, [isColorSchemeDropdownOpen, setColorSchemeDropdownPosition])

  // Обработчик клика вне dropdown
  useEffect(() => {
    const handleClickOutside = event => {
      if (
        colorSchemeDropdownRef.current &&
        !colorSchemeDropdownRef.current.contains(event.target) &&
        colorSchemeButtonRef.current &&
        !colorSchemeButtonRef.current.contains(event.target)
      ) {
        setIsColorSchemeDropdownOpen(false)
      }
    }

    if (isColorSchemeDropdownOpen) {
      document.addEventListener('mousedown', handleClickOutside)
      return () => document.removeEventListener('mousedown', handleClickOutside)
    }
  }, [isColorSchemeDropdownOpen, colorSchemeDropdownRef, setIsColorSchemeDropdownOpen])

  // Получаем название схемы
  const getSchemeLabel = useCallback(
    scheme => {
      const labels = {
        default: 'По умолчанию',
        claymorphism: 'Claymorphism',
        'soft-pop': 'Soft Pop',
        'neon-dark': 'Neon Dark',
        'pastel-light': 'Pastel Light',
        corporate: 'Corporate',
        'high-contrast': 'High Contrast',
        auto: 'Авто',
      }
      return labels[scheme] || scheme
    },
    []
  )

  // Обработчик выбора схемы
  const handleSchemeSelect = useCallback(
    scheme => {
      if (themeTransitionType !== 'none') {
        const overlay = document.createElement('div')
        overlay.className = `theme-transition-overlay theme-transition-${themeTransitionType}`
        overlay.setAttribute('data-transition', themeTransitionType)
        document.body.appendChild(overlay)

        if (themeTransitionType === 'circle' && colorSchemeButtonRef.current) {
          const rect = colorSchemeButtonRef.current.getBoundingClientRect()
          const centerX = rect.left + rect.width / 2
          const centerY = rect.top + rect.height / 2
          overlay.style.setProperty('--circle-x', `${centerX}px`)
          overlay.style.setProperty('--circle-y', `${centerY}px`)
        }

        requestAnimationFrame(() => {
          requestAnimationFrame(() => {
            overlay.classList.add('active')

            const duration = themeTransitionType === 'circle' ? 600 : themeTransitionType === 'fade' ? 400 : 500

            setTimeout(() => {
              setColorScheme(scheme)

              setTimeout(() => {
                overlay.classList.add('complete')
                setTimeout(() => overlay.remove(), 100)
              }, duration / 2)
            }, duration / 2)
          })
        })
      } else {
        setColorScheme(scheme)
      }

      setIsColorSchemeDropdownOpen(false)
    },
    [setColorScheme, themeTransitionType, setIsColorSchemeDropdownOpen]
  )

  // Получаем иконку для текущей схемы
  const getSchemeIcon = useCallback(() => {
    if (colorScheme === 'claymorphism' || colorScheme === 'corporate') {
      return Palette
    }
    if (colorScheme === 'soft-pop' || colorScheme === 'neon-dark' || colorScheme === 'pastel-light') {
      return Sparkles
    }
    if (colorScheme === 'high-contrast') {
      return Palette
    }
    return Palette
  }, [colorScheme])

  const IconComponent = getSchemeIcon()

  // Список доступных схем
  const schemes = [
    { value: 'default', label: 'По умолчанию', icon: Palette },
    { value: 'claymorphism', label: 'Claymorphism', icon: Palette },
    { value: 'soft-pop', label: 'Soft Pop', icon: Sparkles },
    { value: 'neon-dark', label: 'Neon Dark', icon: Sparkles },
    { value: 'pastel-light', label: 'Pastel Light', icon: Sparkles },
    { value: 'corporate', label: 'Corporate', icon: Palette },
    { value: 'high-contrast', label: 'High Contrast', icon: Palette },
    { value: 'auto', label: 'Авто', icon: Sparkles },
  ]

  return (
    <>
      <div className="relative">
        <button
          ref={colorSchemeButtonRef}
          aria-label="Выбрать цветовую схему"
          onClick={() => setIsColorSchemeDropdownOpen(!isColorSchemeDropdownOpen)}
          className="glass-button p-2 rounded-lg transition-normal hover-lift-scale click-shrink"
          title={`Цветовая схема: ${getSchemeLabel(colorScheme)}`}
          data-icon-id="header-color-scheme"
        >
          <IconComponent
            className={`w-5 h-5 ${colorScheme === 'default' || colorScheme === 'auto' ? 'opacity-50' : ''}`}
          />
        </button>

        {shouldMountColorSchemeDropdown &&
          createPortal(
            <div
              ref={colorSchemeDropdownRef}
              className={`fixed z-[999999] min-w-[200px] ${
                !isAnimatingColorSchemeDropdown && !isExitingColorSchemeDropdown ? 'opacity-0 -translate-y-4' : ''
              } ${isAnimatingColorSchemeDropdown ? 'animate-slide-down' : ''} ${
                isExitingColorSchemeDropdown ? 'animate-slide-out' : ''
              }`}
              style={{
                top: `${colorSchemeDropdownPosition.top}px`,
                right: `${colorSchemeDropdownPosition.right}px`,
              }}
            >
              <div className="glass-effect rounded-xl p-2 shadow-2xl border border-gray-200 dark:border-gray-700 backdrop-blur-lg bg-white/95 dark:bg-gray-800/95">
                <div className="flex flex-col gap-1">
                  {schemes.map(scheme => {
                    const SchemeIcon = scheme.icon
                    return (
                      <button
                        key={scheme.value}
                        onClick={() => handleSchemeSelect(scheme.value)}
                        className={`
                          flex items-center gap-2 px-3 py-2 rounded-lg text-sm font-medium
                          transition-colors duration-200
                          ${
                            colorScheme === scheme.value
                              ? 'bg-blue-600 text-white dark:bg-blue-500'
                              : 'hover:bg-gray-100 dark:hover:bg-gray-700 text-gray-700 dark:text-gray-300'
                          }
                        `}
                      >
                        <SchemeIcon className="w-4 h-4 flex-shrink-0" />
                        <span>{scheme.label}</span>
                        {colorScheme === scheme.value && <span className="ml-auto text-xs">✓</span>}
                      </button>
                    )
                  })}
                </div>
              </div>
            </div>,
            document.body
          )}
      </div>
    </>
  )
}

