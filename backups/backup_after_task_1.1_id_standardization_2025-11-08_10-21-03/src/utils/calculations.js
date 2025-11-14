/**
 * 🎓 ПОЯСНЕНИЕ ДЛЯ НАЧИНАЮЩИХ:
 * 
 * Этот файл содержит утилиты для математических расчетов:
 * - Расчет длительности работы
 * - Расчет заработка
 * - Округление времени
 * - Статистика и аналитика
 * - Группировка данных
 */

import { safeParseDate } from './dateHelpers';

/**
 * Рассчитывает длительность работы в часах
 * @param {string} startTime - время начала в формате HH:MM
 * @param {string} endTime - время окончания в формате HH:MM
 * @returns {string} длительность в часах с 2 десятичными знаками
 */
export function calculateDuration(startTime, endTime) {
  const [startHours, startMinutes] = startTime.split(':').map(Number);
  const [endHours, endMinutes] = endTime.split(':').map(Number);
  
  const startTotalMinutes = startHours * 60 + startMinutes;
  const endTotalMinutes = endHours * 60 + endMinutes;
  
  const durationMinutes = endTotalMinutes - startTotalMinutes;
  return (durationMinutes / 60).toFixed(2);
}

/**
 * Рассчитывает заработок на основе длительности и ставки
 * @param {number|string} duration - длительность в часах
 * @param {number|string} rate - ставка за час в рублях
 * @returns {string} заработок с 2 десятичными знаками
 */
export function calculateEarned(duration, rate) {
  return (parseFloat(duration) * parseFloat(rate)).toFixed(2);
}

/**
 * Округляет время до указанного количества минут
 * @param {number} minutes - количество минут
 * @param {number} roundTo - до скольких минут округлять (по умолчанию 15)
 * @returns {number} округленное количество минут
 */
export function roundTime(minutes, roundTo = 15) {
  return Math.round(minutes / roundTo) * roundTo;
}

/**
 * Рассчитывает статистику за определенный период
 * @param {Array} entries - массив записей времени
 * @param {Date} startDate - начальная дата
 * @param {Date} endDate - конечная дата
 * @returns {Object} объект со статистикой
 */
export function calculateStats(entries, startDate, endDate) {
  const filtered = entries.filter(entry => {
    // ✅ ОПТИМИЗАЦИЯ: Используем централизованную функцию для парсинга даты
    const entryDate = safeParseDate(entry.date);
    if (!entryDate) return false;
    return entryDate >= startDate && entryDate <= endDate;
  });
  
  const totalHours = filtered.reduce((sum, e) => sum + parseFloat(e.duration || 0), 0);
  const totalEarned = filtered.reduce((sum, e) => sum + parseFloat(e.earned || 0), 0);
  const averageRate = totalHours > 0 ? totalEarned / totalHours : 0;
  
  return {
    totalHours: totalHours.toFixed(2),
    totalEarned: totalEarned.toFixed(2),
    averageRate: averageRate.toFixed(2),
    entriesCount: filtered.length,
  };
}

/**
 * Группирует записи по категориям
 * @param {Array} entries - массив записей времени
 * @returns {Object} объект с группировкой по категориям
 */
export function groupByCategory(entries) {
  return entries.reduce((acc, entry) => {
    if (!acc[entry.category]) {
      acc[entry.category] = {
        hours: 0,
        earned: 0,
        count: 0,
        averageRate: 0,
      };
    }
    acc[entry.category].hours += parseFloat(entry.duration || 0);
    acc[entry.category].earned += parseFloat(entry.earned || 0);
    acc[entry.category].count += 1;
    
    // Рассчитываем среднюю ставку для категории
    if (acc[entry.category].hours > 0) {
      acc[entry.category].averageRate = (acc[entry.category].earned / acc[entry.category].hours).toFixed(2);
    }
    
    return acc;
  }, {});
}

/**
 * Рассчитывает эффективность выполнения плана
 * @param {number} actual - фактическое значение
 * @param {number} planned - плановое значение
 * @returns {Object} объект с эффективностью и цветом индикации
 */
export function calculateEfficiency(actual, planned) {
  if (planned === 0) return { percentage: 0, color: 'gray', status: 'no-plan' };
  
  const percentage = (actual / planned) * 100;
  
  let color, status;
  if (percentage >= 100) {
    color = 'green';
    status = 'excellent';
  } else if (percentage >= 70) {
    color = 'yellow';
    status = 'good';
  } else {
    color = 'red';
    status = 'poor';
  }
  
  return {
    percentage: percentage.toFixed(1),
    color,
    status,
  };
}

/**
 * Рассчитывает тренд изменения показателя
 * @param {number} current - текущее значение
 * @param {number} previous - предыдущее значение
 * @returns {Object} объект с трендом
 */
export function calculateTrend(current, previous) {
  if (previous === 0) {
    return {
      change: current,
      percentage: current > 0 ? 100 : 0,
      direction: current > 0 ? 'up' : 'down',
      color: current > 0 ? 'green' : 'red',
    };
  }
  
  const change = current - previous;
  const percentage = (change / previous) * 100;
  
  return {
    change: change.toFixed(2),
    percentage: percentage.toFixed(1),
    direction: change > 0 ? 'up' : change < 0 ? 'down' : 'stable',
    color: change > 0 ? 'green' : change < 0 ? 'red' : 'gray',
  };
}

