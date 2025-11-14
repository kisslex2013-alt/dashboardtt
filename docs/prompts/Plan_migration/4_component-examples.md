# 📝 **ПРИМЕРЫ СТРУКТУРЫ КОМПОНЕНТОВ**

Этот файл содержит шаблоны и примеры как должны выглядеть компоненты после миграции.

---

## 🎨 **1. БАЗОВЫЙ UI КОМПОНЕНТ - BUTTON**

### Файл: `src/components/ui/Button.jsx`

```jsx
import React from 'react'

/**
 * Универсальная кнопка с glassmorphism эффектом
 * @param {string} variant - Вариант стиля: 'primary', 'success', 'danger', 'cancel'
 * @param {function} onClick - Обработчик клика
 * @param {boolean} disabled - Отключена ли кнопка
 * @param {ReactNode} children - Содержимое кнопки
 * @param {string} className - Дополнительные CSS классы
 */
export const Button = ({
  variant = 'primary',
  onClick,
  disabled = false,
  children,
  className = '',
}) => {
  const variants = {
    primary: 'text-blue-400 hover:bg-blue-500/10 active:bg-blue-500/20',
    success: 'text-green-400 hover:bg-green-500/10 active:bg-green-500/20',
    danger: 'text-red-400 hover:bg-red-500/10 active:bg-red-500/20',
    cancel: 'text-gray-400 hover:bg-gray-500/10 active:bg-gray-500/20',
  }

  return (
    <button
      onClick={onClick}
      disabled={disabled}
      className={`
        glass-button
        backdrop-blur-md
        bg-white/10 dark:bg-white/5
        border border-white/20
        px-4 py-2
        rounded-lg
        font-medium
        transition-all duration-300
        ${variants[variant]}
        ${disabled ? 'opacity-50 cursor-not-allowed' : 'hover:scale-105 active:scale-95'}
        ${className}
      `}
    >
      {children}
    </button>
  )
}
```

---

## ⏱️ **2. ОСНОВНОЙ КОМПОНЕНТ - TIMER DISPLAY**

### Файл: `src/components/TimerDisplay.jsx`

