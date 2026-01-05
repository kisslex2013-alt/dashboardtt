import { create } from 'zustand'
import { persist, PersistOptions } from 'zustand/middleware'
import { getDefaultIconSettings } from '../constants/defaultIconSettings'
import { logger } from '../utils/logger'

/**
 * 🎨 Хранилище для режима редактирования иконок (только в dev режиме)
 *
 * 🎓 ПОЯСНЕНИЕ ДЛЯ НАЧИНАЮЩИХ:
 *
 * Это хранилище используется только в режиме разработки (dev).
 * Позволяет быстро менять иконки на кнопках во время разработки без изменения кода.
 *
 * Структура замен:
 * {
 *   "button-id-1": "iconify:mdi:heart",
 *   "button-id-2": "Save"
 * }
 *
 * Где ключ - это уникальный ID компонента/кнопки (например, "edit-entry-save"),
 * а значение - имя иконки (например, "Save" для Lucide или "iconify:mdi:heart" для Iconify).
 *
 * Сохраняется в localStorage для удобства разработки.
 *
 * В production режиме все функции игнорируются.
 *
 * При первом запуске или если в localStorage нет данных, загружаются дефолтные значения
 * из constants/defaultIconSettings.js
 */

/** Словарь замен (componentId -> value) */
type ReplacementMap = Record<string, string>

/** Интерфейс состояния IconEditor store */
interface IconEditorState {
  // State
  isEditMode: boolean
  iconReplacements: ReplacementMap
  buttonColorReplacements: ReplacementMap

  // Actions
  toggleEditMode: () => void
  setEditMode: (enabled: boolean) => void
  replaceIcon: (componentId: string, iconName: string) => void
  removeReplacement: (componentId: string) => void
  resetAllReplacements: () => void
  getIconReplacement: (componentId: string) => string | null
  replaceButtonColor: (componentId: string, color: string) => void
  removeColorReplacement: (componentId: string) => void
  getButtonColor: (componentId: string) => string | null
  saveAsDefaults: () => boolean
}

/** Тип для persisted state */
type PersistedIconEditorState = Pick<IconEditorState, 'iconReplacements' | 'buttonColorReplacements'>

// Получаем дефолтные настройки для инициализации
const defaultSettings = getDefaultIconSettings()

