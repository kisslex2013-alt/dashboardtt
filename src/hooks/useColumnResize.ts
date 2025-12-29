/**
 * 🔧 Универсальный хук для изменения ширины столбцов (Grid и Table)
 */

import { useState, useEffect, useCallback, useRef } from 'react'
import { DEFAULT_GRID_COLUMN_WIDTHS, DEFAULT_TABLE_COLUMN_WIDTHS } from '../constants/columnWidths'

type ResizeMode = 'grid' | 'table'

interface ColumnWidths {
  [key: string]: number
}

interface DragState {
  mode: ResizeMode
  column: string
}

interface DragStart {
  startX: number
  initialValue: number
}

interface UseColumnResizeOptions {
  gridStorageKey?: string
  tableStorageKey?: string
  defaultGridStorageKey?: string
  defaultTableStorageKey?: string
  defaultGridWidths?: ColumnWidths
  defaultTableWidths?: ColumnWidths
}

interface UseColumnResizeReturn {
  resizeMode: boolean
  gridWidths: ColumnWidths
  tableWidths: ColumnWidths
  dragging: DragState | null
  handleDragStart: (mode: ResizeMode, column: string, startX: number) => void
  handleDrag: (e: MouseEvent) => void
  handleDragEnd: () => void
  resetGridWidths: () => void
  resetTableWidths: () => void
  resetAllWidths: () => void
  saveAsDefaults: () => boolean
  setResizeMode: React.Dispatch<React.SetStateAction<boolean>>
}

export function useColumnResize(options: UseColumnResizeOptions = {}): UseColumnResizeReturn {
  const {
    gridStorageKey = 'listview-grid-column-widths',
    tableStorageKey = 'listview-table-column-widths',
    defaultGridStorageKey = 'default-grid-column-widths',
    defaultTableStorageKey = 'default-table-column-widths',
    defaultGridWidths = DEFAULT_GRID_COLUMN_WIDTHS,
    defaultTableWidths = DEFAULT_TABLE_COLUMN_WIDTHS,
  } = options

  const loadDefaultGridWidths = useCallback((): ColumnWidths => {
    try {
      const saved = localStorage.getItem(defaultGridStorageKey)
      return saved ? JSON.parse(saved) : defaultGridWidths
    } catch (error) {
      console.error('Ошибка загрузки дефолтных grid настроек:', error)
      return defaultGridWidths
    }
  }, [defaultGridStorageKey, defaultGridWidths])

  const loadDefaultTableWidths = useCallback((): ColumnWidths => {
    try {
      const saved = localStorage.getItem(defaultTableStorageKey)
      return saved ? JSON.parse(saved) : defaultTableWidths
    } catch (error) {
      console.error('Ошибка загрузки дефолтных table настроек:', error)
      return defaultTableWidths
    }
  }, [defaultTableStorageKey, defaultTableWidths])

  const [resizeMode, setResizeMode] = useState<boolean>(false)

  const [gridWidths, setGridWidths] = useState<ColumnWidths>(() => {
    try {
      if (!import.meta.env.DEV) {
        return defaultGridWidths
      }

      const userSaved = localStorage.getItem(gridStorageKey)
      if (userSaved) {
        return JSON.parse(userSaved)
      }

      return defaultGridWidths
    } catch (error) {
      console.error('Ошибка загрузки grid настроек:', error)
      return defaultGridWidths
    }
  })

  const [tableWidths, setTableWidths] = useState<ColumnWidths>(() => {
    try {
      if (!import.meta.env.DEV) {
        return defaultTableWidths
      }

      const userSaved = localStorage.getItem(tableStorageKey)
      if (userSaved) {
        return JSON.parse(userSaved)
      }

      return defaultTableWidths
    } catch (error) {
      console.error('Ошибка загрузки table настроек:', error)
      return defaultTableWidths
    }
  })

  const [dragging, setDragging] = useState<DragState | null>(null)
  const dragStartRef = useRef<DragStart | null>(null)

  useEffect(() => {
    if (!import.meta.env.DEV) {
      return
    }

    try {
      const hasUserSettings = localStorage.getItem(gridStorageKey) !== null

      if (hasUserSettings || resizeMode) {
        localStorage.setItem(gridStorageKey, JSON.stringify(gridWidths))
      }
    } catch (error) {
      console.error('Ошибка сохранения grid настроек:', error)
    }
  }, [gridWidths, gridStorageKey, resizeMode])

  useEffect(() => {
    if (!import.meta.env.DEV) {
      return
    }

    try {
      const hasUserSettings = localStorage.getItem(tableStorageKey) !== null

      if (hasUserSettings || resizeMode) {
        localStorage.setItem(tableStorageKey, JSON.stringify(tableWidths))
      }
    } catch (error) {
      console.error('Ошибка сохранения table настроек:', error)
    }
  }, [tableWidths, tableStorageKey, resizeMode])

  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent): void => {
      if (e.altKey && e.shiftKey && e.key === 'R') {
        e.preventDefault()
        e.stopPropagation()
        setResizeMode(prev => !prev)
      }
      if (e.key === 'Escape' && resizeMode) {
        e.preventDefault()
        setResizeMode(false)
        setDragging(null)
      }
    }

    window.addEventListener('keydown', handleKeyDown)
    return () => window.removeEventListener('keydown', handleKeyDown)
  }, [resizeMode])

  const handleDragStart = useCallback(
    (mode: ResizeMode, column: string, startX: number): void => {
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

  const handleDrag = useCallback(
    (e: MouseEvent): void => {
      if (!dragging || !dragStartRef.current) return

      const { mode, column } = dragging
      const { startX, initialValue } = dragStartRef.current
      const deltaX = e.clientX - startX

      if (mode === 'grid') {
        const newValue = initialValue + deltaX
        setGridWidths(prev => ({
          ...prev,
          [column]: Math.max(0, newValue),
        }))
      } else if (mode === 'table') {
        const newValue = initialValue + deltaX
        setTableWidths(prev => ({
          ...prev,
          [column]: Math.max(30, newValue),
        }))
      }
    },
    [dragging]
  )

  const handleDragEnd = useCallback((): void => {
    setDragging(null)
    dragStartRef.current = null
  }, [])

  const resetGridWidths = useCallback((): void => {
    const defaults = loadDefaultGridWidths()
    setGridWidths(defaults)
    localStorage.removeItem(gridStorageKey)
  }, [loadDefaultGridWidths, gridStorageKey])

  const resetTableWidths = useCallback((): void => {
    const defaults = loadDefaultTableWidths()
    setTableWidths(defaults)
    localStorage.removeItem(tableStorageKey)
  }, [loadDefaultTableWidths, tableStorageKey])

  const resetAllWidths = useCallback((): void => {
    resetGridWidths()
    resetTableWidths()
  }, [resetGridWidths, resetTableWidths])

  const saveAsDefaults = useCallback((): boolean => {
    try {
      localStorage.setItem(defaultGridStorageKey, JSON.stringify(gridWidths))
      localStorage.setItem(defaultTableStorageKey, JSON.stringify(tableWidths))

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
              console.log('✅ Дефолтные значения ширины столбцов обновлены')
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
    resizeMode,
    gridWidths,
    tableWidths,
    dragging,
    handleDragStart,
    handleDrag,
    handleDragEnd,
    resetGridWidths,
    resetTableWidths,
    resetAllWidths,
    saveAsDefaults,
    setResizeMode,
  }
}
