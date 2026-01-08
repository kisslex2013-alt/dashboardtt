/**
 * ⌨️ Хук для работы с горячими клавишами
 */

import { useEffect, useCallback, useRef } from 'react'
import { logger } from '../utils/logger'

type KeyHandler = (event: KeyboardEvent) => void
type KeyMap = Record<string, KeyHandler>

interface UseHotkeysOptions {
  enabled?: boolean
  ignoreInputs?: boolean
  preventDefault?: boolean
  stopPropagation?: boolean
  target?: HTMLElement | Document
}

interface UseHotkeysReturn {
  setEnabled: (enabled: boolean) => void
  updateKeyMap: (newKeyMap: KeyMap) => void
  addHotkey: (key: string, handler: KeyHandler) => void
  removeHotkey: (key: string) => void
  getRegisteredKeys: () => string[]
  hasHotkey: (key: string) => boolean
  enabled: boolean
}

/**
 * ⌨️ Хук для работы с горячими клавишами
 */
export function useHotkeys(keyMap: KeyMap, options: UseHotkeysOptions = {}): UseHotkeysReturn {
  const {
    enabled = true,
    ignoreInputs = true,
    preventDefault = true,
    stopPropagation = false,
    target = document,
  } = options

  const keyMapRef = useRef<KeyMap>(keyMap)
  const isEnabledRef = useRef<boolean>(enabled)

  useEffect(() => {
    keyMapRef.current = keyMap
    isEnabledRef.current = enabled
  }, [keyMap, enabled])

  const shouldIgnoreKey = useCallback(
    (event: KeyboardEvent): boolean => {
      if (!isEnabledRef.current) return true

      const activeElement = document.activeElement as HTMLElement | null
      if (!activeElement) return false

      const tagName = activeElement.tagName?.toLowerCase()
      const isInputField = ['input', 'textarea', 'select'].includes(tagName) ||
                          activeElement.contentEditable === 'true'

      if (isInputField) {
        let modalElement = activeElement.closest('[role="dialog"]')

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
          const hasModifiers = event.ctrlKey || event.altKey || event.metaKey || event.shiftKey

          if (!hasModifiers) {
            return true
          }

          if (ignoreInputs) {
            return true
          }
        } else if (ignoreInputs) {
          return true
        }
      }

      return false
    },
    [ignoreInputs]
  )

  const createKeyString = useCallback((event: KeyboardEvent): string => {
    const modifiers: string[] = []

    if (event.ctrlKey || event.metaKey) {
      modifiers.push('Ctrl')
    }
    if (event.altKey) {
      modifiers.push('Alt')
    }
    if (event.shiftKey) {
      modifiers.push('Shift')
    }

    let key: string
    const keyValue = event.key ? event.key.toLowerCase() : ''
    const codeValue = event.code ? event.code.toLowerCase().replace(/^key/, '') : ''

    const specialKeysMap: Record<string, string> = {
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
      '_': 'minus',
      '=': 'equal',
      '+': 'equal',
    }

    const codeToKeyMap: Record<string, string> = {
      bracketleft: 'bracketleft',
      bracketright: 'bracketright',
    }

    if (specialKeysMap[keyValue]) {
      key = specialKeysMap[keyValue]
    } else if (codeToKeyMap[codeValue]) {
      key = codeToKeyMap[codeValue]
    } else if (keyValue.length === 1 && /[a-z0-9]/.test(keyValue)) {
      key = keyValue
    } else {
      key = codeValue || keyValue
    }

    if (modifiers.length > 0) {
      const modifierString = modifiers.map(m => m.toLowerCase()).join('+')
      return `${modifierString}+${key}`
    }

    return key
  }, [])

  const handleKeyDown = useCallback(
    (event: KeyboardEvent): void => {
      if (shouldIgnoreKey(event)) return

      const keyString = createKeyString(event)
      const handler = keyMapRef.current[keyString]

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

  useEffect(() => {
    if (!enabled) return

    target.addEventListener('keydown', handleKeyDown as EventListener)

    return () => {
      target.removeEventListener('keydown', handleKeyDown as EventListener)
    }
  }, [enabled, target, handleKeyDown])

  const setEnabled = useCallback((newEnabled: boolean): void => {
    isEnabledRef.current = newEnabled
  }, [])

  const updateKeyMap = useCallback((newKeyMap: KeyMap): void => {
    keyMapRef.current = { ...keyMapRef.current, ...newKeyMap }
  }, [])

  const addHotkey = useCallback((key: string, handler: KeyHandler): void => {
    keyMapRef.current[key] = handler
  }, [])

  const removeHotkey = useCallback((key: string): void => {
    delete keyMapRef.current[key]
  }, [])

  const getRegisteredKeys = useCallback((): string[] => {
    return Object.keys(keyMapRef.current)
  }, [])

  const hasHotkey = useCallback((key: string): boolean => {
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
 * (Избегаем конфликтов с браузером: Ctrl+T, Ctrl+N, Ctrl+F, Ctrl+D)
 */
export const DEFAULT_HOTKEYS: Record<string, string> = {
  space: 'toggleTimer',
  'ctrl+shift+t': 'toggleTimer',
  'ctrl+shift+n': 'newEntry',
  'ctrl+shift+d': 'toggleTheme',
  'ctrl+comma': 'settings',
  'ctrl+slash': 'help',
  'ctrl+k': 'commandPalette',
  'slash': 'search',
  'ctrl+z': 'undo',
  'ctrl+y': 'redo',
  Delete: 'deleteSelected',
  'ctrl+e': 'export',
  'ctrl+i': 'import',
  Escape: 'closeModal',
}