```jsx
import React from 'react'
import { Play, Pause, Square } from 'lucide-react'
import { Button } from './ui/Button'
import { useTimer } from '../hooks/useTimer'

/**
 * Главный дисплей таймера с кнопками управления
 */
export const TimerDisplay = () => {
  const { isRunning, isPaused, elapsedTime, startTimer, pauseTimer, stopTimer } = useTimer()

  // Форматирование времени в HH:MM:SS
  const formatTime = seconds => {
    const hours = Math.floor(seconds / 3600)
    const minutes = Math.floor((seconds % 3600) / 60)
    const secs = seconds % 60
    return `${hours.toString().padStart(2, '0')}:${minutes.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`
  }

  return (
    <div className="glass-panel backdrop-blur-md bg-white/10 dark:bg-white/5 border border-white/20 rounded-2xl p-8 shadow-xl">
      {/* Дисплей времени */}
      <div className="text-center mb-8">
        <div
          className={`
            text-7xl font-bold tracking-wider
            ${isRunning && !isPaused ? 'text-blue-400 animate-pulse-slow' : 'text-gray-300 dark:text-gray-600'}
            transition-colors duration-300
          `}
        >
          {formatTime(elapsedTime)}
        </div>
        <div className="text-sm text-gray-400 mt-2">
          {isRunning ? (isPaused ? 'На паузе' : 'Активен') : 'Остановлен'}
        </div>
      </div>

      {/* Кнопки управления */}
      <div className="flex justify-center gap-4">
        {!isRunning || isPaused ? (
          <Button variant="success" onClick={startTimer} className="flex items-center gap-2">
            <Play size={20} />
            {isPaused ? 'Продолжить' : 'Старт'}
          </Button>
        ) : (
          <Button variant="primary" onClick={pauseTimer} className="flex items-center gap-2">
            <Pause size={20} />
            Пауза
          </Button>
        )}

        {isRunning && (
          <Button variant="danger" onClick={stopTimer} className="flex items-center gap-2">
            <Square size={20} />
            Стоп
          </Button>
        )}
      </div>
    </div>
  )
}
```

---

## 🎣 **3. КАСТОМНЫЙ ХУК - USE TIMER**

### Файл: `src/hooks/useTimer.js`

```javascript
import { useState, useEffect, useRef } from 'react'
import { useLocalStorage } from './useLocalStorage'
import SoundService from '../services/SoundService'

/**
 * Хук для управления таймером
 * @returns {Object} Состояние и методы управления таймером
 */
export const useTimer = () => {
  const [isRunning, setIsRunning] = useState(false)
  const [isPaused, setIsPaused] = useState(false)
  const [elapsedTime, setElapsedTime] = useState(0)
  const [startTime, setStartTime] = useState(null)
  const [category, setCategory] = useState('Work')
  const [description, setDescription] = useState('')

  const [entries, setEntries] = useLocalStorage('entries', [])
  const intervalRef = useRef(null)

  // Тик таймера каждую секунду
  useEffect(() => {
    if (isRunning && !isPaused) {
      intervalRef.current = setInterval(() => {
        setElapsedTime(prev => prev + 1)
      }, 1000)
    } else {
      if (intervalRef.current) {
        clearInterval(intervalRef.current)
      }
    }

    return () => {
      if (intervalRef.current) {
        clearInterval(intervalRef.current)
      }
    }
  }, [isRunning, isPaused])

  // Запуск таймера
  const startTimer = () => {
    if (!isRunning) {
      // Новый старт
      setStartTime(new Date())
      setElapsedTime(0)
      setIsRunning(true)
      setIsPaused(false)
      SoundService.playStart()
    } else if (isPaused) {
      // Возобновление после паузы
      setIsPaused(false)
      SoundService.playStart()
    }
  }

  // Пауза таймера
  const pauseTimer = () => {
    setIsPaused(true)
    SoundService.playPause()
  }

  // Остановка таймера и сохранение записи
  const stopTimer = () => {
    if (isRunning && elapsedTime > 0) {
      // Создаем новую запись
      const newEntry = {
        id: Date.now(),
        category,
        description,
        duration: elapsedTime,
        startTime,
        endTime: new Date(),
        date: new Date().toISOString().split('T')[0],
      }

      // Сохраняем в записи
      setEntries(prev => [...prev, newEntry])

      // Сброс состояния
      setIsRunning(false)
      setIsPaused(false)
      setElapsedTime(0)
      setStartTime(null)
      setDescription('')

      SoundService.playStop()

      // Показываем уведомление
      console.log('Запись сохранена:', newEntry)
    }
  }

  return {
    isRunning,
    isPaused,
    elapsedTime,
    category,
    description,
    setCategory,
    setDescription,
    startTimer,
    pauseTimer,
    stopTimer,
  }
}
```

---

## 📦 **4. ХРАНИЛИЩЕ - USE LOCAL STORAGE**

### Файл: `src/hooks/useLocalStorage.js`

```javascript
import { useState, useEffect } from 'react'
import BackupManager from '../services/BackupManager'

/**
 * Хук для работы с localStorage с автобэкапом в IndexedDB
 * @param {string} key - Ключ для хранения
 * @param {*} initialValue - Начальное значение
 * @returns {Array} [storedValue, setValue] - Значение и сеттер
 */
export const useLocalStorage = (key, initialValue) => {
  // Функция для получения начального значения
  const getInitialValue = () => {
    try {
      const item = window.localStorage.getItem(key)
      return item ? JSON.parse(item) : initialValue
    } catch (error) {
      console.error(`Error reading localStorage key "${key}":`, error)
      return initialValue
    }
  }

  const [storedValue, setStoredValue] = useState(getInitialValue)

  // Сохранение в localStorage и IndexedDB
  const setValue = value => {
    try {
      // Позволяем value быть функцией как в useState
      const valueToStore = value instanceof Function ? value(storedValue) : value

      // Сохраняем в state
      setStoredValue(valueToStore)

      // Сохраняем в localStorage
      window.localStorage.setItem(key, JSON.stringify(valueToStore))

      // Автобэкап в IndexedDB
      if (key === 'entries' || key === 'categories') {
        BackupManager.createBackup({ [key]: valueToStore })
      }
    } catch (error) {
      console.error(`Error setting localStorage key "${key}":`, error)
    }
  }

  // Синхронизация при изменении в другой вкладке
  useEffect(() => {
    const handleStorageChange = e => {
      if (e.key === key && e.newValue !== null) {
        setStoredValue(JSON.parse(e.newValue))
      }
    }

    window.addEventListener('storage', handleStorageChange)
    return () => window.removeEventListener('storage', handleStorageChange)
  }, [key])

  return [storedValue, setValue]
}
```

---

## 🗂️ **5. СПИСОК ЗАПИСЕЙ**

### Файл: `src/components/EntriesList.jsx`

```jsx
import React, { useState, useMemo } from 'react'
import { Pencil, Trash2, Search } from 'lucide-react'
import { useLocalStorage } from '../hooks/useLocalStorage'
import { Button } from './ui/Button'

/**
 * Компонент списка записей времени с группировкой по дням
 */
export const EntriesList = () => {
  const [entries, setEntries] = useLocalStorage('entries', [])
  const [searchQuery, setSearchQuery] = useState('')
  const [selectedCategory, setSelectedCategory] = useState('all')

  // Фильтрация записей
  const filteredEntries = useMemo(() => {
    return entries.filter(entry => {
      const matchesSearch = entry.description.toLowerCase().includes(searchQuery.toLowerCase())
      const matchesCategory = selectedCategory === 'all' || entry.category === selectedCategory
      return matchesSearch && matchesCategory
    })
  }, [entries, searchQuery, selectedCategory])

  // Группировка по дням
  const groupedEntries = useMemo(() => {
    const groups = {}
    filteredEntries.forEach(entry => {
      const date = entry.date
      if (!groups[date]) {
        groups[date] = []
      }
      groups[date].push(entry)
    })
    return groups
  }, [filteredEntries])

  // Форматирование времени
  const formatDuration = seconds => {
    const hours = Math.floor(seconds / 3600)
    const minutes = Math.floor((seconds % 3600) / 60)
    return `${hours}ч ${minutes}м`
  }

  // Удаление записи
  const handleDelete = id => {
    if (window.confirm('Удалить эту запись?')) {
      setEntries(prev => prev.filter(entry => entry.id !== id))
    }
  }

  // Общая статистика
  const totalTime = useMemo(() => {
    return entries.reduce((sum, entry) => sum + entry.duration, 0)
  }, [entries])

  return (
    <div className="glass-panel backdrop-blur-md bg-white/10 dark:bg-white/5 border border-white/20 rounded-2xl p-6">
      {/* Заголовок и статистика */}
      <div className="mb-6">
        <h2 className="text-2xl font-bold text-gray-800 dark:text-white mb-2">Записи времени</h2>
        <div className="text-sm text-gray-600 dark:text-gray-400">
          Всего записей: {entries.length} | Общее время: {formatDuration(totalTime)}
        </div>
      </div>

      {/* Фильтры */}
      <div className="mb-4 flex gap-4">
        {/* Поиск */}
        <div className="flex-1 relative">
          <Search
            className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400"
            size={20}
          />
          <input
            type="text"
            placeholder="Поиск по описанию..."
            value={searchQuery}
            onChange={e => setSearchQuery(e.target.value)}
            className="w-full pl-10 pr-4 py-2 glass-input backdrop-blur-md bg-white/10 dark:bg-white/5 border border-white/20 rounded-lg focus:ring-2 focus:ring-blue-500"
          />
        </div>

        {/* Фильтр по категориям */}
        <select
          value={selectedCategory}
          onChange={e => setSelectedCategory(e.target.value)}
          className="glass-input backdrop-blur-md bg-white/10 dark:bg-white/5 border border-white/20 rounded-lg px-4 py-2"
        >
          <option value="all">Все категории</option>
          <option value="Work">Работа</option>
          <option value="Study">Учеба</option>
          <option value="Sport">Спорт</option>
          <option value="Rest">Отдых</option>
        </select>
      </div>

      {/* Список записей по дням */}
      <div className="space-y-4">
        {Object.entries(groupedEntries)
          .reverse()
          .map(([date, dayEntries]) => (
            <div key={date}>
              {/* Дата */}
              <div className="text-sm font-semibold text-gray-600 dark:text-gray-400 mb-2">
                {new Date(date).toLocaleDateString('ru-RU', {
                  weekday: 'long',
                  year: 'numeric',
                  month: 'long',
                  day: 'numeric',
                })}
              </div>

              {/* Записи за день */}
              <div className="space-y-2">
                {dayEntries.map(entry => (
                  <div
                    key={entry.id}
                    className="glass-panel backdrop-blur-md bg-white/5 dark:bg-white/3 border border-white/10 rounded-lg p-4 hover:bg-white/10 transition-colors duration-200"
                  >
                    <div className="flex items-center justify-between">
                      {/* Информация о записи */}
                      <div className="flex-1">
                        <div className="flex items-center gap-3 mb-2">
                          {/* Бейдж категории */}
                          <span
                            className={`px-3 py-1 rounded-full text-xs font-medium bg-blue-500/20 text-blue-400`}
                          >
                            {entry.category}
                          </span>
                          {/* Время */}
                          <span className="text-sm font-semibold text-gray-700 dark:text-gray-300">
                            {formatDuration(entry.duration)}
                          </span>
                        </div>
                        {/* Описание */}
                        <div className="text-sm text-gray-600 dark:text-gray-400">
                          {entry.description || 'Без описания'}
                        </div>
                      </div>

                      {/* Действия */}
                      <div className="flex gap-2">
                        <button
                          onClick={() => console.log('Edit', entry.id)}
                          className="p-2 hover:bg-blue-500/10 rounded-lg transition-colors"
                          title="Редактировать"
                        >
                          <Pencil size={18} className="text-blue-400" />
                        </button>
                        <button
                          onClick={() => handleDelete(entry.id)}
                          className="p-2 hover:bg-red-500/10 rounded-lg transition-colors"
                          title="Удалить"
                        >
                          <Trash2 size={18} className="text-red-400" />
                        </button>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          ))}
      </div>

      {/* Пустой список */}
      {filteredEntries.length === 0 && (
        <div className="text-center py-12 text-gray-500 dark:text-gray-400">
          {searchQuery || selectedCategory !== 'all'
            ? 'Записей не найдено'
            : 'Нет записей. Запустите таймер!'}
        </div>
      )}
    </div>
  )
}
```

---

## 🎯 **6. ГЛАВНЫЙ APP КОМПОНЕНТ**

### Файл: `src/App.jsx`

```jsx
import React, { useState } from 'react'
import { TimerDisplay } from './components/TimerDisplay'
import { TimerControls } from './components/TimerControls'
import { EntriesList } from './components/EntriesList'
import { Statistics } from './components/Statistics'
import { HistoryProvider } from './contexts/HistoryContext'
import { Moon, Sun, Settings } from 'lucide-react'

/**
 * Главный компонент приложения
 */
function App() {
  const [isDarkMode, setIsDarkMode] = useState(localStorage.getItem('darkMode') === 'true')

  // Переключение темной темы
  const toggleDarkMode = () => {
    const newMode = !isDarkMode
    setIsDarkMode(newMode)
    localStorage.setItem('darkMode', newMode)
  }

  return (
    <HistoryProvider>
      <div className={isDarkMode ? 'dark' : ''}>
        <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100 dark:from-gray-900 dark:to-gray-800 transition-colors duration-300">
          {/* Header */}
          <header className="backdrop-blur-md bg-white/30 dark:bg-black/30 border-b border-white/20">
            <div className="container mx-auto px-4 py-4 flex items-center justify-between">
              <h1 className="text-2xl font-bold text-gray-800 dark:text-white">⏱️ Time Tracker</h1>

              <div className="flex items-center gap-4">
                {/* Переключатель темы */}
                <button
                  onClick={toggleDarkMode}
                  className="p-2 rounded-lg glass-button backdrop-blur-md bg-white/10 dark:bg-white/5 border border-white/20 hover:bg-white/20 transition-all"
                  title={isDarkMode ? 'Светлая тема' : 'Темная тема'}
                >
                  {isDarkMode ? <Sun size={20} /> : <Moon size={20} />}
                </button>

                {/* Настройки */}
                <button
                  className="p-2 rounded-lg glass-button backdrop-blur-md bg-white/10 dark:bg-white/5 border border-white/20 hover:bg-white/20 transition-all"
                  title="Настройки"
                >
                  <Settings size={20} />
                </button>
              </div>
            </div>
          </header>

          {/* Main Content */}
          <main className="container mx-auto px-4 py-8">
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
              {/* Left Column - Timer */}
              <div className="lg:col-span-2 space-y-6">
                <TimerDisplay />
                <TimerControls />
                <EntriesList />
              </div>

              {/* Right Column - Statistics */}
              <div className="space-y-6">
                <Statistics />
              </div>
            </div>
          </main>

          {/* Footer */}
          <footer className="text-center py-6 text-sm text-gray-600 dark:text-gray-400">
            © 2024 Time Tracker v0.9.0
          </footer>
        </div>
      </div>
    </HistoryProvider>
  )
}

export default App
```

---

## 🔧 **7. СЕРВИС - BACKUP MANAGER**

### Файл: `src/services/BackupManager.js`

```javascript
/**
 * Менеджер резервного копирования в IndexedDB
 */
class BackupManager {
  constructor() {
    this.dbName = 'TimeTrackerBackups'
    this.storeName = 'backups'
    this.db = null
  }

  /**
   * Инициализация IndexedDB
   */
  async init() {
    return new Promise((resolve, reject) => {
      const request = indexedDB.open(this.dbName, 1)

      request.onerror = () => reject(request.error)
      request.onsuccess = () => {
        this.db = request.result
        resolve()
      }

      request.onupgradeneeded = event => {
        const db = event.target.result
        if (!db.objectStoreNames.contains(this.storeName)) {
          db.createObjectStore(this.storeName, { keyPath: 'id', autoIncrement: true })
        }
      }
    })
  }

  /**
   * Создание резервной копии
   * @param {Object} data - Данные для бэкапа
   */
  async createBackup(data) {
    try {
      if (!this.db) await this.init()

      const backup = {
        timestamp: new Date().toISOString(),
        data: data,
      }

      const transaction = this.db.transaction([this.storeName], 'readwrite')
      const store = transaction.objectStore(this.storeName)
      await store.add(backup)

      console.log('Backup created successfully')

      // Очистка старых бэкапов (оставляем только последние 10)
      await this.cleanOldBackups()
    } catch (error) {
      console.error('Error creating backup:', error)
    }
  }

  /**
   * Получение всех бэкапов
   */
  async getAllBackups() {
    try {
      if (!this.db) await this.init()

      return new Promise((resolve, reject) => {
        const transaction = this.db.transaction([this.storeName], 'readonly')
        const store = transaction.objectStore(this.storeName)
        const request = store.getAll()

        request.onsuccess = () => resolve(request.result)
        request.onerror = () => reject(request.error)
      })
    } catch (error) {
      console.error('Error getting backups:', error)
      return []
    }
  }

  /**
   * Восстановление из бэкапа
   * @param {number} backupId - ID бэкапа
   */
  async restoreBackup(backupId) {
    try {
      if (!this.db) await this.init()

      return new Promise((resolve, reject) => {
        const transaction = this.db.transaction([this.storeName], 'readonly')
        const store = transaction.objectStore(this.storeName)
        const request = store.get(backupId)

        request.onsuccess = () => {
          const backup = request.result
          if (backup && backup.data) {
            // Восстанавливаем данные в localStorage
            Object.entries(backup.data).forEach(([key, value]) => {
              localStorage.setItem(key, JSON.stringify(value))
            })
            resolve(backup.data)
          } else {
            reject(new Error('Backup not found'))
          }
        }
        request.onerror = () => reject(request.error)
      })
    } catch (error) {
      console.error('Error restoring backup:', error)
      throw error
    }
  }

  /**
   * Очистка старых бэкапов
   */
  async cleanOldBackups() {
    try {
      const backups = await this.getAllBackups()
      if (backups.length > 10) {
        // Удаляем самые старые бэкапы
        const toDelete = backups.slice(0, backups.length - 10)
        const transaction = this.db.transaction([this.storeName], 'readwrite')
        const store = transaction.objectStore(this.storeName)

        toDelete.forEach(backup => {
          store.delete(backup.id)
        })
      }
    } catch (error) {
      console.error('Error cleaning old backups:', error)
    }
  }
}

export default new BackupManager()
```

---

## 📁 **8. СТРУКТУРА ПАПОК**

```
time-tracker-react/
├── public/
│   ├── favicon.ico
│   └── sounds/          # Звуковые файлы (если нужны)
├── src/
│   ├── components/
│   │   ├── ui/
│   │   │   ├── Button.jsx
│   │   │   ├── Input.jsx
│   │   │   ├── Select.jsx
│   │   │   ├── Modal.jsx
│   │   │   ├── Toast.jsx
│   │   │   ├── Badge.jsx
│   │   │   ├── Card.jsx
│   │   │   └── Icons.jsx
│   │   ├── modals/
│   │   │   ├── AboutModal.jsx
│   │   │   ├── SettingsModal.jsx
│   │   │   ├── WorkScheduleModal.jsx
│   │   │   ├── RecoveryModal.jsx
│   │   │   └── EntryEditModal.jsx
│   │   ├── charts/
│   │   │   ├── TimeLineChart.jsx
│   │   │   ├── CategoryPieChart.jsx
│   │   │   └── ComparisonBarChart.jsx
│   │   ├── Header.jsx
│   │   ├── Footer.jsx
│   │   ├── TimerDisplay.jsx
│   │   ├── TimerControls.jsx
│   │   ├── EntriesList.jsx
│   │   ├── EntryCard.jsx
│   │   ├── CategoryManager.jsx
│   │   ├── CategoryInput.jsx
│   │   ├── Statistics.jsx
│   │   └── FloatingPanel.jsx
│   ├── hooks/
│   │   ├── useLocalStorage.js
│   │   ├── useTimer.js
│   │   ├── useTimerUI.js
│   │   ├── useNotifications.js
│   │   └── useHistory.js
│   ├── contexts/
│   │   ├── HistoryContext.jsx
│   │   └── ThemeContext.jsx
│   ├── services/
│   │   ├── BackupManager.js
│   │   ├── ProtectionService.js
│   │   ├── SoundService.js
│   │   └── StorageService.js
│   ├── utils/
│   │   ├── performance.js
│   │   ├── errorHandler.js
│   │   ├── dom.js
│   │   ├── categories.js
│   │   └── formatters.js
│   ├── constants/
│   │   └── index.js
│   ├── styles/
│   │   ├── glassmorphism.css
│   │   ├── animations.css
│   │   └── responsive.css
│   ├── App.jsx
│   ├── main.jsx
│   └── index.css
├── .env
├── .env.example
├── .gitignore
├── package.json
├── vite.config.js
├── tailwind.config.js
├── postcss.config.js
└── README.md
```

---

## 🎨 **9. GLASSMORPHISM СТИЛИ**

### Файл: `src/styles/glassmorphism.css`

```css
/* Базовые glassmorphism эффекты */
.glass-panel {
  backdrop-filter: blur(12px);
  -webkit-backdrop-filter: blur(12px);
  background: rgba(255, 255, 255, 0.1);
  border: 1px solid rgba(255, 255, 255, 0.2);
  box-shadow: 0 8px 32px 0 rgba(0, 0, 0, 0.1);
}

.dark .glass-panel {
  background: rgba(255, 255, 255, 0.05);
  border: 1px solid rgba(255, 255, 255, 0.1);
}

/* Glassmorphism кнопки */
.glass-button {
  backdrop-filter: blur(12px);
  -webkit-backdrop-filter: blur(12px);
  transition: all 0.3s cubic-bezier(0.4, 0, 0.2, 1);
}

.glass-button:hover {
  transform: translateY(-2px);
  box-shadow: 0 8px 16px rgba(0, 0, 0, 0.15);
}

.glass-button:active {
  transform: translateY(0);
}

/* Glassmorphism инпуты */
.glass-input {
  backdrop-filter: blur(12px);
  -webkit-backdrop-filter: blur(12px);
  background: rgba(255, 255, 255, 0.1);
  border: 1px solid rgba(255, 255, 255, 0.2);
  transition: all 0.3s ease;
}

.glass-input:focus {
  background: rgba(255, 255, 255, 0.15);
  border-color: rgba(59, 130, 246, 0.5);
  outline: none;
  box-shadow: 0 0 0 3px rgba(59, 130, 246, 0.1);
}

.dark .glass-input {
  background: rgba(255, 255, 255, 0.05);
  border: 1px solid rgba(255, 255, 255, 0.1);
}

/* Анимации */
@keyframes fadeIn {
  from {
    opacity: 0;
    transform: translateY(10px);
  }
  to {
    opacity: 1;
    transform: translateY(0);
  }
}

@keyframes pulse-slow {
  0%,
  100% {
    opacity: 1;
  }
  50% {
    opacity: 0.8;
  }
}

.animate-pulse-slow {
  animation: pulse-slow 2s cubic-bezier(0.4, 0, 0.6, 1) infinite;
}

.fade-in {
  animation: fadeIn 0.3s ease-out;
}

/* Scrollbar styling */
::-webkit-scrollbar {
  width: 8px;
  height: 8px;
}

::-webkit-scrollbar-track {
  background: rgba(255, 255, 255, 0.05);
  border-radius: 10px;
}

::-webkit-scrollbar-thumb {
  background: rgba(255, 255, 255, 0.2);
  border-radius: 10px;
  transition: background 0.3s;
}

::-webkit-scrollbar-thumb:hover {
  background: rgba(255, 255, 255, 0.3);
}
```

---

## 📝 **РЕЗЮМЕ**

Эти примеры показывают:

1. ✅ **Правильная структура компонентов** - чистая, модульная
2. ✅ **Использование хуков** - useState, useEffect, useMemo, кастомные хуки
3. ✅ **Glassmorphism стили** - через Tailwind и CSS
4. ✅ **localStorage интеграция** - через кастомный хук
5. ✅ **IndexedDB бэкапы** - через сервис
6. ✅ **Современный React** - функциональные компоненты, хуки
7. ✅ **Type safety** - JSDoc комментарии (можно заменить на TypeScript)
8. ✅ **Оптимизация** - useMemo для дорогих вычислений
9. ✅ **Адаптивность** - Tailwind responsive классы
10. ✅ **Темная тема** - через Tailwind dark: префиксы

Используй эти примеры как шаблоны для всех остальных компонентов! 🚀
