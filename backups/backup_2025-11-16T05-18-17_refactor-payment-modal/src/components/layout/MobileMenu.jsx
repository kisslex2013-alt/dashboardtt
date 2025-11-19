import { useState, useEffect, useRef } from 'react'
import { X, Moon, Sun, Info, HelpCircle, GitCompare, Volume2, Smartphone } from 'lucide-react'

/**
 * Мобильное меню (hamburger menu) для Header
 *
 * Содержит дополнительные действия, которые скрыты на мобильных устройствах
 * Открывается по клику на hamburger кнопку
 */
export function MobileMenu({
  isOpen,
  onClose,
  theme,
  onToggleTheme,
  onShowTutorial,
  onShowAbout,
  onShowSoundSettings,
  onShowFloatingPanelSettings,
  compareMode,
  onToggleCompare,
  comparePeriod,
  onComparePeriodChange,
  periodOptions,
}) {
  // Три состояния для контроля анимаций (Three-State Animation Control)
  const [shouldMount, setShouldMount] = useState(false)
  const [isAnimating, setIsAnimating] = useState(false)
  const [isExiting, setIsExiting] = useState(false)
  const menuRef = useRef(null)

  // Логика открытия
  useEffect(() => {
    if (isOpen) {
      setShouldMount(true)
      setIsExiting(false)
      const rafId = requestAnimationFrame(() => {
        setIsAnimating(true)
      })
      return () => cancelAnimationFrame(rafId)
    }
  }, [isOpen])

  // Логика закрытия
  useEffect(() => {
    if (!isOpen && shouldMount && !isExiting) {
      setIsAnimating(false)
      const rafId = requestAnimationFrame(() => {
        setIsExiting(true)
      })
      return () => cancelAnimationFrame(rafId)
    }
  }, [isOpen, shouldMount, isExiting])

  // Слушатель окончания анимации исчезновения
  useEffect(() => {
    if (isExiting && menuRef.current) {
      const handleAnimationEnd = e => {
        if (
          e.animationName === 'slideDownOut' ||
          e.animationName === 'slideUpOut' ||
          e.animationName.includes('slideOut') ||
          e.animationName.includes('fadeOut')
        ) {
          setIsExiting(false)
          setShouldMount(false)
        }
      }

      const fallbackTimer = setTimeout(() => {
        setIsExiting(false)
        setShouldMount(false)
      }, 300)

      menuRef.current.addEventListener('animationend', handleAnimationEnd)

      return () => {
        clearTimeout(fallbackTimer)
        menuRef.current?.removeEventListener('animationend', handleAnimationEnd)
      }
    }
  }, [isExiting])

  // Закрытие при клике вне меню
  useEffect(() => {
    if (isOpen) {
      const handleClickOutside = event => {
        if (menuRef.current && !menuRef.current.contains(event.target)) {
          onClose()
        }
      }

      document.addEventListener('mousedown', handleClickOutside)
      return () => document.removeEventListener('mousedown', handleClickOutside)
    }
  }, [isOpen, onClose])

  // Блокировка скролла при открытом меню
  useEffect(() => {
    if (isOpen) {
      document.body.style.overflow = 'hidden'
    } else {
      document.body.style.overflow = ''
    }
    return () => {
      document.body.style.overflow = ''
    }
  }, [isOpen])

  if (!shouldMount) return null

  return (
    <>
      {/* Overlay */}
      <div
        className={`fixed inset-0 bg-black/50 backdrop-blur-sm z-[999998] ${
          !isAnimating && !isExiting ? 'opacity-0' : ''
        } ${isAnimating ? 'animate-fade-in' : ''} ${isExiting ? 'animate-fade-out' : ''}`}
        onClick={onClose}
        aria-hidden="true"
      />

      {/* Меню */}
      <div
        ref={menuRef}
        className={`fixed top-0 right-0 h-full w-80 max-w-[85vw] glass-effect shadow-2xl z-[999999] overflow-y-auto ${
          !isAnimating && !isExiting ? 'opacity-0 translate-x-full' : ''
        } ${isAnimating ? 'animate-slide-in-right' : ''} ${
          isExiting ? 'animate-slide-out-right' : ''
        }`}
        style={{
          animation: isAnimating
            ? 'slideInRight 0.3s ease-out forwards'
            : isExiting
              ? 'slideOutRight 0.3s ease-in forwards'
              : 'none',
        }}
      >
        <div className="p-6">
          {/* Заголовок меню */}
          <div className="flex items-center justify-between mb-6">
            <h2 className="text-xl font-bold text-gray-900 dark:text-white">Меню</h2>
            <button
              onClick={onClose}
              className="glass-button p-2 rounded-lg transition-normal hover-lift-scale click-shrink"
              aria-label="Закрыть меню"
              style={{ minWidth: '44px', minHeight: '44px' }}
            >
              <X className="w-5 h-5" />
            </button>
          </div>

          {/* Список действий */}
          <div className="space-y-2">
            {/* Тема */}
            <button
              onClick={() => {
                onToggleTheme()
                onClose()
              }}
              className="w-full glass-button px-4 py-3 rounded-lg flex items-center gap-3 text-left transition-normal hover-lift-scale click-shrink"
              style={{ minHeight: '44px' }}
            >
              {theme === 'light' ? (
                <Moon className="w-5 h-5 flex-shrink-0" />
              ) : (
                <Sun className="w-5 h-5 flex-shrink-0" />
              )}
              <span className="text-sm font-medium">
                {theme === 'light' ? 'Темная тема' : 'Светлая тема'}
              </span>
            </button>

            {/* Режим сравнения */}
            {onToggleCompare && (
              <button
                onClick={() => {
                  onToggleCompare()
                  onClose()
                }}
                className={`w-full glass-button px-4 py-3 rounded-lg flex items-center gap-3 text-left transition-normal hover-lift-scale click-shrink ${
                  compareMode ? 'bg-blue-500 text-white hover:bg-blue-600' : ''
                }`}
                style={{ minHeight: '44px' }}
              >
                <GitCompare className="w-5 h-5 flex-shrink-0" />
                <span className="text-sm font-medium">
                  {compareMode ? 'Отключить сравнение' : 'Включить сравнение'}
                </span>
              </button>
            )}

            {/* Звуки и анимация */}
            {onShowSoundSettings && (
              <button
                onClick={() => {
                  onShowSoundSettings()
                  onClose()
                }}
                className="w-full glass-button px-4 py-3 rounded-lg flex items-center gap-3 text-left transition-normal hover-lift-scale click-shrink"
                style={{ minHeight: '44px' }}
              >
                <Volume2 className="w-5 h-5 flex-shrink-0" />
                <span className="text-sm font-medium">Настройки звуков</span>
              </button>
            )}

            {/* Настройки плавающей панели */}
            {onShowFloatingPanelSettings && (
              <button
                onClick={() => {
                  onShowFloatingPanelSettings()
                  onClose()
                }}
                className="w-full glass-button px-4 py-3 rounded-lg flex items-center gap-3 text-left transition-normal hover-lift-scale click-shrink"
                style={{ minHeight: '44px' }}
              >
                <Smartphone className="w-5 h-5 flex-shrink-0" />
                <span className="text-sm font-medium">Плавающая панель</span>
              </button>
            )}

            {/* Tutorial */}
            {onShowTutorial && (
              <button
                onClick={() => {
                  onShowTutorial()
                  onClose()
                }}
                className="w-full glass-button px-4 py-3 rounded-lg flex items-center gap-3 text-left transition-normal hover-lift-scale click-shrink"
                style={{ minHeight: '44px' }}
              >
                <HelpCircle className="w-5 h-5 flex-shrink-0" />
                <span className="text-sm font-medium">Обучалка</span>
              </button>
            )}

            {/* О приложении */}
            {onShowAbout && (
              <button
                onClick={() => {
                  onShowAbout()
                  onClose()
                }}
                className="w-full glass-button px-4 py-3 rounded-lg flex items-center gap-3 text-left transition-normal hover-lift-scale click-shrink"
                style={{ minHeight: '44px' }}
              >
                <Info className="w-5 h-5 flex-shrink-0" />
                <span className="text-sm font-medium">О приложении</span>
              </button>
            )}
          </div>
        </div>
      </div>
    </>
  )
}
