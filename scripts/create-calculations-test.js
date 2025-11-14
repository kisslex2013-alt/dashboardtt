import fs from 'fs'
import path from 'path'

const testFile = path.join(process.cwd(), 'src/utils/__tests__/calculations.test.js')

const content = `/**
 * ✅ ТЕСТЫ: Тесты для утилит расчетов
 */

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
} from '../calculations';

describe('calculations', () => {
  describe('calculateDuration', () => {
    it('should calculate duration in hours', () => {
      expect(calculateDuration('09:00', '17:00')).toBe('8.00');
      expect(calculateDuration('10:30', '14:45')).toBe('4.25');
      expect(calculateDuration('08:00', '12:30')).toBe('4.50');
    });

    it('should handle midnight crossover', () => {
      expect(calculateDuration('23:00', '01:00')).toBe('-22.00');
    });

    it('should return 0 for same time', () => {
      expect(calculateDuration('10:00', '10:00')).toBe('0.00');
    });
  });

  describe('calculateEarned', () => {
    it('should calculate earned amount', () => {
      expect(calculateEarned(8, 1000)).toBe('8000.00');
      expect(calculateEarned(4.5, 1500)).toBe('6750.00');
      expect(calculateEarned('8', '1000')).toBe('8000.00');
    });

    it('should handle zero values', () => {
      expect(calculateEarned(0, 1000)).toBe('0.00');
      expect(calculateEarned(8, 0)).toBe('0.00');
    });
  });

  describe('roundTime', () => {
    it('should round time to 15 minutes by default', () => {
      expect(roundTime(37)).toBe(30);
      expect(roundTime(43)).toBe(45);
      expect(roundTime(50)).toBe(45);
      expect(roundTime(52)).toBe(60);
    });

    it('should round time to custom interval', () => {
      expect(roundTime(37, 30)).toBe(30);
      expect(roundTime(43, 30)).toBe(60);
      expect(roundTime(25, 10)).toBe(30);
    });
  });

  describe('calculateStats', () => {
    it('should calculate statistics for entries in date range', () => {
      const entries = [
        { date: '2025-11-01', duration: '8.00', earned: '8000.00' },
        { date: '2025-11-02', duration: '6.00', earned: '6000.00' },
        { date: '2025-11-10', duration: '4.00', earned: '4000.00' },
      ];
      const startDate = new Date('2025-11-01');
      const endDate = new Date('2025-11-05');

      const stats = calculateStats(entries, startDate, endDate);
      expect(stats.totalHours).toBe('14.00');
      expect(stats.totalEarned).toBe('14000.00');
      expect(stats.entriesCount).toBe(2);
    });

    it('should return zero stats for empty entries', () => {
      const stats = calculateStats([], new Date(), new Date());
      expect(stats.totalHours).toBe('0.00');
      expect(stats.totalEarned).toBe('0.00');
      expect(stats.entriesCount).toBe(0);
    });
  });

  describe('groupByCategory', () => {
    it('should group entries by category', () => {
      const entries = [
        { category: 'work', duration: '8.00', earned: '8000.00' },
        { category: 'work', duration: '4.00', earned: '4000.00' },
        { category: 'meeting', duration: '2.00', earned: '2000.00' },
      ];

      const grouped = groupByCategory(entries);
      expect(grouped.work.hours).toBe(12);
      expect(grouped.work.earned).toBe(12000);
      expect(grouped.work.count).toBe(2);
      expect(grouped.meeting.hours).toBe(2);
      expect(grouped.meeting.earned).toBe(2000);
    });
  });

  describe('calculateEfficiency', () => {
    it('should calculate efficiency percentage', () => {
      const result = calculateEfficiency(100, 100);
      expect(result.percentage).toBe('100.0');
      expect(result.color).toBe('green');
      expect(result.status).toBe('excellent');
    });

    it('should return good status for 70-99%', () => {
      const result = calculateEfficiency(80, 100);
      expect(result.percentage).toBe('80.0');
      expect(result.color).toBe('yellow');
      expect(result.status).toBe('good');
    });

    it('should return poor status for less than 70%', () => {
      const result = calculateEfficiency(50, 100);
      expect(result.percentage).toBe('50.0');
      expect(result.color).toBe('red');
      expect(result.status).toBe('poor');
    });

    it('should handle zero planned', () => {
      const result = calculateEfficiency(100, 0);
      expect(result.percentage).toBe('0');
      expect(result.color).toBe('gray');
      expect(result.status).toBe('no-plan');
    });
  });

  describe('calculateTrend', () => {
    it('should calculate upward trend', () => {
      const result = calculateTrend(120, 100);
      expect(result.direction).toBe('up');
      expect(result.color).toBe('green');
      expect(parseFloat(result.change)).toBe(20);
    });

    it('should calculate downward trend', () => {
      const result = calculateTrend(80, 100);
      expect(result.direction).toBe('down');
      expect(result.color).toBe('red');
      expect(parseFloat(result.change)).toBe(-20);
    });

    it('should handle stable trend', () => {
      const result = calculateTrend(100, 100);
      expect(result.direction).toBe('stable');
      expect(result.color).toBe('gray');
    });

    it('should handle zero previous value', () => {
      const result = calculateTrend(100, 0);
      expect(result.change).toBe(100);
      expect(result.percentage).toBe('100');
      expect(result.direction).toBe('up');
    });
  });

  describe('calculateWeeklyProductivity', () => {
    it('should calculate productivity by day of week', () => {
      const entries = [
        { date: '2025-11-03', duration: '8.00', earned: '8000.00' }, // Monday
        { date: '2025-11-04', duration: '6.00', earned: '6000.00' }, // Tuesday
      ];

      const productivity = calculateWeeklyProductivity(entries);
      expect(productivity.monday.totalHours).toBe(8);
      expect(productivity.monday.totalEarned).toBe(8000);
      expect(productivity.tuesday.totalHours).toBe(6);
    });
  });

  describe('calculateOptimalTime', () => {
    it('should calculate optimal working time', () => {
      const entries = [
        { start: '09:00', duration: '8.00', earned: '8000.00' },
        { start: '10:00', duration: '6.00', earned: '9000.00' },
        { start: '09:00', duration: '4.00', earned: '4000.00' },
      ];

      const optimal = calculateOptimalTime(entries);
      expect(optimal.hourlyData).toBeDefined();
      expect(optimal.hourlyData[9]).toBeDefined();
      expect(optimal.hourlyData[10]).toBeDefined();
    });
  });

  describe('calculateEarningsForecast', () => {
    it('should return low confidence for insufficient data', () => {
      const entries = Array(5).fill({ date: '2025-11-01', earned: '1000.00' });
      const forecast = calculateEarningsForecast(entries, 7);
      expect(forecast.confidence).toBe('low');
      expect(forecast.message).toContain('Недостаточно данных');
    });

    it('should calculate forecast for sufficient data', () => {
      const entries = Array(10).fill(null).map((_, i) => ({
        date: \`2025-11-\${String(i + 1).padStart(2, '0')}\`,
        earned: '1000.00',
      }));
      const forecast = calculateEarningsForecast(entries, 7);
      expect(forecast.forecast).toBeDefined();
      expect(forecast.confidence).toBe('medium');
    });
  });

  describe('calculateWorkingDaysInMonth', () => {
    it('should calculate working days for 5/2 schedule', () => {
      const workingDays = calculateWorkingDaysInMonth(2025, 10, 1, null, {
        workScheduleTemplate: '5/2',
        workScheduleStartDay: 1,
      });
      expect(workingDays).toBeGreaterThan(0);
      expect(workingDays).toBeLessThanOrEqual(31);
    });

    it('should calculate working days for custom schedule', () => {
      const customDates = {
        '2025-11-01': true,
        '2025-11-02': true,
        '2025-11-03': false,
      };
      const workingDays = calculateWorkingDaysInMonth(2025, 10, 1, 3, {
        workScheduleTemplate: 'custom',
        customWorkDates: customDates,
      });
      expect(workingDays).toBe(2);
    });
  });
});
`

fs.writeFileSync(testFile, content, 'utf8')
console.log('✅ Тесты для calculations.js созданы')
