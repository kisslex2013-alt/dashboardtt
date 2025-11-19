import { useState, useEffect, useRef, useCallback } from 'react'
import { createPortal } from 'react-dom'
import {
  Moon,
  Sun,
  Info,
  HelpCircle,
  GitCompare,
  ChevronDown,
  Volume2,
  Smartphone,
  Menu,
  Sparkles,
  Play,
  Palette,
} from 'lucide-react'
import { useTheme, useSetTheme, useThemeTransitionType, useCategories, useColorScheme, useSetColorScheme } from '../../store/useSettingsStore'
import { useIsRunning } from '../../store/useTimerStore'
import { useTimer } from '../../hooks/useTimer'
import { getIcon } from '../../utils/iconHelper'
import { ThemeTransitionOverlay } from '../ui/ThemeTransitionOverlay'
import { useIsMobile } from '../../hooks/useIsMobile'
import { StatisticsDashboard } from '../statistics/StatisticsDashboard'
import { MobileMenu } from './MobileMenu'

/**
 * Шапка приложения с переключателем темы и быстрыми действиями
 * - Показывает название
 * - Переключает светлую/тёмную тему
 * - Экспорт/Импорт данных
 * - Открывает обучалку и окно "О приложении"
 * - Переключение режима сравнения периодов
 * - Отображает статистику с выбором периода
 *
 * АДАПТИВНОСТЬ: На мобильных устройствах использует hamburger menu для дополнительных действий
 */
