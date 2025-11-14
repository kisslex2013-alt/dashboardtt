import { useState, useRef, useEffect, useMemo } from 'react';
import { createPortal } from 'react-dom';
import { ChevronLeft, ChevronRight } from 'lucide-react';
import { useSettingsStore } from '../../store/useSettingsStore';
import { format, parseISO, startOfMonth, endOfMonth } from 'date-fns';
import { ru } from 'date-fns/locale'; // ИСПРАВЛЕНО: Импорт локали для русских названий месяцев
import { InfoTooltip } from '../ui/InfoTooltip';
import { MonthPicker } from '../ui/MonthPicker'; // ИСПРАВЛЕНО: Импорт кастомного MonthPicker

/**
 * 📊 Календарь доходов (Heatmap)
 * 
 * 🎓 ПОЯСНЕНИЕ ДЛЯ НАЧИНАЮЩИХ:
 * 
 * Этот компонент показывает визуализацию ежедневных доходов в виде календаря.
 * Цвет ячейки зависит от заработанной суммы: чем она выше, тем насыщеннее цвет.
 * 
 * Особенности:
 * - Навигация по месяцам (стрелки и input)
 * - Режим сравнения двух месяцев
 * - Интерактивные подсказки при наведении
 * - Поддержка клавиатурной навигации (стрелки)
 * - Выделение текущего дня
 * 
 * @param {Array} entries - Отфильтрованные записи
 */
