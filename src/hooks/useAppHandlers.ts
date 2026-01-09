import { useCallback, useRef, useEffect } from 'react'
import { useAppSelectors } from './useAppSelectors'
import { useTimer } from './useTimer'
import { useHapticFeedback } from './useHapticFeedback'
import { useEntriesStore, useClearEntries } from '../store/useEntriesStore'
import { useSettingsStore } from '../store/useSettingsStore'
import { exportToJSON } from '../utils/exportImport'
import { loadDemoData } from '../utils/loadDemoData'
import { handleError } from '../utils/errorHandler'
import { logger } from '../utils/logger'
import { getTodayString } from '../utils/dateHelpers'
import { generateUUID } from '../utils/uuid'

/**
 * Custom hook that extracts all handlers from App.tsx
 * This improves code organization and reduces App.tsx complexity
 *
 * Performance: Each callback is memoized with useCallback to prevent unnecessary re-renders
 */
export function useAppHandlers() {
  const {
    modals,
    openModal,
    closeModal,
    showSuccess,
    showError,
    entries,
    addEntry,
    updateEntry,
    deleteEntry,
    importEntries,
    restoreEntries,
    categories,
    canUndo,
    canRedo,
    undo,
    redo,
  } = useAppSelectors()

  const { start, stop, isRunning } = useTimer()
  const triggerHaptic = useHapticFeedback()
  const clearEntries = useClearEntries()

  // Refs for export reminder logic
  const reminderShownRef = useRef(false)
  const lastReminderDateRef = useRef<string | null>(null)
  const lastReminderTimestampRef = useRef<number | null>(null)
  
  // Ref to prevent duplicate demo data loading (StrictMode + useCallback recreation)
  const demoLoadingRef = useRef(false)

  // ========================================
  // Modal Handlers
  // ========================================

  const handleShowTutorial = useCallback(() => openModal('helpCenter'), [openModal])
  const handleShowAbout = useCallback(() => openModal('about'), [openModal])
  const handleShowSoundSettings = useCallback(() => openModal('soundSettings'), [openModal])
  const handleShowEditEntry = useCallback(() => openModal('editEntry'), [openModal])
  const handleShowImport = useCallback(() => openModal('import'), [openModal])

  const handleOpenCategories = useCallback(() => {
    openModal('soundSettings', { activeTab: 'categories' })
  }, [openModal])

  const handleOpenBackups = useCallback(() => {
    openModal('soundSettings', { activeTab: 'backups' })
  }, [openModal])

  const handleCloseEditEntry = useCallback(() => closeModal('editEntry'), [closeModal])
  const handleCloseImport = useCallback(() => closeModal('import'), [closeModal])
  const handleCloseWorkSchedule = useCallback(() => closeModal('workSchedule'), [closeModal])
  const handleCloseTutorial = useCallback(() => closeModal('tutorial'), [closeModal])
  const handleCloseAbout = useCallback(() => closeModal('about'), [closeModal])
  const handleCloseSoundSettings = useCallback(() => closeModal('soundSettings'), [closeModal])

  // ========================================
  // Undo/Redo Handlers
  // ========================================

  const handleUndo = useCallback(() => {
    const previousState = undo()
    if (previousState) {
      restoreEntries(previousState)
      showSuccess('Действие отменено')
    }
  }, [undo, restoreEntries, showSuccess])

  const handleRedo = useCallback(() => {
    const nextState = redo()
    if (nextState) {
      restoreEntries(nextState)
      showSuccess('Действие повторено')
    }
  }, [redo, restoreEntries, showSuccess])

  // ========================================
  // Timer Handler
  // ========================================

  const handleTimerToggle = useCallback(() => {
    if (isRunning) {
      triggerHaptic('medium')
      const entryData = stop()

      if (entryData) {
        openModal('editEntry', { entry: entryData })
        showSuccess('Таймер остановлен. Проверьте и сохраните запись.')
      }
    } else {
      triggerHaptic('medium')
      start('Разработка')
      showSuccess('Таймер запущен')
    }
  }, [isRunning, stop, start, openModal, showSuccess, triggerHaptic])

  // ========================================
  // Entry Handlers
  // ========================================

  const handleSaveEntry = useCallback(
    (entryData: any) => {
      logger.log('💾 handleSaveEntry вызван с данными:', entryData)

      if (entryData._delete) {
        deleteEntry(entryData.id)
        closeModal('editEntry')
        return
      }

      if (entryData.id) {
        logger.log('🔄 Обновление существующей записи с ID:', entryData.id)
        updateEntry(entryData.id, entryData)
        showSuccess('Запись обновлена')
      } else {
        logger.log('➕ Добавление новой записи')
        addEntry(entryData)
        showSuccess('Запись добавлена')
      }

      closeModal('editEntry')
    },
    [deleteEntry, updateEntry, addEntry, closeModal, showSuccess]
  )

  const handleEditEntry = useCallback(
    (entry: any) => {
      openModal('editEntry', { entry })
    },
    [openModal]
  )

  // ========================================
  // Export Handler
  // ========================================

  const handleExport = useCallback(() => {
    try {
      const allEntries = useEntriesStore.getState().entries
      const settings = useSettingsStore.getState()

      logger.log(`📤 Начинаем экспорт. Всего записей в store: ${allEntries.length}`)

      const todayStr = getTodayString()
      const todayEntries = allEntries.filter((entry: any) => {
        if (!entry || !entry.date) return false
        const entryDateStr = entry.date.split('T')[0]
        return entryDateStr === todayStr
      })

      logger.log(`📅 Записей за сегодня (${todayStr}): ${todayEntries.length}`)

      exportToJSON(allEntries, categories, settings)

      const exportInfo = {
        timestamp: Date.now(),
        entriesCount: allEntries.length,
      }
      localStorage.setItem('lastExportInfo', JSON.stringify(exportInfo))

      // Reset reminder flags
      reminderShownRef.current = false
      lastReminderDateRef.current = null
      lastReminderTimestampRef.current = null

      showSuccess(`Данные успешно экспортированы (${allEntries.length} записей)`)
      logger.log(`✅ Экспорт завершен. Экспортировано ${allEntries.length} записей`)
    } catch (error) {
      const errorMessage = handleError(error, { operation: 'Экспорт всех данных' })
      logger.error('❌ Ошибка экспорта:', error)
      showError(errorMessage)
    }
  }, [categories, showSuccess, showError])

  // ========================================
  // Import Handler
  // ========================================

  const handleImport = useCallback(
    async (data: any, mode: 'replace' | 'merge') => {
      try {
        if (!data) {
          throw new Error('Данные для импорта отсутствуют')
        }

        logger.log('📥 Импорт данных:', data)

        if (!data.entries || !Array.isArray(data.entries)) {
          throw new Error('Записи отсутствуют или имеют неверный формат')
        }

        if (data.entries.length === 0) {
          throw new Error('Файл не содержит записей для импорта')
        }

        // Process entries
        const processedEntries = data.entries
          .map((entry: any, index: number) => {
            if (!entry.date) {
              logger.warn(`⚠️ Запись ${index + 1} не имеет даты, пропускаем`)
              return null
            }

            const entryId = entry.id || generateUUID()
            let {category} = entry
            if (entry.categoryId && !category) {
              category = entry.categoryId
            }
            if (!category && !entry.categoryId) {
              category = 'remix'
            }

            return {
              ...entry,
              id: entryId,
              category,
              categoryId: category,
            }
          })
          .filter((entry: any) => entry !== null)

        if (processedEntries.length === 0) {
          throw new Error('Нет валидных записей для импорта')
        }

        logger.log('📝 Обработано записей:', processedEntries.length)

        if (mode === 'replace') {
          importEntries(processedEntries)
          showSuccess(`Импортировано ${processedEntries.length} записей`)
        } else {
          const mergedEntries = [...entries, ...processedEntries]
          importEntries(mergedEntries)
          showSuccess(`Добавлено ${processedEntries.length} записей`)
        }

        // Import categories if present
        if (data.categories && Array.isArray(data.categories)) {
          useSettingsStore.getState().importCategories(data.categories)
          logger.log('✅ Импортированы категории:', data.categories.length)
        }

        // Import daily plan if present
        if (data.dailyPlan) {
          useSettingsStore.getState().updateSettings({ dailyGoal: data.dailyPlan })
          logger.log('✅ Импортирован дневной план:', data.dailyPlan)
        }

        logger.log('✅ Импорт завершен успешно!')
      } catch (error) {
        const errorMessage = handleError(error, { operation: 'Импорт данных', mode })
        logger.error('❌ Ошибка импорта:', error)
        showError(errorMessage)
      }
    },
    [entries, importEntries, showSuccess, showError]
  )

  // ========================================
  // Demo Data Handler
  // ========================================

  const handleClearDemoData = useCallback(() => {
    try {
      localStorage.removeItem('time-tracker-entries')
      localStorage.removeItem('demo_data_loaded')
      localStorage.setItem('demo_data_cleared', 'true')

      clearEntries()
      useEntriesStore.setState({ entries: [] })

      logger.log('✅ Тестовые данные удалены')
      showSuccess('Тестовые данные успешно удалены. База данных очищена.')
    } catch (error) {
      const errorMessage = handleError(error, { operation: 'Удаление тестовых данных' })
      logger.error('❌ Ошибка удаления тестовых данных:', error)
      showError(errorMessage)
    }
  }, [clearEntries, showSuccess, showError])

  // ========================================
  // Load Demo Data
  // ========================================

  const loadDemo = useCallback(async () => {
    const demoDataCleared = localStorage.getItem('demo_data_cleared') === 'true'
    const demoDataLoaded = localStorage.getItem('demo_data_loaded') === 'true'
    const demoDataLoading = localStorage.getItem('demo_data_loading') === 'true'
    
    // Читаем entries напрямую из store чтобы получить актуальное значение после гидратации
    const currentEntries = useEntriesStore.getState().entries
    
    if (currentEntries.length === 0 && !demoDataLoaded && !demoDataCleared && !demoDataLoading) {
      // Устанавливаем флаг загрузки СРАЗУ в localStorage (синхронно для всех экземпляров)
      localStorage.setItem('demo_data_loading', 'true')
      
      try {
        logger.log('📥 Начинаем загрузку тестовых данных...')

        const demoEntries = await loadDemoData()

        if (demoEntries && demoEntries.length > 0) {
          // Set localStorage BEFORE importing
          localStorage.setItem('demo_data_loaded', 'true')
          localStorage.removeItem('demo_data_loading')
          
          importEntries(demoEntries)

          logger.log(`✅ Загружено ${demoEntries.length} тестовых записей`)
          showSuccess(
            `Загружено ${demoEntries.length} демонстрационных записей для ознакомления с функционалом`
          )
        } else {
          localStorage.removeItem('demo_data_loading')
        }
      } catch (error) {
        // Reset flag on error to allow retry
        localStorage.removeItem('demo_data_loading')
        const errorMessage = handleError(error, { operation: 'Загрузка тестовых данных' })
        logger.error('❌ Ошибка загрузки тестовых данных:', error)
        showError(errorMessage)
      }
    }
  }, [importEntries, showSuccess, showError])

  // ========================================
  // Auto-load Demo Data on Mount
  // ========================================

  useEffect(() => {
    // Ждем гидратации Zustand persist (чтобы entries успели загрузиться из localStorage)
    // Небольшая задержка гарантирует, что persist middleware завершил работу
    const timer = setTimeout(() => {
      loadDemo()
    }, 100)
    
    return () => clearTimeout(timer)
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []) // Пустой массив зависимостей - вызываем только 1 раз при mount

  return {
    // Modal handlers
    handleShowTutorial,
    handleShowAbout,
    handleShowSoundSettings,
    handleShowEditEntry,
    handleShowImport,
    handleOpenCategories,
    handleOpenBackups,
    handleCloseEditEntry,
    handleCloseImport,
    handleCloseWorkSchedule,
    handleCloseTutorial,
    handleCloseAbout,
    handleCloseSoundSettings,

    // Undo/Redo
    handleUndo,
    handleRedo,
    canUndo,
    canRedo,

    // Timer
    handleTimerToggle,
    isRunning,

    // Entries
    handleSaveEntry,
    handleEditEntry,

    // Export/Import
    handleExport,
    handleImport,

    // Demo data
    handleClearDemoData,
    loadDemo,

    // Refs for export reminder
    reminderShownRef,
    lastReminderDateRef,
    lastReminderTimestampRef,

    // Modals state
    modals,
    openModal,
    closeModal,

    // Notifications
    showSuccess,
    showError,

    // Categories
    categories,
  }
}
