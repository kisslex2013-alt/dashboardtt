import { memo } from 'react'
import { CheckCircle2, AlertCircle, Info, AlertTriangle } from 'lucide-react'

/**
 * 🎨 5 визуальных вариантов уведомлений в стиле проекта
 *
 * Вариант 1: Glass Effect (Стеклянный эффект) - минималистичный с glass-effect
 * Вариант 2: Bordered (С рамкой) - с цветной рамкой и иконкой
 * Вариант 3: Gradient (Градиент) - с градиентным фоном
 * Вариант 4: Compact (Компактный) - компактный с иконкой слева
 * Вариант 5: Modern (Современный) - с тенями и скругленными углами
 */

// Иконки для типов уведомлений
const typeIcons = {
  success: CheckCircle2,
  error: AlertCircle,
  warning: AlertTriangle,
  info: Info,
}

// Цвета для типов уведомлений
const typeColors = {
  success: {
    bg: 'bg-green-500',
    bgDark: 'dark:bg-green-600',
    border: 'border-green-600',
    borderDark: 'dark:border-green-700',
    text: 'text-green-50',
    icon: 'text-green-100',
    // ИСПРАВЛЕНО: Цвета текста для glass-effect (темный в светлой теме, светлый в темной)
    textGlass: 'text-green-700 dark:text-green-50',
    iconGlass: 'text-green-600 dark:text-green-100',
    gradient: 'from-green-500 to-green-600',
    glass: 'bg-green-500/20 dark:bg-green-600/20',
  },
  error: {
    bg: 'bg-red-500',
    bgDark: 'dark:bg-red-600',
    border: 'border-red-600',
    borderDark: 'dark:border-red-700',
    text: 'text-red-50',
    icon: 'text-red-100',
    // ИСПРАВЛЕНО: Цвета текста для glass-effect (темный в светлой теме, светлый в темной)
    textGlass: 'text-red-700 dark:text-red-50',
    iconGlass: 'text-red-600 dark:text-red-100',
    gradient: 'from-red-500 to-red-600',
    glass: 'bg-red-500/20 dark:bg-red-600/20',
  },
  warning: {
    bg: 'bg-yellow-500',
    bgDark: 'dark:bg-yellow-600',
    border: 'border-yellow-600',
    borderDark: 'dark:border-yellow-700',
    text: 'text-yellow-50',
    icon: 'text-yellow-100',
    // ИСПРАВЛЕНО: Цвета текста для glass-effect (темный в светлой теме, светлый в темной)
    textGlass: 'text-yellow-700 dark:text-yellow-50',
    iconGlass: 'text-yellow-600 dark:text-yellow-100',
    gradient: 'from-yellow-500 to-yellow-600',
    glass: 'bg-yellow-500/20 dark:bg-yellow-600/20',
  },
  info: {
    bg: 'bg-blue-500',
    bgDark: 'dark:bg-blue-600',
    border: 'border-blue-600',
    borderDark: 'dark:border-blue-700',
    text: 'text-blue-50',
    icon: 'text-blue-100',
    // ИСПРАВЛЕНО: Цвета текста для glass-effect (темный в светлой теме, светлый в темной)
    textGlass: 'text-blue-700 dark:text-blue-50',
    iconGlass: 'text-blue-600 dark:text-blue-100',
    gradient: 'from-blue-500 to-blue-600',
    glass: 'bg-blue-500/20 dark:bg-blue-600/20',
  },
}

/**
 * Вариант 1: Glass Effect (Стеклянный эффект)
 * Минималистичный стиль с glass-effect и цветным акцентом
 *
 * ✨ УЛУЧШЕНИЯ:
 * - Индикатор паузы при наведении
 * - Плавная анимация прогресс-бара
 * - Улучшенная доступность
 * - React.memo для предотвращения лишних ре-рендеров
 */
