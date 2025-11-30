/**
 * 🎓 ПОЯСНЕНИЕ ДЛЯ НАЧИНАЮЩИХ:
 *
 * Этот хук упрощает работу с горячими клавишами:
 * - Обрабатывает нажатия клавиш
 * - Игнорирует клавиши когда фокус на input/textarea
 * - Поддерживает комбинации клавиш (Ctrl, Alt, Shift)
 * - Автоматически очищает слушатели при размонтировании
 */

import { useEffect, useCallback, useRef } from 'react'
import { logger } from '../utils/logger'

/**
 * ⌨️ Хук для работы с горячими клавишами
 *
 * 🎓 ПОЯСНЕНИЕ ДЛЯ НАЧИНАЮЩИХ:
 *
 * Этот хук позволяет обрабатывать нажатия клавиш и комбинаций клавиш.
 * Автоматически игнорирует нажатия, когда пользователь вводит текст в поля.
 *
 * Поддерживает комбинации клавиш с модификаторами (Ctrl, Alt, Shift).
 * Автоматически очищает слушатели при размонтировании компонента.
 *
 * @param {Object} keyMap - объект с маппингом клавиш на функции обработчики
 * @param {string} keyMap.key - строка клавиши (например, 'n', 'Ctrl+s', 'Escape')
 * @param {Function} keyMap.handler - функция, вызываемая при нажатии клавиши
 * @param {Object} [options={}] - дополнительные опции
 * @param {boolean} [options.enabled=true] - включены ли горячие клавиши
 * @param {boolean} [options.ignoreInputs=true] - игнорировать нажатия в input/textarea
 * @param {boolean} [options.preventDefault=true] - предотвращать стандартное поведение
 * @param {boolean} [options.stopPropagation=false] - останавливать всплытие события
 * @param {HTMLElement|Document} [options.target=document] - элемент для прослушивания
 * @returns {Object} объект с методами управления горячими клавишами
 *
 * @example
 * function MyComponent() {
 *   useHotkeys({
 *     'n': () => openNewEntryModal(),
 *     'Ctrl+s': (e) => {
 *       e.preventDefault();
 *       saveData();
 *     },
 *     'Escape': () => closeModal()
 *   });
 * }
 */
