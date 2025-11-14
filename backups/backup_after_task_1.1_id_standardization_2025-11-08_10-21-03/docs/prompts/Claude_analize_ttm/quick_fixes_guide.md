# 🛠️ Практическое руководство по улучшению Time Tracker

**Быстрые решения и готовые примеры кода**

---

## 🔥 QUICK FIXES (сделать прямо сейчас)

### 1. Откат React до стабильной версии (5 минут)

```bash
# В терминале
npm uninstall react react-dom
npm install react@^18.3.1 react-dom@^18.3.1
npm install

# Проверить
npm list react react-dom
```

### 2. Добавить глобальный Error Boundary (15 минут)

```jsx
// src/components/ErrorBoundary.jsx
import { Component } from 'react';
import { AlertTriangle, RefreshCw } from 'lucide-react';

export class ErrorBoundary extends Component {
  constructor(props) {
    super(props);
    this.state = { 
      hasError: false, 
      error: null,
      errorInfo: null,
    };
  }

  static getDerivedStateFromError(error) {
    return { hasError: true };
  }

  componentDidCatch(error, errorInfo) {
    // Логируем ошибку
    console.error('ErrorBoundary caught:', error, errorInfo);
    
    this.setState({
      error,
      errorInfo,
    });

    // Опционально: отправить в систему мониторинга
    // logErrorToService(error, errorInfo);
  }

  handleReset = () => {
    this.setState({ 
      hasError: false, 
      error: null,
      errorInfo: null,
    });
    window.location.reload();
  };

  render() {
    if (this.state.hasError) {
      return (
        <div className="min-h-screen bg-gray-100 dark:bg-gray-900 flex items-center justify-center p-6">
          <div className="glass-card max-w-2xl w-full p-8">
            <div className="flex items-center gap-4 mb-6">
              <div className="w-16 h-16 rounded-full bg-red-100 dark:bg-red-900/30 flex items-center justify-center">
                <AlertTriangle className="w-8 h-8 text-red-600 dark:text-red-400" />
              </div>
              <div>
                <h1 className="text-2xl font-bold text-red-600 dark:text-red-400">
                  Упс! Что-то пошло не так
                </h1>
                <p className="text-gray-600 dark:text-gray-400">
                  Приложение столкнулось с неожиданной ошибкой
                </p>
              </div>
            </div>

            <div className="bg-gray-50 dark:bg-gray-800 rounded-lg p-4 mb-6">
              <h3 className="font-semibold mb-2">Детали ошибки:</h3>
              <pre className="text-sm text-red-600 dark:text-red-400 overflow-auto">
                {this.state.error?.toString()}
              </pre>
              
              {process.env.NODE_ENV === 'development' && this.state.errorInfo && (
                <details className="mt-4">
                  <summary className="cursor-pointer font-semibold">
                    Stack trace (только для разработки)
                  </summary>
                  <pre className="text-xs mt-2 text-gray-600 dark:text-gray-400 overflow-auto max-h-40">
                    {this.state.errorInfo.componentStack}
                  </pre>
                </details>
              )}
            </div>

            <div className="flex gap-3">
              <button
                onClick={this.handleReset}
                className="btn-primary flex items-center gap-2"
              >
                <RefreshCw size={20} />
                Перезагрузить приложение
              </button>
              
              <button
                onClick={() => {
                  // Очистить localStorage
                  if (confirm('Это очистит все данные. Продолжить?')) {
                    localStorage.clear();
                    window.location.reload();
                  }
                }}
                className="btn-secondary"
              >
                Очистить данные и перезагрузить
              </button>
            </div>
          </div>
        </div>
      );
    }

    return this.props.children;
  }
}
```

```jsx
// src/main.jsx - обернуть App в ErrorBoundary
import { ErrorBoundary } from './components/ErrorBoundary';

ReactDOM.createRoot(document.getElementById('root')).render(
  <React.StrictMode>
    <ErrorBoundary>
      <App />
    </ErrorBoundary>
  </React.StrictMode>
);
```

### 3. Исправить память leaks в таймерах (20 минут)

```javascript
// src/store/useEntriesStore.js - ИСПРАВЛЕННАЯ ВЕРСИЯ

export const useEntriesStore = create(
  persist(
    (set, get) => {
      // ✅ Храним ссылки на таймеры для очистки
      const timers = new Map();

      const scheduleBackup = (actionName = 'backup') => {
        // Очищаем предыдущий таймер для этого действия
        if (timers.has(actionName)) {
          clearTimeout(timers.get(actionName));
        }

        // Создаем новый таймер
        const timerId = setTimeout(async () => {
          try {
            const { entries } = get();
            const { useSettingsStore } = await import('./useSettingsStore');
            const settings = useSettingsStore.getState();
            
            await backupManager.saveBackup({
              entries,
              categories: settings.categories,
              dailyGoal: settings.dailyGoal,
              dailyHours: settings.dailyHours,
              theme: settings.theme,
              timestamp: Date.now()
            });

            // Удаляем таймер после выполнения
            timers.delete(actionName);
          } catch (error) {
            logger.error('❌ Ошибка создания автоматического бэкапа:', error);
          }
        }, 1000);

        // Сохраняем ссылку
        timers.set(actionName, timerId);

        // ✅ Возвращаем функцию очистки
        return () => {
          clearTimeout(timerId);
          timers.delete(actionName);
        };
      };

      // ✅ Функция для очистки всех таймеров (при unmount)
      const cleanupAllTimers = () => {
        timers.forEach(timerId => clearTimeout(timerId));
        timers.clear();
      };

      return {
        entries: [],
        
        addEntry: (entry) => {
          const currentEntries = get().entries;
          useHistoryStore.getState().pushToUndo(currentEntries, 'Добавлена запись');
          
          set((state) => ({
            entries: [...state.entries, { 
              ...entry, 
              id: crypto.randomUUID(),
              createdAt: new Date().toISOString(),
              updatedAt: new Date().toISOString()
            }]
          }));
          
          scheduleBackup('addEntry');
        },

        // ✅ Новый метод для очистки
        cleanup: cleanupAllTimers,
        
        // ... остальные методы
      };
    },
    {
      name: 'time-tracker-entries',
      version: 1,
    }
  )
);
```

