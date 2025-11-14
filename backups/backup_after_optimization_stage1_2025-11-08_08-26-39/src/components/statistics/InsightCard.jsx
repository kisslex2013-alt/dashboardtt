import React, { memo, Children, isValidElement, cloneElement } from 'react';
import { AnimatedText } from '../ui/AnimatedText';
import { AnimatedHighlight } from '../ui/AnimatedHighlight';
import { AnimatedCascadeDrop } from '../ui/AnimatedCascadeDrop';
import { AnimatedFlicker } from '../ui/AnimatedFlicker';
import { AnimatedDate } from '../ui/AnimatedDate';

/**
 * 💡 Карточка одного инсайта
 * 
 * Отображает автоматически сгенерированный инсайт с:
 * - Градиентным фоном
 * - Полупрозрачной иконкой в правом нижнем углу
 * - Текстом с тенью для читаемости
 * - Hover эффектом с свечением (Dark Glass стиль)
 * - Выделением цифр цветом для лучшей читаемости
 * - Анимацией текста и чисел при раскрытии аккордеона
 * 
 * Оптимизирован с React.memo для предотвращения лишних ре-рендеров
 * 
 * @param {string} title - Заголовок инсайта
 * @param {string|ReactNode} description - Описание инсайта
 * @param {Component} icon - React компонент иконки
 * @param {string} gradient - CSS класс градиента
 * @param {string} borderColor - Цвет границы (inline style для динамичности)
 * @param {string} iconColor - Цвет иконки (inline style для динамичности)
 * @param {string} glowClass - CSS класс для эффекта свечения (glow-blue, glow-green, и т.д.)
 * @param {string} highlightColorClass - CSS класс для цвета выделенного текста (text-blue-400, и т.д.)
 * @param {number} animationDelay - Задержка анимации в секундах
 * @param {boolean} shouldAnimate - Запускать ли анимацию
 */