export const useIconEditorStore = create<IconEditorState>()(

  persist(
    (set, get) => ({
      // Режим редактирования иконок (только в dev режиме)
      isEditMode: false,

      // Словарь замен иконок: { componentId: iconName }
      // Инициализируем дефолтными значениями
      iconReplacements: defaultSettings.iconReplacements,

      // Словарь замен цветов кнопок: { componentId: color }
      // color может быть hex (#3B82F6) или Tailwind класс (blue-500)
      // Инициализируем дефолтными значениями
      buttonColorReplacements: defaultSettings.buttonColorReplacements,

      /**
       * Включает/выключает режим редактирования
       * Примечание: Редактирование иконок работает только в dev режиме,
       * но сами замены иконок и цветов применяются и в production (из localStorage)
       */
      toggleEditMode: () => {
        // Только в dev режиме
        if ((import.meta as { env?: { DEV?: boolean } }).env?.DEV) {
          set(state => ({
            isEditMode: !state.isEditMode,
          }))
        }
      },

      /**
       * Устанавливает режим редактирования
       * @param {boolean} enabled - включен ли режим
       * Примечание: Редактирование иконок работает только в dev режиме,
       * но сами замены иконок и цветов применяются и в production (из localStorage)
       */
      setEditMode: enabled => {
        if ((import.meta as { env?: { DEV?: boolean } }).env?.DEV) {
          set({ isEditMode: enabled })
        }
      },

      /**
       * Заменяет иконку для компонента
       * @param {string} componentId - уникальный ID компонента
       * @param {string} iconName - имя иконки (например, "Save" или "iconify:mdi:heart")
       */
      replaceIcon: (componentId, iconName) => {
        set(state => {
          const newState = {
            iconReplacements: {
              ...state.iconReplacements,
              [componentId]: iconName,
            },
          }

          // Автоматическое сохранение убрано - теперь только через кнопку "Сохранить как дефолт"

          return newState
        })
      },

      /**
       * Удаляет замену иконки для компонента
       * @param {string} componentId - уникальный ID компонента
       */
      removeReplacement: componentId => {
        set(state => {
          const newReplacements = { ...state.iconReplacements }
          delete newReplacements[componentId]
          return { iconReplacements: newReplacements }
        })
      },

      /**
       * Сбрасывает все замены (иконки и цвета)
       */
      resetAllReplacements: () => {
        set({
          iconReplacements: {},
          buttonColorReplacements: {},
        })
      },

      /**
       * Получает замену иконки для компонента
       * @param {string} componentId - уникальный ID компонента
       * @returns {string|null} имя иконки или null если замены нет
       */
      getIconReplacement: componentId => {
        const { iconReplacements } = get()
        const replacement = iconReplacements[componentId] || null
        logger.log(
          '[useIconEditorStore] getIconReplacement для',
          componentId,
          ':',
          replacement,
          'всего замен:',
          Object.keys(iconReplacements).length
        )
        return replacement
      },

      /**
       * Заменяет цвет кнопки для компонента
       * @param {string} componentId - уникальный ID компонента
       * @param {string} color - цвет (hex #3B82F6 или Tailwind класс blue-500)
       */
      replaceButtonColor: (componentId, color) => {
        set(state => {
          const newState = {
            buttonColorReplacements: {
              ...state.buttonColorReplacements,
              [componentId]: color,
            },
          }

          // Автоматическое сохранение убрано - теперь только через кнопку "Сохранить как дефолт"

          return newState
        })
      },

      /**
       * Удаляет замену цвета для компонента
       * @param {string} componentId - уникальный ID компонента
       */
      removeColorReplacement: componentId => {
        set(state => {
          const newReplacements = { ...state.buttonColorReplacements }
          delete newReplacements[componentId]
          return { buttonColorReplacements: newReplacements }
        })
      },

      /**
       * Получает замену цвета для компонента
       * @param {string} componentId - уникальный ID компонента
       * @returns {string|null} цвет или null если замены нет
       */
      getButtonColor: componentId => {
        const { buttonColorReplacements } = get()
        const color = buttonColorReplacements[componentId] || null
        logger.log(
          '[useIconEditorStore] getButtonColor для',
          componentId,
          ':',
          color,
          'всего цветов:',
          Object.keys(buttonColorReplacements).length
        )
        return color
      },

      /**
       * Сохраняет все текущие значения иконок и цветов как дефолтные
       * Аналогично saveAsDefaults для столбцов
       * @returns {boolean} true если успешно, false если ошибка
       */
      saveAsDefaults: () => {
        try {
          const { iconReplacements, buttonColorReplacements } = get()

          // Обновляем дефолтные значения в коде (только в dev режиме)
          if ((import.meta as { env?: { DEV?: boolean } }).env?.DEV) {
            fetch('/api/update-icon-defaults', {
              method: 'POST',
              headers: {
                'Content-Type': 'application/json',
              },
              body: JSON.stringify({
                iconReplacements,
                buttonColorReplacements,
              }),
            })
              .then(response => response.json())
              .then(data => {
                if (data.success) {
                  logger.log('✅ Дефолтные значения иконок и цветов обновлены в коде')
                } else {
                  logger.warn('⚠️ Не удалось обновить дефолтные значения:', data.message)
                }
              })
              .catch(error => {
                logger.warn('⚠️ Ошибка обновления дефолтных значений:', error)
              })
          }

          return true
        } catch (error) {
          logger.error('Ошибка сохранения дефолтных настроек:', error)
          return false
        }
      },
    }),
    {
      name: 'icon-editor-store',
      // Сохраняем только замены, не режим редактирования
      partialize: state => ({
        iconReplacements: state.iconReplacements,
        buttonColorReplacements: state.buttonColorReplacements,
      }),
      // Объединяем данные из localStorage с дефолтными значениями
      // В production всегда используем дефолтные значения из файла (игнорируя localStorage)
      // В dev режиме: если localStorage пустой или отсутствует - используем дефолтные значения из файла
      merge: (persistedState, currentState) => {
        const persisted = persistedState as PersistedIconEditorState | undefined
        const defaults = getDefaultIconSettings()

        // В production всегда используем дефолтные значения из файла
        if (typeof import.meta !== 'undefined' && !(import.meta as { env?: { DEV?: boolean } }).env?.DEV) {
          logger.log(
            '[useIconEditorStore] Production режим: используются дефолтные значения из файла'
          )
          logger.log(
            '[useIconEditorStore] Дефолтные иконки:',
            Object.keys(defaults.iconReplacements).length,
            'шт'
          )
          logger.log(
            '[useIconEditorStore] Дефолтные цвета:',
            Object.keys(defaults.buttonColorReplacements).length,
            'шт'
          )
          logger.log('[useIconEditorStore] Примеры иконок:', {
            'header-select': defaults.iconReplacements['header-select'],
            'header-add-new': defaults.iconReplacements['header-add-new'],
            'header-timer-start': defaults.iconReplacements['header-timer-start'],
          })
          logger.log('[useIconEditorStore] Примеры цветов:', {
            'header-select': defaults.buttonColorReplacements['header-select'],
            'header-add-new': defaults.buttonColorReplacements['header-add-new'],
            'header-timer-start': defaults.buttonColorReplacements['header-timer-start'],
          })
          return {
            ...currentState,
            iconReplacements: defaults.iconReplacements,
            buttonColorReplacements: defaults.buttonColorReplacements,
          }
        }

        // В dev режиме: если localStorage пустой или отсутствует - используем дефолтные значения из файла
        // Это важно для режима инкогнито, где localStorage пустой
        if (!persisted) {
          logger.log(
            '[useIconEditorStore] Dev режим: localStorage пустой, используются дефолтные значения из файла'
          )
          return {
            ...currentState,
            iconReplacements: defaults.iconReplacements,
            buttonColorReplacements: defaults.buttonColorReplacements,
          }
        }

        // Проверяем, есть ли данные в localStorage
        const hasIconReplacements =
          persisted.iconReplacements && Object.keys(persisted.iconReplacements).length > 0
        const hasColorReplacements =
          persisted.buttonColorReplacements &&
          Object.keys(persisted.buttonColorReplacements).length > 0

        // Если данных нет или они пустые, используем дефолтные значения из файла
        if (!hasIconReplacements && !hasColorReplacements) {
          logger.log(
            '[useIconEditorStore] Dev режим: localStorage пустой или данные отсутствуют, используются дефолтные значения из файла'
          )
          return {
            ...currentState,
            iconReplacements: defaults.iconReplacements,
            buttonColorReplacements: defaults.buttonColorReplacements,
          }
        }

        // Если есть данные в localStorage, объединяем их с дефолтными (дефолтные как fallback для отсутствующих ключей)
        logger.log(
          '[useIconEditorStore] Dev режим: используются данные из localStorage, объединенные с дефолтными'
        )
        return {
          ...currentState,
          iconReplacements: {
            ...defaults.iconReplacements,
            ...(persisted.iconReplacements || {}),
          },
          buttonColorReplacements: {
            ...defaults.buttonColorReplacements,
            ...(persisted.buttonColorReplacements || {}),
          },
        }
      },
    }
  )
)
