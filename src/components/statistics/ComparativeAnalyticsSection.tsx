import React, { useState, useMemo, useRef, useEffect, useCallback } from 'react'
import { ChevronDown, ChevronUp, TrendingUp, BarChart3, LineChart, PieChart, Calendar, Layers, GitCompareArrows, Target } from 'lucide-react'
import { calculateMoM, calculateYoYTrendData, calculateTrendData, calculateWeeklyStats, calculateCategoryShareTrend, calculateRadarMetrics } from '../../utils/comparativeCalculations'
import { MoMChart } from '../charts/MoMChart'
import { SparklineDataPoint } from '../charts/Sparkline'
import { YoYChart, YoYChartType } from '../charts/YoYChart'
import { TrendChart, TrendChartType } from '../charts/TrendChart'
import { BestWorstPeriods } from './BestWorstPeriods'
import { CategoryTrendChart, CategoryTrendChartType } from '../charts/CategoryTrendChart'
import { RadarComparisonChart } from '../charts/RadarComparisonChart'
import { useEntries } from '../../store/useEntriesStore'
import { useSettingsStore } from '../../store/useSettingsStore'
import { useIsMobile } from '../../hooks/useIsMobile'
import { InfoTooltip } from '../ui/InfoTooltip'
import { ChartVisibilityDropdown } from '../ui/ChartVisibilityDropdown'

