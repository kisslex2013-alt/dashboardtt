import { create } from 'zustand';

/**
 * 🎓 ПОЯСНЕНИЕ:
 * History Store для системы Undo/Redo
 * 
 * - undoStack: массив предыдущих состояний (последнее действие - в конце)
 * - redoStack: массив отмененных состояний
 * - maxHistorySize: максимальное количество сохраненных состояний
 */

const MAX_HISTORY_SIZE = 50;

export const useHistoryStore = create((set, get) => ({
  undoStack: [],
  redoStack: [],
  lastActionName: '',

  /**
   * Добавить состояние в стек undo
   * @param {Object} state - Состояние для сохранения (обычно entries)
   * @param {string} actionName - Название действия (например, "Добавлена запись")
   */
  pushToUndo: (state, actionName) => {
    set((current) => {
      const newUndoStack = [...current.undoStack, state];
      
      // Ограничиваем размер стека
      if (newUndoStack.length > MAX_HISTORY_SIZE) {
        newUndoStack.shift(); // Удаляем самый старый элемент
      }

      return {
        undoStack: newUndoStack,
        redoStack: [], // Очищаем redo при новом действии
        lastActionName: actionName,
      };
    });
  },

  /**
   * Отменить последнее действие
   * @returns {Object|null} Предыдущее состояние или null, если нечего отменять
   */
  undo: () => {
    const { undoStack, redoStack } = get();
    
    if (undoStack.length === 0) {
      return null;
    }

    const previousState = undoStack[undoStack.length - 1];
    const newUndoStack = undoStack.slice(0, -1);

    set({
      undoStack: newUndoStack,
      redoStack: [...redoStack, previousState],
    });

    return previousState;
  },

  /**
   * Повторить отмененное действие
   * @returns {Object|null} Следующее состояние или null, если нечего повторять
   */
  redo: () => {
    const { redoStack, undoStack } = get();
    
    if (redoStack.length === 0) {
      return null;
    }

    const nextState = redoStack[redoStack.length - 1];
    const newRedoStack = redoStack.slice(0, -1);

    set({
      redoStack: newRedoStack,
      undoStack: [...undoStack, nextState],
    });

    return nextState;
  },

  /**
   * Проверить, доступна ли отмена
   * @returns {boolean}
   */
  canUndo: () => {
    return get().undoStack.length > 0;
  },

  /**
   * Проверить, доступен ли повтор
   * @returns {boolean}
   */
  canRedo: () => {
    return get().redoStack.length > 0;
  },

  /**
   * Получить название последнего действия
   * @returns {string}
   */
  getLastActionName: () => {
    return get().lastActionName;
  },

  /**
   * Очистить всю историю
   */
  clearHistory: () => {
    set({
      undoStack: [],
      redoStack: [],
      lastActionName: '',
    });
  },
}));

