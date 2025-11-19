import { useState } from 'react'
import { BaseModal } from '../../../src/components/ui/BaseModal'
import { Volume2, Play, Bell, Timer, CheckCircle, AlertCircle, XCircle, Settings, Palette, Sparkles } from 'lucide-react'
import { useSoundManager } from '../../../src/hooks/useSound'

/**
 * Концепт 5: Продвинутый с табами
 * Стиль: табы как в PaymentDatesSettingsModal, расширенные настройки
 */
export function SoundAnimationConcept5({ isOpen, onClose }) {
  const [activeTab, setActiveTab] = useState('sounds')
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
    animations: {
      favicon: true,
      transitions: true,
      hover: true,
      loading: true
    },
    notifications: {
      browser: false,
      entryComplete: true,
      achievements: true,
      reminders: false
    },
    masterVolume: 80
  })

  const soundManager = useSoundManager()

  const soundTypes = [
    { key: 'timerStart', name: 'Старт таймера', icon: Play, color: '#3b82f6' },
    { key: 'timerStop', name: 'Стоп таймера', icon: Timer, color: '#ef4444' },
    { key: 'hourly', name: 'Каждый час', icon: Bell, color: '#10b981' },
    { key: 'achievement', name: 'Достижение', icon: CheckCircle, color: '#f59e0b' },
    { key: 'error', name: 'Ошибка', icon: XCircle, color: '#ef4444' },
    { key: 'notification', name: 'Уведомление', icon: Bell, color: '#8b5cf6' },
    { key: 'success', name: 'Успех', icon: CheckCircle, color: '#10b981' },
    { key: 'warning', name: 'Предупреждение', icon: AlertCircle, color: '#f59e0b' }
  ]

  const handleToggle = (category, key) => {
    setSettings(prev => ({
      ...prev,
      [category]: {
        ...prev[category],
        [key]: !prev[category][key]
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
      {/* Табы */}
      <div className="flex gap-2 mb-4 border-b border-gray-200 dark:border-gray-700">
        <button
          onClick={() => setActiveTab('sounds')}
          className={`px-4 py-2 text-sm font-semibold rounded-t-lg transition-all ${
            activeTab === 'sounds'
              ? 'text-blue-600 dark:text-blue-400 border-b-2 border-blue-600 dark:border-blue-400'
              : 'text-gray-500 dark:text-gray-400 hover:text-gray-700 dark:hover:text-gray-300'
          }`}
        >
          Звуки
        </button>
        <button
          onClick={() => setActiveTab('animations')}
          className={`px-4 py-2 text-sm font-semibold rounded-t-lg transition-all ${
            activeTab === 'animations'
              ? 'text-blue-600 dark:text-blue-400 border-b-2 border-blue-600 dark:border-blue-400'
              : 'text-gray-500 dark:text-gray-400 hover:text-gray-700 dark:hover:text-gray-300'
          }`}
        >
          Анимации
        </button>
        <button
          onClick={() => setActiveTab('notifications')}
          className={`px-4 py-2 text-sm font-semibold rounded-t-lg transition-all ${
            activeTab === 'notifications'
              ? 'text-blue-600 dark:text-blue-400 border-b-2 border-blue-600 dark:border-blue-400'
              : 'text-gray-500 dark:text-gray-400 hover:text-gray-700 dark:hover:text-gray-300'
          }`}
        >
          Уведомления
        </button>
      </div>

      <div className="flex-1 overflow-y-auto overflow-x-hidden pr-1 sm:pr-2 -mr-1 sm:-mr-2">
        {/* Вкладка Звуки */}
        {activeTab === 'sounds' && (
          <div className="space-y-3">
            {soundTypes.map((sound) => {
              const Icon = sound.icon
              const soundSetting = settings.sounds[sound.key]
              
              return (
                <div
                  key={sound.key}
                  className="glass-effect rounded-xl p-4 border-l-4 hover:bg-white/20 dark:hover:bg-gray-800/70 hover:shadow-lg transition-all duration-300"
                  style={{ borderColor: sound.color }}
                >
                  <div className="flex items-center justify-between gap-4">
                    <div className="flex items-center gap-3 flex-1 min-w-0">
                      <div
                        className="w-10 h-10 rounded-lg flex items-center justify-center flex-shrink-0"
                        style={{
                          backgroundColor: `${sound.color}20`,
                          color: sound.color
                        }}
                      >
                        <Icon className="w-5 h-5" />
                      </div>
                      <div className="flex-1 min-w-0">
                        <h3 className="text-sm font-semibold text-gray-900 dark:text-white mb-1">
                          {sound.name}
                        </h3>
                        <div className="flex items-center gap-3">
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
                          <span className="text-xs text-gray-500 dark:text-gray-400 w-10 text-right">
                            {soundSetting.volume}%
                          </span>
                        </div>
                      </div>
                    </div>
                    <div className="flex items-center gap-2 flex-shrink-0">
                      <button
                        onClick={() => handlePlay(sound.key)}
                        className="glass-button p-2 bg-blue-600 hover:bg-blue-700 text-white rounded-lg transition-normal hover-lift-scale click-shrink"
                        title="Воспроизвести"
                      >
                        <Play className="w-4 h-4" />
                      </button>
                      <div
                        onClick={() => handleToggle('sounds', sound.key)}
                        className={`toggle-switch ${soundSetting.enabled ? 'active' : ''}`}
                      />
                    </div>
                  </div>
                </div>
              )
            })}
          </div>
        )}

        {/* Вкладка Анимации */}
        {activeTab === 'animations' && (
          <div className="space-y-3">
            {[
              { key: 'favicon', name: 'Анимация фавикона', icon: Sparkles, desc: 'Пульсирующий фавикон при работе таймера' },
              { key: 'transitions', name: 'Плавные переходы', icon: Settings, desc: 'Анимации между страницами' },
              { key: 'hover', name: 'Эффекты наведения', icon: Palette, desc: 'Подсветка элементов при наведении' },
              { key: 'loading', name: 'Индикаторы загрузки', icon: Settings, desc: 'Вращающиеся спиннеры' }
            ].map((anim) => {
              const Icon = anim.icon
              
              return (
                <div
                  key={anim.key}
                  className="glass-effect rounded-xl p-4 border-l-4 hover:bg-white/20 dark:hover:bg-gray-800/70 hover:shadow-lg transition-all duration-300"
                  style={{ borderColor: '#8b5cf6' }}
                >
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-3 flex-1">
                      <div className="w-10 h-10 rounded-lg flex items-center justify-center bg-purple-500/20 text-purple-500">
                        <Icon className="w-5 h-5" />
                      </div>
                      <div>
                        <h3 className="text-sm font-semibold text-gray-900 dark:text-white mb-1">
                          {anim.name}
                        </h3>
                        <p className="text-xs text-gray-500 dark:text-gray-400">
                          {anim.desc}
                        </p>
                      </div>
                    </div>
                    <div
                      onClick={() => handleToggle('animations', anim.key)}
                      className={`toggle-switch ${settings.animations[anim.key] ? 'active' : ''}`}
                    />
                  </div>
                </div>
              )
            })}
          </div>
        )}

        {/* Вкладка Уведомления */}
        {activeTab === 'notifications' && (
          <div className="space-y-3">
            {[
              { key: 'browser', name: 'Браузерные уведомления', icon: Bell, desc: 'Системные уведомления браузера' },
              { key: 'entryComplete', name: 'Завершение записи', icon: CheckCircle, desc: 'При остановке таймера' },
              { key: 'achievements', name: 'Достижения', icon: Sparkles, desc: 'Выполнение целей и планов' },
              { key: 'reminders', name: 'Напоминания', icon: Timer, desc: 'Перерывы и важные события' }
            ].map((notif) => {
              const Icon = notif.icon
              
              return (
                <div
                  key={notif.key}
                  className="glass-effect rounded-xl p-4 border-l-4 hover:bg-white/20 dark:hover:bg-gray-800/70 hover:shadow-lg transition-all duration-300"
                  style={{ borderColor: '#10b981' }}
                >
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-3 flex-1">
                      <div className="w-10 h-10 rounded-lg flex items-center justify-center bg-green-500/20 text-green-500">
                        <Icon className="w-5 h-5" />
                      </div>
                      <div>
                        <h3 className="text-sm font-semibold text-gray-900 dark:text-white mb-1">
                          {notif.name}
                        </h3>
                        <p className="text-xs text-gray-500 dark:text-gray-400">
                          {notif.desc}
                        </p>
                      </div>
                    </div>
                    <div
                      onClick={() => handleToggle('notifications', notif.key)}
                      className={`toggle-switch ${settings.notifications[notif.key] ? 'active' : ''}`}
                    />
                  </div>
                </div>
              )
            })}
          </div>
        )}

        {/* Общая громкость (только на вкладке Звуки) */}
        {activeTab === 'sounds' && (
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
        )}
      </div>
    </BaseModal>
  )
}