export function Header({
  onShowTutorial,
  onShowAbout,
  onShowSoundSettings,
  onShowFloatingPanelSettings,
  compareMode,
  onToggleCompare,
}) {
  // ✅ ОПТИМИЗАЦИЯ: Используем атомарные селекторы для минимизации ре-рендеров
  const theme = useTheme()
  const setTheme = useSetTheme()
  const themeTransitionType = useThemeTransitionType()
  const colorScheme = useColorScheme()
  const setColorScheme = useSetColorScheme()
  const isMobile = useIsMobile()
  const themeButtonRef = useRef(null)
  const colorSchemeButtonRef = useRef(null)
  const [comparePeriod, setComparePeriod] = useState('month')
  const [isDropdownOpen, setIsDropdownOpen] = useState(false)
  const [isColorSchemeDropdownOpen, setIsColorSchemeDropdownOpen] = useState(false)
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false)
  // Три состояния для контроля анимаций (Three-State Animation Control)
  const [shouldMountDropdown, setShouldMountDropdown] = useState(false)
  const [isAnimatingDropdown, setIsAnimatingDropdown] = useState(false)
  const [isExitingDropdown, setIsExitingDropdown] = useState(false)
  const dropdownRef = useRef(null)
  // Состояния для выпадающего списка цветовых схем
  const [shouldMountColorSchemeDropdown, setShouldMountColorSchemeDropdown] = useState(false)
  const [isAnimatingColorSchemeDropdown, setIsAnimatingColorSchemeDropdown] = useState(false)
  const [isExitingColorSchemeDropdown, setIsExitingColorSchemeDropdown] = useState(false)
  const colorSchemeDropdownRef = useRef(null)
  
  // Quick Start Panel состояния
  const categories = useCategories()
  const isRunning = useIsRunning()
  const { start } = useTimer()
  const [isQuickStartOpen, setIsQuickStartOpen] = useState(false)
  const [shouldMountQuickStart, setShouldMountQuickStart] = useState(false)
  const [isAnimatingQuickStart, setIsAnimatingQuickStart] = useState(false)
  const [isExitingQuickStart, setIsExitingQuickStart] = useState(false)
  const quickStartRef = useRef(null)
  const quickStartButtonRef = useRef(null)

  // Логика открытия
  useEffect(() => {
    if (isDropdownOpen) {
      setShouldMountDropdown(true)
      setIsExitingDropdown(false)
      // Для обычных dropdown используем один RAF - двойной вызывает задваивание
      const rafId = requestAnimationFrame(() => {
        setIsAnimatingDropdown(true)
      })
      return () => cancelAnimationFrame(rafId)
    }
  }, [isDropdownOpen])

  // Логика закрытия
  useEffect(() => {
    if (!isDropdownOpen && shouldMountDropdown && !isExitingDropdown) {
      setIsAnimatingDropdown(false)
      // RAF для синхронизации перед началом exit анимации
      const rafId = requestAnimationFrame(() => {
        setIsExitingDropdown(true)
      })
      return () => cancelAnimationFrame(rafId)
    }
  }, [isDropdownOpen, shouldMountDropdown, isExitingDropdown])

  // Слушатель окончания анимации исчезновения
  useEffect(() => {
    if (isExitingDropdown && dropdownRef.current) {
      const handleAnimationEnd = e => {
        // Проверяем, что это именно наша exit анимация
        if (
          e.animationName === 'slideDownOut' ||
          e.animationName === 'slideUpOut' ||
          e.animationName.includes('slideOut')
        ) {
          setIsExitingDropdown(false)
          setShouldMountDropdown(false)
        }
      }

      // Fallback на случай, если событие не сработает
      const fallbackTimer = setTimeout(() => {
        setIsExitingDropdown(false)
        setShouldMountDropdown(false)
      }, 300) // Немного больше длительности анимации (200ms)

      dropdownRef.current.addEventListener('animationend', handleAnimationEnd)

      return () => {
        clearTimeout(fallbackTimer)
        dropdownRef.current?.removeEventListener('animationend', handleAnimationEnd)
      }
    }
  }, [isExitingDropdown])

  // Логика открытия выпадающего списка цветовых схем
  useEffect(() => {
    if (isColorSchemeDropdownOpen) {
      setShouldMountColorSchemeDropdown(true)
      setIsExitingColorSchemeDropdown(false)
      const rafId = requestAnimationFrame(() => {
        setIsAnimatingColorSchemeDropdown(true)
      })
      return () => cancelAnimationFrame(rafId)
    }
  }, [isColorSchemeDropdownOpen])

  // Логика закрытия выпадающего списка цветовых схем
  useEffect(() => {
    if (!isColorSchemeDropdownOpen && shouldMountColorSchemeDropdown && !isExitingColorSchemeDropdown) {
      setIsAnimatingColorSchemeDropdown(false)
      const rafId = requestAnimationFrame(() => {
        setIsExitingColorSchemeDropdown(true)
      })
      return () => cancelAnimationFrame(rafId)
    }
  }, [isColorSchemeDropdownOpen, shouldMountColorSchemeDropdown, isExitingColorSchemeDropdown])

  // Слушатель окончания анимации исчезновения выпадающего списка цветовых схем
  useEffect(() => {
    if (isExitingColorSchemeDropdown && colorSchemeDropdownRef.current) {
      const handleAnimationEnd = e => {
        if (
          e.animationName === 'slideDownOut' ||
          e.animationName === 'slideUpOut' ||
          e.animationName.includes('slideOut')
        ) {
          setIsExitingColorSchemeDropdown(false)
          setShouldMountColorSchemeDropdown(false)
        }
      }

      const fallbackTimer = setTimeout(() => {
        setIsExitingColorSchemeDropdown(false)
        setShouldMountColorSchemeDropdown(false)
      }, 300)

      colorSchemeDropdownRef.current.addEventListener('animationend', handleAnimationEnd)

      return () => {
        clearTimeout(fallbackTimer)
        colorSchemeDropdownRef.current?.removeEventListener('animationend', handleAnimationEnd)
      }
    }
  }, [isExitingColorSchemeDropdown])

  // Вычисляем позицию для выпадающего списка цветовых схем
  useEffect(() => {
    if (shouldMountColorSchemeDropdown && colorSchemeButtonRef.current) {
      const updatePosition = () => {
        const rect = colorSchemeButtonRef.current.getBoundingClientRect()
        const viewportWidth = window.innerWidth
        const offset = 8
        const dropdownWidth = 180

        let right = viewportWidth - rect.right

        if (right + dropdownWidth > viewportWidth) {
          right = Math.max(offset, viewportWidth - dropdownWidth - offset)
        }
        if (right < 0) {
          right = offset
        }

        setColorSchemeDropdownPosition({
          top: rect.bottom + offset,
          right,
        })
      }

      updatePosition()
      window.addEventListener('scroll', updatePosition, true)
      window.addEventListener('resize', updatePosition)

      return () => {
        window.removeEventListener('scroll', updatePosition, true)
        window.removeEventListener('resize', updatePosition)
      }
    }
  }, [shouldMountColorSchemeDropdown])

  // Обработчик клика вне выпадающего списка цветовых схем
  const handleClickOutsideColorScheme = useCallback(event => {
    if (
      colorSchemeDropdownRef.current &&
      !colorSchemeDropdownRef.current.contains(event.target) &&
      colorSchemeButtonRef.current &&
      !colorSchemeButtonRef.current.contains(event.target)
    ) {
      setIsColorSchemeDropdownOpen(false)
    }
  }, [])

  useEffect(() => {
    if (isColorSchemeDropdownOpen) {
      document.addEventListener('mousedown', handleClickOutsideColorScheme)
      return () => document.removeEventListener('mousedown', handleClickOutsideColorScheme)
    }
  }, [isColorSchemeDropdownOpen, handleClickOutsideColorScheme])

  // Логика открытия Quick Start dropdown
  useEffect(() => {
    if (isQuickStartOpen) {
      setShouldMountQuickStart(true)
      setIsExitingQuickStart(false)
      const rafId = requestAnimationFrame(() => {
        setIsAnimatingQuickStart(true)
      })
      return () => cancelAnimationFrame(rafId)
    }
  }, [isQuickStartOpen])

  // Логика закрытия Quick Start dropdown
  useEffect(() => {
    if (!isQuickStartOpen && shouldMountQuickStart && !isExitingQuickStart) {
      setIsAnimatingQuickStart(false)
      const rafId = requestAnimationFrame(() => {
        setIsExitingQuickStart(true)
      })
      return () => cancelAnimationFrame(rafId)
    }
  }, [isQuickStartOpen, shouldMountQuickStart, isExitingQuickStart])

  // Слушатель окончания анимации исчезновения Quick Start
  useEffect(() => {
    if (isExitingQuickStart && quickStartRef.current) {
      const handleAnimationEnd = e => {
        if (
          e.animationName === 'slideDownOut' ||
          e.animationName === 'slideUpOut' ||
          e.animationName.includes('slideOut')
        ) {
          setIsExitingQuickStart(false)
          setShouldMountQuickStart(false)
        }
      }

      const fallbackTimer = setTimeout(() => {
        setIsExitingQuickStart(false)
        setShouldMountQuickStart(false)
      }, 300)

      quickStartRef.current.addEventListener('animationend', handleAnimationEnd)

      return () => {
        clearTimeout(fallbackTimer)
        quickStartRef.current?.removeEventListener('animationend', handleAnimationEnd)
      }
    }
  }, [isExitingQuickStart])

  // Обработчик клика вне Quick Start dropdown
  const handleClickOutsideQuickStart = useCallback(event => {
    if (
      quickStartRef.current &&
      !quickStartRef.current.contains(event.target) &&
      quickStartButtonRef.current &&
      !quickStartButtonRef.current.contains(event.target)
    ) {
      setIsQuickStartOpen(false)
    }
  }, [])

  useEffect(() => {
    if (isQuickStartOpen) {
      document.addEventListener('mousedown', handleClickOutsideQuickStart)
      return () => document.removeEventListener('mousedown', handleClickOutsideQuickStart)
    }
  }, [isQuickStartOpen, handleClickOutsideQuickStart])

  const handleQuickStart = useCallback((categoryName) => {
    if (isRunning) {
      return
    }
    start(categoryName)
    setIsQuickStartOpen(false)
  }, [isRunning, start])

  // Вычисляем позицию для portal dropdown (как в CategorySelect)
  const [dropdownPosition, setDropdownPosition] = useState({ top: 0, right: 0 })
  const [colorSchemeDropdownPosition, setColorSchemeDropdownPosition] = useState({ top: 0, right: 0 })

  useEffect(() => {
    if (shouldMountQuickStart && quickStartButtonRef.current) {
      const updatePosition = () => {
        const rect = quickStartButtonRef.current.getBoundingClientRect()
        const viewportWidth = window.innerWidth
        const offset = 8 // 8px отступ (mt-2)
        const dropdownWidth = 200 // min-w-[200px]

        // Вычисляем позицию справа
        let right = viewportWidth - rect.right

        // Корректируем по горизонтали (если dropdown выходит за экран)
        if (right + dropdownWidth > viewportWidth) {
          right = Math.max(offset, viewportWidth - dropdownWidth - offset)
        }
        if (right < 0) {
          right = offset
        }

        setDropdownPosition({
          top: rect.bottom + offset,
          right,
        })
      }

      updatePosition()
      // Обновляем позицию при скролле и ресайзе
      window.addEventListener('scroll', updatePosition, true)
      window.addEventListener('resize', updatePosition)

      return () => {
        window.removeEventListener('scroll', updatePosition, true)
        window.removeEventListener('resize', updatePosition)
      }
    }
  }, [shouldMountQuickStart])

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
  }, [theme, setTheme, themeTransitionType])

  // Получаем длительность анимации
  const getTransitionDuration = useCallback((type) => {
    const durations = {
      circle: 600,
      fade: 400,
      wipe: 500,
      blur: 500,
      rotate: 600,
    }
    return durations[type] || 400
  }, [])

  const periodOptions = [
    { value: 'today', label: 'Сегодня' },
    { value: 'week', label: 'Неделя' },
    { value: 'month', label: 'Месяц' },
    { value: 'year', label: 'Год' },
  ]

  const getPeriodLabel = () => {
    return periodOptions.find(opt => opt.value === comparePeriod)?.label || 'Месяц'
  }

  return (
    <>
      <ThemeTransitionOverlay transitionType={themeTransitionType} currentTheme={theme} triggerElement={themeButtonRef.current} />
      <header className="glass-effect rounded-xl p-4 sm:p-6 mb-0 relative z-10">
        {/* Верхняя строка с названием и кнопками */}
        <div className="flex items-center justify-between mb-4 sm:mb-6">
          <div className="flex items-center gap-2 sm:gap-4 flex-1 min-w-0">
            {/* Логотип приложения с анимацией Data Pulse */}
            <div className="flex-shrink-0 logo-wrapper logo-animation-1">
              <svg
                viewBox="0 0 200 200"
                xmlns="http://www.w3.org/2000/svg"
                className="w-8 h-8 sm:w-12 sm:h-12 object-contain logo-data-pulse"
                aria-label="Time Tracker Logo"
              >
                <defs>
                  <linearGradient id="grad4-v1" x1="0%" y1="0%" x2="100%" y2="0%">
                    <stop offset="0%" style={{ stopColor: '#3B82F6', stopOpacity: 1 }} />
                    <stop offset="50%" style={{ stopColor: '#10B981', stopOpacity: 1 }} />
                    <stop offset="100%" style={{ stopColor: '#F59E0B', stopOpacity: 1 }} />
                  </linearGradient>
                </defs>
                {/* Концентрические круги - пульсируют */}
                <circle
                  className="circle-1"
                  cx="100"
                  cy="100"
                  r="90"
                  fill="none"
                  stroke="#3B82F6"
                  strokeWidth="2"
                  opacity="0.2"
                >
                  <animate attributeName="r" values="90;100;90" dur="2s" repeatCount="indefinite" />
                  <animate
                    attributeName="opacity"
                    values="0.2;0.4;0.2"
                    dur="2s"
                    repeatCount="indefinite"
                  />
                </circle>
                <circle
                  className="circle-2"
                  cx="100"
                  cy="100"
                  r="75"
                  fill="none"
                  stroke="#10B981"
                  strokeWidth="2"
                  opacity="0.3"
                >
                  <animate
                    attributeName="r"
                    values="75;85;75"
                    dur="2.2s"
                    repeatCount="indefinite"
                  />
                  <animate
                    attributeName="opacity"
                    values="0.3;0.5;0.3"
                    dur="2.2s"
                    repeatCount="indefinite"
                  />
                </circle>
                <circle
                  className="circle-3"
                  cx="100"
                  cy="100"
                  r="60"
                  fill="none"
                  stroke="#F59E0B"
                  strokeWidth="2"
                  opacity="0.4"
                >
                  <animate
                    attributeName="r"
                    values="60;70;60"
                    dur="2.4s"
                    repeatCount="indefinite"
                  />
                  <animate
                    attributeName="opacity"
                    values="0.4;0.6;0.4"
                    dur="2.4s"
                    repeatCount="indefinite"
                  />
                </circle>
                <circle
                  className="circle-4"
                  cx="100"
                  cy="100"
                  r="45"
                  fill="url(#grad4-v1)"
                  opacity="0.2"
                >
                  <animate
                    attributeName="r"
                    values="45;55;45"
                    dur="2.6s"
                    repeatCount="indefinite"
                  />
                  <animate
                    attributeName="opacity"
                    values="0.2;0.4;0.2"
                    dur="2.6s"
                    repeatCount="indefinite"
                  />
                </circle>
                {/* Пульс (волна данных) - анимация как в реальном ECG */}
                <path
                  className="pulse-path"
                  d="M 30 100 L 50 100 L 60 70 L 70 130 L 80 100 L 100 100 L 110 85 L 120 115 L 130 100 L 150 100 L 170 100"
                  fill="none"
                  stroke="url(#grad4-v1)"
                  strokeWidth="4"
                  strokeLinecap="round"
                >
                  <animate
                    attributeName="d"
                    values="M 30 100 L 50 100 L 60 70 L 70 130 L 80 100 L 100 100 L 110 85 L 120 115 L 130 100 L 150 100 L 170 100;M 30 100 L 50 100 L 60 65 L 70 135 L 80 100 L 100 100 L 110 80 L 120 120 L 130 100 L 150 100 L 170 100;M 30 100 L 50 100 L 60 60 L 70 140 L 80 100 L 100 100 L 110 75 L 120 125 L 130 100 L 150 100 L 170 100;M 30 100 L 50 100 L 60 65 L 70 135 L 80 100 L 100 100 L 110 80 L 120 120 L 130 100 L 150 100 L 170 100;M 30 100 L 50 100 L 60 70 L 70 130 L 80 100 L 100 100 L 110 85 L 120 115 L 130 100 L 150 100 L 170 100"
                    dur="1.2s"
                    repeatCount="indefinite"
                    calcMode="spline"
                    keySplines="0.4 0 0.2 1; 0.4 0 0.2 1; 0.4 0 0.2 1; 0.4 0 0.2 1"
                  />
                </path>
                {/* Точки на пульсе - вращаются по циферблату с разной скоростью */}
                <g className="pulse-dot-group-1" transform="translate(100, 100)">
                  <circle className="pulse-dot" cx="0" cy="-35" r="4" fill="#3B82F6" />
                </g>
                <g className="pulse-dot-group-2" transform="translate(100, 100)">
                  <circle className="pulse-dot" cx="0" cy="-30" r="4" fill="#10B981" />
                </g>
                <g className="pulse-dot-group-3" transform="translate(100, 100)">
                  <circle className="pulse-dot" cx="0" cy="-25" r="4" fill="#F59E0B" />
                </g>
                <g className="pulse-dot-group-4" transform="translate(100, 100)">
                  <circle className="pulse-dot" cx="0" cy="-20" r="4" fill="#10B981" />
                </g>
                {/* Стрелки часов - часовая и минутная */}
                <circle
                  className="center-circle"
                  cx="100"
                  cy="100"
                  r="15"
                  fill="none"
                  stroke="#3B82F6"
                  strokeWidth="3"
                />
                <g transform="translate(100, 100)">
                  {/* Часовая стрелка - толще, короче, медленнее */}
                  <g className="hour-hand">
                    <line
                      x1="0"
                      y1="0"
                      x2="0"
                      y2="-25"
                      stroke="#3B82F6"
                      strokeWidth="4"
                      strokeLinecap="round"
                    />
                  </g>
                  {/* Минутная стрелка - тоньше, длиннее, быстрее */}
                  <g className="minute-hand">
                    <line
                      x1="0"
                      y1="0"
                      x2="0"
                      y2="-40"
                      stroke="#10B981"
                      strokeWidth="2.5"
                      strokeLinecap="round"
                    />
                  </g>
                </g>
                <circle className="center-dot" cx="100" cy="100" r="3" fill="#F59E0B" />
              </svg>
            </div>
            {/* Блок с текстом с анимацией при наведении */}
            <div className="transition-all duration-300 hover:translate-x-1 hover:scale-[1.02] cursor-default min-w-0 flex-1">
              <div className="flex items-center gap-2 sm:gap-3">
                <h1 className="text-lg sm:text-2xl font-bold transition-all duration-300 hover:text-blue-600 dark:hover:text-blue-400 truncate">
                  {isMobile ? 'Time Tracker' : 'Time Tracker Dashboard'}
                </h1>
                {/* Кнопка промо-страницы */}
                <button
                  onClick={() => {
                    // Добавляем анимацию fade-out
                    document.body.style.transition = 'opacity 0.5s ease-out'
                    document.body.style.opacity = '0'

                    // Переходим на промо-страницу после анимации
                    setTimeout(() => {
                      window.location.href = '/promo/time-tracker-promo-variant-2.html'
                    }, 500)
                  }}
                  className="glass-button p-1.5 sm:p-2 rounded-lg transition-normal hover-lift-scale click-shrink touch-manipulation"
                  style={{
                    minWidth: isMobile ? '36px' : 'auto',
                    minHeight: isMobile ? '36px' : 'auto',
                  }}
                  title="Открыть промо-страницу"
                  aria-label="Открыть промо-страницу"
                  data-icon-id="header-promo"
                >
                  <Sparkles className={isMobile ? 'w-4 h-4' : 'w-5 h-5'} />
                </button>
              </div>
              {!isMobile && (
                <p className="text-xs sm:text-sm text-gray-500 dark:text-gray-400 transition-all duration-300 hover:text-gray-700 dark:hover:text-gray-300">
                  Умный учет рабочего времени
                </p>
              )}
            </div>
          </div>

          {/* Кнопки действий */}
          <div className="flex gap-2 items-center flex-shrink-0">
            {/* Мобильное меню (hamburger) - только на мобильных */}
            {isMobile ? (
              <button
                onClick={() => setIsMobileMenuOpen(true)}
                className="glass-button p-2 rounded-lg transition-normal hover-lift-scale click-shrink"
                aria-label="Открыть меню"
                style={{ minWidth: '44px', minHeight: '44px' }}
                data-icon-id="header-mobile-menu"
              >
                <Menu className="w-5 h-5" />
              </button>
            ) : (
              <>
                {/* Выбор периода для сравнения (только если режим сравнения включен) - только на десктопе */}
                {compareMode && (
                  <div className="relative">
                    <button
                      onClick={() => setIsDropdownOpen(!isDropdownOpen)}
                      className="glass-button px-3 py-2 rounded-lg flex items-center gap-2 text-sm font-medium transition-normal hover-lift-scale click-shrink"
                      title="Выбрать период для сравнения"
                      data-icon-id="header-compare-period"
                    >
                      <span>Период: {getPeriodLabel()}</span>
                      <ChevronDown
                        className={`w-4 h-4 transition-transform duration-200 ${isDropdownOpen ? 'rotate-180' : ''}`}
                      />
                    </button>

                    {shouldMountDropdown && (
                      <div
                        ref={dropdownRef}
                        className={`absolute right-0 mt-2 w-40 glass-effect rounded-lg shadow-lg z-50 py-1 ${
                          !isAnimatingDropdown && !isExitingDropdown
                            ? 'opacity-0 -translate-y-4'
                            : ''
                        } ${isAnimatingDropdown ? 'animate-slide-down' : ''} ${
                          isExitingDropdown ? 'animate-slide-up-out' : ''
                        }`}
                      >
                        {periodOptions.map(option => (
                          <button
                            key={option.value}
                            onClick={() => {
                              setComparePeriod(option.value)
                              setIsDropdownOpen(false)
                            }}
                            className={`w-full text-left px-4 py-2 text-sm hover:bg-gray-100 dark:hover:bg-gray-700 transition-colors ${
                              comparePeriod === option.value
                                ? 'bg-blue-50 dark:bg-blue-900/20 text-blue-600 dark:text-blue-400 font-medium'
                                : ''
                            }`}
                          >
                            {option.label}
                          </button>
                        ))}
                      </div>
                    )}
                  </div>
                )}

                {/* Quick Start - быстрый запуск таймера */}
                <div className="relative">
                  <button
                    ref={quickStartButtonRef}
                    aria-label="Быстрый старт таймера"
                    onClick={() => setIsQuickStartOpen(!isQuickStartOpen)}
                    disabled={isRunning}
                    className={`glass-button p-2 rounded-lg transition-normal hover-lift-scale click-shrink ${
                      isRunning
                        ? 'opacity-50 cursor-not-allowed'
                        : 'hover:bg-gray-100 dark:hover:bg-gray-700'
                    } ${isQuickStartOpen ? 'bg-blue-500 text-white hover:bg-blue-600' : ''}`}
                    title={isRunning ? 'Таймер уже запущен' : 'Быстрый запуск таймера'}
                    data-icon-id="header-quick-start"
                  >
                    <Play className="w-5 h-5" />
                  </button>

                  {/* Выпадающий список категорий - используем Portal для рендеринга вне DOM-дерева Header */}
                  {shouldMountQuickStart &&
                    createPortal(
                      <div
                        ref={quickStartRef}
                        className={`fixed z-[999999] min-w-[200px] ${
                          !isAnimatingQuickStart && !isExitingQuickStart ? 'opacity-0 -translate-y-4' : ''
                        } ${isAnimatingQuickStart ? 'animate-slide-down' : ''} ${
                          isExitingQuickStart ? 'animate-slide-out' : ''
                        }`}
                        style={{
                          top: `${dropdownPosition.top}px`,
                          right: `${dropdownPosition.right}px`,
                        }}
                      >
                        <div className="glass-effect rounded-xl p-2 shadow-2xl border border-gray-200 dark:border-gray-700 backdrop-blur-lg bg-white/95 dark:bg-gray-800/95">
                          <div className="flex flex-col gap-1 max-h-[400px] overflow-y-auto">
                            {categories.map((category) => {
                              const IconComponent = getIcon(category.icon)
                              return (
                                <button
                                  key={category.id}
                                  onClick={() => handleQuickStart(category.name)}
                                  disabled={isRunning}
                                  className={`
                                    flex items-center gap-2 px-3 py-2 rounded-lg text-sm font-medium
                                    transition-all duration-200 text-left
                                    bg-gray-100 dark:bg-gray-700 hover:bg-gray-200 dark:hover:bg-gray-600
                                    text-gray-900 dark:text-white
                                    ${isRunning
                                      ? 'opacity-50 cursor-not-allowed'
                                      : 'hover:scale-[1.02] active:scale-[0.98]'
                                    }
                                  `}
                                >
                                  {IconComponent && (
                                    <IconComponent 
                                      className="w-4 h-4 flex-shrink-0" 
                                      style={{ color: category.color || '#6366F1' }}
                                    />
                                  )}
                                  <span className="truncate">{category.name}</span>
                                </button>
                              )
                            })}
                          </div>
                        </div>
                      </div>,
                      document.body
                    )}
                </div>

                {/* Режим сравнения - только на десктопе */}
                {onToggleCompare && (
                  <button
                    aria-label="Режим сравнения"
                    onClick={onToggleCompare}
                    className={`glass-button p-2 rounded-lg transition-normal hover-lift-scale click-shrink ${
                      compareMode
                        ? 'bg-blue-500 text-white hover:bg-blue-600'
                        : 'hover:bg-gray-100 dark:hover:bg-gray-700'
                    }`}
                    title={
                      compareMode
                        ? 'Отключить сравнение'
                        : 'Включить сравнение с предыдущим периодом'
                    }
                    data-icon-id="header-compare"
                  >
                    <GitCompare className="w-5 h-5" />
                  </button>
                )}

                {/* Цветовая схема - скрыта, используется только "По умолчанию" */}
                {/* Кнопка скрыта по запросу пользователя */}
                {/* <div className="relative">
                <button
                  ref={colorSchemeButtonRef}
                    aria-label="Выбрать цветовую схему"
                    onClick={() => setIsColorSchemeDropdownOpen(!isColorSchemeDropdownOpen)}
                    className="glass-button p-2 rounded-lg transition-normal hover-lift-scale click-shrink"
                    title={`Цветовая схема: ${colorScheme === 'default' ? 'По умолчанию' : colorScheme === 'claymorphism' ? 'Claymorphism' : colorScheme === 'soft-pop' ? 'Soft Pop' : 'Авто'}`}
                    data-icon-id="header-color-scheme"
                  >
                    {colorScheme === 'claymorphism' ? (
                      <Palette className="w-5 h-5" />
                    ) : colorScheme === 'soft-pop' ? (
                      <Sparkles className="w-5 h-5" />
                    ) : colorScheme === 'auto' ? (
                      <Sparkles className="w-5 h-5 opacity-50" />
                    ) : (
                      <Palette className="w-5 h-5 opacity-50" />
                    )}
                  </button>

                  {shouldMountColorSchemeDropdown &&
                    createPortal(
                      <div
                        ref={colorSchemeDropdownRef}
                        className={`fixed z-[999999] min-w-[180px] ${
                          !isAnimatingColorSchemeDropdown && !isExitingColorSchemeDropdown
                            ? 'opacity-0 -translate-y-4'
                            : ''
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
                            {[
                              { value: 'default', label: 'По умолчанию', icon: Palette },
                              { value: 'claymorphism', label: 'Claymorphism', icon: Palette },
                              { value: 'soft-pop', label: 'Soft Pop', icon: Sparkles },
                              { value: 'auto', label: 'Авто', icon: Sparkles },
                            ].map(scheme => {
                              const IconComponent = scheme.icon
                              return (
                                <button
                                  key={scheme.value}
                  onClick={() => {
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
                          const duration = getTransitionDuration(themeTransitionType)
                          setTimeout(() => {
                                            setColorScheme(scheme.value)
                                            setIsColorSchemeDropdownOpen(false)
                            setTimeout(() => {
                              overlay.classList.add('complete')
                              setTimeout(() => overlay.remove(), 100)
                            }, duration / 2)
                          }, duration / 2)
                        })
                      })
                    } else {
                                      setColorScheme(scheme.value)
                                      setIsColorSchemeDropdownOpen(false)
                    }
                  }}
                                  className={`
                                    flex items-center gap-2 px-3 py-2 rounded-lg text-sm font-medium
                                    transition-all duration-200 text-left
                                    ${
                                      colorScheme === scheme.value
                                        ? 'bg-blue-500 text-white hover:bg-blue-600'
                                        : 'bg-gray-100 dark:bg-gray-700 hover:bg-gray-200 dark:hover:bg-gray-600 text-gray-900 dark:text-white'
                                    }
                                    hover:scale-[1.02] active:scale-[0.98]
                                  `}
                                >
                                  <IconComponent className="w-4 h-4 flex-shrink-0" />
                                  <span>{scheme.label}</span>
                                  {colorScheme === scheme.value && (
                                    <span className="ml-auto text-xs">✓</span>
                  )}
                </button>
                              )
                            })}
                          </div>
                        </div>
                      </div>,
                      document.body
                    )}
                </div> */}

                {/* Тема - всегда видна */}
                <button
                  ref={themeButtonRef}
                  aria-label="Переключить тему"
                  onClick={toggleTheme}
                  className="glass-button p-2 rounded-lg transition-normal hover-lift-scale click-shrink"
                  data-icon-id={theme === 'light' ? 'header-theme-light' : 'header-theme-dark'}
                >
                  {theme === 'light' ? <Moon className="w-5 h-5" /> : <Sun className="w-5 h-5" />}
                </button>

                {/* Звуки и анимация - только на десктопе */}
                {onShowSoundSettings && (
                  <button
                    aria-label="Настройки звуков и анимации"
                    onClick={onShowSoundSettings}
                    className="glass-button p-2 rounded-lg transition-normal hover-lift-scale click-shrink"
                    title="Настройки звуков и анимации"
                    data-icon-id="header-sound-settings"
                  >
                    <Volume2 className="w-5 h-5" />
                  </button>
                )}

                {/* Настройки плавающей панели - только на десктопе */}
                {onShowFloatingPanelSettings && (
                  <button
                    aria-label="Настройки плавающей панели"
                    onClick={onShowFloatingPanelSettings}
                    className="glass-button p-2 rounded-lg transition-normal hover-lift-scale click-shrink"
                    title="Настройки плавающей панели таймера"
                    data-icon-id="header-floating-panel-settings"
                  >
                    <Smartphone className="w-5 h-5" />
                  </button>
                )}

                {/* Tutorial и About - только на десктопе */}
                <button
                  aria-label="Открыть обучалку"
                  onClick={onShowTutorial}
                  className="glass-button p-2 rounded-lg transition-normal hover-lift-scale click-shrink"
                  data-icon-id="header-tutorial"
                >
                  <HelpCircle className="w-5 h-5" />
                </button>

                <button
                  aria-label="О приложении"
                  onClick={onShowAbout}
                  className="glass-button p-2 rounded-lg transition-normal hover-lift-scale click-shrink"
                  data-icon-id="header-about"
                >
                  <Info className="w-5 h-5" />
                </button>
              </>
            )}
          </div>
        </div>

        {/* Статистика */}
        <StatisticsDashboard compareMode={compareMode} periodFilter={comparePeriod} />
      </header>

      {/* Мобильное меню */}
      {isMobile && (
        <MobileMenu
          isOpen={isMobileMenuOpen}
          onClose={() => setIsMobileMenuOpen(false)}
          theme={theme}
          onToggleTheme={toggleTheme}
          onShowTutorial={onShowTutorial}
          onShowAbout={onShowAbout}
          onShowSoundSettings={onShowSoundSettings}
          onShowFloatingPanelSettings={onShowFloatingPanelSettings}
          compareMode={compareMode}
          onToggleCompare={onToggleCompare}
          comparePeriod={comparePeriod}
          onComparePeriodChange={setComparePeriod}
          periodOptions={periodOptions}
        />
      )}
    </>
  )
}
