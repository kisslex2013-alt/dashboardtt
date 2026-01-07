/**
 * 🎨 PersonalizationTab Component
 *
 * Вкладка настроек персонализации (Фавикон).
 * AI-уведомления вынесены в отдельный таб AITab.
 */

import { FaviconSection } from './personalization/FaviconSection'
import { ThemeSection } from './personalization/ThemeSection'
import { LanguageSection } from './personalization/LanguageSection'

interface PersonalizationTabProps {
  // Favicon props
  faviconEnabled: boolean
  setFaviconEnabled: (value: boolean) => void
  faviconStyle: string
  setFaviconStyle: (value: string) => void
  faviconColor: string
  setFaviconColor: (value: string) => void
  faviconSpeed: string
  setFaviconSpeed: (value: string) => void
}

export function PersonalizationTab({
  faviconEnabled,
  setFaviconEnabled,
  faviconStyle,
  setFaviconStyle,
  faviconColor,
  setFaviconColor,
  faviconSpeed,
  setFaviconSpeed,
}: PersonalizationTabProps) {
  return (
    <div className="space-y-6">
       {/* Основные настройки визуализации - Grid на больших экранах */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <div className="space-y-6">
          <ThemeSection />
          <LanguageSection />
        </div>
        
        <div>
           {/* Фавикон занимает всю правую колонку или идет ниже на мобильных */}
           <FaviconSection
            enabled={faviconEnabled}
            setEnabled={setFaviconEnabled}
            animationStyle={faviconStyle}
            setAnimationStyle={setFaviconStyle}
            animationColor={faviconColor}
            setAnimationColor={setFaviconColor}
            animationSpeed={faviconSpeed}
            setAnimationSpeed={setFaviconSpeed}
          />
        </div>
      </div>
    </div>
  )
}

