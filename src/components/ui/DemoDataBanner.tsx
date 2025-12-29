import { memo, useState, useEffect } from 'react'
import { Button } from '../ui/Button'
import { Trash2 } from 'lucide-react'

interface DemoDataBannerProps {
  onClearDemoData: () => void
}

/**
 * Плавающий баннер-предупреждение о демо-данных
 * Отображается в правом нижнем углу когда загружены демо-данные
 *
 * Performance: Мемоизирован через React.memo
 */
export const DemoDataBanner = memo(({
  onClearDemoData
}: DemoDataBannerProps) => {
  const [isVisible, setIsVisible] = useState(false)

  // Проверяем состояние демо данных при монтировании и при изменениях
  useEffect(() => {
    const checkDemoDataStatus = () => {
      const demoLoaded = localStorage.getItem('demo_data_loaded') === 'true'
      const demoCleared = localStorage.getItem('demo_data_cleared') === 'true'
      setIsVisible(demoLoaded && !demoCleared)
    }

    checkDemoDataStatus()

    // Подписываемся на изменения localStorage
    const handleStorageChange = () => {
      checkDemoDataStatus()
    }

    window.addEventListener('storage', handleStorageChange)
    
    // Также проверяем при любом изменении в том же окне
    const interval = setInterval(checkDemoDataStatus, 1000)

    return () => {
      window.removeEventListener('storage', handleStorageChange)
      clearInterval(interval)
    }
  }, [])

  // Не рендерим если демо данные не загружены или очищены
  if (!isVisible) {
    return null
  }

  const handleClear = () => {
    onClearDemoData()
    setIsVisible(false)
  }

  return (
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
              onClick={handleClear}
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
  )
})

