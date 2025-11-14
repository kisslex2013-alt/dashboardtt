import { useState, useEffect, lazy, Suspense, useCallback } from 'react'
import { Header } from './components/layout/Header'
import { Footer } from './components/layout/Footer'
import { FloatingPanel } from './components/layout/FloatingPanel'
import { StatisticsOverview } from './components/statistics/StatisticsOverview'
import { EntriesList } from './components/entries/EntriesList'

// 🚀 Ленивая загрузка аналитики (code-splitting)
// AnalyticsSection имеет default export, поэтому используем прямой импорт
const AnalyticsSection = lazy(() => import('./components/statistics/AnalyticsSection'))

// ✅ ОПТИМИЗАЦИЯ: Lazy loading для модальных окон (исправлено для named exports)
// Важно: lazy() ожидает default export, поэтому преобразуем named exports в default через .then()
const EditEntryModal = lazy(() => import('./components/modals/EditEntryModal').then(module => ({ default: module.EditEntryModal })))
const ImportModal = lazy(() => import('./components/modals/ImportModal').then(module => ({ default: module.ImportModal })))
const WorkScheduleModal = lazy(() => import('./components/modals/WorkScheduleModal').then(module => ({ default: module.WorkScheduleModal })))
const PaymentDatesSettingsModal = lazy(() => import('./components/modals/PaymentDatesSettingsModal').then(module => ({ default: module.PaymentDatesSettingsModal })))
const TutorialModal = lazy(() => import('./components/modals/TutorialModal').then(module => ({ default: module.TutorialModal })))
const AboutModal = lazy(() => import('./components/modals/AboutModal').then(module => ({ default: module.AboutModal })))
const SoundNotificationsSettingsModal = lazy(() => import('./components/modals/SoundNotificationsSettingsModal').then(module => ({ default: module.SoundNotificationsSettingsModal })))
const FloatingPanelSettingsModal = lazy(() => import('./components/modals/FloatingPanelSettingsModal').then(module => ({ default: module.FloatingPanelSettingsModal })))

