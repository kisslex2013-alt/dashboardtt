# 🔧 **TROUBLESHOOTING & ТИПИЧНЫЕ ОШИБКИ**

**Версия:** v1.0  
**Дата:** 27.10.2025

---

## 🚨 **КРИТИЧЕСКИЕ ОШИБКИ И РЕШЕНИЯ**

### **1. "Cannot read property of undefined"**

#### **Проблема:**

```javascript
TypeError: Cannot read property 'map' of undefined
```

#### **Причины:**

- Данные из localStorage еще не загрузились
- useLocalStorage возвращает undefined до инициализации
- Асинхронная загрузка данных

#### **Решение:**

```javascript
// ❌ ПЛОХО
const [entries] = useLocalStorage('entries', []);
return entries.map(...) // ОШИБКА если entries undefined

// ✅ ХОРОШО
const [entries] = useLocalStorage('entries', []);
return (entries || []).map(...) // Безопасно

// ✅ ЕЩЕ ЛУЧШЕ
const [entries] = useLocalStorage('entries', []);
if (!entries || !Array.isArray(entries)) return null;
return entries.map(...)
```

---

### **2. Таймер не обновляется / зависает**

#### **Проблема:**

Таймер показывает 00:00:00 или останавливается

#### **Причины:**

- setInterval не очищается
- Зависимости в useEffect неправильные
- State не обновляется

#### **Решение:**

```javascript
// ❌ ПЛОХО
useEffect(() => {
  setInterval(() => {
    setTime(time + 1) // Использует старое значение time!
  }, 1000)
}, []) // Пустые зависимости - плохо!

// ✅ ХОРОШО
useEffect(() => {
  if (!isRunning) return

  const interval = setInterval(() => {
    setTime(prev => prev + 1) // Используем функциональное обновление
  }, 1000)

  return () => clearInterval(interval) // ВАЖНО: очистка!
}, [isRunning]) // Правильные зависимости
```

---

### **3. Glassmorphism эффекты не работают**

#### **Проблема:**

Размытие не применяется, фон прозрачный

#### **Причины:**

- backdrop-filter не поддерживается браузером
- Нет фонового элемента
- Неправильный z-index

#### **Решение:**

```css
/* ❌ ПЛОХО */
.glass {
  backdrop-filter: blur(10px);
  background: transparent;
}

/* ✅ ХОРОШО */
.glass {
  backdrop-filter: blur(10px);
  -webkit-backdrop-filter: blur(10px); /* Safari */
  background: rgba(255, 255, 255, 0.1);
  border: 1px solid rgba(255, 255, 255, 0.2);
}

/* И обязательно нужен фон ДО элемента */
.parent {
  background: linear-gradient(to bottom, #667eea 0%, #764ba2 100%);
}
```

**Проверка поддержки:**

```javascript
const supportsBackdropFilter = CSS.supports('backdrop-filter', 'blur(1px)')
if (!supportsBackdropFilter) {
  // Фолбэк для старых браузеров
  element.style.background = 'rgba(255, 255, 255, 0.9)'
}
```

---

### **4. localStorage quota exceeded**

#### **Проблема:**

```
QuotaExceededError: DOM Exception 22
```

#### **Причины:**

- Слишком много данных (лимит ~5-10MB)
- Не очищаются старые бэкапы
- Большие объекты сохраняются целиком

#### **Решение:**

```javascript
// Проверка размера данных
function getLocalStorageSize() {
  let total = 0
  for (let key in localStorage) {
    if (localStorage.hasOwnProperty(key)) {
      total += localStorage[key].length + key.length
    }
  }
  return (total / 1024).toFixed(2) + ' KB'
}

// Безопасное сохранение
function safeSetItem(key, value) {
  try {
    localStorage.setItem(key, JSON.stringify(value))
  } catch (e) {
    if (e.name === 'QuotaExceededError') {
      console.warn('localStorage full, cleaning old data...')
      // Очистить старые данные
      cleanOldBackups()
      // Попробовать снова
      localStorage.setItem(key, JSON.stringify(value))
    }
  }
}
```