```jsx
// src/App.jsx - вызов cleanup при unmount
import { useEffect } from 'react';
import { useEntriesStore } from './store/useEntriesStore';

function App() {
  // ... остальной код

  // ✅ Cleanup при unmount
  useEffect(() => {
    return () => {
      // Очистить все таймеры при размонтировании
      useEntriesStore.getState().cleanup?.();
    };
  }, []);

  // ... остальной код
}
```

### 4. Оптимизировать селекторы (30 минут)

```javascript
// src/hooks/useOptimizedSelectors.js
import { shallow } from 'zustand/shallow';
import { useUIStore } from '../store/useUIStore';
import { useEntriesStore } from '../store/useEntriesStore';
import { useSettingsStore } from '../store/useSettingsStore';

/**
 * Хук для оптимизированного доступа к UI store
 */
export function useUIActions() {
  return useUIStore(
    state => ({
      openModal: state.openModal,
      closeModal: state.closeModal,
      showSuccess: state.showSuccess,
      showError: state.showError,
      showInfo: state.showInfo,
      showWarning: state.showWarning,
    }),
    shallow
  );
}

/**
 * Хук для оптимизированного доступа к modals
 */
export function useModals() {
  return useUIStore(state => state.modals);
}

/**
 * Хук для оптимизированного доступа к entries actions
 */
export function useEntriesActions() {
  return useEntriesStore(
    state => ({
      addEntry: state.addEntry,
      updateEntry: state.updateEntry,
      deleteEntry: state.deleteEntry,
      importEntries: state.importEntries,
      restoreEntries: state.restoreEntries,
    }),
    shallow
  );
}

/**
 * Хук для получения только entries без подписки на действия
 */
export function useEntries() {
  return useEntriesStore(state => state.entries);
}

/**
 * Хук для категорий
 */
export function useCategories() {
  return useSettingsStore(state => state.categories);
}
```

```jsx
// src/App.jsx - ОПТИМИЗИРОВАННАЯ ВЕРСИЯ
import { 
  useUIActions, 
  useModals, 
  useEntriesActions, 
  useEntries 
} from './hooks/useOptimizedSelectors';

function App() {
  // ✅ Оптимизированные селекторы - меньше re-renders
  const modals = useModals();
  const { openModal, closeModal, showSuccess, showError } = useUIActions();
  const { addEntry, updateEntry, deleteEntry, importEntries, restoreEntries } = useEntriesActions();
  const entries = useEntries();
  
  const categories = useCategories();
  
  // ... остальной код
}
```

### 5. Добавить виртуализацию списков (1 час)

```jsx
// src/components/entries/VirtualizedEntriesList.jsx
import { FixedSizeList as List } from 'react-window';
import { useRef, useEffect, useState } from 'react';
import { EntryItem } from './EntryItem';

export function VirtualizedEntriesList({ 
  entries, 
  onEditEntry,
  itemHeight = 120, // Высота одной записи
}) {
  const listRef = useRef(null);
  const [containerHeight, setContainerHeight] = useState(600);

  // Автоматически определяем высоту контейнера
  useEffect(() => {
    const updateHeight = () => {
      const windowHeight = window.innerHeight;
      // Оставляем место для header и footer
      setContainerHeight(windowHeight - 300);
    };

    updateHeight();
    window.addEventListener('resize', updateHeight);
    return () => window.removeEventListener('resize', updateHeight);
  }, []);

  // Render функция для одного элемента
  const Row = ({ index, style }) => {
    const entry = entries[index];
    
    return (
      <div style={style} className="px-2 py-2">
        <EntryItem
          entry={entry}
          onEdit={() => onEditEntry(entry)}
        />
      </div>
    );
  };

  // Если записей мало, отображаем обычный список
  if (entries.length < 20) {
    return (
      <div className="space-y-4">
        {entries.map(entry => (
          <EntryItem
            key={entry.id}
            entry={entry}
            onEdit={() => onEditEntry(entry)}
          />
        ))}
      </div>
    );
  }

  // Для большого количества записей используем виртуализацию
  return (
    <div className="glass-card">
      <List
        ref={listRef}
        height={containerHeight}
        itemCount={entries.length}
        itemSize={itemHeight}
        width="100%"
        className="scrollbar-thin scrollbar-thumb-gray-400 dark:scrollbar-thumb-gray-600"
      >
        {Row}
      </List>

      {/* Информация о количестве */}
      <div className="mt-4 text-center text-sm text-gray-600 dark:text-gray-400">
        Показано {entries.length} записей (виртуализация)
      </div>
    </div>
  );
}
```