import { NotificationContainer } from './components/ui/NotificationContainer'
import { IconEditorOverlay } from './components/dev/IconEditorOverlay'
import { useAppSelectors } from './hooks/useAppSelectors'
import { useSettingsStore } from './store/useSettingsStore'
import { useHotkeys } from './hooks/useHotkeys'
import { useIconEditor } from './hooks/useIconEditor'
import { useTimer } from './hooks/useTimer'
import { exportToJSON } from './utils/exportImport'
import { logger } from './utils/logger'
import { useDelayedUnmount } from './hooks/useDelayedUnmount'
import { useEntriesStore } from './store/useEntriesStore'
import { loadDemoData } from './utils/loadDemoData'
import { handleError } from './utils/errorHandler'

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
  
  // Получаем clearEntries из store для удаления тестовых данных
  const { clearEntries } = useEntriesStore();
  
  // Режим редактирования иконок (только в dev режиме)
  const { toggleEditMode } = useIconEditor()
  
  // Состояние режима сравнения
  const [compareMode, setCompareMode] = useState(false)
  
  // ✅ ОПТИМИЗАЦИЯ: Задержка размонтирования для lazy-loaded модальных окон
  // Это позволяет анимации исчезновения завершиться до размонтирования компонента
  const shouldRenderEditEntry = useDelayedUnmount(modals.editEntry?.isOpen ?? false, 350)
  const shouldRenderImport = useDelayedUnmount(modals.import?.isOpen ?? false, 350)
  const shouldRenderWorkSchedule = useDelayedUnmount(modals.workSchedule?.isOpen ?? false, 350)
  const shouldRenderPaymentDatesSettings = useDelayedUnmount(modals.paymentDatesSettings?.isOpen ?? false, 350)
  const shouldRenderTutorial = useDelayedUnmount(modals.tutorial?.isOpen ?? false, 350)
  const shouldRenderAbout = useDelayedUnmount(modals.about?.isOpen ?? false, 350)
  const shouldRenderSoundSettings = useDelayedUnmount(modals.soundSettings?.isOpen ?? false, 350)
  const shouldRenderFloatingPanelSettings = useDelayedUnmount(modals.floatingPanelSettings?.isOpen ?? false, 350)
  
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
  
  // Обработчик удаления тестовых данных
  const handleClearDemoData = useCallback(() => {
    try {
      // Очищаем все записи
      clearEntries();
      
      // Удаляем флаг загрузки тестовых данных
      localStorage.removeItem('demo_data_loaded');
      
      logger.log('✅ Тестовые данные удалены');
      showSuccess('Тестовые данные успешно удалены. База данных очищена.');
    } catch (error) {
      // ИСПРАВЛЕНО: Используем централизованную обработку ошибок
      const errorMessage = handleError(error, { operation: 'Удаление тестовых данных' });
      logger.error('❌ Ошибка удаления тестовых данных:', error);
      showError(errorMessage);
    }
  }, [clearEntries, showSuccess, showError]);
  
  // Горячие клавиши
  useHotkeys({
    'n': () => openModal('editEntry'),
    't': () => openModal('editEntry'),
    's': handleTimerToggle,
    'ctrl+z': handleUndo,
    'ctrl+y': handleRedo,
    // Режим редактирования иконок (только в dev режиме)
    ...(import.meta.env.DEV ? { 'ctrl+shift+bracketright': toggleEditMode } : {}),
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
      // Получаем все записи напрямую из store, чтобы гарантировать актуальность данных
      const allEntries = useEntriesStore.getState().entries;
      const settings = useSettingsStore.getState();
      
      // Логируем для отладки
      logger.log(`📤 Начинаем экспорт. Всего записей в store: ${allEntries.length}`);
      
      // Проверяем записи за сегодня
      const today = new Date();
      const todayStr = today.toISOString().split('T')[0]; // YYYY-MM-DD
      const todayEntries = allEntries.filter(entry => {
        if (!entry || !entry.date) return false;
        const entryDateStr = entry.date.split('T')[0]; // Извлекаем дату из строки
        return entryDateStr === todayStr;
      });
      
      logger.log(`📅 Записей за сегодня (${todayStr}): ${todayEntries.length}`);
      if (todayEntries.length > 0) {
        logger.log('📋 Записи за сегодня:', todayEntries.map(e => ({
          date: e.date,
          start: e.start,
          end: e.end,
          id: e.id
        })));
      }
      
      // Сортируем записи по дате для логирования
      const sortedByDate = [...allEntries].sort((a, b) => {
        const dateA = new Date(a.date || 0);
        const dateB = new Date(b.date || 0);
        return dateB - dateA;
      });
      
      logger.log('📋 Последние 5 записей по дате:', sortedByDate.slice(0, 5).map(e => ({
        date: e.date,
        start: e.start,
        end: e.end
      })));
      
      exportToJSON(allEntries, categories, settings);
      showSuccess(`Данные успешно экспортированы (${allEntries.length} записей)`);
      logger.log(`✅ Экспорт завершен. Экспортировано ${allEntries.length} записей`);
    } catch (error) {
      // ИСПРАВЛЕНО: Используем централизованную обработку ошибок
      const errorMessage = handleError(error, { operation: 'Экспорт всех данных' });
      logger.error('❌ Ошибка экспорта:', error);
      showError(errorMessage);
    }
  }, [categories, showSuccess, showError])
  
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
      // ИСПРАВЛЕНО: Используем централизованную обработку ошибок
      const errorMessage = handleError(error, { operation: 'Импорт данных', mode });
      logger.error('❌ Ошибка импорта:', error);
      showError(errorMessage);
    }
  }
  
  // Автоматическая загрузка тестовых данных при первом запуске
  useEffect(() => {
    const loadDemo = async () => {
      // Проверяем, что база пустая и тестовые данные еще не загружались
      if (entries.length === 0 && !localStorage.getItem('demo_data_loaded')) {
        try {
          logger.log('📥 Начинаем загрузку тестовых данных...');
          
          // Загружаем тестовые данные
          const demoEntries = await loadDemoData();
          
          if (demoEntries && demoEntries.length > 0) {
            // Импортируем тестовые данные
            importEntries(demoEntries);
            
            // Устанавливаем флаг, что тестовые данные загружены
            localStorage.setItem('demo_data_loaded', 'true');
            
            logger.log(`✅ Загружено ${demoEntries.length} тестовых записей`);
            showSuccess(`Загружено ${demoEntries.length} демонстрационных записей для ознакомления с функционалом`);
          }
        } catch (error) {
          // ИСПРАВЛЕНО: Используем централизованную обработку ошибок
          const errorMessage = handleError(error, { operation: 'Загрузка тестовых данных' });
          logger.error('❌ Ошибка загрузки тестовых данных:', error);
          showError(errorMessage);
        }
      }
    };
    
    // Загружаем с небольшой задержкой после монтирования компонента
    const timer = setTimeout(() => {
      loadDemo();
    }, 500);
    
    return () => clearTimeout(timer);
  }, [entries.length, importEntries, showSuccess, showError]); // Зависимости

  // Автоматический показ Tutorial при первом запуске (после промо)
  useEffect(() => {
    const tutorialCompleted = localStorage.getItem('tutorial_completed')
    const promoShown = localStorage.getItem('promo_shown')
    // Показываем Tutorial только если промо уже было показано
    if (!tutorialCompleted && promoShown) {
      // Небольшая задержка для плавности
      setTimeout(() => {
        openModal('tutorial')
      }, 1000)
    }
  }, [openModal]) // Добавляем openModal в зависимости для безопасности

  // ✅ Создание бекапа при загрузке приложения
  useEffect(() => {
    const createInitialBackup = async () => {
      try {
        const { createManualBackup } = useEntriesStore.getState();
        const result = await createManualBackup();
        if (result.success) {
          logger.log('✅ Бекап при загрузке создан успешно');
        }
      } catch (error) {
        // ИСПРАВЛЕНО: Используем централизованную обработку ошибок
        const errorMessage = handleError(error, { operation: 'Создание начального бэкапа' });
        logger.error('❌ Ошибка создания бекапа при загрузке:', error);
        // Не показываем ошибку пользователю, так как это фоновый процесс
      }
    };
    
    // Создаем бекап с небольшой задержкой после загрузки
    const timer = setTimeout(() => {
      createInitialBackup();
    }, 2000); // 2 секунды после загрузки
    
    return () => clearTimeout(timer);
  }, []); // Выполняется только один раз при монтировании
  
  return (
    <div className="min-h-screen bg-gray-100 dark:bg-gray-900 transition-colors duration-300">
      <div className="max-w-7xl mx-auto p-6">
        <Header
          onShowTutorial={handleShowTutorial}
          onShowAbout={handleShowAbout}
          onShowSoundSettings={handleShowSoundSettings}
          onShowFloatingPanelSettings={() => openModal('floatingPanelSettings')}
          compareMode={compareMode}
          onToggleCompare={handleToggleCompare}
        />
        
        <StatisticsOverview />
        
        {/* Ленивая загрузка секции аналитики */}
        <Suspense
          fallback={
            <div className="mb-6">
              <div className="glass-effect rounded-xl p-8 border border-gray-200 dark:border-gray-700">
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
        
        {/* Версия приложения - более заметная надпись */}
        <div className="mt-4 mb-2 px-2 text-center">
          <p className="text-sm text-gray-500 dark:text-gray-400">
            Time Tracker Dashboard v1.1.0
          </p>
        </div>
        
        <FloatingPanel />
        
        <Footer />
        
        <NotificationContainer />
        
        {/* ✅ ОПТИМИЗАЦИЯ: Модальные окна загружаются лениво (lazy loading) */}
        {/* Используем useDelayedUnmount для сохранения компонента в DOM до завершения анимации исчезновения */}
        <Suspense fallback={null}>
          {shouldRenderEditEntry && (
            <EditEntryModal
              isOpen={modals.editEntry?.isOpen ?? false}
              onClose={handleCloseEditEntry}
              entry={modals.editEntry?.entry}
              onSave={handleSaveEntry}
            />
          )}
          
          {shouldRenderImport && (
            <ImportModal
              isOpen={modals.import?.isOpen ?? false}
              onClose={handleCloseImport}
              onImport={handleImport}
            />
          )}
          
          {shouldRenderWorkSchedule && (
            <WorkScheduleModal
              isOpen={modals.workSchedule?.isOpen ?? false}
              onClose={handleCloseWorkSchedule}
            />
          )}
          
          {shouldRenderPaymentDatesSettings && (
            <PaymentDatesSettingsModal
              isOpen={modals.paymentDatesSettings?.isOpen ?? false}
              onClose={() => closeModal('paymentDatesSettings')}
            />
          )}
          
          {shouldRenderTutorial && (
            <TutorialModal
              isOpen={modals.tutorial?.isOpen ?? false}
              onClose={handleCloseTutorial}
              onClearDemoData={handleClearDemoData}
            />
          )}
          
          {shouldRenderAbout && (
            <AboutModal
              isOpen={modals.about?.isOpen ?? false}
              onClose={handleCloseAbout}
            />
          )}
          
          {shouldRenderSoundSettings && (
            <SoundNotificationsSettingsModal
              isOpen={modals.soundSettings?.isOpen ?? false}
              onClose={handleCloseSoundSettings}
            />
          )}
          
          {shouldRenderFloatingPanelSettings && (
            <FloatingPanelSettingsModal
              isOpen={modals.floatingPanelSettings?.isOpen ?? false}
              onClose={() => closeModal('floatingPanelSettings')}
            />
          )}
        </Suspense>
        
        {/* Режим редактирования иконок (только в dev режиме) */}
        {import.meta.env.DEV && <IconEditorOverlay />}
      </div>
    </div>
  )
}

export default App
