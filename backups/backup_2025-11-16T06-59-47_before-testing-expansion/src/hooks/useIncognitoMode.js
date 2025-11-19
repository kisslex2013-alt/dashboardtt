import { useState, useEffect } from 'react'

/**
 * Хук для проверки режима инкогнито
 * @returns {boolean} true если режим инкогнито
 */
export function useIncognitoMode() {
  const [isIncognito, setIsIncognito] = useState(false)

  useEffect(() => {
    async function checkIncognito() {
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
          } catch (e) {
            // Игнорируем ошибки
          }
        }

        // Метод 2: Проверка через indexedDB (fallback)
        return new Promise((resolve) => {
          try {
            const dbName = '__incognito_test_' + Date.now()
            const req = indexedDB.open(dbName)
            
            req.onerror = () => {
              setIsIncognito(true)
              resolve(true)
            }
            req.onblocked = () => {
              setIsIncognito(true)
              resolve(true)
            }
            
            req.onsuccess = () => {
              indexedDB.deleteDatabase(dbName)
              setIsIncognito(false)
              resolve(false)
            }
            
            // Таймаут на случай блокировки
            setTimeout(() => {
              setIsIncognito(false)
              resolve(false)
            }, 50)
          } catch (e) {
            setIsIncognito(false)
            resolve(false)
          }
        })
      } catch (e) {
        setIsIncognito(false)
      }
    }

    checkIncognito()
  }, [])

  return isIncognito
}

