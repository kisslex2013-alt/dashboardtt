import { useState, useRef, useEffect } from 'react'
import { GitCompare, ChevronDown } from '../../../../utils/icons'
import { useThreeStateAnimation } from '../hooks/useThreeStateAnimation'

const periodOptions = [
  { value: 'today', label: 'Сегодня' },
  { value: 'week', label: 'Неделя' },
  { value: 'month', label: 'Месяц' },
  { value: 'year', label: 'Год' },
]

/**
 * Компонент контролов сравнения периодов
 */
export function ComparisonControls({ compareMode, onToggleCompare, comparePeriod, onComparePeriodChange }) {
  const [isDropdownOpen, setIsDropdownOpen] = useState(false)
  const dropdownAnimation = useThreeStateAnimation(isDropdownOpen)
  const [dropdownPosition, setDropdownPosition] = useState({ top: 0, right: 0 })
  const dropdownButtonRef = useRef(null)
  const dropdownRef = useRef(null)

  // Вычисляем позицию для dropdown
  useEffect(() => {
    if (dropdownAnimation.shouldMount && dropdownButtonRef.current) {
      const updatePosition = () => {
        const rect = dropdownButtonRef.current.getBoundingClientRect()
        const viewportWidth = window.innerWidth
        const offset = 8
        const dropdownWidth = 160

        let right = viewportWidth - rect.right

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
      window.addEventListener('scroll', updatePosition, true)
      window.addEventListener('resize', updatePosition)

      return () => {
        window.removeEventListener('scroll', updatePosition, true)
        window.removeEventListener('resize', updatePosition)
      }
    }
  }, [dropdownAnimation.shouldMount])

  // Обработчик клика вне dropdown
  useEffect(() => {
    const handleClickOutside = event => {
      if (
        dropdownRef.current &&
        !dropdownRef.current.contains(event.target) &&
        dropdownButtonRef.current &&
        !dropdownButtonRef.current.contains(event.target)
      ) {
        setIsDropdownOpen(false)
      }
    }

    if (isDropdownOpen) {
      document.addEventListener('mousedown', handleClickOutside)
      return () => document.removeEventListener('mousedown', handleClickOutside)
    }
  }, [isDropdownOpen])

  const getPeriodLabel = () => {
    return periodOptions.find(opt => opt.value === comparePeriod)?.label || 'Месяц'
  }

  if (!onToggleCompare) {
    return null
  }

  return (
    <>
      {/* Выбор периода для сравнения (только если режим сравнения включен) */}
      {compareMode && (
        <div className="relative">
          <button
            ref={dropdownButtonRef}
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

          {dropdownAnimation.shouldMount && (
            <div
              ref={dropdownRef}
              className={`absolute right-0 mt-2 w-40 glass-effect rounded-lg shadow-lg z-50 py-1 ${
                !dropdownAnimation.isAnimating && !dropdownAnimation.isExiting
                  ? 'opacity-0 -translate-y-4'
                  : ''
              } ${dropdownAnimation.isAnimating ? 'animate-slide-down' : ''} ${
                dropdownAnimation.isExiting ? 'animate-slide-up-out' : ''
              }`}
            >
              {periodOptions.map(option => (
                <button
                  key={option.value}
                  onClick={() => {
                    onComparePeriodChange(option.value)
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

      {/* Режим сравнения */}
      <button
        aria-label="Режим сравнения"
        onClick={onToggleCompare}
        className={`glass-button p-2 rounded-lg transition-normal hover-lift-scale click-shrink ${
          compareMode
            ? 'bg-blue-500 text-white hover:bg-blue-600'
            : 'hover:bg-gray-100 dark:hover:bg-gray-700'
        }`}
        title={compareMode ? 'Отключить сравнение' : 'Включить сравнение с предыдущим периодом'}
        data-icon-id="header-compare"
      >
        <GitCompare className="w-5 h-5" />
      </button>
    </>
  )
}

