/**
 * ✅ ТЕСТЫ: Настройка тестового окружения
 *
 * Этот файл выполняется перед каждым тестом.
 * Здесь настраиваются глобальные моки и утилиты для тестирования.
 */

import { expect, afterEach } from 'vitest'
import { cleanup } from '@testing-library/react'
import * as matchers from '@testing-library/jest-dom/matchers'

// Расширяем expect с матчерами из @testing-library/jest-dom
expect.extend(matchers)

// Очищаем DOM после каждого теста
afterEach(() => {
  cleanup()
})

// Мокаем window.matchMedia (используется в некоторых компонентах)
Object.defineProperty(window, 'matchMedia', {
  writable: true,
  value: query => ({
    matches: false,
    media: query,
    onchange: null,
    addListener: () => {}, // deprecated
    removeListener: () => {}, // deprecated
    addEventListener: () => {},
    removeEventListener: () => {},
    dispatchEvent: () => {},
  }),
})

// Мокаем localStorage
const localStorageMock = (() => {
  let store = {}
  return {
    getItem: key => store[key] || null,
    setItem: (key, value) => {
      store[key] = String(value)
    },
    removeItem: key => {
      delete store[key]
    },
    clear: () => {
      store = {}
    },
  }
})()

Object.defineProperty(window, 'localStorage', {
  value: localStorageMock,
})

// Мокаем IndexedDB (базовая реализация для тестов)
global.indexedDB = {
  open: () => ({
    onsuccess: null,
    onerror: null,
    onupgradeneeded: null,
    result: {
      createObjectStore: () => ({}),
      transaction: () => ({
        objectStore: () => ({
          get: () => ({ onsuccess: null }),
          put: () => ({ onsuccess: null }),
          delete: () => ({ onsuccess: null }),
        }),
      }),
    },
  }),
}