export const NotificationVariant1 = memo(
  ({ notification, onClose, progress, isPaused, onMouseEnter, onMouseLeave }) => {
    const colors = typeColors[notification.type] || typeColors.info
    const Icon = typeIcons[notification.type] || typeIcons.info

    return (
      <div
        onMouseEnter={onMouseEnter}
        onMouseLeave={onMouseLeave}
        className={`
        glass-effect rounded-xl shadow-xl p-4 mb-2 min-w-[300px] max-w-[400px]
        border-l-4 ${colors.border} ${colors.borderDark}
        animate-slide-in-right
        transition-transform duration-200
        ${isPaused ? 'scale-105' : 'scale-100'}
      `}
      >
        <div className="flex items-start gap-3">
          <Icon className={`w-5 h-5 ${colors.iconGlass} flex-shrink-0 mt-0.5`} />
          <div className="flex-1 min-w-0">
            <div className="flex items-center justify-between">
              <p className={`text-sm font-medium ${colors.textGlass}`}>{notification.message}</p>
              {isPaused && (
                <span className="text-xs text-blue-500 dark:text-blue-400 ml-2 flex-shrink-0 font-semibold transition-all duration-300 animate-pulse-glow">
                  ⏸ на паузе
                </span>
              )}
            </div>
            {notification.duration > 0 && (
              <div className="mt-3 h-1 bg-gray-200 dark:bg-gray-700/50 rounded-full overflow-hidden">
                <div
                  className={`h-full ${colors.bg} ${colors.bgDark} transition-all duration-100`}
                  style={{ width: `${progress}%` }}
                />
              </div>
            )}
          </div>
        </div>
      </div>
    )
  }
)

/**
 * Вариант 2: Bordered (С рамкой)
 * С цветной рамкой со всех сторон и иконкой
 */
export function NotificationVariant2({ notification, onClose, progress }) {
  const colors = typeColors[notification.type] || typeColors.info
  const Icon = typeIcons[notification.type] || typeIcons.info

  return (
    <div
      className={`
      rounded-xl shadow-2xl p-4 mb-2 min-w-[300px] max-w-[400px]
      border-2 ${colors.border} ${colors.borderDark}
      ${colors.bg} ${colors.bgDark}
      animate-slide-in-right
    `}
    >
      <div className="flex items-start gap-3">
        <div
          className={`
          p-2 rounded-lg ${colors.glass} backdrop-blur-sm
        `}
        >
          <Icon className={`w-5 h-5 ${colors.text} dark:text-white`} />
        </div>
        <div className="flex-1 min-w-0">
          <p className={`text-sm font-semibold ${colors.text} dark:text-white`}>
            {notification.message}
          </p>
          {notification.duration > 0 && (
            <div className="mt-3 h-1.5 bg-white/30 dark:bg-gray-700/50 rounded-full overflow-hidden">
              <div
                className="h-full bg-white dark:bg-gray-200 transition-all duration-100"
                style={{ width: `${progress}%` }}
              />
            </div>
          )}
        </div>
        <button
          onClick={onClose}
          className={`
            p-1 rounded-lg flex-shrink-0
            hover:bg-white/20 dark:hover:bg-gray-700/50
            transition-colors hover-lift-scale click-shrink
            ${colors.text} dark:text-white
          `}
          aria-label="Закрыть уведомление"
        >
          <X className="w-4 h-4" />
        </button>
      </div>
    </div>
  )
}

/**
 * Вариант 3: Gradient (Градиент)
 * С градиентным фоном и современным дизайном
 */
