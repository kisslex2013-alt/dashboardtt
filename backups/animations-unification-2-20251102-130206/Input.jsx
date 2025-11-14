import PropTypes from 'prop-types';

/**
 * 🎯 Компонент поля ввода с поддержкой иконок и валидации
 * @param {string} label - подпись поля
 * @param {string} type - тип поля (text, email, password, etc.)
 * @param {string} value - значение поля
 * @param {function} onChange - обработчик изменения значения
 * @param {string} error - текст ошибки
 * @param {boolean} required - обязательное ли поле
 * @param {string} placeholder - текст-подсказка
 * @param {React.Component} icon - иконка для поля
 */
export function Input({ 
  label, 
  type = 'text', 
  value, 
  onChange, 
  error,
  required,
  placeholder,
  icon: Icon
}) {
  return (
    <div className="mb-4">
      {label && (
        <label className="block text-sm font-medium mb-2">
          {label}
          {required && <span className="text-red-500 ml-1">*</span>}
        </label>
      )}
      <div className="relative">
        {Icon && (
          <div className="absolute left-3 top-1/2 -translate-y-1/2">
            <Icon className="w-5 h-5 text-gray-400" />
          </div>
        )}
        <input
          type={type}
          value={value}
          onChange={(e) => onChange(e.target.value)}
          placeholder={placeholder}
          lang={type === 'time' ? 'ru' : undefined}
          className={`
            w-full px-4 ${Icon ? 'pl-11' : ''} py-2
            ${error ? 'test-red-background' : 'bg-white/80 dark:bg-gray-800/80'}
            backdrop-blur-lg
            rounded-lg
            border-2 ${error ? 'border-red-500' : 'border-gray-300 dark:border-gray-600'}
            focus:outline-none focus:ring-2 focus:ring-blue-500
            transition-colors
            placeholder-gray-500 dark:placeholder-gray-400
            text-gray-900 dark:text-gray-100
            ${type === 'time' ? '[&::-webkit-calendar-picker-indicator]:hidden [&::-webkit-inner-spin-button]:hidden [&::-webkit-outer-spin-button]:hidden [&::-webkit-datetime-edit-ampm-field]:hidden' : ''}
          `}
          style={type === 'time' ? {
            // Принудительно используем 24-часовой формат, скрываем AM/PM элементы
            fontVariantNumeric: 'tabular-nums'
          } : undefined}
        />
      </div>
      {error && (
        <p className="text-red-500 text-sm mt-1">{error}</p>
      )}
    </div>
  );
}

Input.propTypes = {
  label: PropTypes.string,
  type: PropTypes.string,
  value: PropTypes.string,
  onChange: PropTypes.func.isRequired,
  error: PropTypes.string,
  required: PropTypes.bool,
  placeholder: PropTypes.string,
  icon: PropTypes.elementType
};

