import { useState, useEffect, useCallback, useRef } from 'react';
import { DEFAULT_GRID_COLUMN_WIDTHS, DEFAULT_TABLE_COLUMN_WIDTHS } from '../constants/columnWidths';

/**
 * 🔧 Универсальный хук для изменения ширины столбцов (Grid и Table)
 * 
 * 🎓 ПОЯСНЕНИЕ ДЛЯ НАЧИНАЮЩИХ:
 * 
 * Этот хук позволяет изменять ширину столбцов в двух режимах:
 * 1. **Grid режим** - для заголовков аккордеонов (управление marginLeft)
 * 2. **Table режим** - для таблиц внутри аккордеонов (управление width)
 * 
 * Режим активируется по горячей клавише Alt+Shift+R и показывает разделители
 * между столбцами, которые можно перетаскивать мышкой.
 * 
 * Настройки автоматически сохраняются в localStorage и восстанавливаются
 * при следующем открытии приложения.
 * 
 * @param {Object} options - опции хука
 * @param {string} [options.gridStorageKey='listview-grid-column-widths'] - ключ для сохранения grid настроек
 * @param {string} [options.tableStorageKey='listview-table-column-widths'] - ключ для сохранения table настроек
 * @param {Object} [options.defaultGridWidths] - дефолтные значения для grid
 * @param {Object} [options.defaultTableWidths] - дефолтные значения для table
 * @returns {Object} объект с состоянием и методами управления
 * 
 * @example
 * const {
 *   resizeMode,
 *   gridWidths,
 *   tableWidths,
 *   handleDragStart,
 *   handleDrag,
 *   handleDragEnd,
 *   resetGridWidths,
 *   resetTableWidths
 * } = useColumnResize();
 */
