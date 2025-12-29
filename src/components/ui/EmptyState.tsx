import { memo, useState, useEffect } from 'react'
import { Button } from './Button'

/**
 * 📭 Empty State Component
 *
 * Красивый компонент для отображения пустых состояний
 * Улучшает UX, предоставляя понятные инструкции пользователю
 *
 * @param {string} props.variant - Вариант отображения ('default', 'compact', 'large')
 * @param {string} props.className - Дополнительные CSS классы
 */
import { ComponentType, SVGProps } from 'react'

export interface EmptyStateProps {
  icon?: ComponentType<any>
  illustration?: ComponentType<{ className?: string, animated?: boolean, style?: any }>
  title: string
  description?: string
  action?: {
    label: string
    onClick: () => void
  }
  variant?: 'default' | 'compact' | 'large'
  className?: string
}

export const EmptyState = memo(
  ({ icon: Icon, illustration: Illustration, title, description, action, variant = 'default', className = '' }: EmptyStateProps) => {
    const [shouldAnimate, setShouldAnimate] = useState(true)

    // Отключаем анимацию после первого рендера
    useEffect(() => {
      const timer = setTimeout(() => {
        setShouldAnimate(false)
      }, 2000)
      return () => clearTimeout(timer)
    }, [])
    const variants = {
      // Компактный вариант (для графиков, небольших блоков)
      compact: (
        <div className={`flex flex-col items-center justify-center py-8 px-4 ${className}`}>
          {Illustration ? (
            <div className="w-24 h-24 mb-3 text-gray-400 dark:text-gray-400 flex items-center justify-center">
              <Illustration className="w-full h-full" animated={shouldAnimate} style={{ color: 'currentColor' }} />
            </div>
          ) : Icon ? (
            <div className="w-12 h-12 rounded-full bg-gray-100 dark:bg-gray-800 flex items-center justify-center mb-3">
              <Icon className="w-6 h-6 text-gray-400 dark:text-gray-600" />
            </div>
          ) : null}
          <h3 className="text-lg font-semibold text-gray-700 dark:text-gray-300 mb-1">{title}</h3>
          {description && (
            <p className="text-sm text-gray-500 dark:text-gray-400 text-center max-w-sm">
              {description}
            </p>
          )}
          {action && (
            <Button
              onClick={action.onClick}
              variant="primary"
              className="mt-4"
              size="sm"
              iconId={`empty-state-action-compact`}
            >
              {action.label}
            </Button>
          )}
        </div>
      ),

      // Вариант по умолчанию (для списков, основных секций)
      default: (
        <div
          className={`glass-effect rounded-xl flex flex-col items-center justify-center py-12 px-6 ${className}`}
        >
          {Illustration ? (
            <div className="w-32 h-32 mb-4 text-gray-400 dark:text-gray-400 flex items-center justify-center">
              <Illustration className="w-full h-full" animated={shouldAnimate} style={{ color: 'currentColor' }} />
            </div>
          ) : Icon ? (
            <div className="w-20 h-20 rounded-full bg-gray-100 dark:bg-gray-800 flex items-center justify-center mb-4">
              <Icon className="w-10 h-10 text-gray-400 dark:text-gray-600" />
            </div>
          ) : null}
          <h3 className="text-xl font-bold text-gray-900 dark:text-white mb-2">{title}</h3>
          {description && (
            <p className="text-gray-600 dark:text-gray-400 text-center max-w-md mb-6">
              {description}
            </p>
          )}
          {action && (
            <Button
              onClick={action.onClick}
              variant="primary"
              iconId={`empty-state-action-default`}
            >
              {action.label}
            </Button>
          )}
        </div>
      ),

      // Большой вариант (для главных пустых состояний)
      large: (
        <div
          className={`glass-effect rounded-xl flex flex-col items-center justify-center py-16 px-6 ${className}`}
        >
          {Illustration ? (
            <div className="w-40 h-40 mb-6 text-gray-400 dark:text-gray-400 flex items-center justify-center">
              <Illustration className="w-full h-full" animated={shouldAnimate} style={{ color: 'currentColor' }} />
            </div>
          ) : Icon ? (
            <div className="w-24 h-24 rounded-full bg-gray-100 dark:bg-gray-800 flex items-center justify-center mb-6">
              <Icon className="w-12 h-12 text-gray-400 dark:text-gray-600" />
            </div>
          ) : null}
          <h3 className="text-2xl font-bold text-gray-900 dark:text-white mb-3">{title}</h3>
          {description && (
            <p className="text-gray-600 dark:text-gray-400 text-center max-w-lg mb-8 text-lg">
              {description}
            </p>
          )}
          {action && (
            <Button
              onClick={action.onClick}
              variant="primary"
              size="lg"
              iconId={`empty-state-action-large`}
            >
              {action.label}
            </Button>
          )}
        </div>
      ),
    }

    return variants[variant] || variants.default
  }
)