export const InsightCard = memo(function InsightCard({ 
  title, 
  description, 
  icon: Icon, 
  gradient, 
  borderColor, 
  iconColor, 
  glowClass, 
  highlightColorClass, 
  animationDelay = 0,
  shouldAnimate = true 
}) {
  // Функция для выделения цифр и важных значений в тексте с анимацией
  const highlightNumbers = (text, shouldAnimateProp = true, delay = 0) => {
    // Разбиваем текст на части, выделяя цифры, проценты, валюту, время и дни недели
    // Важно: сохраняем пробелы вокруг времени, чтобы не потерять их
    const parts = text.split(/(\d+[\s,.]?\d*\s*₽|\d+[\s,.]?\d*\s*%|\d+[\s,.]?\d*\s*ч|\d{1,2}:\d{2}|\b[А-Яа-я]{2}\b)/g);
    
    const result = [];
    parts.forEach((part, index) => {
      // Пропускаем пустые части
      if (!part) return;
      
      // Проверяем, является ли часть цифрой/значением
      const isNumber = /\d/.test(part) || /^[А-Яа-я]{2}$/.test(part.trim());
      
      if (isNumber && part.trim()) {
        // Сохраняем пробелы перед и после числа из исходной части
        const trimmedPart = part.trim();
        const leadingSpace = part.startsWith(' ') ? ' ' : '';
        const trailingSpace = part.endsWith(' ') ? ' ' : '';
        
        result.push(
          <React.Fragment key={`fragment-${index}`}>
            {leadingSpace && <span key={`space-before-${index}`}>{leadingSpace}</span>}
            <AnimatedHighlight
              key={`highlight-${index}`}
              value={trimmedPart}
              className={`font-bold ${highlightColorClass} group-hover:drop-shadow-[0_2px_4px_rgba(0,0,0,0.4)] group-hover:brightness-110 transition-all duration-300`}
              shouldAnimate={shouldAnimateProp}
              delay={delay + index * 0.05}
            />
            {trailingSpace && <span key={`space-after-${index}`}>{trailingSpace}</span>}
          </React.Fragment>
        );
      } else {
        result.push(
          <AnimatedText 
            key={`text-${index}`}
            shouldAnimate={shouldAnimateProp}
            delay={delay + index * 0.02}
          >
            {part}
          </AnimatedText>
        );
      }
    });
    
    return result;
  };

  // Функция для рекурсивной обработки JSX элементов с анимацией
  const processJSXElement = (element, shouldAnimateProp = true, delay = 0, index = 0) => {
    // Если это не React элемент, обрабатываем как примитив
    if (!isValidElement(element)) {
      // Если это строка, обрабатываем как текст
      if (typeof element === 'string') {
        return highlightNumbers(element, shouldAnimateProp, delay);
      }
      // Если это число или другой примитив
      if (typeof element === 'number' || typeof element === 'boolean') {
        return (
          <AnimatedText 
            key={index}
            shouldAnimate={shouldAnimateProp}
            delay={delay}
          >
            {String(element)}
          </AnimatedText>
        );
      }
      return element;
    }

    // Если это React элемент, рекурсивно обрабатываем его children
    const elementType = element.type;
    const elementProps = element.props || {};
    const { children, className, ...restProps } = elementProps;

    // Если это Fragment, обрабатываем только children
    if (elementType === React.Fragment || elementType?.toString() === 'Symbol(react.fragment)') {
      const processedFragmentChildren = Children.map(children, (child, childIndex) => {
        return processJSXElement(child, shouldAnimateProp, delay + childIndex * 0.02, childIndex);
      });
      // Возвращаем массив обработанных children (React может рендерить массивы)
      return processedFragmentChildren;
    }

    // Если это <span> с выделенным классом, заменяем на AnimatedHighlight или AnimatedMatrixText
    if (elementType === 'span' && className && className.includes('font-bold')) {
      // Рекурсивно извлекаем текст из children (может быть строка, массив, или React элемент)
      const extractText = (child) => {
        if (typeof child === 'string') return child;
        if (typeof child === 'number') return String(child);
        if (Array.isArray(child)) return child.map(extractText).join('');
        if (isValidElement(child)) {
          // Если это React элемент, извлекаем текст из его children
          const childChildren = child.props?.children;
          if (childChildren) return extractText(childChildren);
          return '';
        }
        return String(child || '');
      };
      
      const childText = extractText(children);
      
      // Проверяем, является ли это датой или текстом без чисел
      const isDate = /^\d{1,2}\.\d{1,2}\.\d{4}$/.test(childText.trim());
      const isTextOnly = !/\d/.test(childText) && childText.length > 0;
      
      // Для даты используем специальную анимацию
      if (isDate) {
        return (
          <AnimatedDate
            key={index}
            dateString={childText.trim()}
            className={`${className} group-hover:drop-shadow-[0_2px_4px_rgba(0,0,0,0.4)] group-hover:brightness-110 transition-all duration-300`}
            shouldAnimate={shouldAnimateProp}
            delay={delay + index * 0.05}
          />
        );
      }
      
      // Для текста без чисел (например, "растёт") используем мерцание
      if (isTextOnly) {
        return (
          <AnimatedFlicker
            key={index}
            text={childText}
            className={`${className} group-hover:drop-shadow-[0_2px_4px_rgba(0,0,0,0.4)] group-hover:brightness-110 transition-all duration-300`}
            shouldAnimate={shouldAnimateProp}
            delay={delay + index * 0.05}
            letterDelay={0.05}
            hasGlow={true}
            longFlicker={false}
          />
        );
      }
      
      // Для чисел используем AnimatedHighlight
      return (
        <AnimatedHighlight
          key={index}
          value={childText}
          className={`${className} group-hover:drop-shadow-[0_2px_4px_rgba(0,0,0,0.4)] group-hover:brightness-110 transition-all duration-300`}
          shouldAnimate={shouldAnimateProp}
          delay={delay + index * 0.05}
        />
      );
    }

    // Для остальных элементов рекурсивно обрабатываем children
    const processedChildren = Children.map(children || [], (child, childIndex) => {
      return processJSXElement(child, shouldAnimateProp, delay + childIndex * 0.02, childIndex);
    });

    return cloneElement(element, restProps, processedChildren);
  };

  // Определяем цвет для hover эффектов на основе highlightColorClass
  const getHoverBorderClass = () => {
    if (highlightColorClass?.includes('blue')) return 'hover:border-blue-500 dark:hover:border-blue-400';
    if (highlightColorClass?.includes('purple')) return 'hover:border-purple-500 dark:hover:border-purple-400';
    if (highlightColorClass?.includes('green')) return 'hover:border-green-500 dark:hover:border-green-400';
    if (highlightColorClass?.includes('red')) return 'hover:border-red-500 dark:hover:border-red-400';
    if (highlightColorClass?.includes('orange')) return 'hover:border-orange-500 dark:hover:border-orange-400';
    if (highlightColorClass?.includes('yellow')) return 'hover:border-yellow-500 dark:hover:border-yellow-400';
    if (highlightColorClass?.includes('teal')) return 'hover:border-teal-500 dark:hover:border-teal-400';
    return 'hover:border-gray-500 dark:hover:border-gray-400';
  };
  
  const getHoverShadowClass = () => {
    if (highlightColorClass?.includes('blue')) return 'hover:shadow-lg hover:shadow-blue-500/20';
    if (highlightColorClass?.includes('purple')) return 'hover:shadow-lg hover:shadow-purple-500/20';
    if (highlightColorClass?.includes('green')) return 'hover:shadow-lg hover:shadow-green-500/20';
    if (highlightColorClass?.includes('red')) return 'hover:shadow-lg hover:shadow-red-500/20';
    if (highlightColorClass?.includes('orange')) return 'hover:shadow-lg hover:shadow-orange-500/20';
    if (highlightColorClass?.includes('yellow')) return 'hover:shadow-lg hover:shadow-yellow-500/20';
    if (highlightColorClass?.includes('teal')) return 'hover:shadow-lg hover:shadow-teal-500/20';
    return 'hover:shadow-lg hover:shadow-gray-500/20';
  };
  
  const getIconBaseClass = () => {
    if (highlightColorClass?.includes('blue')) return 'text-blue-500/50 dark:text-blue-400/40';
    if (highlightColorClass?.includes('purple')) return 'text-purple-500/50 dark:text-purple-400/40';
    if (highlightColorClass?.includes('green')) return 'text-green-500/50 dark:text-green-400/40';
    if (highlightColorClass?.includes('red')) return 'text-red-500/50 dark:text-red-400/40';
    if (highlightColorClass?.includes('orange')) return 'text-orange-500/50 dark:text-orange-400/40';
    if (highlightColorClass?.includes('yellow')) return 'text-yellow-500/50 dark:text-yellow-400/40';
    if (highlightColorClass?.includes('teal')) return 'text-teal-500/50 dark:text-teal-400/40';
    return 'text-gray-500/50 dark:text-gray-400/40';
  };
  
  const getIconHoverClass = () => {
    if (highlightColorClass?.includes('blue')) return 'group-hover:text-blue-500/80 dark:group-hover:text-blue-400/70 group-hover:scale-110';
    if (highlightColorClass?.includes('purple')) return 'group-hover:text-purple-500/80 dark:group-hover:text-purple-400/70 group-hover:scale-110';
    if (highlightColorClass?.includes('green')) return 'group-hover:text-green-500/80 dark:group-hover:text-green-400/70 group-hover:scale-110';
    if (highlightColorClass?.includes('red')) return 'group-hover:text-red-500/80 dark:group-hover:text-red-400/70 group-hover:scale-110';
    if (highlightColorClass?.includes('orange')) return 'group-hover:text-orange-500/80 dark:group-hover:text-orange-400/70 group-hover:scale-110';
    if (highlightColorClass?.includes('yellow')) return 'group-hover:text-yellow-500/80 dark:group-hover:text-yellow-400/70 group-hover:scale-110';
    if (highlightColorClass?.includes('teal')) return 'group-hover:text-teal-500/80 dark:group-hover:text-teal-400/70 group-hover:scale-110';
    return 'group-hover:text-gray-500/80 dark:group-hover:text-gray-400/70 group-hover:scale-110';
  };

  return (
    <div 
      className={`
        glass-card
        relative overflow-hidden rounded-xl p-4 text-white 
        ${glowClass}
        ${gradient} 
        border border-transparent hover:border-opacity-100
        ${getHoverBorderClass()}
        ${getHoverShadowClass()}
        transition-all duration-300
        flex flex-col justify-between min-h-[120px]
        group
      `}
      style={{ borderColor }}
    >
      {/* Иконка в правом нижнем углу (большая, полупрозрачная) */}
      {Icon && (
        <Icon 
          className={`absolute right-2 bottom-2 w-16 h-16 pointer-events-none transition-all duration-300 ${getIconBaseClass()} ${getIconHoverClass()}`}
          size={64}
          strokeWidth={2}
          fill="none"
        />
      )}
      
      {/* Текст внизу карточки */}
      <div className="relative z-10">
        <h3 
          className={`font-bold text-sm mb-1 ${highlightColorClass || 'text-gray-900 dark:text-white'}`}
          style={{ textShadow: '0 1px 2px rgba(0,0,0,0.1)' }}
        >
          <AnimatedText 
            shouldAnimate={shouldAnimate}
            delay={0.15 + animationDelay}
          >
            {title}
          </AnimatedText>
        </h3>
        <p 
          className="text-xs text-gray-900 dark:text-white leading-relaxed" 
          style={{ textShadow: '0 1px 2px rgba(0,0,0,0.1)' }}
        >
          {typeof description === 'string' 
            ? highlightNumbers(description, shouldAnimate, animationDelay) 
            : processJSXElement(description, shouldAnimate, animationDelay)}
        </p>
      </div>
    </div>
  );
});