export function useColumnResize(options = {}) {
  const {
    gridStorageKey = 'listview-grid-column-widths',
    tableStorageKey = 'listview-table-column-widths',
    defaultGridStorageKey = 'default-grid-column-widths',
    defaultTableStorageKey = 'default-table-column-widths',
    defaultGridWidths = DEFAULT_GRID_COLUMN_WIDTHS,
    defaultTableWidths = DEFAULT_TABLE_COLUMN_WIDTHS
  } = options;
  
  // Функция для загрузки дефолтных значений (из localStorage или hardcoded)
  const loadDefaultGridWidths = useCallback(() => {
    try {
      const saved = localStorage.getItem(defaultGridStorageKey);
      return saved ? JSON.parse(saved) : defaultGridWidths;
    } catch (error) {
      console.error('Ошибка загрузки дефолтных grid настроек:', error);
      return defaultGridWidths;
    }
  }, [defaultGridStorageKey, defaultGridWidths]);
  
  const loadDefaultTableWidths = useCallback(() => {
    try {
      const saved = localStorage.getItem(defaultTableStorageKey);
      return saved ? JSON.parse(saved) : defaultTableWidths;
    } catch (error) {
      console.error('Ошибка загрузки дефолтных table настроек:', error);
      return defaultTableWidths;
    }
  }, [defaultTableStorageKey, defaultTableWidths]);

  // Режим изменения размеров (активируется по Alt+Shift+R)
  const [resizeMode, setResizeMode] = useState(false);
  
  // Текущие ширины столбцов для grid (marginLeft в px)
  // Сначала проверяем пользовательские настройки, если нет - используем дефолтные
  const [gridWidths, setGridWidths] = useState(() => {
    try {
      // 1. Проверяем пользовательские настройки
      const userSaved = localStorage.getItem(gridStorageKey);
      if (userSaved) {
        const parsed = JSON.parse(userSaved);
        console.log(`[useColumnResize] Загружены пользовательские grid настройки для ${gridStorageKey}:`, parsed);
        return parsed;
      }
      
      // 2. Если пользовательских настроек нет, используем дефолтные
      const defaultSaved = localStorage.getItem(defaultGridStorageKey);
      if (defaultSaved) {
        const parsed = JSON.parse(defaultSaved);
        console.log(`[useColumnResize] Загружены дефолтные grid настройки из ${defaultGridStorageKey}:`, parsed);
        return parsed;
      }
      
      // 3. Если дефолтных нет, используем hardcoded значения
      console.log(`[useColumnResize] Используются hardcoded grid настройки:`, defaultGridWidths);
      return defaultGridWidths;
    } catch (error) {
      console.error('Ошибка загрузки grid настроек:', error);
      return defaultGridWidths;
    }
  });
  
  // Текущие ширины столбцов для table (width в px)
  // Сначала проверяем пользовательские настройки, если нет - используем дефолтные
  const [tableWidths, setTableWidths] = useState(() => {
    try {
      // 1. Проверяем пользовательские настройки
      const userSaved = localStorage.getItem(tableStorageKey);
      if (userSaved) {
        const parsed = JSON.parse(userSaved);
        console.log(`[useColumnResize] Загружены пользовательские table настройки для ${tableStorageKey}:`, parsed);
        return parsed;
      }
      
      // 2. Если пользовательских настроек нет, используем дефолтные
      const defaultSaved = localStorage.getItem(defaultTableStorageKey);
      if (defaultSaved) {
        const parsed = JSON.parse(defaultSaved);
        console.log(`[useColumnResize] Загружены дефолтные table настройки из ${defaultTableStorageKey}:`, parsed);
        return parsed;
      }
      
      // 3. Если дефолтных нет, используем hardcoded значения
      console.log(`[useColumnResize] Используются hardcoded table настройки:`, defaultTableWidths);
      return defaultTableWidths;
    } catch (error) {
      console.error('Ошибка загрузки table настроек:', error);
      return defaultTableWidths;
    }
  });
  
  // Состояние перетаскивания
  const [dragging, setDragging] = useState(null);
  
  // Ref для отслеживания начальной позиции мыши
  const dragStartRef = useRef(null);
  
  // Сохранение grid настроек в localStorage при изменении
  // ВАЖНО: Сохраняем только если есть пользовательские настройки (т.е. пользователь уже изменял столбцы)
  // Это предотвращает автоматическое создание пользовательских настроек при использовании дефолтных значений
  useEffect(() => {
    try {
      // Проверяем, есть ли уже пользовательские настройки
      const hasUserSettings = localStorage.getItem(gridStorageKey) !== null;
      
      // Сохраняем только если пользовательские настройки уже существуют
      // или если мы в режиме изменения (т.е. пользователь активно изменяет столбцы)
      if (hasUserSettings || resizeMode) {
        localStorage.setItem(gridStorageKey, JSON.stringify(gridWidths));
        console.log(`[useColumnResize] Сохранены пользовательские grid настройки для ${gridStorageKey}:`, gridWidths);
      }
    } catch (error) {
      console.error('Ошибка сохранения grid настроек:', error);
    }
  }, [gridWidths, gridStorageKey, resizeMode]);
  
  // Сохранение table настроек в localStorage при изменении
  // ВАЖНО: Сохраняем только если есть пользовательские настройки (т.е. пользователь уже изменял столбцы)
  // Это предотвращает автоматическое создание пользовательских настроек при использовании дефолтных значений
  useEffect(() => {
    try {
      // Проверяем, есть ли уже пользовательские настройки
      const hasUserSettings = localStorage.getItem(tableStorageKey) !== null;
      
      // Сохраняем только если пользовательские настройки уже существуют
      // или если мы в режиме изменения (т.е. пользователь активно изменяет столбцы)
      if (hasUserSettings || resizeMode) {
        localStorage.setItem(tableStorageKey, JSON.stringify(tableWidths));
        console.log(`[useColumnResize] Сохранены пользовательские table настройки для ${tableStorageKey}:`, tableWidths);
      }
    } catch (error) {
      console.error('Ошибка сохранения table настроек:', error);
    }
  }, [tableWidths, tableStorageKey, resizeMode]);
  
  // Обработчик горячей клавиши Alt+Shift+R
  useEffect(() => {
    const handleKeyDown = (e) => {
      // Alt+Shift+R для включения/выключения режима
      if (e.altKey && e.shiftKey && e.key === 'R') {
        e.preventDefault();
        e.stopPropagation();
        setResizeMode(prev => !prev);
      }
      // Escape для выхода из режима
      if (e.key === 'Escape' && resizeMode) {
        e.preventDefault();
        setResizeMode(false);
        setDragging(null);
      }
    };
    
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [resizeMode]);
  
  // Начало перетаскивания
  const handleDragStart = useCallback((mode, column, startX) => {
    // Сохраняем начальное значение в зависимости от режима
    let initialValue = 0;
    if (mode === 'grid') {
      initialValue = gridWidths[column] || 0;
    } else if (mode === 'table') {
      initialValue = tableWidths[column] || 0;
    }
    
    dragStartRef.current = { startX, initialValue };
    setDragging({ mode, column });
  }, [gridWidths, tableWidths]);
  
  // Перетаскивание
  const handleDrag = useCallback((e) => {
    if (!dragging || !dragStartRef.current) return;
    
    const { mode, column } = dragging;
    const { startX, initialValue } = dragStartRef.current;
    const deltaX = e.clientX - startX;
    
    if (mode === 'grid') {
      // Для grid изменяем marginLeft
      const newValue = initialValue + deltaX;
      setGridWidths(prev => ({
        ...prev,
        [column]: Math.max(0, newValue) // Минимум 0px
      }));
    } else if (mode === 'table') {
      // Для table изменяем width
      const newValue = initialValue + deltaX;
      setTableWidths(prev => ({
        ...prev,
        [column]: Math.max(30, newValue) // Минимум 30px для читаемости
      }));
    }
  }, [dragging]);
  
  // Окончание перетаскивания
  const handleDragEnd = useCallback(() => {
    setDragging(null);
    dragStartRef.current = null;
  }, []);
  
  // Сброс grid настроек к дефолтным значениям
  const resetGridWidths = useCallback(() => {
    const defaults = loadDefaultGridWidths();
    setGridWidths(defaults);
    // Удаляем пользовательские настройки, чтобы использовались дефолтные
    localStorage.removeItem(gridStorageKey);
  }, [loadDefaultGridWidths, gridStorageKey]);
  
  // Сброс table настроек к дефолтным значениям
  const resetTableWidths = useCallback(() => {
    const defaults = loadDefaultTableWidths();
    setTableWidths(defaults);
    // Удаляем пользовательские настройки, чтобы использовались дефолтные
    localStorage.removeItem(tableStorageKey);
  }, [loadDefaultTableWidths, tableStorageKey]);
  
  // Сброс всех настроек к дефолтным значениям
  const resetAllWidths = useCallback(() => {
    resetGridWidths();
    resetTableWidths();
  }, [resetGridWidths, resetTableWidths]);
  
  // Сохранение текущих значений как дефолтных (для всех пользователей)
  const saveAsDefaults = useCallback(() => {
    try {
      console.log(`[useColumnResize] Сохранение дефолтных значений:`);
      console.log(`  Grid (${defaultGridStorageKey}):`, gridWidths);
      console.log(`  Table (${defaultTableStorageKey}):`, tableWidths);
      
      // 1. Сохраняем в localStorage (для текущего браузера)
      localStorage.setItem(defaultGridStorageKey, JSON.stringify(gridWidths));
      localStorage.setItem(defaultTableStorageKey, JSON.stringify(tableWidths));
      
      // 2. Генерируем код для обновления файла констант
      const codeToUpdate = `
// 🔧 ОБНОВИТЕ ЭТОТ ФАЙЛ: time-tracker/src/constants/columnWidths.js
// Скопируйте следующие значения:

export const DEFAULT_GRID_COLUMN_WIDTHS = ${JSON.stringify(gridWidths, null, 2)};

export const DEFAULT_TABLE_COLUMN_WIDTHS = ${JSON.stringify(tableWidths, null, 2)};
`;
      
      console.log(`[useColumnResize] Код для обновления файла констант:`);
      console.log(codeToUpdate);
      
      // 3. Показываем пользователю инструкции
      const instructions = `✅ Дефолтные значения сохранены в localStorage.

📝 ВАЖНО: Для применения дефолтных значений для всех пользователей (включая инкогнито), 
необходимо обновить файл: time-tracker/src/constants/columnWidths.js

Скопируйте значения из консоли браузера (F12) и вставьте их в файл констант.`;
      
      // Проверяем, что значения сохранились
      const savedGrid = localStorage.getItem(defaultGridStorageKey);
      const savedTable = localStorage.getItem(defaultTableStorageKey);
      console.log(`[useColumnResize] Проверка сохранения:`);
      console.log(`  Grid сохранен:`, savedGrid ? 'да' : 'нет');
      console.log(`  Table сохранен:`, savedTable ? 'да' : 'нет');
      
      // Показываем инструкции в alert (временно, потом заменим на уведомление)
      alert(instructions);
      
      return true;
    } catch (error) {
      console.error('Ошибка сохранения дефолтных настроек:', error);
      return false;
    }
  }, [gridWidths, tableWidths, defaultGridStorageKey, defaultTableStorageKey]);
  
  return {
    // Состояние
    resizeMode,
    gridWidths,
    tableWidths,
    dragging,
    
    // Методы управления перетаскиванием
    handleDragStart,
    handleDrag,
    handleDragEnd,
    
    // Методы сброса
    resetGridWidths,
    resetTableWidths,
    resetAllWidths,
    
    // Методы сохранения дефолтных значений
    saveAsDefaults,
    
    // Утилиты
    setResizeMode
  };
}

