import React, { useState, useEffect, lazy, Suspense, useCallback } from 'react'
import { Header } from './components/layout/Header'
import { Footer } from './components/layout/Footer'
import { FloatingPanel } from './components/layout/FloatingPanel'
import { StatisticsOverview } from './components/statistics/StatisticsOverview'
import { EntriesList } from './components/entries/EntriesList'
import { PomodoroPanel } from './components/pomodoro/PomodoroPanel'

// 🚀 Ленивая загрузка аналитики (code-splitting)
// AnalyticsSection имеет default export, поэтому используем прямой импорт
const AnalyticsSection = lazy(() => import('./components/statistics/AnalyticsSection'))

// ✅ ОПТИМИЗАЦИЯ: Lazy loading для модальных окон (исправлено для named exports)
// Важно: lazy() ожидает default export, поэтому преобразуем named exports в default через .then()
const EditEntryModal = lazy(() =>
  import('./components/modals/EditEntryModal').then(module => ({ default: module.EditEntryModal }))
)
const ImportModal = lazy(() =>
  import('./components/modals/ImportModal').then(module => ({ default: module.ImportModal }))
)
const WorkScheduleModal = lazy(() =>
  import('./components/modals/WorkScheduleModal').then(module => ({
    default: module.WorkScheduleModal,
  }))
)
const PaymentDatesSettingsModal = lazy(() =>
  import('./components/modals/PaymentDatesSettingsModal').then(module => ({
    default: module.PaymentDatesSettingsModal,
  }))
)
const TutorialModal = lazy(() =>
  import('./components/modals/TutorialModal').then(module => ({ default: module.TutorialModal }))
)
const AboutModal = lazy(() =>
  import('./components/modals/AboutModal').then(module => ({ default: module.AboutModal }))
)
const SoundNotificationsSettingsModal = lazy(() =>
  import('./components/modals/SoundNotificationsSettingsModal').then(module => ({
    default: module.SoundNotificationsSettingsModal,
  }))
)
const FloatingPanelSettingsModal = lazy(() =>
  import('./components/modals/FloatingPanelSettingsModal').then(module => ({
    default: module.FloatingPanelSettingsModal,
  }))
)

import { NotificationContainer } from './components/ui/NotificationContainer'
import { IconSelect } from './components/ui/IconSelect'
import { ColorPicker } from './components/ui/ColorPicker'
import { getIcon } from './utils/iconHelper'
import { useAppSelectors } from './hooks/useAppSelectors'
// ✅ ОПТИМИЗАЦИЯ: useSettingsStore используется только в exportToJSON, можно оставить статический импорт
// (динамический импорт в useEntriesStore используется только для бэкапов)
import { useSettingsStore, usePomodoroSettings, useColorScheme, useSetColorScheme } from './store/useSettingsStore'
import { usePomodoro } from './hooks/usePomodoro'
import { useHotkeys } from './hooks/useHotkeys'
import { useIconEditor } from './hooks/useIconEditor'
import { useIconEditorStore } from './store/useIconEditorStore'
import { useTimer } from './hooks/useTimer'
import { useOvertimeAlerts } from './hooks/useOvertimeAlerts'
import { exportToJSON } from './utils/exportImport'
import { logger } from './utils/logger'
import { getTodayString } from './utils/dateHelpers'
import { useDelayedUnmount } from './hooks/useDelayedUnmount'
import { useClearEntries, useEntriesStore } from './store/useEntriesStore'
import { loadDemoData } from './utils/loadDemoData'
import { handleError } from './utils/errorHandler'
import { useSync } from './hooks/useSync'
import { useUpdateCategoryColors } from './store/useSettingsStore'
import UpdateModal from './components/UpdateModal'
import { useVersionCheck } from './hooks/useVersionCheck'
import { useAppVersion } from './hooks/useAppVersion'
import { useIncognitoMode } from './hooks/useIncognitoMode'

