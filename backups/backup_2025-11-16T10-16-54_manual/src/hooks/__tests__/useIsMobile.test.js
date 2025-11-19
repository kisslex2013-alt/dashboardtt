import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest'
import { renderHook, act, waitFor } from '@testing-library/react'
import { useIsMobile } from '../useIsMobile'

describe('useIsMobile', () => {
  const originalMatchMedia = window.matchMedia

  beforeEach(() => {
    window.matchMedia = vi.fn()
  })

  afterEach(() => {
    window.matchMedia = originalMatchMedia
  })

  it('returns true for mobile viewport', () => {
    window.matchMedia = vi.fn().mockReturnValue({
      matches: true,
      addEventListener: vi.fn(),
      removeEventListener: vi.fn(),
    })

    const { result } = renderHook(() => useIsMobile())
    expect(result.current).toBe(true)
  })

  it('returns false for desktop viewport', () => {
    window.matchMedia = vi.fn().mockReturnValue({
      matches: false,
      addEventListener: vi.fn(),
      removeEventListener: vi.fn(),
    })

    const { result } = renderHook(() => useIsMobile())
    expect(result.current).toBe(false)
  })

  it('updates when viewport changes', async () => {
    const listeners = []
    const mockMatchMedia = vi.fn().mockReturnValue({
      matches: false,
      addEventListener: (event, callback) => {
        listeners.push(callback)
      },
      removeEventListener: vi.fn(),
    })
    window.matchMedia = mockMatchMedia

    const { result } = renderHook(() => useIsMobile())
    expect(result.current).toBe(false)

    // Simulate viewport change
    act(() => {
      listeners.forEach(listener => listener({ matches: true }))
    })
    
    await waitFor(() => {
      expect(result.current).toBe(true)
    })
  })
})

