import { useState, useEffect, lazy, Suspense, useCallback } from 'react'
import { Header } from './components/layout/Header'
import { Footer } from './components/layout/Footer'
import { FloatingPanel } from './components/layout/FloatingPanel'
import { StatisticsOverview } from './components/statistics/StatisticsOverview'
import { EntriesList } from './components/entries/EntriesList'

// 🚀 Ленивая загрузка аналитики (code-splitting)
const AnalyticsSection = lazy(() => import('./components/statistics/AnalyticsSection'))

// ⚠️ ВРЕМЕННО: Lazy loading отключен для модальных окон с React элементами в title
// Проблема: React элементы (JSX) в title prop вызывают ошибку "Cannot convert object to primitive value"
// при lazy loading, когда React пытается преобразовать props в строки для предупреждений.
// 
// Модальные окна с проблемой:
// - ImportModal (title с JSX)
// - TutorialModal (title с JSX)
// - SoundNotificationsSettingsModal (title с JSX)
//
// TODO: Исправить передачу title в этих модальных окнах (использовать строки вместо JSX)
// или обернуть lazy loading в try-catch с fallback на обычный импорт

import { EditEntryModal } from './components/modals/EditEntryModal'
import { ImportModal } from './components/modals/ImportModal'
import { WorkScheduleModal } from './components/modals/WorkScheduleModal'
import { TutorialModal } from './components/modals/TutorialModal'
import { AboutModal } from './components/modals/AboutModal'
import { SoundNotificationsSettingsModal } from './components/modals/SoundNotificationsSettingsModal'

import { NotificationContainer } from './components/ui/NotificationContainer'
import { useAppSelectors } from './hooks/useAppSelectors'
import { useSettingsStore } from './store/useSettingsStore'
import { useHotkeys } from './hooks/useHotkeys'
import { useTimer } from './hooks/useTimer'
import { exportToJSON } from './utils/exportImport'
import { logger } from './utils/logger'

