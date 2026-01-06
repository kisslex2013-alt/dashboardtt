import React from 'react'
import { AppProviders } from './app/AppProviders'
import { AppContent } from './app/AppContent'
import { AppModals, SyncConflictModalContainer, TimeOverlapModalContainer } from './app/AppModals'
import { useAppSelectors } from './hooks/useAppSelectors'
import { useAINotificationMonitor } from './hooks/useAINotificationMonitor'
import { useAuthMonitor } from './hooks/useAuthMonitor'
import { useWelcomeScreen } from './hooks/useWelcomeScreen'
import { UpdatePasswordModal } from './components/auth/UpdatePasswordModal'


/**
 * Корневой компонент приложения.
 * Собирает вместе провайдеры, контент и модальные окна.
 * Основная логика вынесена в подкомпоненты для лучшей читаемости и производительности.
 */
export function App() {
  // Получаем состояние модальных окон
  const { modals } = useAppSelectors()

  // Автоматический мониторинг AI-уведомлений
  useAINotificationMonitor()
  
  // Мониторинг авторизации и обработка PASSWORD_RECOVERY
  const { showUpdatePassword, handleCloseUpdatePassword } = useAuthMonitor()

  // Автоматический показ приветственного окна при первом визите
  useWelcomeScreen()

  return (
    <AppProviders>
      <AppContent />
      <AppModals modals={modals} />
      <SyncConflictModalContainer />
      <TimeOverlapModalContainer />
      {/* Модал для обновления пароля (после сброса) */}
      <UpdatePasswordModal 
        isOpen={showUpdatePassword} 
        onClose={handleCloseUpdatePassword} 
      />
    </AppProviders>
  )
}

