import { useState, useRef, useEffect, useCallback, memo, useMemo } from 'react'
import { ChevronDown, ChevronUp, TrendingUp } from '../../utils/icons'
import { PlanFactCompactView } from './PlanFactCompactView'
import { InsightsPanel } from './InsightsPanel'
import { useEntries } from '../../store/useEntriesStore'
import { useDailyGoal } from '../../store/useSettingsStore'
import {
  calculateProductivityScore,
  getScoreColor,
  getFactorProgressColor,
  getFactorTextColor,
} from '../../utils/productivityScore'
import { SimpleTooltip } from '../ui/SimpleTooltip'
import { AnimatedCounter } from '../ui/AnimatedCounter'

/**
 * Объединенный виджет статистики и инсайтов
 * - Содержит "План/факт заработка" и "Инсайты"
 * - Сворачиваемая секция (по умолчанию свернута)
 * - Sticky при раскрытии
 * - Анимация раскрытия и сворачивания
 */
export const StatisticsOverview = memo(() => {
  const [isExpanded, setIsExpanded] = useState(false) // По умолчанию свернуто
  const headerRef = useRef(null)
  const contentRef = useRef(null)
  
  // Данные для Productivity Score
  const entries = useEntries()
  const dailyGoal = useDailyGoal()
  
  const scoreData = useMemo(() => {
    if (entries.length === 0) {
      return {
        score: 0,
        factors: {
          goalCompletion: { value: 0, max: 40, percentage: 0 },
          consistency: { value: 0, max: 25, percentage: 0 },
          focusTime: { value: 0, max: 20, percentage: 0 },
          breakBalance: { value: 0, max: 15, percentage: 0 },
        },
      }
    }
    return calculateProductivityScore(entries, dailyGoal)
  }, [entries, dailyGoal])
  
  const { score, factors } = scoreData
  const scoreColor = getScoreColor(score)
  
  // Сокращенные названия факторов
  const factorShortLabels = {
    goalCompletion: 'Цели',
    consistency: 'Регулярность',
    focusTime: 'Фокус',
    breakBalance: 'Перерывы',
  }
  
  const factorDescriptions = {
    goalCompletion:
      'Выполнение дневных целей по заработку. Оценивается средний процент выполнения цели за все дни с записями. Максимум 40 баллов.',
    consistency:
      'Регулярность работы. Оценивается процент дней с записями из возможных (за последние 30 дней). Максимум 25 баллов.',
    focusTime:
      'Время фокуса. Оценивается доля самой длинной непрерывной сессии от общего времени работы за день. Максимум 20 баллов.',
    breakBalance:
      'Баланс перерывов. Оценивается оптимальность перерывов между сессиями (5-30 минут - идеально). Максимум 15 баллов.',
  }

  // Три состояния для контроля анимаций (Three-State Animation Control)
  const [shouldMountContent, setShouldMountContent] = useState(false)
  const [isAnimatingContent, setIsAnimatingContent] = useState(false)
  const [isExitingContent, setIsExitingContent] = useState(false)

  // ✅ ОПТИМИЗАЦИЯ: Мемоизация обработчика переключения (вынесен на верхний уровень)
  const handleToggleExpanded = useCallback(() => setIsExpanded(prev => !prev), [])

  // Логика открытия
  useEffect(() => {
    if (isExpanded) {
      setShouldMountContent(true)
      setIsExitingContent(false)
      const rafId = requestAnimationFrame(() => {
        setIsAnimatingContent(true)
      })
      return () => cancelAnimationFrame(rafId)
    }
  }, [isExpanded])

  // Логика закрытия
  useEffect(() => {
    if (!isExpanded && shouldMountContent && !isExitingContent) {
      setIsAnimatingContent(false)
      const rafId = requestAnimationFrame(() => {
        setIsExitingContent(true)
      })
      return () => cancelAnimationFrame(rafId)
    }
  }, [isExpanded, shouldMountContent, isExitingContent])

  // Слушатель окончания анимации исчезновения
  useEffect(() => {
    if (isExitingContent && contentRef.current) {
      const handleAnimationEnd = e => {
        if (
          e.animationName === 'slideDownOut' ||
          e.animationName.includes('slideOut') ||
          e.animationName === 'fadeOut'
        ) {
          setIsExitingContent(false)
          setShouldMountContent(false)
        }
      }

      const fallbackTimer = setTimeout(() => {
        setIsExitingContent(false)
        setShouldMountContent(false)
      }, 300)

      contentRef.current.addEventListener('animationend', handleAnimationEnd)

      return () => {
        clearTimeout(fallbackTimer)
        contentRef.current?.removeEventListener('animationend', handleAnimationEnd)
      }
    }
  }, [isExitingContent])

  return (
    <div className="mb-6 relative z-10 -mt-6">
      {/* Заголовок секции с кнопкой сворачивания */}
      <div
        ref={headerRef}
        className={`glass-effect rounded-xl p-4 mb-4 overflow-visible ${isExpanded ? 'sticky top-0 z-[40] backdrop-blur-xl bg-white/90 dark:bg-gray-800/90 shadow-lg transition-normal' : ''}`}
      >
        {/* Desktop: все в одну строку */}
        <div className="hidden md:flex items-center justify-between gap-3">
          <div className="flex items-center gap-3">
            <TrendingUp className="w-6 h-6 text-blue-500" aria-hidden="true" />
            <h2
              id="statistics-overview-header"
              className="text-xl font-bold text-gray-900 dark:text-white"
            >
              Статистика и аналитика
            </h2>
          </div>
          
          {/* Компактный Productivity Score - занимает все свободное пространство */}
          <div className="flex items-center gap-2 flex-1 justify-between group">
            <SimpleTooltip
              text="Общая оценка продуктивности от 0 до 100. Рассчитывается на основе выполнения целей (40%), регулярности работы (25%), времени фокуса (20%) и баланса перерывов (15%)."
              position="bottom"
            >
              {(() => {
                // Определяем цвет hover эффектов на основе scoreColor
                const getScoreHoverBorder = () => {
                  if (scoreColor.includes('green')) return 'hover:border-green-500 dark:hover:border-green-400'
                  if (scoreColor.includes('blue')) return 'hover:border-blue-500 dark:hover:border-blue-400'
                  if (scoreColor.includes('yellow')) return 'hover:border-yellow-500 dark:hover:border-yellow-400'
                  if (scoreColor.includes('red')) return 'hover:border-red-500 dark:hover:border-red-400'
                  return 'hover:border-gray-500 dark:hover:border-gray-400'
                }
                const getScoreHoverShadow = () => {
                  if (scoreColor.includes('green')) return 'hover:shadow-lg hover:shadow-green-500/20'
                  if (scoreColor.includes('blue')) return 'hover:shadow-lg hover:shadow-blue-500/20'
                  if (scoreColor.includes('yellow')) return 'hover:shadow-lg hover:shadow-yellow-500/20'
                  if (scoreColor.includes('red')) return 'hover:shadow-lg hover:shadow-red-500/20'
                  return 'hover:shadow-lg hover:shadow-gray-500/20'
                }
                return (
                  <div className={`flex items-center gap-1.5 cursor-help px-2 py-1 rounded-lg transition-all duration-300 hover:bg-white/10 dark:hover:bg-white/5 hover:scale-105 border border-transparent ${getScoreHoverBorder()} ${getScoreHoverShadow()}`}>
                    <TrendingUp className="w-4 h-4 text-blue-500 dark:text-blue-400 flex-shrink-0 transition-transform duration-300 group-hover:scale-110" />
                    <AnimatedCounter
                      value={score}
                      decimals={0}
                      className={`text-lg font-bold ${scoreColor}`}
                      resetAnimation={false}
                    />
                    <span className="text-xs text-gray-500 dark:text-gray-400">/100</span>
                  </div>
                )
              })()}
            </SimpleTooltip>
            
            {/* Разделитель */}
            <div className="w-px h-6 bg-gray-300 dark:bg-gray-600 flex-shrink-0"></div>
            
            {/* Факторы с названиями */}
            <div className="flex items-center gap-2 flex-1 justify-around">
              {Object.keys(factors).map((factorKey, index) => {
                const factor = factors[factorKey]
                const shortLabel = factorShortLabels[factorKey]
                const percentage = factor.percentage
                const progressColor = getFactorProgressColor(percentage)
                const textColor = getFactorTextColor(percentage)
                
                // Определяем цвет hover эффектов на основе progressColor
                const getFactorHoverBorder = () => {
                  if (progressColor.includes('green')) return 'hover:border-green-500 dark:hover:border-green-400'
                  if (progressColor.includes('yellow')) return 'hover:border-yellow-500 dark:hover:border-yellow-400'
                  if (progressColor.includes('red')) return 'hover:border-red-500 dark:hover:border-red-400'
                  return 'hover:border-gray-500 dark:hover:border-gray-400'
                }
                const getFactorHoverShadow = () => {
                  if (progressColor.includes('green')) return 'hover:shadow-lg hover:shadow-green-500/20'
                  if (progressColor.includes('yellow')) return 'hover:shadow-lg hover:shadow-yellow-500/20'
                  if (progressColor.includes('red')) return 'hover:shadow-lg hover:shadow-red-500/20'
                  return 'hover:shadow-lg hover:shadow-gray-500/20'
                }
                const getProgressBarShadow = () => {
                  if (progressColor.includes('green')) return 'group-hover:shadow-lg group-hover:shadow-green-500/50'
                  if (progressColor.includes('yellow')) return 'group-hover:shadow-lg group-hover:shadow-yellow-500/50'
                  if (progressColor.includes('red')) return 'group-hover:shadow-lg group-hover:shadow-red-500/50'
                  return 'group-hover:shadow-lg group-hover:shadow-gray-500/50'
                }
                
                return (
                  <SimpleTooltip
                    key={factorKey}
                    text={factorDescriptions[factorKey]}
                    position="bottom"
                  >
                    <div className={`flex items-center gap-1.5 cursor-help min-w-0 px-2 py-1 rounded-lg transition-all duration-300 hover:bg-white/10 dark:hover:bg-white/5 hover:scale-105 group border border-transparent ${getFactorHoverBorder()} ${getFactorHoverShadow()}`}>
                      {/* ✅ A11Y: Улучшаем контраст для темной темы */}
                      <span className="text-xs text-gray-500 dark:text-gray-300 whitespace-nowrap flex-shrink-0">
                        {shortLabel}
                      </span>
                      <div className="w-12 h-1 bg-gray-200 dark:bg-gray-700 rounded-full overflow-hidden flex-shrink-0">
                        <div
                          className={`h-full ${progressColor} rounded-full transition-all duration-300 ${getProgressBarShadow()}`}
                          style={{
                            width: `${percentage}%`,
                          }}
                        />
                      </div>
                      <AnimatedCounter
                        value={factor.value}
                        decimals={0}
                        suffix={`/${factor.max}`}
                        className={`text-xs font-bold ${textColor} whitespace-nowrap flex-shrink-0`}
                        resetAnimation={false}
                      />
                    </div>
                  </SimpleTooltip>
                )
              })}
            </div>
          </div>
          
          <button
            onClick={handleToggleExpanded}
            className="flex items-center justify-center w-8 h-8 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-700 transition-normal hover-lift-scale click-shrink focus:outline-none focus:ring-2 focus:ring-blue-500 flex-shrink-0"
            aria-expanded={isExpanded}
            aria-label={isExpanded ? 'Свернуть секцию статистики' : 'Развернуть секцию статистики'}
            aria-controls="statistics-overview-content"
            title={isExpanded ? 'Свернуть' : 'Развернуть'}
          >
            {isExpanded ? (
              <ChevronUp className="w-5 h-5 text-gray-500" aria-hidden="true" />
            ) : (
              <ChevronDown className="w-5 h-5 text-gray-500" aria-hidden="true" />
            )}
          </button>
        </div>

        {/* Mobile: заголовок и кнопка в одну строку, Productivity Score отдельным блоком */}
        <div className="md:hidden">
          <div className="flex items-center justify-between gap-3 mb-3">
            <div className="flex items-center gap-3">
              <TrendingUp className="w-6 h-6 text-blue-500" aria-hidden="true" />
              <h2
                id="statistics-overview-header"
                className="text-xl font-bold text-gray-900 dark:text-white"
              >
                Статистика и аналитика
              </h2>
            </div>
            <button
              onClick={handleToggleExpanded}
              className="flex items-center justify-center w-8 h-8 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-700 transition-normal hover-lift-scale click-shrink focus:outline-none focus:ring-2 focus:ring-blue-500 flex-shrink-0"
              aria-expanded={isExpanded}
              aria-label={isExpanded ? 'Свернуть секцию статистики' : 'Развернуть секцию статистики'}
              aria-controls="statistics-overview-content"
              title={isExpanded ? 'Свернуть' : 'Развернуть'}
            >
              {isExpanded ? (
                <ChevronUp className="w-5 h-5 text-gray-500" aria-hidden="true" />
              ) : (
                <ChevronDown className="w-5 h-5 text-gray-500" aria-hidden="true" />
              )}
            </button>
          </div>
          
          {/* Productivity Score как отдельный блок на mobile */}
          <div className="glass-effect rounded-xl p-3">
            <div className="flex flex-col gap-3">
              {/* Заголовок и score */}
              <SimpleTooltip
                text="Общая оценка продуктивности от 0 до 100. Рассчитывается на основе выполнения целей (40%), регулярности работы (25%), времени фокуса (20%) и баланса перерывов (15%)."
                position="top"
              >
                <div className="flex items-center gap-2 cursor-help">
                  <TrendingUp className="w-4 h-4 text-blue-500 dark:text-blue-400 flex-shrink-0" />
                  <span className="text-sm font-semibold text-gray-700 dark:text-gray-300 whitespace-nowrap">
                    Продуктивность:
                  </span>
                  <div className="flex items-center gap-1">
                    <AnimatedCounter
                      value={score}
                      decimals={0}
                      className={`text-xl font-bold ${scoreColor}`}
                      resetAnimation={false}
                    />
                    <div className="text-xs text-gray-500 dark:text-gray-400">/100</div>
                  </div>
                </div>
              </SimpleTooltip>

              {/* Разделитель */}
              <div className="w-full h-px bg-gray-300 dark:bg-gray-600"></div>

              {/* Факторы: в сетке 2x2 */}
              <div className="grid grid-cols-2 gap-2">
                {Object.keys(factors).map((factorKey, index) => {
                  const factor = factors[factorKey]
                  const shortLabel = factorShortLabels[factorKey]
                  const percentage = factor.percentage
                  const progressColor = getFactorProgressColor(percentage)
                  const textColor = getFactorTextColor(percentage)
                  
                  return (
                    <SimpleTooltip
                      key={factorKey}
                      text={factorDescriptions[factorKey]}
                      position="top"
                    >
                      <div className="flex items-center gap-1.5 cursor-help min-w-0">
                        <span className="text-xs text-gray-500 dark:text-gray-400 whitespace-nowrap flex-shrink-0">
                          {shortLabel}
                        </span>
                        <div className="flex-1 h-1.5 bg-gray-200 dark:bg-gray-700 rounded-full overflow-hidden min-w-0">
                          <div
                            className={`h-full ${progressColor} rounded-full`}
                            style={{
                              width: `${percentage}%`,
                            }}
                          />
                        </div>
                        <AnimatedCounter
                          value={factor.value}
                          decimals={0}
                          suffix={`/${factor.max}`}
                          className={`text-xs font-bold ${textColor} whitespace-nowrap flex-shrink-0`}
                          resetAnimation={false}
                        />
                      </div>
                    </SimpleTooltip>
                  )
                })}
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Контент с анимацией раскрытия и сворачивания */}
      {shouldMountContent && (
        <div
          ref={contentRef}
          id="statistics-overview-content"
          className={`${
            !isAnimatingContent && !isExitingContent ? 'opacity-0 -translate-y-4' : ''
          } ${isAnimatingContent ? 'animate-slide-up' : ''} ${
            isExitingContent ? 'animate-slide-out' : ''
          }`}
          role="region"
          aria-labelledby="statistics-overview-header"
        >
          <PlanFactCompactView
            shouldAnimate={isExpanded && !isExitingContent}
            shouldShow={shouldMountContent}
            key={`plan-fact-${isExpanded}`}
          />
          <InsightsPanel
            shouldAnimate={isExpanded && !isExitingContent}
            key={`insights-${isExpanded}`}
          />
        </div>
      )}
    </div>
  )
})