function App() {
  // ✅ ОПТИМИЗИРОВАНО: Используем единый хук вместо множества отдельных селекторов
  // Это уменьшает количество подписок и предотвращает избыточные re-renders
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
  } = useAppSelectors();
  
  const { start, stop, isRunning } = useTimer()
  
  // Состояние режима сравнения
  const [compareMode, setCompareMode] = useState(false)
  
  // Обработчик переключения режима сравнения
  const handleToggleCompare = () => {
    setCompareMode(!compareMode)
    showSuccess(compareMode ? 'Режим сравнения отключен' : 'Режим сравнения включен')
  }
  
  // Обработчики Undo/Redo (объявляем ДО useHotkeys!)
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
  
  // Обработчик таймера
  const handleTimerToggle = useCallback(() => {
    if (isRunning) {
      // Останавливаем таймер и получаем данные записи
      const entryData = stop()
      
      if (entryData) {
        // Открываем модальное окно с предзаполненными данными
        openModal('editEntry', { entry: entryData })
        showSuccess('Таймер остановлен. Проверьте и сохраните запись.')
      }
    } else {
      // Запускаем таймер
      start('Разработка')
      showSuccess('Таймер запущен')
    }
  }, [isRunning, stop, start, openModal, showSuccess])

  // ✅ ОПТИМИЗАЦИЯ: Мемоизация callback'ов для модальных окон (предотвращает лишние re-renders)
  const handleShowTutorial = useCallback(() => openModal('tutorial'), [openModal]);
  const handleShowAbout = useCallback(() => openModal('about'), [openModal]);
  const handleShowSoundSettings = useCallback(() => openModal('soundSettings'), [openModal]);
  const handleShowEditEntry = useCallback(() => openModal('editEntry'), [openModal]);
  const handleShowImport = useCallback(() => openModal('import'), [openModal]);
  
  const handleCloseEditEntry = useCallback(() => closeModal('editEntry'), [closeModal]);
  const handleCloseImport = useCallback(() => closeModal('import'), [closeModal]);
  const handleCloseWorkSchedule = useCallback(() => closeModal('workSchedule'), [closeModal]);
  const handleCloseTutorial = useCallback(() => closeModal('tutorial'), [closeModal]);
  const handleCloseAbout = useCallback(() => closeModal('about'), [closeModal]);
  const handleCloseSoundSettings = useCallback(() => closeModal('soundSettings'), [closeModal]);
  
  // Горячие клавиши
  useHotkeys({
    'n': () => openModal('editEntry'),
    't': () => openModal('editEntry'),
    's': handleTimerToggle,
    'ctrl+z': handleUndo,
    'ctrl+y': handleRedo,
  })
  
  const handleSaveEntry = useCallback((entryData) => {
    logger.log('💾 handleSaveEntry вызван с данными:', entryData);
    
    // Проверяем флаг удаления
    if (entryData._delete) {
      deleteEntry(entryData.id)
      closeModal('editEntry')
      return
    }
    
    // Если есть ID - обновляем, иначе добавляем
    if (entryData.id) {
      logger.log('🔄 Обновление существующей записи с ID:', entryData.id);
      updateEntry(entryData.id, entryData)
      showSuccess('Запись обновлена')
    } else {
      logger.log('➕ Добавление новой записи');
      addEntry(entryData)
      showSuccess('Запись добавлена')
    }
    
    closeModal('editEntry')
  }, [deleteEntry, updateEntry, addEntry, closeModal, showSuccess])
  
  const handleEditEntry = useCallback((entry) => {
    openModal('editEntry', { entry })
  }, [openModal])
  
  const handleExport = useCallback(() => {
    try {
      const settings = useSettingsStore.getState()
      exportToJSON(entries, categories, settings)
      showSuccess('Данные успешно экспортированы')
    } catch (error) {
      showError('Ошибка экспорта: ' + error.message)
    }
  }, [entries, categories, showSuccess, showError])
  
  const handleImport = async (data, mode) => {
    try {
      logger.log('📥 Импорт данных:', data);
      logger.log('📊 Количество записей:', data.entries?.length);
      logger.log('🎯 Режим импорта:', mode);
      
      // Преобразуем записи: categoryId → category
      const processedEntries = (data.entries || []).map(entry => {
        // Если есть categoryId, но нет category - копируем значение
        if (entry.categoryId && !entry.category) {
          return { ...entry, category: entry.categoryId };
        }
        // Если нет ни categoryId, ни category - ставим дефолтную
        if (!entry.category && !entry.categoryId) {
          return { ...entry, category: 'remix' };
        }
        return entry;
      });
      
      logger.log('📝 Обработанные записи (первые 3):', processedEntries.slice(0, 3));
      
      if (mode === 'replace') {
        importEntries(processedEntries)
        showSuccess(`Импортировано ${processedEntries.length} записей`)
      } else {
        // Режим merge - добавляем к существующим
        const mergedEntries = [...entries, ...processedEntries]
        importEntries(mergedEntries)
        showSuccess(`Добавлено ${processedEntries.length} записей`)
      }
      
      // Импортируем категории, если они есть
      if (data.categories) {
        useSettingsStore.getState().importCategories(data.categories)
        logger.log('✅ Импортированы категории:', data.categories.length);
      }
      
      // Импортируем настройки (например, dailyPlan)
      if (data.dailyPlan) {
        useSettingsStore.getState().updateSettings({ dailyGoal: data.dailyPlan })
        logger.log('✅ Импортирован дневной план:', data.dailyPlan);
      }
      
      logger.log('✅ Импорт завершен успешно!');
    } catch (error) {
      logger.error('❌ Ошибка импорта:', error);
      showError('Ошибка импорта: ' + error.message)
    }
  }
  
  // Автоматический показ Tutorial при первом запуске
  useEffect(() => {
    const tutorialCompleted = localStorage.getItem('tutorial_completed')
    if (!tutorialCompleted) {
      // Небольшая задержка для плавности
      setTimeout(() => {
        openModal('tutorial')
      }, 1000)
    }
  }, [openModal]) // Добавляем openModal в зависимости для безопасности
  
  return (
    <div className="min-h-screen bg-gray-100 dark:bg-gray-900 transition-colors duration-300">
      <div className="max-w-7xl mx-auto p-6">
        <Header
          onShowTutorial={handleShowTutorial}
          onShowAbout={handleShowAbout}
          onShowSoundSettings={handleShowSoundSettings}
          compareMode={compareMode}
          onToggleCompare={handleToggleCompare}
        />
        
        <StatisticsOverview />
        
        {/* Ленивая загрузка секции аналитики */}
        <Suspense
          fallback={
            <div className="glass-effect rounded-xl p-8 mb-6 border border-gray-200 dark:border-gray-700">
              <div className="flex flex-col items-center justify-center space-y-4">
                <div className="w-12 h-12 border-4 border-blue-500 border-t-transparent rounded-full animate-spin"></div>
                <p className="text-gray-600 dark:text-gray-400 font-medium">
                  Загрузка графиков и аналитики...
                </p>
                <p className="text-sm text-gray-500 dark:text-gray-500">
                  Это происходит только при первой загрузке
                </p>
              </div>
            </div>
          }
        >
          <AnalyticsSection />
        </Suspense>
        
        <EntriesList
          onAddNew={handleShowEditEntry}
          onStartTimer={handleTimerToggle}
          onEditEntry={handleEditEntry}
          onUndo={handleUndo}
          onRedo={handleRedo}
          canUndo={canUndo()}
          canRedo={canRedo()}
          onExport={handleExport}
          onImport={handleShowImport}
        />
        
        <FloatingPanel />
        
        <Footer />
        
        <NotificationContainer />
        
        {/* ⚠️ ВРЕМЕННО: Модальные окна загружаются обычным импортом (без lazy loading) */}
        {/* Причина: React элементы (JSX) в title prop вызывают ошибку при lazy loading */}
        {modals.editEntry?.isOpen && (
          <EditEntryModal
            isOpen={modals.editEntry?.isOpen}
            onClose={handleCloseEditEntry}
            entry={modals.editEntry?.entry}
            onSave={handleSaveEntry}
          />
        )}
        
        {modals.import?.isOpen && (
          <ImportModal
            isOpen={modals.import?.isOpen}
            onClose={handleCloseImport}
            onImport={handleImport}
          />
        )}
        
        {modals.workSchedule?.isOpen && (
          <WorkScheduleModal
            isOpen={modals.workSchedule?.isOpen}
            onClose={handleCloseWorkSchedule}
          />
        )}
        
        {modals.tutorial?.isOpen && (
          <TutorialModal
            isOpen={modals.tutorial?.isOpen}
            onClose={handleCloseTutorial}
          />
        )}
        
        {modals.about?.isOpen && (
          <AboutModal
            isOpen={modals.about?.isOpen}
            onClose={handleCloseAbout}
          />
        )}
        
        {modals.soundSettings?.isOpen && (
          <SoundNotificationsSettingsModal
            isOpen={modals.soundSettings?.isOpen}
            onClose={handleCloseSoundSettings}
          />
        )}
      </div>
    </div>
  )
}

export default App
