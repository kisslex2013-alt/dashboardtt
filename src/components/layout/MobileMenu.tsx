import { useState, useEffect, useRef } from 'react'
import { createPortal } from 'react-dom'
import { X, Moon, Sun, Info, HelpCircle, GitCompare, Volume2, Database, Folder, Upload, Download, Sparkles } from '../../utils/icons'
import { User, LogIn } from 'lucide-react'
import { useUIStore } from '../../store/useUIStore'

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
  compareMode,
  onToggleCompare,
  comparePeriod,
  onComparePeriodChange,
  periodOptions,
  onOpenCategories,
  onOpenBackups,
  onExport,
  onImport,
}: any) {
  // Три состояния для контроля анимаций (Three-State Animation Control)
  const [shouldMount, setShouldMount] = useState(false)
  const [isAnimating, setIsAnimating] = useState(false)
  const [isExiting, setIsExiting] = useState(false)
  const menuRef = useRef<HTMLDivElement>(null)

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

  // Рендерим через portal, чтобы быть поверх всех элементов
  return createPortal(
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

          {/* === ГЛАВНЫЕ КНОПКИ (Аккаунт) === */}
          <div className="space-y-2 mb-4">
            <p className="text-xs text-gray-500 dark:text-gray-400 uppercase tracking-wider px-1 mb-2">Аккаунт</p>
            
            {/* Вход/регистрация */}
            <button
               onClick={() => {
                 const { openModal } = useUIStore.getState()
                 openModal('auth')
                 onClose()
               }}
               className="w-full glass-button px-4 py-3 rounded-lg flex items-center gap-3 text-left transition-normal hover-lift-scale click-shrink"
               style={{ minHeight: '44px' }}
            >
               <LogIn className="w-5 h-5 flex-shrink-0 text-blue-500" />
               <span className="text-sm font-medium">Вход / Регистрация</span>
            </button>

            {/* Аккаунт (бывшие Настройки) */}
            <button
               onClick={() => {
                 const { openModal } = useUIStore.getState()
                 openModal('soundSettings', { activeTab: 'account' })
                 onClose()
               }}
               className="w-full glass-button px-4 py-3 rounded-lg flex items-center gap-3 text-left transition-normal hover-lift-scale click-shrink"
               style={{ minHeight: '44px' }}
            >
               <User className="w-5 h-5 flex-shrink-0 text-indigo-500" />
               <span className="text-sm font-medium">Аккаунт</span>
            </button>
          </div>

          {/* Разделитель */}
          <div className="border-t border-gray-200 dark:border-gray-700 my-4"></div>

          {/* === ОСТАЛЬНЫЕ ДЕЙСТВИЯ === */}
          <div className="space-y-2">
            <p className="text-xs text-gray-500 dark:text-gray-400 uppercase tracking-wider px-1 mb-2">Действия</p>

            {/* Промо-страница */}
            <button
               onClick={() => {
                 // Добавляем анимацию fade-out
                 document.body.style.transition = 'opacity 0.5s ease-out'
                 document.body.style.opacity = '0'
                 // Переходим на промо-страницу после анимации
                 setTimeout(() => {
                   window.location.href = '/promo/time-tracker-promo-variant-3.html'
                 }, 500)
               }}
               className="w-full glass-button px-4 py-3 rounded-lg flex items-center gap-3 text-left transition-normal hover-lift-scale click-shrink"
               style={{ minHeight: '44px' }}
            >
               <Sparkles className="w-5 h-5 flex-shrink-0 text-amber-500" />
               <span className="text-sm font-medium">Промо-страница</span>
            </button>

            {/* AI-уведомления */}
            <button
               onClick={() => {
                 window.dispatchEvent(new CustomEvent('toggleAINotifications'))
                 onClose()
               }}
               className="w-full glass-button px-4 py-3 rounded-lg flex items-center gap-3 text-left transition-normal hover-lift-scale click-shrink"
               style={{ minHeight: '44px' }}
            >
               <Volume2 className="w-5 h-5 flex-shrink-0 text-purple-500" />
               <span className="text-sm font-medium">AI-уведомления</span>
            </button>

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
                  compareMode ? 'bg-blue-600 text-white hover:bg-blue-700' : ''
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

            {/* Управление бэкапами */}
            <button
              onClick={() => {
                if (onOpenBackups) {
                  onOpenBackups()
                }
                onClose()
              }}
              className="w-full glass-button px-4 py-3 rounded-lg flex items-center gap-3 text-left transition-normal hover-lift-scale click-shrink"
              style={{ minHeight: '44px' }}
            >
              <Database className="w-5 h-5 flex-shrink-0" />
              <span className="text-sm font-medium">Бэкапы</span>
            </button>

            {/* Управление категориями */}
            <button
              onClick={() => {
                if (onOpenCategories) {
                  onOpenCategories()
                }
                onClose()
              }}
              className="w-full glass-button px-4 py-3 rounded-lg flex items-center gap-3 text-left transition-normal hover-lift-scale click-shrink"
              style={{ minHeight: '44px' }}
            >
              <Folder className="w-5 h-5 flex-shrink-0" />
              <span className="text-sm font-medium">Категории</span>
            </button>

            {/* Экспорт */}
            <button
              onClick={() => {
                if (onExport) {
                  onExport()
                }
                onClose()
              }}
              className="w-full glass-button px-4 py-3 rounded-lg flex items-center gap-3 text-left transition-normal hover-lift-scale click-shrink"
              style={{ minHeight: '44px' }}
            >
              <Upload className="w-5 h-5 flex-shrink-0" />
              <span className="text-sm font-medium">Экспорт</span>
            </button>

            {/* Импорт */}
            <button
              onClick={() => {
                if (onImport) {
                  onImport()
                }
                onClose()
              }}
              className="w-full glass-button px-4 py-3 rounded-lg flex items-center gap-3 text-left transition-normal hover-lift-scale click-shrink"
              style={{ minHeight: '44px' }}
            >
              <Download className="w-5 h-5 flex-shrink-0" />
              <span className="text-sm font-medium">Импорт</span>
            </button>

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
    </>,
    document.body
  )
}
