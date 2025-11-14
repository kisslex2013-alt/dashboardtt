import { useMemo } from 'react';
import { 
  Calendar, 
  Clock, 
  TrendingUp, 
  TrendingDown, 
  Activity, 
  AlertTriangle, 
  HelpCircle,
  BarChart2
} from 'lucide-react';
import { useEntriesStore } from '../../store/useEntriesStore';
import { InfoTooltip } from '../ui/InfoTooltip';
import { InsightCard } from './InsightCard';
import {
  calculateBestWeekday,
  calculatePeakProductivity,
  calculateEarningsTrend,
  calculateLongestSession,
  calculateTodayAnomaly
} from '../../utils/insightsCalculations';

/**
 * 🧠 Панель автоматических инсайтов
 * 
 * Анализирует данные пользователя и показывает умные подсказки:
 * - Лучший день недели для работы
 * - Часы с максимальной ставкой
 * - Тренд заработка
 * - Самая длинная сессия
 * - Аномалии текущего дня
 * 
 * Показывается только при наличии >= 30 записей
 */
export function InsightsPanel() {
  // Оптимизированный селектор Zustand - только entries
  const entries = useEntriesStore(state => state.entries);

  // Генерация всех инсайтов с мемоизацией
  const insights = useMemo(() => {
    // Показываем инсайты только при >= 30 записях
    if (!entries || entries.length < 30) {
      return null;
    }

    const insightsArray = [];

    // 1️⃣ Лучший день недели
    const bestDay = calculateBestWeekday(entries);
    insightsArray.push({
      id: 'best-weekday',
      title: 'Лучший день недели',
      description: `Вы зарабатываете больше всего по ${bestDay.day} — в среднем ${bestDay.avg.toLocaleString('ru-RU', { maximumFractionDigits: 0 })} ₽ в день.`,
      icon: Calendar,
      gradient: 'bg-gradient-to-br from-blue-500/80 to-gray-900/20 dark:from-blue-500/20 dark:to-gray-900/20',
      borderColor: 'rgba(59, 130, 246, 0.4)',
      iconColor: 'rgba(59, 130, 246, 0.3)',
      glowClass: 'glow-blue',
      highlightColorClass: 'text-blue-600 dark:text-blue-400'
    });

    // 2️⃣ Пик продуктивности
    const peak = calculatePeakProductivity(entries);
    insightsArray.push({
      id: 'peak-productivity',
      title: 'Пик продуктивности',
      description: `Ваша средняя ставка максимальна с ${peak.start}:00 до ${peak.end}:00 — ${Math.round(peak.rate)} ₽/ч.`,
      icon: Clock,
      gradient: 'bg-gradient-to-br from-purple-500/80 to-gray-900/20 dark:from-purple-500/20 dark:to-gray-900/20',
      borderColor: 'rgba(168, 85, 247, 0.4)',
      iconColor: 'rgba(168, 85, 247, 0.3)',
      glowClass: 'glow-purple',
      highlightColorClass: 'text-purple-600 dark:text-purple-400'
    });

    // 3️⃣ Тренд заработка
    const trend = calculateEarningsTrend(entries);
    let trendIcon = BarChart2;
    let trendGradient = 'bg-gradient-to-br from-blue-500/80 to-gray-900/20 dark:from-blue-500/20 dark:to-gray-900/20';
    let trendAccent = 'blue-500';
    let trendGlow = 'glow-blue';
    let trendHighlight = 'text-blue-600 dark:text-blue-400';

    if (trend.trend === 'растёт') {
      trendIcon = TrendingUp;
      trendGradient = 'bg-gradient-to-br from-green-500/80 to-gray-900/20 dark:from-green-500/20 dark:to-gray-900/20';
      trendAccent = 'green-500';
      trendGlow = 'glow-green';
      trendHighlight = 'text-green-600 dark:text-green-400';
    } else if (trend.trend === 'падает') {
      trendIcon = TrendingDown;
      trendGradient = 'bg-gradient-to-br from-red-500/80 to-gray-900/20 dark:from-red-500/20 dark:to-gray-900/20';
      trendAccent = 'red-500';
      trendGlow = 'glow-red';
      trendHighlight = 'text-red-600 dark:text-red-400';
    } else if (trend.trend === 'недостаточно данных') {
      trendIcon = AlertTriangle;
      trendGradient = 'bg-gradient-to-br from-gray-500/80 to-gray-900/20 dark:from-gray-500/20 dark:to-gray-900/20';
      trendAccent = 'gray-500';
      trendGlow = '';
      trendHighlight = 'text-gray-600 dark:text-gray-400';
    }

    let trendBorder = 'rgba(59, 130, 246, 0.4)';
    let trendIconColor = 'rgba(59, 130, 246, 0.3)';

    if (trend.trend === 'растёт') {
      trendBorder = 'rgba(34, 197, 94, 0.4)';
      trendIconColor = 'rgba(34, 197, 94, 0.3)';
    } else if (trend.trend === 'падает') {
      trendBorder = 'rgba(239, 68, 68, 0.4)';
      trendIconColor = 'rgba(239, 68, 68, 0.3)';
    } else if (trend.trend === 'недостаточно данных') {
      trendBorder = 'rgba(107, 114, 128, 0.4)';
      trendIconColor = 'rgba(107, 114, 128, 0.3)';
    }

    insightsArray.push({
      id: 'earnings-trend',
      title: 'Тренд заработка',
      description: (
        <>
          За последний месяц ваш заработок{' '}
          <span className={`font-bold ${trendHighlight}`}>{trend.trend}</span>.
        </>
      ),
      icon: trendIcon,
      gradient: trendGradient,
      borderColor: trendBorder,
      iconColor: trendIconColor,
      glowClass: trendGlow,
      highlightColorClass: trendHighlight
    });

    // 4️⃣ Самая длинная сессия
    const longest = calculateLongestSession(entries);
    if (longest) {
      const dateFormatted = new Date(longest.date).toLocaleDateString('ru-RU');
      const durationFormatted = `${longest.duration.toFixed(2)} ч`;
      const earnedFormatted = `${longest.earned.toLocaleString('ru-RU')} ₽`;
      insightsArray.push({
        id: 'longest-session',
        title: 'Самая длинная сессия',
        description: (
          <>
            Самая продолжительная сессия была{' '}
            <span className="font-bold text-orange-600 dark:text-orange-400">{dateFormatted}</span>
            {' — '}
            <span className="font-bold text-orange-600 dark:text-orange-400">{durationFormatted}</span>
            {' ('}
            <span className="font-bold text-orange-600 dark:text-orange-400">{earnedFormatted}</span>
            ).
          </>
        ),
        icon: Activity,
        gradient: 'bg-gradient-to-br from-orange-500/80 to-gray-900/20 dark:from-orange-500/20 dark:to-gray-900/20',
        borderColor: 'rgba(249, 115, 22, 0.4)',
        iconColor: 'rgba(249, 115, 22, 0.3)',
        glowClass: 'glow-orange',
        highlightColorClass: 'text-orange-600 dark:text-orange-400'
      });
    } else {
      // Заглушка для 4-го инсайта
      insightsArray.push({
        id: 'longest-session-placeholder',
        title: 'Самая длинная сессия',
        description: 'Здесь будет информация о самой длительной рабочей сессии.',
        icon: HelpCircle,
        gradient: 'bg-gradient-to-br from-gray-500/80 to-gray-900/20 dark:from-gray-500/20 dark:to-gray-900/20',
        borderColor: 'rgba(107, 114, 128, 0.4)',
        iconColor: 'rgba(107, 114, 128, 0.3)',
        glowClass: '',
        highlightColorClass: 'text-gray-600 dark:text-gray-400'
      });
    }

    // 5️⃣ Аномалия сегодня
    const anomaly = calculateTodayAnomaly(entries);
    if (anomaly) {
      insightsArray.push({
        id: 'today-anomaly',
        title: 'Аномалия сегодня',
        description: `Сегодня вы заработали ${anomaly.type} среднего на ${anomaly.percent}% (${anomaly.total.toLocaleString('ru-RU')} ₽).`,
        icon: anomaly.type === 'выше' ? TrendingUp : TrendingDown,
        gradient: anomaly.type === 'выше'
          ? 'bg-gradient-to-br from-green-500/80 to-gray-900/20 dark:from-green-500/20 dark:to-gray-900/20'
          : 'bg-gradient-to-br from-red-500/80 to-gray-900/20 dark:from-red-500/20 dark:to-gray-900/20',
        borderColor: anomaly.type === 'выше' ? 'rgba(34, 197, 94, 0.4)' : 'rgba(239, 68, 68, 0.4)',
        iconColor: anomaly.type === 'выше' ? 'rgba(34, 197, 94, 0.3)' : 'rgba(239, 68, 68, 0.3)',
        glowClass: anomaly.type === 'выше' ? 'glow-green' : 'glow-red',
        highlightColorClass: anomaly.type === 'выше' ? 'text-green-600 dark:text-green-400' : 'text-red-600 dark:text-red-400'
      });
    } else {
      // Заглушка для 5-го инсайта
      insightsArray.push({
        id: 'today-anomaly-placeholder',
        title: 'Аномалия сегодня',
        description: 'Здесь появится уведомление, если доход сильно отличается от вашего среднего.',
        icon: HelpCircle,
        gradient: 'bg-gradient-to-br from-gray-500/80 to-gray-900/20 dark:from-gray-500/20 dark:to-gray-900/20',
        borderColor: 'rgba(107, 114, 128, 0.4)',
        iconColor: 'rgba(107, 114, 128, 0.3)',
        glowClass: '',
        highlightColorClass: 'text-gray-600 dark:text-gray-400'
      });
    }

    return insightsArray;
  }, [entries]);

  // Не показываем панель, если недостаточно данных
  if (!insights) {
    return null;
  }

  return (
    <div className="glass-effect rounded-xl p-6 mb-6">
      {/* Заголовок с информационной иконкой */}
      <div className="flex items-center gap-2 mb-4">
        <h2 className="text-xl font-bold text-gray-900 dark:text-white">
          Инсайты
        </h2>
        <InfoTooltip text="Инсайты — это автоматически генерируемые выводы на основе ваших записей. Система анализирует ваши данные и выделяет ключевые закономерности: лучшие дни недели для работы, часы с максимальной ставкой, текущий тренд заработка и аномалии. Это помогает вам лучше понимать свою продуктивность и принимать более осознанные решения." />
      </div>

          {/* Сетка инсайтов */}
          <div className="grid grid-cols-1 md:grid-cols-5 gap-4">
            {insights.map((insight, index) => (
              <div key={insight.id} className="animate-slide-up" style={{ animationDelay: `${0.1 + index * 0.05}s`, animationFillMode: 'both' }}>
                <InsightCard
                  title={insight.title}
                  description={insight.description}
                  icon={insight.icon}
                  gradient={insight.gradient}
                  borderColor={insight.borderColor}
                  iconColor={insight.iconColor}
                  glowClass={insight.glowClass}
                  highlightColorClass={insight.highlightColorClass}
                  animationDelay={index * 0.05}
                />
              </div>
            ))}
          </div>
    </div>
  );
}

