import { useState } from 'react'
import { BaseModal } from '../../../src/components/ui/BaseModal'
import { Volume2, Play, Bell, Timer, CheckCircle, AlertCircle, XCircle } from 'lucide-react'
import { useSoundManager } from '../../../src/hooks/useSound'

/**
 * Концепт 4: Визуальный с волнами
 * Стиль: карточки с анимированными волнами звука и пульсирующими иконками
 */
export function SoundAnimationConcept4({ isOpen, onClose }) {
  const [settings, setSettings] = useState({
    sounds: {
      timerStart: { enabled: true, volume: 80 },
      timerStop: { enabled: true, volume: 80 },
      hourly: { enabled: false, volume: 60 },
      achievement: { enabled: true, volume: 100 },
      error: { enabled: true, volume: 70 },
      notification: { enabled: false, volume: 80 },
      success: { enabled: true, volume: 90 },
      warning: { enabled: true, volume: 75 }
    },
    masterVolume: 80
  })

  const [playingSounds, setPlayingSounds] = useState({})
  const soundManager = useSoundManager()

  const soundTypes = [
    { key: 'timerStart', name: 'Старт таймера', icon: Play, color: '#3b82f6', desc: 'Короткий сигнал' },
    { key: 'timerStop', name: 'Стоп таймера', icon: Timer, color: '#ef4444', desc: 'Двойной сигнал' },
    { key: 'hourly', name: 'Каждый час', icon: Bell, color: '#10b981', desc: 'Напоминание' },
    { key: 'achievement', name: 'Достижение', icon: CheckCircle, color: '#f59e0b', desc: 'Триумфальный' },
    { key: 'error', name: 'Ошибка', icon: XCircle, color: '#ef4444', desc: 'Предупреждение' },
    { key: 'notification', name: 'Уведомление', icon: Bell, color: '#8b5cf6', desc: 'Мягкий сигнал' },
    { key: 'success', name: 'Успех', icon: CheckCircle, color: '#10b981', desc: 'Позитивный' },
    { key: 'warning', name: 'Предупреждение', icon: AlertCircle, color: '#f59e0b', desc: 'Средний тон' }
  ]

  const handleToggle = (key) => {
    setSettings(prev => ({
      ...prev,
      sounds: {
        ...prev.sounds,
        [key]: {
          ...prev.sounds[key],
          enabled: !prev.sounds[key].enabled
        }
      }
    }))
  }

  const handleVolumeChange = (key, volume) => {
    setSettings(prev => ({
      ...prev,
      sounds: {
        ...prev.sounds,
        [key]: {
          ...prev.sounds[key],
          volume: parseInt(volume)
        }
      }
    }))
  }

  const handlePlay = (key) => {
    if (soundManager) {
      soundManager.playSound(key, settings.sounds[key].volume / 100)
      
      // Анимация воспроизведения
      setPlayingSounds(prev => ({ ...prev, [key]: true }))
      setTimeout(() => {
        setPlayingSounds(prev => {
          const next = { ...prev }
          delete next[key]
          return next
        })
      }, 1000)
    }
  }

  const handleSave = () => {
    localStorage.setItem('soundSettings', JSON.stringify(settings))
    onClose()
  }

  return (
    <BaseModal
      isOpen={isOpen}
      onClose={onClose}
      title="Звуки и анимация"
      subtitle="Настройте звуковые уведомления и анимации"
      size="full"
      closeOnOverlayClick={false}
      footer={
        <div className="flex gap-2 sm:gap-3">
          <button
            onClick={onClose}
            className="px-4 sm:px-6 py-2 sm:py-2.5 text-sm sm:text-base bg-gray-200 dark:bg-gray-700 hover:bg-gray-300 dark:hover:bg-gray-600 rounded-lg sm:rounded-xl font-semibold text-gray-800 dark:text-gray-200 transition-normal hover-lift-scale click-shrink"
          >
            Отмена
          </button>
          <button
            onClick={handleSave}
            className="glass-button flex-1 px-4 sm:px-6 py-2 sm:py-2.5 text-sm sm:text-base bg-blue-600 hover:bg-blue-700 text-white rounded-lg sm:rounded-xl font-semibold transition-normal hover-lift-scale click-shrink"
          >
            Сохранить все
          </button>
        </div>
      }
      className="flex flex-col max-h-[90vh]"
    >
      <div className="flex-1 overflow-y-auto overflow-x-hidden pr-1 sm:pr-2 -mr-1 sm:-mr-2">
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
          {soundTypes.map((sound) => {
            const Icon = sound.icon
            const soundSetting = settings.sounds[sound.key]
            const isPlaying = playingSounds[sound.key]
            
            return (
              <div
                key={sound.key}
                className="glass-effect rounded-xl p-4 border-l-4 hover:bg-white/20 dark:hover:bg-gray-800/70 hover:shadow-lg transition-all duration-300 flex flex-col relative overflow-hidden"
                style={{ borderColor: sound.color }}
              >
                {/* Фоновый градиент */}
                <div
                  className="absolute inset-0 opacity-10 transition-opacity duration-300"
                  style={{
                    background: `radial-gradient(circle at top right, ${sound.color}, transparent)`
                  }}
                />
                
                <div className="relative z-10">
                  <div className="flex items-center justify-between mb-3">
                    <div
                      className={`w-12 h-12 rounded-xl flex items-center justify-center transition-transform duration-300 ${
                        isPlaying ? 'scale-110' : ''
                      }`}
                      style={{
                        backgroundColor: `${sound.color}20`,
                        color: sound.color
                      }}
                    >
                      <Icon className="w-6 h-6" />
                      {isPlaying && (
                        <div
                          className="absolute inset-0 rounded-xl border-2 animate-ping"
                          style={{ borderColor: sound.color }}
                        />
                      )}
                    </div>
                    <div
                      onClick={() => handleToggle(sound.key)}
                      className={`toggle-switch ${soundSetting.enabled ? 'active' : ''}`}
                    />
                  </div>
                  
                  <h3 className="text-sm font-semibold text-gray-900 dark:text-white mb-1">
                    {sound.name}
                  </h3>
                  <p className="text-xs text-gray-500 dark:text-gray-400 mb-4">
                    {sound.desc}
                  </p>
                  
                  {/* Волновая анимация */}
                  <div className={`flex items-end gap-1 h-12 mb-4 transition-opacity duration-300 ${
                    isPlaying ? 'opacity-100' : 'opacity-0'
                  }`}>
                    {[...Array(7)].map((_, i) => (
                      <div
                        key={i}
                        className="flex-1 rounded-sm"
                        style={{
                          backgroundColor: sound.color,
                          height: isPlaying ? `${20 + Math.random() * 80}%` : '20%',
                          animation: isPlaying ? `waveAnimation 1.2s ease-in-out infinite` : 'none',
                          animationDelay: `${i * 0.1}s`
                        }}
                      />
                    ))}
                  </div>
                  
                  <div className="flex items-center gap-2 mb-3">
                    <input
                      type="range"
                      min="0"
                      max="100"
                      value={soundSetting.volume}
                      onChange={(e) => handleVolumeChange(sound.key, e.target.value)}
                      className="flex-1 h-1.5 bg-gray-200 dark:bg-gray-700 rounded-lg appearance-none cursor-pointer"
                      style={{
                        background: `linear-gradient(to right, ${sound.color} 0%, ${sound.color} ${soundSetting.volume}%, rgba(0,0,0,0.1) ${soundSetting.volume}%, rgba(0,0,0,0.1) 100%)`
                      }}
                    />
                    <span className="text-xs text-gray-500 dark:text-gray-400 w-8 text-right">
                      {soundSetting.volume}%
                    </span>
                  </div>
                  
                  <button
                    onClick={() => handlePlay(sound.key)}
                    className="glass-button w-full py-2 px-3 bg-blue-600 hover:bg-blue-700 text-white rounded-lg text-xs font-medium transition-normal hover-lift-scale click-shrink flex items-center justify-center gap-2"
                  >
                    <Play className="w-3 h-3" />
                    Воспроизвести
                  </button>
                </div>
              </div>
            )
          })}
        </div>

        {/* Общая громкость */}
        <div className="glass-effect rounded-xl p-4 mt-6">
          <div className="flex items-center justify-between mb-3">
            <label className="text-sm font-semibold text-gray-900 dark:text-white flex items-center gap-2">
              <Volume2 className="w-4 h-4" />
              Общая громкость
            </label>
            <span className="text-lg font-bold text-blue-600 dark:text-blue-400">
              {settings.masterVolume}%
            </span>
          </div>
          <input
            type="range"
            min="0"
            max="100"
            value={settings.masterVolume}
            onChange={(e) => setSettings(prev => ({ ...prev, masterVolume: parseInt(e.target.value) }))}
            className="w-full h-2 bg-gray-200 dark:bg-gray-700 rounded-lg appearance-none cursor-pointer"
            style={{
              background: `linear-gradient(to right, #3b82f6 0%, #3b82f6 ${settings.masterVolume}%, rgba(0,0,0,0.1) ${settings.masterVolume}%, rgba(0,0,0,0.1) 100%)`
            }}
          />
        </div>
      </div>
      
      <style>{`
        @keyframes waveAnimation {
          0%, 100% { height: 20%; }
          50% { height: 100%; }
        }
      `}</style>
    </BaseModal>
  )
}

