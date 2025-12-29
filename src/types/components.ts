export interface ModalProps {
  isOpen: boolean
  onClose: () => void
}

export interface EditEntryModalProps extends ModalProps {
  entry: any // TODO: Replace with TimeEntry type
}

export interface ImportModalProps extends ModalProps {
  onImport: (data: any, mode: 'replace' | 'merge') => Promise<void>
}

export interface WorkScheduleModalProps extends ModalProps {}

export interface PaymentDatesSettingsModalProps extends ModalProps {}

export interface TutorialModalProps extends ModalProps {}

export interface AboutModalProps extends ModalProps {}

export interface SoundNotificationsSettingsModalProps extends ModalProps {}

export interface FloatingPanelSettingsModalProps extends ModalProps {}

export interface NotificationsDisplayModalProps extends ModalProps {
  children?: React.ReactNode
}

export interface DevIconEditorProps {
  showSuccess: (msg: string) => void
  showError: (msg: string) => void
}

// AppModals Props
export interface AppModalsState {
  isEditModalOpen: boolean
  isImportModalOpen: boolean
  isWorkScheduleModalOpen: boolean
  isPaymentDatesSettingsModalOpen: boolean
  isTutorialModalOpen: boolean
  isAboutModalOpen: boolean
  isSoundNotificationsSettingsModalOpen: boolean
  isFloatingPanelSettingsModalOpen: boolean
  isNotificationsDisplayModalOpen: boolean
  isDevIconEditorOpen: boolean
}
