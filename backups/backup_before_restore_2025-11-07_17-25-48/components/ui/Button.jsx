// import PropTypes from 'prop-types'; // Временно отключено для отладки lazy loading
import { useIconEditorStore } from '../../store/useIconEditorStore';
import { getIcon } from '../../utils/iconHelper';

/**
 * 🎯 Кнопка с различными вариантами стилей
 * @param {React.ReactNode} children - содержимое кнопки
 * @param {string} variant - вариант стиля (primary, secondary, danger, success)
 * @param {string} size - размер кнопки (sm, md, lg)
 * @param {React.Component} icon - иконка для кнопки
 * @param {string} iconId - уникальный ID для режима редактирования иконок (опционально)
 * @param {function} onClick - обработчик клика
 * @param {boolean} disabled - заблокирована ли кнопка
 * @param {string} className - дополнительные CSS классы
 */
export function Button({ 
  children, 
  variant = 'primary', 
  size = 'md',
  icon: Icon,
  iconId, // Уникальный ID для режима редактирования иконок
  onClick,
  disabled,
  className = '',
  type = 'button' // ИСПРАВЛЕНО: Добавлен type prop для предотвращения submit формы
}) {
  // Получаем замену иконки из store (только в dev режиме)
  const iconReplacement = useIconEditorStore((state) => 
    iconId ? state.getIconReplacement(iconId) : null
  );
  
  // Определяем какую иконку использовать: замену или оригинал
  let DisplayIcon = Icon;
  if (iconId && iconReplacement) {
    // Если есть замена, загружаем её через iconHelper
    const ReplacementIconComponent = getIcon(iconReplacement);
    if (ReplacementIconComponent) {
      DisplayIcon = ReplacementIconComponent;
    }
  }
  // Унифицированные базовые стили с новой системой анимаций
  const baseStyles = "glass-button transition-normal hover-lift-scale";
  
  const variants = {
    primary: "bg-blue-500 hover:bg-blue-600 text-white",
    secondary: "bg-gray-200 dark:bg-gray-700 hover:bg-gray-300 dark:hover:bg-gray-600",
    danger: "bg-red-500 hover:bg-red-600 text-white",
    success: "bg-green-500 hover:bg-green-600 text-white",
  };
  
  const sizes = {
    sm: "px-3 py-1.5 text-sm",
    md: "px-4 py-2 text-base",
    lg: "px-6 py-3 text-lg",
  };
  
  return (
    <button
      type={type}
      onClick={onClick}
      disabled={disabled}
      {...(iconId ? { 'data-icon-id': iconId } : {})} // Добавляем атрибут для режима редактирования
      className={`
        ${baseStyles}
        ${variants[variant]}
        ${sizes[size]}
        ${disabled ? 'opacity-50 cursor-not-allowed' : 'click-shrink'}
        ${className}
        flex items-center justify-center
      `}
    >
      {DisplayIcon && <DisplayIcon className="mr-2 w-5 h-5 flex-shrink-0" />}
      <span>{children}</span>
    </button>
  );
}

// Временно отключено для отладки lazy loading
// Button.propTypes = {
//   children: PropTypes.node.isRequired,
//   variant: PropTypes.oneOf(['primary', 'secondary', 'danger', 'success']),
//   size: PropTypes.oneOf(['sm', 'md', 'lg']),
//   icon: PropTypes.elementType,
//   onClick: PropTypes.func,
//   disabled: PropTypes.bool,
//   className: PropTypes.string,
//   type: PropTypes.oneOf(['button', 'submit', 'reset'])
// };
