/**
 * 🎓 ПОЯСНЕНИЕ ДЛЯ НАЧИНАЮЩИХ:
 *
 * Этот хук упрощает работу со звуками:
 * - Интегрируется с настройками приложения
 * - Использует Tone.js для генерации звуков
 * - Предоставляет предустановленные звуки
 * - Автоматически управляет громкостью
 */

import { useRef, useEffect, useCallback } from 'react'
import * as Tone from 'tone'
import { useNotificationsSettings, useTheme } from '../store/useSettingsStore'
import { logger } from '../utils/logger'

/**
 * 🔊 Хук для управления звуками
 *
 * 🎓 ПОЯСНЕНИЕ ДЛЯ НАЧИНАЮЩИХ:
 *
 * Этот хук управляет воспроизведением звуков в приложении.
 * Использует библиотеку Tone.js для генерации звуков программно.
 *
 * Звуки воспроизводятся только если они включены в настройках.
 * Громкость регулируется через настройки приложения.
 *
 * Поддерживает множество предустановленных звуков:
 * - Звуки таймера (timerStart, timerStop, timerPause, timerResume)
 * - Звуки уведомлений (success, error, warning, info)
 * - Звуки интерфейса (click, hover)
 * - Звуки работы (newEntry, deleteEntry, saveEntry)
 * - Звуки достижений (goalReached, milestone)
 * - И многие другие
 *
 * @returns {Object} объект с методами для воспроизведения звуков:
 * @returns {Function} returns.playSound - воспроизводит предустановленный звук
 * @param {string} soundName - название звука (например, 'timerStart', 'success')
 * @param {Object} [options={}] - опции воспроизведения (volume, duration, frequency)
 * @returns {Function} returns.playCustomSound - воспроизводит кастомный звук
 * @param {string} frequency - частота звука (например, 'C4', 'E5')
 * @param {string} duration - длительность (например, '8n', '4n')
 * @param {Object} [options={}] - опции (volume)
 * @returns {Function} returns.playMelody - воспроизводит мелодию из массива нот
 * @param {Array} notes - массив нот [{frequency, duration, delay}]
 * @param {Object} [options={}] - опции (volume)
 * @returns {Function} returns.stopAllSounds - останавливает все звуки
 * @returns {Function} returns.setVolume - устанавливает громкость (0-100)
 * @returns {Function} returns.getVolume - получает текущую громкость (0-100)
 * @returns {Function} returns.isEnabled - проверяет, включены ли звуки
 * @returns {Function} returns.setEnabled - включает/выключает звуки
 *
 * @example
 * function MyComponent() {
 *   const { playSound } = useSoundManager();
 *
 *   const handleSuccess = () => {
 *     playSound('success');
 *   };
 *
 *   return <button onClick={handleSuccess}>Успех</button>;
 * }
 */