export function useHotkeys(keyMap, options = {}) {
  const {
    enabled = true,
    ignoreInputs = true,
    preventDefault = true,
    stopPropagation = false,
    target = document,
  } = options

  const keyMapRef = useRef(keyMap)
  const isEnabledRef = useRef(enabled)

  // Обновляем ссылки при изменении параметров
  useEffect(() => {
    keyMapRef.current = keyMap
    isEnabledRef.current = enabled
  }, [keyMap, enabled])

  /**
   * Проверяет, нужно ли игнорировать клавишу
   * @param {Event} event - событие клавиши
   * @returns {boolean} true если нужно игнорировать
   */
  const shouldIgnoreKey = useCallback(
    event => {
      if (!isEnabledRef.current) return true

      const activeElement = document.activeElement
      if (!activeElement) return false

      const tagName = activeElement.tagName?.toLowerCase()
      const isInputField = ['input', 'textarea', 'select'].includes(tagName) ||
                          activeElement.contentEditable === 'true'

      // ✅ КРИТИЧНО: Если фокус на поле ввода
      if (isInputField) {
        // ✅ КРИТИЧНО: Проверяем, находится ли поле ввода внутри модального окна
        // Используем несколько способов поиска модального окна для надежности
        let modalElement = activeElement.closest('[role="dialog"]')
        
        // Если не нашли через closest, ищем через поиск всех модальных окон
        if (!modalElement) {
          const allModals = document.querySelectorAll('[role="dialog"]')
          for (const modal of allModals) {
            if (modal.contains(activeElement)) {
              modalElement = modal
              break
            }
          }
        }
        
        if (modalElement) {
          // ✅ КРИТИЧНО: Если поле ввода в модальном окне, игнорируем простые hotkey
          // Но разрешаем комбинации с модификаторами (например, Ctrl+Alt+N)
          const hasModifiers = event.ctrlKey || event.altKey || event.metaKey || event.shiftKey
          
          // Если нет модификаторов - блокируем (это простые hotkey типа 's', 'n', 't')
          if (!hasModifiers) {
            // Логируем только в dev режиме для отладки
            if (import.meta.env.DEV) {
              logger.log(`🚫 useHotkeys: Игнорирован hotkey "${event.key}" в input внутри модального окна`, {
                tagName: tagName,
                inputType: activeElement.type,
                modalFound: !!modalElement,
                key: event.key,
              })
            }
            return true
          }
          
          // Если есть модификаторы - разрешаем только определенные комбинации
          // Например, разрешаем Ctrl+Alt+N даже в модальном окне
          // Но блокируем остальные комбинации в input полях модального окна
          if (ignoreInputs) {
            return true // Если ignoreInputs=true, блокируем все комбинации в input
          }
        } else if (ignoreInputs) {
          // Если ignoreInputs=true и не в модальном окне - блокируем
          return true
        }
      }

      return false
    },
    [ignoreInputs]
  )

  /**
   * Создает строку клавиши с учетом модификаторов
   * @param {Event} event - событие клавиши
   * @returns {string} строка клавиши
   */
  const createKeyString = useCallback(event => {
    const modifiers = []

    if (event.ctrlKey || event.metaKey) {
      modifiers.push('Ctrl')
    }
    if (event.altKey) {
      modifiers.push('Alt')
    }
    if (event.shiftKey) {
      modifiers.push('Shift')
    }

    // Используем event.key для специальных символов, event.code для остальных
    let key
    const keyValue = event.key ? event.key.toLowerCase() : ''
    // * Преобразуем event.code: удаляем префикс "Key" и приводим к нижнему регистру
    // Например: "BracketRight" -> "bracketright", "KeyA" -> "a"
    const codeValue = event.code ? event.code.toLowerCase().replace(/^key/, '') : ''

    // Маппинг специальных символов по их значениям (event.key)
    const specialKeysMap = {
      '[': 'bracketleft',
      ']': 'bracketright',
      '{': 'bracketleft',
      '}': 'bracketright',
      '\\': 'backslash',
      '|': 'backslash',
      ';': 'semicolon',
      ':': 'semicolon',
      "'": 'quote',
      '"': 'quote',
      ',': 'comma',
      '<': 'comma',
      '.': 'period',
      '>': 'period',
      '/': 'slash',
      '?': 'slash',
      '`': 'backquote',
      '~': 'backquote',
      '-': 'minus',
      _: 'minus',
      '=': 'equal',
      '+': 'equal',
    }

    // * Маппинг кодов клавиш для специальных случаев (event.code)
    // event.code для скобок: "BracketLeft" -> "bracketleft", "BracketRight" -> "bracketright"
    const codeToKeyMap = {
      bracketleft: 'bracketleft',
      bracketright: 'bracketright',
    }

    // Проверяем специальные символы сначала по key, потом по code
    if (specialKeysMap[keyValue]) {
      // * Если event.key содержит специальный символ (например, ']'), используем маппинг
      key = specialKeysMap[keyValue]
    } else if (codeToKeyMap[codeValue]) {
      // * Если event.code содержит специальный код (например, 'BracketRight'), используем маппинг
      key = codeToKeyMap[codeValue]
    } else if (keyValue.length === 1 && /[a-z0-9]/.test(keyValue)) {
      // Буквы и цифры используем как есть
      key = keyValue
    } else {
      // Для остальных используем code
      key = codeValue || keyValue
    }

    if (modifiers.length > 0) {
      // Приводим к нижнему регистру для консистентности
      const modifierString = modifiers.map(m => m.toLowerCase()).join('+')
      return `${modifierString}+${key}`
    }

    return key
  }, [])

  /**
   * Обработчик нажатия клавиш
   * @param {Event} event - событие клавиши
   */
  const handleKeyDown = useCallback(
    event => {
      if (shouldIgnoreKey(event)) return

      const keyString = createKeyString(event)
      const handler = keyMapRef.current[keyString]

      // Отладка для специальных символов (только в dev режиме)
      if (
        import.meta.env.DEV &&
        (event.ctrlKey || event.metaKey) &&
        event.shiftKey &&
        (event.key === ']' || event.code === 'BracketRight')
      ) {
        console.log('🔍 Отладка хоткея:', {
          key: event.key,
          code: event.code,
          keyString,
          hasHandler: !!handler,
          registeredKeys: Object.keys(keyMapRef.current),
        })
      }

      if (handler) {
        if (preventDefault) {
          event.preventDefault()
        }
        if (stopPropagation) {
          event.stopPropagation()
        }

        try {
          handler(event)
          logger.log(`⌨️ Горячая клавиша: ${keyString}`)
        } catch (error) {
          logger.error(`Ошибка обработки горячей клавиши ${keyString}:`, error)
        }
      }
    },
    [shouldIgnoreKey, createKeyString, preventDefault, stopPropagation]
  )

  // Устанавливаем слушатель событий
  useEffect(() => {
    if (!enabled) return

    target.addEventListener('keydown', handleKeyDown)

    return () => {
      target.removeEventListener('keydown', handleKeyDown)
    }
  }, [enabled, target, handleKeyDown])

  /**
   * Включает/выключает горячие клавиши
   * @param {boolean} newEnabled - новое состояние
   */
  const setEnabled = useCallback(newEnabled => {
    isEnabledRef.current = newEnabled
  }, [])

  /**
   * Обновляет маппинг клавиш
   * @param {Object} newKeyMap - новый маппинг
   */
  const updateKeyMap = useCallback(newKeyMap => {
    keyMapRef.current = { ...keyMapRef.current, ...newKeyMap }
  }, [])

  /**
   * Добавляет новую горячую клавишу
   * @param {string} key - клавиша
   * @param {Function} handler - обработчик
   */
  const addHotkey = useCallback((key, handler) => {
    keyMapRef.current[key] = handler
  }, [])

  /**
   * Удаляет горячую клавишу
   * @param {string} key - клавиша
   */
  const removeHotkey = useCallback(key => {
    delete keyMapRef.current[key]
  }, [])

  /**
   * Получает список всех зарегистрированных клавиш
   * @returns {Array} массив клавиш
   */
  const getRegisteredKeys = useCallback(() => {
    return Object.keys(keyMapRef.current)
  }, [])

  /**
   * Проверяет, зарегистрирована ли клавиша
   * @param {string} key - клавиша
   * @returns {boolean} true если зарегистрирована
   */
  const hasHotkey = useCallback(key => {
    return key in keyMapRef.current
  }, [])

  return {
    setEnabled,
    updateKeyMap,
    addHotkey,
    removeHotkey,
    getRegisteredKeys,
    hasHotkey,
    enabled: isEnabledRef.current,
  }
}

