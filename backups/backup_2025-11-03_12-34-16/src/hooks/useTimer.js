/**
 * 🎓 ПОЯСНЕНИЕ ДЛЯ НАЧИНАЮЩИХ:
 * 
 * Этот хук упрощает работу с таймером:
 * - Автоматически обновляет время каждую секунду
 * - Интегрирует звуковые уведомления
 * - Предоставляет простой API для запуска/остановки
 * - Отслеживает состояние таймера
 */

import { useEffect, useRef, useCallback } from 'react';
import { useTimerStore } from '../store/useTimerStore';
import { useEntriesStore } from '../store/useEntriesStore';
import { useSettingsStore } from '../store/useSettingsStore';
import { useSoundManager } from './useSound';
import { useFavicon } from './useFavicon';
import { calculateDuration, calculateEarned } from '../utils/calculations';
import { formatDate, formatTime } from '../utils/dateHelpers';
import { logger } from '../utils/logger';

/**
 * Хук для работы с таймером
 * @returns {Object} объект с методами и состоянием таймера
 */
export function useTimer() {
  const timerStore = useTimerStore();
  const { 
    activeTimer, 
    startTime, 
    elapsedTime, 
    isPaused,
    startTimer, 
    stopTimer, 
    updateElapsed,
    getFormattedTime,
    getCurrentElapsed,
    isRunning: isTimerRunning,
    pauseTimer,
    resumeTimer,
    resetTimer
  } = timerStore;
  
  const { addEntry } = useEntriesStore();
  const { categories, notifications } = useSettingsStore();
  const { playSound } = useSoundManager();
  const lastNotificationTimeRef = useRef(0);
  
  // Интеграция анимации фавикона
  useFavicon(!!activeTimer, isPaused);
  
  // Форматирование времени для заголовка (мемоизировано)
  const formatElapsedTime = useCallback((ms) => {
    const totalSeconds = Math.floor(ms / 1000);
    const hours = Math.floor(totalSeconds / 3600);
    const minutes = Math.floor((totalSeconds % 3600) / 60);
    const seconds = totalSeconds % 60;
    return `${hours.toString().padStart(2, '0')}:${minutes.toString().padStart(2, '0')}:${seconds.toString().padStart(2, '0')}`;
  }, []);
  
  // Обновление заголовка вкладки (работает даже когда вкладка в фоне)
  useEffect(() => {
    const updateTitle = () => {
      if (activeTimer && !isPaused) {
        const currentElapsed = getCurrentElapsed() * 1000;
        document.title = `${formatElapsedTime(currentElapsed)} - Работаем`;
      } else if (activeTimer && isPaused) {
        const currentElapsed = getCurrentElapsed() * 1000;
        document.title = `${formatElapsedTime(currentElapsed)} - Пауза`;
      } else {
        document.title = 'Time Tracker Dashboard';
      }
    };
    
    updateTitle();
    
    if (activeTimer) {
      const interval = setInterval(updateTitle, 1000);
      
      // Обработка активации вкладки - сразу обновляем заголовок
      const handleVisibilityChange = () => {
        if (document.visibilityState === 'visible') {
          // Сразу обновляем при активации вкладки
          updateTitle();
        }
      };
      
      document.addEventListener('visibilitychange', handleVisibilityChange);
      
      return () => {
        clearInterval(interval);
        document.removeEventListener('visibilitychange', handleVisibilityChange);
      };
    }
  }, [activeTimer, isPaused, formatElapsedTime, getCurrentElapsed]);
  
  // Автоматическое обновление времени каждую секунду (работает даже когда вкладка в фоне)
  useEffect(() => {
    if (!activeTimer || isPaused) {
      lastNotificationTimeRef.current = 0;
      return;
    }
    
    const interval = setInterval(() => {
      // Обновляем время даже если вкладка в фоне (getCurrentElapsed использует Date.now())
      updateElapsed();
      
      const currentElapsed = getCurrentElapsed();
      
      // Проверка на каждый час для звукового уведомления
      const hours = Math.floor(currentElapsed / 3600);
      const prevHours = Math.floor((currentElapsed - 1) / 3600);
      
      if (hours > prevHours && hours > 0) {
        // Звук проигрываем всегда, независимо от видимости вкладки
        playSound('hourlyAlert');
        // Логируем только если вкладка видима (чтобы не засорять консоль)
        if (document.visibilityState === 'visible') {
          logger.log(`🔔 Прошел ${hours} час(ов) работы`);
        }
      }
      
      // Периодические звуковые уведомления во время работы таймера
      if (notifications.soundNotificationsEnabled && notifications.notificationInterval > 0) {
        const notificationIntervalSeconds = notifications.notificationInterval * 60;
        const nextNotificationTarget = lastNotificationTimeRef.current + notificationIntervalSeconds;
        
        if (currentElapsed >= nextNotificationTarget) {
          const soundType = notifications.notificationSound || 'chime';
          // Звук проигрываем всегда, независимо от видимости вкладки (это основная функция уведомлений!)
          playSound(soundType);
          // Логируем только если вкладка видима (чтобы не засорять консоль)
          if (document.visibilityState === 'visible') {
            logger.log(`🔔 Звуковое уведомление (${notifications.notificationInterval} минут) - ${soundType}`);
          }
          lastNotificationTimeRef.current = Math.floor(currentElapsed / notificationIntervalSeconds) * notificationIntervalSeconds;
        }
      }
    }, 1000);
    
    // Обработка активации вкладки - обновляем время при возврате
    const handleVisibilityChange = () => {
      if (document.visibilityState === 'visible') {
        // При активации сразу обновляем время (на случай если интервал был замедлен)
        updateElapsed();
      }
    };
    
    document.addEventListener('visibilitychange', handleVisibilityChange);
    
    return () => {
      clearInterval(interval);
      document.removeEventListener('visibilitychange', handleVisibilityChange);
    };
  }, [activeTimer, isPaused, updateElapsed, getCurrentElapsed, playSound, notifications]);
  
  /**
   * Запускает таймер для указанной категории
   * @param {string} category - название категории работы
   */
  const start = (category) => {
    try {
      startTimer(category);
      lastNotificationTimeRef.current = 0; // Сброс времени последнего уведомления
      playSound('timerStart');
      logger.log(`⏱️ Таймер запущен для категории: ${category}`);
    } catch (error) {
      logger.error('Ошибка запуска таймера:', error);
    }
  };
  
  /**
   * Останавливает таймер и возвращает данные для создания записи
   * @returns {Object|null} объект с данными записи или null если таймер не запущен
   */
  const stop = () => {
    try {
      if (!activeTimer || !startTime) {
        logger.error('Таймер не запущен');
        return null;
      }
      
      const elapsed = stopTimer();
      playSound('timerStop');
      
      // Создаем объект с данными для записи (НЕ сохраняем в базу!)
      const now = new Date();
      const startDate = new Date(startTime);
      const durationHours = (elapsed / 3600).toFixed(2);
      
      // Находим категорию и ставку
      const category = categories.find(cat => cat.name === activeTimer);
      const rate = category?.rate || 1000;
      
      const entryData = {
        date: formatDate(startDate),
        start: formatTime(startDate),
        end: formatTime(now),
        duration: parseFloat(durationHours),
        category: activeTimer,
        description: `Работа по таймеру`,
        rate: rate,
        earned: parseFloat(calculateEarned(durationHours, rate)),
        isManual: false, // Запись из таймера
      };
      
      logger.log(`⏹️ Таймер остановлен. Данные для записи:`, entryData);
      logger.log(`   Время работы: ${durationHours} ч, Заработано: ${entryData.earned} ₽`);
      
      return entryData;
    } catch (error) {
      logger.error('Ошибка остановки таймера:', error);
      return null;
    }
  };
  
  /**
   * Ставит таймер на паузу
   */
  const pause = () => {
    try {
      pauseTimer();
      playSound('pause');
      logger.log('⏸️ Таймер поставлен на паузу');
    } catch (error) {
      logger.error('Ошибка паузы таймера:', error);
    }
  };
  
  /**
   * Возобновляет работу таймера
   */
  const resume = () => {
    try {
      resumeTimer();
      playSound('resume');
      logger.log('▶️ Таймер возобновлен');
    } catch (error) {
      logger.error('Ошибка возобновления таймера:', error);
    }
  };
  
  /**
   * Сбрасывает таймер
   */
  const reset = () => {
    try {
      resetTimer();
      playSound('reset');
      logger.log('🔄 Таймер сброшен');
    } catch (error) {
      logger.error('Ошибка сброса таймера:', error);
    }
  };
  
  /**
   * Получает текущее время в формате HH:MM:SS
   * @returns {string} отформатированное время
   */
  const getTime = () => {
    return getFormattedTime();
  };
  
  /**
   * Получает текущее время в секундах
   * @returns {number} время в секундах
   */
  const getSeconds = () => {
    return getCurrentElapsed();
  };
  
  /**
   * Получает количество полных часов
   * @returns {number} количество часов
   */
  const getHours = () => {
    return Math.floor(getCurrentElapsed() / 3600);
  };
  
  /**
   * Получает количество полных минут
   * @returns {number} количество минут
   */
  const getMinutes = () => {
    return Math.floor((getCurrentElapsed() % 3600) / 60);
  };
  
  /**
   * Получает количество секунд
   * @returns {number} количество секунд
   */
  const getSecondsOnly = () => {
    return Math.floor(getCurrentElapsed() % 60);
  };
  
  /**
   * Проверяет, работает ли таймер
   * @returns {boolean} true если таймер активен
   */
  const isRunning = () => {
    return isTimerRunning();
  };
  
  /**
   * Проверяет, на паузе ли таймер
   * @returns {boolean} true если таймер на паузе
   */
  const isPausedTimer = () => {
    return isPaused;
  };
  
  /**
   * Получает информацию о таймере
   * @returns {Object} объект с информацией о таймере
   */
  const getInfo = () => {
    return {
      activeTimer,
      startTime,
      elapsedTime: getCurrentElapsed(),
      formattedTime: getFormattedTime(),
      isRunning: isTimerRunning(),
      isPaused: isPausedTimer(),
      hours: getHours(),
      minutes: getMinutes(),
      seconds: getSecondsOnly(),
    };
  };
  
  return {
    // Основные методы
    start,
    stop,
    pause,
    resume,
    reset,
    
    // Получение времени
    getTime,
    getSeconds,
    getHours,
    getMinutes,
    getSecondsOnly,
    
    // Состояние
    activeTimer,
    elapsedTime: getCurrentElapsed(),
    isRunning: isTimerRunning(),
    isPaused: isPausedTimer(),
    
    // Дополнительная информация
    getInfo,
  };
}
