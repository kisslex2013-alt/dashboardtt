/**
 * 🎓 ПОЯСНЕНИЕ ДЛЯ НАЧИНАЮЩИХ:
 * 
 * Этот файл содержит утилиты для работы со звуками:
 * - Управление звуковыми уведомлениями
 * - Создание звуков с помощью Tone.js
 * - Настройка громкости и эффектов
 * - Предустановленные звуки для разных событий
 */

import * as Tone from 'tone';
import { logger } from './logger';

/**
 * Менеджер звуков для приложения
 */
class SoundManager {
  constructor() {
    this.isInitialized = false;
    this.isEnabled = true;
    this.volume = 0.8;
    this.sounds = {};
    this.currentSounds = new Map();
  }

  /**
   * Инициализирует звуковую систему
   * @returns {Promise} промис с результатом инициализации
   */
  async initialize() {
    if (this.isInitialized) return Promise.resolve();
    
    try {
      // Инициализируем Tone.js
      await Tone.start();
      
      // Создаем предустановленные звуки
      this.createPresetSounds();
      
      this.isInitialized = true;
      logger.log('🔊 SoundManager инициализирован');
      
      return Promise.resolve();
    } catch (error) {
      logger.error('Ошибка инициализации SoundManager:', error);
      return Promise.reject(error);
    }
  }

  /**
   * Создает предустановленные звуки
   */
  createPresetSounds() {
    // Звук успешного действия
    this.sounds.success = this.createSuccessSound();
    
    // Звук ошибки
    this.sounds.error = this.createErrorSound();
    
    // Звук предупреждения
    this.sounds.warning = this.createWarningSound();
    
    // Звук запуска таймера
    this.sounds.timerStart = this.createTimerStartSound();
    
    // Звук остановки таймера
    this.sounds.timerStop = this.createTimerStopSound();
    
    // Звук достижения цели
    this.sounds.goalReached = this.createGoalReachedSound();
    
    // Звук уведомления
    this.sounds.notification = this.createNotificationSound();
    
    // Звук клика
    this.sounds.click = this.createClickSound();
    
    // Звук завершения работы
    this.sounds.workComplete = this.createWorkCompleteSound();
  }

  /**
   * Создает звук успешного действия
   * @returns {Object} звук успеха
   */
  createSuccessSound() {
    const synth = new Tone.Synth({
      oscillator: {
        type: 'sine'
      },
      envelope: {
        attack: 0.1,
        decay: 0.2,
        sustain: 0.3,
        release: 0.4
      }
    }).toDestination();

    return {
      play: () => {
        if (!this.isEnabled) return;
        
        // Играем аккорд успеха
        synth.triggerAttackRelease('C5', '8n');
        setTimeout(() => synth.triggerAttackRelease('E5', '8n'), 100);
        setTimeout(() => synth.triggerAttackRelease('G5', '8n'), 200);
      },
      dispose: () => synth.dispose()
    };
  }

  /**
   * Создает звук ошибки
   * @returns {Object} звук ошибки
   */
  createErrorSound() {
    const synth = new Tone.Synth({
      oscillator: {
        type: 'sawtooth'
      },
      envelope: {
        attack: 0.01,
        decay: 0.3,
        sustain: 0.1,
        release: 0.2
      }
    }).toDestination();

    return {
      play: () => {
        if (!this.isEnabled) return;
        
        // Играем низкий звук ошибки
        synth.triggerAttackRelease('C3', '4n');
        setTimeout(() => synth.triggerAttackRelease('B2', '4n'), 200);
      },
      dispose: () => synth.dispose()
    };
  }

  /**
   * Создает звук предупреждения
   * @returns {Object} звук предупреждения
   */
  createWarningSound() {
    const synth = new Tone.Synth({
      oscillator: {
        type: 'triangle'
      },
      envelope: {
        attack: 0.05,
        decay: 0.2,
        sustain: 0.4,
        release: 0.3
      }
    }).toDestination();

    return {
      play: () => {
        if (!this.isEnabled) return;
        
        // Играем звук предупреждения
        synth.triggerAttackRelease('F4', '8n');
        setTimeout(() => synth.triggerAttackRelease('F4', '8n'), 300);
      },
      dispose: () => synth.dispose()
    };
  }

