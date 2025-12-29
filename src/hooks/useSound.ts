/**
 * 🔊 Хук для управления звуками
 */

import { useRef, useEffect, useCallback } from 'react'
import * as Tone from 'tone'
import { useNotificationsSettings, useTheme } from '../store/useSettingsStore'
import { logger } from '../utils/logger'

type SoundName =
  | 'timerStart' | 'timerStop' | 'timerPause' | 'timerResume'
  | 'success' | 'error' | 'warning' | 'info'
  | 'click' | 'hover'
  | 'newEntry' | 'deleteEntry' | 'saveEntry'
  | 'goalReached' | 'milestone'
  | 'hourlyAlert' | 'dailyGoal'
  | 'chime' | 'alert' | 'phone' | 'doorbell' | 'alarm'
  | 'notification' | 'bell' | 'beep' | 'ping'
  | 'gentle' | 'soft' | 'zen' | 'focus' | 'breeze' | 'crystal' | 'harmony' | 'whisper' | 'bloom'
  | 'export' | 'import' | 'settingsChange' | 'themeChange'
  | 'workComplete' | 'validationError' | 'networkError'
  | 'pause' | 'resume' | 'reset'
  | string

interface PlaySoundOptions {
  volume?: number
  duration?: string
  frequency?: string
}

interface Note {
  frequency: string
  duration?: string
  delay?: number
}

interface UseSoundManagerReturn {
  playSound: (soundName: SoundName, options?: PlaySoundOptions) => Promise<void>
  playCustomSound: (frequency: string, duration: string, options?: PlaySoundOptions) => void
  playMelody: (notes: Note[], options?: PlaySoundOptions) => void
  stopAllSounds: () => void
  setVolume: (volume: number) => void
  getVolume: () => number
  isEnabled: () => boolean
  setEnabled: (enabled: boolean) => void
}

