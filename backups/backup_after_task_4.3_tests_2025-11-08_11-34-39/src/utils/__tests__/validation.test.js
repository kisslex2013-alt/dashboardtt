/**
 * ✅ ТЕСТЫ: Тесты для утилит валидации
 */

import { describe, it, expect } from 'vitest';
import {
  isRequired,
  minLength,
  maxLength,
  isNumber,
  minValue,
  maxValue,
  inRange,
  isValidDate,
  isValidTime,
  isTimeRangeValid,
  checkTimeOverlap,
  isValidEmail,
  isValidColor,
  validateTimeEntry,
} from '../validation';

describe('validation', () => {
  describe('isRequired', () => {
    it('should return error for empty value', () => {
      expect(isRequired('').isValid).toBe(false);
      expect(isRequired(null).isValid).toBe(false);
      expect(isRequired(undefined).isValid).toBe(false);
    });

    it('should return valid for non-empty value', () => {
      expect(isRequired('test').isValid).toBe(true);
      expect(isRequired(0).isValid).toBe(true);
      expect(isRequired(false).isValid).toBe(true);
    });

    it('should return error for whitespace-only string', () => {
      expect(isRequired('   ').isValid).toBe(false);
    });
  });

  describe('minLength', () => {
    it('should return error for string shorter than min', () => {
      expect(minLength('ab', 3).isValid).toBe(false);
    });

    it('should return valid for string with sufficient length', () => {
      expect(minLength('abc', 3).isValid).toBe(true);
      expect(minLength('abcd', 3).isValid).toBe(true);
    });
  });

  describe('maxLength', () => {
    it('should return error for string longer than max', () => {
      expect(maxLength('abcd', 3).isValid).toBe(false);
    });

    it('should return valid for string within max length', () => {
      expect(maxLength('abc', 3).isValid).toBe(true);
      expect(maxLength('ab', 3).isValid).toBe(true);
    });
  });

  describe('isNumber', () => {
    it('should return valid for valid number', () => {
      expect(isNumber('123').isValid).toBe(true);
      expect(isNumber('12.5').isValid).toBe(true);
      expect(isNumber(123).isValid).toBe(true);
    });

    it('should return error for invalid number', () => {
      expect(isNumber('abc').isValid).toBe(false);
      expect(isNumber('').isValid).toBe(false);
    });
  });

  describe('minValue', () => {
    it('should return error for value less than min', () => {
      expect(minValue(5, 10).isValid).toBe(false);
    });

    it('should return valid for value greater or equal to min', () => {
      expect(minValue(10, 10).isValid).toBe(true);
      expect(minValue(15, 10).isValid).toBe(true);
    });
  });

  describe('maxValue', () => {
    it('should return error for value greater than max', () => {
      expect(maxValue(15, 10).isValid).toBe(false);
    });

    it('should return valid for value less or equal to max', () => {
      expect(maxValue(10, 10).isValid).toBe(true);
      expect(maxValue(5, 10).isValid).toBe(true);
    });
  });

  describe('inRange', () => {
    it('should return valid for value in range', () => {
      expect(inRange(5, 1, 10).isValid).toBe(true);
      expect(inRange(1, 1, 10).isValid).toBe(true);
      expect(inRange(10, 1, 10).isValid).toBe(true);
    });

    it('should return error for value outside range', () => {
      expect(inRange(0, 1, 10).isValid).toBe(false);
      expect(inRange(11, 1, 10).isValid).toBe(false);
    });
  });

  describe('isValidDate', () => {
    it('should return valid for valid date string', () => {
      expect(isValidDate('2025-11-08').isValid).toBe(true);
    });

    it('should return error for invalid date', () => {
      expect(isValidDate('invalid').isValid).toBe(false);
      expect(isValidDate('').isValid).toBe(false);
    });
  });

  describe('isValidTime', () => {
    it('should return valid for valid time format', () => {
      expect(isValidTime('09:00').isValid).toBe(true);
      expect(isValidTime('23:59').isValid).toBe(true);
      expect(isValidTime('00:00').isValid).toBe(true);
    });

    it('should return error for invalid time format', () => {
      expect(isValidTime('25:00').isValid).toBe(false);
      expect(isValidTime('12:60').isValid).toBe(false);
      expect(isValidTime('9:00').isValid).toBe(true); // без ведущего нуля тоже валидно
    });
  });

  describe('isTimeRangeValid', () => {
    it('should return valid when start < end', () => {
      expect(isTimeRangeValid('09:00', '17:00').isValid).toBe(true);
    });

    it('should return error when start >= end', () => {
      expect(isTimeRangeValid('17:00', '09:00').isValid).toBe(false);
      expect(isTimeRangeValid('09:00', '09:00').isValid).toBe(false);
    });
  });

  describe('checkTimeOverlap', () => {
    it('should return valid when no overlap', () => {
      const entries = [
        { id: '1', date: '2025-11-08', start: '09:00', end: '12:00' },
      ];
      expect(checkTimeOverlap('2025-11-08', '13:00', '17:00', entries).isValid).toBe(true);
    });

    it('should return error when overlap exists', () => {
      const entries = [
        { id: '1', date: '2025-11-08', start: '09:00', end: '12:00' },
      ];
      expect(checkTimeOverlap('2025-11-08', '10:00', '14:00', entries).isValid).toBe(false);
    });

    it('should exclude entry by id', () => {
      const entries = [
        { id: '1', date: '2025-11-08', start: '09:00', end: '12:00' },
      ];
      expect(checkTimeOverlap('2025-11-08', '09:00', '12:00', entries, '1').isValid).toBe(true);
    });
  });

  describe('isValidEmail', () => {
    it('should return valid for valid email', () => {
      expect(isValidEmail('test@example.com').isValid).toBe(true);
      expect(isValidEmail('user.name@domain.co.uk').isValid).toBe(true);
    });

    it('should return error for invalid email', () => {
      expect(isValidEmail('invalid').isValid).toBe(false);
      expect(isValidEmail('@example.com').isValid).toBe(false);
      expect(isValidEmail('test@').isValid).toBe(false);
    });
  });

  describe('isValidColor', () => {
    it('should return valid for hex color', () => {
      expect(isValidColor('#FF0000').isValid).toBe(true);
      expect(isValidColor('#fff').isValid).toBe(true);
    });

    it('should return error for invalid color', () => {
      expect(isValidColor('invalid').isValid).toBe(false);
      expect(isValidColor('#GG0000').isValid).toBe(false);
    });
  });

  describe('validateTimeEntry', () => {
    it('should return valid for complete entry', () => {
      const entry = {
        date: '2025-11-08',
        start: '09:00',
        end: '17:00',
        category: 'work',
        rate: '1000',
      };
      expect(validateTimeEntry(entry).isValid).toBe(true);
    });

    it('should return error for missing required fields', () => {
      expect(validateTimeEntry({}).isValid).toBe(false);
      expect(validateTimeEntry({ date: '2025-11-08' }).isValid).toBe(false);
    });

    it('should return error for invalid time range', () => {
      const entry = {
        date: '2025-11-08',
        start: '17:00',
        end: '09:00',
        category: 'work',
        rate: '1000',
      };
      expect(validateTimeEntry(entry).isValid).toBe(false);
    });
  });
});