export function useSoundManager() {
  // ✅ ОПТИМИЗАЦИЯ: Используем атомарные селекторы для минимизации ре-рендеров
  const notifications = useNotificationsSettings()
  const theme = useTheme()
  const synthRef = useRef(null)
  const isInitializedRef = useRef(false)

  // Инициализация Tone.js только при первом воспроизведении звука
  const initializeTone = useCallback(async () => {
    if (!isInitializedRef.current) {
      try {
        // Подавляем предупреждения Tone.js о AudioContext
        const originalWarn = console.warn
        console.warn = () => {}

        await Tone.start()
        isInitializedRef.current = true

        // Восстанавливаем console.warn
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

  /**
   * Воспроизводит звук
   * @param {string} soundName - название звука
   * @param {Object} options - опции воспроизведения
   */
  const playSound = useCallback(
    async (soundName, options = {}) => {
      // Инициализируем Tone.js при первом воспроизведении
      await initializeTone()

      // Создаем синтезатор при первом воспроизведении
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

        // Устанавливаем громкость из настроек
        const volume = notifications.volume || 80
        synthRef.current.volume.value = Tone.gainToDb(volume / 100)

        logger.log('🔊 Синтезатор создан при первом воспроизведении')
      }

      if (!notifications.sound || !synthRef.current || !isInitializedRef.current) {
        return
      }

      const { volume = notifications.volume || 80, duration = '8n', frequency = 'C4' } = options

      // Устанавливаем громкость
      synthRef.current.volume.value = Tone.gainToDb(volume / 100)

      try {
        // Проверяем, что синтезатор инициализирован
        if (!synthRef.current || !isInitializedRef.current) {
          logger.warn('⚠️ Синтезатор не инициализирован')
          return
        }

        // * Хелпер для безопасного воспроизведения звука с проверкой на null
        const safePlay = (frequency, duration, delay = 0) => {
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

        const sounds = {
          // Звуки таймера
          timerStart: () => {
            if (!synthRef.current) return
            safePlay('C5', '8n')
            safePlay('E5', '8n', 100)
            safePlay('G5', '8n', 200)
          },

          timerStop: () => {
            if (!synthRef.current) return
            safePlay('G5', '8n')
            safePlay('E5', '8n', 150)
            safePlay('C5', '8n', 300)
          },

          timerPause: () => {
            if (!synthRef.current) return
            safePlay('F4', '4n')
          },

          timerResume: () => {
            if (!synthRef.current) return
            safePlay('A4', '8n')
            safePlay('C5', '8n', 100)
          },

          // Звуки уведомлений
          success: () => {
            if (!synthRef.current) return
            safePlay('C5', '8n')
            safePlay('E5', '8n', 100)
            safePlay('G5', '8n', 200)
          },

          error: () => {
            if (!synthRef.current) return
            safePlay('C3', '4n')
            safePlay('B2', '4n', 200)
          },

          warning: () => {
            if (!synthRef.current) return
            safePlay('F4', '8n')
            safePlay('F4', '8n', 300)
          },

          info: () => {
            if (!synthRef.current) return
            safePlay('A4', '8n')
            safePlay('A4', '8n', 200)
          },

          // Звуки интерфейса
          click: () => {
            if (!synthRef.current) return
            safePlay('C5', '32n')
          },

          hover: () => {
            if (!synthRef.current) return
            safePlay('C6', '32n')
          },

          // Звуки работы
          newEntry: () => {
            if (!synthRef.current) return
            safePlay('C4', '16n')
            safePlay('E4', '16n', 50)
          },

          deleteEntry: () => {
            if (!synthRef.current) return
            safePlay('C3', '8n')
          },

          saveEntry: () => {
            if (!synthRef.current) return
            safePlay('G4', '8n')
            safePlay('C5', '8n', 100)
          },

          // Звуки достижений
          goalReached: () => {
            if (!synthRef.current) return
            safePlay('C5', '4n')
            safePlay('E5', '4n', 200)
            safePlay('G5', '4n', 400)
            safePlay('C6', '2n', 600)
          },

          milestone: () => {
            if (!synthRef.current) return
            safePlay('G4', '8n')
            safePlay('B4', '8n', 100)
            safePlay('D5', '8n', 200)
          },

          // Звуки уведомлений по времени
          hourlyAlert: () => {
            if (!synthRef.current) return
            safePlay('C5', '8n')
            safePlay('E5', '8n', 100)
            safePlay('G5', '8n', 200)
          },

          dailyGoal: () => {
            if (!synthRef.current) return
            safePlay('C5', '4n')
            safePlay('E5', '4n', 200)
            safePlay('G5', '4n', 400)
            safePlay('C6', '2n', 600)
          },

          // Новые типы звуков для периодических уведомлений
          chime: () => {
            if (!synthRef.current) return
            safePlay('E5', '8n')
            safePlay('C5', '8n', 200)
          },
          alert: () => {
            if (!synthRef.current) return
            safePlay('G5', '16n')
            safePlay('C6', '16n', 100)
          },
          phone: () => {
            if (!synthRef.current) return
            safePlay('C5', '4n')
            safePlay('E5', '4n', 500)
          },
          doorbell: () => {
            if (!synthRef.current) return
            safePlay('G4', '8n')
            safePlay('B4', '8n', 300)
            safePlay('D5', '8n', 600)
          },
          alarm: () => {
            if (!synthRef.current) return
            safePlay('A4', '16n')
            safePlay('A4', '16n', 200)
            safePlay('A4', '16n', 400)
          },
          notification: () => {
            if (!synthRef.current) return
            safePlay('F5', '8n')
            safePlay('A5', '8n', 200)
          },
          bell: () => {
            if (!synthRef.current) return
            safePlay('C6', '4n')
            safePlay('G5', '4n', 500)
          },
          beep: () => {
            if (!synthRef.current) return
            safePlay('C5', '8n')
          },
          ping: () => {
            if (!synthRef.current) return
            safePlay('E5', '16n')
            safePlay('G5', '16n', 100)
          },

          // Новые звуки для продуктивности и фокуса
          gentle: () => {
            if (!synthRef.current) return
            safePlay('D5', '8n')
            safePlay('F5', '8n', 150)
          },
          soft: () => {
            if (!synthRef.current) return
            safePlay('A4', '8n')
            safePlay('C5', '8n', 200)
          },
          zen: () => {
            if (!synthRef.current) return
            safePlay('G4', '4n')
            safePlay('B4', '4n', 300)
            safePlay('D5', '4n', 600)
          },
          focus: () => {
            if (!synthRef.current) return
            safePlay('C5', '16n')
            safePlay('E5', '16n', 100)
          },
          breeze: () => {
            if (!synthRef.current) return
            safePlay('F5', '16n')
            safePlay('A5', '16n', 80)
          },
          crystal: () => {
            if (!synthRef.current) return
            safePlay('E6', '32n')
            safePlay('G6', '32n', 50)
          },
          harmony: () => {
            if (!synthRef.current) return
            safePlay('C5', '8n')
            safePlay('E5', '8n', 100)
            safePlay('G5', '8n', 200)
          },
          whisper: () => {
            if (!synthRef.current) return
            safePlay('B4', '8n')
            safePlay('D5', '8n', 150)
          },
          bloom: () => {
            if (!synthRef.current) return
            safePlay('C4', '8n')
            safePlay('E4', '8n', 100)
            safePlay('G4', '8n', 200)
            safePlay('C5', '8n', 300)
          },

          // Звуки экспорта/импорта
          export: () => {
            if (!synthRef.current) return
            safePlay('C4', '8n')
            safePlay('E4', '8n', 100)
            safePlay('G4', '8n', 200)
          },

          import: () => {
            if (!synthRef.current) return
            safePlay('G4', '8n')
            safePlay('E4', '8n', 100)
            safePlay('C4', '8n', 200)
          },

          // Звуки настройки
          settingsChange: () => {
            if (!synthRef.current) return
            safePlay('A4', '16n')
          },

          themeChange: () => {
            if (!synthRef.current) return
            safePlay('F4', '8n')
            safePlay('A4', '8n', 100)
          },

          // Звуки завершения работы
          workComplete: () => {
            if (!synthRef.current) return
            safePlay('C4', '4n')
            safePlay('E4', '4n', 200)
            safePlay('G4', '4n', 400)
            safePlay('C5', '2n', 600)
          },

          // Звуки ошибок
          validationError: () => {
            if (!synthRef.current) return
            safePlay('C3', '8n')
            safePlay('B2', '8n', 100)
          },

          networkError: () => {
            if (!synthRef.current) return
            safePlay('C2', '4n')
            safePlay('C2', '4n', 200)
          },
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

  /**
   * Воспроизводит кастомный звук
   * @param {string} frequency - частота звука
   * @param {string} duration - длительность
   * @param {Object} options - опции
   */
  const playCustomSound = useCallback(
    (frequency, duration, options = {}) => {
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

  /**
   * Воспроизводит мелодию
   * @param {Array} notes - массив нот в формате [{frequency, duration, delay}]
   * @param {Object} options - опции
   */
  const playMelody = useCallback(
    (notes, options = {}) => {
      if (!notifications.sound || !synthRef.current || !isInitializedRef.current) {
        return
      }

      const { volume = notifications.volume || 80 } = options

      try {
        synthRef.current.volume.value = Tone.gainToDb(volume / 100)

        notes.forEach((note, index) => {
          const delay = note.delay || index * 100
          setTimeout(() => {
            synthRef.current.triggerAttackRelease(note.frequency, note.duration || '8n')
          }, delay)
        })

        logger.log(`🔊 Мелодия: ${notes.length} нот`)
      } catch (error) {
        logger.error('Ошибка воспроизведения мелодии:', error)
      }
    },
    [notifications.sound, notifications.volume]
  )

  /**
   * Останавливает все звуки
   */
  const stopAllSounds = useCallback(() => {
    try {
      if (synthRef.current) {
        synthRef.current.triggerRelease()
      }
      logger.log('🔊 Все звуки остановлены')
    } catch (error) {
      logger.error('Ошибка остановки звуков:', error)
    }
  }, [])

  /**
   * Устанавливает громкость
   * @param {number} volume - громкость от 0 до 100
   */
  const setVolume = useCallback(volume => {
    if (synthRef.current) {
      synthRef.current.volume.value = Tone.gainToDb(volume / 100)
      logger.log(`🔊 Громкость установлена: ${volume}%`)
    }
  }, [])

  /**
   * Получает текущую громкость
   * @returns {number} громкость от 0 до 100
   */
  const getVolume = useCallback(() => {
    if (synthRef.current) {
      return Tone.dbToGain(synthRef.current.volume.value) * 100
    }
    return 0
  }, [])

  /**
   * Проверяет, включены ли звуки
   * @returns {boolean} true если звуки включены
   */
  const isEnabled = useCallback(() => {
    return notifications.sound && isInitializedRef.current
  }, [notifications.sound])

  /**
   * Включает/выключает звуки
   * @param {boolean} enabled - включить звуки
   */
  const setEnabled = useCallback(enabled => {
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
