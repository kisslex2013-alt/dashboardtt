# 🎯 Интеграция Optimistic UI Updates

## Что такое Optimistic UI?

**Optimistic UI** - это паттерн проектирования пользовательского интерфейса, при котором изменения отображаются **мгновенно**, не дожидаясь ответа от сервера или завершения асинхронной операции.

### Как это работает:

1. **Пользователь выполняет действие** (например, удаляет запись)
2. **UI обновляется немедленно** - запись исчезает из списка
3. **В фоне выполняется асинхронная операция** (удаление из store/API)
4. **Если операция успешна** - всё остается как есть
5. **Если операция провалилась** - UI откатывается к предыдущему состоянию

### Преимущества:

- ✅ **Моментальная обратная связь** - пользователь сразу видит результат
- ✅ **Улучшенное UX** - интерфейс кажется быстрее
- ✅ **Меньше ожидания** - нет задержек на выполнение операций

### Недостатки без правильной реализации:

- ❌ **Рассинхронизация** - UI может показывать устаревшие данные
- ❌ **Сложность отката** - нужно правильно обрабатывать ошибки
- ❌ **Путаница пользователя** - если откат происходит слишком поздно

---

## Текущее состояние в проекте

### ✅ Что уже есть:

1. **Хук `useOptimisticUpdate`** создан в `src/hooks/useOptimisticUpdate.js`
2. Хук предоставляет:
   - `value` - текущее значение (оптимистичное или актуальное)
   - `isPending` - флаг ожидания операции
   - `error` - ошибка, если операция провалилась
   - `update()` - функция для оптимистичного обновления
   - `reset()` - сброс к начальному значению

### ❌ Что отсутствует:

Хук **НЕ интегрирован** ни в один компонент. Он существует, но не используется в приложении.

**Компоненты, которым нужна интеграция:**

1. `EntryItem.tsx` - удаление записи (кнопка Trash2)
2. `EditEntryModal.tsx` - редактирование и удаление записи
3. `BulkActionsPanel.tsx` - массовое удаление записей

---

## 📝 Примеры интеграции

### Пример 1: Optimistic Delete в `EntryItem.tsx`

#### До (текущая реализация):

```tsx
// src/components/entries/EntryItem.tsx
const handleDelete = () => {
  triggerHaptic('error')
  openConfirm({
    title: 'Удалить запись?',
    message: 'Вы уверены, что хотите удалить эту запись?',
    onConfirm: () => {
      triggerHaptic('heavy')
      deleteEntry(entry.id) // ❌ Синхронное удаление - UI ждет завершения
    },
  })
}
```

**Проблема:** Запись исчезает из UI только после завершения `deleteEntry()`. Если операция медленная (например, sync с сервером в будущем), пользователь будет ждать.

---

#### После (с Optimistic UI):

```tsx
// src/components/entries/EntryItem.tsx
import { useOptimisticUpdate } from '../../hooks/useOptimisticUpdate'

export const EntryItem = memo(({ entry, onEdit }) => {
  const deleteEntry = useDeleteEntry()
  const triggerHaptic = useHapticFeedback()
  const { confirmConfig, openConfirm } = useConfirmModal()

  // 🎯 НОВОЕ: Optimistic state для видимости записи
  const {
    value: isVisible,
    isPending: isDeleting,
    error: deleteError,
    update: optimisticDelete,
  } = useOptimisticUpdate(true) // Изначально запись видна

  const handleDelete = () => {
    triggerHaptic('error')
    openConfirm({
      title: 'Удалить запись?',
      message: 'Вы уверены, что хотите удалить эту запись?',
      onConfirm: async () => {
        triggerHaptic('heavy')

        try {
          // 🎯 Optimistic update: сразу скрываем запись
          await optimisticDelete(
            false, // Оптимистичное значение - запись скрыта
            async () => {
              // Фактическое удаление в фоне
              await deleteEntry(entry.id)
              return false // Финальное значение - запись удалена
            }
          )
        } catch (error) {
          // ❌ Если удаление провалилось, запись вернется (автоматически)
          console.error('Ошибка при удалении:', error)
          // Можно показать уведомление пользователю
        }
      },
    })
  }

  // 🎯 Если запись скрыта оптимистично - не рендерим её
  if (!isVisible) {
    return null
  }

  return (
    <div
      className={`glass-effect rounded-lg p-4 transition-all ${
        isDeleting ? 'opacity-50 pointer-events-none' : ''
      }`}
    >
      {/* Остальной код компонента */}
      <button onClick={handleDelete}>
        <Trash2 className="w-4 h-4" />
      </button>

      {/* 🎯 Индикатор удаления */}
      {isDeleting && (
        <div className="absolute inset-0 flex items-center justify-center bg-white/50 dark:bg-black/50">
          <Loader2 className="w-6 h-6 animate-spin" />
        </div>
      )}

      {/* 🎯 Ошибка удаления */}
      {deleteError && (
        <div className="text-red-500 text-xs mt-2">
          Не удалось удалить запись. Попробуйте снова.
        </div>
      )}
    </div>
  )
})
```

