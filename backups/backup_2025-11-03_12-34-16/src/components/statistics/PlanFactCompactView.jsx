import { Calendar, DollarSign, Settings, CheckCircle, Clock, Zap, Flame, Sliders } from 'lucide-react';
import { useEntriesStore } from '../../store/useEntriesStore';
import { useSettingsStore } from '../../store/useSettingsStore';
import { useUIStore } from '../../store/useUIStore';
import { InfoTooltip } from '../ui/InfoTooltip';
import { calculateWorkingDaysInMonth } from '../../utils/calculations';
import { format } from 'date-fns';

/**
 * Расширенный виджет план/факт с 3 карточками
 * 
 * Карточка 1 (синяя): План/факт - День и Месяц
 * Карточка 2 (зелёная): Выплаты - 1/2 месяца и 2/2 месяца  
 * Карточка 3 (оранжевая): Общие итоги - Год и За все время
 */
export function PlanFactCompactView() {
  const { entries } = useEntriesStore();
  const { 
    dailyGoal, 
    workScheduleTemplate, 
    workScheduleStartDay, 
    customWorkDates 
  } = useSettingsStore();
  const { openModal } = useUIStore();

  const now = new Date();
  const currentYear = now.getFullYear();
  const currentMonth = now.getMonth();
  const currentDay = now.getDate();

  // Функция для получения названия и иконки текущего рабочего графика
  const getWorkScheduleInfo = () => {
    // Используем customWorkDates только если выбран кастомный график
    if (workScheduleTemplate === 'custom' && customWorkDates && Object.keys(customWorkDates).length > 0) {
      const daysInMonth = new Date(currentYear, currentMonth + 1, 0).getDate();
      
      // Считаем рабочие дни из customWorkDates
      let workDaysCount = 0;
      for (let day = 1; day <= daysInMonth; day++) {
        const dateKey = `${currentYear}-${String(currentMonth + 1).padStart(2, '0')}-${String(day).padStart(2, '0')}`;
        if (customWorkDates[dateKey] !== false) {
          workDaysCount++;
        }
      }

      return {
        name: `Кастомный ${workDaysCount}/${daysInMonth}`,
        icon: Sliders,
        iconColor: 'text-green-600 dark:text-green-400'
      };
    }

    const templateInfo = {
      '5/2': { 
        name: "Стандартный 5/2",
        icon: CheckCircle,
        iconColor: 'text-blue-600 dark:text-blue-400'
      },
      '2/2': { 
        name: "Сменный 2/2",
        icon: Clock,
        iconColor: 'text-purple-600 dark:text-purple-400'
      },
      '3/3': { 
        name: "Сменный 3/3",
        icon: Zap,
        iconColor: 'text-orange-600 dark:text-orange-400'
      },
      '5/5': { 
        name: "Интенсивный 5/5",
        icon: Flame,
        iconColor: 'text-red-600 dark:text-red-400'
      }
    };

    return templateInfo[workScheduleTemplate] || templateInfo['5/2'];
  };

  // Фильтруем записи по периодам
  const getFilteredEntries = (filter) => {
    return entries.filter(entry => {
      const entryDate = new Date(entry.date);
      const entryYear = entryDate.getFullYear();
      const entryMonth = entryDate.getMonth();
      const entryDay = entryDate.getDate();

      switch (filter) {
        case 'today':
          return entryYear === currentYear && 
                 entryMonth === currentMonth && 
                 entryDay === currentDay;
        
        case 'firstHalfMonth':
          return entryYear === currentYear && 
                 entryMonth === currentMonth && 
                 entryDay <= 15;
        
        case 'secondHalfMonth':
          return entryYear === currentYear && 
                 entryMonth === currentMonth && 
                 entryDay > 15;
        
        case 'month':
          return entryYear === currentYear && entryMonth === currentMonth;
        
        case 'year':
          return entryYear === currentYear;
        
        case 'allTime':
          return true;
        
        default:
          return false;
      }
    });
  };

  // Рассчитываем факт для каждого периода
  const calculateFact = (filter) => {
    return getFilteredEntries(filter).reduce((sum, e) => sum + (parseFloat(e.earned) || 0), 0);
  };

  const planFactData = {
    day: calculateFact('today'),
    firstHalfMonth: calculateFact('firstHalfMonth'),
    secondHalfMonth: calculateFact('secondHalfMonth'),
    month: calculateFact('month'),
    year: calculateFact('year'),
    allTime: calculateFact('allTime')
  };

  // Рассчитываем планы на основе рабочих дней
  const settings = {
    workScheduleTemplate,
    workScheduleStartDay,
    customWorkDates
  };

  // Рассчитываем рабочие дни в текущем месяце на основе настроек
  const workingDaysInMonth = calculateWorkingDaysInMonth(
    currentYear, 
    currentMonth, 
    1, 
    null, 
    settings
  );

  // Рассчитываем рабочие дни в первой и второй половине месяца
  const workingDaysFirstHalf = calculateWorkingDaysInMonth(
    currentYear, 
    currentMonth, 
    1, 
    15, 
    settings
  );
  const workingDaysSecondHalf = workingDaysInMonth - workingDaysFirstHalf;

  const dailyPlanValue = typeof dailyGoal === 'number' && dailyGoal > 0 ? dailyGoal : 6000;
  const monthlyPlan = Math.round(dailyPlanValue * workingDaysInMonth);
  const firstHalfPlan = Math.round(dailyPlanValue * workingDaysFirstHalf);
  const secondHalfPlan = Math.round(dailyPlanValue * workingDaysSecondHalf);

  const { day, firstHalfMonth, secondHalfMonth, month, year, allTime } = planFactData;

  // Форматируем текущий и следующий месяцы
  const currentMonthStr = String(currentMonth + 1).padStart(2, '0');
  const nextMonthDate = new Date(currentYear, currentMonth + 1, 1);
  const nextMonthStr = String(nextMonthDate.getMonth() + 1).padStart(2, '0');

  return (
    <div className="glass-effect rounded-xl p-6 mb-6">

      {/* Заголовок */}
      <div className="flex justify-between items-center mb-6">
        <div className="flex items-center gap-2">
          <h3 className="text-xl font-bold text-gray-900 dark:text-white">
            План/факт заработка
          </h3>
          <InfoTooltip text="Отслеживайте выполнение плана за день и месяц, планируйте выплаты и анализируйте общий доход за год и всё время работы. Настройте рабочий график для точного расчёта целей." />
        </div>
      </div>

      {/* Сетка из 3 карточек */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Карточка 1: План/факт */}
        <div className="glass-card glow-blue relative bg-blue-200 dark:bg-blue-500/10 border border-blue-300 dark:border-gray-700 rounded-2xl p-4 overflow-hidden">
          <div className="relative z-10">
            <div className="flex justify-between items-center mb-4">
              <div className="flex items-center gap-3">
                <h4 className="font-semibold text-gray-800 dark:text-white">План/факт</h4>
                {(() => {
                  const scheduleInfo = getWorkScheduleInfo();
                  const Icon = scheduleInfo.icon;
                  return (
                    <span className="px-2 py-1 bg-blue-100 dark:bg-blue-900/30 text-blue-700 dark:text-blue-300 text-xs rounded-full font-medium flex items-center gap-1.5">
                      <Icon className={`w-3.5 h-3.5 ${scheduleInfo.iconColor}`} />
                      {scheduleInfo.name}
                    </span>
                  );
                })()}
              </div>
              <div className="flex gap-1">
                <button
                  onClick={() => openModal('workSchedule')}
                  className="p-1.5 rounded-lg hover:bg-black/10 transition-normal hover-lift-scale click-shrink text-gray-500 dark:text-gray-400 hover:text-gray-800 dark:hover:text-white"
                  title="Настройка рабочего графика"
                >
                  <Settings className="w-4 h-4" />
                </button>
              </div>
            </div>

            <div className="space-y-4">
              {/* День */}
              <div className="animate-slide-up" style={{ animationDelay: '0.1s', animationFillMode: 'both' }}>
                <div className="flex justify-between items-baseline">
                  <p className="text-gray-500 dark:text-gray-400 text-sm opacity-0 animate-fade-in" style={{ animationDelay: '0.15s', animationFillMode: 'forwards' }}>День</p>
                  <p className="text-xl font-bold text-gray-900 dark:text-white opacity-0 animate-fade-in" style={{ animationDelay: '0.2s', animationFillMode: 'forwards' }}>
                    {day.toLocaleString('ru-RU')}{' '}
                    <span className="text-base text-gray-500 dark:text-gray-400 font-medium">₽</span>
                  </p>
                </div>
                <div className="w-full bg-gray-300 dark:bg-gray-700/50 rounded-full h-1 mt-1 overflow-hidden">
                  <div 
                    className="bg-blue-500 h-1 rounded-full transition-normal"
                    style={{ 
                      width: `${dailyPlanValue > 0 ? Math.min(100, (day / dailyPlanValue) * 100) : 0}%`,
                      animation: 'slideInProgress 0.8s ease-out 0.25s both'
                    }}
                  />
                </div>
                <p className="text-right text-xs text-gray-500 dark:text-gray-400 mt-1 opacity-0 animate-fade-in" style={{ animationDelay: '0.3s', animationFillMode: 'forwards' }}>
                  План: {dailyPlanValue.toLocaleString('ru-RU')} ₽
                </p>
              </div>

              {/* Месяц */}
              <div className="animate-slide-up" style={{ animationDelay: '0.15s', animationFillMode: 'both' }}>
                <div className="flex justify-between items-baseline">
                  <p className="text-gray-500 dark:text-gray-400 text-sm opacity-0 animate-fade-in" style={{ animationDelay: '0.2s', animationFillMode: 'forwards' }}>Месяц</p>
                  <p className="text-xl font-bold text-gray-900 dark:text-white opacity-0 animate-fade-in" style={{ animationDelay: '0.25s', animationFillMode: 'forwards' }}>
                    {month.toLocaleString('ru-RU')}{' '}
                    <span className="text-base text-gray-500 dark:text-gray-400 font-medium">₽</span>
                  </p>
                </div>
                <div className="w-full bg-gray-300 dark:bg-gray-700/50 rounded-full h-1 mt-1 overflow-hidden">
                  <div 
                    className="bg-purple-500 h-1 rounded-full transition-normal"
                    style={{ 
                      width: `${monthlyPlan > 0 ? Math.min(100, (month / monthlyPlan) * 100) : 0}%`,
                      animation: 'slideInProgress 0.8s ease-out 0.3s both'
                    }}
                  />
                </div>
                <p className="text-right text-xs text-gray-500 dark:text-gray-400 mt-1 opacity-0 animate-fade-in" style={{ animationDelay: '0.35s', animationFillMode: 'forwards' }}>
                  План: {monthlyPlan.toLocaleString('ru-RU')} ₽
                </p>
              </div>
            </div>
          </div>

          {/* Большая иконка */}
          <Calendar className="absolute -right-5 -bottom-5 w-32 h-32 text-blue-400/40 dark:text-purple-500/10 pointer-events-none" />
        </div>

        {/* Карточка 2: Выплаты */}
        <div className="glass-card glow-green relative bg-green-200 dark:bg-green-500/10 border border-green-300 dark:border-gray-700 rounded-2xl p-4 overflow-hidden">
          <div className="relative z-10">
            <h4 className="font-semibold text-gray-800 dark:text-white mb-4">Выплаты</h4>

            <div className="space-y-4">
              {/* 1/2 месяца */}
              <div className="animate-slide-up" style={{ animationDelay: '0.2s', animationFillMode: 'both' }}>
                <div className="flex justify-between items-baseline">
                  <p className="text-gray-500 dark:text-gray-400 text-sm opacity-0 animate-fade-in" style={{ animationDelay: '0.25s', animationFillMode: 'forwards' }}>
                    1/2 месяца{' '}
                    <span className="text-xs text-gray-400 dark:text-gray-500">
                      (выплата 25.{currentMonthStr})
                    </span>
                  </p>
                  <p className="text-xl font-bold text-gray-900 dark:text-white opacity-0 animate-fade-in" style={{ animationDelay: '0.3s', animationFillMode: 'forwards' }}>
                    {firstHalfMonth.toLocaleString('ru-RU')}{' '}
                    <span className="text-base text-gray-500 dark:text-gray-400 font-medium">₽</span>
                  </p>
                </div>
                <div className="w-full bg-gray-300 dark:bg-gray-700/50 rounded-full h-1 mt-1 overflow-hidden">
                  <div 
                    className="bg-green-500 h-1 rounded-full transition-normal"
                    style={{ 
                      width: `${firstHalfPlan > 0 ? Math.min(100, (firstHalfMonth / firstHalfPlan) * 100) : 0}%`,
                      animation: 'slideInProgress 0.8s ease-out 0.35s both'
                    }}
                  />
                </div>
                <p className="text-right text-xs text-gray-500 dark:text-gray-400 mt-1 opacity-0 animate-fade-in" style={{ animationDelay: '0.4s', animationFillMode: 'forwards' }}>
                  План: {firstHalfPlan.toLocaleString('ru-RU')} ₽
                </p>
              </div>

              {/* 2/2 месяца */}
              <div className="animate-slide-up" style={{ animationDelay: '0.25s', animationFillMode: 'both' }}>
                <div className="flex justify-between items-baseline">
                  <p className="text-gray-500 dark:text-gray-400 text-sm opacity-0 animate-fade-in" style={{ animationDelay: '0.3s', animationFillMode: 'forwards' }}>
                    2/2 месяца{' '}
                    <span className="text-xs text-gray-400 dark:text-gray-500">
                      (выплата 10.{nextMonthStr})
                    </span>
                  </p>
                  <p className="text-xl font-bold text-gray-900 dark:text-white opacity-0 animate-fade-in" style={{ animationDelay: '0.35s', animationFillMode: 'forwards' }}>
                    {secondHalfMonth.toLocaleString('ru-RU')}{' '}
                    <span className="text-base text-gray-500 dark:text-gray-400 font-medium">₽</span>
                  </p>
                </div>
                <div className="w-full bg-gray-300 dark:bg-gray-700/50 rounded-full h-1 mt-1 overflow-hidden">
                  <div 
                    className="bg-teal-500 h-1 rounded-full transition-normal"
                    style={{ 
                      width: `${secondHalfPlan > 0 ? Math.min(100, (secondHalfMonth / secondHalfPlan) * 100) : 0}%`,
                      animation: 'slideInProgress 0.8s ease-out 0.4s both'
                    }}
                  />
                </div>
                <p className="text-right text-xs text-gray-500 dark:text-gray-400 mt-1 opacity-0 animate-fade-in" style={{ animationDelay: '0.45s', animationFillMode: 'forwards' }}>
                  План: {secondHalfPlan.toLocaleString('ru-RU')} ₽
                </p>
              </div>
            </div>
          </div>

          {/* Большая иконка */}
          <DollarSign className="absolute -right-5 -bottom-5 w-32 h-32 text-green-400/40 dark:text-green-500/10 pointer-events-none" />
        </div>

        {/* Карточка 3: Общие итоги */}
        <div className="glass-card glow-orange relative bg-orange-200 dark:bg-yellow-500/10 border border-orange-300 dark:border-gray-700 rounded-2xl p-4 overflow-hidden">
          <div className="relative z-10">
            <h4 className="font-semibold text-gray-800 dark:text-white mb-4">Общие итоги</h4>

            <div className="space-y-6 flex flex-col justify-center h-full">
              {/* Год */}
              <div className="border-l-4 border-orange-400 pl-4 animate-slide-up opacity-0 animate-fade-in" style={{ animationDelay: '0.3s', animationFillMode: 'both' }}>
                <p className="text-gray-500 dark:text-gray-400 text-sm opacity-0 animate-fade-in" style={{ animationDelay: '0.35s', animationFillMode: 'forwards' }}>Год</p>
                <p className="text-3xl font-bold text-gray-900 dark:text-white opacity-0 animate-fade-in" style={{ animationDelay: '0.4s', animationFillMode: 'forwards' }}>
                  {year.toLocaleString('ru-RU')}{' '}
                  <span className="text-xl text-gray-500 dark:text-gray-400 font-medium">₽</span>
                </p>
              </div>

              {/* За все время */}
              <div className="border-l-4 border-red-400 pl-4 animate-slide-up opacity-0 animate-fade-in" style={{ animationDelay: '0.35s', animationFillMode: 'both' }}>
                <p className="text-gray-500 dark:text-gray-400 text-sm opacity-0 animate-fade-in" style={{ animationDelay: '0.4s', animationFillMode: 'forwards' }}>За все время</p>
                <p className="text-3xl font-bold text-gray-900 dark:text-white opacity-0 animate-fade-in" style={{ animationDelay: '0.45s', animationFillMode: 'forwards' }}>
                  {allTime.toLocaleString('ru-RU')}{' '}
                  <span className="text-xl text-gray-500 dark:text-gray-400 font-medium">₽</span>
                </p>
              </div>
            </div>
          </div>

          {/* Большая иконка */}
          <DollarSign className="absolute -right-5 -bottom-5 w-32 h-32 text-orange-400/40 dark:text-red-500/10 pointer-events-none" />
        </div>
      </div>
    </div>
  );
}
