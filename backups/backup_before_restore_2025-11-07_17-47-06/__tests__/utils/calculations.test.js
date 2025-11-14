import { describe, it, expect } from 'vitest';
import {
  calculateDuration,
  calculateEarned,
  roundTime,
  calculateStats,
  groupByCategory,
  calculateEfficiency,
  calculateTrend,
  calculateWeeklyProductivity,
  calculateOptimalTime,
  calculateEarningsForecast,
  calculateWorkingDaysInMonth,
} from '../../utils/calculations';

describe('calculations', () => {
  describe('calculateDuration', () => {
    it('should calculate duration correctly for normal hours', () => {
      expect(calculateDuration('09:00', '12:00')).toBe('3.00');
      expect(calculateDuration('10:30', '14:45')).toBe('4.25');
    });

    it('should handle minutes correctly', () => {
      expect(calculateDuration('09:15', '10:45')).toBe('1.50');
      expect(calculateDuration('09:00', '09:30')).toBe('0.50');
    });

    it('should handle edge cases', () => {
      expect(calculateDuration('00:00', '01:00')).toBe('1.00');
      expect(calculateDuration('23:00', '23:59')).toBe('0.98');
    });

    it('should handle zero duration', () => {
      expect(calculateDuration('09:00', '09:00')).toBe('0.00');
    });
  });

  describe('calculateEarned', () => {
    it('should calculate earned correctly', () => {
      expect(calculateEarned(3, 1500)).toBe('4500.00');
      expect(calculateEarned(2.5, 1000)).toBe('2500.00');
    });

    it('should handle string inputs', () => {
      expect(calculateEarned('3', '1500')).toBe('4500.00');
      expect(calculateEarned('2.5', '1000')).toBe('2500.00');
    });

    it('should handle decimal values', () => {
      expect(calculateEarned(3.5, 1500.5)).toBe('5251.75');
    });

    it('should handle zero values', () => {
      expect(calculateEarned(0, 1500)).toBe('0.00');
      expect(calculateEarned(3, 0)).toBe('0.00');
    });
  });

  describe('roundTime', () => {
    it('should round to 15 minutes by default', () => {
      expect(roundTime(67)).toBe(60);
      expect(roundTime(73)).toBe(75);
      expect(roundTime(90)).toBe(90);
    });

    it('should round to custom interval', () => {
      expect(roundTime(67, 30)).toBe(60);
      expect(roundTime(73, 30)).toBe(90);
      expect(roundTime(45, 60)).toBe(60);
    });

    it('should handle zero', () => {
      expect(roundTime(0)).toBe(0);
      expect(roundTime(0, 15)).toBe(0);
    });
  });

  describe('calculateStats', () => {
    const mockEntries = [
      {
        date: '2024-12-19',
        duration: 3.0,
        earned: 4500,
      },
      {
        date: '2024-12-20',
        duration: 4.5,
        earned: 6750,
      },
      {
        date: '2024-12-21',
        duration: 2.0,
        earned: 3000,
      },
    ];

    it('should calculate stats correctly', () => {
      const startDate = new Date('2024-12-19');
      const endDate = new Date('2024-12-21');
      const stats = calculateStats(mockEntries, startDate, endDate);

      expect(stats.totalHours).toBe('9.50');
      expect(stats.totalEarned).toBe('14250.00');
      expect(stats.averageRate).toBe('1500.00');
      expect(stats.entriesCount).toBe(3);
    });

    it('should filter entries by date range', () => {
      const startDate = new Date('2024-12-20');
      const endDate = new Date('2024-12-21');
      const stats = calculateStats(mockEntries, startDate, endDate);

      expect(stats.entriesCount).toBe(2);
      expect(stats.totalHours).toBe('6.50');
    });

    it('should handle empty entries', () => {
      const startDate = new Date('2024-12-19');
      const endDate = new Date('2024-12-21');
      const stats = calculateStats([], startDate, endDate);

      expect(stats.totalHours).toBe('0.00');
      expect(stats.totalEarned).toBe('0.00');
      expect(stats.averageRate).toBe('0.00');
      expect(stats.entriesCount).toBe(0);
    });

    it('should handle entries with missing duration or earned', () => {
      const entriesWithMissing = [
        { date: '2024-12-19', duration: 3.0 },
        { date: '2024-12-20', earned: 4500 },
      ];
      const startDate = new Date('2024-12-19');
      const endDate = new Date('2024-12-20');
      const stats = calculateStats(entriesWithMissing, startDate, endDate);

      expect(stats.totalHours).toBe('3.00');
      expect(stats.totalEarned).toBe('4500.00');
    });
  });

  describe('groupByCategory', () => {
    const mockEntries = [
      {
        category: 'Разработка',
        duration: 3.0,
        earned: 4500,
      },
      {
        category: 'Разработка',
        duration: 2.0,
        earned: 3000,
      },
      {
        category: 'Дизайн',
        duration: 4.0,
        earned: 4800,
      },
    ];

    it('should group entries by category', () => {
      const grouped = groupByCategory(mockEntries);

      expect(grouped['Разработка']).toBeDefined();
      expect(grouped['Дизайн']).toBeDefined();
      expect(grouped['Разработка'].count).toBe(2);
      expect(grouped['Дизайн'].count).toBe(1);
    });

    it('should calculate totals correctly', () => {
      const grouped = groupByCategory(mockEntries);

      expect(grouped['Разработка'].hours).toBe(5.0);
      expect(grouped['Разработка'].earned).toBe(7500);
      expect(grouped['Разработка'].averageRate).toBe('1500.00');
    });

    it('should handle empty entries', () => {
      const grouped = groupByCategory([]);
      expect(Object.keys(grouped).length).toBe(0);
    });
  });

  describe('calculateEfficiency', () => {
    it('should calculate efficiency correctly', () => {
      const efficiency = calculateEfficiency(100, 100);
      expect(efficiency.percentage).toBe('100.0');
      expect(efficiency.color).toBe('green');
      expect(efficiency.status).toBe('excellent');
    });

    it('should handle good efficiency (70-100%)', () => {
      const efficiency = calculateEfficiency(80, 100);
      expect(efficiency.percentage).toBe('80.0');
      expect(efficiency.color).toBe('yellow');
      expect(efficiency.status).toBe('good');
    });

    it('should handle poor efficiency (<70%)', () => {
      const efficiency = calculateEfficiency(50, 100);
      expect(efficiency.percentage).toBe('50.0');
      expect(efficiency.color).toBe('red');
      expect(efficiency.status).toBe('poor');
    });

    it('should handle zero planned', () => {
      const efficiency = calculateEfficiency(100, 0);
      expect(efficiency.percentage).toBe('0');
      expect(efficiency.color).toBe('gray');
      expect(efficiency.status).toBe('no-plan');
    });
  });

  describe('calculateTrend', () => {
    it('should calculate upward trend', () => {
      const trend = calculateTrend(150, 100);
      expect(trend.direction).toBe('up');
      expect(trend.color).toBe('green');
      expect(parseFloat(trend.change)).toBe(50);
      expect(parseFloat(trend.percentage)).toBe(50);
    });

    it('should calculate downward trend', () => {
      const trend = calculateTrend(50, 100);
      expect(trend.direction).toBe('down');
      expect(trend.color).toBe('red');
      expect(parseFloat(trend.change)).toBe(-50);
      expect(parseFloat(trend.percentage)).toBe(-50);
    });

    it('should handle stable trend', () => {
      const trend = calculateTrend(100, 100);
      expect(trend.direction).toBe('stable');
      expect(trend.color).toBe('gray');
      expect(parseFloat(trend.change)).toBe(0);
      expect(parseFloat(trend.percentage)).toBe(0);
    });

    it('should handle zero previous value', () => {
      const trend = calculateTrend(100, 0);
      expect(trend.change).toBe(100);
      expect(trend.percentage).toBe('100');
      expect(trend.direction).toBe('up');
    });
  });

  describe('calculateWeeklyProductivity', () => {
    const mockEntries = [
      {
        date: '2024-12-16', // Monday
        duration: 3.0,
        earned: 4500,
      },
      {
        date: '2024-12-17', // Tuesday
        duration: 4.0,
        earned: 6000,
      },
      {
        date: '2024-12-18', // Wednesday
        duration: 2.0,
        earned: 3000,
      },
    ];

    it('should calculate productivity for each day', () => {
      const productivity = calculateWeeklyProductivity(mockEntries);

      expect(productivity.monday).toBeDefined();
      expect(productivity.tuesday).toBeDefined();
      expect(productivity.wednesday).toBeDefined();
      expect(productivity.monday.totalHours).toBe(3.0);
      expect(productivity.tuesday.totalHours).toBe(4.0);
    });

    it('should calculate average hours correctly', () => {
      const productivity = calculateWeeklyProductivity(mockEntries);
      expect(productivity.monday.averageHours).toBe('3.00');
      expect(productivity.tuesday.averageHours).toBe('4.00');
    });

    it('should handle empty entries', () => {
      const productivity = calculateWeeklyProductivity([]);
      expect(productivity.sunday.totalHours).toBe(0);
      expect(productivity.monday.totalHours).toBe(0);
    });
  });

  describe('calculateOptimalTime', () => {
    const mockEntries = [
      {
        start: '09:00',
        duration: 3.0,
        earned: 4500,
      },
      {
        start: '09:00',
        duration: 2.0,
        earned: 3000,
      },
      {
        start: '14:00',
        duration: 4.0,
        earned: 4000,
      },
    ];

    it('should calculate optimal time correctly', () => {
      const optimal = calculateOptimalTime(mockEntries);

      expect(optimal.hourlyData).toBeDefined();
      expect(optimal.mostProductiveHour).toBe(9);
      expect(optimal.recommendations).toBeDefined();
    });

    it('should handle empty entries', () => {
      const optimal = calculateOptimalTime([]);
      expect(optimal.mostProductiveHour).toBeNull();
      expect(optimal.recommendations).toEqual([]);
    });
  });

  describe('calculateEarningsForecast', () => {
    const mockEntries = Array.from({ length: 14 }, (_, i) => ({
      date: new Date(2024, 11, 5 + i).toISOString().split('T')[0],
      earned: 1000 + i * 100,
    }));

    it('should calculate forecast with sufficient data', () => {
      const forecast = calculateEarningsForecast(mockEntries, 7);
      expect(forecast.forecast).toBeDefined();
      expect(forecast.confidence).toBe('high');
      expect(forecast.trend).toBeDefined();
    });

    it('should return low confidence for insufficient data', () => {
      const forecast = calculateEarningsForecast(mockEntries.slice(0, 5), 7);
      expect(forecast.confidence).toBe('low');
      expect(forecast.message).toContain('Недостаточно данных');
    });
  });

  describe('calculateWorkingDaysInMonth', () => {
    it('should calculate working days for 5/2 schedule', () => {
      const workingDays = calculateWorkingDaysInMonth(2024, 11, 1, null, {
        workScheduleTemplate: '5/2',
        workScheduleStartDay: 1,
      });
      expect(workingDays).toBeGreaterThan(0);
      expect(workingDays).toBeLessThanOrEqual(31);
    });

    it('should calculate working days for 2/2 schedule', () => {
      const workingDays = calculateWorkingDaysInMonth(2024, 11, 1, null, {
        workScheduleTemplate: '2/2',
        workScheduleStartDay: 1,
      });
      expect(workingDays).toBeGreaterThan(0);
      expect(workingDays).toBeLessThanOrEqual(31);
    });

    it('should handle custom work dates', () => {
      const customDates = {
        '2024-12-01': true,
        '2024-12-02': true,
        '2024-12-03': false,
      };
      const workingDays = calculateWorkingDaysInMonth(2024, 11, 1, 3, {
        workScheduleTemplate: 'custom',
        customWorkDates: customDates,
      });
      expect(workingDays).toBe(2);
    });

    it('should use default 5/2 if no template provided', () => {
      const workingDays = calculateWorkingDaysInMonth(2024, 11, 1, null, {});
      expect(workingDays).toBeGreaterThan(0);
    });
  });
});