---

### **5. Recharts графики не отображаются**

#### **Проблема:**

Пустая область вместо графика

#### **Причины:**

- Неправильный формат данных
- Нет высоты у контейнера
- dataKey не совпадает с полями в data

#### **Решение:**

```jsx
// ❌ ПЛОХО
<LineChart data={entries}> {/* Неправильный формат */}
  <Line dataKey="time" /> {/* Поле "time" не существует */}
</LineChart>

// ✅ ХОРОШО
const chartData = entries.map(entry => ({
  date: entry.date,
  hours: entry.duration / 3600, // Конвертируем секунды в часы
  category: entry.category
}));

<ResponsiveContainer width="100%" height={300}> {/* ВАЖНО: height! */}
  <LineChart data={chartData}>
    <XAxis dataKey="date" />
    <YAxis />
    <Tooltip />
    <Line
      type="monotone"
      dataKey="hours" {/* Совпадает с полем в chartData */}
      stroke="#3b82f6"
    />
  </LineChart>
</ResponsiveContainer>
```

---

### **6. Tone.js не проигрывает звуки**

#### **Проблема:**

Звуки не слышно или ошибка в консоли

#### **Причины:**

- AudioContext не запущен (нужен user interaction)
- Браузер блокирует autoplay
- Tone.js не инициализирован

#### **Решение:**

```javascript
import * as Tone from 'tone'

// ❌ ПЛОХО
function playSound() {
  const synth = new Tone.Synth().toDestination()
  synth.triggerAttackRelease('C4', '8n') // Не сработает без init!
}

// ✅ ХОРОШО
let audioInitialized = false

async function initAudio() {
  if (!audioInitialized) {
    await Tone.start() // ОБЯЗАТЕЛЬНО после user action!
    audioInitialized = true
  }
}

function playSound() {
  if (!audioInitialized) {
    console.warn('Audio not initialized. Click anywhere to enable sound.')
    return
  }
  const synth = new Tone.Synth().toDestination()
  synth.triggerAttackRelease('C4', '8n')
}

// В компоненте
;<button
  onClick={async () => {
    await initAudio() // Инициализация при первом клике
    startTimer()
  }}
>
  Start
</button>
```

---

### **7. Dark mode мигает при загрузке**

#### **Проблема:**

Страница загружается светлой, потом переключается на темную

#### **Причины:**

- localStorage читается после рендера
- React рендерит компонент до проверки темы

#### **Решение:**

```html
<!-- Добавить в index.html ПЕРЕД React -->
<script>
  // Проверяем тему ДО загрузки React
  if (
    localStorage.getItem('darkMode') === 'true' ||
    (!localStorage.getItem('darkMode') && window.matchMedia('(prefers-color-scheme: dark)').matches)
  ) {
    document.documentElement.classList.add('dark')
  }
</script>
```

```javascript
// В React компоненте
const [isDark, setIsDark] = useState(() => {
  // Функция инициализации - выполняется только раз
  return (
    localStorage.getItem('darkMode') === 'true' ||
    (!localStorage.getItem('darkMode') && window.matchMedia('(prefers-color-scheme: dark)').matches)
  )
})
```

---

### **8. IndexedDB не работает в приватном режиме**

#### **Проблема:**

```
InvalidStateError: An attempt was made to use an object that is not usable
```

#### **Причины:**

- Safari в приватном режиме блокирует IndexedDB
- Некоторые браузеры имеют ограничения

#### **Решение:**

