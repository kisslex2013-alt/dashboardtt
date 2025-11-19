/**
 * ✅ PERFORMANCE: Утилита для разбиения длинных задач на части
 * 
 * Используется для предотвращения блокировки основного потока
 * и улучшения метрик TBT (Total Blocking Time)
 */

/**
 * Разбивает длинную задачу на части, давая браузеру возможность обработать другие задачи
 * 
 * @param {Function} task - функция, выполняющая часть работы
 * @param {number} deadline - максимальное время выполнения (по умолчанию 5ms)
 * @returns {Promise} промис, который резолвится когда задача завершена
 */
export function yieldToMain(deadline = 5) {
  return new Promise(resolve => {
    // Используем requestIdleCallback если доступен, иначе setTimeout
    if ('requestIdleCallback' in window) {
      requestIdleCallback(resolve, { timeout: deadline })
    } else {
      setTimeout(resolve, deadline)
    }
  })
}

/**
 * Выполняет массив задач с паузами между ними для предотвращения блокировки UI
 * 
 * @param {Array<Function>} tasks - массив функций для выполнения
 * @param {number} chunkSize - количество задач для выполнения за раз (по умолчанию 10)
 * @param {number} delay - задержка между чанками в мс (по умолчанию 5ms)
 * @returns {Promise} промис, который резолвится когда все задачи выполнены
 */
export async function processInChunks(tasks, chunkSize = 10, delay = 5) {
  for (let i = 0; i < tasks.length; i += chunkSize) {
    const chunk = tasks.slice(i, i + chunkSize)
    
    // Выполняем чанк задач
    chunk.forEach(task => {
      if (typeof task === 'function') {
        task()
      }
    })
    
    // Даем браузеру возможность обработать другие задачи
    if (i + chunkSize < tasks.length) {
      await yieldToMain(delay)
    }
  }
}

/**
 * Оптимизированная версия для обработки больших массивов данных
 * 
 * @param {Array} items - массив элементов для обработки
 * @param {Function} processor - функция обработки каждого элемента
 * @param {number} chunkSize - размер чанка (по умолчанию 50)
 * @returns {Promise<Array>} промис с результатами обработки
 */
export async function processArrayInChunks(items, processor, chunkSize = 50) {
  const results = []
  
  for (let i = 0; i < items.length; i += chunkSize) {
    const chunk = items.slice(i, i + chunkSize)
    const chunkResults = chunk.map(processor)
    results.push(...chunkResults)
    
    // Даем браузеру возможность обработать другие задачи
    if (i + chunkSize < items.length) {
      await yieldToMain(5)
    }
  }
  
  return results
}

