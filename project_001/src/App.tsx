import React, { useState, useEffect, useRef, lazy, Suspense, useCallback } from 'react'
import { Header } from './components/layout/Header/index'
import { Footer } from './components/layout/Footer'

// ✅ ОПТИМИЗАЦИЯ: Lazy loading для больших компонентов
const FloatingPanel = lazy(() =>
  import('./components/layout/FloatingPanel').then(module => ({ default: module.FloatingPanel }))
)

// ✅ ROUTE-BASED SPLITTING: Используем route-based code splitting для основных секций
// Каждая секция загружается в отдельный chunk для лучшей оптимизации
import {
  StatisticsRoute,
  AnalyticsRoute,
  EntriesRoute,
  FloatingPomodoroRoute,
  RouteWrapper,
} from './routes'

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
  import('./components/modals/PaymentDatesSettingsModal/index').then(module => ({
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
const NotificationsDisplayModal = lazy(() =>
  import('./components/modals/NotificationsDisplayModal').then(module => ({
    default: module.NotificationsDisplayModal,
  }))
)

import { NotificationContainer } from './components/ui/NotificationContainer'
import { IconSelect } from './components/ui/IconSelect'
import { ColorPicker } from './components/ui/ColorPicker'
import { SkeletonCard, SkeletonList } from './components/ui/SkeletonCard'
import { Button } from './components/ui/Button'
import { Trash2 } from 'lucide-react'
import { getIcon } from './utils/iconHelper'
import { useAppSelectors } from './hooks/useAppSelectors'
import { DashboardSkeleton } from './components/layout/DashboardSkeleton'
// ✅ ОПТИМИЗАЦИЯ: useSettingsStore используется только в exportToJSON, можно оставить статический импорт
// (динамический импорт в useEntriesStore используется только для бэкапов)
import { useSettingsStore, usePomodoroSettings, useColorScheme, useSetColorScheme, useDailyHours } from './store/useSettingsStore'
import { useShowWarning } from './store/useUIStore'
import { usePomodoro } from './hooks/usePomodoro'
import { useHotkeys } from './hooks/useHotkeys'
import { useIconEditor } from './hooks/useIconEditor'
import { useIconEditorStore } from './store/useIconEditorStore'
import { useTimer } from './hooks/useTimer'
import { useOvertimeAlerts } from './hooks/useOvertimeAlerts'
import { exportToJSON } from './utils/exportImport'
import { logger } from './utils/logger'
import { getTodayString } from './utils/dateHelpers'
import { calculateDuration } from './utils/calculations'
import { format } from 'date-fns'
import { useDelayedUnmount } from './hooks/useDelayedUnmount'
import { useClearEntries, useEntriesStore } from './store/useEntriesStore'
import { loadDemoData } from './utils/loadDemoData'
import { handleError } from './utils/errorHandler'
import { useSync } from './hooks/useSync'
import { useUpdateCategoryColors } from './store/useSettingsStore'
// ✅ ОТКЛЮЧЕНО: Модальное окно обновления работает нестабильно
// import { UpdateModal } from './components/UpdateModal'
// import { useVersionCheck } from './hooks/useVersionCheck'
import { useAppVersion } from './hooks/useAppVersion'
import { useIncognitoMode } from './hooks/useIncognitoMode'
import { useHapticFeedback } from './hooks/useHapticFeedback'
import { generateUUID } from './utils/uuid'

function App() {
  // Получаем версию приложения из version.json
  const { version, build } = useAppVersion()

  // ✅ ОТКЛЮЧЕНО: Проверка обновлений версии работает нестабильно
  // Проверка обновлений версии (только если версия определена и не пустая)
  // КРИТИЧНО: Отключаем проверку на промо-странице и если версия не определена
  // const currentBuildVersion = import.meta.env.VITE_BUILD_VERSION
  // const isPromoPage = window.location.pathname.includes('/promo/')
  // const versionCheckEnabled = 
  //   !isPromoPage && 
  //   currentBuildVersion && 
  //   currentBuildVersion.trim() !== ''
  // 
  // const {
  //   updateAvailable,
  //   countdown,
  //   dismiss,
  //   setDismiss,
  //   progress,
  //   changelog,
  //   newVersion,
  //   isPaused,
  //   setIsPaused,
  // } = useVersionCheck(versionCheckEnabled ? currentBuildVersion : null)
  // 
  // Состояние для тестового вызова модалки обновления
  // const [testUpdateModal, setTestUpdateModal] = useState(false)

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
  
  const showWarning = useShowWarning()

  // ✅ SKELETON LOADER: Отслеживание гидрации storов для показа skeleton loader
  // Всегда показываем skeleton минимум на 600мс для плавности UX
  // Это гарантирует, что skeleton перекроет начальный loading screen из index.html
  const [isHydrated, setIsHydrated] = useState(false)

  // ✅ SKELETON LOADER: Проверяем гидрацию storов после монтирования
  useEffect(() => {
    let checkInterval = null
    let maxWaitTimer = null

    // Проверяем наличие ключей persist в localStorage
    const checkHydration = () => {
      const hasEntriesKey = localStorage.getItem('time-tracker-entries') !== null
      const hasSettingsKey = localStorage.getItem('time-tracker-settings') !== null
      
      // Если оба ключа есть, считаем что гидрация завершена
      return hasEntriesKey && hasSettingsKey
    }

    // Минимальное время показа skeleton (600мс) для плавности UX
    // Это гарантирует, что skeleton перекроет начальный loading screen из index.html
    // После этого проверяем гидрацию и показываем контент
    const minDisplayTimer = setTimeout(() => {
      if (checkHydration()) {
        setIsHydrated(true)
      } else {
        // Если ключей еще нет, проверяем периодически
        checkInterval = setInterval(() => {
          if (checkHydration()) {
            if (checkInterval) clearInterval(checkInterval)
            if (maxWaitTimer) clearTimeout(maxWaitTimer)
            setIsHydrated(true)
          }
        }, 100)

        // Максимальное время ожидания (еще 400мс после минимального = 1000мс всего)
        // После этого показываем контент в любом случае
        maxWaitTimer = setTimeout(() => {
          if (checkInterval) clearInterval(checkInterval)
          setIsHydrated(true)
        }, 400)
      }
    }, 600)

    return () => {
      clearTimeout(minDisplayTimer)
      if (checkInterval) clearInterval(checkInterval)
      if (maxWaitTimer) clearTimeout(maxWaitTimer)
    }
  }, [])

  // ✅ Отслеживание наличия демо-данных для показа предупреждения
  // Показываем предупреждение ТОЛЬКО когда загружены ровно 906 демо-записей
  const [hasDemoData, setHasDemoData] = useState(() => {
    const isDemoLoaded = localStorage.getItem('demo_data_loaded') === 'true'
    const has906Entries = entries.length === 906
    return isDemoLoaded && has906Entries
  })

  // Обновляем состояние при изменении entries или localStorage
  useEffect(() => {
    const checkDemoData = () => {
      const isDemoLoaded = localStorage.getItem('demo_data_loaded') === 'true'
      const has906Entries = entries.length === 906
      setHasDemoData(isDemoLoaded && has906Entries)
    }
    checkDemoData()
    
    // Слушаем изменения localStorage из других вкладок
    const handleStorageChange = (e) => {
      if (e.key === 'demo_data_loaded') {
        checkDemoData()
      }
    }
    window.addEventListener('storage', handleStorageChange)
    
    return () => {
      window.removeEventListener('storage', handleStorageChange)
    }
  }, [entries.length])

  const { start, stop, isRunning } = useTimer()
  const triggerHaptic = useHapticFeedback() // ✅ UX: Haptic feedback для мобильных устройств
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
      showSuccess('Цвета категорий обновлены!')
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
  const shouldRenderNotificationsDisplay = useDelayedUnmount(modals.notificationsDisplay?.isOpen ?? false, 350)
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
      triggerHaptic('medium') // ✅ UX: Вибрация при остановке таймера
      const entryData = stop()

      if (entryData) {
        // Открываем модальное окно с предзаполненными данными
        openModal('editEntry', { entry: entryData })
        showSuccess('Таймер остановлен. Проверьте и сохраните запись.')
      }
    } else {
      // Запускаем таймер
      triggerHaptic('medium') // ✅ UX: Вибрация при запуске таймера
      start('Разработка')
      showSuccess('Таймер запущен')
    }
  }, [isRunning, stop, start, openModal, showSuccess, triggerHaptic])

  // ✅ ОПТИМИЗАЦИЯ: Мемоизация callback'ов для модальных окон (предотвращает лишние re-renders)
  const handleShowTutorial = useCallback(() => openModal('tutorial'), [openModal])
  const handleShowAbout = useCallback(() => openModal('about'), [openModal])
  const handleShowSoundSettings = useCallback(() => openModal('soundSettings'), [openModal])
  const handleShowEditEntry = useCallback(() => openModal('editEntry'), [openModal])
  const handleShowImport = useCallback(() => openModal('import'), [openModal])
  
  // Функции для открытия модалок из мобильного меню
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

  // Обработчик удаления тестовых данных
  const handleClearDemoData = useCallback(() => {
    try {
      // ✅ КРИТИЧНО: Сначала очищаем persist storage, чтобы данные не восстановились
      // Очищаем localStorage для persist middleware (ключ 'time-tracker-entries')
      localStorage.removeItem('time-tracker-entries')
      
      // Удаляем флаг загрузки тестовых данных
      localStorage.removeItem('demo_data_loaded')

      // ✅ КРИТИЧНО: Устанавливаем флаг, что данные были очищены вручную
      // Это предотвратит автоматическую загрузку демо-данных после очистки
      localStorage.setItem('demo_data_cleared', 'true')

      // Очищаем все записи в store
      clearEntries()

      // ✅ Принудительно обновляем store, чтобы убедиться, что entries пустой
      useEntriesStore.setState({ entries: [] })

      // Обновляем состояние для скрытия предупреждения
      setHasDemoData(false)

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
    'ctrl+alt+n': () => openModal('notificationsDisplay'),
    // ✅ ОТКЛЮЧЕНО: Горячая клавиша для тестового вызова модалки обновления
    // 'ctrl+alt+u': () => {
    //   setTestUpdateModal(true)
    // },
  }, {
    ignoreInputs: false, // Разрешаем хоткей даже в input полях для CTRL+ALT+N
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

  // ✅ Умное напоминание об экспорте - флаг для отслеживания показа напоминания
  const reminderShownRef = useRef(false)
  const lastReminderDateRef = useRef<string | null>(null)

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
      
      // Сохраняем информацию о последнем экспорте для умного напоминания
      const exportInfo = {
        timestamp: Date.now(),
        entriesCount: allEntries.length,
      }
      localStorage.setItem('lastExportInfo', JSON.stringify(exportInfo))
      
      // Сбрасываем флаг напоминания, чтобы оно могло появиться снова при необходимости
      reminderShownRef.current = false
      
      showSuccess(`Данные успешно экспортированы (${allEntries.length} записей)`)
      logger.log(`✅ Экспорт завершен. Экспортировано ${allEntries.length} записей`)
    } catch (error) {
      // ИСПРАВЛЕНО: Используем централизованную обработку ошибок
      const errorMessage = handleError(error, { operation: 'Экспорт всех данных' })
      logger.error('❌ Ошибка экспорта:', error)
      showError(errorMessage)
    }
  }, [categories, showSuccess, showError])

  // ✅ Умное напоминание об экспорте при переключении вкладки
  // Теперь проверяет переработку и не показывает слишком часто
  const dailyHours = useDailyHours()
  useEffect(() => {
    let visibilityTimer = null

    const checkExportReminder = () => {
      // Пропускаем, если напоминание уже было показано в этой сессии
      if (reminderShownRef.current) return

      // Проверяем, не показывали ли мы напоминание сегодня
      const today = format(new Date(), 'yyyy-MM-dd')
      if (lastReminderDateRef.current === today) {
        return // Уже показывали сегодня
      }

      try {
        // Получаем информацию о последнем экспорте
        const lastExportInfoStr = localStorage.getItem('lastExportInfo')
        const currentEntries = useEntriesStore.getState().entries
        const currentEntriesCount = currentEntries.length

        // Если никогда не экспортировали
        if (!lastExportInfoStr) {
          if (currentEntriesCount > 0) {
            reminderShownRef.current = true
            lastReminderDateRef.current = today
            showWarning(
              '💾 Не забудьте экспортировать данные для безопасности! Нажмите кнопку "Экспорт" в шапке.',
              6000
            )
          }
          return
        }

        const lastExportInfo = JSON.parse(lastExportInfoStr)
        const lastExportTime = lastExportInfo.timestamp
        const lastExportEntriesCount = lastExportInfo.entriesCount || 0

        // Проверяем, прошло ли больше 7 дней с последнего экспорта (увеличено с 3 до 7)
        const daysSinceExport = (Date.now() - lastExportTime) / (1000 * 60 * 60 * 24)
        const shouldRemindByTime = daysSinceExport > 7

        // Проверяем переработку за сегодня (превышение дневной нормы часов)
        const dailyHoursNum = Number(dailyHours) || 8
        const todayStr = format(new Date(), 'yyyy-MM-dd')
        const todayEntries = currentEntries.filter(entry => {
          if (!entry || !entry.date) return false
          const entryDateStr = entry.date.split('T')[0]
          return entryDateStr === todayStr
        })

        let totalHoursToday = 0
        todayEntries.forEach(entry => {
          if (entry.duration) {
            totalHoursToday += parseFloat(entry.duration) || 0
          } else if (entry.start && entry.end) {
            const duration = calculateDuration(entry.start, entry.end)
            totalHoursToday += Number.isFinite(duration) ? duration : 0
          }
        })
        totalHoursToday = Number.isFinite(totalHoursToday) ? totalHoursToday : 0

        // Показываем напоминание только если есть переработка (превышение нормы)
        const hasOvertime = totalHoursToday > dailyHoursNum

        // Показываем напоминание только если:
        // 1. Есть переработка (превышение нормы часов) ИЛИ
        // 2. Прошло больше 7 дней с последнего экспорта
        // НЕ показываем только из-за количества записей, если нет переработки
        if (hasOvertime && totalHoursToday > 0) {
          reminderShownRef.current = true
          lastReminderDateRef.current = today
          
          const overtimeHours = totalHoursToday - dailyHoursNum
          const message = `💾 Рекомендуем экспортировать данные: переработка ${overtimeHours.toFixed(1)} ${overtimeHours === 1 ? 'час' : overtimeHours < 5 ? 'часа' : 'часов'} (${totalHoursToday.toFixed(1)}ч / норма: ${dailyHoursNum}ч). Нажмите кнопку "Экспорт" в шапке.`

          showWarning(message, 7000)
        } else if (shouldRemindByTime) {
          // Показываем напоминание по времени только если прошло больше 7 дней
          reminderShownRef.current = true
          lastReminderDateRef.current = today
          
          const message = `💾 Рекомендуем экспортировать данные: прошло ${Math.floor(daysSinceExport)} дней с последнего экспорта. Нажмите кнопку "Экспорт" в шапке.`

          showWarning(message, 7000)
        }
      } catch (error) {
        logger.error('❌ Ошибка при проверке напоминания об экспорте:', error)
      }
    }

    const handleVisibilityChange = () => {
      // Показываем напоминание при переключении вкладки (когда вкладка становится видимой)
      if (document.visibilityState === 'visible') {
        // Очищаем предыдущий таймер, если он есть
        if (visibilityTimer) {
          clearTimeout(visibilityTimer)
        }
        
        // Небольшая задержка, чтобы не показывать сразу при открытии
        visibilityTimer = setTimeout(() => {
          checkExportReminder()
        }, 2000) // 2 секунды после возврата на вкладку
      } else {
        // Очищаем таймер при скрытии вкладки
        if (visibilityTimer) {
          clearTimeout(visibilityTimer)
          visibilityTimer = null
        }
      }
    }

    document.addEventListener('visibilitychange', handleVisibilityChange)

    return () => {
      document.removeEventListener('visibilitychange', handleVisibilityChange)
      if (visibilityTimer) {
        clearTimeout(visibilityTimer)
      }
    }
  }, [showWarning, dailyHours])

  const handleImport = async (data, mode) => {
    try {
      // Проверяем наличие данных
      if (!data) {
        throw new Error('Данные для импорта отсутствуют')
      }

      logger.log('📥 Импорт данных:', data)
      logger.log('📊 Количество записей:', data.entries?.length)
      logger.log('🎯 Режим импорта:', mode)

      // Проверяем наличие записей
      if (!data.entries || !Array.isArray(data.entries)) {
        throw new Error('Записи отсутствуют или имеют неверный формат')
      }

      if (data.entries.length === 0) {
        throw new Error('Файл не содержит записей для импорта')
      }

      // Преобразуем записи: categoryId → category, генерируем ID если нужно
      const processedEntries = data.entries.map((entry, index) => {
        // Проверяем обязательные поля
        if (!entry.date) {
          logger.warn(`⚠️ Запись ${index + 1} не имеет даты, пропускаем`)
          return null
        }

        // Генерируем ID если отсутствует
        const entryId = entry.id || generateUUID()
        
        // Если есть categoryId, но нет category - копируем значение
        let category = entry.category
        if (entry.categoryId && !category) {
          category = entry.categoryId
        }
        // Если нет ни categoryId, ни category - ставим дефолтную
        if (!category && !entry.categoryId) {
          category = 'remix'
        }
        
        return {
          ...entry,
          id: entryId,
          category,
          categoryId: category, // Оставляем и categoryId для совместимости
        }
      }).filter(entry => entry !== null) // Удаляем null записи

      if (processedEntries.length === 0) {
        throw new Error('Нет валидных записей для импорта')
      }

      logger.log('📝 Обработано записей:', processedEntries.length)
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
      if (data.categories && Array.isArray(data.categories)) {
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
      // Проверяем, что база пустая, тестовые данные еще не загружались
      // И данные НЕ были очищены вручную пользователем
      const demoDataCleared = localStorage.getItem('demo_data_cleared') === 'true'
      if (entries.length === 0 && !localStorage.getItem('demo_data_loaded') && !demoDataCleared) {
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

  // ✅ SKELETON LOADER: Показываем skeleton пока данные не загружены
  if (!isHydrated) {
    return <DashboardSkeleton />
  }

  return (
    <>
      {/* ✅ ОТКЛЮЧЕНО: Модалка обновления работает нестабильно */}
      {/* Модалка обновления - показывается поверх всего контента */}
      {/* {(updateAvailable && !dismiss) || testUpdateModal ? (
        <UpdateModal
          countdown={testUpdateModal ? 10 : countdown}
          progress={testUpdateModal ? 0 : progress}
          changelog={testUpdateModal ? [
            '✨ Экспорт данных в Excel формат',
            '✨ Новые темы оформления',
            '🚀 Оптимизирована производительность',
            '🚀 Улучшен интерфейс импорта',
            '🐛 Исправлены ошибки импорта JSON',
          ] : changelog}
          newVersion={newVersion || '1.4.0'}
          currentVersion={version || currentBuildVersion || '1.3.0'}
          isTestMode={testUpdateModal}
          onPauseChange={testUpdateModal ? undefined : setIsPaused}
          onUpdateNow={() => {
            if (testUpdateModal) {
              setTestUpdateModal(false)
              return
            }
            if (window.safeReload) {
              window.safeReload(true)
            } else {
              window.location.reload(true)
            }
          }}
          onLater={() => {
            if (testUpdateModal) {
              setTestUpdateModal(false)
            } else {
              setDismiss(true)
            }
          }}
        />
      ) : null} */}
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
          compareMode={compareMode}
          onToggleCompare={handleToggleCompare}
          onOpenCategories={handleOpenCategories}
          onOpenBackups={handleOpenBackups}
          onExport={handleExport}
          onImport={handleShowImport}
        />
      </div>

      {/* ✅ Глобальное предупреждение о демо-данных - водяной знак */}
      {hasDemoData && (
        <div className="fixed bottom-4 right-4 z-50 pointer-events-none">
          <div className="bg-yellow-400/30 dark:bg-yellow-600/30 backdrop-blur-sm border border-yellow-500/20 dark:border-yellow-500/15 rounded-lg p-2.5 shadow-xl pointer-events-auto max-w-[240px]">
            <div className="flex items-start gap-1.5">
              <div className="flex-1 min-w-0">
                <h4 className="font-semibold text-xs mb-1 text-yellow-900 dark:text-yellow-100">
                  Используются демо данные
                </h4>
                <p className="text-[10px] text-yellow-800 dark:text-yellow-200 mb-2 leading-tight">
                  После ознакомления{' '}
                  <strong>рекомендуется удалить</strong> тестовые данные.
                </p>
                <Button
                  variant="danger"
                  onClick={handleClearDemoData}
                  icon={Trash2}
                  iconId="clear-demo-data-global"
                  className="w-full text-[10px] py-1 px-2"
                >
                  Удалить данные
                </Button>
              </div>
            </div>
          </div>
        </div>
      )}

      <main 
        className="max-w-7xl mx-auto p-6 relative z-20" 
        id="main-content" 
        tabIndex={-1}
      >
        {/* ✅ ROUTE-BASED SPLITTING: Statistics route - отдельный chunk */}
        <RouteWrapper route="statistics">
          <StatisticsRoute />
        </RouteWrapper>

        {/* ✅ ROUTE-BASED SPLITTING: Floating Pomodoro - плавающая панель (условно) */}
        {pomodoroSettings?.enabled && (
          <RouteWrapper route="pomodoro">
            <FloatingPomodoroRoute />
          </RouteWrapper>
        )}

        {/* ✅ ROUTE-BASED SPLITTING: Analytics route - отдельный chunk */}
        <RouteWrapper route="analytics">
          <AnalyticsRoute />
        </RouteWrapper>

        {/* ✅ ROUTE-BASED SPLITTING: Entries route - отдельный chunk */}
        <RouteWrapper route="entries">
          <EntriesRoute
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
        </RouteWrapper>

        {/* ✅ A11Y: Footer вынесен из main для правильной структуры landmarks */}
      </main>

      {/* Версия приложения - более заметная надпись */}
      <div className="mt-4 mb-2 px-2 text-center">
        <footer className="app-footer" role="contentinfo">
          {/* ✅ A11Y: Улучшаем контраст для темной темы */}
          <span className="text-xs text-gray-400 dark:text-gray-300">
            Time Tracker Dashboard
            {version && ` v${version}`}
            {build && ` ${build}`}
          </span>
        </footer>
      </div>

      {/* ✅ ОПТИМИЗАЦИЯ: Lazy loading для FloatingPanel */}
      <Suspense fallback={null}>
        <FloatingPanel />
      </Suspense>

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
          <AboutModal isOpen={modals.about?.isOpen ?? false} onClose={handleCloseAbout} />
        )}

        {shouldRenderSoundSettings && (
          <SoundNotificationsSettingsModal
            isOpen={modals.soundSettings?.isOpen ?? false}
            onClose={handleCloseSoundSettings}
            initialTab={modals.soundSettings?.activeTab}
          />
        )}

        {shouldRenderFloatingPanelSettings && (
          <FloatingPanelSettingsModal
            isOpen={modals.floatingPanelSettings?.isOpen ?? false}
            onClose={() => closeModal('floatingPanelSettings')}
          />
        )}

        {shouldRenderNotificationsDisplay && (
          <NotificationsDisplayModal
            isOpen={modals.notificationsDisplay?.isOpen ?? false}
            onClose={() => closeModal('notificationsDisplay')}
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

export { App }
