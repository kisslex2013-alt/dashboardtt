import { useState, useEffect } from 'react'
import { TrendingUp, AlertCircle } from 'lucide-react'
import PropTypes from 'prop-types'

/**
 * ComponentName - Краткое описание компонента
 *
 * 🎓 ПОЯСНЕНИЕ ДЛЯ НАЧИНАЮЩИХ:
 * Этот компонент показывает [что делает компонент].
 * Использует glass-effect стили и анимацию при наведении.
 *
 * @param {Object} props - Пропсы компонента
 * @param {string} props.title - Заголовок компонента
 * @param {string|number} props.value - Отображаемое значение
 * @param {React.Component} [props.icon] - Иконка из lucide-react (опционально)
 * @param {Function} [props.onClick] - Обработчик клика (опционально)
 * @param {boolean} [props.isLoading] - Показывать ли индикатор загрузки
 *
 * @example
 * // Простое использование
 * <ComponentName
 *   title="Заголовок"
 *   value="Значение"
 *   icon={TrendingUp}
 * />
 */
export function ComponentName({ title, value, icon: Icon, onClick, isLoading = false }) {
  /**
   * 🎓 ПОЯСНЕНИЕ:
   * useState создает локальное состояние компонента.
   * isHovered отслеживает, наведена ли мышь на компонент.
   */
  const [isHovered, setIsHovered] = useState(false)

  /**
   * 🎓 ПОЯСНЕНИЕ:
   * useEffect выполняет побочные эффекты.
   * Здесь мы логируем когда значение меняется (для отладки в development).
   */
  useEffect(() => {
    if (process.env.NODE_ENV === 'development') {
      console.log(`ComponentName "${title}" value updated:`, value)
    }
  }, [value, title])

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
    </div>
  )
}

ComponentName.propTypes = {
  title: PropTypes.string.isRequired,
  value: PropTypes.oneOfType([PropTypes.string, PropTypes.number]).isRequired,
  icon: PropTypes.elementType,
  onClick: PropTypes.func,
  isLoading: PropTypes.bool,
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
