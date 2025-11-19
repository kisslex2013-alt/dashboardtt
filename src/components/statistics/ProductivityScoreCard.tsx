/**
 * 🎯 Компонент карточки Productivity Score (Оценка продуктивности)
 *
 * Отображает единую метрику продуктивности (0-100) с круговым индикатором
 * и разбивкой по факторам:
 * - Goal Completion (40%)
 * - Consistency (25%)
 * - Focus Time (20%)
 * - Break Balance (15%)
 */

import { useMemo, useState, useEffect, useRef } from 'react'
import { TrendingUp } from '../../utils/icons'
import { useEntries } from '../../store/useEntriesStore'
import { useDailyGoal } from '../../store/useSettingsStore'
import {
  calculateProductivityScore,
  getScoreColor,
  getScoreBgColor,
  getFactorProgressColor,
  getFactorTextColor,
} from '../../utils/productivityScore'
import { SimpleTooltip } from '../ui/SimpleTooltip'
import { AnimatedCounter } from '../ui/AnimatedCounter'

/**
 * Компонент карточки Productivity Score
 */
export function ProductivityScoreCard() {
  const entries = useEntries()
  const dailyGoal = useDailyGoal()
  const [shouldAnimate, setShouldAnimate] = useState(true)
  const previousScoreRef = useRef(null)
  const isFirstMountRef = useRef(true)

  // Рассчитываем Productivity Score
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

  // Управление анимацией: запускаем при первом монтировании или при изменении score
  useEffect(() => {
    if (isFirstMountRef.current) {
      isFirstMountRef.current = false
      setShouldAnimate(true)
      // Сбрасываем анимацию через небольшую задержку для плавного появления
      const timer = setTimeout(() => {
        setShouldAnimate(false)
      }, 3000) // Достаточно времени для всех анимаций
      return () => clearTimeout(timer)
    } else if (previousScoreRef.current !== score) {
      // При изменении score перезапускаем анимацию
      setShouldAnimate(true)
      previousScoreRef.current = score
      const timer = setTimeout(() => {
        setShouldAnimate(false)
      }, 3000)
      return () => clearTimeout(timer)
    }
  }, [score])

  // Генерируем случайные скорости для прогресс-баров (от 0.7 до 2.5 сек)
  const progressBarSpeeds = useMemo(() => {
    const minSpeed = 0.7
    const maxSpeed = 2.5
    const speeds = []

    // Генерируем уникальные скорости для 4 факторов
    while (speeds.length < 4) {
      const speed = parseFloat((Math.random() * (maxSpeed - minSpeed) + minSpeed).toFixed(2))
      const isUnique = speeds.every(existing => Math.abs(existing - speed) >= 0.1)
      if (isUnique) {
        speeds.push(speed)
      }
    }

    return speeds.sort(() => Math.random() - 0.5)
  }, [shouldAnimate])

  // Цвета для score
  const scoreColor = getScoreColor(score)

  // Сокращенные названия факторов для компактного отображения
  const factorShortLabels = {
    goalCompletion: 'Цели',
    consistency: 'Регулярность',
    focusTime: 'Фокус',
    breakBalance: 'Перерывы',
  }

  return (
    <div className="glass-effect rounded-xl p-3 mb-6">
      {/* Desktop: все в одну строку, Mobile: заголовок сверху, факторы в сетке */}
      <div className="flex flex-col md:flex-row md:items-center gap-3">
        {/* Заголовок и score */}
        <SimpleTooltip
          text="Общая оценка продуктивности от 0 до 100. Рассчитывается на основе выполнения целей (40%), регулярности работы (25%), времени фокуса (20%) и баланса перерывов (15%)."
          position="top"
        >
          <div
            className={`flex items-center gap-2 flex-shrink-0 cursor-help ${shouldAnimate ? 'animate-slide-up opacity-0 animate-fade-in' : ''}`}
            style={shouldAnimate ? { animationDelay: '0.1s', animationFillMode: 'both' } : {}}
          >
            <TrendingUp className="w-4 h-4 text-blue-500 dark:text-blue-400" />
            <span className="text-sm font-semibold text-gray-700 dark:text-gray-300 whitespace-nowrap">
              Продуктивность:
            </span>
            <div className="flex items-center gap-1">
              <AnimatedCounter
                value={score}
                decimals={0}
                className={`text-xl md:text-2xl font-bold ${scoreColor} ${shouldAnimate ? 'opacity-0 animate-fade-in' : ''}`}
                style={shouldAnimate ? { animationDelay: '0.15s', animationFillMode: 'forwards' } : {}}
                resetAnimation={shouldAnimate}
                key={`score-${score}`}
              />
              <div className="text-xs text-gray-500 dark:text-gray-400">/100</div>
            </div>
          </div>
        </SimpleTooltip>

        {/* Разделитель - только на desktop */}
        <div className="hidden md:block w-px h-8 bg-gray-300 dark:bg-gray-600 flex-shrink-0"></div>

        {/* Факторы: на mobile в сетке 2x2, на desktop в одну строку */}
        <div className="flex-1 grid grid-cols-2 md:flex md:items-center gap-2 md:gap-3">
          {Object.keys(factors).map((factorKey, index) => {
            const factor = factors[factorKey]
            const shortLabel = factorShortLabels[factorKey]
            const percentage = factor.percentage
            const progressColor = getFactorProgressColor(percentage)
            const textColor = getFactorTextColor(percentage)
            const animationDelay = 0.2 + index * 0.05
            const progressBarSpeed = progressBarSpeeds[index] || '1.5'

            // Описания факторов для тултипов
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

            return (
              <SimpleTooltip
                key={factorKey}
                text={factorDescriptions[factorKey]}
                position="top"
              >
                <div
                  className={`flex items-center gap-1.5 md:flex-1 min-w-0 cursor-help ${shouldAnimate ? 'animate-slide-up' : ''}`}
                  style={shouldAnimate ? { animationDelay: `${animationDelay}s`, animationFillMode: 'both' } : {}}
                >
                  <span
                    className={`text-xs text-gray-500 dark:text-gray-400 whitespace-nowrap flex-shrink-0 ${shouldAnimate ? 'opacity-0 animate-fade-in' : ''}`}
                    style={shouldAnimate ? { animationDelay: `${animationDelay + 0.05}s`, animationFillMode: 'forwards' } : {}}
                  >
                    {shortLabel}
                  </span>
                  <div className="flex-1 h-1.5 bg-gray-200 dark:bg-gray-700 rounded-full overflow-hidden min-w-0">
                    <div
                      key={`${factorKey}-progress-${factor.value}`}
                      className={`h-full ${progressColor} rounded-full`}
                      style={{
                        width: shouldAnimate ? '0%' : `${percentage}%`,
                        '--target-width': `${percentage}%`,
                        animation: shouldAnimate
                          ? `slideInProgressDirect ${progressBarSpeed}s cubic-bezier(0.4, 0, 0.2, 1) ${animationDelay + 0.1}s forwards`
                          : 'none',
                      }}
                    />
                  </div>
                  <AnimatedCounter
                    value={factor.value}
                    decimals={0}
                    suffix={`/${factor.max}`}
                    className={`text-xs font-bold ${textColor} whitespace-nowrap flex-shrink-0 ${shouldAnimate ? 'opacity-0 animate-fade-in' : ''}`}
                    style={shouldAnimate ? { animationDelay: `${animationDelay + 0.1}s`, animationFillMode: 'forwards' } : {}}
                    resetAnimation={shouldAnimate}
                    key={`${factorKey}-${factor.value}`}
                  />
                </div>
              </SimpleTooltip>
            )
          })}
        </div>
      </div>

      {/* Подсказка для пустого состояния */}
      {score === 0 && entries.length === 0 && (
        <div className="mt-2 text-xs text-gray-500 dark:text-gray-400 text-center">
          Начните работу, чтобы увидеть оценку продуктивности
        </div>
      )}
    </div>
  )
}

