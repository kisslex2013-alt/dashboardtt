import { useState, useEffect, useCallback, useRef } from 'react';

/**
 * 🎓 ПОЯСНЕНИЕ ДЛЯ НАЧИНАЮЩИХ:
 * 
 * useCustomHook - это кастомный React хук.
 * Хуки - это функции которые начинаются с "use" и могут использовать другие хуки.
 * 
 * Этот хук делает [что делает хук]:
 * - Автоматически обновляет [что обновляет]
 * - Предоставляет простой API для [для чего]
 * - Отслеживает состояние [что отслеживает]
 * 
 * @param {Object} options - Опции хука
 * @param {string} [options.initialValue] - Начальное значение
 * @param {Function} [options.onChange] - Колбэк при изменении значения
 * @param {number} [options.debounceMs] - Задержка в миллисекундах
 * 
 * @returns {Object} Объект с методами и состоянием
 * @returns {string} returns.value - Текущее значение
 * @returns {Function} returns.setValue - Функция для установки значения
 * @returns {Function} returns.reset - Функция для сброса значения
 * @returns {boolean} returns.isLoading - Флаг загрузки
 * 
 * @example
 * // Простое использование
 * const { value, setValue } = useCustomHook({
 *   initialValue: 'default'
 * });
 * 
 * @example
 * // С колбэком
 * const { value, setValue, isLoading } = useCustomHook({
 *   initialValue: 'start',
 *   onChange: (newValue) => console.log('Changed:', newValue),
 *   debounceMs: 300
 * });
 */
export function useCustomHook({
  initialValue = '',
  onChange,
  debounceMs = 0
} = {}) {
  /**
   * 🎓 ПОЯСНЕНИЕ:
   * useState - хук для создания локального состояния.
   * Возвращает массив: [текущееЗначение, функцияОбновления]
   */
  const [value, setValueState] = useState(initialValue);
  const [isLoading, setIsLoading] = useState(false);
  
  /**
   * 🎓 ПОЯСНЕНИЕ:
   * useRef - хук для хранения значений которые не вызывают ререндер.
   * Здесь храним таймер для debounce.
   */
  const timeoutRef = useRef(null);
  const onChangeRef = useRef(onChange);
  
  /**
   * 🎓 ПОЯСНЕНИЕ:
   * Обновляем ref при изменении onChange, чтобы всегда использовать актуальную версию.
   */
  useEffect(() => {
    onChangeRef.current = onChange;
  }, [onChange]);
  
  /**
   * 🎓 ПОЯСНЕНИЕ:
   * useCallback - мемоизирует функцию, чтобы не создавать новую при каждом рендере.
   * Это оптимизация для производительности.
   */
  const setValue = useCallback((newValue) => {
    setValueState(newValue);
    
    // Debounce вызов onChange
    if (debounceMs > 0) {
      if (timeoutRef.current) {
        clearTimeout(timeoutRef.current);
      }
      
      timeoutRef.current = setTimeout(() => {
        if (onChangeRef.current) {
          onChangeRef.current(newValue);
        }
      }, debounceMs);
    } else if (onChangeRef.current) {
      onChangeRef.current(newValue);
    }
  }, [debounceMs]);
  
  /**
   * Функция для сброса значения
   */
  const reset = useCallback(() => {
    setValueState(initialValue);
    if (onChangeRef.current) {
      onChangeRef.current(initialValue);
    }
  }, [initialValue]);
  
  /**
   * 🎓 ПОЯСНЕНИЕ:
   * useEffect с cleanup функцией.
   * Cleanup выполняется при размонтировании компонента или перед следующим эффектом.
   */
  useEffect(() => {
    return () => {
      // Cleanup: очищаем таймер при размонтировании
      if (timeoutRef.current) {
        clearTimeout(timeoutRef.current);
      }
    };
  }, []);
  
  /**
   * 🎓 ПОЯСНЕНИЕ:
   * Возвращаем объект с методами и состоянием.
   * Это позволяет компонентам легко использовать хук.
   */
  return {
    value,
    setValue,
    reset,
    isLoading
  };
}

/**
 * 🎓 ИТОГОВЫЕ ПРАВИЛА ДЛЯ AI:
 * 
 * 1. Имя хука всегда начинается с "use"
 * 2. Используй useCallback для функций которые передаются в дочерние компоненты
 * 3. Используй useRef для значений которые не должны вызывать ререндер
 * 4. Всегда добавляй cleanup в useEffect (return функция)
 * 5. Зависимости в useCallback/useMemo/useEffect должны быть полными
 * 6. Документируй все возвращаемые значения в JSDoc
 * 7. Используй обучающие комментарии 🎓
 * 8. Возвращай объект с методами для удобства использования
 */

