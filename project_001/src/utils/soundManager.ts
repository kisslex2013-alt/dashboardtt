/**
 * 🎓 ПОЯСНЕНИЕ ДЛЯ НАЧИНАЮЩИХ:
 *
 * Этот файл содержит утилиты для работы со звуками:
 * - Управление звуковыми уведомлениями
 * - Создание звуков с помощью Tone.js
 * - Настройка громкости и эффектов
 * - Предустановленные звуки для разных событий
 */

import * as Tone from 'tone'
import { logger } from './logger'

/**
 * Интерфейс для звука
 */
interface Sound {
  play: () => void
  dispose: () => void
}

/**
 * Опции воспроизведения звука
 */
interface PlaySoundOptions {
  volume?: number
  log?: boolean
}

/**
 * Конфигурация кастомного звука
 */
interface CustomSoundConfig {
  synth?: any
  note?: string
  duration?: string
  notes?: Array<{
    note: string
    duration?: string
    delay?: number
  }>
}

/**
 * Менеджер звуков для приложения
 */
class SoundManager {
  private isInitialized: boolean = false
  private isEnabled: boolean = true
  private volume: number = 0.8
  private sounds: Record<string, Sound> = {}
  private currentSounds: Map<string, Sound> = new Map()

  /**
   * Инициализирует звуковую систему
   */
  async initialize(): Promise<void> {
    if (this.isInitialized) return Promise.resolve()

    try {
      // Инициализируем Tone.js
      await Tone.start()

      // Создаем предустановленные звуки
      this.createPresetSounds()

      this.isInitialized = true
      logger.log('🔊 SoundManager инициализирован')

      return Promise.resolve()
    } catch (error) {
      logger.error('Ошибка инициализации SoundManager:', error)
      return Promise.reject(error)
    }
  }

  /**
   * Создает предустановленные звуки
   */
  private createPresetSounds(): void {
    // Звук успешного действия
    this.sounds.success = this.createSuccessSound()

    // Звук ошибки
    this.sounds.error = this.createErrorSound()

    // Звук предупреждения
    this.sounds.warning = this.createWarningSound()

    // Звук запуска таймера
    this.sounds.timerStart = this.createTimerStartSound()

    // Звук остановки таймера
    this.sounds.timerStop = this.createTimerStopSound()

    // Звук достижения цели
    this.sounds.goalReached = this.createGoalReachedSound()

    // Звук уведомления
    this.sounds.notification = this.createNotificationSound()

    // Звук клика
    this.sounds.click = this.createClickSound()

    // Звук завершения работы
    this.sounds.workComplete = this.createWorkCompleteSound()
  }