```javascript
async function isIndexedDBAvailable() {
  try {
    const testDB = indexedDB.open('test')
    return new Promise(resolve => {
      testDB.onsuccess = () => {
        testDB.result.close()
        indexedDB.deleteDatabase('test')
        resolve(true)
      }
      testDB.onerror = () => resolve(false)
    })
  } catch {
    return false
  }
}

// Использование
class BackupManager {
  async init() {
    const available = await isIndexedDBAvailable()
    if (!available) {
      console.warn('IndexedDB not available, using localStorage only')
      this.useLocalStorageOnly = true
      return
    }
    // ... обычная инициализация
  }
}
```

---

### **9. useEffect бесконечный цикл**

#### **Проблема:**

Компонент перерендеривается бесконечно, браузер зависает

#### **Причины:**

- Объект/массив в зависимостях создается каждый раз
- setState в useEffect без проверки условий

#### **Решение:**

```javascript
// ❌ ПЛОХО
useEffect(() => {
  const data = { value: 123 } // Новый объект каждый раз!
  if (needsUpdate) {
    setData(data) // Обновляет state
  }
}, [data]) // data меняется -> useEffect -> setState -> data меняется -> ...

// ✅ ХОРОШО
const data = useMemo(() => ({ value: 123 }), []) // Мемоизация

useEffect(() => {
  if (needsUpdate && JSON.stringify(currentData) !== JSON.stringify(data)) {
    setData(data) // Обновляем только если реально изменилось
  }
}, [data, needsUpdate, currentData])

// ✅ ЕЩЕ ЛУЧШЕ - примитивные зависимости
useEffect(() => {
  if (needsUpdate) {
    setData({ value: dataValue }) // dataValue - примитив
  }
}, [needsUpdate, dataValue]) // Примитивы безопасны
```

---

### **10. Modal не закрывается по клику вне**

#### **Проблема:**

Клик на backdrop не закрывает модальное окно

#### **Причины:**

- Event propagation
- Неправильная проверка target

#### **Решение:**

```jsx
// ❌ ПЛОХО
<div onClick={onClose}> {/* Закроется даже при клике ВНУТРИ */}
  <div className="modal-content">
    Content
  </div>
</div>

// ✅ ХОРОШО
<div
  onClick={(e) => {
    if (e.target === e.currentTarget) { // Только если клик на backdrop
      onClose();
    }
  }}
  className="backdrop"
>
  <div
    className="modal-content"
    onClick={(e) => e.stopPropagation()} // Предотвращаем всплытие
  >
    Content
  </div>
</div>

// ✅ САМЫЙ НАДЕЖНЫЙ
const backdropRef = useRef(null);

<div
  ref={backdropRef}
  onClick={(e) => {
    if (e.target === backdropRef.current) {
      onClose();
    }
  }}
>
  <div className="modal-content">
    Content
  </div>
</div>
```

---

## ⚠️ **ПРЕДУПРЕЖДЕНИЯ И ЧАСТЫЕ ОШИБКИ CURSOR PRO**

### **1. Cursor генерирует неполный код**

**Проблема:** Cursor обрывает код на середине или пропускает части

**Решения:**

```
ПРОМПТ:
"Продолжи генерацию кода с того места где остановился"

или

"Допиши функцию [название] полностью"

или

"Создай файл [название] с ПОЛНЫМ кодом, не сокращай"
```

### **2. Cursor не видит контекст**

**Проблема:** Генерирует код без учета других файлов

**Решения:**

- Открой все связанные файлы в редакторе
- Укажи в промпте: "Смотри файл X для контекста"
- Явно опиши зависимости: "Этот компонент использует хук Y из файла Z"

### **3. Cursor меняет стили**

**Проблема:** Генерирует свои стили вместо glassmorphism

**Решения:**

```
ПРОМПТ:
"Используй ТОЛЬКО glassmorphism стили из src/styles/glassmorphism.css:
- backdrop-blur-md
- bg-white/10 dark:bg-white/5
- border border-white/20

НЕ добавляй другие стили!"
```

### **4. Cursor дублирует код**

**Проблема:** Создает несколько версий одного файла