```css
/* src/custom.css - добавить стили для scrollbar */

/* Кастомный scrollbar для виртуализированных списков */
.scrollbar-thin {
  scrollbar-width: thin;
}

.scrollbar-thin::-webkit-scrollbar {
  width: 8px;
  height: 8px;
}

.scrollbar-thumb-gray-400::-webkit-scrollbar-thumb {
  background-color: rgb(156, 163, 175);
  border-radius: 4px;
}

.dark .scrollbar-thumb-gray-600::-webkit-scrollbar-thumb {
  background-color: rgb(75, 85, 99);
}

.scrollbar-thin::-webkit-scrollbar-track {
  background-color: transparent;
}
```

---

## ⚡ PERFORMANCE OPTIMIZATIONS (1-2 дня)

### 6. Мемоизация тяжелых вычислений

```javascript
// src/hooks/useOptimizedStatistics.js
import { useMemo } from 'react';
import { useEntries } from './useOptimizedSelectors';

export function useOptimizedStatistics(period = 'all') {
  const entries = useEntries();

  // ✅ Мемоизируем фильтрацию
  const filteredEntries = useMemo(() => {
    if (period === 'all') return entries;

    const now = new Date();
    const startDate = getStartDateForPeriod(period, now);

    return entries.filter(entry => {
      const entryDate = new Date(entry.date);
      return entryDate >= startDate && entryDate <= now;
    });
  }, [entries, period]);

  // ✅ Мемоизируем подсчеты
  const statistics = useMemo(() => {
    const totalHours = filteredEntries.reduce(
      (sum, entry) => sum + parseFloat(entry.duration || 0), 
      0
    );
    
    const totalEarned = filteredEntries.reduce(
      (sum, entry) => sum + parseFloat(entry.earned || 0), 
      0
    );

    const categoriesBreakdown = filteredEntries.reduce((acc, entry) => {
      const category = entry.category || 'uncategorized';
      if (!acc[category]) {
        acc[category] = { hours: 0, earned: 0, count: 0 };
      }
      acc[category].hours += parseFloat(entry.duration || 0);
      acc[category].earned += parseFloat(entry.earned || 0);
      acc[category].count += 1;
      return acc;
    }, {});

    return {
      totalHours: totalHours.toFixed(2),
      totalEarned: totalEarned.toFixed(2),
      averageRate: totalHours > 0 ? (totalEarned / totalHours).toFixed(2) : '0.00',
      entriesCount: filteredEntries.length,
      categoriesBreakdown,
    };
  }, [filteredEntries]);

  return statistics;
}

function getStartDateForPeriod(period, now) {
  switch (period) {
    case 'today':
      return new Date(now.getFullYear(), now.getMonth(), now.getDate());
    case 'week':
      const weekStart = new Date(now);
      weekStart.setDate(now.getDate() - now.getDay());
      return weekStart;
    case 'month':
      return new Date(now.getFullYear(), now.getMonth(), 1);
    case 'year':
      return new Date(now.getFullYear(), 0, 1);
    default:
      return new Date(0); // Все время
  }
}
```

### 7. Дебаунс для поисковых запросов

```javascript
// src/hooks/useDebounce.js
import { useState, useEffect } from 'react';

export function useDebounce(value, delay = 300) {
  const [debouncedValue, setDebouncedValue] = useState(value);

  useEffect(() => {
    const handler = setTimeout(() => {
      setDebouncedValue(value);
    }, delay);

    return () => {
      clearTimeout(handler);
    };
  }, [value, delay]);

  return debouncedValue;
}
```

```jsx
// src/components/entries/EntriesListHeader.jsx
import { useState } from 'react';
import { useDebounce } from '../../hooks/useDebounce';

export function EntriesListHeader({ onSearch }) {
  const [searchTerm, setSearchTerm] = useState('');
  const debouncedSearchTerm = useDebounce(searchTerm, 300);

  // ✅ Поиск выполняется только после 300ms без изменений
  useEffect(() => {
    onSearch(debouncedSearchTerm);
  }, [debouncedSearchTerm, onSearch]);

  return (
    <input
      type="text"
      value={searchTerm}
      onChange={(e) => setSearchTerm(e.target.value)}
      placeholder="Поиск записей..."
      className="input"
    />
  );
}
```

### 8. Lazy loading для тяжелых компонентов

