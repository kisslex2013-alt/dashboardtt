/**
 * ✅ ТЕСТЫ: Тесты для утилит производительности
 */

import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest'
import { yieldToMain, processInChunks, processArrayInChunks } from '../yieldToMain'

describe('yieldToMain', () => {
  beforeEach(() => {
    vi.useFakeTimers()
  })

  afterEach(() => {
    vi.useRealTimers()
  })

  describe('yieldToMain', () => {
    it('should yield to main thread', async () => {
      const promise = yieldToMain(5)
      vi.advanceTimersByTime(5)
      await expect(promise).resolves.toBeUndefined()
    })

    it('should use default deadline', async () => {
      const promise = yieldToMain()
      vi.advanceTimersByTime(5)
      await expect(promise).resolves.toBeUndefined()
    })

    it('should use requestIdleCallback if available', async () => {
      const mockRequestIdleCallback = vi.fn((callback) => {
        setTimeout(callback, 0)
      })
      ;(window as any).requestIdleCallback = mockRequestIdleCallback

      const promise = yieldToMain(5)
      vi.advanceTimersByTime(0)
      await promise

      expect(mockRequestIdleCallback).toHaveBeenCalled()
      delete (window as any).requestIdleCallback
    })

    it('should fallback to setTimeout if requestIdleCallback not available', async () => {
      const originalRequestIdleCallback = (window as any).requestIdleCallback
      delete (window as any).requestIdleCallback

      const promise = yieldToMain(5)
      vi.advanceTimersByTime(5)
      await expect(promise).resolves.toBeUndefined()

      if (originalRequestIdleCallback) {
        ;(window as any).requestIdleCallback = originalRequestIdleCallback
      }
    })
  })

  describe('processInChunks', () => {
    beforeEach(() => {
      vi.useRealTimers()
    })

    it('should process tasks in chunks', async () => {
      const results: number[] = []
      const tasks = [
        () => results.push(1),
        () => results.push(2),
        () => results.push(3),
        () => results.push(4),
        () => results.push(5),
      ]

      await processInChunks(tasks, 2, 0)
      expect(results).toEqual([1, 2, 3, 4, 5])
    })

    it('should use default chunk size', async () => {
      const results: number[] = []
      const tasks = Array.from({ length: 25 }, (_, i) => () => results.push(i))

      await processInChunks(tasks, undefined, 0)
      expect(results.length).toBe(25)
    })

    it('should handle empty tasks array', async () => {
      await expect(processInChunks([], 10, 0)).resolves.toBeUndefined()
    })

    it('should handle non-function tasks', async () => {
      const tasks = [
        () => {},
        null as any,
        undefined as any,
        () => {},
      ]

      await expect(processInChunks(tasks, 2, 0)).resolves.toBeUndefined()
    })
  })

  describe('processArrayInChunks', () => {
    beforeEach(() => {
      vi.useRealTimers()
    })

    it('should process array in chunks', async () => {
      const items = [1, 2, 3, 4, 5]
      const processor = (n: number) => n * 2

      const results = await processArrayInChunks(items, processor, 2)
      expect(results).toEqual([2, 4, 6, 8, 10])
    })

    it('should use default chunk size', async () => {
      const items = Array.from({ length: 100 }, (_, i) => i)
      const processor = (n: number) => n * 2

      const results = await processArrayInChunks(items, processor)
      expect(results.length).toBe(100)
      expect(results[0]).toBe(0)
      expect(results[99]).toBe(198)
    })

    it('should handle empty array', async () => {
      const results = await processArrayInChunks([], (x) => x)
      expect(results).toEqual([])
    })

    it('should process with different types', async () => {
      const items = ['a', 'b', 'c']
      const processor = (s: string) => s.toUpperCase()

      const results = await processArrayInChunks(items, processor, 2)
      expect(results).toEqual(['A', 'B', 'C'])
    })
  })
})