/**
 * Предустановленные горячие клавиши для приложения
 */
export const DEFAULT_HOTKEYS = {
  // Таймер
  space: 'toggleTimer', // Пробел - запуск/остановка таймера
  'Ctrl+s': 'startTimer', // Ctrl+S - запуск таймера
  'Ctrl+ ': 'stopTimer', // Ctrl+Пробел - остановка таймера

  // Навигация
  n: 'newEntry', // N - новая запись
  t: 'toggleTimer', // T - переключение таймера
  s: 'settings', // S - настройки
  h: 'help', // H - помощь

  // Редактирование
  'Ctrl+z': 'undo', // Ctrl+Z - отмена
  'Ctrl+y': 'redo', // Ctrl+Y - повторить
  Delete: 'deleteSelected', // Delete - удалить выбранное

  // Экспорт/Импорт
  'Ctrl+e': 'export', // Ctrl+E - экспорт
  'Ctrl+i': 'import', // Ctrl+I - импорт

  // Поиск
  'Ctrl+f': 'search', // Ctrl+F - поиск

  // Закрытие модальных окон
  Escape: 'closeModal', // Escape - закрыть модальное окно

  // Переключение темы
  'Ctrl+d': 'toggleTheme', // Ctrl+D - переключение темы
}

/**
 * Создает хук с предустановленными горячими клавишами
 * @param {Object} customKeyMap - дополнительные клавиши
 * @param {Object} options - опции
 * @returns {Object} объект с методами управления горячими клавишами
 */
export function useDefaultHotkeys(customKeyMap = {}, options = {}) {
  const mergedKeyMap = { ...DEFAULT_HOTKEYS, ...customKeyMap }
  return useHotkeys(mergedKeyMap, options)
}
