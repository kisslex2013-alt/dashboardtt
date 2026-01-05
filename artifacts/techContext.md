# Технический контекст (Tech Context)

## Frontend стек
- **Библиотека**: React 18+
- **Язык**: TypeScript
- **Сборщик**: Vite 7+
- **Роутинг**: React Router v6
- **Стилизация**: Vanilla CSS с CSS Variables (без Tailwind)
- **Графики**: Recharts
- **Состояние**: Zustand (глобальное), React hooks (локальное)

## Среда разработки
- **Node.js**: LTS версия (рекомендуется 20+).
- **Менеджер пакетов**: npm / yarn / pnpm.
- **Линтинг**: ESLint + Prettier.
- **Тестирование**: Vitest (unit), Playwright (e2e).

## Ключевые зависимости
- `react`, `react-dom` — UI фреймворк
- `vite` — сборка и dev server
- `zustand` — управление состоянием
- `recharts` — графики и визуализации
- `framer-motion` — анимации
- `date-fns` — работа с датами
- `vite-plugin-pwa` — Progressive Web App

## Точки интеграции
- **API**: Локальное хранилище (localStorage), планируется REST/GraphQL.
- **PWA**: Service Worker для offline режима.
- **Web Workers**: Фоновые вычисления (AI-анализ).
