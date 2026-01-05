# Системные паттерны (System Patterns)

## Архитектура
- **Фреймворк**: React 18+ (Functional Components, Hooks).
- **Сборщик**: Vite (быстрый HMR, оптимизированная сборка).
- **Язык**: TypeScript (предпочтительна строгая типизация).
- **Управление состоянием**: Zustand (заменил React Context для глобального состояния).

## Основные паттерны
- **Component Composition**: Использование `children` prop и специализированных контейнеров (например, `ChartContainer`).
- **Custom Hooks**: Инкапсуляция логики (например, `useAnimation`, `useModal`, `useAINotificationMonitor`).
- **Barrel Files**: `index.ts` экспорты для чистых импортов (например, `import { Button } from '@/ui'`).
- **Lazy Loading**: `React.lazy` и `Suspense` для route-based и тяжёлых компонентов.
- **Web Workers**: Тяжёлые вычисления (AI-анализ) выполняются в фоновом потоке.

## Стилизация
- **CSS Стратегия**: Vanilla CSS с CSS Variables (Design Tokens).
- **Анимации**: CSS Transitions + Framer Motion (для сложных жестов).
- **Адаптивность**: Mobile-first media queries, определённые в глобальных tokens.

## Стандарты кода
- **Нейминг**: PascalCase для компонентов, camelCase для функций/переменных.
- **Структура файлов**: Feature-based co-location где возможно, или generic `ui/` для атомов.
- **Обработка ошибок**: Error Boundaries для предотвращения краха UI.
- **Документация**: JSDoc/TSDoc для всех экспортируемых функций.