/**
 * Рассчитывает среднюю производительность по дням недели
 * @param {Array} entries - массив записей времени
 * @returns {Object} объект с производительностью по дням
 */
export function calculateWeeklyProductivity(entries) {
  const daysOfWeek = ['sunday', 'monday', 'tuesday', 'wednesday', 'thursday', 'friday', 'saturday'];
  const productivity = {};
  
  daysOfWeek.forEach(day => {
    productivity[day] = {
      totalHours: 0,
      totalEarned: 0,
      entriesCount: 0,
      averageHours: 0,
    };
  });
  
  entries.forEach(entry => {
    const dayOfWeek = new Date(entry.date).getDay();
    const dayName = daysOfWeek[dayOfWeek];
    
    productivity[dayName].totalHours += parseFloat(entry.duration || 0);
    productivity[dayName].totalEarned += parseFloat(entry.earned || 0);
    productivity[dayName].entriesCount += 1;
  });
  
  // Рассчитываем средние значения
  Object.keys(productivity).forEach(day => {
    const dayData = productivity[day];
    if (dayData.entriesCount > 0) {
      dayData.averageHours = (dayData.totalHours / dayData.entriesCount).toFixed(2);
    }
  });
  
  return productivity;
}

/**
 * Рассчитывает оптимальное время работы на основе исторических данных
 * @param {Array} entries - массив записей времени
 * @returns {Object} рекомендации по оптимальному времени
 */
export function calculateOptimalTime(entries) {
  const hourlyData = {};
  
  // Инициализируем часы дня
  for (let hour = 0; hour < 24; hour++) {
    hourlyData[hour] = {
      totalHours: 0,
      totalEarned: 0,
      entriesCount: 0,
      efficiency: 0,
    };
  }
  
  // Анализируем записи по часам начала работы
  entries.forEach(entry => {
    const startHour = parseInt(entry.start.split(':')[0]);
    hourlyData[startHour].totalHours += parseFloat(entry.duration || 0);
    hourlyData[startHour].totalEarned += parseFloat(entry.earned || 0);
    hourlyData[startHour].entriesCount += 1;
  });
  
  // Рассчитываем эффективность для каждого часа
  Object.keys(hourlyData).forEach(hour => {
    const data = hourlyData[hour];
    if (data.entriesCount > 0) {
      data.efficiency = (data.totalEarned / data.totalHours).toFixed(2);
    }
  });
  
  // Находим наиболее продуктивные часы
  const sortedHours = Object.entries(hourlyData)
    .filter(([_, data]) => data.entriesCount > 0)
    .sort((a, b) => parseFloat(b[1].efficiency) - parseFloat(a[1].efficiency));
  
  return {
    hourlyData,
    mostProductiveHour: sortedHours[0] ? parseInt(sortedHours[0][0]) : null,
    leastProductiveHour: sortedHours[sortedHours.length - 1] ? parseInt(sortedHours[sortedHours.length - 1][0]) : null,
    recommendations: generateTimeRecommendations(sortedHours),
  };
}

/**
 * Генерирует рекомендации по времени работы
 * @param {Array} sortedHours - отсортированные часы по эффективности
 * @returns {Array} массив рекомендаций
 */
function generateTimeRecommendations(sortedHours) {
  const recommendations = [];
  
  if (sortedHours.length > 0) {
    const bestHour = parseInt(sortedHours[0][0]);
    const bestEfficiency = sortedHours[0][1].efficiency;
    
    recommendations.push({
      type: 'best-time',
      hour: bestHour,
      efficiency: bestEfficiency,
      message: `Самое продуктивное время: ${bestHour}:00 (эффективность: ${bestEfficiency} ₽/ч)`,
    });
  }
  
  if (sortedHours.length > 1) {
    const worstHour = parseInt(sortedHours[sortedHours.length - 1][0]);
    const worstEfficiency = sortedHours[sortedHours.length - 1][1].efficiency;
    
    recommendations.push({
      type: 'worst-time',
      hour: worstHour,
      efficiency: worstEfficiency,
      message: `Наименее продуктивное время: ${worstHour}:00 (эффективность: ${worstEfficiency} ₽/ч)`,
    });
  }
  
  return recommendations;
}

/**
 * Рассчитывает прогноз заработка на основе трендов
 * @param {Array} entries - массив записей времени за последние дни
 * @param {number} daysAhead - на сколько дней вперед прогнозировать
 * @returns {Object} прогноз заработка
 */
