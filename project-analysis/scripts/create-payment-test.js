import fs from 'fs'
import path from 'path'

const testFile = path.join(process.cwd(), 'src/utils/__tests__/paymentCalculations.test.js')

const content = `/**
 * ✅ ТЕСТЫ: Тесты для утилит расчета выплат
 */

import { describe, it, expect, vi, beforeEach } from 'vitest';
import {
  calculatePaymentPeriod,
  getFilteredEntriesForPayment,
  calculateWorkingDaysInPaymentPeriod,
  formatPaymentDate,
  validatePaymentDate,
} from '../paymentCalculations';

describe('paymentCalculations', () => {
  beforeEach(() => {
    vi.useFakeTimers();
    vi.setSystemTime(new Date('2025-11-08T12:00:00'));
  });

  afterEach(() => {
    vi.useRealTimers();
  });

  describe('calculatePaymentPeriod', () => {
    it('should calculate payment period for current month', () => {
      const payment = {
        day: 15,
        monthOffset: 0,
        period: { start: 1, end: 31 },
      };
      const period = calculatePaymentPeriod(payment, 2025, 10); // ноябрь
      
      expect(period.year).toBe(2025);
      expect(period.month).toBe(10);
      expect(period.start.getDate()).toBe(1);
      expect(period.end.getDate()).toBe(31);
      expect(period.paymentDate.getDate()).toBe(15);
    });

    it('should calculate payment period with month offset', () => {
      const payment = {
        day: 10,
        monthOffset: 1,
        period: { start: 1, end: 15 },
      };
      const period = calculatePaymentPeriod(payment, 2025, 10); // ноябрь -> декабрь
      
      expect(period.year).toBe(2025);
      expect(period.month).toBe(11); // декабрь
    });

    it('should handle year overflow', () => {
      const payment = {
        day: 5,
        monthOffset: 2,
        period: { start: 1, end: 10 },
      };
      const period = calculatePaymentPeriod(payment, 2025, 11); // декабрь -> февраль следующего года
      
      expect(period.year).toBe(2026);
      expect(period.month).toBe(1); // февраль
    });

    it('should limit day to last day of month', () => {
      const payment = {
        day: 35, // больше чем дней в месяце
        monthOffset: 0,
        period: { start: 1, end: 31 },
      };
      const period = calculatePaymentPeriod(payment, 2025, 1); // февраль (28 дней)
      
      expect(period.paymentDate.getDate()).toBeLessThanOrEqual(28);
    });
  });

  describe('getFilteredEntriesForPayment', () => {
    it('should filter entries by payment period', () => {
      const entries = [
        { id: '1', date: '2025-11-05', duration: '8.00', earned: '8000.00' },
        { id: '2', date: '2025-11-15', duration: '6.00', earned: '6000.00' },
        { id: '3', date: '2025-12-01', duration: '4.00', earned: '4000.00' },
      ];
      
      const payment = {
        day: 20,
        monthOffset: 0,
        period: { start: 1, end: 30 },
      };
      
      const filtered = getFilteredEntriesForPayment(entries, payment, 2025, 10);
      expect(filtered.length).toBe(2);
      expect(filtered.map(e => e.id)).toEqual(['1', '2']);
    });

    it('should return empty array for no matching entries', () => {
      const entries = [
        { id: '1', date: '2025-12-01', duration: '8.00', earned: '8000.00' },
      ];
      
      const payment = {
        day: 15,
        monthOffset: 0,
        period: { start: 1, end: 30 },
      };
      
      const filtered = getFilteredEntriesForPayment(entries, payment, 2025, 10);
      expect(filtered.length).toBe(0);
    });

    it('should handle entries with invalid dates', () => {
      const entries = [
        { id: '1', date: 'invalid', duration: '8.00', earned: '8000.00' },
        { id: '2', date: '2025-11-15', duration: '6.00', earned: '6000.00' },
      ];
      
      const payment = {
        day: 20,
        monthOffset: 0,
        period: { start: 1, end: 30 },
      };
      
      const filtered = getFilteredEntriesForPayment(entries, payment, 2025, 10);
      expect(filtered.length).toBe(1);
      expect(filtered[0].id).toBe('2');
    });
  });

  describe('calculateWorkingDaysInPaymentPeriod', () => {
    it('should calculate working days for payment period', () => {
      const payment = {
        day: 15,
        monthOffset: 0,
        period: { start: 1, end: 15 },
      };
      
      const settings = {
        workScheduleTemplate: '5/2',
        workScheduleStartDay: 1,
      };
      
      const workingDays = calculateWorkingDaysInPaymentPeriod(payment, 2025, 10, settings);
      expect(workingDays).toBeGreaterThan(0);
      expect(workingDays).toBeLessThanOrEqual(15);
    });

    it('should handle custom work schedule', () => {
      const payment = {
        day: 10,
        monthOffset: 0,
        period: { start: 1, end: 10 },
      };
      
      const settings = {
        workScheduleTemplate: 'custom',
        customWorkDates: {
          '2025-11-01': true,
          '2025-11-02': true,
          '2025-11-03': false,
        },
      };
      
      const workingDays = calculateWorkingDaysInPaymentPeriod(payment, 2025, 10, settings);
      expect(workingDays).toBeGreaterThanOrEqual(0);
    });
  });

  describe('formatPaymentDate', () => {
    it('should format payment date correctly', () => {
      const payment = {
        day: 15,
        monthOffset: 0,
        period: { start: 1, end: 31 },
      };
      
      const formatted = formatPaymentDate(payment, 2025, 10);
      expect(formatted).toMatch(/^\\d{2}\\.\\d{2}$/);
    });

    it('should format date with month offset', () => {
      const payment = {
        day: 10,
        monthOffset: 1,
        period: { start: 1, end: 31 },
      };
      
      const formatted = formatPaymentDate(payment, 2025, 10);
      expect(formatted).toBeDefined();
      expect(typeof formatted).toBe('string');
    });
  });

  describe('validatePaymentDate', () => {
    it('should return valid for correct payment', () => {
      const payment = {
        id: '1',
        name: 'Зарплата',
        day: 15,
        monthOffset: 0,
        period: { start: 1, end: 31 },
        color: '#FF0000',
        enabled: true,
      };
      
      const result = validatePaymentDate(payment);
      expect(result.isValid).toBe(true);
      expect(result.errors.length).toBe(0);
    });

    it('should return error for invalid day', () => {
      const payment = {
        id: '1',
        name: 'Зарплата',
        day: 35,
        monthOffset: 0,
        period: { start: 1, end: 31 },
        color: '#FF0000',
      };
      
      const result = validatePaymentDate(payment);
      expect(result.isValid).toBe(false);
      expect(result.errors.length).toBeGreaterThan(0);
    });

    it('should return error for invalid period', () => {
      const payment = {
        id: '1',
        name: 'Зарплата',
        day: 15,
        monthOffset: 0,
        period: { start: 20, end: 10 }, // start > end
        color: '#FF0000',
      };
      
      const result = validatePaymentDate(payment);
      expect(result.isValid).toBe(false);
      expect(result.errors.some(e => e.includes('Начало периода'))).toBe(true);
    });

    it('should return error for missing name', () => {
      const payment = {
        id: '1',
        name: '',
        day: 15,
        monthOffset: 0,
        period: { start: 1, end: 31 },
        color: '#FF0000',
      };
      
      const result = validatePaymentDate(payment);
      expect(result.isValid).toBe(false);
      expect(result.errors.some(e => e.includes('Название'))).toBe(true);
    });

    it('should return error for invalid color', () => {
      const payment = {
        id: '1',
        name: 'Зарплата',
        day: 15,
        monthOffset: 0,
        period: { start: 1, end: 31 },
        color: 'invalid',
      };
      
      const result = validatePaymentDate(payment);
      expect(result.isValid).toBe(false);
      expect(result.errors.some(e => e.includes('Цвет'))).toBe(true);
    });

    it('should detect overlapping periods', () => {
      const existingPayments = [
        {
          id: '1',
          name: 'Зарплата',
          day: 15,
          monthOffset: 0,
          period: { start: 1, end: 15 },
          color: '#FF0000',
          enabled: true,
        },
      ];
      
      const newPayment = {
        id: '2',
        name: 'Аванс',
        day: 10,
        monthOffset: 0,
        period: { start: 10, end: 20 },
        color: '#00FF00',
        enabled: true,
      };
      
      const result = validatePaymentDate(newPayment, existingPayments);
      expect(result.isValid).toBe(false);
      expect(result.errors.some(e => e.includes('пересекается'))).toBe(true);
    });

    it('should not check overlap for disabled payment', () => {
      const existingPayments = [
        {
          id: '1',
          name: 'Зарплата',
          day: 15,
          monthOffset: 0,
          period: { start: 1, end: 15 },
          color: '#FF0000',
          enabled: true,
        },
      ];
      
      const newPayment = {
        id: '2',
        name: 'Аванс',
        day: 10,
        monthOffset: 0,
        period: { start: 10, end: 20 },
        color: '#00FF00',
        enabled: false,
      };
      
      const result = validatePaymentDate(newPayment, existingPayments);
      // Не должно быть ошибки о пересечении, так как выплата отключена
      expect(result.errors.some(e => e.includes('пересекается'))).toBe(false);
    });
  });
});
`

fs.writeFileSync(testFile, content, 'utf8')
console.log('✅ Тесты для paymentCalculations.js созданы')
