import React from 'react'
import { AppProviders } from './app/AppProviders'
import { AppContent } from './app/AppContent'
import { AppModals } from './app/AppModals'
import { useAppSelectors } from './hooks/useAppSelectors'
import { useAINotificationMonitor } from './hooks/useAINotificationMonitor'

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

  return (
    <AppProviders>
      <AppContent />
      <AppModals modals={modals} />
    </AppProviders>
  )
}