export function useSoundManager(): UseSoundManagerReturn {
  const notifications = useNotificationsSettings()
  const synthRef = useRef<Tone.Synth | null>(null)
  const isInitializedRef = useRef<boolean>(false)

  const initializeTone = useCallback(async (): Promise<void> => {
    if (!isInitializedRef.current) {
      try {
        const originalWarn = console.warn
        console.warn = () => {}

        await Tone.start()
        isInitializedRef.current = true

        console.warn = originalWarn

        logger.log('🔊 Tone.js инициализирован')
      } catch (error) {
        logger.error('Ошибка инициализации Tone.js:', error)
      }
    }
  }, [])

  useEffect(() => {
    return () => {
      if (synthRef.current) {
        synthRef.current.dispose()
        synthRef.current = null
      }
    }
  }, [])

  const playSound = useCallback(
    async (soundName: SoundName, options: PlaySoundOptions = {}): Promise<void> => {
      await initializeTone()

      if (!synthRef.current) {
        synthRef.current = new Tone.Synth({
          oscillator: {
            type: 'sine',
          },
          envelope: {
            attack: 0.1,
            decay: 0.2,
            sustain: 0.3,
            release: 0.4,
          },
        }).toDestination()

        const volume = notifications.volume || 80
        synthRef.current.volume.value = Tone.gainToDb(volume / 100)
      }

      if (!notifications.sound || !synthRef.current || !isInitializedRef.current) {
        return
      }

      const { volume = notifications.volume || 80 } = options

      synthRef.current.volume.value = Tone.gainToDb(volume / 100)

      try {
        const safePlay = (frequency: string, duration: string, delay: number = 0): void => {
          if (delay === 0) {
            if (synthRef.current) {
              synthRef.current.triggerAttackRelease(frequency, duration)
            }
          } else {
            setTimeout(() => {
              if (synthRef.current) {
                synthRef.current.triggerAttackRelease(frequency, duration)
              }
            }, delay)
          }
        }

        const sounds: Record<string, () => void> = {
          timerStart: () => { safePlay('C5', '8n'); safePlay('E5', '8n', 100); safePlay('G5', '8n', 200) },
          timerStop: () => { safePlay('G5', '8n'); safePlay('E5', '8n', 150); safePlay('C5', '8n', 300) },
          timerPause: () => { safePlay('F4', '4n') },
          timerResume: () => { safePlay('A4', '8n'); safePlay('C5', '8n', 100) },
          pause: () => { safePlay('F4', '4n') },
          resume: () => { safePlay('A4', '8n'); safePlay('C5', '8n', 100) },
          reset: () => { safePlay('C4', '8n') },
          success: () => { safePlay('C5', '8n'); safePlay('E5', '8n', 100); safePlay('G5', '8n', 200) },
          error: () => { safePlay('C3', '4n'); safePlay('B2', '4n', 200) },
          warning: () => { safePlay('F4', '8n'); safePlay('F4', '8n', 300) },
          info: () => { safePlay('A4', '8n'); safePlay('A4', '8n', 200) },
          click: () => { safePlay('C5', '32n') },
          hover: () => { safePlay('C6', '32n') },
          newEntry: () => { safePlay('C4', '16n'); safePlay('E4', '16n', 50) },
          deleteEntry: () => { safePlay('C3', '8n') },
          saveEntry: () => { safePlay('G4', '8n'); safePlay('C5', '8n', 100) },
          goalReached: () => { safePlay('C5', '4n'); safePlay('E5', '4n', 200); safePlay('G5', '4n', 400); safePlay('C6', '2n', 600) },
          milestone: () => { safePlay('G4', '8n'); safePlay('B4', '8n', 100); safePlay('D5', '8n', 200) },
          hourlyAlert: () => { safePlay('C5', '8n'); safePlay('E5', '8n', 100); safePlay('G5', '8n', 200) },
          dailyGoal: () => { safePlay('C5', '4n'); safePlay('E5', '4n', 200); safePlay('G5', '4n', 400); safePlay('C6', '2n', 600) },
          chime: () => { safePlay('E5', '8n'); safePlay('C5', '8n', 200) },
          alert: () => { safePlay('G5', '16n'); safePlay('C6', '16n', 100) },
          phone: () => { safePlay('C5', '4n'); safePlay('E5', '4n', 500) },
          doorbell: () => { safePlay('G4', '8n'); safePlay('B4', '8n', 300); safePlay('D5', '8n', 600) },
          alarm: () => { safePlay('A4', '16n'); safePlay('A4', '16n', 200); safePlay('A4', '16n', 400) },
          notification: () => { safePlay('F5', '8n'); safePlay('A5', '8n', 200) },
          bell: () => { safePlay('C6', '4n'); safePlay('G5', '4n', 500) },
          beep: () => { safePlay('C5', '8n') },
          ping: () => { safePlay('E5', '16n'); safePlay('G5', '16n', 100) },
          gentle: () => { safePlay('D5', '8n'); safePlay('F5', '8n', 150) },
          soft: () => { safePlay('A4', '8n'); safePlay('C5', '8n', 200) },
          zen: () => { safePlay('G4', '4n'); safePlay('B4', '4n', 300); safePlay('D5', '4n', 600) },
          focus: () => { safePlay('C5', '16n'); safePlay('E5', '16n', 100) },
          breeze: () => { safePlay('F5', '16n'); safePlay('A5', '16n', 80) },
          crystal: () => { safePlay('E6', '32n'); safePlay('G6', '32n', 50) },
          harmony: () => { safePlay('C5', '8n'); safePlay('E5', '8n', 100); safePlay('G5', '8n', 200) },
          whisper: () => { safePlay('B4', '8n'); safePlay('D5', '8n', 150) },
          bloom: () => { safePlay('C4', '8n'); safePlay('E4', '8n', 100); safePlay('G4', '8n', 200); safePlay('C5', '8n', 300) },
          export: () => { safePlay('C4', '8n'); safePlay('E4', '8n', 100); safePlay('G4', '8n', 200) },
          import: () => { safePlay('G4', '8n'); safePlay('E4', '8n', 100); safePlay('C4', '8n', 200) },
          settingsChange: () => { safePlay('A4', '16n') },
          themeChange: () => { safePlay('F4', '8n'); safePlay('A4', '8n', 100) },
          workComplete: () => { safePlay('C4', '4n'); safePlay('E4', '4n', 200); safePlay('G4', '4n', 400); safePlay('C5', '2n', 600) },
          validationError: () => { safePlay('C3', '8n'); safePlay('B2', '8n', 100) },
          networkError: () => { safePlay('C2', '4n'); safePlay('C2', '4n', 200) },
        }

        if (sounds[soundName]) {
          sounds[soundName]()
          logger.log(`🔊 Воспроизведен звук: ${soundName}`)
        } else {
          logger.warn(`Звук '${soundName}' не найден`)
        }
      } catch (error) {
        logger.error(`Ошибка воспроизведения звука '${soundName}':`, error)
      }
    },
    [notifications.sound, notifications.volume, initializeTone]
  )

  const playCustomSound = useCallback(
    (frequency: string, duration: string, options: PlaySoundOptions = {}): void => {
      if (!notifications.sound || !synthRef.current || !isInitializedRef.current) {
        return
      }

      const { volume = notifications.volume || 80 } = options

      try {
        synthRef.current.volume.value = Tone.gainToDb(volume / 100)
        synthRef.current.triggerAttackRelease(frequency, duration)
        logger.log(`🔊 Кастомный звук: ${frequency} ${duration}`)
      } catch (error) {
        logger.error('Ошибка воспроизведения кастомного звука:', error)
      }
    },
    [notifications.sound, notifications.volume]
  )

  const playMelody = useCallback(
    (notes: Note[], options: PlaySoundOptions = {}): void => {
      if (!notifications.sound || !synthRef.current || !isInitializedRef.current) {
        return
      }

      const { volume = notifications.volume || 80 } = options

      try {
        synthRef.current.volume.value = Tone.gainToDb(volume / 100)

        notes.forEach((note, index) => {
          const delay = note.delay || index * 100
          setTimeout(() => {
            if (synthRef.current) {
              synthRef.current.triggerAttackRelease(note.frequency, note.duration || '8n')
            }
          }, delay)
        })

        logger.log(`🔊 Мелодия: ${notes.length} нот`)
      } catch (error) {
        logger.error('Ошибка воспроизведения мелодии:', error)
      }
    },
    [notifications.sound, notifications.volume]
  )

  const stopAllSounds = useCallback((): void => {
    try {
      if (synthRef.current) {
        synthRef.current.triggerRelease()
      }
      logger.log('🔊 Все звуки остановлены')
    } catch (error) {
      logger.error('Ошибка остановки звуков:', error)
    }
  }, [])

  const setVolume = useCallback((volume: number): void => {
    if (synthRef.current) {
      synthRef.current.volume.value = Tone.gainToDb(volume / 100)
      logger.log(`🔊 Громкость установлена: ${volume}%`)
    }
  }, [])

  const getVolume = useCallback((): number => {
    if (synthRef.current) {
      return Tone.dbToGain(synthRef.current.volume.value) * 100
    }
    return 0
  }, [])

  const isEnabled = useCallback((): boolean => {
    return notifications.sound && isInitializedRef.current
  }, [notifications.sound])

  const setEnabled = useCallback((enabled: boolean): void => {
    logger.log(`🔊 Звуки ${enabled ? 'включены' : 'выключены'}`)
  }, [])

  return {
    playSound,
    playCustomSound,
    playMelody,
    stopAllSounds,
    setVolume,
    getVolume,
    isEnabled,
    setEnabled,
  }
}