**Решения:**

- Всегда указывай точный путь: `src/components/ui/Button.jsx`
- После генерации проверяй: `ls -la src/components/ui/`
- Удаляй дубликаты сразу

---

## 🐛 **DEBUGGING СОВЕТЫ**

### **React DevTools:**

```bash
# Установи расширение
Chrome: React Developer Tools
Firefox: React Developer Tools

# Используй для:
- Просмотра пропсов компонентов
- Проверки состояния (state)
- Отслеживания ререндеров
- Profiling производительности
```

### **Console debugging:**

```javascript
// Временные логи
console.log('🔍 Entries:', entries)
console.log('⏱️ Timer state:', { isRunning, elapsedTime })

// С группировкой
console.group('Timer Debug')
console.log('Running:', isRunning)
console.log('Time:', elapsedTime)
console.log('Category:', category)
console.groupEnd()

// С трейсом
console.trace('How did we get here?')
```

### **Breakpoints:**

```javascript
// В браузере: Sources -> Найди файл -> Клик на номер строки

// В коде (temporary)
debugger // Остановится здесь если открыты DevTools
```

### **Performance monitoring:**

```javascript
// Измерение времени
console.time('Render time')
// ... код ...
console.timeEnd('Render time')

// React Profiler
import { Profiler } from 'react'
;<Profiler
  id="Timer"
  onRender={(id, phase, actualDuration) => {
    console.log(`${id} took ${actualDuration}ms`)
  }}
>
  <Timer />
</Profiler>
```

---

## 🔍 **VALIDATION CHECKLIST**

После каждого большого изменения проверяй:

```
□ npm run build - проект компилируется
□ Нет ошибок в консоли браузера
□ Нет warning'ов о ключах/пропсах
□ localStorage сохраняет данные
□ Перезагрузка страницы сохраняет состояние
□ Темная тема переключается
□ Все кнопки кликабельны
□ Все инпуты работают
□ Звуки проигрываются (если включены)
□ Графики отображаются
□ Модальные окна открываются/закрываются
□ Нет утечек памяти (проверь Memory в DevTools)
```

---

## 💡 **PRO TIPS**

### **1. Hot Module Replacement (HMR)**

Vite автоматически перезагружает изменения. Если не работает:

```javascript
// vite.config.js
export default {
  server: {
    hmr: {
      overlay: true, // Показывать ошибки на экране
    },
  },
}
```

### **2. Error Boundaries**

Оборачивай критичные компоненты:

```jsx
class ErrorBoundary extends React.Component {
  state = { hasError: false }

  static getDerivedStateFromError(error) {
    return { hasError: true }
  }

  componentDidCatch(error, info) {
    console.error('Error caught:', error, info)
  }

  render() {
    if (this.state.hasError) {
      return <h1>Что-то пошло не так.</h1>
    }
    return this.props.children
  }
}

// Использование
;<ErrorBoundary>
  <Statistics />
</ErrorBoundary>
```

### **3. Strict Mode помогает найти баги**

```jsx
// main.jsx
<React.StrictMode>
  <App />
</React.StrictMode>
```

Отключи если мешает development, но включи перед production!

---

## 🆘 **КОГДА ВСЕ СЛОМАЛОСЬ**

### **Nuclear Option - чистая переустановка:**

```bash
# Удали все
rm -rf node_modules
rm package-lock.json

# Переустанови
npm install

# Если все еще не работает
npm cache clean --force
rm -rf node_modules package-lock.json
npm install
```

### **Git спасает:**

```bash
# Если еще не сделал commit
git status
git diff # Посмотри что изменилось
git checkout -- file.jsx # Отменить изменения файла

# Вернуться к последнему рабочему состоянию
git log --oneline # Найди нужный commit
git reset --hard abc123 # Вернись к нему
```

---

**Используй этот файл как справочник когда что-то не работает!** 🔧
