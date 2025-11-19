import { useState, useEffect, useCallback, useRef } from 'react'
import { DEFAULT_GRID_COLUMN_WIDTHS, DEFAULT_TABLE_COLUMN_WIDTHS } from '../constants/columnWidths'

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
    defaultTableWidths = DEFAULT_TABLE_COLUMN_WIDTHS,
  } = options

  // Функция для загрузки дефолтных значений (из localStorage или hardcoded)
  const loadDefaultGridWidths = useCallback(() => {
    try {
      const saved = localStorage.getItem(defaultGridStorageKey)
      return saved ? JSON.parse(saved) : defaultGridWidths
    } catch (error) {
      console.error('Ошибка загрузки дефолтных grid настроек:', error)
      return defaultGridWidths
    }
  }, [defaultGridStorageKey, defaultGridWidths])

  const loadDefaultTableWidths = useCallback(() => {
    try {
      const saved = localStorage.getItem(defaultTableStorageKey)
      return saved ? JSON.parse(saved) : defaultTableWidths
    } catch (error) {
      console.error('Ошибка загрузки дефолтных table настроек:', error)
      return defaultTableWidths
    }
  }, [defaultTableStorageKey, defaultTableWidths])

  // Режим изменения размеров (активируется по Alt+Shift+R)
  const [resizeMode, setResizeMode] = useState(false)

  // Текущие ширины столбцов для grid (marginLeft в px)
  // В production всегда используем дефолтные значения из файла (как для иконок)
  // В dev режиме используем пользовательские настройки из localStorage
  const [gridWidths, setGridWidths] = useState(() => {
    try {
      // В production всегда используем дефолтные значения из файла
      if (!import.meta.env.DEV) {
        console.log(
          `[useColumnResize] Production режим: используются дефолтные grid настройки из файла:`,
          defaultGridWidths
        )
        return defaultGridWidths
      }

      // В dev режиме проверяем пользовательские настройки
      const userSaved = localStorage.getItem(gridStorageKey)
      if (userSaved) {
        const parsed = JSON.parse(userSaved)
        console.log(
          `[useColumnResize] Dev режим: загружены пользовательские grid настройки для ${gridStorageKey}:`,
          parsed
        )
        return parsed
      }

      // Если пользовательских настроек нет, используем дефолтные из файла
      console.log(
        `[useColumnResize] Dev режим: используются дефолтные grid настройки из файла:`,
        defaultGridWidths
      )
      return defaultGridWidths
    } catch (error) {
      console.error('Ошибка загрузки grid настроек:', error)
      return defaultGridWidths
    }
  })

  // Текущие ширины столбцов для table (width в px)
  // В production всегда используем дефолтные значения из файла (как для иконок)
  // В dev режиме используем пользовательские настройки из localStorage
  const [tableWidths, setTableWidths] = useState(() => {
    try {
      // В production всегда используем дефолтные значения из файла
      if (!import.meta.env.DEV) {
        console.log(
          `[useColumnResize] Production режим: используются дефолтные table настройки из файла:`,
          defaultTableWidths
        )
        return defaultTableWidths
      }

      // В dev режиме проверяем пользовательские настройки
      const userSaved = localStorage.getItem(tableStorageKey)
      if (userSaved) {
        const parsed = JSON.parse(userSaved)
        console.log(
          `[useColumnResize] Dev режим: загружены пользовательские table настройки для ${tableStorageKey}:`,
          parsed
        )
        return parsed
      }

      // Если пользовательских настроек нет, используем дефолтные из файла
      console.log(
        `[useColumnResize] Dev режим: используются дефолтные table настройки из файла:`,
        defaultTableWidths
      )
      return defaultTableWidths
    } catch (error) {
      console.error('Ошибка загрузки table настроек:', error)
      return defaultTableWidths
    }
  })

  // Состояние перетаскивания
  const [dragging, setDragging] = useState(null)

  // Ref для отслеживания начальной позиции мыши
  const dragStartRef = useRef(null)

  // Сохранение grid настроек в localStorage при изменении
  // В production не сохраняем - всегда используем дефолтные значения из файла
  // В dev режиме сохраняем для удобства разработки
  useEffect(() => {
    // В production не сохраняем пользовательские настройки
    if (!import.meta.env.DEV) {
      return
    }

    try {
      // Проверяем, есть ли уже пользовательские настройки
      const hasUserSettings = localStorage.getItem(gridStorageKey) !== null

      // Сохраняем только если пользовательские настройки уже существуют
      // или если мы в режиме изменения (т.е. пользователь активно изменяет столбцы)
      if (hasUserSettings || resizeMode) {
        localStorage.setItem(gridStorageKey, JSON.stringify(gridWidths))
        console.log(
          `[useColumnResize] Dev режим: сохранены пользовательские grid настройки для ${gridStorageKey}:`,
          gridWidths
        )
      }
    } catch (error) {
      console.error('Ошибка сохранения grid настроек:', error)
    }
  }, [gridWidths, gridStorageKey, resizeMode])

  // Сохранение table настроек в localStorage при изменении
  // В production не сохраняем - всегда используем дефолтные значения из файла
  // В dev режиме сохраняем для удобства разработки
  useEffect(() => {
    // В production не сохраняем пользовательские настройки
    if (!import.meta.env.DEV) {
      return
    }

    try {
      // Проверяем, есть ли уже пользовательские настройки
      const hasUserSettings = localStorage.getItem(tableStorageKey) !== null

      // Сохраняем только если пользовательские настройки уже существуют
      // или если мы в режиме изменения (т.е. пользователь активно изменяет столбцы)
      if (hasUserSettings || resizeMode) {
        localStorage.setItem(tableStorageKey, JSON.stringify(tableWidths))
        console.log(
          `[useColumnResize] Dev режим: сохранены пользовательские table настройки для ${tableStorageKey}:`,
          tableWidths
        )
      }
    } catch (error) {
      console.error('Ошибка сохранения table настроек:', error)
    }
  }, [tableWidths, tableStorageKey, resizeMode])

  // Обработчик горячей клавиши Alt+Shift+R
  useEffect(() => {
    const handleKeyDown = e => {
      // Alt+Shift+R для включения/выключения режима
      if (e.altKey && e.shiftKey && e.key === 'R') {
        e.preventDefault()
        e.stopPropagation()
        setResizeMode(prev => !prev)
      }
      // Escape для выхода из режима
      if (e.key === 'Escape' && resizeMode) {
        e.preventDefault()
        setResizeMode(false)
        setDragging(null)
      }
    }

    window.addEventListener('keydown', handleKeyDown)
    return () => window.removeEventListener('keydown', handleKeyDown)
  }, [resizeMode])

  // Начало перетаскивания
  const handleDragStart = useCallback(
    (mode, column, startX) => {
      // Сохраняем начальное значение в зависимости от режима
      let initialValue = 0
      if (mode === 'grid') {
        initialValue = gridWidths[column] || 0
      } else if (mode === 'table') {
        initialValue = tableWidths[column] || 0
      }

      dragStartRef.current = { startX, initialValue }
      setDragging({ mode, column })
    },
    [gridWidths, tableWidths]
  )

  // Перетаскивание
  const handleDrag = useCallback(
    e => {
      if (!dragging || !dragStartRef.current) return

      const { mode, column } = dragging
      const { startX, initialValue } = dragStartRef.current
      const deltaX = e.clientX - startX

      if (mode === 'grid') {
        // Для grid изменяем marginLeft
        const newValue = initialValue + deltaX
        setGridWidths(prev => ({
          ...prev,
          [column]: Math.max(0, newValue), // Минимум 0px
        }))
      } else if (mode === 'table') {
        // Для table изменяем width
        const newValue = initialValue + deltaX
        setTableWidths(prev => ({
          ...prev,
          [column]: Math.max(30, newValue), // Минимум 30px для читаемости
        }))
      }
    },
    [dragging]
  )

  // Окончание перетаскивания
  const handleDragEnd = useCallback(() => {
    setDragging(null)
    dragStartRef.current = null
  }, [])

  // Сброс grid настроек к дефолтным значениям
  const resetGridWidths = useCallback(() => {
    const defaults = loadDefaultGridWidths()
    setGridWidths(defaults)
    // Удаляем пользовательские настройки, чтобы использовались дефолтные
    localStorage.removeItem(gridStorageKey)
  }, [loadDefaultGridWidths, gridStorageKey])

  // Сброс table настроек к дефолтным значениям
  const resetTableWidths = useCallback(() => {
    const defaults = loadDefaultTableWidths()
    setTableWidths(defaults)
    // Удаляем пользовательские настройки, чтобы использовались дефолтные
    localStorage.removeItem(tableStorageKey)
  }, [loadDefaultTableWidths, tableStorageKey])

  // Сброс всех настроек к дефолтным значениям
  const resetAllWidths = useCallback(() => {
    resetGridWidths()
    resetTableWidths()
  }, [resetGridWidths, resetTableWidths])

  // Сохранение текущих значений как дефолтных (для всех пользователей)
  const saveAsDefaults = useCallback(() => {
    try {
      // 1. Сохраняем в localStorage (для текущего браузера)
      localStorage.setItem(defaultGridStorageKey, JSON.stringify(gridWidths))
      localStorage.setItem(defaultTableStorageKey, JSON.stringify(tableWidths))

      // 2. Обновляем дефолтные значения в коде (только в dev режиме)
      if (import.meta.env.DEV) {
        fetch('/api/update-column-widths', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({ gridWidths, tableWidths }),
        })
          .then(response => response.json())
          .then(data => {
            if (data.success) {
              console.log('✅ Дефолтные значения ширины столбцов обновлены в коде')
            } else {
              console.warn('⚠️ Не удалось обновить дефолтные значения:', data.message)
            }
          })
          .catch(error => {
            console.warn('⚠️ Ошибка обновления дефолтных значений:', error)
          })
      }

      return true
    } catch (error) {
      console.error('Ошибка сохранения дефолтных настроек:', error)
      return false
    }
  }, [gridWidths, tableWidths, defaultGridStorageKey, defaultTableStorageKey])

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
    setResizeMode,
  }
}
