/**
 * 🎓 ПОЯСНЕНИЕ ДЛЯ НАЧИНАЮЩИХ:
 * 
 * Этот хук упрощает работу со звуками:
 * - Интегрируется с настройками приложения
 * - Использует Tone.js для генерации звуков
 * - Предоставляет предустановленные звуки
 * - Автоматически управляет громкостью
 */

import { useRef, useEffect, useCallback } from 'react';
import * as Tone from 'tone';
import { useSettingsStore } from '../store/useSettingsStore';
import { logger } from '../utils/logger';

/**
 * Хук для управления звуками
 * @returns {Object} объект с методами для воспроизведения звуков
 */
export function useSoundManager() {
  const { notifications, theme } = useSettingsStore();
  const synthRef = useRef(null);
  const isInitializedRef = useRef(false);
  
  // Инициализация Tone.js только при первом воспроизведении звука
  const initializeTone = useCallback(async () => {
    if (!isInitializedRef.current) {
      try {
        // Подавляем предупреждения Tone.js о AudioContext
        const originalWarn = console.warn;
        console.warn = () => {};
        
        await Tone.start();
        isInitializedRef.current = true;
        
        // Восстанавливаем console.warn
        console.warn = originalWarn;
        
        logger.log('🔊 Tone.js инициализирован');
      } catch (error) {
        logger.error('Ошибка инициализации Tone.js:', error);
      }
    }
  }, []);

  useEffect(() => {
    return () => {
      if (synthRef.current) {
        synthRef.current.dispose();
        synthRef.current = null;
      }
    };
  }, []);
  
  /**
   * Воспроизводит звук
   * @param {string} soundName - название звука
   * @param {Object} options - опции воспроизведения
   */
  const playSound = useCallback(async (soundName, options = {}) => {
    // Инициализируем Tone.js при первом воспроизведении
    await initializeTone();
    
    // Создаем синтезатор при первом воспроизведении
    if (!synthRef.current) {
      synthRef.current = new Tone.Synth({
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
      
      // Устанавливаем громкость из настроек
      const volume = notifications.volume || 80;
      synthRef.current.volume.value = Tone.gainToDb(volume / 100);
      
      logger.log('🔊 Синтезатор создан при первом воспроизведении');
    }
    
    if (!notifications.sound || !synthRef.current || !isInitializedRef.current) {
      return;
    }
    
    const {
      volume = notifications.volume || 80,
      duration = '8n',
      frequency = 'C4',
    } = options;
    
    // Устанавливаем громкость
    synthRef.current.volume.value = Tone.gainToDb(volume / 100);
    
    try {
      // Проверяем, что синтезатор инициализирован
      if (!synthRef.current || !isInitializedRef.current) {
        logger.warn('⚠️ Синтезатор не инициализирован');
        return;
      }
      
      const sounds = {
        // Звуки таймера
        timerStart: () => {
          synthRef.current.triggerAttackRelease('C5', '8n');
          setTimeout(() => synthRef.current.triggerAttackRelease('E5', '8n'), 100);
          setTimeout(() => synthRef.current.triggerAttackRelease('G5', '8n'), 200);
        },
        
        timerStop: () => {
          synthRef.current.triggerAttackRelease('G5', '8n');
          setTimeout(() => synthRef.current.triggerAttackRelease('E5', '8n'), 150);
          setTimeout(() => synthRef.current.triggerAttackRelease('C5', '8n'), 300);
        },
        
        timerPause: () => {
          synthRef.current.triggerAttackRelease('F4', '4n');
        },
        
        timerResume: () => {
          synthRef.current.triggerAttackRelease('A4', '8n');
          setTimeout(() => synthRef.current.triggerAttackRelease('C5', '8n'), 100);
        },
        
        // Звуки уведомлений
        success: () => {
          synthRef.current.triggerAttackRelease('C5', '8n');
          setTimeout(() => synthRef.current.triggerAttackRelease('E5', '8n'), 100);
          setTimeout(() => synthRef.current.triggerAttackRelease('G5', '8n'), 200);
        },
        
        error: () => {
          synthRef.current.triggerAttackRelease('C3', '4n');
          setTimeout(() => synthRef.current.triggerAttackRelease('B2', '4n'), 200);
        },
        
        warning: () => {
          synthRef.current.triggerAttackRelease('F4', '8n');
          setTimeout(() => synthRef.current.triggerAttackRelease('F4', '8n'), 300);
        },
        
        info: () => {
          synthRef.current.triggerAttackRelease('A4', '8n');
          setTimeout(() => synthRef.current.triggerAttackRelease('A4', '8n'), 200);
        },
        
        // Звуки интерфейса
        click: () => {
          synthRef.current.triggerAttackRelease('C5', '32n');
        },
        
        hover: () => {
          synthRef.current.triggerAttackRelease('C6', '32n');
        },
        
        // Звуки работы
        newEntry: () => {
          synthRef.current.triggerAttackRelease('C4', '16n');
          setTimeout(() => synthRef.current.triggerAttackRelease('E4', '16n'), 50);
        },
        
        deleteEntry: () => {
          synthRef.current.triggerAttackRelease('C3', '8n');
        },
        
        saveEntry: () => {
          synthRef.current.triggerAttackRelease('G4', '8n');
          setTimeout(() => synthRef.current.triggerAttackRelease('C5', '8n'), 100);
        },
        
        // Звуки достижений
        goalReached: () => {
          synthRef.current.triggerAttackRelease('C5', '4n');
          setTimeout(() => synthRef.current.triggerAttackRelease('E5', '4n'), 200);
          setTimeout(() => synthRef.current.triggerAttackRelease('G5', '4n'), 400);
          setTimeout(() => synthRef.current.triggerAttackRelease('C6', '2n'), 600);
        },
        
        milestone: () => {
          synthRef.current.triggerAttackRelease('G4', '8n');
          setTimeout(() => synthRef.current.triggerAttackRelease('B4', '8n'), 100);
          setTimeout(() => synthRef.current.triggerAttackRelease('D5', '8n'), 200);
        },
        
        // Звуки уведомлений по времени
        hourlyAlert: () => {
          synthRef.current.triggerAttackRelease('C5', '8n');
          setTimeout(() => synthRef.current.triggerAttackRelease('E5', '8n'), 100);
          setTimeout(() => synthRef.current.triggerAttackRelease('G5', '8n'), 200);
        },
        
        dailyGoal: () => {
          synthRef.current.triggerAttackRelease('C5', '4n');
          setTimeout(() => synthRef.current.triggerAttackRelease('E5', '4n'), 200);
          setTimeout(() => synthRef.current.triggerAttackRelease('G5', '4n'), 400);
          setTimeout(() => synthRef.current.triggerAttackRelease('C6', '2n'), 600);
        },
        
        // Новые типы звуков для периодических уведомлений
        chime: () => {
          synthRef.current.triggerAttackRelease("E5", "8n", Tone.now());
          synthRef.current.triggerAttackRelease("C5", "8n", Tone.now() + 0.2);
        },
        alert: () => {
          synthRef.current.triggerAttackRelease("G5", "16n", Tone.now());
          synthRef.current.triggerAttackRelease("C6", "16n", Tone.now() + 0.1);
        },
        phone: () => {
          synthRef.current.triggerAttackRelease("C5", "4n", Tone.now());
          synthRef.current.triggerAttackRelease("E5", "4n", Tone.now() + 0.5);
        },
        doorbell: () => {
          synthRef.current.triggerAttackRelease("G4", "8n", Tone.now());
          synthRef.current.triggerAttackRelease("B4", "8n", Tone.now() + 0.3);
          synthRef.current.triggerAttackRelease("D5", "8n", Tone.now() + 0.6);
        },
        alarm: () => {
          synthRef.current.triggerAttackRelease("A4", "16n", Tone.now());
          synthRef.current.triggerAttackRelease("A4", "16n", Tone.now() + 0.2);
          synthRef.current.triggerAttackRelease("A4", "16n", Tone.now() + 0.4);
        },
        notification: () => {
          synthRef.current.triggerAttackRelease("F5", "8n", Tone.now());
          synthRef.current.triggerAttackRelease("A5", "8n", Tone.now() + 0.2);
        },
        bell: () => {
          synthRef.current.triggerAttackRelease("C6", "4n", Tone.now());
          synthRef.current.triggerAttackRelease("G5", "4n", Tone.now() + 0.5);
        },
        beep: () => {
          synthRef.current.triggerAttackRelease("C5", "8n");
        },
        ping: () => {
          synthRef.current.triggerAttackRelease("E5", "16n");
          synthRef.current.triggerAttackRelease("G5", "16n", Tone.now() + 0.1);
        },
        
        // Звуки экспорта/импорта
        export: () => {
          synthRef.current.triggerAttackRelease('C4', '8n');
          setTimeout(() => synthRef.current.triggerAttackRelease('E4', '8n'), 100);
          setTimeout(() => synthRef.current.triggerAttackRelease('G4', '8n'), 200);
        },
        
        import: () => {
          synthRef.current.triggerAttackRelease('G4', '8n');
          setTimeout(() => synthRef.current.triggerAttackRelease('E4', '8n'), 100);
          setTimeout(() => synthRef.current.triggerAttackRelease('C4', '8n'), 200);
        },
        
        // Звуки настройки
        settingsChange: () => {
          synthRef.current.triggerAttackRelease('A4', '16n');
        },
        
        themeChange: () => {
          synthRef.current.triggerAttackRelease('F4', '8n');
          setTimeout(() => synthRef.current.triggerAttackRelease('A4', '8n'), 100);
        },
        
        // Звуки завершения работы
        workComplete: () => {
          synthRef.current.triggerAttackRelease('C4', '4n');
          setTimeout(() => synthRef.current.triggerAttackRelease('E4', '4n'), 200);
          setTimeout(() => synthRef.current.triggerAttackRelease('G4', '4n'), 400);
          setTimeout(() => synthRef.current.triggerAttackRelease('C5', '2n'), 600);
        },
        
        // Звуки ошибок
        validationError: () => {
          synthRef.current.triggerAttackRelease('C3', '8n');
          setTimeout(() => synthRef.current.triggerAttackRelease('B2', '8n'), 100);
        },
        
        networkError: () => {
          synthRef.current.triggerAttackRelease('C2', '4n');
          setTimeout(() => synthRef.current.triggerAttackRelease('C2', '4n'), 200);
        },
      };
      
      if (sounds[soundName]) {
        sounds[soundName]();
        logger.log(`🔊 Воспроизведен звук: ${soundName}`);
      } else {
        logger.warn(`Звук '${soundName}' не найден`);
      }
    } catch (error) {
      logger.error(`Ошибка воспроизведения звука '${soundName}':`, error);
    }
  }, [notifications.sound, notifications.volume, initializeTone]);
  
  /**
   * Воспроизводит кастомный звук
   * @param {string} frequency - частота звука
   * @param {string} duration - длительность
   * @param {Object} options - опции
   */
  const playCustomSound = useCallback((frequency, duration, options = {}) => {
    if (!notifications.sound || !synthRef.current || !isInitializedRef.current) {
      return;
    }
    
    const { volume = notifications.volume || 80 } = options;
    
    try {
      synthRef.current.volume.value = Tone.gainToDb(volume / 100);
      synthRef.current.triggerAttackRelease(frequency, duration);
      logger.log(`🔊 Кастомный звук: ${frequency} ${duration}`);
    } catch (error) {
      logger.error('Ошибка воспроизведения кастомного звука:', error);
    }
  }, [notifications.sound, notifications.volume]);
  
  /**
   * Воспроизводит мелодию
   * @param {Array} notes - массив нот в формате [{frequency, duration, delay}]
   * @param {Object} options - опции
   */
  const playMelody = useCallback((notes, options = {}) => {
    if (!notifications.sound || !synthRef.current || !isInitializedRef.current) {
      return;
    }
    
    const { volume = notifications.volume || 80 } = options;
    
    try {
      synthRef.current.volume.value = Tone.gainToDb(volume / 100);
      
      notes.forEach((note, index) => {
        const delay = note.delay || index * 100;
        setTimeout(() => {
          synthRef.current.triggerAttackRelease(note.frequency, note.duration || '8n');
        }, delay);
      });
      
      logger.log(`🔊 Мелодия: ${notes.length} нот`);
    } catch (error) {
      logger.error('Ошибка воспроизведения мелодии:', error);
    }
  }, [notifications.sound, notifications.volume]);
  
  /**
   * Останавливает все звуки
   */
  const stopAllSounds = useCallback(() => {
    try {
      if (synthRef.current) {
        synthRef.current.triggerRelease();
      }
      logger.log('🔊 Все звуки остановлены');
    } catch (error) {
      logger.error('Ошибка остановки звуков:', error);
    }
  }, []);
  
  /**
   * Устанавливает громкость
   * @param {number} volume - громкость от 0 до 100
   */
  const setVolume = useCallback((volume) => {
    if (synthRef.current) {
      synthRef.current.volume.value = Tone.gainToDb(volume / 100);
      logger.log(`🔊 Громкость установлена: ${volume}%`);
    }
  }, []);
  
  /**
   * Получает текущую громкость
   * @returns {number} громкость от 0 до 100
   */
  const getVolume = useCallback(() => {
    if (synthRef.current) {
      return Tone.dbToGain(synthRef.current.volume.value) * 100;
    }
    return 0;
  }, []);
  
  /**
   * Проверяет, включены ли звуки
   * @returns {boolean} true если звуки включены
   */
  const isEnabled = useCallback(() => {
    return notifications.sound && isInitializedRef.current;
  }, [notifications.sound]);
  
  /**
   * Включает/выключает звуки
   * @param {boolean} enabled - включить звуки
   */
  const setEnabled = useCallback((enabled) => {
    logger.log(`🔊 Звуки ${enabled ? 'включены' : 'выключены'}`);
  }, []);
  
  return {
    playSound,
    playCustomSound,
    playMelody,
    stopAllSounds,
    setVolume,
    getVolume,
    isEnabled,
    setEnabled,
  };
}
