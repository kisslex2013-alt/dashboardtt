/**
 * 📊 Progress Indicator Components
 *
 * Компоненты для отображения прогресса в многошаговых формах.
 * Best practice: визуальная обратная связь о текущем шаге.
 */

import { useMemo, useState } from 'react'
import { Check } from '../../utils/icons'

interface ProgressIndicatorProps {
  /** Текущий шаг (начиная с 1) */
  currentStep: number
  /** Общее количество шагов */
  totalSteps: number
  /** Названия шагов (опционально) */
  stepLabels?: string[]
  /** Вариант отображения */
  variant?: 'dots' | 'line' | 'steps'
  /** Размер */
  size?: 'sm' | 'md' | 'lg'
  /** Дополнительные классы */
  className?: string
}

/**
 * ProgressIndicator — универсальный индикатор прогресса
 */
export function ProgressIndicator({
  currentStep,
  totalSteps,
  stepLabels,
  variant = 'dots',
  size = 'md',
  className = '',
}: ProgressIndicatorProps) {
  const progress = useMemo(() => {
    return Math.min(100, Math.max(0, ((currentStep - 1) / (totalSteps - 1)) * 100))
  }, [currentStep, totalSteps])

  const sizeClasses = {
    sm: { dot: 'w-2 h-2', step: 'w-6 h-6 text-xs', line: 'h-1' },
    md: { dot: 'w-3 h-3', step: 'w-8 h-8 text-sm', line: 'h-1.5' },
    lg: { dot: 'w-4 h-4', step: 'w-10 h-10 text-base', line: 'h-2' },
  }

  if (variant === 'line') {
    return (
      <div className={`w-full ${className}`}>
        <div className={`w-full bg-gray-200 dark:bg-gray-700 rounded-full ${sizeClasses[size].line}`}>
          <div
            className={`bg-blue-500 dark:bg-blue-400 rounded-full ${sizeClasses[size].line} transition-all duration-300 ease-out`}
            style={{ width: `${progress}%` }}
          />
        </div>
        <div className="flex justify-between mt-2 text-xs text-gray-500 dark:text-gray-400">
          <span>Шаг {currentStep} из {totalSteps}</span>
          <span>{Math.round(progress)}%</span>
        </div>
      </div>
    )
  }

  if (variant === 'dots') {
    return (
      <div className={`flex items-center justify-center gap-2 ${className}`}>
        {Array.from({ length: totalSteps }).map((_, index) => {
          const stepNum = index + 1
          const isActive = stepNum === currentStep
          const isCompleted = stepNum < currentStep

          return (
            <div
              key={index}
              className={`
                ${sizeClasses[size].dot} rounded-full transition-all duration-200
                ${isActive
                  ? 'bg-blue-500 dark:bg-blue-400 scale-125'
                  : isCompleted
                    ? 'bg-blue-500 dark:bg-blue-400'
                    : 'bg-gray-300 dark:bg-gray-600'
                }
              `}
            />
          )
        })}
      </div>
    )
  }

  // variant === 'steps'
  return (
    <div className={`flex items-center justify-center ${className}`}>
      {Array.from({ length: totalSteps }).map((_, index) => {
        const stepNum = index + 1
        const isActive = stepNum === currentStep
        const isCompleted = stepNum < currentStep
        const label = stepLabels?.[index]

        return (
          <div key={index} className="flex items-center">
            {/* Step circle */}
            <div className="flex flex-col items-center">
              <div
                className={`
                  ${sizeClasses[size].step} rounded-full flex items-center justify-center
                  font-medium transition-all duration-200
                  ${isActive
                    ? 'bg-blue-500 dark:bg-blue-400 text-white ring-4 ring-blue-500/30 dark:ring-blue-400/30'
                    : isCompleted
                      ? 'bg-green-500 dark:bg-green-400 text-white'
                      : 'bg-gray-200 dark:bg-gray-700 text-gray-500 dark:text-gray-400'
                  }
                `}
              >
                {isCompleted ? (
                  <Check className="w-4 h-4" />
                ) : (
                  stepNum
                )}
              </div>
              {label && (
                <span className={`
                  mt-2 text-xs whitespace-nowrap
                  ${isActive
                    ? 'text-blue-600 dark:text-blue-400 font-medium'
                    : 'text-gray-500 dark:text-gray-400'
                  }
                `}>
                  {label}
                </span>
              )}
            </div>

            {/* Connector line */}
            {index < totalSteps - 1 && (
              <div className={`
                w-8 sm:w-12 h-0.5 mx-2
                ${isCompleted
                  ? 'bg-green-500 dark:bg-green-400'
                  : 'bg-gray-200 dark:bg-gray-700'
                }
              `} />
            )}
          </div>
        )
      })}
    </div>
  )
}

/**
 * useProgressSteps — хук для управления шагами
 */
export function useProgressSteps(totalSteps: number, initialStep = 1) {
  const [currentStep, setCurrentStep] = useState(initialStep)

  const nextStep = () => {
    setCurrentStep(prev => Math.min(totalSteps, prev + 1))
  }

  const prevStep = () => {
    setCurrentStep(prev => Math.max(1, prev - 1))
  }

  const goToStep = (step: number) => {
    setCurrentStep(Math.min(totalSteps, Math.max(1, step)))
  }

  const isFirstStep = currentStep === 1
  const isLastStep = currentStep === totalSteps
  const progress = ((currentStep - 1) / (totalSteps - 1)) * 100

  return {
    currentStep,
    totalSteps,
    nextStep,
    prevStep,
    goToStep,
    isFirstStep,
    isLastStep,
    progress,
  }
}