  /**
   * Создает звук запуска таймера
   * @returns {Object} звук запуска таймера
   */
  createTimerStartSound() {
    const synth = new Tone.Synth({
      oscillator: {
        type: 'sine'
      },
      envelope: {
        attack: 0.1,
        decay: 0.1,
        sustain: 0.2,
        release: 0.3
      }
    }).toDestination();

    return {
      play: () => {
        if (!this.isEnabled) return;
        
        // Играем восходящий звук
        synth.triggerAttackRelease('C4', '8n');
        setTimeout(() => synth.triggerAttackRelease('E4', '8n'), 150);
        setTimeout(() => synth.triggerAttackRelease('G4', '8n'), 300);
      },
      dispose: () => synth.dispose()
    };
  }

  /**
   * Создает звук остановки таймера
   * @returns {Object} звук остановки таймера
   */
  createTimerStopSound() {
    const synth = new Tone.Synth({
      oscillator: {
        type: 'sine'
      },
      envelope: {
        attack: 0.1,
        decay: 0.2,
        sustain: 0.1,
        release: 0.4
      }
    }).toDestination();

    return {
      play: () => {
        if (!this.isEnabled) return;
        
        // Играем нисходящий звук
        synth.triggerAttackRelease('G4', '8n');
        setTimeout(() => synth.triggerAttackRelease('E4', '8n'), 150);
        setTimeout(() => synth.triggerAttackRelease('C4', '8n'), 300);
      },
      dispose: () => synth.dispose()
    };
  }

  /**
   * Создает звук достижения цели
   * @returns {Object} звук достижения цели
   */
  createGoalReachedSound() {
    const synth = new Tone.Synth({
      oscillator: {
        type: 'sine'
      },
      envelope: {
        attack: 0.1,
        decay: 0.1,
        sustain: 0.3,
        release: 0.5
      }
    }).toDestination();

    return {
      play: () => {
        if (!this.isEnabled) return;
        
        // Играем праздничный звук
        synth.triggerAttackRelease('C5', '4n');
        setTimeout(() => synth.triggerAttackRelease('E5', '4n'), 200);
        setTimeout(() => synth.triggerAttackRelease('G5', '4n'), 400);
        setTimeout(() => synth.triggerAttackRelease('C6', '2n'), 600);
      },
      dispose: () => synth.dispose()
    };
  }

  /**
   * Создает звук уведомления
   * @returns {Object} звук уведомления
   */
  createNotificationSound() {
    const synth = new Tone.Synth({
      oscillator: {
        type: 'sine'
      },
      envelope: {
        attack: 0.05,
        decay: 0.1,
        sustain: 0.2,
        release: 0.3
      }
    }).toDestination();

    return {
      play: () => {
        if (!this.isEnabled) return;
        
        // Играем короткий звук уведомления
        synth.triggerAttackRelease('A4', '8n');
        setTimeout(() => synth.triggerAttackRelease('A4', '8n'), 200);
      },
      dispose: () => synth.dispose()
    };
  }

  /**
   * Создает звук клика
   * @returns {Object} звук клика
   */
  createClickSound() {
    const synth = new Tone.Synth({
      oscillator: {
        type: 'sine'
      },
      envelope: {
        attack: 0.01,
        decay: 0.05,
        sustain: 0.01,
        release: 0.1
      }
    }).toDestination();

    return {
      play: () => {
        if (!this.isEnabled) return;
        
        // Играем короткий звук клика
        synth.triggerAttackRelease('C5', '32n');
      },
      dispose: () => synth.dispose()
    };
  }

