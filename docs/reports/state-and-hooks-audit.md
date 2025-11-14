## Аудит Zustand и хуков (2025-11-11)

Итоги
- Добавлены атомарные селекторы для сто́ров:
  - useSettingsStore: `useTheme`, `useAnimationsEnabled`, `useCategories`, `useDailyGoal`, `useDailyHours`, `useChartVisibility`, `useChartDisplay`, `useCombinedDynamicsType`, `useCombinedRateType`, `useNotificationsSettings`, `useWorkSchedule`, `usePaymentDates`, а также actions-хуки `useSetTheme`, `useUpdateSettings`, `useUpdateChartVisibility`, `useAddCategory`, `useUpdateCategory`, `useDeleteCategory`.
  - useEntriesStore: `useEntries`, actions `useAddEntry`, `useUpdateEntry`, `useDeleteEntry`, `useClearEntries`, `useImportEntries`.
  - useTimerStore: `useActiveTimer`, `useIsPaused`, `useElapsedTime`, `useTimerEntryId`, и actions/derived `useIsRunning`, `useStartTimer`, `useStopTimer`, `usePauseTimer`, `useResumeTimer`, `useUpdateElapsed`, `useResetTimer`.

Преимущества
- Уменьшение ре-рендеров за счет подписки на узкие срезы состояния.
- Более чистый и предсказуемый контракт для компонентов.

Наблюдения по хукам
- Явных пропусков массивов зависимостей не обнаружено в проверенных файлах (`AboutModal.jsx`, `CustomDatePicker.jsx`, `MonthPicker.jsx`, `useFavicon.js` и др.).
- В `useFavicon.js` используется деструктуризация настроек через `useSettingsStore()` без селектора — это может вызывать лишние ре-рендеры. Рекомендуется заменить на `useNotificationsSettings()`.

Рекомендуемые следующие шаги
1) Переход компонентов с прямого `useSettingsStore()`/`useEntriesStore()` на атомарные селекторы из раздела выше (по мере касаний кода).
2) Проход по хукам с флагом ESLint `react-hooks/exhaustive-deps` включен: поправить зависимости там, где линтер предложит.
3) Для тяжелых списков — добавить `memo`/`useMemo`/`useCallback` и рассмотреть виртуализацию (в проекте часть уже есть).

Статус
- Атомарные селекторы добавлены. Рефакторинг использования — поэтапно при изменениях компонентов.


