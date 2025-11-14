import fs from 'fs'
import path from 'path'

const testFile = path.join(process.cwd(), 'src/hooks/__tests__/useEntryForm.test.js')

const content = `/**
 * ✅ ТЕСТЫ: Тесты для хука useEntryForm
 */

import { describe, it, expect, beforeEach, vi } from 'vitest';
import { renderHook, act } from '@testing-library/react';
import { useEntryForm } from '../useEntryForm';

// Мокаем useSettingsStore
vi.mock('../../store/useSettingsStore', () => ({
  useSettingsStore: () => ({
    categories: [
      { id: '1', name: 'Разработка', color: '#FF0000' },
      { id: '2', name: 'Тестирование', color: '#00FF00' },
    ],
  }),
}));

describe('useEntryForm', () => {
  const mockCategories = [
    { id: '1', name: 'Разработка', color: '#FF0000' },
    { id: '2', name: 'Тестирование', color: '#00FF00' },
  ];

  beforeEach(() => {
    vi.useFakeTimers();
    vi.setSystemTime(new Date('2025-11-08T12:00:00'));
  });

  afterEach(() => {
    vi.useRealTimers();
  });

  it('should initialize with empty form when no entry provided', () => {
    const { result } = renderHook(() => useEntryForm(null, mockCategories));
    
    expect(result.current.formData.date).toBe('2025-11-08');
    expect(result.current.formData.start).toBe('');
    expect(result.current.formData.end).toBe('');
    expect(result.current.formData.category).toBe('Разработка');
    expect(result.current.formData.description).toBe('');
    expect(result.current.formData.earned).toBe('');
  });

  it('should initialize with entry data when entry provided', () => {
    const entry = {
      id: '1',
      date: '2025-11-07',
      start: '09:00',
      end: '17:00',
      category: 'Разработка',
      description: 'Тестовая запись',
      earned: '8000.00',
    };
    
    const { result } = renderHook(() => useEntryForm(entry, mockCategories));
    
    expect(result.current.formData.date).toBe('2025-11-07');
    expect(result.current.formData.start).toBe('09:00');
    expect(result.current.formData.end).toBe('17:00');
    expect(result.current.formData.category).toBe('Разработка');
    expect(result.current.formData.description).toBe('Тестовая запись');
    expect(result.current.formData.earned).toBe('8000.00');
  });

  it('should update field using setField', () => {
    const { result } = renderHook(() => useEntryForm(null, mockCategories));
    
    act(() => {
      result.current.setField('start', '10:00');
    });
    
    expect(result.current.formData.start).toBe('10:00');
  });

  it('should update multiple fields using setFields', () => {
    const { result } = renderHook(() => useEntryForm(null, mockCategories));
    
    act(() => {
      result.current.setFields({
        start: '09:00',
        end: '17:00',
        description: 'Новое описание',
      });
    });
    
    expect(result.current.formData.start).toBe('09:00');
    expect(result.current.formData.end).toBe('17:00');
    expect(result.current.formData.description).toBe('Новое описание');
  });

  it('should reset form using resetForm', () => {
    const entry = {
      id: '1',
      date: '2025-11-07',
      start: '09:00',
      end: '17:00',
      category: 'Разработка',
      description: 'Тестовая запись',
      earned: '8000.00',
    };
    
    const { result } = renderHook(() => useEntryForm(entry, mockCategories));
    
    act(() => {
      result.current.resetForm();
    });
    
    expect(result.current.formData.date).toBe('2025-11-08');
    expect(result.current.formData.start).toBe('');
    expect(result.current.formData.end).toBe('');
    expect(result.current.formData.description).toBe('');
    expect(result.current.formData.earned).toBe('');
  });

  it('should convert category ID to name when entry has categoryId', () => {
    const entry = {
      id: '1',
      date: '2025-11-07',
      categoryId: '2', // ID категории
      category: '',
    };
    
    const { result } = renderHook(() => useEntryForm(entry, mockCategories));
    
    expect(result.current.formData.category).toBe('Тестирование');
  });

  it('should handle entry update when entry prop changes', () => {
    const { result, rerender } = renderHook(
      ({ entry }) => useEntryForm(entry, mockCategories),
      { initialProps: { entry: null } }
    );
    
    const newEntry = {
      id: '2',
      date: '2025-11-09',
      start: '10:00',
      end: '18:00',
      category: 'Тестирование',
    };
    
    rerender({ entry: newEntry });
    
    expect(result.current.formData.date).toBe('2025-11-09');
    expect(result.current.formData.start).toBe('10:00');
    expect(result.current.formData.category).toBe('Тестирование');
  });
});
`

fs.writeFileSync(testFile, content, 'utf8')
console.log('✅ Тесты для useEntryForm.js созданы')
