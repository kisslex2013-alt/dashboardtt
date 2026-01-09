/**
 * 🎯 Футер приложения
 *
 * Отображает статус синхронизации и другую полезную информацию
 */

import { useMemo } from 'react'
import { Cloud, CloudOff, RefreshCw, CheckCircle2, AlertCircle } from 'lucide-react'
import { useAuthStore } from '../../store/useAuthStore'
import { useBackupReminder } from '../../hooks/useBackupReminder'

type SyncStatus = 'synced' | 'syncing' | 'unsynced' | 'unauthorized'

interface SyncStatusConfig {
  icon: React.ReactNode
  text: string
  color: string
  tooltip: string
}

function getSyncStatusConfig(
  isAuthenticated: boolean,
  isSyncing: boolean,
  lastSyncTime: number | null
): SyncStatusConfig {
  if (!isAuthenticated) {
    return {
      icon: <CloudOff className="w-3.5 h-3.5" />,
      text: 'Не авторизован',
      color: 'text-gray-400 dark:text-gray-500',
      tooltip: 'Войдите для синхронизации данных в облако'
    }
  }

  if (isSyncing) {
    return {
      icon: <RefreshCw className="w-3.5 h-3.5 animate-spin" />,
      text: 'Синхронизация...',
      color: 'text-blue-500 dark:text-blue-400',
      tooltip: 'Идёт синхронизация с облаком'
    }
  }

  if (lastSyncTime) {
    const minutesAgo = Math.floor((Date.now() - lastSyncTime) / 60000)
    let timeText = ''
    if (minutesAgo < 1) {
      timeText = 'только что'
    } else if (minutesAgo < 60) {
      timeText = `${minutesAgo} мин. назад`
    } else if (minutesAgo < 1440) {
      timeText = `${Math.floor(minutesAgo / 60)} ч. назад`
    } else {
      timeText = new Date(lastSyncTime).toLocaleDateString('ru-RU')
    }

    return {
      icon: <CheckCircle2 className="w-3.5 h-3.5" />,
      text: 'Синхронизировано',
      color: 'text-green-500 dark:text-green-400',
      tooltip: `Последняя синхронизация: ${timeText}`
    }
  }

  return {
    icon: <AlertCircle className="w-3.5 h-3.5" />,
    text: 'Не синхронизировано',
    color: 'text-amber-500 dark:text-amber-400',
    tooltip: 'Данные ещё не синхронизированы с облаком'
  }
}

export function Footer() {
  const { isAuthenticated, isSyncing, lastSyncTime } = useAuthStore()
  
  // Инициализируем хук напоминания о бекапе
  useBackupReminder()

  const syncStatus = useMemo(
    () => getSyncStatusConfig(isAuthenticated, isSyncing, lastSyncTime),
    [isAuthenticated, isSyncing, lastSyncTime]
  )

  return (
    <footer className="fixed bottom-0 left-0 right-0 z-50 pointer-events-none p-4">
      <div className="max-w-screen-2xl mx-auto flex justify-end">
        <div 
          className={`
            group
            pointer-events-auto
            flex items-center gap-0 
            text-xs font-medium rounded-full
            bg-white/90 dark:bg-gray-800/90 backdrop-blur-md
            border border-gray-200 dark:border-gray-700
            shadow-sm transition-all duration-300 ease-out
            hover:gap-2 hover:px-3 hover:scale-105 active:scale-95
            px-2 py-1.5
            ${syncStatus.color}
          `}
          title={syncStatus.tooltip}
        >
          <div className="flex-shrink-0">
            {syncStatus.icon}
          </div>
          <span className="max-w-0 overflow-hidden whitespace-nowrap transition-all duration-300 ease-out group-hover:max-w-xs group-hover:ml-1">
            {syncStatus.text}
          </span>
        </div>
      </div>
    </footer>
  )
}