  /**
   * Создает звук успешного действия
   */
  private createSuccessSound(): Sound {
    const synth = new Tone.Synth({
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

    return {
      play: () => {
        if (!this.isEnabled) return

        // Играем аккорд успеха
        synth.triggerAttackRelease('C5', '8n')
        setTimeout(() => synth.triggerAttackRelease('E5', '8n'), 100)
        setTimeout(() => synth.triggerAttackRelease('G5', '8n'), 200)
      },
      dispose: () => synth.dispose(),
    }
  }

  /**
   * Создает звук ошибки
   */
  private createErrorSound(): Sound {
    const synth = new Tone.Synth({
      oscillator: {
        type: 'sawtooth',
      },
      envelope: {
        attack: 0.01,
        decay: 0.3,
        sustain: 0.1,
        release: 0.2,
      },
    }).toDestination()

    return {
      play: () => {
        if (!this.isEnabled) return

        // Играем низкий звук ошибки
        synth.triggerAttackRelease('C3', '4n')
        setTimeout(() => synth.triggerAttackRelease('B2', '4n'), 200)
      },
      dispose: () => synth.dispose(),
    }
  }

  /**
   * Создает звук предупреждения
   */
  private createWarningSound(): Sound {
    const synth = new Tone.Synth({
      oscillator: {
        type: 'triangle',
      },
      envelope: {
        attack: 0.05,
        decay: 0.2,
        sustain: 0.4,
        release: 0.3,
      },
    }).toDestination()

    return {
      play: () => {
        if (!this.isEnabled) return

        // Играем звук предупреждения
        synth.triggerAttackRelease('F4', '8n')
        setTimeout(() => synth.triggerAttackRelease('F4', '8n'), 300)
      },
      dispose: () => synth.dispose(),
    }
  }

  /**
   * Создает звук запуска таймера
   */
  private createTimerStartSound(): Sound {
    const synth = new Tone.Synth({
      oscillator: {
        type: 'sine',
      },
      envelope: {
        attack: 0.1,
        decay: 0.1,
        sustain: 0.2,
        release: 0.3,
      },
    }).toDestination()

    return {
      play: () => {
        if (!this.isEnabled) return

        // Играем восходящий звук
        synth.triggerAttackRelease('C4', '8n')
        setTimeout(() => synth.triggerAttackRelease('E4', '8n'), 150)
        setTimeout(() => synth.triggerAttackRelease('G4', '8n'), 300)
      },
      dispose: () => synth.dispose(),
    }
  }

  /**
   * Создает звук остановки таймера
   */
  private createTimerStopSound(): Sound {
    const synth = new Tone.Synth({
      oscillator: {
        type: 'sine',
      },
      envelope: {
        attack: 0.1,
        decay: 0.2,
        sustain: 0.1,
        release: 0.4,
      },
    }).toDestination()

    return {
      play: () => {
        if (!this.isEnabled) return

        // Играем нисходящий звук
        synth.triggerAttackRelease('G4', '8n')
        setTimeout(() => synth.triggerAttackRelease('E4', '8n'), 150)
        setTimeout(() => synth.triggerAttackRelease('C4', '8n'), 300)
      },
      dispose: () => synth.dispose(),
    }
  }

  /**
   * Создает звук достижения цели
   */
  private createGoalReachedSound(): Sound {
    const synth = new Tone.Synth({
      oscillator: {
        type: 'sine',
      },
      envelope: {
        attack: 0.1,
        decay: 0.1,
        sustain: 0.3,
        release: 0.5,
      },
    }).toDestination()

    return {
      play: () => {
        if (!this.isEnabled) return

        // Играем праздничный звук
        synth.triggerAttackRelease('C5', '4n')
        setTimeout(() => synth.triggerAttackRelease('E5', '4n'), 200)
        setTimeout(() => synth.triggerAttackRelease('G5', '4n'), 400)
        setTimeout(() => synth.triggerAttackRelease('C6', '2n'), 600)
      },
      dispose: () => synth.dispose(),
    }
  }

  /**
   * Создает звук уведомления
   */
  private createNotificationSound(): Sound {
    const synth = new Tone.Synth({
      oscillator: {
        type: 'sine',
      },
      envelope: {
        attack: 0.05,
        decay: 0.1,
        sustain: 0.2,
        release: 0.3,
      },
    }).toDestination()

    return {
      play: () => {
        if (!this.isEnabled) return

        // Играем короткий звук уведомления
        synth.triggerAttackRelease('A4', '8n')
        setTimeout(() => synth.triggerAttackRelease('A4', '8n'), 200)
      },
      dispose: () => synth.dispose(),
    }
  }

  /**
   * Создает звук клика
   */
  private createClickSound(): Sound {
    const synth = new Tone.Synth({
      oscillator: {
        type: 'sine',
      },
      envelope: {
        attack: 0.01,
        decay: 0.05,
        sustain: 0.01,
        release: 0.1,
      },
    }).toDestination()

    return {
      play: () => {
        if (!this.isEnabled) return

        // Играем короткий звук клика
        synth.triggerAttackRelease('C5', '32n')
      },
      dispose: () => synth.dispose(),
    }
  }

  /**
   * Создает звук завершения работы
   */
  private createWorkCompleteSound(): Sound {
    const synth = new Tone.Synth({
      oscillator: {
        type: 'sine',
      },
      envelope: {
        attack: 0.1,
        decay: 0.2,
        sustain: 0.3,
        release: 0.6,
      },
    }).toDestination()

    return {
      play: () => {
        if (!this.isEnabled) return

        // Играем завершающий аккорд
        synth.triggerAttackRelease('C4', '4n')
        setTimeout(() => synth.triggerAttackRelease('E4', '4n'), 200)
        setTimeout(() => synth.triggerAttackRelease('G4', '4n'), 400)
        setTimeout(() => synth.triggerAttackRelease('C5', '2n'), 600)
      },
      dispose: () => synth.dispose(),
    }
  }

  /**
   * Воспроизводит звук
   */
  playSound(soundName: string, options: PlaySoundOptions = {}): void {
    if (!this.isInitialized) {
      logger.warn('SoundManager не инициализирован')
      return
    }

    if (!this.isEnabled) return

    const sound = this.sounds[soundName]
    if (!sound) {
      logger.warn(`Звук '${soundName}' не найден`)
      return
    }

    try {
      // Устанавливаем громкость
      const volume = options.volume !== undefined ? options.volume : this.volume
      Tone.Destination.volume.value = Tone.gainToDb(volume)

      // Воспроизводим звук
      sound.play()

      // Логируем воспроизведение
      if (options.log !== false) {
        logger.log(`🔊 Воспроизведен звук: ${soundName}`)
      }
    } catch (error) {
      logger.error(`Ошибка воспроизведения звука '${soundName}':`, error)
    }
  }

  /**
   * Создает кастомный звук
   */
  createCustomSound(name: string, config: CustomSoundConfig): Sound {
    const synth = new Tone.Synth(
      config.synth || {
        oscillator: {
          type: 'sine',
        },
        envelope: {
          attack: 0.1,
          decay: 0.2,
          sustain: 0.3,
          release: 0.4,
        },
      }
    ).toDestination()

    const sound: Sound = {
      play: () => {
        if (!this.isEnabled) return

        if (config.notes && Array.isArray(config.notes)) {
          config.notes.forEach((note, index) => {
            setTimeout(
              () => {
                synth.triggerAttackRelease(note.note, note.duration || '8n')
              },
              note.delay || index * 100
            )
          })
        } else {
          synth.triggerAttackRelease(config.note || 'C4', config.duration || '8n')
        }
      },
      dispose: () => synth.dispose(),
    }

    this.sounds[name] = sound
    return sound
  }

  /**
   * Включает или выключает звуки
   */
  setEnabled(enabled: boolean): void {
    this.isEnabled = enabled
    logger.log(`🔊 Звуки ${enabled ? 'включены' : 'выключены'}`)
  }

  /**
   * Устанавливает громкость
   */
  setVolume(volume: number): void {
    this.volume = Math.max(0, Math.min(1, volume))
    Tone.Destination.volume.value = Tone.gainToDb(this.volume)
    logger.log(`🔊 Громкость установлена: ${Math.round(this.volume * 100)}%`)
  }

  /**
   * Получает текущую громкость
   */
  getVolume(): number {
    return this.volume
  }

  /**
   * Проверяет, включены ли звуки
   */
  isSoundEnabled(): boolean {
    return this.isEnabled
  }

  /**
   * Получает список доступных звуков
   */
  getAvailableSounds(): string[] {
    return Object.keys(this.sounds)
  }

  /**
   * Останавливает все звуки
   */
  stopAllSounds(): void {
    try {
      Tone.Transport.stop()
      Tone.Transport.cancel()
      logger.log('🔊 Все звуки остановлены')
    } catch (error) {
      logger.error('Ошибка остановки звуков:', error)
    }
  }

  /**
   * Освобождает ресурсы
   */
  dispose(): void {
    try {
      // Останавливаем все звуки
      this.stopAllSounds()

      // Освобождаем ресурсы каждого звука
      Object.values(this.sounds).forEach(sound => {
        if (sound.dispose) {
          sound.dispose()
        }
      })

      // Очищаем коллекции
      this.sounds = {}
      this.currentSounds.clear()

      this.isInitialized = false
      logger.log('🔊 SoundManager освобожден')
    } catch (error) {
      logger.error('Ошибка освобождения SoundManager:', error)
    }
  }
}

// Создаем единственный экземпляр SoundManager
const soundManager = new SoundManager()

/**
 * Экспортируем функции для удобства использования
 */

/**
 * Инициализирует звуковую систему и создает предустановленные звуки
 *
 * @returns {Promise<void>} Промис, который резолвится после инициализации
 *
 * @example
 * ```ts
 * await initializeSounds()
 * // Теперь можно использовать звуки
 * ```
 */
export async function initializeSounds(): Promise<void> {
  return await soundManager.initialize()
}

/**
 * Воспроизводит звук по имени
 *
 * @param {string} soundName - Название звука ('success', 'error', 'warning', 'timerStart', 'timerStop', 'goalReached', 'notification', 'click', 'workComplete')
 * @param {PlaySoundOptions} options - Опции воспроизведения (volume, log)
 *
 * @example
 * ```ts
 * playSound('success', { volume: 0.8 })
 * ```
 */
export function playSound(soundName: string, options: PlaySoundOptions = {}): void {
  soundManager.playSound(soundName, options)
}

/**
 * Воспроизводит звук успешного действия (аккорд C-E-G)
 *
 * @param {PlaySoundOptions} options - Опции воспроизведения
 *
 * @example
 * ```ts
 * playSuccessSound({ volume: 0.9 })
 * ```
 */
export function playSuccessSound(options: PlaySoundOptions = {}): void {
  soundManager.playSound('success', options)
}

/**
 * Воспроизводит звук ошибки (низкие ноты C3-B2)
 *
 * @param {PlaySoundOptions} options - Опции воспроизведения
 *
 * @example
 * ```ts
 * playErrorSound()
 * ```
 */
export function playErrorSound(options: PlaySoundOptions = {}): void {
  soundManager.playSound('error', options)
}

/**
 * Воспроизводит звук предупреждения (F4 дважды)
 *
 * @param {PlaySoundOptions} options - Опции воспроизведения
 *
 * @example
 * ```ts
 * playWarningSound()
 * ```
 */
export function playWarningSound(options: PlaySoundOptions = {}): void {
  soundManager.playSound('warning', options)
}

/**
 * Воспроизводит звук запуска таймера
 *
 * @param {PlaySoundOptions} options - Опции воспроизведения
 *
 * @example
 * ```ts
 * playTimerStartSound()
 * ```
 */
export function playTimerStartSound(options: PlaySoundOptions = {}): void {
  soundManager.playSound('timerStart', options)
}

/**
 * Воспроизводит звук остановки таймера
 *
 * @param {PlaySoundOptions} options - Опции воспроизведения
 *
 * @example
 * ```ts
 * playTimerStopSound()
 * ```
 */
export function playTimerStopSound(options: PlaySoundOptions = {}): void {
  soundManager.playSound('timerStop', options)
}

/**
 * Воспроизводит звук достижения цели
 *
 * @param {PlaySoundOptions} options - Опции воспроизведения
 *
 * @example
 * ```ts
 * playGoalReachedSound()
 * ```
 */
export function playGoalReachedSound(options: PlaySoundOptions = {}): void {
  soundManager.playSound('goalReached', options)
}

/**
 * Воспроизводит звук уведомления
 *
 * @param {PlaySoundOptions} options - Опции воспроизведения
 *
 * @example
 * ```ts
 * playNotificationSound()
 * ```
 */
export function playNotificationSound(options: PlaySoundOptions = {}): void {
  soundManager.playSound('notification', options)
}

/**
 * Воспроизводит звук клика
 *
 * @param {PlaySoundOptions} options - Опции воспроизведения
 *
 * @example
 * ```ts
 * playClickSound()
 * ```
 */
export function playClickSound(options: PlaySoundOptions = {}): void {
  soundManager.playSound('click', options)
}

/**
 * Воспроизводит звук завершения работы
 *
 * @param {PlaySoundOptions} options - Опции воспроизведения
 *
 * @example
 * ```ts
 * playWorkCompleteSound()
 * ```
 */
export function playWorkCompleteSound(options: PlaySoundOptions = {}): void {
  soundManager.playSound('workComplete', options)
}

/**
 * Включает или выключает звуки глобально
 *
 * @param {boolean} enabled - true для включения, false для выключения
 *
 * @example
 * ```ts
 * setSoundsEnabled(false) // Выключить все звуки
 * ```
 */
export function setSoundsEnabled(enabled: boolean): void {
  soundManager.setEnabled(enabled)
}

/**
 * Устанавливает громкость всех звуков
 *
 * @param {number} volume - Громкость от 0 до 1 (0.8 по умолчанию)
 *
 * @example
 * ```ts
 * setSoundVolume(0.5) // Установить громкость на 50%
 * ```
 */
export function setSoundVolume(volume: number): void {
  soundManager.setVolume(volume)
}

/**
 * Получает текущую громкость звуков
 *
 * @returns {number} Текущая громкость от 0 до 1
 *
 * @example
 * ```ts
 * const currentVolume = getSoundVolume()
 * ```
 */
export function getSoundVolume(): number {
  return soundManager.getVolume()
}

/**
 * Проверяет, включены ли звуки
 *
 * @returns {boolean} true если звуки включены, false если выключены
 *
 * @example
 * ```ts
 * if (areSoundsEnabled()) {
 *   playSuccessSound()
 * }
 * ```
 */
export function areSoundsEnabled(): boolean {
  return soundManager.isSoundEnabled()
}

/**
 * Получает список всех доступных звуков
 *
 * @returns {string[]} Массив названий доступных звуков
 *
 * @example
 * ```ts
 * const sounds = getAvailableSounds()
 * // ['success', 'error', 'warning', ...]
 * ```
 */
export function getAvailableSounds(): string[] {
  return soundManager.getAvailableSounds()
}

/**
 * Останавливает все воспроизводимые в данный момент звуки
 *
 * @example
 * ```ts
 * stopAllSounds() // Остановить все звуки
 * ```
 */
export function stopAllSounds(): void {
  soundManager.stopAllSounds()
}

/**
 * Создает кастомный звук с заданной конфигурацией
 *
 * @param {string} name - Название звука
 * @param {CustomSoundConfig} config - Конфигурация звука (synth, note, duration, notes)
 * @returns {Sound} Объект звука с методами play() и dispose()
 *
 * @example
 * ```ts
 * const customSound = createCustomSound('mySound', {
 *   note: 'C4',
 *   duration: '8n'
 * })
 * customSound.play()
 * ```
 */
export function createCustomSound(name: string, config: CustomSoundConfig): Sound {
  return soundManager.createCustomSound(name, config)
}

/**
 * Освобождает все ресурсы звуковой системы
 * Вызывайте при размонтировании компонента или закрытии приложения
 *
 * @example
 * ```ts
 * disposeSounds() // Освободить ресурсы
 * ```
 */
export function disposeSounds(): void {
  soundManager.dispose()
}

/**
 * Экспортируем экземпляр SoundManager для прямого доступа
 */
export { soundManager }

