import React, { useState, useRef, useEffect } from 'react';
import PropTypes from 'prop-types';

/**
 * 🕐 Кастомный компонент ввода времени с 24-часовым форматом
 * - Поддержка 24-часового формата (00:00 - 23:59)
 * - Валидация ввода
 * - Форматирование автоматическое
 */
// ИСПРАВЛЕНО: Добавлена поддержка forwardRef для доступа к input элементу
export const TimeInput = React.forwardRef(function TimeInput({ 
  value, 
  onChange, 
  placeholder = "чч:мм",
  className = "",
  error,
  onComplete // ИСПРАВЛЕНО: Добавлен callback для автофокуса
}, ref) {
  const [displayValue, setDisplayValue] = useState(value || '');
  const inputRef = useRef(null);
  
  // ИСПРАВЛЕНО: Поддержка внешнего ref
  useEffect(() => {
    if (ref) {
      if (typeof ref === 'function') {
        ref(inputRef.current);
      } else {
        ref.current = inputRef.current;
      }
    }
  }, [ref]);
  
  useEffect(() => {
    setDisplayValue(value || '');
  }, [value]);
  
  const formatTime = (input) => {
    // Удаляем все не-цифры
    const digits = input.replace(/\D/g, '');
    
    if (digits.length === 0) return '';
    if (digits.length <= 2) return digits;
    if (digits.length <= 4) {
      // Форматируем как HH:MM
      return `${digits.slice(0, 2)}:${digits.slice(2, 4)}`;
    }
    // Ограничиваем 4 цифрами
    return `${digits.slice(0, 2)}:${digits.slice(2, 4)}`;
  };
  
  const validateTime = (timeString) => {
    if (!timeString) return true;
    
    const [hours, minutes] = timeString.split(':').map(Number);
    
    // Проверяем валидность
    if (isNaN(hours) || isNaN(minutes)) return false;
    if (hours < 0 || hours > 23) return false;
    if (minutes < 0 || minutes > 59) return false;
    
    return true;
  };
  
  const handleChange = (e) => {
    const input = e.target.value;
    const formatted = formatTime(input);
    
    setDisplayValue(formatted);
    
    // Если время валидно и полное (HH:MM), вызываем onChange
    if (validateTime(formatted) && formatted.length === 5) {
      onChange(formatted);
      // ИСПРАВЛЕНО: Автоматический переход на следующее поле
      if (onComplete) {
        // Небольшая задержка для завершения форматирования
        setTimeout(() => {
          onComplete();
        }, 50);
      }
    } else if (formatted.length === 0) {
      onChange('');
    }
  };
  
  const handleBlur = () => {
    // При потере фокуса проверяем и корректируем значение
    if (displayValue && displayValue.length === 5) {
      const [hours, minutes] = displayValue.split(':').map(Number);
      
      // Корректируем если нужно
      let correctedHours = hours;
      let correctedMinutes = minutes;
      
      if (hours > 23) correctedHours = 23;
      if (minutes > 59) correctedMinutes = 59;
      
      const corrected = `${String(correctedHours).padStart(2, '0')}:${String(correctedMinutes).padStart(2, '0')}`;
      setDisplayValue(corrected);
      onChange(corrected);
    }
  };
  
  return (
    <input
      ref={inputRef}
      type="text"
      value={displayValue}
      onChange={handleChange}
      onBlur={handleBlur}
      placeholder={placeholder}
      maxLength={5}
      className={`
        w-full px-4 py-2
        ${error ? 'test-red-background' : 'bg-white/80 dark:bg-gray-800/80'}
        backdrop-blur-lg
        rounded-lg
        border-2 ${error ? 'border-red-500' : 'border-gray-300 dark:border-gray-600'}
        focus:outline-none focus:ring-2 focus:ring-blue-500
        transition-normal
        placeholder-gray-500 dark:placeholder-gray-400
        text-gray-900 dark:text-gray-100
        font-mono
        ${className}
      `}
    />
  );
});

TimeInput.propTypes = {
  value: PropTypes.string,
  onChange: PropTypes.func.isRequired,
  placeholder: PropTypes.string,
  className: PropTypes.string,
  error: PropTypes.string,
  onComplete: PropTypes.func // ИСПРАВЛЕНО: Добавлен prop для автофокуса
};