```jsx
// src/App.jsx - добавить lazy loading для других компонентов
import { lazy, Suspense } from 'react';

// ✅ Ленивая загрузка тяжелых компонентов
const AnalyticsSection = lazy(() => import('./components/statistics/AnalyticsSection'));
const EditEntryModal = lazy(() => import('./components/modals/EditEntryModal'));
const ImportModal = lazy(() => import('./components/modals/ImportModal'));
const WorkScheduleModal = lazy(() => import('./components/modals/WorkScheduleModal'));

function App() {
  // ... остальной код

  return (
    <div className="min-h-screen bg-gray-100 dark:bg-gray-900">
      {/* ... Header и StatisticsOverview */}

      {/* ✅ Все модальные окна с Suspense */}
      <Suspense fallback={<div className="loading-spinner" />}>
        <EditEntryModal
          isOpen={modals.editEntry?.isOpen || false}
          onClose={() => closeModal('editEntry')}
          entry={modals.editEntry?.entry}
          onSave={handleSaveEntry}
        />
      </Suspense>

      <Suspense fallback={<div className="loading-spinner" />}>
        <ImportModal
          isOpen={modals.import?.isOpen || false}
          onClose={() => closeModal('import')}
          onImport={handleImport}
        />
      </Suspense>

      {/* ... другие модальные окна */}
    </div>
  );
}
```

---

## 🎨 UI/UX IMPROVEMENTS (2-3 дня)

### 9. Skeleton Loading States

```jsx
// src/components/ui/SkeletonCard.jsx
export function SkeletonCard() {
  return (
    <div className="glass-card animate-pulse">
      <div className="flex items-center gap-4 mb-4">
        <div className="w-12 h-12 rounded-full bg-gray-300 dark:bg-gray-700" />
        <div className="flex-1">
          <div className="h-4 bg-gray-300 dark:bg-gray-700 rounded w-3/4 mb-2" />
          <div className="h-3 bg-gray-300 dark:bg-gray-700 rounded w-1/2" />
        </div>
      </div>
      <div className="space-y-2">
        <div className="h-3 bg-gray-300 dark:bg-gray-700 rounded w-full" />
        <div className="h-3 bg-gray-300 dark:bg-gray-700 rounded w-5/6" />
      </div>
    </div>
  );
}

// Использование
{isLoading ? (
  <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
    {Array.from({ length: 6 }).map((_, i) => (
      <SkeletonCard key={i} />
    ))}
  </div>
) : (
  <EntriesGrid entries={entries} />
)}
```

### 10. Toast Notifications с анимациями

```jsx
// src/components/ui/Toast.jsx
import { X, CheckCircle, AlertCircle, Info, AlertTriangle } from 'lucide-react';
import { useEffect } from 'react';

const iconMap = {
  success: CheckCircle,
  error: AlertCircle,
  info: Info,
  warning: AlertTriangle,
};

const colorMap = {
  success: 'bg-green-500',
  error: 'bg-red-500',
  info: 'bg-blue-500',
  warning: 'bg-yellow-500',
};

export function Toast({ 
  id,
  type = 'info', 
  message, 
  duration = 3000, 
  onClose 
}) {
  const Icon = iconMap[type];
  const color = colorMap[type];

  useEffect(() => {
    if (duration > 0) {
      const timer = setTimeout(() => {
        onClose(id);
      }, duration);
      return () => clearTimeout(timer);
    }
  }, [duration, id, onClose]);

  return (
    <div className="toast-enter animate-slide-in-right">
      <div className="glass-card flex items-start gap-3 p-4 min-w-[300px] max-w-[500px]">
        <div className={`w-10 h-10 rounded-full ${color} flex items-center justify-center flex-shrink-0`}>
          <Icon className="w-5 h-5 text-white" />
        </div>
        
        <div className="flex-1 pt-1">
          <p className="text-sm font-medium text-gray-900 dark:text-gray-100">
            {message}
          </p>
        </div>

        <button
          onClick={() => onClose(id)}
          className="text-gray-400 hover:text-gray-600 dark:hover:text-gray-200 transition"
        >
          <X size={20} />
        </button>
      </div>
    </div>
  );
}
```

```css
/* src/custom.css - добавить анимацию */
@keyframes slideInRight {
  from {
    transform: translateX(100%);
    opacity: 0;
  }
  to {
    transform: translateX(0);
    opacity: 1;
  }
}

.toast-enter {
  animation: slideInRight 0.3s ease-out;
}
```

### 11. Улучшенный календарь с контрастом

