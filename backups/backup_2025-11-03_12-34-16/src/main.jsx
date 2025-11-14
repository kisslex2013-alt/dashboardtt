import React from 'react'
import ReactDOM from 'react-dom/client'
import App from './App.jsx'
import { ErrorBoundary } from './components/ui/ErrorBoundary'
import './index.css'
import './custom.css'
import './styles/animations.css'

// Подавляем предупреждение о React DevTools в development
if (import.meta.env.DEV) {
  const originalConsoleWarn = console.warn;
  console.warn = (...args) => {
    if (args[0] && args[0].includes('Download the React DevTools')) {
      return;
    }
    originalConsoleWarn.apply(console, args);
  };
}

// ИСПРАВЛЕНО: Глобальный обработчик ошибок для перехвата ошибок импорта и синтаксиса
window.addEventListener('error', (event) => {
  console.error('Глобальная ошибка:', event.error);
  // Показываем ошибку в консоли для разработки
  if (import.meta.env.DEV) {
    const errorDiv = document.createElement('div');
    errorDiv.style.cssText = 'position:fixed;top:0;left:0;right:0;background:#ef4444;color:white;padding:1rem;z-index:999999;font-family:monospace;font-size:14px;';
    errorDiv.innerHTML = `
      <strong>Ошибка загрузки:</strong> ${event.error?.message || event.message}
      <br><small>Проверьте консоль браузера (F12) для подробностей</small>
      <button onclick="this.parentElement.remove()" style="float:right;margin-left:10px;padding:4px 8px;background:white;color:#ef4444;border:none;border-radius:4px;cursor:pointer;">Закрыть</button>
    `;
    document.body.appendChild(errorDiv);
  }
}, true);

// ИСПРАВЛЕНО: Обработчик неперехваченных промисов
window.addEventListener('unhandledrejection', (event) => {
  console.error('Неперехваченное отклонение промиса:', event.reason);
  if (import.meta.env.DEV) {
    const errorDiv = document.createElement('div');
    errorDiv.style.cssText = 'position:fixed;top:0;left:0;right:0;background:#ef4444;color:white;padding:1rem;z-index:999999;font-family:monospace;font-size:14px;';
    errorDiv.innerHTML = `
      <strong>Ошибка промиса:</strong> ${event.reason?.message || String(event.reason)}
      <br><small>Проверьте консоль браузера (F12) для подробностей</small>
      <button onclick="this.parentElement.remove()" style="float:right;margin-left:10px;padding:4px 8px;background:white;color:#ef4444;border:none;border-radius:4px;cursor:pointer;">Закрыть</button>
    `;
    document.body.appendChild(errorDiv);
  }
});

// ⚠️ ВРЕМЕННО: StrictMode отключен из-за конфликта с lazy loading
// Проблема: React.StrictMode в DEV вызывает двойную инициализацию компонентов,
// что приводит к ошибке "Cannot convert object to primitive value" при lazy loading
// когда React пытается преобразовать React элементы (JSX) в строки для предупреждений.
//
// TODO: Вернуть StrictMode после решения проблемы с преобразованием объектов в строки
// Возможные решения:
// 1. Обновить React до версии, где эта проблема исправлена
// 2. Использовать другой подход к lazy loading (динамические импорты)
// 3. Убедиться, что все props безопасно преобразуются в строки

const root = ReactDOM.createRoot(document.getElementById('root'));

// Временно без StrictMode для стабильной работы lazy loading
root.render(
  <ErrorBoundary>
    <App />
  </ErrorBoundary>
);
