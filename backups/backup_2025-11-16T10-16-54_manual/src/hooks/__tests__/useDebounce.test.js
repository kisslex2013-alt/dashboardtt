import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest'
import { renderHook, act } from '@testing-library/react'
import { useDebounce } from '../useDebounce'

describe('useDebounce', () => {
  beforeEach(() => {
    vi.useFakeTimers()
  })

  afterEach(() => {
    vi.restoreAllMocks()
  })

  it('returns initial value immediately', () => {
    const { result } = renderHook(() => useDebounce('initial', 300))
    expect(result.current).toBe('initial')
  })

  it('debounces value changes', () => {
    const { result, rerender } = renderHook(({ value, delay }) => useDebounce(value, delay), {
      initialProps: { value: 'initial', delay: 300 },
    })

    expect(result.current).toBe('initial')

    rerender({ value: 'updated', delay: 300 })
    expect(result.current).toBe('initial') // Still initial

    act(() => {
      vi.advanceTimersByTime(300)
    })

    expect(result.current).toBe('updated')
  })

  it('cancels previous debounce on rapid changes', () => {
    const { result, rerender } = renderHook(({ value, delay }) => useDebounce(value, delay), {
      initialProps: { value: 'initial', delay: 300 },
    })

    rerender({ value: 'first', delay: 300 })
    act(() => {
      vi.advanceTimersByTime(150)
    })

    rerender({ value: 'second', delay: 300 })
    act(() => {
      vi.advanceTimersByTime(150)
    })

    expect(result.current).toBe('initial') // Still initial

    act(() => {
      vi.advanceTimersByTime(150)
    })

    expect(result.current).toBe('second') // Only second update
  })
})

