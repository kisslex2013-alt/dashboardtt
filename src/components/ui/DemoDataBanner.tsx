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

  const [isOpen, setIsOpen] = useState(false)

  // Не рендерим если демо данные не загружены или очищены
  if (!isVisible) {
    return null
  }

  const handleClear = () => {
    onClearDemoData()
    setIsVisible(false)
  }

  return (
    <>
      <div className="fixed top-0 right-0 w-[150px] h-[150px] ribbon-container z-50">
        <div 
          className="ribbon absolute top-[30px] right-[-35px] bg-yellow-500 hover:bg-yellow-600 dark:bg-yellow-600 dark:hover:bg-yellow-700 text-white text-center font-bold py-[5px] px-[40px] w-[200px] text-xs tracking-wider animate-ribbon-pulse"
          onClick={() => setIsOpen(!isOpen)}
          onMouseEnter={() => setIsOpen(true)}
        >
          DEMO MODE
        </div>
      </div>

      {isOpen && (
        <div 
          className="fixed top-16 right-4 w-72 z-50 animate-in fade-in slide-in-from-top-2 duration-200"
          onMouseEnter={() => setIsOpen(true)}
          onMouseLeave={() => setIsOpen(false)}
        >
          <div className="bg-white dark:bg-gray-800 border border-yellow-500/30 rounded-lg shadow-2xl p-4 relative">
             <button 
               onClick={() => setIsOpen(false)}
               className="absolute top-2 right-2 text-gray-400 hover:text-gray-600 dark:hover:text-gray-200"
             >
               <span className="sr-only">Закрыть</span>
               <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><line x1="18" y1="6" x2="6" y2="18"></line><line x1="6" y1="6" x2="18" y2="18"></line></svg>
             </button>

             <div className="flex items-start gap-3">
               <div className="shrink-0 mt-0.5">
                  <div className="w-8 h-8 rounded-full bg-yellow-100 dark:bg-yellow-900/30 flex items-center justify-center animate-pulse">
                    <span className="text-lg">🚧</span>
                  </div>
               </div>
               
               <div className="flex-1">
                 <h4 className="font-bold text-sm mb-1 text-gray-900 dark:text-white">Демо режим</h4>
                 <p className="text-xs text-gray-600 dark:text-gray-300 mb-3 leading-relaxed">
                   Используются тестовые данные. <span className="font-medium text-yellow-600 dark:text-yellow-400">Рекомендуется очистить</span> перед использованием.
                 </p>
                 
                 <Button
                   variant="secondary"
                   onClick={handleClear}
                   className="w-full h-8 text-xs bg-yellow-500 hover:bg-yellow-600 text-white border-none shadow-md shadow-yellow-500/20"
                 >
                   <Trash2 className="w-3.5 h-3.5 mr-2" />
                   Удалить данные
                 </Button>
               </div>
             </div>
          </div>
        </div>
      )}
    </>
  )
})