export function CalendarHeatmap({ entries }) {
  const { theme, workScheduleTemplate, workScheduleStartDay, customWorkDates } = useSettingsStore();
  const [currentDate, setCurrentDate] = useState(new Date());
  const [compareDate, setCompareDate] = useState(() => {
    const date = new Date();
    date.setMonth(date.getMonth() - 1);
    return date;
  });
  // Режим сравнения всегда активен
  const isComparing = true;
  // ИСПРАВЛЕНО: Отдельные состояния hoveredDay для каждого календаря для синхронизации тултипов
  const [hoveredDay, setHoveredDay] = useState(null);
  const [hoveredDayCompare, setHoveredDayCompare] = useState(null);
  const [focusedDayIndex, setFocusedDayIndex] = useState(null);
  const tooltipRef = useRef(null);
  const tooltipCompareRef = useRef(null); // ИСПРАВЛЕНО: Ref для второго тултипа
  const calendarRef = useRef(null);
  // ИСПРАВЛЕНО: Состояния для кастомного MonthPicker
  const [showMonthPicker, setShowMonthPicker] = useState({ current: false, compare: false });
  const currentMonthInputRef = useRef(null);
  const compareMonthInputRef = useRef(null);
  
  // ИСПРАВЛЕНО: Определение нерабочих дней на основе графика работы
  const isNonWorkingDay = useMemo(() => {
    return (dayDate) => {
      const dayOfWeek = dayDate.getDay(); // 0 = Sunday, 1 = Monday, etc.
      // Конвертируем в систему где Monday = 1
      const adjustedDayOfWeek = dayOfWeek === 0 ? 7 : dayOfWeek;
      
      // Проверяем кастомные рабочие дни
      const dateKey = format(dayDate, 'yyyy-MM-dd');
      if (customWorkDates && customWorkDates[dateKey] === false) {
        return true; // Кастомный выходной
      }
      
      // Проверяем по шаблону графика
      if (workScheduleTemplate === '5/2') {
        // Стандартный график 5/2: первые 5 дней недели - рабочие
        const weekStartDay = workScheduleStartDay || 1; // 1 = Monday
        const adjustedDay = ((adjustedDayOfWeek - weekStartDay + 7) % 7);
        return adjustedDay >= 5; // Последние 2 дня - выходные
      } else if (workScheduleTemplate === '2/2') {
        // График 2/2: определяется по началу цикла
        // Упрощенно: дни, которые не попадают в рабочие
        return false; // Пока считаем все рабочими
      } else if (workScheduleTemplate === '3/3') {
        // График 3/3: аналогично
        return false;
      } else if (workScheduleTemplate === '5/5') {
        // График 5/5: все дни рабочие
        return false;
      }
      
      // По умолчанию: суббота (6) и воскресенье (7) - выходные
      // ИСПРАВЛЕНО: Явно проверяем субботу и воскресенье
      return adjustedDayOfWeek === 6 || adjustedDayOfWeek === 7;
    };
  }, [workScheduleTemplate, workScheduleStartDay, customWorkDates]);

  // Подготовка данных для календаря
  const calendarData = useMemo(() => {
    if (!entries || entries.length === 0) return {};

    const data = {};
    
    entries.forEach((entry) => {
      const dateStr = entry.date;
      if (!data[dateStr]) {
        data[dateStr] = {
          totalEarned: 0,
          totalHours: 0,
          entryCount: 0,
        };
      }
      
      data[dateStr].totalEarned += parseFloat(entry.earned) || 0;
      
      // Рассчитываем часы
      if (entry.duration) {
        data[dateStr].totalHours += parseFloat(entry.duration) || 0;
      } else if (entry.start && entry.end) {
        const [startH, startM] = entry.start.split(':').map(Number);
        const [endH, endM] = entry.end.split(':').map(Number);
        const startMinutes = startH * 60 + startM;
        let endMinutes = endH * 60 + endM;
        if (endMinutes < startMinutes) endMinutes += 24 * 60;
        data[dateStr].totalHours += (endMinutes - startMinutes) / 60;
      }
      
      data[dateStr].entryCount += 1;
    });

    // Рассчитываем среднюю ставку для каждого дня
    Object.keys(data).forEach((dateStr) => {
      const dayData = data[dateStr];
      dayData.avgRate = dayData.totalHours > 0 
        ? dayData.totalEarned / dayData.totalHours 
        : 0;
    });

    return data;
  }, [entries]);

  // ИСПРАВЛЕНО: Обработка изменения месяца через кастомный MonthPicker
  const handleMonthChange = (setter, isCompare) => (value) => {
    const [year, month] = value.split('-').map(Number);
    setter(new Date(year, month - 1, 1));
    setShowMonthPicker(prev => ({ ...prev, [isCompare ? 'compare' : 'current']: false }));
  };

  // Навигация по месяцам
  const navigateMonth = (setter, amount) => () => {
    setter((current) => {
      const newDate = new Date(current);
      newDate.setMonth(current.getMonth() + amount);
      return newDate;
    });
  };

  // ИСПРАВЛЕНО: Функция для вычисления номера дня недели в месяце (1-й понедельник, 2-й понедельник и т.д.)
  const getWeekdayNumberInMonth = (date) => {
    const dayOfWeek = date.getDay(); // 0 = Sunday, 1 = Monday, etc.
    const adjustedDayOfWeek = dayOfWeek === 0 ? 7 : dayOfWeek; // Convert to 1-7 where 1 = Monday
    
    // Находим первое вхождение этого дня недели в месяце
    const firstDayOfMonth = new Date(date.getFullYear(), date.getMonth(), 1);
    let firstDayWeekday = firstDayOfMonth.getDay();
    firstDayWeekday = firstDayWeekday === 0 ? 7 : firstDayWeekday;
    
    // Вычисляем номер дня недели в месяце (1-й, 2-й, 3-й и т.д.)
    const dayOfMonth = date.getDate();
    let weekdayNumber = 0;
    
    // Находим первое вхождение нужного дня недели в месяце
    let firstOccurrence = 1;
    for (let i = 1; i <= 7; i++) {
      const testDate = new Date(date.getFullYear(), date.getMonth(), i);
      let testDayOfWeek = testDate.getDay();
      testDayOfWeek = testDayOfWeek === 0 ? 7 : testDayOfWeek;
      if (testDayOfWeek === adjustedDayOfWeek) {
        firstOccurrence = i;
        break;
      }
    }
    
    // Вычисляем номер (1-й, 2-й, 3-й и т.д.)
    weekdayNumber = Math.floor((dayOfMonth - firstOccurrence) / 7) + 1;
    
    return {
      weekdayNumber, // Номер дня недели в месяце (1, 2, 3, 4, 5)
      dayOfWeek: adjustedDayOfWeek, // День недели (1=Monday, 7=Sunday)
    };
  };
  
  // ИСПРАВЛЕНО: Функция для поиска дня по номеру дня недели в месяце
  const findDayByWeekdayNumber = (targetDate, weekdayNumber, dayOfWeek) => {
    const monthDays = generateCalendar(targetDate);
    
    // Находим первое вхождение нужного дня недели в месяце
    let firstOccurrence = null;
    for (const day of monthDays) {
      if (day.isPlaceholder) continue;
      let d = day.date.getDay();
      d = d === 0 ? 7 : d;
      if (d === dayOfWeek) {
        firstOccurrence = day.date.getDate();
        break;
      }
    }
    
    if (!firstOccurrence) return null;
    
    // Вычисляем дату нужного дня
    const targetDay = firstOccurrence + (weekdayNumber - 1) * 7;
    const lastDayOfMonth = new Date(targetDate.getFullYear(), targetDate.getMonth() + 1, 0).getDate();
    
    if (targetDay > lastDayOfMonth) return null;
    
    // Находим этот день в календаре
    return monthDays.find(d => 
      !d.isPlaceholder && 
      d.date.getDate() === targetDay &&
      d.date.getMonth() === targetDate.getMonth()
    );
  };

  // ИСПРАВЛЕНО: Позиционирование tooltip при движении мыши (для обоих тултипов)
  useEffect(() => {
    const handleMouseMove = (e) => {
      if (tooltipRef.current) {
        tooltipRef.current.style.left = `${e.clientX + 15}px`;
        tooltipRef.current.style.top = `${e.clientY + 15}px`;
      }
      // ИСПРАВЛЕНО: Позиционируем второй тултип рядом с первым
      if (tooltipCompareRef.current && tooltipRef.current) {
        const firstTooltipRect = tooltipRef.current.getBoundingClientRect();
        tooltipCompareRef.current.style.left = `${firstTooltipRect.right + 20}px`;
        tooltipCompareRef.current.style.top = `${firstTooltipRect.top}px`;
      }
    };

    window.addEventListener('mousemove', handleMouseMove);
    return () => window.removeEventListener('mousemove', handleMouseMove);
  }, []);

  // Генерация календаря для месяца
  const generateCalendar = (date) => {
    const year = date.getFullYear();
    const month = date.getMonth();
    const firstDay = new Date(year, month, 1);
    const lastDay = new Date(year, month + 1, 0);
    const days = [];

    // Заполняем дни предыдущего месяца (для выравнивания по неделям)
    let startOffset = firstDay.getDay() - 1; // Понедельник = 0
    if (startOffset === -1) startOffset = 6; // Воскресенье = 6

    for (let i = 0; i < startOffset; i++) {
      days.push({ key: `prev-${i}`, isPlaceholder: true });
    }

    // Добавляем дни текущего месяца
    for (let i = 1; i <= lastDay.getDate(); i++) {
      const dayDate = new Date(year, month, i);
      const dateString = format(dayDate, 'yyyy-MM-dd');
      const today = format(new Date(), 'yyyy-MM-dd');
      
      // ИСПРАВЛЕНО: Определяем, является ли день нерабочим
      const nonWorking = isNonWorkingDay(dayDate);
      
      days.push({
        key: dateString,
        date: dayDate,
        data: calendarData[dateString],
        isToday: dateString === today,
        isNonWorking: nonWorking, // ИСПРАВЛЕНО: Добавлен флаг нерабочего дня
      });
    }

    return days;
  };

  // Обработка клавиатурной навигации
  const handleKeyDown = (e, days) => {
    if (focusedDayIndex === null) return;

    const totalDays = days.length;
    let newIndex = focusedDayIndex;

    switch (e.key) {
      case 'ArrowRight':
        newIndex = (focusedDayIndex + 1) % totalDays;
        break;
      case 'ArrowLeft':
        newIndex = (focusedDayIndex - 1 + totalDays) % totalDays;
        break;
      case 'ArrowDown':
        newIndex = (focusedDayIndex + 7) % totalDays;
        break;
      case 'ArrowUp':
        newIndex = (focusedDayIndex - 7 + totalDays) % totalDays;
        break;
      default:
        return;
    }

    setFocusedDayIndex(newIndex);
    const newDay = days[newIndex];
    if (!newDay.isPlaceholder) {
      setHoveredDay(newDay);
    }
    e.preventDefault();
  };

  const handleDayClick = (day, index) => {
    if (!day.isPlaceholder) {
      setFocusedDayIndex(index);
      setHoveredDay(day);
    }
  };

  // Получение цвета для ячейки с учетом обоих календарей при сравнении
  // Режим сравнения всегда активен, поэтому всегда вычисляем общие min/max
  const getAllMonthDataValues = useMemo(() => {
    const currentMonthDays = generateCalendar(currentDate);
    const compareMonthDays = generateCalendar(compareDate);
    
    const allValues = [
      ...currentMonthDays.filter(d => d.data).map(d => d.data.totalEarned),
      ...compareMonthDays.filter(d => d.data).map(d => d.data.totalEarned),
    ];
    
    if (allValues.length === 0) return null;
    
    return {
      min: Math.min(...allValues),
      max: Math.max(...allValues),
    };
  }, [currentDate, compareDate, entries]);

  // Получение цвета для ячейки
  const getColor = (value, monthDays) => {
    // ИСПРАВЛЕНО: Пустые дни - максимально контрастные цвета
    if (!value) {
      // В dark теме используем максимально темный (#000000), в light - максимально белый (#FFFFFF)
      return theme === 'dark' ? '#000000' : '#FFFFFF';
    }

    // Режим сравнения всегда активен, используем общие min/max из обоих календарей
    let minEarned, maxEarned;
    
    if (getAllMonthDataValues) {
      minEarned = getAllMonthDataValues.min;
      maxEarned = getAllMonthDataValues.max;
    } else {
      // Fallback на отдельный месяц если нет данных для сравнения
      const monthDataValues = monthDays
        .filter((d) => d.data)
        .map((d) => d.data.totalEarned);

      if (monthDataValues.length === 0) {
        return 'rgba(34, 197, 94, 0.1)';
      }

      minEarned = Math.min(...monthDataValues);
      maxEarned = Math.max(...monthDataValues);
    }

    if (maxEarned === minEarned) {
      return 'rgba(34, 197, 94, 0.1)';
    }

    const ratio = (value - minEarned) / (maxEarned - minEarned);
    const opacity = 0.1 + ratio * 0.9;
    return `rgba(34, 197, 94, ${opacity})`;
  };

  // Рендер календаря
  const renderCalendar = (date, setDate, title) => {
    const monthDays = generateCalendar(date);

    return (
      <div className="flex flex-col">
        {/* Заголовок с навигацией */}
        <div className="flex justify-between items-center mb-2">
          <div className="flex items-center gap-2">
            <button
              onClick={navigateMonth(setDate, -1)}
              className="p-1 rounded-full hover:bg-gray-500/10 transition-colors"
              aria-label="Предыдущий месяц"
            >
              <ChevronLeft className="w-5 h-5" />
            </button>
            {/* ИСПРАВЛЕНО: Заменен нативный input type="month" на кастомную кнопку */}
            <button
              ref={title === 'Текущий период' ? currentMonthInputRef : compareMonthInputRef}
              onClick={() => setShowMonthPicker(prev => ({ 
                ...prev, 
                [title === 'Текущий период' ? 'current' : 'compare']: true 
              }))}
              className="glass-effect font-bold text-lg px-3 py-2 rounded-lg border border-gray-300 dark:border-gray-600 focus:outline-none focus:ring-2 focus:ring-blue-500 text-gray-900 dark:text-white transition-normal hover-lift-scale click-shrink"
            >
              {format(date, 'MMMM yyyy', { locale: ru })}
            </button>
            {showMonthPicker[title === 'Текущий период' ? 'current' : 'compare'] && (
              <MonthPicker
                value={format(date, 'yyyy-MM')}
                onChange={handleMonthChange(setDate, title === 'Сравниваемый период')}
                onClose={() => setShowMonthPicker(prev => ({ 
                  ...prev, 
                  [title === 'Текущий период' ? 'current' : 'compare']: false 
                }))}
                inputRef={title === 'Текущий период' ? currentMonthInputRef : compareMonthInputRef}
              />
            )}
            <button
              onClick={navigateMonth(setDate, 1)}
              className="p-1 rounded-full hover:bg-gray-500/10 transition-colors"
              aria-label="Следующий месяц"
            >
              <ChevronRight className="w-5 h-5" />
            </button>
          </div>
          <h4 className="font-bold text-lg text-gray-800 dark:text-white">{title}</h4>
        </div>

        {/* Дни недели */}
        <div className="grid grid-cols-7 gap-1 text-center text-xs text-gray-500 dark:text-gray-400 mb-2">
          {['Пн', 'Вт', 'Ср', 'Чт', 'Пт', 'Сб', 'Вс'].map((day) => (
            <div key={day}>{day}</div>
          ))}
        </div>

        {/* Календарная сетка */}
        <div
          ref={calendarRef}
          className="grid grid-cols-7 gap-1 focus:outline-none"
          tabIndex={0}
          onKeyDown={(e) => handleKeyDown(e, monthDays)}
        >
          {monthDays.map((day, index) => (
            <div
              key={day.key}
              tabIndex={day.isPlaceholder ? -1 : 0}
              className={`
                relative aspect-square flex items-center justify-center rounded-md transition-all duration-200 text-sm
                ${day.isPlaceholder ? 'opacity-0' : 'cursor-pointer focus:ring-2 focus:ring-blue-500 hover:ring-2 hover:ring-blue-500'}
                ${day.isToday ? 'font-bold ring-2 ring-blue-500 dark:ring-blue-400' : ''}
                ${focusedDayIndex === index && !day.isPlaceholder ? 'ring-4 ring-blue-500' : ''}
                ${day.isNonWorking && !day.data ? 'border-2 border-dashed' : ''}
                ${day.isNonWorking && !day.data 
                  ? theme === 'dark' 
                    ? '!text-gray-500' // ИСПРАВЛЕНО: Серый цвет текста через Tailwind с ! для приоритета
                    : '!text-gray-400' // ИСПРАВЛЕНО: Серый цвет текста через Tailwind с ! для приоритета
                  : day.data 
                    ? 'text-white' // Белый текст для дней с данными
                    : theme === 'dark'
                      ? 'text-white' // Белый текст для пустых рабочих дней в dark теме
                      : 'text-black' // Черный текст для пустых рабочих дней в light теме
                }
              `}
              style={{
                backgroundColor: day.data
                  ? getColor(day.data.totalEarned, monthDays)
                  : day.isNonWorking
                  ? 'transparent' // ИСПРАВЛЕНО: Прозрачный фон для нерабочих дней
                  : theme === 'dark'
                  ? '#000000' // Темный цвет для пустых рабочих дней в dark теме
                  : '#FFFFFF', // Белый цвет для пустых рабочих дней в light теме
                // ИСПРАВЛЕНО: Цвет текста задается через className (Tailwind классы имеют приоритет)
                borderColor: day.isNonWorking && !day.data
                  ? theme === 'dark'
                    ? '#374151' // ИСПРАВЛЕНО: Темно-серый border для нерабочих дней в dark теме
                    : '#D1D5DB' // ИСПРАВЛЕНО: Светло-серый border для нерабочих дней в light теме
                  : 'transparent',
              }}
              onMouseEnter={() => {
                if (!day.isPlaceholder) {
                  // ИСПРАВЛЕНО: Синхронизация тултипов между календарями по номеру дня недели в месяце
                  if (title === 'Текущий период') {
                    setHoveredDay(day);
                    // Вычисляем номер дня недели в месяце (например, 2-й понедельник)
                    const weekdayInfo = getWeekdayNumberInMonth(day.date);
                    // Находим соответствующий день в другом календаре по тому же номеру дня недели
                    const correspondingDay = findDayByWeekdayNumber(
                      compareDate, 
                      weekdayInfo.weekdayNumber, 
                      weekdayInfo.dayOfWeek
                    );
                    if (correspondingDay) {
                      setHoveredDayCompare(correspondingDay);
                    }
                  } else {
                    setHoveredDayCompare(day);
                    // Вычисляем номер дня недели в месяце (например, 2-й понедельник)
                    const weekdayInfo = getWeekdayNumberInMonth(day.date);
                    // Находим соответствующий день в другом календаре по тому же номеру дня недели
                    const correspondingDay = findDayByWeekdayNumber(
                      currentDate, 
                      weekdayInfo.weekdayNumber, 
                      weekdayInfo.dayOfWeek
                    );
                    if (correspondingDay) {
                      setHoveredDay(correspondingDay);
                    }
                  }
                }
              }}
              onMouseLeave={() => {
                // ИСПРАВЛЕНО: Очищаем оба тултипа при уходе мыши
                if (title === 'Текущий период') {
                  setHoveredDay(null);
                  setHoveredDayCompare(null);
                } else {
                  setHoveredDayCompare(null);
                  setHoveredDay(null);
                }
              }}
              onClick={() => handleDayClick(day, index)}
              onFocus={() => !day.isPlaceholder && (title === 'Текущий период' ? setHoveredDay(day) : setHoveredDayCompare(day))}
            >
              {!day.isPlaceholder && (
                <span>{day.date.getDate()}</span>
              )}
            </div>
          ))}
        </div>
      </div>
    );
  };

  return (
    <div>
      {/* Заголовок */}
      <div className="flex justify-between items-center mb-4">
        <div className="flex items-center gap-2">
          <h3 className="text-lg font-bold text-gray-900 dark:text-white">
            Календарь доходов
          </h3>
          <InfoTooltip text="Визуализация ежедневных доходов с сравнением двух месяцев. Цвет ячейки зависит от заработанной суммы: чем она выше, тем насыщеннее цвет." />
        </div>
      </div>

      {/* Календари */}
      <div
        className={`grid ${isComparing ? 'grid-cols-1 md:grid-cols-2 gap-6' : 'grid-cols-1'}`}
      >
        {renderCalendar(currentDate, setCurrentDate, 'Текущий период')}
        {isComparing &&
          renderCalendar(compareDate, setCompareDate, 'Сравниваемый период')}
      </div>

      {/* ИСПРАВЛЕНО: Тултипы для обоих календарей с синхронизацией */}
      {(hoveredDay || hoveredDayCompare) && (
        <>
          {hoveredDay && createPortal(
            <div
              ref={tooltipRef}
              className="fixed glass-effect p-3 rounded-lg shadow-xl text-sm border border-gray-200 dark:border-gray-700 pointer-events-none z-[999999]"
            >
              <p className="font-bold text-gray-900 dark:text-white mb-1">
                {hoveredDay.date.toLocaleDateString('ru-RU', {
                  day: 'numeric',
                  month: 'long',
                  year: 'numeric',
                })}
              </p>
              {hoveredDay.data ? (
                <>
                  <p className="text-green-600 dark:text-green-400 font-semibold">
                    Заработано: {hoveredDay.data.totalEarned.toLocaleString('ru-RU')} ₽
                  </p>
                  <p className="text-gray-700 dark:text-gray-300">
                    Часы: {hoveredDay.data.totalHours.toFixed(2)} ч
                  </p>
                  <p className="text-gray-700 dark:text-gray-300">
                    Средняя ставка: {hoveredDay.data.avgRate.toFixed(0)} ₽/ч
                  </p>
                </>
              ) : (
                <p className="text-gray-500 dark:text-gray-400">
                  Нет записей за этот день
                </p>
              )}
            </div>,
            document.body
          )}
          {hoveredDayCompare && createPortal(
            <div
              ref={tooltipCompareRef}
              className="fixed glass-effect p-3 rounded-lg shadow-xl text-sm border border-gray-200 dark:border-gray-700 pointer-events-none z-[999999]"
            >
              <p className="font-bold text-gray-900 dark:text-white mb-1">
                {hoveredDayCompare.date.toLocaleDateString('ru-RU', {
                  day: 'numeric',
                  month: 'long',
                  year: 'numeric',
                })}
              </p>
              {hoveredDayCompare.data ? (
                <>
                  <p className="text-green-600 dark:text-green-400 font-semibold">
                    Заработано: {hoveredDayCompare.data.totalEarned.toLocaleString('ru-RU')} ₽
                  </p>
                  <p className="text-gray-700 dark:text-gray-300">
                    Часы: {hoveredDayCompare.data.totalHours.toFixed(2)} ч
                  </p>
                  <p className="text-gray-700 dark:text-gray-300">
                    Средняя ставка: {hoveredDayCompare.data.avgRate.toFixed(0)} ₽/ч
                  </p>
                </>
              ) : (
                <p className="text-gray-500 dark:text-gray-400">
                  Нет записей за этот день
                </p>
              )}
            </div>,
            document.body
          )}
        </>
      )}
    </div>
  );
}