  /**
   * Создает звук завершения работы
   * @returns {Object} звук завершения работы
   */
  createWorkCompleteSound() {
    const synth = new Tone.Synth({
      oscillator: {
        type: 'sine'
      },
      envelope: {
        attack: 0.1,
        decay: 0.2,
        sustain: 0.3,
        release: 0.6
      }
    }).toDestination();

    return {
      play: () => {
        if (!this.isEnabled) return;
        
        // Играем завершающий аккорд
        synth.triggerAttackRelease('C4', '4n');
        setTimeout(() => synth.triggerAttackRelease('E4', '4n'), 200);
        setTimeout(() => synth.triggerAttackRelease('G4', '4n'), 400);
        setTimeout(() => synth.triggerAttackRelease('C5', '2n'), 600);
      },
      dispose: () => synth.dispose()
    };
  }

  /**
   * Воспроизводит звук
   * @param {string} soundName - название звука
   * @param {Object} options - опции воспроизведения
   */
  playSound(soundName, options = {}) {
    if (!this.isInitialized) {
      logger.warn('SoundManager не инициализирован');
      return;
    }

    if (!this.isEnabled) return;

    const sound = this.sounds[soundName];
    if (!sound) {
      logger.warn(`Звук '${soundName}' не найден`);
      return;
    }

    try {
      // Устанавливаем громкость
      const volume = options.volume !== undefined ? options.volume : this.volume;
      Tone.Destination.volume.value = Tone.gainToDb(volume);

      // Воспроизводим звук
      sound.play();

      // Логируем воспроизведение
      if (options.log !== false) {
        logger.log(`🔊 Воспроизведен звук: ${soundName}`);
      }
    } catch (error) {
      logger.error(`Ошибка воспроизведения звука '${soundName}':`, error);
    }
  }

  /**
   * Создает кастомный звук
   * @param {string} name - название звука
   * @param {Object} config - конфигурация звука
   * @returns {Object} созданный звук
   */
  createCustomSound(name, config) {
    const synth = new Tone.Synth(config.synth || {
      oscillator: {
        type: 'sine'
      },
      envelope: {
        attack: 0.1,
        decay: 0.2,
        sustain: 0.3,
        release: 0.4
      }
    }).toDestination();

    const sound = {
      play: () => {
        if (!this.isEnabled) return;
        
        if (config.notes && Array.isArray(config.notes)) {
          config.notes.forEach((note, index) => {
            setTimeout(() => {
              synth.triggerAttackRelease(note.note, note.duration || '8n');
            }, note.delay || index * 100);
          });
        } else {
          synth.triggerAttackRelease(config.note || 'C4', config.duration || '8n');
        }
      },
      dispose: () => synth.dispose()
    };

    this.sounds[name] = sound;
    return sound;
  }

  /**
   * Включает или выключает звуки
   * @param {boolean} enabled - включить звуки
   */
  setEnabled(enabled) {
    this.isEnabled = enabled;
    logger.log(`🔊 Звуки ${enabled ? 'включены' : 'выключены'}`);
  }

  /**
   * Устанавливает громкость
   * @param {number} volume - громкость от 0 до 1
   */
  setVolume(volume) {
    this.volume = Math.max(0, Math.min(1, volume));
    Tone.Destination.volume.value = Tone.gainToDb(this.volume);
    logger.log(`🔊 Громкость установлена: ${Math.round(this.volume * 100)}%`);
  }

  /**
   * Получает текущую громкость
   * @returns {number} текущая громкость
   */
  getVolume() {
    return this.volume;
  }

  /**
   * Проверяет, включены ли звуки
   * @returns {boolean} true если звуки включены
   */
  isSoundEnabled() {
    return this.isEnabled;
  }

  /**
   * Получает список доступных звуков
   * @returns {Array} список названий звуков
   */
  getAvailableSounds() {
    return Object.keys(this.sounds);
  }

  /**
   * Останавливает все звуки
   */
  stopAllSounds() {
    try {
      Tone.Transport.stop();
      Tone.Transport.cancel();
      logger.log('🔊 Все звуки остановлены');
    } catch (error) {
      logger.error('Ошибка остановки звуков:', error);
    }
  }

