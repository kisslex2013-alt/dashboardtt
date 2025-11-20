/**
 * ✅ ТЕСТЫ: Тесты для soundManager.ts
 */

import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest'
import {
  initializeSounds,
  playSound,
  playSuccessSound,
  playErrorSound,
  playWarningSound,
  playTimerStartSound,
  playTimerStopSound,
  playGoalReachedSound,
  playNotificationSound,
  playClickSound,
  playWorkCompleteSound,
  setSoundsEnabled,
  setSoundVolume,
  getSoundVolume,
  areSoundsEnabled,
  getAvailableSounds,
  stopAllSounds,
  createCustomSound,
  disposeSounds,
} from '../soundManager'

// Мокаем Tone.js
vi.mock('tone', () => {
  const mockSynth = {
    triggerAttackRelease: vi.fn(),
    dispose: vi.fn(),
    toDestination: vi.fn(function() {
      return this
    }),
  }

  const mockSynthConstructor = function() {
    return mockSynth
  }

  const mockTone = {
    start: vi.fn(() => Promise.resolve()),
    Synth: mockSynthConstructor,
    Destination: {
      volume: {
        value: 0,
      },
    },
    gainToDb: vi.fn((gain) => gain * 20),
    Transport: {
      stop: vi.fn(),
      cancel: vi.fn(),
    },
  }

  return {
    default: mockTone,
    ...mockTone,
  }
})

// Мокаем logger
vi.mock('../logger', () => ({
  logger: {
    log: vi.fn(),
    warn: vi.fn(),
    error: vi.fn(),
  },
}))

describe('soundManager', () => {
  beforeEach(async () => {
    // Инициализируем звуки перед каждым тестом
    await initializeSounds()
  })

  afterEach(() => {
    // Очищаем состояние после каждого теста
    vi.clearAllMocks()
  })

  describe('initializeSounds', () => {
    it('should initialize sound manager', async () => {
      await expect(initializeSounds()).resolves.toBeUndefined()
    })

    it('should not initialize twice', async () => {
      await initializeSounds()
      await initializeSounds() // Второй вызов не должен вызывать ошибку
      await expect(initializeSounds()).resolves.toBeUndefined()
    })
  })

  describe('playSound', () => {
    it('should play sound by name', () => {
      expect(() => playSound('success')).not.toThrow()
    })

    it('should not play sound if not initialized', async () => {
      disposeSounds()
      expect(() => playSound('success')).not.toThrow()
    })

    it('should handle invalid sound name', () => {
      expect(() => playSound('invalidSound')).not.toThrow()
    })

    it('should play sound with custom volume', () => {
      expect(() => playSound('success', { volume: 0.5 })).not.toThrow()
    })

    it('should play sound without logging', () => {
      expect(() => playSound('success', { log: false })).not.toThrow()
    })
  })

  describe('playSuccessSound', () => {
    it('should play success sound', () => {
      expect(() => playSuccessSound()).not.toThrow()
    })

    it('should play success sound with options', () => {
      expect(() => playSuccessSound({ volume: 0.8 })).not.toThrow()
    })
  })

  describe('playErrorSound', () => {
    it('should play error sound', () => {
      expect(() => playErrorSound()).not.toThrow()
    })
  })

  describe('playWarningSound', () => {
    it('should play warning sound', () => {
      expect(() => playWarningSound()).not.toThrow()
    })
  })

  describe('playTimerStartSound', () => {
    it('should play timer start sound', () => {
      expect(() => playTimerStartSound()).not.toThrow()
    })
  })

  describe('playTimerStopSound', () => {
    it('should play timer stop sound', () => {
      expect(() => playTimerStopSound()).not.toThrow()
    })
  })

  describe('playGoalReachedSound', () => {
    it('should play goal reached sound', () => {
      expect(() => playGoalReachedSound()).not.toThrow()
    })
  })

  describe('playNotificationSound', () => {
    it('should play notification sound', () => {
      expect(() => playNotificationSound()).not.toThrow()
    })
  })

  describe('playClickSound', () => {
    it('should play click sound', () => {
      expect(() => playClickSound()).not.toThrow()
    })
  })

  describe('playWorkCompleteSound', () => {
    it('should play work complete sound', () => {
      expect(() => playWorkCompleteSound()).not.toThrow()
    })
  })

  describe('setSoundsEnabled', () => {
    it('should enable sounds', () => {
      setSoundsEnabled(true)
      expect(areSoundsEnabled()).toBe(true)
    })

    it('should disable sounds', () => {
      setSoundsEnabled(false)
      expect(areSoundsEnabled()).toBe(false)
    })
  })

  describe('setSoundVolume', () => {
    it('should set volume', () => {
      setSoundVolume(0.5)
      expect(getSoundVolume()).toBe(0.5)
    })

    it('should clamp volume to 0-1 range', () => {
      setSoundVolume(-1)
      expect(getSoundVolume()).toBeGreaterThanOrEqual(0)

      setSoundVolume(2)
      expect(getSoundVolume()).toBeLessThanOrEqual(1)
    })
  })

  describe('getSoundVolume', () => {
    it('should return current volume', () => {
      setSoundVolume(0.7)
      expect(getSoundVolume()).toBe(0.7)
    })
  })

  describe('areSoundsEnabled', () => {
    it('should return enabled status', () => {
      setSoundsEnabled(true)
      expect(areSoundsEnabled()).toBe(true)

      setSoundsEnabled(false)
      expect(areSoundsEnabled()).toBe(false)
    })
  })

  describe('getAvailableSounds', () => {
    it('should return list of available sounds', () => {
      const sounds = getAvailableSounds()
      expect(Array.isArray(sounds)).toBe(true)
      expect(sounds.length).toBeGreaterThan(0)
      expect(sounds).toContain('success')
      expect(sounds).toContain('error')
      expect(sounds).toContain('warning')
    })
  })

  describe('stopAllSounds', () => {
    it('should stop all sounds', () => {
      expect(() => stopAllSounds()).not.toThrow()
    })
  })

  describe('createCustomSound', () => {
    it('should create custom sound', () => {
      const sound = createCustomSound('testSound', {
        note: 'C4',
        duration: '8n',
      })

      expect(sound).toBeDefined()
      expect(sound.play).toBeDefined()
      expect(sound.dispose).toBeDefined()
    })

    it('should create custom sound with notes array', () => {
      const sound = createCustomSound('testSound2', {
        notes: [
          { note: 'C4', duration: '8n' },
          { note: 'E4', duration: '8n', delay: 100 },
        ],
      })

      expect(sound).toBeDefined()
      expect(() => sound.play()).not.toThrow()
    })
  })

  describe('disposeSounds', () => {
    it('should dispose sounds', () => {
      expect(() => disposeSounds()).not.toThrow()
    })
  })
})

