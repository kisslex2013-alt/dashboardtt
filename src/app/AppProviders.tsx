import React, { ReactNode } from 'react'
import { ErrorBoundary } from './ErrorBoundary'
import { NotificationContainer } from '../components/ui/NotificationContainer'
import { DemoDataBanner } from '../components/ui/DemoDataBanner'
import { DashboardSkeleton } from '../components/layout/DashboardSkeleton'
import { useDailyHours } from '../store/useSettingsStore'
import { useDelayedUnmount } from '../hooks/useDelayedUnmount'
import { useThemeTransition } from '../hooks/useThemeTransition'
import { useAppHandlers } from '../hooks/useAppHandlers'

interface AppProvidersProps {
  children: ReactNode
}

/**
 * Глобальный провайдер приложения.
 * Содержит обёртки, инициализацию стилей и глобальные UI элементы,
 * которые должны быть доступны на всех страницах.
 */
export const AppProviders: React.FC<AppProvidersProps> = ({ children }) => {
  // Подключаем глобальные стили и переходы
  useThemeTransition()

  // Инициализация дневных часов
  useDailyHours()

  // Получаем обработчик очистки демо данных
  const { handleClearDemoData } = useAppHandlers()

  return (
    <ErrorBoundary>
      {/* TODO: Fix DashboardSkeleton children prop type definition */}
      {/* Основной контент */}
      {children}

      {/* Глобальные UI элементы */}
      <NotificationContainer />
      <DemoDataBanner onClearDemoData={handleClearDemoData} />

    </ErrorBoundary>
  )
}
