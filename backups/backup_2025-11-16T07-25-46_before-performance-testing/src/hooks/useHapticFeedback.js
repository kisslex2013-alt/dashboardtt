import { useCallback } from 'react'

/**
 * Хук для тактильной обратной связи (вибрация) на мобильных устройствах
 * 
 * Поддерживает различные паттерны вибрации для разных действий:
 * - light: легкая вибрация (для кликов)
 * - medium: средняя вибрация (для важных действий)
 * - heavy: сильная вибрация (для критических действий)
 * - success: паттерн успеха
 * - error: паттерн ошибки
 * 
 * @returns {Function} Функция для запуска вибрации
 */
export function useHapticFeedback() {
  const trigger = useCallback((pattern = 'light') => {
    // Проверяем поддержку вибрации
    if (!('vibrate' in navigator)) {
      return false
    }

    const patterns = {
      light: 10, // 10ms - легкая вибрация
      medium: 30, // 30ms - средняя вибрация
      heavy: 50, // 50ms - сильная вибрация
      success: [20, 50, 20], // Паттерн успеха: вибрация-пауза-вибрация
      error: [50, 30, 50, 30, 50], // Паттерн ошибки: длинная-короткая-длинная-короткая-длинная
    }

    const vibrationPattern = patterns[pattern] || patterns.light

    try {
      navigator.vibrate(vibrationPattern)
      return true
    } catch (error) {
      console.warn('Vibration failed:', error)
      return false
    }
  }, [])

  return trigger
}