export function calculateEarningsForecast(entries, daysAhead = 7) {
  if (entries.length < 7) {
    return {
      forecast: 0,
      confidence: 'low',
      message: 'Недостаточно данных для прогноза',
    };
  }
  
  // Группируем записи по дням
  const dailyEarnings = {};
  entries.forEach(entry => {
    const date = entry.date;
    if (!dailyEarnings[date]) {
      dailyEarnings[date] = 0;
    }
    dailyEarnings[date] += parseFloat(entry.earned || 0);
  });
  
  // Рассчитываем средний дневной заработок
  const dailyValues = Object.values(dailyEarnings);
  const averageDaily = dailyValues.reduce((sum, val) => sum + val, 0) / dailyValues.length;
  
  // Рассчитываем тренд
  const recentDays = dailyValues.slice(-7); // Последние 7 дней
  const trend = calculateTrend(
    recentDays.slice(-3).reduce((sum, val) => sum + val, 0) / 3, // Среднее за последние 3 дня
    recentDays.slice(0, 3).reduce((sum, val) => sum + val, 0) / 3 // Среднее за первые 3 дня
  );
  
  // Прогноз с учетом тренда
  const trendMultiplier = trend.direction === 'up' ? 1.05 : trend.direction === 'down' ? 0.95 : 1.0;
  const forecast = averageDaily * daysAhead * trendMultiplier;
  
  return {
    forecast: forecast.toFixed(2),
    averageDaily: averageDaily.toFixed(2),
    trend: trend,
    confidence: dailyValues.length >= 14 ? 'high' : dailyValues.length >= 7 ? 'medium' : 'low',
    message: `Прогноз на ${daysAhead} дней: ${forecast.toFixed(2)} ₽`,
  };
}

/**
 * Рассчитывает количество рабочих дней в месяце на основе рабочего графика
 * 
 * @param {number} year - Год
 * @param {number} month - Месяц (0-11, где 0 = январь)
 * @param {number} startDay - Начальный день месяца (по умолчанию 1)
 * @param {number|null} endDay - Конечный день месяца (null = до конца месяца)
 * @param {Object} settings - Объект настроек с рабочим графиком
 * @param {Object} settings.customWorkDates - Кастомные рабочие дни {date: boolean}
 * @param {string} settings.workScheduleTemplate - Шаблон графика ('5/2', '2/2', '3/3', '5/5')
 * @param {number} settings.workScheduleStartDay - Начало недели (1 = Понедельник)
 * @returns {number} Количество рабочих дней
 */
export function calculateWorkingDaysInMonth(year, month, startDay = 1, endDay = null, settings = {}) {
  const daysInMonth = new Date(year, month + 1, 0).getDate();
  const actualEndDay = endDay || daysInMonth;
  let workingDays = 0;

  const template = settings?.workScheduleTemplate || '5/2';
  const weekStartDay = settings?.workScheduleStartDay || 1; // 1 = Monday

  // Если выбран кастомный график, используем customWorkDates
  if (template === 'custom' && settings?.customWorkDates && Object.keys(settings.customWorkDates).length > 0) {
    for (let day = startDay; day <= actualEndDay; day++) {
      const dateKey = `${year}-${String(month + 1).padStart(2, '0')}-${String(day).padStart(2, '0')}`;
      if (settings.customWorkDates[dateKey] !== false) {
        workingDays++;
      }
    }
  } else {
    // Используем шаблон рабочего графика
    if (template === '5/2') {
      // Стандартный недельный график: 5 рабочих, 2 выходных
      for (let day = startDay; day <= actualEndDay; day++) {
        const date = new Date(year, month, day);
        let dayOfWeek = date.getDay(); // 0 = Sunday, 1 = Monday, etc.

        // Конвертируем в систему где Monday = 1
        dayOfWeek = dayOfWeek === 0 ? 7 : dayOfWeek;

        // Сдвигаем относительно начального дня недели
        const adjustedDay = ((dayOfWeek - weekStartDay + 7) % 7);

        // Первые 5 дней недели - рабочие
        if (adjustedDay < 5) {
          workingDays++;
        }
      }
    } else {
      // Сменные графики: считаем от начала месяца
      const patterns = {
        '2/2': { work: 2, total: 4 },   // 2 рабочих, 2 выходных
        '3/3': { work: 3, total: 6 },   // 3 рабочих, 3 выходных  
        '5/5': { work: 5, total: 10 }   // 5 рабочих, 5 выходных
      };

      const pattern = patterns[template];
      if (pattern) {
        // Находим первый день месяца, который соответствует началу рабочей недели
        let firstWorkDay = 1;
        for (let day = 1; day <= 7; day++) {
          const date = new Date(year, month, day);
          let dayOfWeek = date.getDay();
          dayOfWeek = dayOfWeek === 0 ? 7 : dayOfWeek;

          if (dayOfWeek === weekStartDay) {
            firstWorkDay = day;
            break;
          }
        }

        // Рассчитываем рабочие дни относительно первого рабочего дня
        for (let day = startDay; day <= actualEndDay; day++) {
          const daysSinceFirstWorkDay = day - firstWorkDay;
          const cyclePosition = ((daysSinceFirstWorkDay % pattern.total) + pattern.total) % pattern.total;
          const isWorkDay = cyclePosition < pattern.work;
          if (isWorkDay) {
            workingDays++;
          }
        }
      }
    }
  }

  return workingDays;
}