export function ComparativeAnalyticsSection() {
  const entries = useEntries()
  const categories = useSettingsStore(state => state.categories)
  const isMobile = useIsMobile()
  const [isExpanded, setIsExpanded] = useState(false) // Default to collapsed
  const [activeTab, setActiveTab] = useState<'income' | 'hours'>('income')
  
  // Settings (visibility toggles)
  const [showMom, setShowMom] = useState(true)
  const [showYoy, setShowYoy] = useState(true)
  const [showTrend, setShowTrend] = useState(true)
  const [showBestWorst, setShowBestWorst] = useState(true)
  const [showCategoryTrend, setShowCategoryTrend] = useState(true)
  const [showRadar, setShowRadar] = useState(true)
  
  // Chart Type State
  const [yoyChartType, setYoyChartType] = useState<YoYChartType>('bar')
  const [trendChartType, setTrendChartType] = useState<TrendChartType>('area')
  const [categoryChartType, setCategoryChartType] = useState<CategoryTrendChartType>('bar')

  // Memoized Calculations
  const momData = useMemo(() => calculateMoM(entries), [entries])
  const yoyTrendData = useMemo(() => calculateYoYTrendData(entries), [entries])
  const trendData = useMemo(() => calculateTrendData(entries, 6), [entries])
  const weeklyStats = useMemo(() => calculateWeeklyStats(entries), [entries])
  const categoryTrendData = useMemo(() => calculateCategoryShareTrend(entries, categories, 6), [entries, categories])
  const radarData = useMemo(() => calculateRadarMetrics(entries), [entries])
  
  // Sparkline данные (преобразуем trendData в формат SparklineDataPoint)
  const incomeSparklineData = useMemo((): SparklineDataPoint[] => 
    trendData.map(d => ({ value: d.income, label: d.monthName })), 
    [trendData]
  )
  const hoursSparklineData = useMemo((): SparklineDataPoint[] => 
    trendData.map(d => ({ value: d.hours, label: d.monthName })), 
    [trendData]
  )

  // Animation state (copied from PredictiveAnalyticsSection)
  const [shouldMountContent, setShouldMountContent] = useState(false)
  const [isAnimatingContent, setIsAnimatingContent] = useState(false)
  const contentRef = useRef<HTMLDivElement>(null)

  const handleToggleExpanded = useCallback(() => setIsExpanded(prev => !prev), [])

  useEffect(() => {
     if (isExpanded) {
        setShouldMountContent(true)
        requestAnimationFrame(() => {
          requestAnimationFrame(() => {
            setIsAnimatingContent(true)
          })
        })
     } else {
        setIsAnimatingContent(false)
        const timer = setTimeout(() => setShouldMountContent(false), 300)
        return () => clearTimeout(timer)
     }
  }, [isExpanded])

  const iconColor = "text-blue-500" // Consistent with other sections

  // Опции для dropdown
  const visibilityOptions = useMemo(() => [
    { key: 'mom', label: 'Рост (MoM)', visible: showMom },
    { key: 'yoy', label: 'Сравнение YoY', visible: showYoy },
    { key: 'trend', label: 'Тренд за 6 месяцев', visible: showTrend },
    { key: 'bestWorst', label: 'Анализ периодов', visible: showBestWorst },
    { key: 'categoryTrend', label: 'Тренды категорий', visible: showCategoryTrend },
    { key: 'radar', label: 'Радар сравнения', visible: showRadar },
  ], [showMom, showYoy, showTrend, showBestWorst, showCategoryTrend, showRadar])

  const handleToggleVisibility = useCallback((key: string) => {
    switch (key) {
      case 'mom': setShowMom(prev => !prev); break
      case 'yoy': setShowYoy(prev => !prev); break
      case 'trend': setShowTrend(prev => !prev); break
      case 'bestWorst': setShowBestWorst(prev => !prev); break
      case 'categoryTrend': setShowCategoryTrend(prev => !prev); break
      case 'radar': setShowRadar(prev => !prev); break
    }
  }, [])

  return (
    <div className={`relative z-10 ${isExpanded ? 'mb-6' : 'mb-4'}`}>
      <div
        className={`glass-effect rounded-xl p-4 mb-4 overflow-visible ${
          isExpanded ? 'sticky top-0 z-40 backdrop-blur-xl bg-white/90 dark:bg-gray-800/90 shadow-lg transition-normal' : ''
        }`}
      >
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <GitCompareArrows className={`w-6 h-6 ${iconColor}`} aria-hidden="true" />
              <div className="flex items-center gap-2">
                <h2 className={`font-bold text-gray-900 dark:text-white ${isMobile ? 'text-base' : 'text-xl'}`}>
                  Сравнительная аналитика
                </h2>
                {!isMobile && <InfoTooltip text="Тренды, сравнения периодов и анализ категорий" />}
              </div>
            </div>

          
          <div className="flex items-center gap-2">
             {/* Tab Switcher - только на десктопе */}
            {isExpanded && !isMobile && (
                <div className="flex bg-gray-100 dark:bg-gray-800 rounded-lg p-1" onClick={(e) => e.stopPropagation()}>
                <button
                    onClick={() => setActiveTab('income')}
                    className={`px-3 py-1 text-xs font-medium rounded-md transition-all ${
                    activeTab === 'income'
                        ? 'bg-white dark:bg-gray-700 text-gray-900 dark:text-white shadow-sm'
                        : 'text-gray-500 hover:text-gray-700 dark:hover:text-gray-300'
                    }`}
                >
                    Доход
                </button>
                <button
                    onClick={() => setActiveTab('hours')}
                    className={`px-3 py-1 text-xs font-medium rounded-md transition-all ${
                    activeTab === 'hours'
                        ? 'bg-white dark:bg-gray-700 text-gray-900 dark:text-white shadow-sm'
                        : 'text-gray-500 hover:text-gray-700 dark:hover:text-gray-300'
                    }`}
                >
                    Часы
                </button>
                </div>
            )}

            {/* Dropdown - только на десктопе */}
            {isExpanded && !isMobile && (
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

        {/* Кнопки управления на мобильных - отдельная строка */}
        {isMobile && isExpanded && (
          <div className="flex items-center justify-end gap-2 mt-3">
            <div className="flex bg-gray-100 dark:bg-gray-800 rounded-lg p-1" onClick={(e) => e.stopPropagation()}>
              <button
                onClick={() => setActiveTab('income')}
                className={`px-2 py-1 text-xs font-medium rounded-md transition-all ${
                  activeTab === 'income'
                    ? 'bg-white dark:bg-gray-700 text-gray-900 dark:text-white shadow-sm'
                    : 'text-gray-500 hover:text-gray-700 dark:hover:text-gray-300'
                }`}
              >
                Доход
              </button>
              <button
                onClick={() => setActiveTab('hours')}
                className={`px-2 py-1 text-xs font-medium rounded-md transition-all ${
                  activeTab === 'hours'
                    ? 'bg-white dark:bg-gray-700 text-gray-900 dark:text-white shadow-sm'
                    : 'text-gray-500 hover:text-gray-700 dark:hover:text-gray-300'
                }`}
              >
                Часы
              </button>
            </div>
            <ChartVisibilityDropdown
              options={visibilityOptions}
              onToggle={handleToggleVisibility}
              buttonLabel=""
            />
          </div>
        )}
      </div>

      {shouldMountContent && (
        <div
          ref={contentRef}
          className={`${
            isAnimatingContent ? 'opacity-100 translate-y-0' : 'opacity-0 -translate-y-4'
          } transition-all duration-300 ease-in-out`}
        >
            <div className="space-y-6">
              <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                
                {/* 1. MoM Growth Card */}
                {showMom && (
                  <div className="glass-effect rounded-xl p-6 relative overflow-hidden group">
                    <div className="flex items-center justify-between mb-4">
                      <div className="flex items-center gap-2">
                        <TrendingUp className="w-5 h-5 text-blue-500" />
                        <h3 className="text-lg font-bold text-gray-900 dark:text-white">
                          Рост (MoM)
                        </h3>
                        <InfoTooltip text="Сравнение показателей текущего месяца с предыдущим. Зеленый цвет - рост, красный - падение." />
                      </div>
                    </div>
                    
                    <MoMChart 
                      data={momData} 
                      type={activeTab} 
                      sparklineData={activeTab === 'income' ? incomeSparklineData : hoursSparklineData}
                    />
                  </div>
                )}

                {/* 2. YoY Comparison */}
                {showYoy && (
                  <div className="glass-effect rounded-xl p-6 relative overflow-hidden md:col-span-2 group">
                     <div className="flex items-center justify-between mb-4">
                      <div className="flex items-center gap-2">
                        <BarChart3 className="w-5 h-5 text-blue-500" />
                        <h3 className="text-lg font-bold text-gray-900 dark:text-white">
                          Сравнение с прошлыми годами (YoY)
                        </h3>
                        <InfoTooltip text="Сравнение текущего месяца с этим же месяцем в прошлые годы. Позволяет увидеть долгосрочную динамику." />
                      </div>

                      {/* Chart Type Selector */}
                       <div className="flex bg-gray-100 dark:bg-gray-700/50 rounded-lg p-0.5">
                        <button
                          onClick={() => setYoyChartType('bar')}
                          className={`p-1.5 rounded-md transition-all ${
                            yoyChartType === 'bar'
                              ? 'bg-white dark:bg-gray-600 shadow-sm text-blue-500'
                              : 'text-gray-400 hover:text-gray-600 dark:hover:text-gray-300'
                          }`}
                          title="Столбцы"
                        >
                          <BarChart3 className="w-4 h-4" />
                        </button>
                         <button
                          onClick={() => setYoyChartType('line')}
                          className={`p-1.5 rounded-md transition-all ${
                            yoyChartType === 'line'
                              ? 'bg-white dark:bg-gray-600 shadow-sm text-blue-500'
                              : 'text-gray-400 hover:text-gray-600 dark:hover:text-gray-300'
                          }`}
                          title="Линия"
                        >
                          <TrendingUp className="w-4 h-4" />
                        </button>
                         <button
                          onClick={() => setYoyChartType('area')}
                          className={`p-1.5 rounded-md transition-all ${
                            yoyChartType === 'area'
                              ? 'bg-white dark:bg-gray-600 shadow-sm text-blue-500'
                              : 'text-gray-400 hover:text-gray-600 dark:hover:text-gray-300'
                          }`}
                          title="Область"
                        >
                          <LineChart className="w-4 h-4" />
                        </button>
                      </div>
                    </div>
                    
                    <div className="h-[140px]">
                      <YoYChart data={yoyTrendData} type={activeTab} visType={yoyChartType} />
                    </div>
                  </div>
                )}

              </div>

              {/* 3. Trend Analysis (Full Width) */}
              {showTrend && (
                <div className="glass-effect rounded-xl p-6 relative overflow-hidden group">
                  <div className="flex items-center justify-between mb-4">
                    <div className="flex items-center gap-2">
                       {/* Changed icon to LineChart or similar to represent Trend better */}
                      <LineChart className="w-5 h-5 text-blue-500" />
                      <h3 className="text-lg font-bold text-gray-900 dark:text-white">
                        Тренд за 6 месяцев
                      </h3>
                      <InfoTooltip text="Динамика доходов и часов за последние полгода. Позволяет оценить среднесрочный тренд." />
                    </div>

                    {/* Chart Type Selector */}
                     <div className="flex bg-gray-100 dark:bg-gray-700/50 rounded-lg p-0.5">
                        <button
                          onClick={() => setTrendChartType('bar')}
                          className={`p-1.5 rounded-md transition-all ${
                            trendChartType === 'bar'
                              ? 'bg-white dark:bg-gray-600 shadow-sm text-blue-500'
                              : 'text-gray-400 hover:text-gray-600 dark:hover:text-gray-300'
                          }`}
                          title="Столбцы"
                        >
                          <BarChart3 className="w-4 h-4" />
                        </button>
                         <button
                          onClick={() => setTrendChartType('area')}
                          className={`p-1.5 rounded-md transition-all ${
                            trendChartType === 'area'
                              ? 'bg-white dark:bg-gray-600 shadow-sm text-blue-500'
                              : 'text-gray-400 hover:text-gray-600 dark:hover:text-gray-300'
                          }`}
                          title="Область"
                        >
                          <Layers className="w-4 h-4" /> 
                        </button>
                         <button
                          onClick={() => setTrendChartType('line')}
                          className={`p-1.5 rounded-md transition-all ${
                            trendChartType === 'line'
                              ? 'bg-white dark:bg-gray-600 shadow-sm text-blue-500'
                              : 'text-gray-400 hover:text-gray-600 dark:hover:text-gray-300'
                          }`}
                          title="Линия"
                        >
                          <TrendingUp className="w-4 h-4" />
                        </button>
                      </div>
                  </div>
                  
                  <div className="h-[200px]">
                     <TrendChart data={trendData} type={activeTab} visType={trendChartType} />
                  </div>
                </div>
              )}

              {/* Grid 2Cols for Best/Worst and Category Trends */}
              <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">

              {/* 4. Best/Worst Periods */}
              {showBestWorst && (
                <div className="glass-effect rounded-xl p-6 relative overflow-hidden group">
                  <div className="flex items-center justify-between mb-6">
                    <div className="flex items-center gap-2">
                      <Calendar className="w-5 h-5 text-blue-500" />
                      <h3 className="text-lg font-bold text-gray-900 dark:text-white">
                        Анализ периодов
                      </h3>
                      <InfoTooltip text="Самые продуктивные и непродуктивные недели на основе вашей истории." />
                    </div>
                  </div>
                  
                  <BestWorstPeriods 
                    bestWeeks={weeklyStats.bestWeeks} 
                    worstWeeks={weeklyStats.worstWeeks} 
                    type={activeTab} 
                  />
                </div>
              )}

              {/* 5. Category Trends (Share) */}
              {showCategoryTrend && (
                <div className="glass-effect rounded-xl p-6 relative overflow-hidden group">
                  <div className="flex items-center justify-between mb-4">
                    <div className="flex items-center gap-2">
                      <Layers className="w-5 h-5 text-blue-500" />
                      <h3 className="text-lg font-bold text-gray-900 dark:text-white">
                        Тренды категорий
                      </h3>
                      <InfoTooltip text="Как менялось распределение времени по категориям за последние 6 месяцев (в %)." />
                    </div>

                    {/* Chart Type Selector */}
                     <div className="flex bg-gray-100 dark:bg-gray-700/50 rounded-lg p-0.5">
                        <button
                          onClick={() => setCategoryChartType('bar')}
                          className={`p-1.5 rounded-md transition-all ${
                            categoryChartType === 'bar'
                              ? 'bg-white dark:bg-gray-600 shadow-sm text-blue-500'
                              : 'text-gray-400 hover:text-gray-600 dark:hover:text-gray-300'
                          }`}
                          title="Столбцы"
                        >
                          <BarChart3 className="w-4 h-4" />
                        </button>
                         <button
                          onClick={() => setCategoryChartType('area')}
                          className={`p-1.5 rounded-md transition-all ${
                            categoryChartType === 'area'
                              ? 'bg-white dark:bg-gray-600 shadow-sm text-blue-500'
                              : 'text-gray-400 hover:text-gray-600 dark:hover:text-gray-300'
                          }`}
                          title="Область"
                        >
                          <Layers className="w-4 h-4" /> 
                        </button>
                         <button
                          onClick={() => setCategoryChartType('line')}
                          className={`p-1.5 rounded-md transition-all ${
                            categoryChartType === 'line'
                              ? 'bg-white dark:bg-gray-600 shadow-sm text-blue-500'
                              : 'text-gray-400 hover:text-gray-600 dark:hover:text-gray-300'
                          }`}
                          title="Линия"
                        >
                          <TrendingUp className="w-4 h-4" />
                        </button>
                      </div>
                  </div>
                  
                  <CategoryTrendChart 
                    data={categoryTrendData} 
                    categories={categories}
                    visType={categoryChartType}
                  />
                </div>
              )}

              {/* 6. Radar Comparison Chart - в сетке как "Анализ периодов" */}
              {showRadar && (
                <div className="glass-effect rounded-xl p-6 relative overflow-hidden group">
                  <div className="flex items-center justify-between mb-4">
                    <div className="flex items-center gap-2">
                      <Target className="w-5 h-5 text-blue-500" />
                      <h3 className="text-lg font-bold text-gray-900 dark:text-white">
                        Сравнение периодов
                      </h3>
                      <InfoTooltip text="Радарный график сравнивает метрики текущего и прошлого месяца." />
                    </div>
                  </div>
                  
                  {/* Компактный layout: Радар слева, Метрики справа */}
                  <div className="flex flex-row items-center gap-4 h-[220px]">
                    <div className="w-1/2 h-full">
                      <RadarComparisonChart
                        current={radarData.current}
                        previous={radarData.previous}
                        currentLabel={radarData.currentLabel}
                        previousLabel={radarData.previousLabel}
                      />
                    </div>
                    
                    {/* Сводка метрик - вертикальный список справа */}
                    <div className="w-1/2 flex flex-col justify-center space-y-3">
                      {[
                        { label: 'Доход', curr: radarData.current.income, prev: radarData.previous.income, format: (v: number) => `${v >= 1000 ? (v/1000).toFixed(0) + 'K' : v.toFixed(0)}` },
                        { label: 'Часы', curr: radarData.current.hours, prev: radarData.previous.hours, format: (v: number) => `${v.toFixed(1)} ч` },
                        { label: 'Записи', curr: radarData.current.entries, prev: radarData.previous.entries, format: (v: number) => `${v}` },
                        { label: 'Ставка', curr: radarData.current.avgRate, prev: radarData.previous.avgRate, format: (v: number) => `${v.toFixed(0)}` },
                        { label: 'Ч/день', curr: radarData.current.productivity, prev: radarData.previous.productivity, format: (v: number) => `${v.toFixed(1)}` },
                      ].map(({ label, curr, prev, format }) => {
                        const change = prev !== 0 ? ((curr - prev) / prev) * 100 : (curr > 0 ? 100 : 0)
                        const isPositive = change > 0
                        return (
                          <div key={label} className="flex items-center justify-between p-2.5 rounded bg-gray-50 dark:bg-gray-800/50 hover:bg-gray-100 dark:hover:bg-gray-800 transition-colors">
                            <span className="text-xs text-gray-900 dark:text-gray-100 font-medium">{label}</span>
                            <div className="flex items-center gap-2">
                              <span className="text-xs font-bold text-gray-900 dark:text-white">{format(curr)}</span>
                              <span className={`text-[10px] font-bold px-1.5 py-0.5 rounded ${
                                isPositive ? 'bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-400' : 'bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-400'
                              }`}>
                                {isPositive ? '+' : ''}{change.toFixed(0)}%
                              </span>
                            </div>
                          </div>
                        )
                      })}
                    </div>
                  </div>
                </div>
              )}
              </div>

            </div>
        </div>
      )}
    </div>
  )
}

export default ComparativeAnalyticsSection