```jsx
// src/components/ui/EnhancedCalendar.jsx
import { useMemo } from 'react';
import { format, isSameDay, startOfMonth, endOfMonth, eachDayOfInterval } from 'date-fns';

export function EnhancedCalendar({ entries, selectedDate, onSelectDate }) {
  const currentMonth = selectedDate || new Date();
  
  // Группируем записи по дням
  const entriesByDay = useMemo(() => {
    const grouped = {};
    entries.forEach(entry => {
      const dateKey = format(new Date(entry.date), 'yyyy-MM-dd');
      if (!grouped[dateKey]) {
        grouped[dateKey] = [];
      }
      grouped[dateKey].push(entry);
    });
    return grouped;
  }, [entries]);

  // Генерируем дни месяца
  const days = eachDayOfInterval({
    start: startOfMonth(currentMonth),
    end: endOfMonth(currentMonth),
  });

  return (
    <div className="glass-card p-6">
      <h2 className="text-xl font-bold mb-4">
        {format(currentMonth, 'MMMM yyyy')}
      </h2>

      <div className="grid grid-cols-7 gap-2">
        {/* Заголовки дней недели */}
        {['Пн', 'Вт', 'Ср', 'Чт', 'Пт', 'Сб', 'Вс'].map(day => (
          <div key={day} className="text-center text-sm font-semibold text-gray-600 dark:text-gray-400 py-2">
            {day}
          </div>
        ))}

        {/* Дни месяца */}
        {days.map(day => {
          const dateKey = format(day, 'yyyy-MM-dd');
          const dayEntries = entriesByDay[dateKey] || [];
          const hasEntries = dayEntries.length > 0;
          const isSelected = selectedDate && isSameDay(day, selectedDate);
          const totalHours = dayEntries.reduce((sum, e) => sum + parseFloat(e.duration || 0), 0);

          return (
            <button
              key={dateKey}
              onClick={() => onSelectDate(day)}
              className={`
                relative aspect-square rounded-lg p-2 transition-all
                ${hasEntries 
                  ? 'calendar-day-has-entries hover:scale-105' 
                  : 'calendar-day-empty hover:bg-gray-100 dark:hover:bg-gray-800'
                }
                ${isSelected 
                  ? 'ring-2 ring-blue-500 ring-offset-2 dark:ring-offset-gray-900' 
                  : ''
                }
              `}
            >
              <div className="text-sm font-medium">
                {format(day, 'd')}
              </div>
              
              {hasEntries && (
                <>
                  {/* Индикатор количества записей */}
                  <div className="absolute top-1 right-1 w-5 h-5 rounded-full bg-blue-500 text-white text-xs flex items-center justify-center">
                    {dayEntries.length}
                  </div>
                  
                  {/* Количество часов */}
                  <div className="text-xs text-gray-600 dark:text-gray-400 mt-1">
                    {totalHours.toFixed(1)}ч
                  </div>
                </>
              )}
            </button>
          );
        })}
      </div>
    </div>
  );
}
```

```css
/* src/custom.css - улучшенные стили календаря */

/* Пустой день */
.calendar-day-empty {
  background: rgba(243, 244, 246, 0.2);
  border: 1px dashed rgba(156, 163, 175, 0.2);
}

.dark .calendar-day-empty {
  background: rgba(17, 24, 39, 0.2);
  border: 1px dashed rgba(75, 85, 99, 0.2);
}

/* День с записями */
.calendar-day-has-entries {
  background: linear-gradient(135deg, rgba(59, 130, 246, 0.1) 0%, rgba(16, 185, 129, 0.1) 100%);
  border: 2px solid rgba(59, 130, 246, 0.4);
  font-weight: 600;
}

.dark .calendar-day-has-entries {
  background: linear-gradient(135deg, rgba(59, 130, 246, 0.2) 0%, rgba(16, 185, 129, 0.2) 100%);
  border: 2px solid rgba(59, 130, 246, 0.6);
}

.calendar-day-has-entries:hover {
  border-color: rgba(59, 130, 246, 0.8);
  box-shadow: 0 4px 12px rgba(59, 130, 246, 0.3);
}
```

---

## 🚀 НОВЫЕ ФИЧИ (3-5 дней)

### 12. Система тегов

```javascript
// src/store/useTagsStore.js
import { create } from 'zustand';
import { persist } from 'zustand/middleware';

export const useTagsStore = create(
  persist(
    (set, get) => ({
      tags: [],
      
      addTag: (tag) => {
        const normalizedTag = tag.toLowerCase().trim();
        const exists = get().tags.find(t => t.name === normalizedTag);
        
        if (!exists) {
          set(state => ({
            tags: [...state.tags, {
              id: crypto.randomUUID(),
              name: normalizedTag,
              color: generateRandomColor(),
              createdAt: new Date().toISOString(),
            }]
          }));
        }
      },
      
      removeTag: (tagId) => {
        set(state => ({
          tags: state.tags.filter(t => t.id !== tagId)
        }));
      },
      
      updateTag: (tagId, updates) => {
        set(state => ({
          tags: state.tags.map(t => 
            t.id === tagId ? { ...t, ...updates } : t
          )
        }));
      },
      
      getTagsByIds: (tagIds) => {
        return get().tags.filter(t => tagIds.includes(t.id));
      },
    }),
    {
      name: 'time-tracker-tags',
    }
  )
);

function generateRandomColor() {
  const colors = [
    '#3B82F6', '#10B981', '#F59E0B', '#EF4444', 
    '#8B5CF6', '#EC4899', '#14B8A6', '#F97316'
  ];
  return colors[Math.floor(Math.random() * colors.length)];
}
```

