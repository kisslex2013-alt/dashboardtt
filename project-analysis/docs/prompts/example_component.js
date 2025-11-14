import { useState, useEffect } from 'react'
import { TrendingUp, AlertCircle } from 'lucide-react'

/**
 * StatCard - Карточка статистики с анимацией и иконкой
 *
 * 🎓 ПОЯСНЕНИЕ ДЛЯ НАЧИНАЮЩИХ:
 * Это компонент-карточка для отображения статистических данных.
 * Использует glass-effect стили и анимацию при наведении.
 *
 * @param {Object} props - Пропсы компонента
 * @param {string} props.title - Заголовок карточки
 * @param {string|number} props.value - Отображаемое значение
 * @param {React.Component} [props.icon] - Иконка из lucide-react (опционально)
 * @param {string} [props.trend] - Тренд: 'up', 'down', 'neutral' (опционально)
 * @param {string} [props.description] - Дополнительное описание (опционально)
 * @param {Function} [props.onClick] - Обработчик клика (опционально)
 * @param {boolean} [props.isLoading] - Показывать ли индикатор загрузки
 *
 * @example
 * // Простое использование
 * <StatCard
 *   title="Всего заработано"
 *   value="25 000 ₽"
 *   icon={TrendingUp}
 * />
 *
 * @example
 * // С трендом и описанием
 * <StatCard
 *   title="Часы за месяц"
 *   value="160"
 *   icon={Clock}
 *   trend="up"
 *   description="+20% к прошлому месяцу"
 * />
 */
export function StatCard({
  title,
  value,
  icon: Icon,
  trend,
  description,
  onClick,
  isLoading = false,
}) {
  /**
   * 🎓 ПОЯСНЕНИЕ:
   * useState создает локальное состояние компонента.
   * isHovered отслеживает, наведена ли мышь на карточку.
   */
  const [isHovered, setIsHovered] = useState(false)

  /**
   * 🎓 ПОЯСНЕНИЕ:
   * useEffect выполняет побочные эффекты.
   * Здесь мы логируем когда значение меняется (для отладки в development).
   */
  useEffect(() => {
    if (process.env.NODE_ENV === 'development') {
      console.log(`StatCard "${title}" value updated:`, value)
    }
  }, [value, title])

  /**
   * Определение цвета тренда
   * 🎓 ПОЯСНЕНИЕ:
   * В зависимости от типа тренда применяем разные цвета.
   */
  const getTrendColor = () => {
    switch (trend) {
      case 'up':
        return 'text-green-500'
      case 'down':
        return 'text-red-500'
      case 'neutral':
        return 'text-gray-500'
      default:
        return 'text-gray-400'
    }
  }

  /**
   * Обработчик клика
   * 🎓 ПОЯСНЕНИЕ:
   * Вызываем onClick только если он передан через пропсы.
   */
  const handleClick = () => {
    if (onClick && !isLoading) {
      onClick()
    }
  }

  /**
   * 🎓 ПОЯСНЕНИЕ О СТРУКТУРЕ JSX:
   *
   * 1. Внешний div - контейнер с glass-effect стилями
   * 2. Условная стилизация через шаблонные строки (template literals)
   * 3. Анимации через Tailwind классы: hover:scale-105, transition-transform
   * 4. Адаптивность через responsive классы: p-4 md:p-6
   */
  return (
    <div
      onClick={handleClick}
      onMouseEnter={() => setIsHovered(true)}
      onMouseLeave={() => setIsHovered(false)}
      className={`
        glass-effect rounded-xl p-4 md:p-6
        transition-all duration-300
        ${onClick ? 'cursor-pointer hover:scale-105 active:scale-95' : ''}
        ${isHovered ? 'shadow-2xl' : 'shadow-lg'}
        ${isLoading ? 'opacity-60' : ''}
      `}
      role={onClick ? 'button' : 'article'}
      aria-label={`${title}: ${value}`}
      tabIndex={onClick ? 0 : undefined}
    >
      {/* Заголовок и иконка */}
      <div className="flex items-center justify-between mb-3">
        <h3 className="text-sm md:text-base font-semibold text-gray-600 dark:text-gray-300">
          {title}
        </h3>

        {/* Иконка с анимацией */}
        {Icon && (
          <div
            className={`
            p-2 rounded-lg bg-blue-100 dark:bg-blue-900/30
            transition-transform duration-300
            ${isHovered ? 'rotate-12 scale-110' : ''}
          `}
          >
            <Icon className="w-5 h-5 text-blue-500" />
          </div>
        )}
      </div>

      {/* Значение */}
      <div className="mb-2">
        {isLoading ? (
          // Skeleton loader для состояния загрузки
          <div className="h-8 bg-gray-200 dark:bg-gray-700 rounded animate-pulse" />
        ) : (
          <p className="text-2xl md:text-3xl font-bold text-gray-900 dark:text-white">{value}</p>
        )}
      </div>

      {/* Описание и тренд */}
      {description && (
        <div
          className={`
          flex items-center gap-1 text-sm
          ${getTrendColor()}
        `}
        >
          {trend === 'up' && <TrendingUp className="w-4 h-4" />}
          {trend === 'down' && <TrendingUp className="w-4 h-4 rotate-180" />}
          {trend === 'neutral' && <AlertCircle className="w-4 h-4" />}
          <span>{description}</span>
        </div>
      )}
    </div>
  )
}

/**
 * 🎓 ИТОГОВЫЕ ПРАВИЛА ДЛЯ AI:
 *
 * 1. Всегда используй named export (export function Name)
 * 2. Деструктуризируй пропсы в параметрах
 * 3. Добавляй JSDoc с @param и @example
 * 4. Используй обучающие комментарии с эмодзи 🎓
 * 5. Применяй glass-effect и Tailwind классы
 * 6. Добавляй accessibility (role, aria-label, tabIndex)
 * 7. Условная стилизация через template literals
 * 8. Анимации через Tailwind: hover:scale-105, transition-all
 * 9. Адаптивность через md:, lg: префиксы
 * 10. Состояние загрузки через isLoading
 */
