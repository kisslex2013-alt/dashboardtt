# 🚀 **ПЕРВЫЙ ПРОМПТ - СКОПИРУЙ И ВСТАВЬ В CURSOR PRO**

**Время выполнения:** 5-10 минут  
**Результат:** Рабочий React проект с Tailwind и всеми зависимостями

---

## 📋 **ПРОМПТ ДЛЯ CURSOR PRO**

Скопируй весь текст ниже и вставь в Cursor Pro:

````
Создай новый React проект с Vite для миграции Time Tracker Dashboard:

ШАГИ:

1. Создай проект и установи зависимости:
   - Выполни: npm create vite@latest time-tracker-react -- --template react
   - Перейди в папку: cd time-tracker-react
   - Установи React: npm install
   - Установи Tailwind: npm install -D tailwindcss postcss autoprefixer
   - Установи библиотеки: npm install recharts tone lucide-react
   - Инициализируй Tailwind: npx tailwindcss init -p

2. Настрой tailwind.config.js:
   module.exports = {
     content: ["./index.html", "./src/**/*.{js,jsx}"],
     darkMode: 'class',
     theme: {
       extend: {
         colors: {
           'project1': '#3b82f6',
           'project2': '#10b981',
           'project3': '#8b5cf6',
           'mix': '#f59e0b'
         },
         animation: {
           'pulse-slow': 'pulse 2s cubic-bezier(0.4, 0, 0.6, 1) infinite',
         }
       }
     },
     plugins: [],
   }

3. Обнови src/index.css:
   @tailwind base;
   @tailwind components;
   @tailwind utilities;

   body {
     margin: 0;
     font-family: 'Inter', -apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif;
   }

4. Создай структуру папок в src/:
   - components/
     - ui/
     - modals/
     - charts/
   - hooks/
   - contexts/
   - services/
   - utils/
   - constants/
   - styles/

5. Создай файл .env в корне проекта:
   VITE_APP_TITLE=Time Tracker Dashboard
   VITE_APP_VERSION=0.9.0
   VITE_PROTECTION_ENABLED=false

6. Создай файл .env.example:
   VITE_APP_TITLE=Time Tracker Dashboard
   VITE_APP_VERSION=0.9.0
   VITE_PROTECTION_ENABLED=false

7. Обнови package.json scripts (добавь если нет):
   "scripts": {
     "dev": "vite",
     "build": "vite build",
     "preview": "vite preview",
     "lint": "eslint . --ext js,jsx"
   }

8. Создай базовый App.jsx:
   import React, { useState } from 'react';

   function App() {
     const [isDark, setIsDark] = useState(true);

     return (
       <div className={isDark ? 'dark' : ''}>
         <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100 dark:from-gray-900 dark:to-gray-800 transition-colors duration-300">
           <div className="container mx-auto px-4 py-8">
             <h1 className="text-4xl font-bold text-gray-800 dark:text-white mb-8">
               ⏱️ Time Tracker Dashboard
             </h1>
             <div className="backdrop-blur-md bg-white/10 dark:bg-white/5 border border-white/20 rounded-2xl p-8">
               <p className="text-gray-700 dark:text-gray-300">
                 Проект успешно инициализирован! ✅
               </p>
               <button
                 onClick={() => setIsDark(!isDark)}
                 className="mt-4 px-4 py-2 backdrop-blur-md bg-white/10 border border-white/20 rounded-lg hover:bg-white/20 transition-all"
               >
                 Переключить тему
               </button>
             </div>
           </div>
         </div>
       </div>
     );
   }

   export default App;

9. Обнови main.jsx:
   import React from 'react'
   import ReactDOM from 'react-dom/client'
   import App from './App.jsx'
   import './index.css'

   ReactDOM.createRoot(document.getElementById('root')).render(
     <React.StrictMode>
       <App />
     </React.StrictMode>,
   )

10. Создай README.md с инструкциями:
    # Time Tracker React

    ## Установка
    ```bash
    npm install
    ```

    ## Запуск
    ```bash
    npm run dev
    ```

    ## Сборка
    ```bash
    npm run build
    ```

    ## Технологии
    - React 18
    - Vite
    - Tailwind CSS
    - Recharts
    - Tone.js
    - Lucide React

11. Запусти проект:
    npm run dev