export function NotificationVariant3({ notification, onClose, progress }) {
  const colors = typeColors[notification.type] || typeColors.info
  const Icon = typeIcons[notification.type] || typeIcons.info

  return (
    <div
      className={`
      rounded-2xl shadow-2xl p-4 mb-2 min-w-[300px] max-w-[400px]
      bg-gradient-to-r ${colors.gradient}
      border border-white/20 dark:border-gray-700/30
      animate-slide-in-right
    `}
    >
      <div className="flex items-start gap-3">
        <div className="p-2 rounded-xl bg-white/20 dark:bg-gray-900/20 backdrop-blur-sm">
          <Icon className="w-5 h-5 text-white" />
        </div>
        <div className="flex-1 min-w-0">
          <p className="text-sm font-semibold text-white">{notification.message}</p>
          {notification.duration > 0 && (
            <div className="mt-3 h-1.5 bg-white/30 rounded-full overflow-hidden">
              <div
                className="h-full bg-white transition-all duration-100"
                style={{ width: `${progress}%` }}
              />
            </div>
          )}
        </div>
        <button
          onClick={onClose}
          className="
            p-1 rounded-lg flex-shrink-0
            hover:bg-white/20 transition-colors
            hover-lift-scale click-shrink text-white
          "
          aria-label="Закрыть уведомление"
        >
          <X className="w-4 h-4" />
        </button>
      </div>
    </div>
  )
}

/**
 * Вариант 4: Compact (Компактный)
 * Компактный стиль с иконкой слева и минимальными отступами
 */
export function NotificationVariant4({ notification, onClose, progress }) {
  const colors = typeColors[notification.type] || typeColors.info
  const Icon = typeIcons[notification.type] || typeIcons.info

  return (
    <div
      className={`
      glass-effect rounded-lg shadow-lg p-3 mb-2 min-w-[280px] max-w-[380px]
      border-l-4 ${colors.border} ${colors.borderDark}
      animate-slide-in-right
    `}
    >
      <div className="flex items-center gap-2.5">
        <Icon className={`w-4 h-4 ${colors.iconGlass} flex-shrink-0`} />
        <p className={`text-xs font-medium flex-1 ${colors.textGlass}`}>{notification.message}</p>
        <button
          onClick={onClose}
          className="
            p-0.5 rounded flex-shrink-0
            hover:bg-gray-200 dark:hover:bg-gray-700
            transition-colors text-gray-600 dark:text-gray-300
          "
          aria-label="Закрыть уведомление"
        >
          <X className="w-3.5 h-3.5" />
        </button>
      </div>
      {notification.duration > 0 && (
        <div className="mt-2 h-0.5 bg-gray-200 dark:bg-gray-700 rounded-full overflow-hidden">
          <div
            className={`h-full ${colors.bg} ${colors.bgDark} transition-all duration-100`}
            style={{ width: `${progress}%` }}
          />
        </div>
      )}
    </div>
  )
}

/**
 * Вариант 5: Modern (Современный)
 * Современный стиль с глубокими тенями и скругленными углами
 */
export function NotificationVariant5({ notification, onClose, progress }) {
  const colors = typeColors[notification.type] || typeColors.info
  const Icon = typeIcons[notification.type] || typeIcons.info

  return (
    <div
      className={`
      rounded-2xl shadow-2xl p-5 mb-2 min-w-[320px] max-w-[420px]
      ${colors.bg} ${colors.bgDark}
      border border-white/10 dark:border-gray-700/30
      backdrop-blur-lg
      animate-slide-in-right
    `}
    >
      <div className="flex items-start gap-4">
        <div
          className={`
          p-2.5 rounded-xl bg-white/10 dark:bg-gray-900/20
          backdrop-blur-sm border border-white/20 dark:border-gray-700/30
        `}
        >
          <Icon className="w-6 h-6 text-white" />
        </div>
        <div className="flex-1 min-w-0">
          <p className="text-sm font-semibold text-white leading-relaxed">{notification.message}</p>
          {notification.duration > 0 && (
            <div className="mt-4 h-2 bg-white/20 rounded-full overflow-hidden">
              <div
                className="h-full bg-white/80 transition-all duration-100 rounded-full"
                style={{ width: `${progress}%` }}
              />
            </div>
          )}
        </div>
        <button
          onClick={onClose}
          className="
            p-1.5 rounded-lg flex-shrink-0
            hover:bg-white/20 transition-all
            hover-lift-scale click-shrink text-white
          "
          aria-label="Закрыть уведомление"
        >
          <X className="w-5 h-5" />
        </button>
      </div>
    </div>
  )
}
