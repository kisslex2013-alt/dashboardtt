import { useState, useRef, useEffect, useCallback, memo } from 'react'
import { Settings, ChevronDown, Check } from 'lucide-react'
import { useIsMobile } from '../../hooks/useIsMobile'

interface ChartOption {
  key: string
  label: string
  visible: boolean
}

interface ChartVisibilityDropdownProps {
  options: ChartOption[]
  onToggle: (key: string) => void
  buttonLabel?: string
}

/**
 * Выпадающий список для управления видимостью графиков/виджетов
 * Переиспользуемый компонент для всех секций аналитики
 */
export const ChartVisibilityDropdown = memo(({ 
  options, 
  onToggle,
  buttonLabel = 'Блоки'
}: ChartVisibilityDropdownProps) => {
  const isMobile = useIsMobile()
  const [isOpen, setIsOpen] = useState(false)
  const [shouldMount, setShouldMount] = useState(false)
  const [isAnimating, setIsAnimating] = useState(false)
  const [isExiting, setIsExiting] = useState(false)
  const menuRef = useRef<HTMLDivElement>(null)
  const buttonRef = useRef<HTMLButtonElement>(null)

  // Open logic
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

  // Close logic
  useEffect(() => {
    if (!isOpen && shouldMount && !isExiting && isAnimating) {
      setIsAnimating(false)
      const rafId = requestAnimationFrame(() => {
        setIsExiting(true)
      })
      return () => cancelAnimationFrame(rafId)
    }
  }, [isOpen, shouldMount, isExiting, isAnimating])

  // Animation end listener
  useEffect(() => {
    if (isExiting && menuRef.current) {
      const fallbackTimer = setTimeout(() => {
        if (isExiting) {
          setIsExiting(false)
          setShouldMount(false)
        }
      }, 300)
      return () => clearTimeout(fallbackTimer)
    }
  }, [isExiting])

  // Click outside handler
  const handleClickOutside = useCallback((event: MouseEvent) => {
    if (
      menuRef.current &&
      !menuRef.current.contains(event.target as Node) &&
      buttonRef.current &&
      !buttonRef.current.contains(event.target as Node)
    ) {
      setIsOpen(false)
    }
  }, [])

  useEffect(() => {
    document.addEventListener('mousedown', handleClickOutside)
    return () => document.removeEventListener('mousedown', handleClickOutside)
  }, [handleClickOutside])

  const handleToggle = useCallback(() => setIsOpen(prev => !prev), [])

  const visibleCount = options.filter(o => o.visible).length

  return (
    <div className="relative">
      <button
        ref={buttonRef}
        onClick={handleToggle}
        className={`glass-effect ${isMobile ? 'px-2 py-1 pr-6 text-xs min-w-[80px]' : 'px-3 py-1.5 pr-8 text-sm min-w-[120px]'} rounded-lg border border-gray-300 dark:border-gray-600 focus:outline-none focus:ring-2 focus:ring-blue-500 font-medium text-left transition-normal hover-lift-scale click-shrink touch-manipulation`}
        style={isMobile ? { minHeight: '32px' } : {}}
        title="Управление видимостью блоков"
        aria-expanded={isOpen}
        aria-haspopup="true"
      >
        <span className="flex items-center gap-1.5">
          <Settings className={isMobile ? 'w-3.5 h-3.5' : 'w-4 h-4'} />
          {!isMobile && <span>{buttonLabel}</span>}
          <span className={`text-xs ${visibleCount === options.length ? 'text-green-500' : 'text-gray-400'}`}>
            ({visibleCount}/{options.length})
          </span>
        </span>
        <ChevronDown
          className={`absolute ${isMobile ? 'right-1.5' : 'right-2'} top-1/2 -translate-y-1/2 ${isMobile ? 'w-3 h-3' : 'w-4 h-4'} text-gray-500 transition-transform duration-200 ${isOpen ? 'rotate-180' : ''}`}
        />
      </button>

      {shouldMount && (
        <div
          ref={menuRef}
          className={`absolute right-0 mt-2 w-56 glass-effect rounded-lg border border-gray-300 dark:border-gray-600 shadow-xl z-[9999] backdrop-blur-lg bg-white/95 dark:bg-gray-800/95 ${
            !isAnimating && !isExiting ? 'opacity-0 -translate-y-4' : ''
          } ${isAnimating ? 'animate-slide-down' : ''} ${
            isExiting ? 'animate-slide-up-out' : ''
          }`}
          style={{
            maxHeight: 'calc(100vh - 100px)',
            overflowY: 'auto',
          }}
        >
          {options.map((option) => (
            <div
              key={option.key}
              onClick={() => onToggle(option.key)}
              className={`flex items-center justify-between px-3 py-2 hover:bg-gray-100 dark:hover:bg-gray-700 border-b border-gray-200 dark:border-gray-700 last:border-b-0 cursor-pointer ${
                option.visible ? 'bg-blue-50/50 dark:bg-blue-900/10' : ''
              }`}
            >
              <span className={`text-sm ${option.visible ? 'text-gray-900 dark:text-white' : 'text-gray-500 dark:text-gray-400'}`}>
                {option.label}
              </span>
              <div className={`w-5 h-5 rounded flex items-center justify-center transition-colors ${
                option.visible 
                  ? 'bg-blue-500 text-white' 
                  : 'bg-gray-200 dark:bg-gray-700'
              }`}>
                {option.visible && <Check className="w-3.5 h-3.5" />}
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  )
})

ChartVisibilityDropdown.displayName = 'ChartVisibilityDropdown'