12. После запуска создай файл PROJECT_INIT_REPORT.md с:
    - Список установленных пакетов
    - Версии
    - Подтверждение что проект запускается
    - URL где открыт проект (обычно http://localhost:5173)

ВАЖНО:
- Убедись что все команды выполнены без ошибок
- Проверь что проект запускается
- Проверь что переключение темы работает
- Проверь что glassmorphism эффект виден на панели
````

---

## ✅ **ПОСЛЕ ВЫПОЛНЕНИЯ ПРОМПТА**

### **У тебя должно быть:**

- ✅ Папка `time-tracker-react` с проектом
- ✅ Все зависимости установлены
- ✅ Tailwind настроен
- ✅ Структура папок создана
- ✅ Проект запущен на localhost
- ✅ Переключение темы работает
- ✅ Glassmorphism эффект виден

### **Проверь в консоли браузера:**

- ❌ Нет ошибок
- ✅ React загружен
- ✅ Стили применяются

---

## 🎯 **ЧТО ДАЛЬШЕ?**

### **ПРОМПТ 2 - Glassmorphism стили (следующий шаг)**

После успешного выполнения Промпта 1, скопируй это в Cursor:

```
Создай файл src/styles/glassmorphism.css с полным набором glassmorphism стилей для Time Tracker:

СОДЕРЖИМОЕ ФАЙЛА:

/* ============================================
   GLASSMORPHISM СТИЛИ ДЛЯ TIME TRACKER
   ============================================ */

/* Базовые панели */
.glass-panel {
  backdrop-filter: blur(12px);
  -webkit-backdrop-filter: blur(12px);
  background: rgba(255, 255, 255, 0.1);
  border: 1px solid rgba(255, 255, 255, 0.2);
  box-shadow: 0 8px 32px 0 rgba(0, 0, 0, 0.1);
  border-radius: 16px;
  transition: all 0.3s cubic-bezier(0.4, 0, 0.2, 1);
}

.dark .glass-panel {
  background: rgba(255, 255, 255, 0.05);
  border: 1px solid rgba(255, 255, 255, 0.1);
}

.glass-panel:hover {
  background: rgba(255, 255, 255, 0.15);
  box-shadow: 0 12px 40px 0 rgba(0, 0, 0, 0.15);
}

.dark .glass-panel:hover {
  background: rgba(255, 255, 255, 0.08);
}

/* Кнопки */
.glass-button {
  backdrop-filter: blur(12px);
  -webkit-backdrop-filter: blur(12px);
  background: rgba(255, 255, 255, 0.1);
  border: 1px solid rgba(255, 255, 255, 0.2);
  transition: all 0.3s cubic-bezier(0.4, 0, 0.2, 1);
  cursor: pointer;
}

.dark .glass-button {
  background: rgba(255, 255, 255, 0.05);
  border: 1px solid rgba(255, 255, 255, 0.1);
}

.glass-button:hover {
  transform: translateY(-2px);
  background: rgba(255, 255, 255, 0.2);
  box-shadow: 0 8px 16px rgba(0, 0, 0, 0.15);
}

.dark .glass-button:hover {
  background: rgba(255, 255, 255, 0.1);
}

.glass-button:active {
  transform: translateY(0);
}

.glass-button:disabled {
  opacity: 0.5;
  cursor: not-allowed;
}

/* Инпуты */
.glass-input {
  backdrop-filter: blur(12px);
  -webkit-backdrop-filter: blur(12px);
  background: rgba(255, 255, 255, 0.1);
  border: 1px solid rgba(255, 255, 255, 0.2);
  transition: all 0.3s ease;
  color: inherit;
}

.dark .glass-input {
  background: rgba(255, 255, 255, 0.05);
  border: 1px solid rgba(255, 255, 255, 0.1);
}

.glass-input:focus {
  outline: none;
  background: rgba(255, 255, 255, 0.15);
  border-color: rgba(59, 130, 246, 0.5);
  box-shadow: 0 0 0 3px rgba(59, 130, 246, 0.1);
}

.dark .glass-input:focus {
  background: rgba(255, 255, 255, 0.08);
}

.glass-input::placeholder {
  color: rgba(156, 163, 175, 0.6);
}

/* Модальные окна */
.glass-modal {
  backdrop-filter: blur(20px);
  -webkit-backdrop-filter: blur(20px);
  background: rgba(255, 255, 255, 0.95);
  border: 1px solid rgba(255, 255, 255, 0.3);
  box-shadow: 0 20px 60px rgba(0, 0, 0, 0.3);
}

.dark .glass-modal {
  background: rgba(17, 24, 39, 0.95);
  border: 1px solid rgba(255, 255, 255, 0.1);
}

/* Backdrop для модалей */
.glass-backdrop {
  backdrop-filter: blur(8px);
  -webkit-backdrop-filter: blur(8px);
  background: rgba(0, 0, 0, 0.5);
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

@keyframes fadeOut {
  from {
    opacity: 1;
    transform: translateY(0);
  }
  to {
    opacity: 0;
    transform: translateY(10px);
  }
}

@keyframes slideIn {
  from {
    transform: translateX(-100%);
    opacity: 0;
  }
  to {
    transform: translateX(0);
    opacity: 1;
  }
}

@keyframes slideOut {
  from {
    transform: translateX(0);
    opacity: 1;
  }
  to {
    transform: translateX(-100%);
    opacity: 0;
  }
}

@keyframes pulse-slow {
  0%, 100% {
    opacity: 1;
  }
  50% {
    opacity: 0.8;
  }
}

/* Utility классы */
.fade-in {
  animation: fadeIn 0.3s ease-out;
}

.fade-out {
  animation: fadeOut 0.3s ease-out;
}

.slide-in {
  animation: slideIn 0.3s ease-out;
}

.slide-out {
  animation: slideOut 0.3s ease-out;
}

.animate-pulse-slow {
  animation: pulse-slow 2s cubic-bezier(0.4, 0, 0.6, 1) infinite;
}

/* Scrollbar стили */
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

.dark ::-webkit-scrollbar-track {
  background: rgba(0, 0, 0, 0.2);
}

.dark ::-webkit-scrollbar-thumb {
  background: rgba(255, 255, 255, 0.1);
}

.dark ::-webkit-scrollbar-thumb:hover {
  background: rgba(255, 255, 255, 0.2);
}

/* Smooth transitions для всех элементов */
* {
  transition-property: background-color, border-color, color, fill, stroke, opacity, box-shadow, transform;
  transition-timing-function: cubic-bezier(0.4, 0, 0.2, 1);
  transition-duration: 150ms;
}

ПОСЛЕ СОЗДАНИЯ:
1. Импортируй в src/main.jsx:
   import './styles/glassmorphism.css'

2. Обнови App.jsx - добавь классы glass-panel и glass-button к элементам

3. Проверь что эффект blur работает

4. Создай STYLES_REPORT.md с:
   - Подтверждение что файл создан
   - Список всех классов
   - Скриншот или описание как выглядит эффект
```

---

## 🎨 **ВИЗУАЛЬНАЯ ПРОВЕРКА**

После выполнения обоих промптов ты должен увидеть:

### **✅ Glassmorphism эффект:**

- Полупрозрачные панели с размытием
- Видно фон сквозь панели
- Плавные переходы
- Тени и бордеры

### **✅ Темная тема:**

- Темный градиент фона
- Белый текст
- Темные glassmorphism панели

### **✅ Светлая тема:**

- Светлый градиент фона
- Темный текст
- Светлые glassmorphism панели

---

## 📞 **ЕСЛИ ЧТО-ТО НЕ РАБОТАЕТ**

### **Проблема: Команды не выполняются**

```
Решение:
1. Убедись что Node.js установлен: node --version
2. Убедись что npm установлен: npm --version
3. Минимальная версия Node: 16+
```

### **Проблема: Glassmorphism не виден**

```
Решение:
1. Проверь что backdrop-filter поддерживается браузером
2. Добавь -webkit-backdrop-filter для Safari
3. Убедись что есть фон под элементом (градиент)
4. Проверь что файл импортирован в main.jsx
```

### **Проблема: Tailwind классы не применяются**

```
Решение:
1. Проверь что в tailwind.config.js правильный content
2. Перезапусти dev сервер: Ctrl+C, потом npm run dev
3. Проверь что в index.css есть @tailwind директивы
```

---

## 🚀 **ГОТОВ НАЧАТЬ?**

1. **Скопируй ПРОМПТ 1** в Cursor Pro
2. Дождись выполнения всех команд
3. Проверь что проект запустился
4. **Скопируй ПРОМПТ 2** в Cursor Pro
5. Проверь glassmorphism эффект
6. **Возвращайся за ПРОМПТОМ 3!**

---

## 📊 **ПРОГРЕСС**

```
[████░░░░░░░░░░░░░░░░] 20% - Инициализация

Выполнено:
✅ Промпт 1: Создание проекта
✅ Промпт 2: Glassmorphism стили

Следующие шаги:
⏳ Промпт 3: useLocalStorage хук
⏳ Промпт 4: Базовый Timer
⏳ Промпт 5: Список записей
```

---

**Время начать! Скопируй Промпт 1 и вперед! 🚀**
