import { create } from 'zustand'
import { persist } from 'zustand/middleware'

/**
 * 🎓 ПОЯСНЕНИЕ ДЛЯ НАЧИНАЮЩИХ:
 *
 * Zustand - это библиотека для управления состоянием в React.
 * Она позволяет создавать "хранилища" (stores) где мы можем хранить данные
 * и функции для их изменения.
 *
 * persist - это middleware (промежуточное ПО) которое автоматически
 * сохраняет данные в localStorage браузера.
 *
 * Структура store:
 * - STATE: начальное состояние
 * - CRUD: операции Create, Read, Update, Delete
 * - GETTERS: вычисляемые значения
 */
export const useExampleStore = create(
  persist(
    (set, get) => ({
      // ========== STATE ==========
      /**
       * Список элементов
       */
      items: [],

      /**
       * Фильтр для поиска
       */
      filter: '',

      /**
       * Флаг загрузки
       */
      isLoading: false,

      // ========== CRUD OPERATIONS ==========

      /**
       * Добавить новый элемент
       * @param {Object} item - Элемент для добавления
       * @returns {string} ID созданного элемента
       */
      addItem: item => {
        const newItem = {
          id: Date.now().toString(),
          ...item,
          createdAt: new Date().toISOString(),
        }

        set(state => ({
          items: [...state.items, newItem],
        }))

        return newItem.id
      },

      /**
       * Обновить существующий элемент
       * @param {string} id - ID элемента
       * @param {Object} updates - Обновления
       */
      updateItem: (id, updates) => {
        set(state => ({
          items: state.items.map(item =>
            item.id === id ? { ...item, ...updates, updatedAt: new Date().toISOString() } : item
          ),
        }))
      },

      /**
       * Удалить элемент
       * @param {string} id - ID элемента
       */
      deleteItem: id => {
        set(state => ({
          items: state.items.filter(item => item.id !== id),
        }))
      },

      /**
       * Очистить все элементы
       */
      clearItems: () => {
        set({ items: [] })
      },

      /**
       * Установить фильтр
       * @param {string} filter - Значение фильтра
       */
      setFilter: filter => {
        set({ filter })
      },

      /**
       * Установить флаг загрузки
       * @param {boolean} isLoading - Состояние загрузки
       */
      setIsLoading: isLoading => {
        set({ isLoading })
      },

      // ========== GETTERS ==========

      /**
       * Получить элемент по ID
       * @param {string} id - ID элемента
       * @returns {Object|undefined} Элемент или undefined
       */
      getItemById: id => {
        return get().items.find(item => item.id === id)
      },

      /**
       * Получить отфильтрованные элементы
       * Используется как геттер через useMemo в компонентах
       */
      getFilteredItems: () => {
        const { items, filter } = get()
        if (!filter) return items

        return items.filter(item =>
          Object.values(item).some(value =>
            String(value).toLowerCase().includes(filter.toLowerCase())
          )
        )
      },

      /**
       * Получить количество элементов
       * @returns {number} Количество элементов
       */
      getItemsCount: () => {
        return get().items.length
      },
    }),
    {
      name: 'example-store', // Имя ключа в localStorage
      // Опционально: выбрать что сохранять
      // partialize: (state) => ({ items: state.items }),
    }
  )
)

/**
 * 🎓 ИТОГОВЫЕ ПРАВИЛА ДЛЯ AI:
 *
 * 1. Используй named export (export const useNameStore)
 * 2. ВСЕГДА используй иммутабельные обновления (spread, map, filter)
 * 3. НИКОГДА не изменяй state напрямую (state.items.push - НЕПРАВИЛЬНО!)
 * 4. Группируй по категориям: STATE, CRUD, GETTERS
 * 5. Используй persist для сохранения в localStorage
 * 6. Возвращай полезные значения (id, boolean, count)
 * 7. Документируй все функции в JSDoc
 * 8. Используй обучающие комментарии 🎓
 */
