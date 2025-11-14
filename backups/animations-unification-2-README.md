# Бекап перед второй волной унификации анимаций

**Дата создания:** 2024-11-02

## Зачем этот бекап?

Этот бекап создан перед продолжением унификации анимаций для оставшихся компонентов:
- Notification компоненты
- InsightsPanel
- PlanFactCompactView
- FloatingPanel
- Input/TimeInput (опционально)

## Скопированные файлы

- `src/components/ui/Notification.jsx`
- `src/components/ui/NotificationContainer.jsx`
- `src/components/statistics/InsightsPanel.jsx`
- `src/components/statistics/PlanFactCompactView.jsx`
- `src/components/layout/FloatingPanel.jsx`
- `src/components/ui/Input.jsx`
- `src/components/ui/TimeInput.jsx`

## Как восстановить

1. Найдите нужный бекап по дате в папке `backup/animations-unification-2-YYYYMMDD-HHMMSS/`
2. Скопируйте нужные файлы обратно в соответствующие места проекта
3. Пример: `Copy-Item "backup\animations-unification-2-20241102-120000\Notification.jsx" -Destination "src\components\ui\Notification.jsx"`

## Изменения в этой волне

### Notification компоненты
- Замена `animate-slide-in` на `animate-slide-up` или `animate-fade-in`
- Унификация transition классов

### InsightsPanel
- Замена `animate-slide-in` на `animate-slide-up` с сохранением задержек
- Унификация всех анимаций

### PlanFactCompactView
- Замена `animate-slide-in` на `animate-slide-up` с сохранением задержек
- Унификация всех анимаций

### FloatingPanel
- Замена inline стилей на унифицированные классы (опционально)

### Input/TimeInput
- Добавление `transition-normal` для унификации (опционально)

