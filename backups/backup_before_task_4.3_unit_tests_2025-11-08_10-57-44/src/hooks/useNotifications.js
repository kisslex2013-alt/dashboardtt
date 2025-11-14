/**
 * 🎓 ПОЯСНЕНИЕ ДЛЯ НАЧИНАЮЩИХ:
 * 
 * Этот хук упрощает работу с уведомлениями:
 * - Показывает toast уведомления
 * - Автоматически удаляет уведомления по таймеру
 * - Предоставляет типизированные методы для разных типов уведомлений
 * - Интегрируется с UI хранилищем
 */

import { useUIStore } from '../store/useUIStore';
import { logger } from '../utils/logger';

/**
 * 🔔 Хук для работы с уведомлениями
 * 
 * 🎓 ПОЯСНЕНИЕ ДЛЯ НАЧИНАЮЩИХ:
 * 
 * Этот хук упрощает работу с уведомлениями (toast сообщениями).
 * Предоставляет типизированные методы для разных типов уведомлений
 * и автоматически управляет их жизненным циклом.
 * 
 * Уведомления автоматически удаляются по истечении указанного времени.
 * Поддерживает специальные типы: подтверждение, прогресс, загрузка.
 * 
 * @returns {Object} объект с методами для показа уведомлений:
 * @returns {Function} returns.showNotification - показывает уведомление
 * @param {string} message - текст уведомления
 * @param {string} [type='info'] - тип: 'success', 'error', 'warning', 'info'
 * @param {number} [duration=3000] - длительность показа в мс (0 = бесконечно)
 * @returns {Function} returns.showSuccess - показывает уведомление об успехе
 * @returns {Function} returns.showError - показывает уведомление об ошибке
 * @returns {Function} returns.showWarning - показывает предупреждение
 * @returns {Function} returns.showInfo - показывает информационное уведомление
 * @returns {Function} returns.hideNotification - скрывает уведомление по ID
 * @returns {Function} returns.clearAll - удаляет все уведомления
 * @returns {Function} returns.clearByType - удаляет уведомления определенного типа
 * @returns {Function} returns.getCount - получает количество активных уведомлений
 * @returns {Function} returns.showConfirm - показывает уведомление с подтверждением
 * @returns {Function} returns.showProgress - показывает прогресс-бар
 * @returns {Function} returns.showLoading - показывает уведомление о загрузке
 * @returns {Array} returns.notifications - массив активных уведомлений
 * 
 * @example
 * function MyComponent() {
 *   const { showSuccess, showError } = useNotifications();
 *   
 *   const handleSave = async () => {
 *     try {
 *       await saveData();
 *       showSuccess('Данные сохранены');
 *     } catch (error) {
 *       showError('Ошибка сохранения');
 *     }
 *   };
 * }
 */
