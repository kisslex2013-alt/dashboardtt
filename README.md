# ⏱️ Time Tracker Dashboard

> Современное веб-приложение для учета рабочего времени с AI-аналитикой и визуализацией данных

[![Version](https://img.shields.io/badge/version-1.4_Beta-blue.svg)](https://github.com/kisslex2013-alt/dashboardtt)
[![React](https://img.shields.io/badge/React-18.3.1-61dafb.svg)](https://reactjs.org/)
[![TypeScript](https://img.shields.io/badge/TypeScript-5.9-blue.svg)](https://www.typescriptlang.org/)
[![Vite](https://img.shields.io/badge/Vite-7.1.7-646cff.svg)](https://vitejs.dev/)

## 🌟 Особенности

### ⏱️ Учет времени
- **Таймер в реальном времени** — запуск/остановка с автосохранением
- **Ручной ввод** — время начала и окончания
- **Категории работ** — иконки, цвета, ставки
- **История изменений** — Undo/Redo

### 📊 Аналитика
- **12+ типов графиков** — Recharts визуализация
- **AI-уведомления** — умные рекомендации
- **Предиктивная аналитика** — прогнозы доходов
- **Сравнительная аналитика** — MoM, YoY

### 🎨 Интерфейс
- **Темная/светлая тема** — автопереключение
- **Адаптивный дизайн** — мобильная версия
- **Glassmorphism UI** — современный дизайн
- **Анимации** — Framer Motion

### 🔧 Дополнительно
- **Pomodoro таймер**
- **Звуковые уведомления** — Tone.js
- **Экспорт/Импорт** — JSON
- **Горячие клавиши**
- **Supabase авторизация** — облачная синхронизация

## 🚀 Быстрый старт

```bash
# Клонирование
git clone https://github.com/kisslex2013-alt/dashboardtt.git
cd dashboardtt

# Установка
npm install

# Запуск
npm run dev
```

Откроется на `http://localhost:5173`

## 🛠️ Технологии

| Категория | Технологии |
|-----------|------------|
| **Core** | React 18.3, TypeScript 5.9, Vite 7.1 |
| **State** | Zustand 5.0 |
| **Styling** | Tailwind CSS 3.4, Framer Motion |
| **Charts** | Recharts 3.3 |
| **Backend** | Supabase (auth + sync) |
| **Testing** | Vitest, Playwright |

## 📁 Структура

```
dashboardtt/
├── src/
│   ├── components/     # React компоненты
│   ├── hooks/          # Custom hooks
│   ├── store/          # Zustand stores
│   ├── utils/          # Утилиты
│   └── workers/        # Web Workers
├── public/             # Статика
├── promo/              # Landing pages
└── e2e/                # E2E тесты
```

## ⌨️ Горячие клавиши

| Клавиша | Действие |
|---------|----------|
| `N` / `T` | Новая запись |
| `S` | Старт/Стоп таймера |
| `Ctrl+Z` | Отмена |
| `Ctrl+Y` | Повтор |
| `Ctrl+K` | Командная палитра |

## 🗺️ Roadmap

- [x] TypeScript миграция
- [x] AI-уведомления
- [x] Supabase авторизация
- [ ] PWA (офлайн режим)
- [ ] Персонализируемый дашборд
- [ ] PDF-отчёты для клиентов

## 📄 Лицензия

ISC License

---

Made with ⚡ Vite + ⚛️ React + 🎨 Tailwind CSS