```jsx
// src/components/ui/TagInput.jsx
import { useState } from 'react';
import { X } from 'lucide-react';
import { useTagsStore } from '../../store/useTagsStore';

export function TagInput({ selectedTags = [], onTagsChange }) {
  const [inputValue, setInputValue] = useState('');
  const { tags, addTag, getTagsByIds } = useTagsStore();
  const selectedTagObjects = getTagsByIds(selectedTags);

  const handleAddTag = (tagName) => {
    const normalizedTag = tagName.toLowerCase().trim();
    if (!normalizedTag) return;

    // Найти или создать тег
    let tag = tags.find(t => t.name === normalizedTag);
    if (!tag) {
      addTag(normalizedTag);
      tag = tags.find(t => t.name === normalizedTag);
    }

    // Добавить к выбранным
    if (tag && !selectedTags.includes(tag.id)) {
      onTagsChange([...selectedTags, tag.id]);
    }

    setInputValue('');
  };

  const handleRemoveTag = (tagId) => {
    onTagsChange(selectedTags.filter(id => id !== tagId));
  };

  return (
    <div>
      <label className="block text-sm font-medium mb-2">Теги</label>
      
      {/* Выбранные теги */}
      <div className="flex flex-wrap gap-2 mb-2">
        {selectedTagObjects.map(tag => (
          <span
            key={tag.id}
            className="inline-flex items-center gap-1 px-3 py-1 rounded-full text-sm font-medium"
            style={{
              backgroundColor: `${tag.color}20`,
              color: tag.color,
              border: `1px solid ${tag.color}40`,
            }}
          >
            #{tag.name}
            <button
              onClick={() => handleRemoveTag(tag.id)}
              className="hover:opacity-70"
            >
              <X size={14} />
            </button>
          </span>
        ))}
      </div>

      {/* Поле ввода */}
      <input
        type="text"
        value={inputValue}
        onChange={(e) => setInputValue(e.target.value)}
        onKeyDown={(e) => {
          if (e.key === 'Enter') {
            e.preventDefault();
            handleAddTag(inputValue);
          }
        }}
        placeholder="Добавить тег (нажмите Enter)"
        className="input"
      />

      {/* Предложения существующих тегов */}
      {inputValue && (
        <div className="mt-2 flex flex-wrap gap-2">
          {tags
            .filter(tag => 
              tag.name.includes(inputValue.toLowerCase()) &&
              !selectedTags.includes(tag.id)
            )
            .slice(0, 5)
            .map(tag => (
              <button
                key={tag.id}
                onClick={() => {
                  onTagsChange([...selectedTags, tag.id]);
                  setInputValue('');
                }}
                className="px-2 py-1 text-xs rounded-full bg-gray-100 dark:bg-gray-800 hover:bg-gray-200 dark:hover:bg-gray-700"
                style={{ borderLeft: `3px solid ${tag.color}` }}
              >
                #{tag.name}
              </button>
            ))}
        </div>
      )}
    </div>
  );
}
```

### 13. Экспорт в PDF

```javascript
// src/utils/exportToPDF.js
import jsPDF from 'jspdf';
import 'jspdf-autotable';
import { format } from 'date-fns';

export function exportToPDF(entries, options = {}) {
  const {
    title = 'Time Tracking Report',
    period = { start: null, end: null },
    includeDetails = true,
    includeCharts = false,
  } = options;

  // Создаем документ
  const doc = new jsPDF();
  let yPosition = 20;

  // Заголовок
  doc.setFontSize(24);
  doc.setFont('helvetica', 'bold');
  doc.text(title, 20, yPosition);
  yPosition += 15;

  // Период
  if (period.start && period.end) {
    doc.setFontSize(12);
    doc.setFont('helvetica', 'normal');
    doc.text(
      `Period: ${format(period.start, 'dd.MM.yyyy')} - ${format(period.end, 'dd.MM.yyyy')}`,
      20,
      yPosition
    );
    yPosition += 10;
  }

  // Добавляем линию
  doc.setDrawColor(200, 200, 200);
  doc.line(20, yPosition, 190, yPosition);
  yPosition += 10;

  // Статистика
  const totalHours = entries.reduce((sum, e) => sum + parseFloat(e.duration || 0), 0);
  const totalEarned = entries.reduce((sum, e) => sum + parseFloat(e.earned || 0), 0);
  const avgRate = totalHours > 0 ? totalEarned / totalHours : 0;

  doc.setFontSize(14);
  doc.setFont('helvetica', 'bold');
  doc.text('Summary', 20, yPosition);
  yPosition += 8;

  doc.setFontSize(11);
  doc.setFont('helvetica', 'normal');
  doc.text(`Total Hours: ${totalHours.toFixed(2)}h`, 20, yPosition);
  yPosition += 6;
  doc.text(`Total Earned: $${totalEarned.toFixed(2)}`, 20, yPosition);
  yPosition += 6;
  doc.text(`Average Rate: $${avgRate.toFixed(2)}/h`, 20, yPosition);
  yPosition += 6;
  doc.text(`Number of Entries: ${entries.length}`, 20, yPosition);
  yPosition += 15;

  // Таблица записей
  if (includeDetails) {
    doc.autoTable({
      head: [['Date', 'Category', 'Description', 'Duration', 'Rate', 'Earned']],
      body: entries.map(e => [
        format(new Date(e.date), 'dd.MM.yyyy'),
        e.category || '-',
        (e.description || '-').substring(0, 30),
        `${parseFloat(e.duration || 0).toFixed(2)}h`,
        `$${parseFloat(e.rate || 0).toFixed(2)}`,
        `$${parseFloat(e.earned || 0).toFixed(2)}`,
      ]),
      startY: yPosition,
      styles: {
        fontSize: 9,
        cellPadding: 3,
      },
      headStyles: {
        fillColor: [59, 130, 246],
        textColor: 255,
        fontStyle: 'bold',
      },
      alternateRowStyles: {
        fillColor: [245, 247, 250],
      },
    });

    yPosition = doc.lastAutoTable.finalY + 10;
  }

  // Подвал
  const pageCount = doc.internal.getNumberOfPages();
  for (let i = 1; i <= pageCount; i++) {
    doc.setPage(i);
    doc.setFontSize(10);
    doc.setTextColor(150);
    doc.text(
      `Page ${i} of ${pageCount}`,
      doc.internal.pageSize.width / 2,
      doc.internal.pageSize.height - 10,
      { align: 'center' }
    );
    doc.text(
      `Generated: ${format(new Date(), 'dd.MM.yyyy HH:mm')}`,
      20,
      doc.internal.pageSize.height - 10
    );
  }

  // Сохраняем
  const fileName = `time-tracker-report-${format(new Date(), 'yyyy-MM-dd')}.pdf`;
  doc.save(fileName);

  return { success: true, fileName };
}
```

