// Общий функционал для всех концептов звуков и анимаций

// Звуковые эффекты
const soundEffects = {
  timerStart: { freq: 523.25, duration: 200, name: 'Старт таймера' },
  timerStop: { freq: 392.00, duration: 400, name: 'Стоп таймера' },
  hourly: { freq: 659.25, duration: 600, name: 'Каждый час' },
  achievement: { freq: 783.99, duration: 1000, name: 'Достижение' },
  error: { freq: 220.00, duration: 300, name: 'Ошибка' },
  notification: { freq: 440.00, duration: 500, name: 'Уведомление' },
  success: { freq: 698.46, duration: 400, name: 'Успех' },
  warning: { freq: 329.63, duration: 350, name: 'Предупреждение' }
};

// Воспроизведение звука
function playSound(type, volume = 0.3) {
  const sound = soundEffects[type];
  if (!sound) return;
  
  try {
    const audioContext = new (window.AudioContext || window.webkitAudioContext)();
    const oscillator = audioContext.createOscillator();
    const gainNode = audioContext.createGain();
    
    oscillator.connect(gainNode);
    gainNode.connect(audioContext.destination);
    
    oscillator.frequency.value = sound.freq;
    oscillator.type = 'sine';
    
    gainNode.gain.setValueAtTime(volume, audioContext.currentTime);
    gainNode.gain.exponentialRampToValueAtTime(0.01, audioContext.currentTime + sound.duration / 1000);
    
    oscillator.start(audioContext.currentTime);
    oscillator.stop(audioContext.currentTime + sound.duration / 1000);
    
    return sound.duration;
  } catch (error) {
    console.error('Ошибка воспроизведения звука:', error);
  }
}

// Показать уведомление
function showNotification(message, type = 'info') {
  const colors = {
    success: 'bg-green-600',
    error: 'bg-red-600',
    warning: 'bg-yellow-600',
    info: 'bg-blue-600'
  };
  
  const notification = document.createElement('div');
  notification.className = `fixed top-4 right-4 px-6 py-3 rounded-lg text-white font-medium shadow-lg z-50 ${colors[type]} transform translate-x-full transition-transform duration-300`;
  notification.textContent = message;
  document.body.appendChild(notification);
  
  setTimeout(() => notification.classList.remove('translate-x-full'), 10);
  
  setTimeout(() => {
    notification.classList.add('translate-x-full');
    setTimeout(() => notification.remove(), 300);
  }, 2500);
}

// Анимация фавикона
function animateFavicon(enabled) {
  const canvas = document.createElement('canvas');
  canvas.width = 32;
  canvas.height = 32;
  const ctx = canvas.getContext('2d');
  
  let frame = 0;
  const animate = () => {
    if (!enabled) return;
    
    ctx.clearRect(0, 0, 32, 32);
    
    // Пульсирующий круг
    const scale = 1 + Math.sin(frame * 0.1) * 0.2;
    ctx.beginPath();
    ctx.arc(16, 16, 12 * scale, 0, Math.PI * 2);
    ctx.fillStyle = `rgba(59, 130, 246, ${0.8 + Math.sin(frame * 0.1) * 0.2})`;
    ctx.fill();
    
    // Обновить фавикон
    const link = document.querySelector("link[rel*='icon']") || document.createElement('link');
    link.type = 'image/x-icon';
    link.rel = 'shortcut icon';
    link.href = canvas.toDataURL();
    document.getElementsByTagName('head')[0].appendChild(link);
    
    frame++;
    if (enabled) requestAnimationFrame(animate);
  };
  
  if (enabled) animate();
}

// Сохранить настройки
function saveSettings(settings) {
  localStorage.setItem('soundAnimationSettings', JSON.stringify(settings));
  showNotification('Настройки сохранены', 'success');
  playSound('success');
}

// Загрузить настройки
function loadSettings() {
  const saved = localStorage.getItem('soundAnimationSettings');
  return saved ? JSON.parse(saved) : getDefaultSettings();
}

// Настройки по умолчанию
function getDefaultSettings() {
  return {
    sounds: {
      timerStart: true,
      timerStop: true,
      hourly: false,
      achievement: true,
      error: true,
      notification: false,
      success: true,
      warning: true
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
    volume: 75
  };
}
