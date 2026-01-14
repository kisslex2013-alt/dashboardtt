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

const HelpCenterModal = lazy(() =>
  import('../components/modals/HelpCenterModal').then(module => ({ default: module.HelpCenterModal }))
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
const CommandPaletteModal = lazy(() =>
  import('../components/modals/CommandPaletteModal').then(module => ({
    default: module.CommandPaletteModal,
  }))
)
const AuthModal = lazy(() =>
  import('../components/auth/AuthModal').then(module => ({
    default: module.default,
  }))
)
const AINotificationsModal = lazy(() =>
  import('../components/modals/AINotificationsModal').then(module => ({
    default: module.AINotificationsModal,
  }))
)
const SyncConflictModal = lazy(() =>
  import('../components/modals/SyncConflictModal').then(module => ({
    default: module.SyncConflictModal,
  }))
)
const TimeOverlapModal = lazy(() =>
  import('../components/modals/TimeOverlapModal').then(module => ({
    default: module.TimeOverlapModal,
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
import { useAuthStore } from '../store/useAuthStore'
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
  const { handleImport, handleClearDemoData, handleSaveEntry } = useAppHandlers()

  // Обработчики закрытия для каждой модалки
  const handleClose = (modalName: string) => () => closeModal(modalName)

  return (
    <Suspense fallback={null}>
      {modals.editEntry?.isOpen && (
        <EditEntryModal
           isOpen={modals.editEntry.isOpen}
           onClose={handleClose('editEntry')}
           entry={modals.editEntry.entry}
           onSave={handleSaveEntry}
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


      <HelpCenterModal
        isOpen={modals.helpCenter?.isOpen ?? false}
        onClose={handleClose('helpCenter')}
        initialSection={modals.helpCenter?.initialSection}
      />
      <AboutModal
        isOpen={modals.about?.isOpen ?? false}
        onClose={handleClose('about')}
      />
      <SoundNotificationsSettingsModal
        isOpen={modals.soundSettings?.isOpen ?? false}
        onClose={handleClose('soundSettings')}
        initialTab={modals.soundSettings?.activeTab}
        nested={modals.editEntry?.isOpen ?? false}
      />

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
      {modals.commandPalette?.isOpen && (
        <CommandPaletteModal
          isOpen={modals.commandPalette.isOpen}
          onClose={handleClose('commandPalette')}
        />
      )}
      {modals.auth?.isOpen && (
        <AuthModal />
      )}

      <AINotificationsModal
        isOpen={modals.aiNotifications?.isOpen ?? false}
        onClose={handleClose('aiNotifications')}
      />

      {/* Dev Tools */}
      {import.meta.env.DEV && modals.categoryManager?.isOpen && ( // Example dev tool or check store better
         null // Placeholder if dev icon editor was mapped differently
      )}
    </Suspense>
  )
}

/**
 * Модал, управляемый через useAuthStore (вне Suspense, т.к. связан с auth flow)
 */
export const SyncConflictModalContainer: React.FC = () => {
  const pendingSyncData = useAuthStore(state => state.pendingSyncData)
  const handleSyncDecision = useAuthStore(state => state.handleSyncDecision)
  const closeSyncDialog = useAuthStore(state => state.closeSyncDialog)

  if (!pendingSyncData.show || !pendingSyncData.data) return null

  return (
    <Suspense fallback={null}>
      <SyncConflictModal
        isOpen={pendingSyncData.show}
        onClose={closeSyncDialog}
        syncData={pendingSyncData.data}
        onMerge={() => handleSyncDecision('merge')}
        onKeepLocal={() => handleSyncDecision('keep-local')}
        onUseCloud={() => handleSyncDecision('use-cloud')}
      />
    </Suspense>
  )
}

/**
 * Модал для пересечений времени
 */
export const TimeOverlapModalContainer: React.FC = () => {
  const pendingOverlaps = useAuthStore(state => state.pendingOverlaps)
  const handleFixOverlaps = useAuthStore(state => state.handleFixOverlaps)
  const closeOverlapsDialog = useAuthStore(state => state.closeOverlapsDialog)

  if (!pendingOverlaps.show) return null

  return (
    <Suspense fallback={null}>
      <TimeOverlapModal
        isOpen={pendingOverlaps.show}
        onClose={closeOverlapsDialog}
        overlaps={pendingOverlaps.overlaps}
        onAutoFix={handleFixOverlaps}
        onIgnore={closeOverlapsDialog}
        resolution={pendingOverlaps.resolution ?? undefined}
      />
    </Suspense>
  )
}