function App() {
  // Получаем версию приложения из version.json
  const { version, build } = useAppVersion()

  // Проверка обновлений версии (только если версия определена и не пустая)
  // КРИТИЧНО: Отключаем проверку на промо-странице и если версия не определена
  const currentBuildVersion = import.meta.env.VITE_BUILD_VERSION
  const isPromoPage = window.location.pathname.includes('/promo/')
  const versionCheckEnabled = 
    !isPromoPage && 
    currentBuildVersion && 
    currentBuildVersion.trim() !== ''
  
  const {
    updateAvailable,
    countdown,
    dismiss,
    setDismiss,
    progress,
    changelog,
  } = useVersionCheck(versionCheckEnabled ? currentBuildVersion : null)

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
  } = useAppSelectors()

  const { start, stop, isRunning } = useTimer()
  useOvertimeAlerts() // Отслеживание переработки
  
  // Pomodoro таймер (активируется автоматически)
  usePomodoro()
  
  // Настройки Pomodoro для условного отображения панели
  const pomodoroSettings = usePomodoroSettings()

  // ✅ СИНХРОНИЗАЦИЯ: Подписываемся на синхронизацию между вкладками
  // Использует useRef и прямой доступ к store, не вызывает ре-рендеры
  useSync()

  // ✅ ОПТИМИЗАЦИЯ: Используем атомарный селектор для минимизации ре-рендеров
  const clearEntries = useClearEntries()

  // 🎨 ИНИЦИАЛИЗАЦИЯ ЦВЕТОВОЙ СХЕМЫ: Применяем colorScheme при загрузке
  // Принудительно используем только схему "По умолчанию"
  const colorScheme = 'default'
  const { applyColorScheme } = useSettingsStore.getState()
  
  useEffect(() => {
    // Применяем colorScheme при первой загрузке - всегда 'default'
    applyColorScheme('default')
  }, []) // Только при монтировании, чтобы всегда была схема 'default'

  // 🎨 АВТОМАТИЧЕСКОЕ ОБНОВЛЕНИЕ ЦВЕТОВ: При первом запуске обновляем цвета категорий (Phase 1: Quick Wins)
  const updateCategoryColors = useUpdateCategoryColors()
  
  useEffect(() => {
    const migrationKey = 'color-migration-v2-applied'
    const alreadyMigrated = localStorage.getItem(migrationKey)
    
    if (!alreadyMigrated) {
      updateCategoryColors()
      localStorage.setItem(migrationKey, 'true')
      showSuccess('🎨 Цвета категорий обновлены!')
    }
  }, [updateCategoryColors, showSuccess])

  // Режим редактирования иконок (только в dev режиме)
  const { replaceIcon, getIconReplacement } = useIconEditor()
  const replaceButtonColor = useIconEditorStore(state => state.replaceButtonColor)
  const getButtonColor = useIconEditorStore(state => state.getButtonColor)
  const saveAsDefaults = useIconEditorStore(state => state.saveAsDefaults)
  const iconReplacements = useIconEditorStore(state => state.iconReplacements)
  const buttonColorReplacements = useIconEditorStore(state => state.buttonColorReplacements)

  // Состояние для глобального селектора иконок (правый клик)
  const [globalIconSelector, setGlobalIconSelector] = useState({ isOpen: false, iconId: null })

  // Глобальный обработчик правого клика для смены иконок (только в dev режиме)
  useEffect(() => {
    if (!import.meta.env.DEV) return

    const handleGlobalContextMenu = e => {
      // Проверяем, что клик был на кнопке с иконкой
      const target = e.target.closest('button')
      if (!target) return

      // Проверяем, есть ли иконка (svg внутри кнопки)
      const hasIcon = target.querySelector('svg')
      if (!hasIcon) return

      // Проверяем, не кликнули ли на сам селектор иконок
      if (target.closest('[data-icon-selector]')) return

      // Получаем iconId из data-атрибута (это самый надежный способ)
      let iconId = target.getAttribute('data-icon-id')

      if (!iconId) {
        // Генерируем автоматический ID так же, как в Button компоненте
        const buttonText = target.textContent?.trim() || ''
        const iconElement = target.querySelector('svg')
        const iconClass = iconElement?.className || ''
        // Пытаемся найти имя иконки из класса (например, "lucide lucide-folder")
        const iconNameMatch = iconClass.match(/lucide-(\w+)/)
        let iconName = iconNameMatch ? iconNameMatch[1] : 'icon'
        // Приводим к тому же формату, что и в Button (первая буква заглавная)
        iconName = iconName.charAt(0).toUpperCase() + iconName.slice(1)
        // Генерируем ID точно так же, как в Button.jsx (строка 41)
        iconId = `auto-${iconName}-${buttonText}`.toLowerCase().replace(/\s+/g, '-')

        // Устанавливаем data-icon-id для будущих использований
        target.setAttribute('data-icon-id', iconId)

        logger.log('[IconEditor] Сгенерирован iconId:', iconId, 'для кнопки:', buttonText)
      }

      // Открываем селектор иконок
      e.preventDefault()
      e.stopPropagation()
      setGlobalIconSelector({ isOpen: true, iconId })
    }

    document.addEventListener('contextmenu', handleGlobalContextMenu)
    return () => document.removeEventListener('contextmenu', handleGlobalContextMenu)
  }, [])

  // Состояние режима сравнения
  const [compareMode, setCompareMode] = useState(false)

  // ✅ ОПТИМИЗАЦИЯ: Задержка размонтирования для lazy-loaded модальных окон
  // Это позволяет анимации исчезновения завершиться до размонтирования компонента
  const shouldRenderEditEntry = useDelayedUnmount(modals.editEntry?.isOpen ?? false, 350)
  const shouldRenderImport = useDelayedUnmount(modals.import?.isOpen ?? false, 350)
  const shouldRenderWorkSchedule = useDelayedUnmount(modals.workSchedule?.isOpen ?? false, 350)
  const shouldRenderPaymentDatesSettings = useDelayedUnmount(
    modals.paymentDatesSettings?.isOpen ?? false,
    350
  )
  const shouldRenderTutorial = useDelayedUnmount(modals.tutorial?.isOpen ?? false, 350)
  const shouldRenderAbout = useDelayedUnmount(modals.about?.isOpen ?? false, 350)
  const shouldRenderSoundSettings = useDelayedUnmount(modals.soundSettings?.isOpen ?? false, 350)
  const shouldRenderFloatingPanelSettings = useDelayedUnmount(
    modals.floatingPanelSettings?.isOpen ?? false,
    350
  )

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
  const handleShowTutorial = useCallback(() => openModal('tutorial'), [openModal])
  const handleShowAbout = useCallback(() => openModal('about'), [openModal])
  const handleShowSoundSettings = useCallback(() => openModal('soundSettings'), [openModal])
  const handleShowEditEntry = useCallback(() => openModal('editEntry'), [openModal])
  const handleShowImport = useCallback(() => openModal('import'), [openModal])

  const handleCloseEditEntry = useCallback(() => closeModal('editEntry'), [closeModal])
  const handleCloseImport = useCallback(() => closeModal('import'), [closeModal])
  const handleCloseWorkSchedule = useCallback(() => closeModal('workSchedule'), [closeModal])
  const handleCloseTutorial = useCallback(() => closeModal('tutorial'), [closeModal])
  const handleCloseAbout = useCallback(() => closeModal('about'), [closeModal])
  const handleCloseSoundSettings = useCallback(() => closeModal('soundSettings'), [closeModal])

  // Обработчик удаления тестовых данных
  const handleClearDemoData = useCallback(() => {
    try {
      // Очищаем все записи
      clearEntries()

      // Удаляем флаг загрузки тестовых данных
      localStorage.removeItem('demo_data_loaded')

      logger.log('✅ Тестовые данные удалены')
      showSuccess('Тестовые данные успешно удалены. База данных очищена.')
    } catch (error) {
      // ИСПРАВЛЕНО: Используем централизованную обработку ошибок
      const errorMessage = handleError(error, { operation: 'Удаление тестовых данных' })
      logger.error('❌ Ошибка удаления тестовых данных:', error)
      showError(errorMessage)
    }
  }, [clearEntries, showSuccess, showError])

  // Горячие клавиши
  useHotkeys({
    n: () => openModal('editEntry'),
    t: () => openModal('editEntry'),
    s: handleTimerToggle,
    'ctrl+z': handleUndo,
    'ctrl+y': handleRedo,
  })

  const handleSaveEntry = useCallback(
    entryData => {
      logger.log('💾 handleSaveEntry вызван с данными:', entryData)

      // Проверяем флаг удаления
      if (entryData._delete) {
        deleteEntry(entryData.id)
        closeModal('editEntry')
        return
      }

      // Если есть ID - обновляем, иначе добавляем
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
    entry => {
      openModal('editEntry', { entry })
    },
    [openModal]
  )

  const handleExport = useCallback(() => {
    try {
      // Получаем все записи напрямую из store, чтобы гарантировать актуальность данных
      const allEntries = useEntriesStore.getState().entries
      const settings = useSettingsStore.getState()

      // Логируем для отладки
      logger.log(`📤 Начинаем экспорт. Всего записей в store: ${allEntries.length}`)

      // Проверяем записи за сегодня
      const today = new Date()
      // ✅ ОПТИМИЗАЦИЯ: Используем централизованную функцию для получения текущей даты
      const todayStr = getTodayString()
      const todayEntries = allEntries.filter(entry => {
        if (!entry || !entry.date) return false
        const entryDateStr = entry.date.split('T')[0] // Извлекаем дату из строки
        return entryDateStr === todayStr
      })

      logger.log(`📅 Записей за сегодня (${todayStr}): ${todayEntries.length}`)
      if (todayEntries.length > 0) {
        logger.log(
          '📋 Записи за сегодня:',
          todayEntries.map(e => ({
            date: e.date,
            start: e.start,
            end: e.end,
            id: e.id,
          }))
        )
      }

      // Сортируем записи по дате для логирования
      const sortedByDate = [...allEntries].sort((a, b) => {
        const dateA = new Date(a.date || 0)
        const dateB = new Date(b.date || 0)
        return dateB - dateA
      })

      logger.log(
        '📋 Последние 5 записей по дате:',
        sortedByDate.slice(0, 5).map(e => ({
          date: e.date,
          start: e.start,
          end: e.end,
        }))
      )

      exportToJSON(allEntries, categories, settings)
      showSuccess(`Данные успешно экспортированы (${allEntries.length} записей)`)
      logger.log(`✅ Экспорт завершен. Экспортировано ${allEntries.length} записей`)
    } catch (error) {
      // ИСПРАВЛЕНО: Используем централизованную обработку ошибок
      const errorMessage = handleError(error, { operation: 'Экспорт всех данных' })
      logger.error('❌ Ошибка экспорта:', error)
      showError(errorMessage)
    }
  }, [categories, showSuccess, showError])

  const handleImport = async (data, mode) => {
    try {
      logger.log('📥 Импорт данных:', data)
      logger.log('📊 Количество записей:', data.entries?.length)
      logger.log('🎯 Режим импорта:', mode)

      // Преобразуем записи: categoryId → category
      const processedEntries = (data.entries || []).map(entry => {
        // Если есть categoryId, но нет category - копируем значение
        if (entry.categoryId && !entry.category) {
          return { ...entry, category: entry.categoryId }
        }
        // Если нет ни categoryId, ни category - ставим дефолтную
        if (!entry.category && !entry.categoryId) {
          return { ...entry, category: 'remix' }
        }
        return entry
      })

      logger.log('📝 Обработанные записи (первые 3):', processedEntries.slice(0, 3))

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
        logger.log('✅ Импортированы категории:', data.categories.length)
      }

      // Импортируем настройки (например, dailyPlan)
      if (data.dailyPlan) {
        useSettingsStore.getState().updateSettings({ dailyGoal: data.dailyPlan })
        logger.log('✅ Импортирован дневной план:', data.dailyPlan)
      }

      logger.log('✅ Импорт завершен успешно!')
    } catch (error) {
      // ИСПРАВЛЕНО: Используем централизованную обработку ошибок
      const errorMessage = handleError(error, { operation: 'Импорт данных', mode })
      logger.error('❌ Ошибка импорта:', error)
      showError(errorMessage)
    }
  }

  // Автоматическая загрузка тестовых данных при первом запуске
  useEffect(() => {
    const loadDemo = async () => {
      // Проверяем, что база пустая и тестовые данные еще не загружались
      if (entries.length === 0 && !localStorage.getItem('demo_data_loaded')) {
        try {
          logger.log('📥 Начинаем загрузку тестовых данных...')

          // Загружаем тестовые данные
          const demoEntries = await loadDemoData()

          if (demoEntries && demoEntries.length > 0) {
            // Импортируем тестовые данные
            importEntries(demoEntries)

            // Устанавливаем флаг, что тестовые данные загружены
            localStorage.setItem('demo_data_loaded', 'true')

            logger.log(`✅ Загружено ${demoEntries.length} тестовых записей`)
            showSuccess(
              `Загружено ${demoEntries.length} демонстрационных записей для ознакомления с функционалом`
            )
          }
        } catch (error) {
          // ИСПРАВЛЕНО: Используем централизованную обработку ошибок
          const errorMessage = handleError(error, { operation: 'Загрузка тестовых данных' })
          logger.error('❌ Ошибка загрузки тестовых данных:', error)
          showError(errorMessage)
        }
      }
    }

    // Загружаем с небольшой задержкой после монтирования компонента
    const timer = setTimeout(() => {
      loadDemo()
    }, 500)

    return () => clearTimeout(timer)
  }, [entries.length, importEntries, showSuccess, showError]) // Зависимости

  // Проверка режима инкогнито
  const isIncognito = useIncognitoMode()

  // Автоматический показ Tutorial при первом запуске и в инкогнито
  useEffect(() => {
    const tutorialCompleted = localStorage.getItem('tutorial_completed')
    
    // Показываем Tutorial если:
    // 1. Это первый запуск (tutorial_completed не установлен)
    // 2. ИЛИ режим инкогнито (в инкогнито показываем всегда)
    const isFirstLaunch = !tutorialCompleted
    
    if (isFirstLaunch || isIncognito) {
      // Небольшая задержка для плавности
      const timer = setTimeout(() => {
        openModal('tutorial')
      }, 1000)
      
      return () => clearTimeout(timer)
    }
  }, [openModal, isIncognito]) // Добавляем isIncognito в зависимости

  // ✅ Создание бекапа при загрузке приложения
  useEffect(() => {
    const createInitialBackup = async () => {
      try {
        const { createManualBackup } = useEntriesStore.getState()
        const result = await createManualBackup()
        if (result.success) {
          logger.log('✅ Бекап при загрузке создан успешно')
        }
      } catch (error) {
        // ИСПРАВЛЕНО: Используем централизованную обработку ошибок
        const errorMessage = handleError(error, { operation: 'Создание начального бэкапа' })
        logger.error('❌ Ошибка создания бекапа при загрузке:', error)
        // Не показываем ошибку пользователю, так как это фоновый процесс
      }
    }

    // Создаем бекап с небольшой задержкой после загрузки
    const timer = setTimeout(() => {
      createInitialBackup()
    }, 2000) // 2 секунды после загрузки

    return () => clearTimeout(timer)
  }, []) // Выполняется только один раз при монтировании

  return (
    <>
      {/* Модалка обновления - показывается поверх всего контента */}
      {updateAvailable && !dismiss && (
        <UpdateModal
          countdown={countdown}
          progress={progress}
          changelog={changelog}
          onUpdateNow={() => {
            if (window.safeReload) {
              window.safeReload(true)
            } else {
              window.location.reload(true)
            }
          }}
          onLater={() => setDismiss(true)}
        />
      )}
      <div
        className="min-h-screen bg-gray-100 dark:bg-gray-900 transition-colors duration-300"
        style={{ isolation: 'isolate' }}
      >
      {/* ✅ A11Y: Ссылка для пропуска к основному контенту */}
      <a
        href="#main-content"
        className="sr-only focus:not-sr-only focus:absolute focus:top-4 focus:left-4 focus:z-[999999] focus:px-4 focus:py-2 focus:bg-blue-500 focus:text-white focus:rounded-lg focus:ring-2 focus:ring-blue-500 focus:ring-offset-2"
      >
        Перейти к основному контенту
      </a>
      
      <div className="max-w-7xl mx-auto p-6 relative z-20">
        <Header
          onShowTutorial={handleShowTutorial}
          onShowAbout={handleShowAbout}
          onShowSoundSettings={handleShowSoundSettings}
          onShowFloatingPanelSettings={() => openModal('floatingPanelSettings')}
          compareMode={compareMode}
          onToggleCompare={handleToggleCompare}
        />
      </div>

      <div 
        className="max-w-7xl mx-auto p-6 relative z-20" 
        id="main-content" 
        tabIndex={-1}
      >
        <StatisticsOverview />
        
        {/* Pomodoro панель (если включена) */}
        {pomodoroSettings?.enabled && <PomodoroPanel />}

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
          <footer className="app-footer">
            <span className="text-xs text-gray-400 dark:text-gray-500">
              Time Tracker Dashboard
              {version && ` v${version}`}
              {build && ` ${build}`}
            </span>
          </footer>
        </div>

        <FloatingPanel />

        <Footer />
      </div>

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
            <AboutModal isOpen={modals.about?.isOpen ?? false} onClose={handleCloseAbout} />
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
        {/* Глобальный селектор иконок при правом клике (только в dev режиме) */}
        {import.meta.env.DEV && globalIconSelector.isOpen && (
          <div
            className="fixed inset-0 z-[99999] flex items-center justify-center bg-black/50 backdrop-blur-sm"
            onClick={() => setGlobalIconSelector({ isOpen: false, iconId: null })}
            data-icon-selector="true"
          >
            <div
              className="glass-effect rounded-xl p-6 shadow-2xl max-w-md w-full mx-4 max-h-[90vh] overflow-y-auto"
              onClick={e => e.stopPropagation()}
            >
              <div className="flex items-center justify-between mb-4">
                <h3 className="text-lg font-bold">Сменить иконку и цвет</h3>
                <button
                  onClick={() => setGlobalIconSelector({ isOpen: false, iconId: null })}
                  className="p-1.5 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-800 transition-colors"
                  aria-label="Закрыть"
                >
                  <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth={2}
                      d="M6 18L18 6M6 6l12 12"
                    />
                  </svg>
                </button>
              </div>

              {/* Превью редактируемой кнопки */}
              {globalIconSelector.iconId &&
                (() => {
                  // Используем значения из store напрямую для реактивности
                  const currentIcon =
                    iconReplacements[globalIconSelector.iconId] ||
                    getIconReplacement(globalIconSelector.iconId) ||
                    'Folder'
                  const currentColor =
                    buttonColorReplacements[globalIconSelector.iconId] ||
                    getButtonColor(globalIconSelector.iconId) ||
                    '#3B82F6'
                  const IconComponent = getIcon(currentIcon)
                  const tailwindToHex = twClass => {
                    const colors = {
                      'blue-500': '#3B82F6',
                      'green-500': '#10B981',
                      'red-500': '#EF4444',
                      'gray-200': '#E5E7EB',
                      'gray-500': '#6B7280',
                      'gray-700': '#374151',
                    }
                    return colors[twClass] || twClass
                  }
                  const bgColor =
                    currentColor && currentColor.startsWith('#')
                      ? currentColor
                      : currentColor
                        ? tailwindToHex(currentColor)
                        : '#3B82F6'

                  return (
                    <div className="mb-6 p-4 bg-gray-50 dark:bg-gray-900 rounded-lg border border-gray-200 dark:border-gray-700">
                      <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                        Превью кнопки
                      </label>
                      <div className="flex items-center gap-3">
                        <button
                          className="flex items-center gap-2 px-4 py-2 rounded-lg text-white font-medium transition-colors"
                          style={{ backgroundColor: bgColor }}
                          disabled
                        >
                          {IconComponent && <IconComponent className="w-4 h-4" />}
                          <span>Кнопка: {globalIconSelector.iconId}</span>
                        </button>
                        <div className="text-xs text-gray-500 dark:text-gray-400">
                          <div>Иконка: {currentIcon || 'не выбрана'}</div>
                          <div>Цвет: {currentColor || 'не выбран'}</div>
                        </div>
                      </div>
                    </div>
                  )
                })()}

              {/* Выбор иконки */}
              <div className="mb-6">
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                  Иконка
                </label>
                <IconSelect
                  value={
                    globalIconSelector.iconId
                      ? getIconReplacement(globalIconSelector.iconId) || ''
                      : ''
                  }
                  onChange={iconName => {
                    if (iconName && globalIconSelector.iconId) {
                      logger.log(
                        '[IconEditor] Замена иконки:',
                        globalIconSelector.iconId,
                        '->',
                        iconName
                      )
                      replaceIcon(globalIconSelector.iconId, iconName)
                      logger.log(
                        '[IconEditor] Проверка после замены:',
                        useIconEditorStore.getState().iconReplacements[globalIconSelector.iconId]
                      )
                    }
                    // Не закрываем модальное окно, чтобы можно было также выбрать цвет
                  }}
                  color="#3B82F6"
                />
              </div>

              {/* Разделитель */}
              <div className="border-t border-gray-200 dark:border-gray-700 my-6"></div>

              {/* Выбор цвета */}
              <div className="mb-6">
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                  Цвет кнопки
                </label>
                <ColorPicker
                  value={
                    globalIconSelector.iconId ? getButtonColor(globalIconSelector.iconId) || '' : ''
                  }
                  onChange={color => {
                    if (color && globalIconSelector.iconId) {
                      logger.log(
                        '[IconEditor] Замена цвета:',
                        globalIconSelector.iconId,
                        '->',
                        color
                      )
                      replaceButtonColor(globalIconSelector.iconId, color)
                    }
                  }}
                />
              </div>

              {/* Разделитель */}
              <div className="border-t border-gray-200 dark:border-gray-700 my-6"></div>

              {/* Кнопка сохранения */}
              <div>
                <button
                  onClick={() => {
                    const success = saveAsDefaults()
                    if (success) {
                      showSuccess(
                        'Дефолтные значения иконок и цветов сохранены! При деплое они автоматически применятся для всех пользователей.'
                      )
                      setGlobalIconSelector({ isOpen: false, iconId: null })
                    } else {
                      showError('Ошибка сохранения значений по умолчанию')
                    }
                  }}
                  className="w-full flex items-center justify-center gap-2 px-4 py-2 rounded-lg bg-green-500 hover:bg-green-600 text-white font-medium transition-colors"
                >
                  <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth={2}
                      d="M5 13l4 4L19 7"
                    />
                  </svg>
                  Сохранить как дефолт
                </button>
              </div>
            </div>
          </div>
        )}
      </div>
    </>
  )
}

export default App