**Преимущества:**
- ✅ Запись исчезает **мгновенно** после подтверждения
- ✅ Показывается индикатор загрузки пока выполняется удаление
- ✅ Автоматический откат если операция провалилась
- ✅ Отображение ошибки пользователю

---

### Пример 2: Optimistic Update в `EditEntryModal.tsx`

#### До (текущая реализация):

```tsx
// src/components/modals/EditEntryModal.tsx
const handleSave = useCallback(() => {
  if (!validateForm()) return

  const saveData = {
    // ... подготовка данных
  }

  triggerHaptic('success')
  onSave(saveData) // ❌ Синхронное сохранение
  onClose()
}, [formData, effectiveEntry])
```

**Проблема:** Модальное окно закрывается сразу, но изменения могут не применяться мгновенно в списке.

---

#### После (с Optimistic UI):

```tsx
// src/components/modals/EditEntryModal.tsx
import { useOptimisticUpdate } from '../../hooks/useOptimisticUpdate'

export function EditEntryModal({ isOpen, onClose, entry, onSave }) {
  // ... существующий код ...

  // 🎯 НОВОЕ: Optimistic state для сохранения
  const {
    value: savedData,
    isPending: isSaving,
    error: saveError,
    update: optimisticSave,
  } = useOptimisticUpdate(null)

  const handleSave = useCallback(async () => {
    if (!validateForm()) return

    const saveData = {
      date: formData.date || effectiveEntry?.date || getTodayString(),
      start: formData.start,
      end: formData.end,
      category: formData.category,
      categoryId,
      description: formData.description || '',
      duration: parseFloat(duration),
      earned: earnedValue,
      rate: parseFloat(rate.toFixed(2)),
      isManual: true,
    }

    if (effectiveEntry?.id) {
      saveData.id = String(effectiveEntry.id)
      saveData.createdAt = effectiveEntry.createdAt
      saveData.updatedAt = new Date().toISOString()
    }

    try {
      // 🎯 Optimistic update: сразу показываем изменения
      await optimisticSave(
        saveData, // Оптимистичное значение - новые данные
        async () => {
          // Фактическое сохранение в фоне
          await onSave(saveData)
          return saveData // Финальное значение
        }
      )

      triggerHaptic('success')
      onClose()
    } catch (error) {
      // ❌ Если сохранение провалилось, данные откатятся автоматически
      console.error('Ошибка при сохранении:', error)
      triggerHaptic('error')
      // Не закрываем модальное окно, чтобы пользователь мог попробовать снова
    }
  }, [formData, effectiveEntry, validateForm, onSave, onClose])

  return (
    <BaseModal
      isOpen={isOpen}
      onClose={onClose}
      title={modalTitle}
      footer={
        <EntryFormActions
          onSave={handleSave}
          onClose={onClose}
          onDelete={handleDelete}
          effectiveEntry={effectiveEntry}
          isSaving={isSaving} // 🎯 Передаем статус сохранения
        />
      }
    >
      {/* Форма */}
      <EntryFormFields {...props} disabled={isSaving} />

      {/* 🎯 Индикатор сохранения */}
      {isSaving && (
        <div className="text-blue-500 text-sm flex items-center gap-2">
          <Loader2 className="w-4 h-4 animate-spin" />
          <span>Сохранение...</span>
        </div>
      )}

      {/* 🎯 Ошибка сохранения */}
      {saveError && (
        <div className="text-red-500 text-sm mt-2">
          Не удалось сохранить запись. Проверьте данные и попробуйте снова.
        </div>
      )}
    </BaseModal>
  )
}
```

**Преимущества:**
- ✅ Форма блокируется во время сохранения (предотвращает двойную отправку)
- ✅ Показывается индикатор "Сохранение..."
- ✅ Модальное окно не закрывается при ошибке
- ✅ Автоматический откат данных при ошибке

---

### Пример 3: Optimistic Bulk Delete в `BulkActionsPanel.tsx`

```tsx
// src/components/entries/BulkActionsPanel.tsx
import { useOptimisticUpdate } from '../../hooks/useOptimisticUpdate'

export function BulkActionsPanel({ selectedIds, onClearSelection }) {
  const bulkDeleteEntries = useBulkDeleteEntries()
  const triggerHaptic = useHapticFeedback()

  // 🎯 НОВОЕ: Optimistic state для массового удаления
  const {
    value: deletedIds,
    isPending: isDeleting,
    error: deleteError,
    update: optimisticBulkDelete,
  } = useOptimisticUpdate(new Set())

  const handleBulkDelete = async () => {
    try {
      triggerHaptic('heavy')

      // 🎯 Optimistic update: сразу помечаем записи как удаленные
      await optimisticBulkDelete(
        new Set(selectedIds), // Оптимистично удаляем все выбранные
        async () => {
          // Фактическое удаление в фоне
          await bulkDeleteEntries(selectedIds)
          return new Set(selectedIds)
        }
      )

      onClearSelection()
    } catch (error) {
      console.error('Ошибка массового удаления:', error)
      triggerHaptic('error')
    }
  }

  return (
    <div className="flex gap-2">
      <button
        onClick={handleBulkDelete}
        disabled={isDeleting}
        className="btn-danger"
      >
        {isDeleting ? (
          <>
            <Loader2 className="w-4 h-4 animate-spin" />
            <span>Удаление {selectedIds.length} записей...</span>
          </>
        ) : (
          <>
            <Trash2 className="w-4 h-4" />
            <span>Удалить ({selectedIds.length})</span>
          </>
        )}
      </button>

      {deleteError && (
        <div className="text-red-500 text-sm">
          Не удалось удалить записи. Попробуйте снова.
        </div>
      )}
    </div>
  )
}
```

