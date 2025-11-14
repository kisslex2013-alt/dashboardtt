import { useState, useRef, useEffect, useCallback, memo } from 'react';
import { ChevronDown, ChevronUp, TrendingUp } from 'lucide-react';
import { PlanFactCompactView } from './PlanFactCompactView';
import { InsightsPanel } from './InsightsPanel';

/**
 * Объединенный виджет статистики и инсайтов
 * - Содержит "План/факт заработка" и "Инсайты"
 * - Сворачиваемая секция (по умолчанию свернута)
 * - Sticky при раскрытии
 * - Анимация раскрытия и сворачивания
 */
export const StatisticsOverview = memo(function StatisticsOverview() {
  const [isExpanded, setIsExpanded] = useState(false); // По умолчанию свернуто
  const headerRef = useRef(null);
  const contentRef = useRef(null);
  
  // Три состояния для контроля анимаций (Three-State Animation Control)
  const [shouldMountContent, setShouldMountContent] = useState(false);
  const [isAnimatingContent, setIsAnimatingContent] = useState(false);
  const [isExitingContent, setIsExitingContent] = useState(false);

  // ✅ ОПТИМИЗАЦИЯ: Мемоизация обработчика переключения (вынесен на верхний уровень)
  const handleToggleExpanded = useCallback(() => setIsExpanded(prev => !prev), []);

  // Логика открытия
  useEffect(() => {
    if (isExpanded) {
      setShouldMountContent(true);
      setIsExitingContent(false);
      const rafId = requestAnimationFrame(() => {
        setIsAnimatingContent(true);
      });
      return () => cancelAnimationFrame(rafId);
    }
  }, [isExpanded]);

  // Логика закрытия
  useEffect(() => {
    if (!isExpanded && shouldMountContent && !isExitingContent) {
      setIsAnimatingContent(false);
      const rafId = requestAnimationFrame(() => {
        setIsExitingContent(true);
      });
      return () => cancelAnimationFrame(rafId);
    }
  }, [isExpanded, shouldMountContent, isExitingContent]);

  // Слушатель окончания анимации исчезновения
  useEffect(() => {
    if (isExitingContent && contentRef.current) {
      const handleAnimationEnd = (e) => {
        if (
          e.animationName === 'slideDownOut' ||
          e.animationName.includes('slideOut') ||
          e.animationName === 'fadeOut'
        ) {
          setIsExitingContent(false);
          setShouldMountContent(false);
        }
      };

      const fallbackTimer = setTimeout(() => {
        setIsExitingContent(false);
        setShouldMountContent(false);
      }, 300);

      contentRef.current.addEventListener('animationend', handleAnimationEnd);

      return () => {
        clearTimeout(fallbackTimer);
        contentRef.current?.removeEventListener('animationend', handleAnimationEnd);
      };
    }
  }, [isExitingContent]);

  return (
    <div className="mb-6 relative">
      {/* Заголовок секции с кнопкой сворачивания */}
      <div 
        ref={headerRef}
        className={`glass-effect rounded-xl p-4 mb-4 overflow-visible ${isExpanded ? 'sticky top-0 z-[40] backdrop-blur-xl bg-white/90 dark:bg-gray-800/90 shadow-lg transition-normal' : ''}`}
      >
        <button
          onClick={handleToggleExpanded}
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
      {shouldMountContent && (
        <div 
          ref={contentRef}
          className={`${
            !isAnimatingContent && !isExitingContent ? 'opacity-0 -translate-y-4' : ''
          } ${
            isAnimatingContent ? 'animate-slide-up' : ''
          } ${
            isExitingContent ? 'animate-slide-out' : ''
          }`}
        >
          <PlanFactCompactView 
            shouldAnimate={isExpanded && !isExitingContent} 
            shouldShow={shouldMountContent}
            key={`plan-fact-${isExpanded}`} 
          />
          <InsightsPanel 
            shouldAnimate={isExpanded && !isExitingContent} 
            key={`insights-${isExpanded}`} 
          />
        </div>
      )}
    </div>
  );
});

