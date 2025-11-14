import fs from 'fs'
import path from 'path'

const testFile = path.join(process.cwd(), 'src/store/__tests__/useEntriesStore.test.js')

const content = `/**
 * ✅ ТЕСТЫ: Тесты для store useEntriesStore
 */

import { describe, it, expect, beforeEach, vi } from 'vitest';
import { useEntriesStore } from '../useEntriesStore';

// Мокаем зависимости
vi.mock('../useHistoryStore', () => ({
  useHistoryStore: {
    getState: () => ({
      pushToUndo: vi.fn(),
    }),
  },
}));

vi.mock('../../utils/backupManager', () => ({
  backupManager: {
    saveBackup: vi.fn(),
  },
}));

vi.mock('../../utils/syncManager', () => ({
  syncManager: {
    broadcast: vi.fn(),
  },
  SyncMessageType: {
    ENTRY_ADDED: 'ENTRY_ADDED',
    ENTRY_UPDATED: 'ENTRY_UPDATED',
    ENTRY_DELETED: 'ENTRY_DELETED',
  },
}));

vi.mock('../../utils/errorHandler', () => ({
  handleError: vi.fn(),
  checkStorageSpace: () => ({ hasSpace: true }),
}));

describe('useEntriesStore', () => {
  beforeEach(() => {
    // Очищаем store перед каждым тестом
    useEntriesStore.setState({ entries: [] });
    vi.clearAllMocks();
  });

  describe('addEntry', () => {
    it('should add new entry to store', () => {
      const entry = {
        date: '2025-11-08',
        start: '09:00',
        end: '17:00',
        category: 'Разработка',
        description: 'Тестовая запись',
        rate: '1000',
      };

      useEntriesStore.getState().addEntry(entry);

      const entries = useEntriesStore.getState().entries;
      expect(entries.length).toBe(1);
      expect(entries[0].date).toBe('2025-11-08');
      expect(entries[0].start).toBe('09:00');
      expect(entries[0].category).toBe('Разработка');
      expect(entries[0].id).toBeDefined();
    });

    it('should generate ID if not provided', () => {
      const entry = {
        date: '2025-11-08',
        start: '09:00',
        end: '17:00',
        category: 'Разработка',
      };

      useEntriesStore.getState().addEntry(entry);

      const entries = useEntriesStore.getState().entries;
      expect(entries[0].id).toBeDefined();
      expect(typeof entries[0].id).toBe('string');
    });

    it('should use provided ID if given', () => {
      const entry = {
        id: 'custom-id-123',
        date: '2025-11-08',
        start: '09:00',
        end: '17:00',
        category: 'Разработка',
      };

      useEntriesStore.getState().addEntry(entry);

      const entries = useEntriesStore.getState().entries;
      expect(entries[0].id).toBe('custom-id-123');
    });

    it('should add createdAt and updatedAt timestamps', () => {
      const entry = {
        date: '2025-11-08',
        start: '09:00',
        end: '17:00',
        category: 'Разработка',
      };

      useEntriesStore.getState().addEntry(entry);

      const entries = useEntriesStore.getState().entries;
      expect(entries[0].createdAt).toBeDefined();
      expect(entries[0].updatedAt).toBeDefined();
      expect(typeof entries[0].createdAt).toBe('string');
    });
  });

  describe('updateEntry', () => {
    it('should update existing entry', () => {
      const entry = {
        id: '1',
        date: '2025-11-08',
        start: '09:00',
        end: '17:00',
        category: 'Разработка',
      };

      useEntriesStore.getState().addEntry(entry);
      
      useEntriesStore.getState().updateEntry('1', {
        start: '10:00',
        description: 'Обновленное описание',
      });

      const entries = useEntriesStore.getState().entries;
      expect(entries[0].start).toBe('10:00');
      expect(entries[0].description).toBe('Обновленное описание');
      expect(entries[0].end).toBe('17:00'); // Не изменилось
    });

    it('should update updatedAt timestamp', () => {
      const entry = {
        id: '1',
        date: '2025-11-08',
        start: '09:00',
        end: '17:00',
        category: 'Разработка',
      };

      useEntriesStore.getState().addEntry(entry);
      const originalUpdatedAt = useEntriesStore.getState().entries[0].updatedAt;
      
      // Ждем немного, чтобы timestamp изменился
      vi.advanceTimersByTime(1000);
      
      useEntriesStore.getState().updateEntry('1', { start: '10:00' });

      const updatedAt = useEntriesStore.getState().entries[0].updatedAt;
      expect(updatedAt).not.toBe(originalUpdatedAt);
    });

    it('should not update non-existent entry', () => {
      const entry = {
        id: '1',
        date: '2025-11-08',
        start: '09:00',
        end: '17:00',
        category: 'Разработка',
      };

      useEntriesStore.getState().addEntry(entry);
      
      useEntriesStore.getState().updateEntry('999', { start: '10:00' });

      const entries = useEntriesStore.getState().entries;
      expect(entries[0].start).toBe('09:00'); // Не изменилось
    });
  });

  describe('deleteEntry', () => {
    it('should delete entry by id', () => {
      const entry1 = {
        id: '1',
        date: '2025-11-08',
        start: '09:00',
        end: '17:00',
        category: 'Разработка',
      };
      
      const entry2 = {
        id: '2',
        date: '2025-11-09',
        start: '10:00',
        end: '18:00',
        category: 'Тестирование',
      };

      useEntriesStore.getState().addEntry(entry1);
      useEntriesStore.getState().addEntry(entry2);
      
      expect(useEntriesStore.getState().entries.length).toBe(2);
      
      useEntriesStore.getState().deleteEntry('1');
      
      const entries = useEntriesStore.getState().entries;
      expect(entries.length).toBe(1);
      expect(entries[0].id).toBe('2');
    });

    it('should not delete non-existent entry', () => {
      const entry = {
        id: '1',
        date: '2025-11-08',
        start: '09:00',
        end: '17:00',
        category: 'Разработка',
      };

      useEntriesStore.getState().addEntry(entry);
      
      useEntriesStore.getState().deleteEntry('999');
      
      const entries = useEntriesStore.getState().entries;
      expect(entries.length).toBe(1);
    });
  });

  describe('clearAllEntries', () => {
    it('should clear all entries', () => {
      const entry1 = {
        id: '1',
        date: '2025-11-08',
        start: '09:00',
        end: '17:00',
        category: 'Разработка',
      };
      
      const entry2 = {
        id: '2',
        date: '2025-11-09',
        start: '10:00',
        end: '18:00',
        category: 'Тестирование',
      };

      useEntriesStore.getState().addEntry(entry1);
      useEntriesStore.getState().addEntry(entry2);
      
      expect(useEntriesStore.getState().entries.length).toBe(2);
      
      useEntriesStore.getState().clearAllEntries();
      
      expect(useEntriesStore.getState().entries.length).toBe(0);
    });
  });

  describe('getTodayEntries', () => {
    it('should return entries for today', () => {
      const today = new Date().toISOString().split('T')[0];
      
      const entry1 = {
        id: '1',
        date: today,
        start: '09:00',
        end: '17:00',
        category: 'Разработка',
      };
      
      const entry2 = {
        id: '2',
        date: '2025-11-07', // Вчера
        start: '10:00',
        end: '18:00',
        category: 'Тестирование',
      };

      useEntriesStore.getState().addEntry(entry1);
      useEntriesStore.getState().addEntry(entry2);
      
      const todayEntries = useEntriesStore.getState().getTodayEntries();
      expect(todayEntries.length).toBe(1);
      expect(todayEntries[0].id).toBe('1');
    });
  });

  describe('getEntriesByPeriod', () => {
    it('should return entries within date range', () => {
      const entry1 = {
        id: '1',
        date: '2025-11-08',
        start: '09:00',
        end: '17:00',
        category: 'Разработка',
      };
      
      const entry2 = {
        id: '2',
        date: '2025-11-09',
        start: '10:00',
        end: '18:00',
        category: 'Тестирование',
      };
      
      const entry3 = {
        id: '3',
        date: '2025-11-10',
        start: '11:00',
        end: '19:00',
        category: 'Разработка',
      };

      useEntriesStore.getState().addEntry(entry1);
      useEntriesStore.getState().addEntry(entry2);
      useEntriesStore.getState().addEntry(entry3);
      
      const startDate = new Date('2025-11-08');
      const endDate = new Date('2025-11-09');
      
      const periodEntries = useEntriesStore.getState().getEntriesByPeriod(startDate, endDate);
      expect(periodEntries.length).toBe(2);
      expect(periodEntries.map(e => e.id)).toEqual(['1', '2']);
    });
  });
});
`

fs.writeFileSync(testFile, content, 'utf8')
console.log('✅ Тесты для useEntriesStore.js созданы')
