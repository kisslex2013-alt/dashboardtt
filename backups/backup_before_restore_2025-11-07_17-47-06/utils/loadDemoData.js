/**
 * 🎓 ПОЯСНЕНИЕ ДЛЯ НАЧИНАЮЩИХ:
 * 
 * Этот файл содержит утилиту для загрузки демонстрационных тестовых данных.
 * Тестовые данные используются для визуального показа функционала приложения
 * при первом запуске.
 * 
 * При загрузке тестовых данных происходит:
 * 1. Загрузка JSON файла с тестовыми данными
 * 2. Преобразование данных в формат приложения
 * 3. Вычисление длительности из времени начала и окончания
 * 4. Нормализация полей категорий
 */

import { calculateDuration } from './calculations';
import { logger } from './logger';

/**
 * Загружает и обрабатывает тестовые демонстрационные данные
 * @returns {Promise<Array>} массив обработанных записей
 */
export async function loadDemoData() {
  try {
    // Загружаем JSON файл с тестовыми данными
    // В Vite можно использовать импорт JSON напрямую или fetch
    const response = await fetch('/test-data-sample.json');
    
    if (!response.ok) {
      throw new Error(`Не удалось загрузить тестовые данные: ${response.status}`);
    }
    
    const data = await response.json();
    const rawEntries = data.entries || [];
    
    logger.log('📥 Загружено тестовых записей:', rawEntries.length);
    
    // Обрабатываем каждую запись
    const processedEntries = rawEntries.map((entry, index) => {
      // Преобразуем categoryId → category
      const category = entry.categoryId || entry.category || 'remix';
      
      // Вычисляем duration из start и end, если отсутствует
      let duration = entry.duration;
      if (!duration && entry.start && entry.end) {
        duration = calculateDuration(entry.start, entry.end);
      } else if (!duration) {
        duration = '0.00';
      }
      
      // Преобразуем duration в строку с 2 знаками после запятой
      if (typeof duration === 'number') {
        duration = duration.toFixed(2);
      }
      
      // Обрабатываем перерывы
      // breakMinutes - количество минут перерыва
      // breakAfter - время перерыва в формате HH:MM
      // Если есть breakMinutes, но нет breakAfter, можно оставить как есть
      // Если есть breakAfter, можно преобразовать в breakMinutes для консистентности
      let breakMinutes = entry.breakMinutes;
      if (!breakMinutes && entry.breakAfter) {
        // Преобразуем breakAfter (HH:MM) в минуты
        const [hours, minutes] = entry.breakAfter.split(':').map(Number);
        breakMinutes = hours * 60 + minutes;
      }
      
      // Создаем обработанную запись
      const processedEntry = {
        id: entry.id || `demo-${Date.now()}-${index}`, // Генерируем ID если отсутствует
        date: entry.date,
        start: entry.start || '',
        end: entry.end || '',
        category: category, // Используем category вместо categoryId
        categoryId: category, // Оставляем и categoryId для совместимости
        rate: entry.rate ? parseFloat(entry.rate) : 0,
        earned: entry.earned ? parseFloat(entry.earned) : 0,
        duration: duration,
        ...(breakMinutes !== undefined && { breakMinutes }),
        ...(entry.breakAfter && { breakAfter: entry.breakAfter }),
        ...(entry.description && { description: entry.description }),
        // Добавляем метаданные для идентификации тестовых данных
        _isDemoData: true,
        createdAt: entry.createdAt || new Date(entry.date).toISOString(),
        updatedAt: entry.updatedAt || new Date().toISOString(),
      };
      
      return processedEntry;
    });
    
    logger.log('✅ Обработано тестовых записей:', processedEntries.length);
    
    return processedEntries;
  } catch (error) {
    logger.error('❌ Ошибка загрузки тестовых данных:', error);
    throw error;
  }
}

