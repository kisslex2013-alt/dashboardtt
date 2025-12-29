import { useState, useEffect } from 'react'

/**
 * Хук для проверки режима инкогнито
 * @returns true если режим инкогнито
 */
export function useIncognitoMode(): boolean {
  const [isIncognito, setIsIncognito] = useState<boolean>(false)

  useEffect(() => {
    async function checkIncognito(): Promise<void> {
      try {
        // Метод 1: Проверка через navigator.storage.estimate
        // В инкогнито quota обычно очень маленький (около 120MB)
        if (navigator.storage && navigator.storage.estimate) {
          try {
            const estimate = await navigator.storage.estimate()
            // В инкогнито quota обычно меньше 120MB
            if (estimate.quota && estimate.quota < 120000000) {
              setIsIncognito(true)
              return
            }
          } catch {
            // Игнорируем ошибки
          }
        }

        // Метод 2: Проверка через indexedDB (fallback)
        return new Promise<void>((resolve) => {
          try {
            const dbName = `__incognito_test_${  Date.now()}`
            const req = indexedDB.open(dbName)

            req.onerror = () => {
              setIsIncognito(true)
              resolve()
            }
            req.onblocked = () => {
              setIsIncognito(true)
              resolve()
            }

            req.onsuccess = () => {
              indexedDB.deleteDatabase(dbName)
              setIsIncognito(false)
              resolve()
            }

            // Таймаут на случай блокировки
            setTimeout(() => {
              setIsIncognito(false)
              resolve()
            }, 50)
          } catch {
            setIsIncognito(false)
            resolve()
          }
        })
      } catch {
        setIsIncognito(false)
      }
    }

    checkIncognito()
  }, [])

  return isIncognito
}
