## Рефакторинг: стабильные ключи в списках (React keys)

Дата: 2025-11-11
Цель: Исключить key={index}, обеспечить стабильные ключи для корректного reconciliation и снижения лишних ре-рендеров.

Изменения по файлам
- src/components/statistics/InsightCard.jsx
  - Заменены ключи для примитивов/дат/чисел на значения, основанные на содержимом (`primitive-…`, `date-…`, `number-…`, `textonly-…`).
- src/components/ui/CustomDatePicker.jsx
  - Ключи дней календаря: `yyyy-MM-dd` вместо индекса.
- src/components/charts/TrendsChart.jsx
  - Tooltip: ключи элементов по `dataKey/name+color` вместо индекса.
- src/components/charts/WeekdayAnalysisChart.jsx
  - Tooltip: ключи строк по `dataKey/name` вместо индекса.
- src/components/modals/AboutModal.jsx
  - Changelog: карточки версий по `versionKey`, элементы категорий по содержимому текста.
  - Tech список: по `tech.name`.
  - Блок «Поддержка»: по `bank`, `bank+cardNumber`, `qr-${bank}`, `holder-${bank}-${holder}`.
- src/components/ui/AnimatedFlicker.jsx
  - Ключи букв: `${letter}-${index}`.
- src/components/ui/AnimatedMatrixText.jsx
  - Ключи букв: `${letter}-${index}`.
- src/components/ui/AnimatedCascadeDrop.jsx
  - Ключи букв: `${letter}-${index}`.
- src/components/ui/MonthPicker.jsx
  - Ключи месяцев: `${currentYear}-${index}-${month}`.
- src/components/charts/ForecastChart.jsx
  - Tooltip: ключи строк `${item.name}-${item.color}-${index}`.
- src/components/charts/CategoryDistribution.jsx
  - <Cell />: `cell-${entry.name}-${index}`; легенда: `${item.name}-${item.color}-${index}`.

Почему это важно
- Правило: «никогда не использовать индекс массива как ключ» — предотвращает некорректный перенос состояния дочерних элементов и лишние перерендеры при изменении порядка/вставках.
- Стабильные ключи повышают предсказуемость reconciliation и общий UX.

Проверки
- ESLint: ошибок нет.
- Визуальное поведение компонентов не изменилось.

Рекомендации дальше
- Zustand: экспортировать только атомарные селекторы (кастомные хуки), убедиться, что компоненты подписаны на минимальные срезы стейта.
- Проверка useEffect/useMemo/useCallback зависимостей (экзекютивный проход под react-hooks/exhaustive-deps).
- Микро-оптимизации списков: мемоизация тяжелых элементов и key-стратегии для динамических данных (например, по стабильным id сущностей из стора).

Статус
- Рефакторинг ключей завершен во всех обнаруженных местах проекта на текущий момент.


