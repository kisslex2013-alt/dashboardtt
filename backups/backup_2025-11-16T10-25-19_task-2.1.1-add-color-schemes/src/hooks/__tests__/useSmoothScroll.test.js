import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest'
import { renderHook } from '@testing-library/react'
import { useSmoothScroll } from '../useSmoothScroll'

describe('useSmoothScroll', () => {
  beforeEach(() => {
    // Мокаем window.scrollTo
    window.scrollTo = vi.fn()
    
    // Создаем мок элемента
    document.body.innerHTML = '<div id="test-element">Test</div>'
  })

  afterEach(() => {
    vi.restoreAllMocks()
    document.body.innerHTML = ''
  })

  it('provides scrollToElement function', () => {
    const { result } = renderHook(() => useSmoothScroll())
    expect(typeof result.current.scrollToElement).toBe('function')
  })

  it('provides scrollToTop function', () => {
    const { result } = renderHook(() => useSmoothScroll())
    expect(typeof result.current.scrollToTop).toBe('function')
  })

  it('provides scrollToBottom function', () => {
    const { result } = renderHook(() => useSmoothScroll())
    expect(typeof result.current.scrollToBottom).toBe('function')
  })

  it('scrolls to element by id', () => {
    const { result } = renderHook(() => useSmoothScroll())
    
    // Мокаем getBoundingClientRect
    const element = document.getElementById('test-element')
    element.getBoundingClientRect = vi.fn(() => ({
      top: 100,
      left: 0,
      bottom: 200,
      right: 100,
      width: 100,
      height: 100,
    }))
    
    Object.defineProperty(window, 'pageYOffset', {
      writable: true,
      value: 0,
    })

    result.current.scrollToElement('test-element')
    
    expect(window.scrollTo).toHaveBeenCalled()
  })

  it('scrolls to top', () => {
    const { result } = renderHook(() => useSmoothScroll())
    
    result.current.scrollToTop()
    
    expect(window.scrollTo).toHaveBeenCalledWith({
      top: 0,
      behavior: 'smooth',
    })
  })

  it('scrolls to bottom', () => {
    const { result } = renderHook(() => useSmoothScroll())
    
    Object.defineProperty(document.documentElement, 'scrollHeight', {
      writable: true,
      value: 1000,
    })

    result.current.scrollToBottom()
    
    expect(window.scrollTo).toHaveBeenCalledWith({
      top: 1000,
      behavior: 'smooth',
    })
  })
})