```jsx
// src/components/entries/ExportButton.jsx
import { FileDown } from 'lucide-react';
import { exportToPDF } from '../../utils/exportToPDF';
import { useEntries } from '../../hooks/useOptimizedSelectors';
import { useUIActions } from '../../hooks/useOptimizedSelectors';

export function ExportButton() {
  const entries = useEntries();
  const { showSuccess, showError } = useUIActions();

  const handleExport = () => {
    try {
      const result = exportToPDF(entries, {
        title: 'Time Tracker Report',
        period: {
          start: new Date(entries[0]?.date),
          end: new Date(entries[entries.length - 1]?.date),
        },
        includeDetails: true,
      });

      if (result.success) {
        showSuccess(`PDF экспортирован: ${result.fileName}`);
      }
    } catch (error) {
      showError('Ошибка экспорта: ' + error.message);
    }
  };

  return (
    <button
      onClick={handleExport}
      className="btn-secondary flex items-center gap-2"
    >
      <FileDown size={20} />
      Экспорт в PDF
    </button>
  );
}
```

---

## 📱 ACCESSIBILITY (1-2 дня)

### 14. Клавиатурная навигация

```jsx
// src/hooks/useKeyboardNavigation.js
import { useState, useEffect, useCallback } from 'react';

export function useKeyboardNavigation(items, options = {}) {
  const {
    onSelect,
    onEdit,
    onDelete,
    loop = true, // Зацикливать навигацию
  } = options;

  const [selectedIndex, setSelectedIndex] = useState(0);
  const [isNavigating, setIsNavigating] = useState(false);

  const handleKeyDown = useCallback((e) => {
    if (!isNavigating || items.length === 0) return;

    switch (e.key) {
      case 'ArrowDown':
        e.preventDefault();
        setSelectedIndex(prev => {
          const next = prev + 1;
          return loop ? next % items.length : Math.min(next, items.length - 1);
        });
        break;

      case 'ArrowUp':
        e.preventDefault();
        setSelectedIndex(prev => {
          const next = prev - 1;
          return loop 
            ? (next < 0 ? items.length - 1 : next)
            : Math.max(next, 0);
        });
        break;

      case 'Enter':
        e.preventDefault();
        if (selectedIndex >= 0 && selectedIndex < items.length) {
          onSelect?.(items[selectedIndex]);
        }
        break;

      case 'e':
        if (e.ctrlKey || e.metaKey) {
          e.preventDefault();
          if (selectedIndex >= 0 && selectedIndex < items.length) {
            onEdit?.(items[selectedIndex]);
          }
        }
        break;

      case 'Delete':
        if (e.shiftKey) {
          e.preventDefault();
          if (selectedIndex >= 0 && selectedIndex < items.length) {
            onDelete?.(items[selectedIndex]);
          }
        }
        break;

      case 'Escape':
        e.preventDefault();
        setIsNavigating(false);
        break;

      default:
        break;
    }
  }, [items, selectedIndex, isNavigating, onSelect, onEdit, onDelete, loop]);

  useEffect(() => {
    if (isNavigating) {
      window.addEventListener('keydown', handleKeyDown);
      return () => window.removeEventListener('keydown', handleKeyDown);
    }
  }, [handleKeyDown, isNavigating]);

  // Активировать навигацию при focus
  const enableNavigation = useCallback(() => {
    setIsNavigating(true);
  }, []);

  const disableNavigation = useCallback(() => {
    setIsNavigating(false);
  }, []);

  return {
    selectedIndex,
    isNavigating,
    enableNavigation,
    disableNavigation,
    setSelectedIndex,
  };
}
```

