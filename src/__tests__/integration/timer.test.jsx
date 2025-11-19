import { describe, it, expect, beforeEach } from 'vitest'
import { waitFor } from '@testing-library/react'
import { useTimerStore } from '../../store/useTimerStore'

/**
 * ✅ ИНТЕГРАЦИОННЫЕ ТЕСТЫ: Таймер
 * 
 * Тестирует интеграцию между компонентами таймера и store
 */

describe('Timer Integration', () => {
  beforeEach(() => {
    // Сброс store перед каждым тестом
    useTimerStore.setState({
      activeTimer: null,
      startTime: null,
      elapsedTime: 0,
      isPaused: false,
      timerEntryId: null,
    })
  })

  it('should start and stop timer', async () => {
    const { startTimer, stopTimer } = useTimerStore.getState()

    expect(useTimerStore.getState().activeTimer).toBe(null)

    startTimer('Test Category')
    
    await waitFor(() => {
      expect(useTimerStore.getState().activeTimer).toBe('Test Category')
      expect(useTimerStore.getState().startTime).not.toBe(null)
    })

    const duration = stopTimer()
    
    expect(useTimerStore.getState().activeTimer).toBe(null)
    expect(duration).toBeGreaterThanOrEqual(0)
  })

  it('should calculate duration correctly', async () => {
    const { startTimer, stopTimer } = useTimerStore.getState()

    startTimer('Test Category')
    
    // Ждем 1 секунду
    await new Promise(resolve => setTimeout(resolve, 1000))
    
    const duration = stopTimer()
    
    expect(duration).toBeGreaterThan(0)
    expect(duration).toBeLessThan(2) // Меньше 2 секунд с учетом погрешности
  })
})

