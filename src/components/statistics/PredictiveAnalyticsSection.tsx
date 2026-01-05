import { useState, useRef, useEffect, useCallback, useMemo, memo } from 'react'
import { ChevronDown, ChevronUp, Calculator } from 'lucide-react'
import { InfoTooltip } from '../ui/InfoTooltip'
import { ChartVisibilityDropdown } from '../ui/ChartVisibilityDropdown'
import { WhatIfCalculator } from './WhatIfCalculator'
import { ForecastChart } from '../charts/ForecastChart'
import { SeasonalityHeatmap } from '../charts/SeasonalityHeatmap'
import { BurnoutRiskWidget } from './BurnoutRiskWidget'
import { useEntries } from '../../store/useEntriesStore'
import { useIsMobile } from '../../hooks/useIsMobile'
import { useChartVisibility, useUpdateChartVisibility } from '../../store/useSettingsStore'

export const PredictiveAnalyticsSection = memo(() => {
  const [isExpanded, setIsExpanded] = useState(false) // Default to collapsed like other sections
  const isMobile = useIsMobile()
  const entries = useEntries()
  const chartVisibility = useChartVisibility()
  const updateChartVisibility = useUpdateChartVisibility()
  
  // Деструктурируем для удобства
  const { whatIf, forecast, seasonality } = chartVisibility

  // Burnout виджет всегда показывается локально (не в глобальных настройках)
  const [showBurnout, setShowBurnout] = useState(true)

  // Animation state
  const [shouldMountContent, setShouldMountContent] = useState(false)
  const [isAnimatingContent, setIsAnimatingContent] = useState(false)
  const contentRef = useRef<HTMLDivElement>(null)

  const handleToggleExpanded = useCallback(() => setIsExpanded(prev => !prev), [])

  // Basic animation logic with double-RAF for reliable expansion
  useEffect(() => {
     if (isExpanded) {
        setShouldMountContent(true)
        // Double RAF ensures the browser has painted the 'display: block' state (from mounting)
        // before applying the opacity transition.
        requestAnimationFrame(() => {
          requestAnimationFrame(() => {
            setIsAnimatingContent(true)
          })
        })
     } else {
        setIsAnimatingContent(false)
        const timer = setTimeout(() => setShouldMountContent(false), 300) // Match transition duration
        return () => clearTimeout(timer)
     }
  }, [isExpanded])

  const iconColor = "text-blue-500" // Consistent blue theme

  // Опции для dropdown
  const visibilityOptions = useMemo(() => [
    { key: 'forecast', label: 'Прогноз заработка', visible: forecast },
    { key: 'whatIf', label: 'What-If калькулятор', visible: whatIf },
    { key: 'burnout', label: 'Прогноз выгорания', visible: showBurnout },
    { key: 'seasonality', label: 'Сезонность доходов', visible: seasonality },
  ], [forecast, whatIf, showBurnout, seasonality])

  const handleToggleVisibility = useCallback((key: string) => {
    if (key === 'burnout') {
      setShowBurnout(prev => !prev)
    } else {
      updateChartVisibility({ [key]: !chartVisibility[key] })
    }
  }, [chartVisibility, updateChartVisibility])

  // Show section if ANY predictive feature is enabled
  const hasAnyVisible = whatIf || forecast || seasonality || showBurnout
  if (!hasAnyVisible) return null;

  return (
    <div className={`relative z-10 ${isExpanded ? 'mb-6' : 'mb-4'}`}>
      <div
        className={`glass-effect rounded-xl p-4 mb-4 overflow-visible ${
          isExpanded ? 'sticky top-0 z-40 backdrop-blur-xl bg-white/90 dark:bg-gray-800/90 shadow-lg transition-normal' : ''
        }`}
      >
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <Calculator className={`w-6 h-6 ${iconColor}`} aria-hidden="true" />
            <h2 className="text-xl font-bold text-gray-900 dark:text-white">
              Предиктивная аналитика
            </h2>
            <InfoTooltip text="Прогноз дохода и выгорания на основе исторических данных. Помогает планировать нагрузку." />
          </div>

          <div className="flex items-center gap-2">
            {/* Dropdown для выбора видимых блоков */}
            {isExpanded && (
              <ChartVisibilityDropdown
                options={visibilityOptions}
                onToggle={handleToggleVisibility}
                buttonLabel="Блоки"
              />
            )}

            <button
              onClick={handleToggleExpanded}
              className="flex items-center justify-center w-8 h-8 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-700 transition-normal hover-lift-scale click-shrink focus:outline-none focus:ring-2 focus:ring-blue-500 flex-shrink-0"
              aria-expanded={isExpanded}
              title={isExpanded ? 'Свернуть' : 'Развернуть'}
            >
              {isExpanded ? (
                <ChevronUp className="w-5 h-5 text-gray-500" aria-hidden="true" />
              ) : (
                <ChevronDown className="w-5 h-5 text-gray-500" aria-hidden="true" />
              )}
            </button>
          </div>
        </div>
      </div>

      {shouldMountContent && (
        <div
          ref={contentRef}
          className={`${
            isAnimatingContent ? 'opacity-100 translate-y-0' : 'opacity-0 -translate-y-4'
          } transition-all duration-300 ease-in-out`}
        >
           <div className="space-y-6">
               {forecast && <ForecastChart entries={entries} dateFilter="year" />}
               
               <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                   {whatIf && <WhatIfCalculator entries={entries} />}
                   {showBurnout && <BurnoutRiskWidget />}
               </div>
               
               {seasonality && (
                   <div className="grid grid-cols-1">
                       <SeasonalityHeatmap entries={entries} />
                   </div>
               )}
           </div>
        </div>
      )}
    </div>
  )
})

export default PredictiveAnalyticsSection

