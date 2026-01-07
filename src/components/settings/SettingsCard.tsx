/**
 * 🎛️ SettingsCard Component
 *
 * Унифицированная карточка для секции настроек.
 * Features:
 * - Toggle в заголовке (вкл/выкл)
 * - Иконка и описание
 * - Контент всегда виден (без аккордеона)
 */

import { ReactNode } from 'react'
import { LucideIcon } from 'lucide-react'

interface SettingsCardProps {
  /** Заголовок карточки */
  title: string
  /** Описание (подзаголовок) */
  description?: string
  /** Иконка */
  icon?: LucideIcon
  /** Показывать toggle */
  showToggle?: boolean
  /** Состояние toggle */
  enabled?: boolean
  /** Callback при изменении toggle */
  onToggle?: (enabled: boolean) => void
  /** Дочерние элементы (контент) */
  children: ReactNode
  /** Показывать контент только если enabled */
  collapseOnDisable?: boolean
  /** @deprecated - не используется (контент всегда открыт) */
  defaultExpanded?: boolean
  /** Дополнительные классы */
  className?: string
}

export function SettingsCard({
  title,
  description,
  icon: Icon,
  showToggle = false,
  enabled = true,
  onToggle,
  children,
  collapseOnDisable = true,
  className = '',
}: SettingsCardProps) {
  // Контент показывается если: нет collapseOnDisable ИЛИ enabled = true
  const shouldShowContent = !collapseOnDisable || enabled

  return (
    <div
      className={`
        glass-effect rounded-xl border border-gray-200 dark:border-gray-700
        overflow-visible relative
        ${!enabled && collapseOnDisable ? 'opacity-75' : ''}
        ${className}
      `}
    >
      {/* Header */}
      <div className="flex items-center justify-between p-4 gap-4">
        <div className="flex items-center gap-3 flex-1">
          {Icon && (
            <div className={`
              p-2 rounded-lg transition-colors
              ${enabled
                ? 'bg-blue-500/10 text-blue-500'
                : 'bg-gray-500/10 text-gray-500'
              }
            `}>
              <Icon className="w-5 h-5" />
            </div>
          )}

          <div className="flex-1">
            <h3 className="text-sm font-semibold text-gray-900 dark:text-white">
              {title}
            </h3>
            {description && (
              <p className="text-xs text-gray-500 dark:text-gray-400 mt-0.5">
                {description}
              </p>
            )}
          </div>
        </div>

        {/* Toggle */}
        {showToggle && (
          <button
            type="button"
            onClick={(e) => {
              e.stopPropagation()
              onToggle?.(!enabled)
            }}
            className={`
              relative w-11 h-6 rounded-full transition-colors flex-shrink-0
              ${enabled ? 'bg-blue-500' : 'bg-gray-300 dark:bg-gray-600'}
            `}
          >
            <span
              className={`
                absolute top-0.5 left-0.5 w-5 h-5 bg-white rounded-full 
                transition-transform shadow-sm
                ${enabled ? 'translate-x-5' : 'translate-x-0'}
              `}
            />
          </button>
        )}
      </div>

      {/* Content - всегда видим, если enabled или collapseOnDisable = false */}
      {shouldShowContent && (
        <div className="px-4 pb-4 pt-0 border-t border-gray-100 dark:border-gray-700/50">
          <div className="pt-4">
            {children}
          </div>
        </div>
      )}
    </div>
  )
}

/**
 * SettingsRow — строка с label и контролом
 */
interface SettingsRowProps {
  label: string
  description?: string
  children: ReactNode
  className?: string
}

export function SettingsRow({ label, description, children, className = '' }: SettingsRowProps) {
  return (
    <div className={`flex items-center justify-between gap-4 ${className}`}>
      <div className="flex-1 min-w-0">
        <label className="text-sm font-medium text-gray-900 dark:text-white">
          {label}
        </label>
        {description && (
          <p className="text-xs text-gray-500 dark:text-gray-400 mt-0.5">
            {description}
          </p>
        )}
      </div>
      <div className="flex-shrink-0">
        {children}
      </div>
    </div>
  )
}

/**
 * SettingsDivider — разделитель между секциями
 */
export function SettingsDivider() {
  return <hr className="my-4 border-gray-200 dark:border-gray-700" />
}
