import { memo } from 'react';

/**
 * 💡 Карточка одного инсайта
 * 
 * Отображает автоматически сгенерированный инсайт с:
 * - Градиентным фоном
 * - Полупрозрачной иконкой в правом нижнем углу
 * - Текстом с тенью для читаемости
 * - Hover эффектом с свечением (Dark Glass стиль)
 * - Выделением цифр цветом для лучшей читаемости
 * 
 * Оптимизирован с React.memo для предотвращения лишних ре-рендеров
 * 
 * @param {string} title - Заголовок инсайта
 * @param {string} description - Описание инсайта
 * @param {Component} icon - React компонент иконки
 * @param {string} gradient - CSS класс градиента
 * @param {string} borderColor - Цвет границы (inline style для динамичности)
 * @param {string} iconColor - Цвет иконки (inline style для динамичности)
 * @param {string} glowClass - CSS класс для эффекта свечения (glow-blue, glow-green, и т.д.)
 * @param {string} highlightColorClass - CSS класс для цвета выделенного текста (text-blue-400, и т.д.)
 */
export const InsightCard = memo(function InsightCard({ title, description, icon: Icon, gradient, borderColor, iconColor, glowClass, highlightColorClass, animationDelay = 0 }) {
  // Функция для выделения цифр и важных значений в тексте
  const highlightNumbers = (text) => {
    // Разбиваем текст на части, выделяя цифры, проценты, валюту и дни недели
    const parts = text.split(/(\d+[\s,.]?\d*\s*₽|\d+[\s,.]?\d*\s*%|\d+[\s,.]?\d*\s*ч|\d+:\d+|\b[А-Яа-я]{2}\b)/g);
    
    return parts.map((part, index) => {
      // Проверяем, является ли часть цифрой/значением
      const isNumber = /\d/.test(part) || /^[А-Яа-я]{2}$/.test(part.trim());
      
      if (isNumber && part.trim()) {
        return (
          <span 
            key={index} 
            className={`font-bold ${highlightColorClass}`}
          >
            {part}
          </span>
        );
      }
      return part;
    });
  };

  return (
    <div 
      className={`
        glass-card
        relative overflow-hidden rounded-xl p-4 text-white 
        ${glowClass}
        ${gradient} 
        border
        flex flex-col justify-between min-h-[120px]
      `}
      style={{ borderColor }}
    >
      {/* Иконка в правом нижнем углу (большая, полупрозрачная) */}
      <div 
        className="absolute right-4 bottom-4 w-16 h-16 opacity-50"
        style={{ color: iconColor }}
      >
        {Icon && <Icon size={64} />}
      </div>
      
      {/* Текст внизу карточки */}
      <div className="relative z-10">
        <h3 
          className="font-bold text-sm mb-1 text-gray-900 dark:text-white opacity-0 animate-fade-in" 
          style={{ textShadow: '0 1px 2px rgba(0,0,0,0.1)', animationDelay: `${0.15 + animationDelay}s`, animationFillMode: 'forwards' }}
        >
          {title}
        </h3>
        <p 
          className="text-xs text-gray-900 dark:text-white leading-relaxed opacity-0 animate-fade-in" 
          style={{ textShadow: '0 1px 2px rgba(0,0,0,0.1)', animationDelay: `${0.2 + animationDelay}s`, animationFillMode: 'forwards' }}
        >
          {typeof description === 'string' ? highlightNumbers(description) : description}
        </p>
      </div>
    </div>
  );
});
