import React, { lazy, Suspense } from 'react'

// ✅ ОПТИМИЗАЦИЯ: Lazy loading для модальных окон
// Используем именованные импорты преобразованные в default для React.lazy
const EditEntryModal = lazy(() =>
  import('../components/modals/EditEntryModal').then(module => ({ default: module.EditEntryModal }))
)
const ImportModal = lazy(() =>
  import('../components/modals/ImportModal').then(module => ({ default: module.ImportModal }))
)
const WorkScheduleModal = lazy(() =>
  import('../components/modals/WorkScheduleModal').then(module => ({
    default: module.WorkScheduleModal,
  }))
)
const PaymentDatesSettingsModal = lazy(() =>
  import('../components/modals/PaymentDatesSettingsModal/index').then(module => ({
    default: module.PaymentDatesSettingsModal,
  }))
)
const TutorialModal = lazy(() =>
  import('../components/modals/TutorialModal').then(module => ({ default: module.TutorialModal }))
)
const AboutModal = lazy(() =>
  import('../components/modals/AboutModal').then(module => ({ default: module.AboutModal }))
)
const SoundNotificationsSettingsModal = lazy(() =>
  import('../components/modals/SoundNotificationsSettingsModal').then(module => ({
    default: module.SoundNotificationsSettingsModal,
  }))
)
const FloatingPanelSettingsModal = lazy(() =>
  import('../components/modals/FloatingPanelSettingsModal').then(module => ({
    default: module.FloatingPanelSettingsModal,
  }))
)
const NotificationsDisplayModal = lazy(() =>
  import('../components/modals/NotificationsDisplayModal').then(module => ({
    default: module.NotificationsDisplayModal,
  }))
)

// Dev-only компонент
const DevIconEditor = lazy(() =>
  import('../components/dev/DevIconEditor').then(module => ({
    default: module.DevIconEditor,
  }))
)

// ... imports (lazy definitions remain the same)
import { useAppSelectors } from '../hooks/useAppSelectors'
import { useAppHandlers } from '../hooks/useAppHandlers'
// TODO: Import specific handlers if needed, or get them from selectors if available
// For now, assuming basic close handlers are sufficient or available in store
// Update: Looks like close handles are generic in store, but specific actions like onImport need specific handlers.
// Let's import the store hooks to dispatch actions directly or close modals.

/**
 * Контейнер для всех модальных окон.
 * Получает состояние открытия из пропсов, но обработчики берет из хуков.
 */
export const AppModals: React.FC<{ modals: any }> = ({ modals }) => {
  const { closeModal } = useAppSelectors()
  const { handleImport, handleClearDemoData } = useAppHandlers()

  // Обработчики закрытия для каждой модалки
  const handleClose = (modalName: string) => () => closeModal(modalName)

  return (
    <Suspense fallback={null}>
      {modals.editEntry?.isOpen && (
        <EditEntryModal
           isOpen={modals.editEntry.isOpen}
           onClose={handleClose('editEntry')}
           entry={modals.editEntry.entry}
        />
      )}
      {modals.import?.isOpen && (
        <ImportModal
          isOpen={modals.import.isOpen}
          onClose={handleClose('import')}
          onImport={handleImport}
        />
      )}
      {modals.workSchedule?.isOpen && (
        <WorkScheduleModal
          isOpen={modals.workSchedule.isOpen}
          onClose={handleClose('workSchedule')}
        />
      )}
      {modals.paymentDatesSettings?.isOpen && (
        <PaymentDatesSettingsModal
          isOpen={modals.paymentDatesSettings.isOpen}
          onClose={handleClose('paymentDatesSettings')}
        />
      )}
      {modals.tutorial?.isOpen && (
        <TutorialModal
          isOpen={modals.tutorial.isOpen}
          onClose={handleClose('tutorial')}
          onClearDemoData={handleClearDemoData}
        />
      )}
      {modals.about?.isOpen && (
        <AboutModal
          isOpen={modals.about.isOpen}
          onClose={handleClose('about')}
        />
      )}
      {modals.soundSettings?.isOpen && (
        <SoundNotificationsSettingsModal
          isOpen={modals.soundSettings.isOpen}
          onClose={handleClose('soundSettings')}
        />
      )}
      {modals.floatingPanelSettings?.isOpen && (
        <FloatingPanelSettingsModal
          isOpen={modals.floatingPanelSettings.isOpen}
          onClose={handleClose('floatingPanelSettings')}
        />
      )}
      {modals.notificationsDisplay?.isOpen && (
        <NotificationsDisplayModal
          isOpen={modals.notificationsDisplay.isOpen}
          onClose={handleClose('notificationsDisplay')}
        >
          {null}
        </NotificationsDisplayModal>
      )}

      {/* Dev Tools */}
      {import.meta.env.DEV && modals.categoryManager?.isOpen && ( // Example dev tool or check store better
         null // Placeholder if dev icon editor was mapped differently
      )}
    </Suspense>
  )
}
