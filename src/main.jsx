// ИСПРАВЛЕНО: Явный импорт React первым для гарантии загрузки на Netlify
import React from 'react'
import ReactDOM from 'react-dom/client'
import App from './App.jsx'
import { ErrorBoundary } from './components/ui/ErrorBoundary'
import { Analytics } from '@vercel/analytics/react'
import './index.css'
import './custom.css'
import './styles/animations.css'

// Подавляем предупреждение о React DevTools в development
if (import.meta.env.DEV) {
  const originalConsoleWarn = console.warn
  console.warn = (...args) => {
    if (args[0] && args[0].includes('Download the React DevTools')) {
      return
    }
    originalConsoleWarn.apply(console, args)
  }
}

// ИСПРАВЛЕНО: Глобальный обработчик ошибок для перехвата ошибок импорта и синтаксиса
window.addEventListener(
  'error',
  event => {
    console.error('Глобальная ошибка:', event.error)
    // Показываем ошибку в консоли для разработки
    if (import.meta.env.DEV) {
      const errorDiv = document.createElement('div')
      errorDiv.style.cssText =
        'position:fixed;top:0;left:0;right:0;background:#ef4444;color:white;padding:1rem;z-index:999999;font-family:monospace;font-size:14px;'
      errorDiv.innerHTML = `
      <strong>Ошибка загрузки:</strong> ${event.error?.message || event.message}
      <br><small>Проверьте консоль браузера (F12) для подробностей</small>
      <button onclick="this.parentElement.remove()" style="float:right;margin-left:10px;padding:4px 8px;background:white;color:#ef4444;border:none;border-radius:4px;cursor:pointer;">Закрыть</button>
    `
      document.body.appendChild(errorDiv)
    }
  },
  true
)

// ИСПРАВЛЕНО: Обработчик неперехваченных промисов
window.addEventListener('unhandledrejection', event => {
  console.error('Неперехваченное отклонение промиса:', event.reason)
  if (import.meta.env.DEV) {
    const errorDiv = document.createElement('div')
    errorDiv.style.cssText =
      'position:fixed;top:0;left:0;right:0;background:#ef4444;color:white;padding:1rem;z-index:999999;font-family:monospace;font-size:14px;'
    errorDiv.innerHTML = `
      <strong>Ошибка промиса:</strong> ${event.reason?.message || String(event.reason)}
      <br><small>Проверьте консоль браузера (F12) для подробностей</small>
      <button onclick="this.parentElement.remove()" style="float:right;margin-left:10px;padding:4px 8px;background:white;color:#ef4444;border:none;border-radius:4px;cursor:pointer;">Закрыть</button>
    `
    document.body.appendChild(errorDiv)
  }
})

// ✅ ИСПРАВЛЕНО: StrictMode включен обратно
// Проблема с lazy loading решена путем правильного преобразования named exports
// в default exports через .then() модуль трансформацию

const root = ReactDOM.createRoot(document.getElementById('root'))

// StrictMode помогает обнаруживать проблемы на раннем этапе разработки
root.render(
  <React.StrictMode>
    <ErrorBoundary>
      <App />
    </ErrorBoundary>
    <Analytics />
  </React.StrictMode>
)
