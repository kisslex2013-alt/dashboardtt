import { useState } from 'react'
import { BaseModal } from '../../../src/components/ui/BaseModal'
import { Volume2, Play, Bell, Timer, CheckCircle, AlertCircle, XCircle, ChevronDown, ChevronUp } from 'lucide-react'
import { useSoundManager } from '../../../src/hooks/useSound'

/**
 * Концепт 3: Компактный аккордеон
 * Стиль: компактные группы с раскрывающимися секциями
 */
export function SoundAnimationConcept3({ isOpen, onClose }) {
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

  const [expandedGroups, setExpandedGroups] = useState({
    timer: true,
    notifications: false,
    system: false
  })

  const soundManager = useSoundManager()

  const soundGroups = [
    {
      key: 'timer',
      name: 'Таймер',
      sounds: [
        { key: 'timerStart', name: 'Старт таймера', icon: Play, color: '#3b82f6' },
        { key: 'timerStop', name: 'Стоп таймера', icon: Timer, color: '#ef4444' }
      ]
    },
    {
      key: 'notifications',
      name: 'Уведомления',
      sounds: [
        { key: 'hourly', name: 'Каждый час', icon: Bell, color: '#10b981' },
        { key: 'notification', name: 'Уведомление', icon: Bell, color: '#8b5cf6' },
        { key: 'warning', name: 'Предупреждение', icon: AlertCircle, color: '#f59e0b' }
      ]
    },
    {
      key: 'system',
      name: 'Системные',
      sounds: [
        { key: 'achievement', name: 'Достижение', icon: CheckCircle, color: '#f59e0b' },
        { key: 'success', name: 'Успех', icon: CheckCircle, color: '#10b981' },
        { key: 'error', name: 'Ошибка', icon: XCircle, color: '#ef4444' }
      ]
    }
  ]

  const toggleGroup = (key) => {
    setExpandedGroups(prev => ({
      ...prev,
      [key]: !prev[key]
    }))
  }

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
        <div className="space-y-3">
          {soundGroups.map((group) => {
            const isExpanded = expandedGroups[group.key]
            
            return (
              <div
                key={group.key}
                className="glass-effect rounded-xl overflow-hidden border-l-4"
                style={{ borderColor: group.sounds[0]?.color || '#3b82f6' }}
              >
                <button
                  onClick={() => toggleGroup(group.key)}
                  className="w-full p-4 flex items-center justify-between hover:bg-white/10 dark:hover:bg-white/5 transition-colors"
                >
                  <h3 className="text-base font-semibold text-gray-900 dark:text-white">
                    {group.name}
                  </h3>
                  {isExpanded ? (
                    <ChevronUp className="w-5 h-5 text-gray-500 dark:text-gray-400" />
                  ) : (
                    <ChevronDown className="w-5 h-5 text-gray-500 dark:text-gray-400" />
                  )}
                </button>
                
                {isExpanded && (
                  <div className="px-4 pb-4 space-y-2">
                    {group.sounds.map((sound) => {
                      const Icon = sound.icon
                      const soundSetting = settings.sounds[sound.key]
                      
                      return (
                        <div
                          key={sound.key}
                          className="flex items-center gap-3 p-3 rounded-lg hover:bg-white/10 dark:hover:bg-white/5 transition-colors"
                        >
                          <div
                            className="w-8 h-8 rounded-lg flex items-center justify-center flex-shrink-0"
                            style={{
                              backgroundColor: `${sound.color}20`,
                              color: sound.color
                            }}
                          >
                            <Icon className="w-4 h-4" />
                          </div>
                          <div className="flex-1 min-w-0">
                            <div className="flex items-center justify-between mb-1">
                              <span className="text-sm font-medium text-gray-900 dark:text-white">
                                {sound.name}
                              </span>
                              <span className="text-xs text-gray-500 dark:text-gray-400">
                                {soundSetting.volume}%
                              </span>
                            </div>
                            <div className="flex items-center gap-2">
                              <input
                                type="range"
                                min="0"
                                max="100"
                                value={soundSetting.volume}
                                onChange={(e) => handleVolumeChange(sound.key, e.target.value)}
                                className="flex-1 h-1 bg-gray-200 dark:bg-gray-700 rounded-lg appearance-none cursor-pointer"
                                style={{
                                  background: `linear-gradient(to right, ${sound.color} 0%, ${sound.color} ${soundSetting.volume}%, rgba(0,0,0,0.1) ${soundSetting.volume}%, rgba(0,0,0,0.1) 100%)`
                                }}
                              />
                              <button
                                onClick={() => handlePlay(sound.key)}
                                className="glass-button p-1.5 bg-blue-600 hover:bg-blue-700 text-white rounded-lg transition-normal hover-lift-scale click-shrink"
                              >
                                <Play className="w-3 h-3" />
                              </button>
                              <div
                                onClick={() => handleToggle(sound.key)}
                                className={`toggle-switch ${soundSetting.enabled ? 'active' : ''}`}
                              />
                            </div>
                          </div>
                        </div>
                      )
                    })}
                  </div>
                )}
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
    </BaseModal>
  )
}

