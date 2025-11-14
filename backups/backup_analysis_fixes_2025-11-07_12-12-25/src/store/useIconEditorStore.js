import { create } from 'zustand';
import { persist } from 'zustand/middleware';

/**
 * 🎓 ПОЯСНЕНИЕ ДЛЯ НАЧИНАЮЩИХ:
 * 
 * Это хранилище для режима разработки - позволяет быстро менять иконки
 * на кнопках во время разработки без изменения кода.
 * 
 * Структура замен:
 * {
 *   "button-id-1": "iconify:mdi:heart",
 *   "button-id-2": "Save"
 * }
 * 
 * Где ключ - это уникальный ID компонента/кнопки, а значение - имя иконки.
 */

export const useIconEditorStore = create(
  persist(
    (set, get) => ({
      // Режим редактирования иконок (только в dev режиме)
      isEditMode: false,
      
      // Словарь замен иконок: { componentId: iconName }
      iconReplacements: {},
      
      /**
       * Включает/выключает режим редактирования
       */
      toggleEditMode: () => {
        // Только в dev режиме
        if (import.meta.env.DEV) {
          set((state) => ({
            isEditMode: !state.isEditMode
          }));
        }
      },
      
      /**
       * Устанавливает режим редактирования
       * @param {boolean} enabled - включен ли режим
       */
      setEditMode: (enabled) => {
        if (import.meta.env.DEV) {
          set({ isEditMode: enabled });
        }
      },
      
      /**
       * Заменяет иконку для компонента
       * @param {string} componentId - уникальный ID компонента
       * @param {string} iconName - имя иконки (например, "Save" или "iconify:mdi:heart")
       */
      replaceIcon: (componentId, iconName) => {
        set((state) => ({
          iconReplacements: {
            ...state.iconReplacements,
            [componentId]: iconName
          }
        }));
      },
      
      /**
       * Удаляет замену иконки для компонента
       * @param {string} componentId - уникальный ID компонента
       */
      removeReplacement: (componentId) => {
        set((state) => {
          const newReplacements = { ...state.iconReplacements };
          delete newReplacements[componentId];
          return { iconReplacements: newReplacements };
        });
      },
      
      /**
       * Сбрасывает все замены
       */
      resetAllReplacements: () => {
        set({ iconReplacements: {} });
      },
      
      /**
       * Получает замену иконки для компонента
       * @param {string} componentId - уникальный ID компонента
       * @returns {string|null} имя иконки или null если замены нет
       */
      getIconReplacement: (componentId) => {
        const { iconReplacements } = get();
        return iconReplacements[componentId] || null;
      },
    }),
    {
      name: 'icon-editor-store',
      // Сохраняем только замены, не режим редактирования
      partialize: (state) => ({
        iconReplacements: state.iconReplacements
      })
    }
  )
);

