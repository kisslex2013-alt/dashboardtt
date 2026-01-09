import React, { lazy, Suspense, useState, useCallback } from 'react'
import { useAppHandlers } from '../hooks/useAppHandlers'
import { Header } from '../components/layout/Header/index'
import { Footer } from '../components/layout/Footer'
import { RouteWrapper, StatisticsRoute, AnalyticsRoute, PredictiveAnalyticsRoute, ComparativeAnalyticsRoute, EntriesRoute, FloatingPomodoroRoute } from '../routes/index'
import { GlobalHotkeys } from '../components/GlobalHotkeys'
import { useViewMode } from '../store/useSettingsStore'

// Lazy load FloatingPanel
const FloatingPanel = lazy(() =>
  import('../components/layout/FloatingPanel').then(module => ({ default: module.FloatingPanel }))
)

interface AppContentProps {
  // Props can be added here if needed
}

export const AppContent: React.FC<AppContentProps> = () => {
  const handlers = useAppHandlers()
  const viewMode = useViewMode()

  // Local state for UI modes
  const [compareMode, setCompareMode] = useState(false)
  const handleToggleCompare = useCallback(() => setCompareMode(prev => !prev), [])

  // В Focus режиме скрываем расширенную аналитику
  const isAnalyticsVisible = viewMode === 'analytics'

  return (
    <div className="min-h-screen bg-main text-text-primary transition-colors duration-300 flex flex-col font-sans selection:bg-purple-500/30 selection:text-purple-200">
      <GlobalHotkeys
        onToggleTimer={handlers.handleTimerToggle}
        onNewEntry={handlers.handleShowEditEntry}
        onSettings={handlers.handleShowSoundSettings}
        onHelp={handlers.handleShowTutorial}
      />
      <div className="max-w-7xl mx-auto w-full px-4 pt-4">
        <Header
          onShowTutorial={handlers.handleShowTutorial}
          onShowAbout={handlers.handleShowAbout}
          onShowSoundSettings={handlers.handleShowSoundSettings}
          compareMode={compareMode}
          onToggleCompare={handleToggleCompare}
          onOpenCategories={handlers.handleOpenCategories}
          onOpenBackups={handlers.handleOpenBackups}
          onExport={handlers.handleExport}
          onImport={handlers.handleShowImport}
        />
      </div>

      <main className="flex-grow max-w-7xl mx-auto w-full px-4 pt-6 pb-8 relative z-10">
        <Suspense fallback={null}>
          {/* Аналитика — только в Analytics режиме с анимацией */}
          <div 
            className={`
              transition-all duration-300 ease-out
              ${isAnalyticsVisible 
                ? 'opacity-100 max-h-[5000px]' 
                : 'opacity-0 max-h-0 overflow-hidden pointer-events-none'
              }
            `}
          >
            <RouteWrapper route="statistics">
              <StatisticsRoute />
            </RouteWrapper>
            <RouteWrapper route="analytics">
              <AnalyticsRoute />
            </RouteWrapper>
            <RouteWrapper route="predictive">
              <PredictiveAnalyticsRoute />
            </RouteWrapper>
            <RouteWrapper route="comparative">
              <ComparativeAnalyticsRoute />
            </RouteWrapper>
          </div>

          {/* Записи — всегда видны */}
          <RouteWrapper route="entries">
            <EntriesRoute
              onAddNew={handlers.handleShowEditEntry}
              onStartTimer={handlers.handleTimerToggle}
              onEditEntry={handlers.handleEditEntry}
              onUndo={handlers.handleUndo}
              onRedo={handlers.handleRedo}
              canUndo={handlers.canUndo}
              canRedo={handlers.canRedo}
              onExport={handlers.handleExport}
              onImport={handlers.handleShowImport}
            />
          </RouteWrapper>

          <RouteWrapper route="pomodoro">
            <FloatingPomodoroRoute />
          </RouteWrapper>
        </Suspense>
      </main>

      <Suspense fallback={null}>
        <FloatingPanel />
      </Suspense>

      <Footer />
    </div>
  )
}

