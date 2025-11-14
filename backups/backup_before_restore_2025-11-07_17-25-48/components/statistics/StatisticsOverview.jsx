import { useState, useRef } from 'react';
import { ChevronDown, ChevronUp, TrendingUp } from 'lucide-react';
import { PlanFactCompactView } from './PlanFactCompactView';
import { InsightsPanel } from './InsightsPanel';
import { useDelayedUnmount } from '../../hooks/useDelayedUnmount';

/**
 * Объединенный виджет статистики и инсайтов
 * - Содержит "План/факт заработка" и "Инсайты"
 * - Сворачиваемая секция (по умолчанию свернута)
 * - Sticky при раскрытии
 * - Анимация раскрытия и сворачивания
 */
export function StatisticsOverview() {
  const [isExpanded, setIsExpanded] = useState(false); // По умолчанию свернуто
  const headerRef = useRef(null);
  const contentRef = useRef(null);
  
  // ✨ ИСПРАВЛЕНИЕ: Используем useDelayedUnmount для плавной анимации закрытия
  const shouldRenderContent = useDelayedUnmount(isExpanded, 300);

  return (
    <div className="mb-6 relative">
      {/* Заголовок секции с кнопкой сворачивания */}
      <div 
        ref={headerRef}
        className={`glass-effect rounded-xl p-4 mb-4 overflow-visible ${isExpanded ? 'sticky top-0 z-[40] backdrop-blur-xl bg-white/90 dark:bg-gray-800/90 shadow-lg transition-normal' : ''}`}
      >
        <button
          onClick={() => setIsExpanded(!isExpanded)}
          className="flex items-center gap-3 hover:opacity-80 transition-normal w-full text-left"
        >
          <TrendingUp className="w-6 h-6 text-blue-500" />
          <h2 className="text-xl font-bold text-gray-900 dark:text-white">
            Статистика и аналитика
          </h2>
          {isExpanded ? (
            <ChevronUp className="w-5 h-5 text-gray-500 ml-auto" />
          ) : (
            <ChevronDown className="w-5 h-5 text-gray-500 ml-auto" />
          )}
        </button>
      </div>
      
      {/* Контент с анимацией раскрытия и сворачивания */}
      {shouldRenderContent && (
        <div 
          ref={contentRef}
          className={isExpanded ? 'animate-slide-up' : 'animate-slide-out'}
        >
          <PlanFactCompactView 
            shouldAnimate={isExpanded} 
            shouldShow={shouldRenderContent}
            key={`plan-fact-${isExpanded}`} 
          />
          <InsightsPanel 
            shouldAnimate={isExpanded} 
            key={`insights-${isExpanded}`} 
          />
        </div>
      )}
    </div>
  );
}