  /**
   * Освобождает ресурсы
   */
  dispose() {
    try {
      // Останавливаем все звуки
      this.stopAllSounds();
      
      // Освобождаем ресурсы каждого звука
      Object.values(this.sounds).forEach(sound => {
        if (sound.dispose) {
          sound.dispose();
        }
      });
      
      // Очищаем коллекции
      this.sounds = {};
      this.currentSounds.clear();
      
      this.isInitialized = false;
      logger.log('🔊 SoundManager освобожден');
    } catch (error) {
      logger.error('Ошибка освобождения SoundManager:', error);
    }
  }
}

// Создаем единственный экземпляр SoundManager
const soundManager = new SoundManager();

/**
 * Экспортируем функции для удобства использования
 */

/**
 * Инициализирует звуковую систему
 * @returns {Promise} промис с результатом инициализации
 */
export async function initializeSounds() {
  return await soundManager.initialize();
}

/**
 * Воспроизводит звук
 * @param {string} soundName - название звука
 * @param {Object} options - опции воспроизведения
 */
export function playSound(soundName, options = {}) {
  soundManager.playSound(soundName, options);
}

/**
 * Воспроизводит звук успеха
 * @param {Object} options - опции воспроизведения
 */
export function playSuccessSound(options = {}) {
  soundManager.playSound('success', options);
}

/**
 * Воспроизводит звук ошибки
 * @param {Object} options - опции воспроизведения
 */
export function playErrorSound(options = {}) {
  soundManager.playSound('error', options);
}

/**
 * Воспроизводит звук предупреждения
 * @param {Object} options - опции воспроизведения
 */
export function playWarningSound(options = {}) {
  soundManager.playSound('warning', options);
}

/**
 * Воспроизводит звук запуска таймера
 * @param {Object} options - опции воспроизведения
 */
export function playTimerStartSound(options = {}) {
  soundManager.playSound('timerStart', options);
}

/**
 * Воспроизводит звук остановки таймера
 * @param {Object} options - опции воспроизведения
 */
export function playTimerStopSound(options = {}) {
  soundManager.playSound('timerStop', options);
}

/**
 * Воспроизводит звук достижения цели
 * @param {Object} options - опции воспроизведения
 */
export function playGoalReachedSound(options = {}) {
  soundManager.playSound('goalReached', options);
}

/**
 * Воспроизводит звук уведомления
 * @param {Object} options - опции воспроизведения
 */
export function playNotificationSound(options = {}) {
  soundManager.playSound('notification', options);
}

/**
 * Воспроизводит звук клика
 * @param {Object} options - опции воспроизведения
 */
export function playClickSound(options = {}) {
  soundManager.playSound('click', options);
}

/**
 * Воспроизводит звук завершения работы
 * @param {Object} options - опции воспроизведения
 */
export function playWorkCompleteSound(options = {}) {
  soundManager.playSound('workComplete', options);
}

/**
 * Включает или выключает звуки
 * @param {boolean} enabled - включить звуки
 */
export function setSoundsEnabled(enabled) {
  soundManager.setEnabled(enabled);
}

/**
 * Устанавливает громкость
 * @param {number} volume - громкость от 0 до 1
 */
export function setSoundVolume(volume) {
  soundManager.setVolume(volume);
}

/**
 * Получает текущую громкость
 * @returns {number} текущая громкость
 */
export function getSoundVolume() {
  return soundManager.getVolume();
}

/**
 * Проверяет, включены ли звуки
 * @returns {boolean} true если звуки включены
 */
export function areSoundsEnabled() {
  return soundManager.isSoundEnabled();
}

/**
 * Получает список доступных звуков
 * @returns {Array} список названий звуков
 */
export function getAvailableSounds() {
  return soundManager.getAvailableSounds();
}

/**
 * Останавливает все звуки
 */
export function stopAllSounds() {
  soundManager.stopAllSounds();
}

/**
 * Создает кастомный звук
 * @param {string} name - название звука
 * @param {Object} config - конфигурация звука
 * @returns {Object} созданный звук
 */
export function createCustomSound(name, config) {
  return soundManager.createCustomSound(name, config);
}

/**
 * Освобождает ресурсы звуковой системы
 */
export function disposeSounds() {
  soundManager.dispose();
}

/**
 * Экспортируем экземпляр SoundManager для прямого доступа
 */
export { soundManager };