---

## 🔄 Интеграция с существующим store

Важно учитывать, что текущие функции `deleteEntry`, `updateEntry` **синхронные**. Для полноценной работы Optimistic UI нужно:

### Вариант 1: Обернуть в Promise (простой)

```tsx
const handleDelete = async () => {
  await optimisticDelete(false, async () => {
    // Оборачиваем синхронный вызов в Promise
    return new Promise((resolve) => {
      deleteEntry(entry.id)
      // Даем время на обновление store (setState асинхронен)
      setTimeout(() => resolve(false), 50)
    })
  })
}
```

### Вариант 2: Модифицировать store (сложнее, но правильнее)

Сделать `deleteEntry`, `updateEntry` асинхронными:

```typescript
// src/store/useEntriesStore.ts
deleteEntry: async (id) => {
  const currentEntries = get().entries
  useHistoryStore.getState().pushToUndo(currentEntries, 'Удалена запись')

  const idString = String(id)
  const updatedEntries = currentEntries.filter(e => String(e.id) !== idString)

  // Возвращаем Promise для совместимости с Optimistic UI
  return new Promise((resolve) => {
    set({ entries: updatedEntries }, false, 'deleteEntry')
    scheduleBackup()

    syncManager.broadcastMessage({
      type: SyncMessageType.ENTRY_DELETED,
      payload: { id: idString },
    })

    logger.info(`Запись ${idString} удалена`)
    resolve(true)
  })
},
```

---

## 📊 Сравнение: До и После

| Аспект | До (текущее) | После (с Optimistic UI) |
|--------|-------------|-------------------------|
| **Скорость UI** | Задержка до завершения операции | Мгновенная реакция |
| **UX** | Пользователь ждет | Пользователь видит результат сразу |
| **Обработка ошибок** | Ошибка может быть незаметна | Автоматический откат + уведомление |
| **Сложность кода** | Простой | Немного сложнее (но лучше UX) |
| **Индикация процесса** | Нет | Есть (`isPending`) |

---

## ✅ Рекомендации по внедрению

### Этап 1: Простая интеграция (1-2 часа)
1. Добавить Optimistic UI для удаления в `EntryItem.tsx`
2. Добавить индикаторы загрузки
3. Протестировать на медленном соединении (Chrome DevTools > Network > Slow 3G)

### Этап 2: Полная интеграция (3-4 часа)
1. Добавить Optimistic UI для редактирования в `EditEntryModal.tsx`
2. Добавить Optimistic UI для массового удаления в `BulkActionsPanel.tsx`
3. Модифицировать store для возврата Promise

### Этап 3: Полировка (1-2 часа)
1. Добавить анимации появления/исчезновения
2. Улучшить сообщения об ошибках
3. Добавить тесты для Optimistic UI сценариев

---

## 🧪 Тестирование

### Как протестировать Optimistic UI:

1. **Нормальный сценарий:**
   - Удалить запись → она исчезает мгновенно
   - Редактировать запись → изменения видны сразу

2. **Сценарий с ошибкой:**
   - В `deleteEntry` добавить `throw new Error('Test error')`
   - Удалить запись → она исчезает → возвращается с ошибкой

3. **Медленное соединение:**
   - Chrome DevTools > Network > Slow 3G
   - Удалить запись → видеть индикатор загрузки
   - Запись остается скрытой пока идет удаление

---

## 📚 Дополнительные ресурсы

- [React Query - Optimistic Updates](https://tanstack.com/query/latest/docs/react/guides/optimistic-updates)
- [SWR - Optimistic UI](https://swr.vercel.app/docs/mutation#optimistic-updates)
- [When to Use Optimistic UI](https://www.nngroup.com/articles/optimistic-ui/)

---

## 🎯 Заключение

**Задача 2.3.4** отмечена как "✅ ВЫПОЛНЕНО", но на самом деле:

- ✅ Хук создан и работает
- ❌ Хук НЕ интегрирован в компоненты
- ❌ Optimistic UI НЕ работает в приложении

**Рекомендация:** Обновить статус задачи на "🔄 В ПРОЦЕССЕ" или добавить подзадачу:
- [x] 2.3.4.1 Создать хук useOptimisticUpdate
- [ ] 2.3.4.2 Интегрировать в EntryItem (delete)
- [ ] 2.3.4.3 Интегрировать в EditEntryModal (save)
- [ ] 2.3.4.4 Интегрировать в BulkActionsPanel (bulk delete)
