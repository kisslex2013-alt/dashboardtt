/**
 * ✅ PERFORMANCE: Утилита для разбиения длинных задач на части
 * 
 * Используется для предотвращения блокировки основного потока
 * и улучшения метрик TBT (Total Blocking Time)
 */

/**
 * Разбивает длинную задачу на части, давая браузеру возможность обработать другие задачи
 * 
 * @param deadline - Максимальное время выполнения в миллисекундах (по умолчанию 5ms)
 * @returns Промис, который резолвится когда задача завершена
 * 
 * @example
 * ```ts
 * await yieldToMain(5)
 * // Браузер получил время для обработки других задач
 * ```
 */
export function yieldToMain(deadline: number = 5): Promise<void> {
  return new Promise(resolve => {
    // Используем requestIdleCallback если доступен, иначе setTimeout
    if ('requestIdleCallback' in window) {
      (window as any).requestIdleCallback(resolve, { timeout: deadline })
    } else {
      setTimeout(resolve, deadline)
    }
  })
}

/**
 * Выполняет массив задач с паузами между ними для предотвращения блокировки UI
 * 
 * @param tasks - Массив функций для выполнения
 * @param chunkSize - Количество задач для выполнения за раз (по умолчанию 10)
 * @param delay - Задержка между чанками в мс (по умолчанию 5ms)
 * @returns Промис, который резолвится когда все задачи выполнены
 * 
 * @example
 * ```ts
 * const tasks = [
 *   () => console.log('Task 1'),
 *   () => console.log('Task 2'),
 *   () => console.log('Task 3'),
 * ]
 * await processInChunks(tasks, 2, 5)
 * ```
 */
export async function processInChunks(
  tasks: Array<() => void>,
  chunkSize: number = 10,
  delay: number = 5
): Promise<void> {
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
 * @param items - Массив элементов для обработки
 * @param processor - Функция обработки каждого элемента
 * @param chunkSize - Размер чанка (по умолчанию 50)
 * @returns Промис с результатами обработки
 * 
 * @example
 * ```ts
 * const numbers = [1, 2, 3, 4, 5]
 * const results = await processArrayInChunks(
 *   numbers,
 *   (n) => n * 2,
 *   2
 * )
 * console.log(results) // [2, 4, 6, 8, 10]
 * ```
 */
export async function processArrayInChunks<T, R>(
  items: T[],
  processor: (item: T) => R,
  chunkSize: number = 50
): Promise<R[]> {
  const results: R[] = []
  
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