```jsx
// Использование в EntriesList
export function EntriesList({ entries, onEditEntry }) {
  const {
    selectedIndex,
    isNavigating,
    enableNavigation,
    disableNavigation,
  } = useKeyboardNavigation(entries, {
    onSelect: onEditEntry,
    onEdit: onEditEntry,
    onDelete: (entry) => {
      if (confirm('Удалить запись?')) {
        deleteEntry(entry.id);
      }
    },
  });

  return (
    <div
      tabIndex={0}
      onFocus={enableNavigation}
      onBlur={disableNavigation}
      className="focus:outline-none focus:ring-2 focus:ring-blue-500 rounded-lg"
    >
      {entries.map((entry, index) => (
        <EntryItem
          key={entry.id}
          entry={entry}
          isSelected={isNavigating && index === selectedIndex}
          onEdit={() => onEditEntry(entry)}
        />
      ))}
      
      {isNavigating && (
        <div className="fixed bottom-4 right-4 bg-black text-white px-4 py-2 rounded-lg text-sm">
          <p>Навигация: ↑↓ Enter - выбрать, Ctrl+E - редактировать, Shift+Delete - удалить</p>
        </div>
      )}
    </div>
  );
}
```

### 15. Режим уменьшенного движения

```jsx
// src/components/settings/AccessibilitySettings.jsx
import { useSettingsStore } from '../../store/useSettingsStore';

export function AccessibilitySettings() {
  const { accessibility, updateSettings } = useSettingsStore();

  const handleToggleReduceMotion = (enabled) => {
    updateSettings({
      accessibility: {
        ...accessibility,
        reduceMotion: enabled,
      },
    });

    // Применить класс к body
    if (enabled) {
      document.body.classList.add('reduce-motion');
    } else {
      document.body.classList.remove('reduce-motion');
    }
  };

  return (
    <div className="space-y-4">
      <h3 className="text-lg font-semibold">Доступность</h3>

      <label className="flex items-center gap-3 cursor-pointer">
        <input
          type="checkbox"
          checked={accessibility?.reduceMotion || false}
          onChange={(e) => handleToggleReduceMotion(e.target.checked)}
          className="w-5 h-5 rounded"
        />
        <div>
          <span className="font-medium">Уменьшить движение</span>
          <p className="text-sm text-gray-600 dark:text-gray-400">
            Отключить анимации для лучшей производительности и комфорта
          </p>
        </div>
      </label>

      <label className="flex items-center gap-3 cursor-pointer">
        <input
          type="checkbox"
          checked={accessibility?.highContrast || false}
          onChange={(e) => updateSettings({
            accessibility: {
              ...accessibility,
              highContrast: e.target.checked,
            },
          })}
          className="w-5 h-5 rounded"
        />
        <div>
          <span className="font-medium">Высокий контраст</span>
          <p className="text-sm text-gray-600 dark:text-gray-400">
            Увеличить контрастность для лучшей читаемости
          </p>
        </div>
      </label>

      <div>
        <label className="block font-medium mb-2">Размер шрифта</label>
        <select
          value={accessibility?.fontSize || 'medium'}
          onChange={(e) => updateSettings({
            accessibility: {
              ...accessibility,
              fontSize: e.target.value,
            },
          })}
          className="input"
        >
          <option value="small">Малый</option>
          <option value="medium">Средний</option>
          <option value="large">Большой</option>
        </select>
      </div>
    </div>
  );
}
```

```css
/* src/custom.css - стили для accessibility */

/* Уменьшенное движение */
.reduce-motion *,
.reduce-motion *::before,
.reduce-motion *::after {
  animation-duration: 0.01ms !important;
  animation-iteration-count: 1 !important;
  transition-duration: 0.01ms !important;
  scroll-behavior: auto !important;
}

/* Высокий контраст */
.high-contrast {
  filter: contrast(1.2);
}

.high-contrast .glass-card {
  border-width: 2px;
}

/* Размеры шрифта */
.font-size-small {
  font-size: 14px;
}

.font-size-medium {
  font-size: 16px;
}

.font-size-large {
  font-size: 18px;
}
```

---

## 📦 УСТАНОВКА ЗАВИСИМОСТЕЙ

```bash
# Для PDF экспорта
npm install jspdf jspdf-autotable

# Если хотите добавить TypeScript
npm install -D typescript @types/react @types/react-dom

# Для form validation
npm install zod react-hook-form @hookform/resolvers

# Для date formatting (уже установлен)
# npm install date-fns

# Для виртуализации (уже установлен)
# npm install react-window
```

---

## 🎯 ЧЕКЛИСТ ВНЕДРЕНИЯ

### День 1: Критические исправления
- [ ] Откатить React до 18.3.1
- [ ] Добавить ErrorBoundary
- [ ] Исправить memory leaks в таймерах
- [ ] Оптимизировать Zustand селекторы

### День 2: Performance
- [ ] Добавить виртуализацию списков
- [ ] Мемоизировать тяжелые вычисления
- [ ] Добавить debounce для поиска
- [ ] Lazy loading для модальных окон

### День 3: UI/UX
- [ ] Skeleton loading states
- [ ] Улучшенные toast notifications
- [ ] Исправить контраст календаря
- [ ] Добавить микроанимации

### День 4-5: Новые фичи
- [ ] Система тегов
- [ ] Экспорт в PDF
- [ ] Клавиатурная навигация
- [ ] Настройки доступности

---

**Примечание:** Все примеры кода готовы к копированию и адаптации под ваш проект. При возникновении вопросов - обращайтесь!