export function useNotifications() {
  const { addNotification, removeNotification, notifications } = useUIStore();
  
  /**
   * Показывает уведомление
   * @param {string} message - текст уведомления
   * @param {string} type - тип уведомления (success, error, warning, info)
   * @param {number} duration - длительность показа в миллисекундах (0 = бесконечно)
   * @returns {string} ID уведомления
   */
  const showNotification = (message, type = 'info', duration = 3000) => {
    const notification = {
      id: Date.now() + Math.random(), // Уникальный ID
      message,
      type,
      duration,
      timestamp: new Date().toISOString(),
    };
    
    addNotification(notification);
    
    // Автоматическое удаление по таймеру
    if (duration > 0) {
      setTimeout(() => {
        removeNotification(notification.id);
      }, duration);
    }
    
    logger.log(`🔔 Уведомление [${type}]: ${message}`);
    return notification.id;
  };
  
  /**
   * Показывает уведомление об успехе
   * @param {string} message - текст уведомления
   * @param {number} duration - длительность показа
   * @returns {string} ID уведомления
   */
  const showSuccess = (message, duration = 3000) => {
    return showNotification(message, 'success', duration);
  };
  
  /**
   * Показывает уведомление об ошибке
   * @param {string} message - текст уведомления
   * @param {number} duration - длительность показа
   * @returns {string} ID уведомления
   */
  const showError = (message, duration = 5000) => {
    return showNotification(message, 'error', duration);
  };
  
  /**
   * Показывает предупреждение
   * @param {string} message - текст уведомления
   * @param {number} duration - длительность показа
   * @returns {string} ID уведомления
   */
  const showWarning = (message, duration = 4000) => {
    return showNotification(message, 'warning', duration);
  };
  
  /**
   * Показывает информационное уведомление
   * @param {string} message - текст уведомления
   * @param {number} duration - длительность показа
   * @returns {string} ID уведомления
   */
  const showInfo = (message, duration = 3000) => {
    return showNotification(message, 'info', duration);
  };
  
  /**
   * Удаляет уведомление по ID
   * @param {string} id - ID уведомления
   */
  const hideNotification = (id) => {
    removeNotification(id);
    logger.log(`🔕 Уведомление ${id} скрыто`);
  };
  
  /**
   * Удаляет все уведомления
   */
  const clearAll = () => {
    notifications.forEach(notification => {
      removeNotification(notification.id);
    });
    logger.log('🔕 Все уведомления очищены');
  };
  
  /**
   * Удаляет все уведомления определенного типа
   * @param {string} type - тип уведомлений для удаления
   */
  const clearByType = (type) => {
    notifications
      .filter(notification => notification.type === type)
      .forEach(notification => {
        removeNotification(notification.id);
      });
    logger.log(`🔕 Уведомления типа ${type} очищены`);
  };
  
  /**
   * Получает количество активных уведомлений
   * @returns {number} количество уведомлений
   */
  const getCount = () => {
    return notifications.length;
  };
  
  /**
   * Получает количество уведомлений определенного типа
   * @param {string} type - тип уведомлений
   * @returns {number} количество уведомлений
   */
  const getCountByType = (type) => {
    return notifications.filter(notification => notification.type === type).length;
  };
  
  /**
   * Проверяет, есть ли уведомления определенного типа
   * @param {string} type - тип уведомлений
   * @returns {boolean} true если есть уведомления
   */
  const hasType = (type) => {
    return notifications.some(notification => notification.type === type);
  };
  
  /**
   * Получает все активные уведомления
   * @returns {Array} массив уведомлений
   */
  const getAll = () => {
    return [...notifications];
  };
  
  /**
   * Получает уведомления определенного типа
   * @param {string} type - тип уведомлений
   * @returns {Array} массив уведомлений
   */
  const getByType = (type) => {
    return notifications.filter(notification => notification.type === type);
  };
  
  /**
   * Показывает уведомление с подтверждением
   * @param {string} message - текст уведомления
   * @param {Function} onConfirm - функция при подтверждении
   * @param {Function} onCancel - функция при отмене
   * @returns {string} ID уведомления
   */
  const showConfirm = (message, onConfirm, onCancel) => {
    const notification = {
      id: Date.now() + Math.random(),
      message,
      type: 'confirm',
      duration: 0, // Не удаляется автоматически
      timestamp: new Date().toISOString(),
      onConfirm,
      onCancel,
    };
    
    addNotification(notification);
    logger.log(`❓ Уведомление с подтверждением: ${message}`);
    return notification.id;
  };
  
  /**
   * Показывает прогресс-бар
   * @param {string} message - текст уведомления
   * @param {number} progress - прогресс от 0 до 100
   * @returns {string} ID уведомления
   */
  const showProgress = (message, progress = 0) => {
    const notification = {
      id: Date.now() + Math.random(),
      message,
      type: 'progress',
      duration: 0, // Не удаляется автоматически
      timestamp: new Date().toISOString(),
      progress: Math.max(0, Math.min(100, progress)),
    };
    
    addNotification(notification);
    logger.log(`📊 Прогресс [${progress}%]: ${message}`);
    return notification.id;
  };
  
  /**
   * Обновляет прогресс существующего уведомления
   * @param {string} id - ID уведомления
   * @param {number} progress - новый прогресс от 0 до 100
   */
  const updateProgress = (id, progress) => {
    // ✅ СТАНДАРТИЗАЦИЯ ID: Конвертируем в строку для корректного сравнения
    const idString = String(id);
    const notification = notifications.find(n => String(n.id) === idString);
    if (notification && notification.type === 'progress') {
      notification.progress = Math.max(0, Math.min(100, progress));
      logger.log(`📊 Прогресс обновлен [${progress}%]: ${notification.message}`);
    }
  };
  
  /**
   * Показывает уведомление о загрузке
   * @param {string} message - текст уведомления
   * @returns {string} ID уведомления
   */
  const showLoading = (message = 'Загрузка...') => {
    return showProgress(message, 0);
  };
  
  /**
   * Завершает уведомление о загрузке
   * @param {string} id - ID уведомления
   * @param {string} successMessage - сообщение об успехе
   */
  const finishLoading = (id, successMessage = 'Загрузка завершена') => {
    updateProgress(id, 100);
    setTimeout(() => {
      hideNotification(id);
      showSuccess(successMessage);
    }, 500);
  };
  
  return {
    // Основные методы
    showNotification,
    showSuccess,
    showError,
    showWarning,
    showInfo,
    
    // Управление уведомлениями
    hideNotification,
    clearAll,
    clearByType,
    
    // Информация
    getCount,
    getCountByType,
    hasType,
    getAll,
    getByType,
    
    // Специальные типы
    showConfirm,
    showProgress,
    updateProgress,
    showLoading,
    finishLoading,
    
    // Состояние
    notifications,
  };
}
