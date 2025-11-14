import { useState, useEffect, useRef } from 'react';
import { Volume2, Palette, Settings, Play } from 'lucide-react';
import { BaseModal } from '../ui/BaseModal';
import { AnimatedModalContent } from '../ui/AnimatedModalContent';
import { useSettingsStore } from '../../store/useSettingsStore';
import { useSoundManager } from '../../hooks/useSound';
import { useUIStore } from '../../store/useUIStore';

/**
 * Компонент карточки предпросмотра анимации фавикона
 */
function FaviconPreviewCard({ style, isSelected, color, speed, onClick }) {
  const canvasRef = useRef(null);
  const animationRef = useRef(null);
  const logoImageRef = useRef(null);
  const [isHovered, setIsHovered] = useState(false);

  // Загружаем логотип для data-pulse
  useEffect(() => {
    if (style.value === 'data-pulse' && !logoImageRef.current) {
      const img = new Image();
      img.crossOrigin = 'anonymous';
      img.onload = () => {
        logoImageRef.current = img;
        // Перезапускаем анимацию после загрузки логотипа (только если наведено)
        if (canvasRef.current && isHovered) {
          const canvas = canvasRef.current;
          const ctx = canvas.getContext('2d');
          const speedMap = { slow: 4000, normal: 2000, fast: 1000 };
          const animationSpeed = speedMap[speed] || 2000;
          const time = Date.now() / animationSpeed;
          const pulseTime = time * 1.5;
          const dataPulseValue = 0.5 + Math.sin(pulseTime * Math.PI * 2) * 0.5;
          
          ctx.clearRect(0, 0, 32, 32);
          ctx.save();
          const scale = 0.9 + dataPulseValue * 0.1;
          const alpha = 0.8 + dataPulseValue * 0.2;
          ctx.globalAlpha = alpha;
          ctx.translate(16, 16);
          ctx.scale(scale, scale);
          ctx.translate(-16, -16);
          ctx.drawImage(img, 0, 0, 32, 32);
          ctx.restore();
        }
      };
      img.onerror = () => {
        console.warn('Не удалось загрузить логотип для data-pulse');
      };
      img.src = '/logo-4-data-pulse.svg';
    }
  }, [style.value, isHovered, speed]);

  // Инициализация статичного фавикона и анимация при наведении
  useEffect(() => {
    if (!canvasRef.current) return;
    
    const canvas = canvasRef.current;
    const ctx = canvas.getContext('2d');
    
    // Анимация запускается только при наведении (для всех стилей, включая data-pulse)
    if (!isHovered) {
      ctx.clearRect(0, 0, 32, 32);
      
      // Для data-pulse показываем статичный логотип (если загружен), иначе круг
      if (style.value === 'data-pulse' && logoImageRef.current) {
        ctx.drawImage(logoImageRef.current, 0, 0, 32, 32);
      } else {
        ctx.fillStyle = color;
        ctx.beginPath();
        ctx.arc(16, 16, 14, 0, 2 * Math.PI);
        ctx.fill();
      }
      
      // Останавливаем анимацию, если она была запущена
      if (animationRef.current) {
        cancelAnimationFrame(animationRef.current);
        animationRef.current = null;
      }
      return;
    }
    
    // Если наведено, запускаем анимацию
    const speedMap = { slow: 4000, normal: 2000, fast: 1000 };
    const animationSpeed = speedMap[speed] || 2000;

    const draw = () => {
      ctx.clearRect(0, 0, 32, 32);
      
      // Используем тот же алгоритм расчета времени, что и в useFavicon.js
      const time = Date.now() / animationSpeed;
      
      switch (style.value) {
        case 'pulse':
          // Pulse: быстрое увеличение и уменьшение с резкими переходами
          const pulseValue = 0.5 + Math.sin(time * Math.PI * 4) * 0.5; // Более быстрая пульсация
          ctx.fillStyle = color;
          ctx.beginPath();
          const pulseRadius = 8 + pulseValue * 8; // От 8 до 16
          ctx.arc(16, 16, pulseRadius, 0, 2 * Math.PI);
          ctx.fill();
          // Добавляем внешнее кольцо для пульсации
          ctx.strokeStyle = color;
          ctx.globalAlpha = 0.3 * (1 - pulseValue);
          ctx.lineWidth = 2;
          ctx.beginPath();
          ctx.arc(16, 16, pulseRadius + 4, 0, 2 * Math.PI);
          ctx.stroke();
          ctx.globalAlpha = 1;
          break;
        case 'blink':
          const blinkValue = Math.floor(time) % 2 === 0 ? 1 : 0.2;
          ctx.globalAlpha = blinkValue;
          ctx.fillStyle = color;
          ctx.beginPath();
          ctx.arc(16, 16, 14, 0, 2 * Math.PI);
          ctx.fill();
          ctx.globalAlpha = 1;
          break;
        case 'rotate':
          ctx.save();
          ctx.translate(16, 16);
          ctx.rotate((time * 0.5) % 1 * Math.PI * 2);
          ctx.translate(-16, -16);
          ctx.fillStyle = color;
          ctx.beginPath();
          ctx.arc(16, 16, 14, 0, 2 * Math.PI);
          ctx.fill();
          ctx.fillStyle = '#ffffff';
          ctx.beginPath();
          ctx.moveTo(16, 4);
          ctx.lineTo(12, 12);
          ctx.lineTo(20, 12);
          ctx.closePath();
          ctx.fill();
          ctx.restore();
          break;
        case 'wave':
          // Wave: несколько концентрических колец, расходящихся от центра
          ctx.strokeStyle = color;
          ctx.lineWidth = 2;
          for (let i = 0; i < 5; i++) {
            const waveProgress = ((time * 1.5 + i * 0.3) % 1);
            ctx.globalAlpha = (1 - waveProgress) * 0.8;
            ctx.beginPath();
            const waveRadius = 4 + waveProgress * 12; // От 4 до 16
            ctx.arc(16, 16, waveRadius, 0, 2 * Math.PI);
            ctx.stroke();
          }
          // Центральный круг
          ctx.globalAlpha = 1;
          ctx.fillStyle = color;
          ctx.beginPath();
          ctx.arc(16, 16, 4, 0, 2 * Math.PI);
          ctx.fill();
          ctx.globalAlpha = 1;
          break;
        case 'gradient':
          const gradient = ctx.createRadialGradient(16, 16, 0, 16, 16, 14);
          const hue = (((time * 0.3) % 1) * 360) % 360;
          gradient.addColorStop(0, `hsl(${hue}, 70%, 50%)`);
          gradient.addColorStop(1, `hsl(${hue}, 70%, 30%)`);
          ctx.fillStyle = gradient;
          ctx.beginPath();
          ctx.arc(16, 16, 14, 0, 2 * Math.PI);
          ctx.fill();
          break;
        case 'morph':
          // Morph: превращение квадрат → круг → треугольник
          const morphTime = (time * 0.8) % 3; // 0-1: квадрат→круг, 1-2: круг→треугольник, 2-3: треугольник→квадрат
          ctx.fillStyle = color;
          ctx.save();
          ctx.translate(16, 16);
          
          if (morphTime < 1) {
            // Фаза 1: Квадрат → Круг (0.0 → 1.0)
            const progress = morphTime; // 0 → 1
            const size = 14;
            
            if (progress < 0.5) {
              // Ближе к квадрату
              const cornerRadius = (1 - progress * 2) * 7; // От 7 до 0
              ctx.beginPath();
              ctx.moveTo(-size + cornerRadius, -size);
              ctx.lineTo(size - cornerRadius, -size);
              ctx.quadraticCurveTo(size, -size, size, -size + cornerRadius);
              ctx.lineTo(size, size - cornerRadius);
              ctx.quadraticCurveTo(size, size, size - cornerRadius, size);
              ctx.lineTo(-size + cornerRadius, size);
              ctx.quadraticCurveTo(-size, size, -size, size - cornerRadius);
              ctx.lineTo(-size, -size + cornerRadius);
              ctx.quadraticCurveTo(-size, -size, -size + cornerRadius, -size);
              ctx.closePath();
            } else {
              // Ближе к кругу
              const circleProgress = (progress - 0.5) * 2; // 0 → 1
              const cornerRadius = circleProgress * 7; // От 0 до 7
              ctx.beginPath();
              ctx.moveTo(-size + cornerRadius, -size);
              ctx.lineTo(size - cornerRadius, -size);
              ctx.quadraticCurveTo(size, -size, size, -size + cornerRadius);
              ctx.lineTo(size, size - cornerRadius);
              ctx.quadraticCurveTo(size, size, size - cornerRadius, size);
              ctx.lineTo(-size + cornerRadius, size);
              ctx.quadraticCurveTo(-size, size, -size, size - cornerRadius);
              ctx.lineTo(-size, -size + cornerRadius);
              ctx.quadraticCurveTo(-size, -size, -size + cornerRadius, -size);
              ctx.closePath();
            }
            ctx.fill();
          } else if (morphTime < 2) {
            // Фаза 2: Круг → Треугольник (1.0 → 2.0)
            const progress = morphTime - 1; // 0 → 1
            const size = 14;
            
            if (progress < 0.5) {
              // Ближе к кругу
              const circleProgress = 1 - progress * 2; // 1 → 0
              const cornerRadius = circleProgress * 7; // От 7 до 0
              ctx.beginPath();
              ctx.moveTo(-size + cornerRadius, -size);
              ctx.lineTo(size - cornerRadius, -size);
              ctx.quadraticCurveTo(size, -size, size, -size + cornerRadius);
              ctx.lineTo(size, size - cornerRadius);
              ctx.quadraticCurveTo(size, size, size - cornerRadius, size);
              ctx.lineTo(-size + cornerRadius, size);
              ctx.quadraticCurveTo(-size, size, -size, size - cornerRadius);
              ctx.lineTo(-size, -size + cornerRadius);
              ctx.quadraticCurveTo(-size, -size, -size + cornerRadius, -size);
              ctx.closePath();
              ctx.fill();
            } else {
              // Ближе к треугольнику
              const triangleProgress = (progress - 0.5) * 2; // 0 → 1
              const triangleY = size * (1 - triangleProgress * 0.3); // Постепенно поднимаем центр
              
              ctx.beginPath();
              ctx.moveTo(0, -size); // Верхняя вершина
              ctx.lineTo(size * 0.866, triangleY); // Правая нижняя
              ctx.lineTo(-size * 0.866, triangleY); // Левая нижняя
              ctx.closePath();
              ctx.fill();
            }
          } else {
            // Фаза 3: Треугольник → Квадрат (2.0 → 3.0)
            const progress = morphTime - 2; // 0 → 1
            const size = 14;
            
            if (progress < 0.5) {
              // Ближе к треугольнику
              const triangleProgress = 1 - progress * 2; // 1 → 0
              const triangleY = size * (1 - triangleProgress * 0.3);
              
              ctx.beginPath();
              ctx.moveTo(0, -size);
              ctx.lineTo(size * 0.866, triangleY);
              ctx.lineTo(-size * 0.866, triangleY);
              ctx.closePath();
              ctx.fill();
            } else {
              // Ближе к квадрату
              const squareProgress = (progress - 0.5) * 2; // 0 → 1
              const cornerRadius = squareProgress * 7; // От 0 до 7
              
              ctx.beginPath();
              ctx.moveTo(-size + cornerRadius, -size);
              ctx.lineTo(size - cornerRadius, -size);
              ctx.quadraticCurveTo(size, -size, size, -size + cornerRadius);
              ctx.lineTo(size, size - cornerRadius);
              ctx.quadraticCurveTo(size, size, size - cornerRadius, size);
              ctx.lineTo(-size + cornerRadius, size);
              ctx.quadraticCurveTo(-size, size, -size, size - cornerRadius);
              ctx.lineTo(-size, -size + cornerRadius);
              ctx.quadraticCurveTo(-size, -size, -size + cornerRadius, -size);
              ctx.closePath();
              ctx.fill();
            }
          }
          
          ctx.restore();
          break;
        case 'particles':
          ctx.fillStyle = color;
          ctx.beginPath();
          ctx.arc(16, 16, 14, 0, 2 * Math.PI);
          ctx.fill();
          ctx.fillStyle = '#ffffff';
          for (let i = 0; i < 6; i++) {
            const angle = (i / 6) * Math.PI * 2 + ((time * 0.8) % 1) * Math.PI * 2;
            const particleX = 16 + Math.cos(angle) * 22;
            const particleY = 16 + Math.sin(angle) * 22;
            ctx.globalAlpha = 0.8;
            ctx.beginPath();
            ctx.arc(particleX, particleY, 4, 0, 2 * Math.PI);
            ctx.fill();
          }
          ctx.globalAlpha = 1;
          break;
        case 'breathe':
          // Breathe: очень медленное и плавное дыхание с изменением прозрачности
          const breatheProgress = 0.5 + Math.sin(time * Math.PI * 0.5) * 0.5; // Медленнее в 4 раза
          ctx.globalAlpha = 0.7 + breatheProgress * 0.3; // Прозрачность тоже меняется
          ctx.fillStyle = color;
          ctx.beginPath();
          const breatheRadius = 10 + Math.sin(breatheProgress * Math.PI * 2) * 6; // От 10 до 16, более плавно
          ctx.arc(16, 16, breatheRadius, 0, 2 * Math.PI);
          ctx.fill();
          // Добавляем мягкое свечение
          ctx.globalAlpha = 0.2 * breatheProgress;
          ctx.beginPath();
          ctx.arc(16, 16, breatheRadius + 2, 0, 2 * Math.PI);
          ctx.fill();
          ctx.globalAlpha = 1;
          break;
        case 'data-pulse':
          // Data Pulse: отображаем логотип с пульсирующей анимацией
          const pulseTime = time * 1.5; // Скорость анимации
          const dataPulseValue = 0.5 + Math.sin(pulseTime * Math.PI * 2) * 0.5;
          
          // Если логотип загружен, отображаем его с пульсацией
          if (logoImageRef.current) {
            ctx.save();
            const scale = 0.9 + dataPulseValue * 0.1; // Пульсация масштаба от 0.9 до 1.0
            const alpha = 0.8 + dataPulseValue * 0.2; // Пульсация прозрачности от 0.8 до 1.0
            
            ctx.globalAlpha = alpha;
            ctx.translate(16, 16);
            ctx.scale(scale, scale);
            ctx.translate(-16, -16);
            
            // Рисуем логотип
            ctx.drawImage(logoImageRef.current, 0, 0, 32, 32);
            ctx.restore();
          } else {
            // Пока логотип не загружен, показываем пульсирующий круг
            ctx.fillStyle = color;
            ctx.globalAlpha = 0.7 + dataPulseValue * 0.3;
            ctx.beginPath();
            const radius = 12 + dataPulseValue * 4;
            ctx.arc(16, 16, radius, 0, 2 * Math.PI);
            ctx.fill();
            ctx.globalAlpha = 1;
          }
          break;
        default:
          ctx.fillStyle = color;
          ctx.beginPath();
          ctx.arc(16, 16, 14, 0, 2 * Math.PI);
          ctx.fill();
      }
    };

    const animate = () => {
      draw();
      animationRef.current = requestAnimationFrame(animate);
    };

    animate();

    return () => {
      if (animationRef.current) {
        cancelAnimationFrame(animationRef.current);
      }
    };
  }, [style.value, color, speed, isHovered]);

  return (
    <div
      className={`p-2 rounded-lg border-2 cursor-pointer transition-all hover:scale-105 relative ${
        isSelected
          ? 'border-blue-500 bg-blue-500/10'
          : 'border-gray-700 dark:border-gray-600 hover:border-blue-500'
      }`}
      onClick={onClick}
      onMouseEnter={() => setIsHovered(true)}
      onMouseLeave={() => setIsHovered(false)}
    >
      <canvas
        ref={canvasRef}
        width={32}
        height={32}
        className="w-8 h-8 rounded mx-auto mb-1 border border-gray-300 dark:border-gray-600"
        style={{ imageRendering: 'pixelated' }}
      />
      <div className="text-[10px] text-white dark:text-gray-300 text-center">
        {style.label}
      </div>
    </div>
  );
}

/**
 * Модальное окно настроек звуковых уведомлений и анимации фавикона
 */
export function SoundNotificationsSettingsModal({ isOpen, onClose }) {
  const { notifications, updateSettings } = useSettingsStore();
  const { playSound } = useSoundManager();
  const { showSuccess } = useUIStore();
  
  // Инициализация состояния с использованием текущих настроек
  const getInitialState = () => ({
    soundNotificationsEnabled: notifications.soundNotificationsEnabled ?? true,
    notificationInterval: notifications.notificationInterval ?? 30,
    notificationSound: notifications.notificationSound ?? 'chime',
    faviconAnimationEnabled: notifications.faviconAnimationEnabled ?? true,
    faviconAnimationStyle: notifications.faviconAnimationStyle ?? 'pulse',
    faviconAnimationColor: notifications.faviconAnimationColor ?? '#3b82f6',
    faviconAnimationSpeed: notifications.faviconAnimationSpeed ?? 'normal',
  });
  
  const [soundNotificationsEnabled, setSoundNotificationsEnabled] = useState(() => 
    getInitialState().soundNotificationsEnabled
  );
  const [notificationInterval, setNotificationInterval] = useState(() => 
    getInitialState().notificationInterval
  );
  const [notificationSound, setNotificationSound] = useState(() => 
    getInitialState().notificationSound
  );
  const [faviconAnimationEnabled, setFaviconAnimationEnabled] = useState(() => 
    getInitialState().faviconAnimationEnabled
  );
  const [faviconAnimationStyle, setFaviconAnimationStyle] = useState(() => 
    getInitialState().faviconAnimationStyle
  );
  const [faviconAnimationColor, setFaviconAnimationColor] = useState(() => 
    getInitialState().faviconAnimationColor
  );
  const [faviconAnimationSpeed, setFaviconAnimationSpeed] = useState(() => 
    getInitialState().faviconAnimationSpeed
  );
  const [customIntervalMinutes, setCustomIntervalMinutes] = useState(null);
  
  // Обновление состояния при открытии модального окна
  useEffect(() => {
    if (isOpen) {
      const initialState = getInitialState();
      setSoundNotificationsEnabled(initialState.soundNotificationsEnabled);
      setNotificationInterval(initialState.notificationInterval);
      setNotificationSound(initialState.notificationSound);
      setFaviconAnimationEnabled(initialState.faviconAnimationEnabled);
      setFaviconAnimationStyle(initialState.faviconAnimationStyle);
      setFaviconAnimationColor(initialState.faviconAnimationColor);
      setFaviconAnimationSpeed(initialState.faviconAnimationSpeed);
      
      // Если интервал не входит в стандартные значения, считаем его кастомным
      const standardIntervals = [15, 30, 45, 60, 120];
      if (!standardIntervals.includes(initialState.notificationInterval)) {
        setCustomIntervalMinutes(initialState.notificationInterval);
        setNotificationInterval(-1);
      } else {
        setCustomIntervalMinutes(null);
      }
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [isOpen]);

  // Типы звуков (компактный список - только основные)
  const soundTypes = [
    { value: 'chime', label: 'Мелодия', description: 'Мелодичное уведомление' },
    { value: 'alert', label: 'Предупреждение', description: 'Короткое предупреждение' },
    { value: 'phone', label: 'Звонок', description: 'Звук телефонного звонка' },
    { value: 'doorbell', label: 'Дверной звонок', description: 'Многотональный звонок' },
    { value: 'alarm', label: 'Тревога', description: 'Повторяющийся сигнал' },
    { value: 'notification', label: 'Уведомление', description: 'Стандартное уведомление' },
    { value: 'bell', label: 'Колокол', description: 'Колокольный звон' },
    { value: 'beep', label: 'Сигнал', description: 'Короткий сигнал' },
    { value: 'ping', label: 'Пинг', description: 'Мягкий короткий сигнал' },
  ];

  // Стили анимации (компактный список - только основные)
  const animationStyles = [
    { value: 'pulse', label: 'Пульсация', description: 'Плавное увеличение и уменьшение' },
    { value: 'blink', label: 'Мигание', description: 'Быстрое мигание' },
    { value: 'rotate', label: 'Вращение', description: 'Вращение с индикатором' },
    { value: 'breathe', label: 'Дыхание', description: 'Плавное дыхание' },
    { value: 'wave', label: 'Волна', description: 'Расходящиеся волны' },
    { value: 'gradient', label: 'Градиент', description: 'Изменение цвета' },
    { value: 'data-pulse', label: 'Data Pulse', description: 'Пульсация данных и времени' },
    { value: 'particles', label: 'Частицы', description: 'Вращающиеся частицы' },
  ];

  // Скорости анимации
  const animationSpeeds = [
    { value: 'slow', label: 'Медленно (4000ms)' },
    { value: 'normal', label: 'Обычно (2000ms)' },
    { value: 'fast', label: 'Быстро (1000ms)' },
  ];

  // Предустановленные цвета (7 основных цветов)
  const presetColors = [
    { value: '#3b82f6', label: 'Синий', preview: 'bg-blue-500' },
    { value: '#22c55e', label: 'Зеленый', preview: 'bg-green-500' },
    { value: '#f97316', label: 'Оранжевый', preview: 'bg-orange-500' },
    { value: '#ef4444', label: 'Красный', preview: 'bg-red-500' },
    { value: '#8b5cf6', label: 'Фиолетовый', preview: 'bg-purple-500' },
    { value: '#06b6d4', label: 'Голубой', preview: 'bg-cyan-500' },
    { value: '#fbbf24', label: 'Желтый', preview: 'bg-yellow-500' },
  ];

  // Сохранение настроек
  const handleSave = () => {
    // Если выбран кастомный интервал, используем его значение
    const finalInterval = notificationInterval === -1 
      ? (customIntervalMinutes || 30) 
      : notificationInterval;
    
    updateSettings({
      notifications: {
        ...notifications,
        soundNotificationsEnabled,
        notificationInterval: finalInterval,
        notificationSound,
        faviconAnimationEnabled,
        faviconAnimationStyle,
        faviconAnimationColor,
        faviconAnimationSpeed,
      },
    });
    
    showSuccess('Настройки звуков и анимации сохранены');
    onClose();
  };

  // Тест звука
  const handleTestSound = (soundType) => {
    playSound(soundType);
  };

  return (
    <BaseModal
      isOpen={isOpen}
      onClose={onClose}
      title="Звуки и анимация"
      titleIcon={Volume2}
      size="medium"
      footer={
        <div className="flex gap-3">
          <button
            onClick={onClose}
            className="flex-1 px-4 py-2 border border-gray-700 rounded-lg text-gray-300 hover:bg-gray-800 transition-colors font-semibold"
          >
            Отмена
          </button>
          <button
            onClick={handleSave}
            className="flex-1 px-4 py-2 bg-blue-500 hover:bg-blue-600 rounded-lg text-white font-semibold transition-colors"
          >
            Сохранить
          </button>
        </div>
      }
      className="flex flex-col"
    >
      <AnimatedModalContent contentKey={`${soundNotificationsEnabled}-${faviconAnimationEnabled}`}>
        <div className="space-y-4 flex-1">
              
              {/* Звуковые уведомления */}
              <div className="glass-card rounded-xl p-4">
                <div className="flex items-center justify-between mb-4">
                  <h3 className="text-sm font-bold text-gray-900 dark:text-white">
                    Звуковые уведомления
                  </h3>
                  <button
                    onClick={() => setSoundNotificationsEnabled(!soundNotificationsEnabled)}
                    className={`relative w-11 h-6 rounded-full transition-colors ${
                      soundNotificationsEnabled ? 'bg-blue-500' : 'bg-gray-300 dark:bg-gray-600'
                    }`}
                  >
                    <span
                      className={`absolute top-0.5 left-0.5 w-5 h-5 bg-white rounded-full transition-transform ${
                        soundNotificationsEnabled ? 'translate-x-5' : 'translate-x-0'
                      }`}
                    />
                  </button>
                </div>

                {soundNotificationsEnabled && (
                <div className="space-y-4">
                  {/* Интервал уведомлений */}
                  <div>
                    <div className="flex items-center gap-3">
                      <label className="text-xs font-semibold text-gray-900 dark:text-white whitespace-nowrap">
                        Интервал
                      </label>
                      <div className="flex gap-2 flex-1">
                      <div className="flex-1 relative">
                        <select
                          value={notificationInterval === -1 ? 'custom' : notificationInterval}
                          onChange={(e) => {
                            if (e.target.value === 'custom') {
                              setNotificationInterval(-1);
                              // Устанавливаем значение по умолчанию для кастомного интервала
                              if (!customIntervalMinutes) {
                                setCustomIntervalMinutes(30);
                              }
                            } else {
                              setNotificationInterval(Number(e.target.value));
                              setCustomIntervalMinutes(null);
                            }
                          }}
                          className="w-full px-3 py-2 bg-gray-800 dark:bg-gray-700 border border-gray-700 dark:border-gray-600 rounded-lg text-white text-sm focus:ring-2 focus:ring-blue-500 focus:border-transparent appearance-none cursor-pointer"
                          style={{
                            backgroundImage: `url("data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='12' height='12' viewBox='0 0 12 12'%3E%3Cpath fill='%23ffffff' d='M6 9L1 4h10z'/%3E%3C/svg%3E")`,
                            backgroundRepeat: 'no-repeat',
                            backgroundPosition: 'right 0.75rem center'
                          }}
                        >
                          <option value={15}>15 минут</option>
                          <option value={30}>30 минут</option>
                          <option value={45}>45 минут</option>
                          <option value={60}>1 час</option>
                          <option value={120}>2 часа</option>
                          <option value="custom">
                            Кастомное {notificationInterval === -1 && customIntervalMinutes ? `(${customIntervalMinutes} мин)` : ''}
                          </option>
                        </select>
                      </div>
                      {notificationInterval === -1 && (
                        <input
                          type="number"
                          min="1"
                          max="1440"
                          placeholder="Минут"
                          value={customIntervalMinutes || ''}
                          onChange={(e) => {
                            const value = parseInt(e.target.value);
                            if (value >= 1 && value <= 1440) {
                              setCustomIntervalMinutes(value);
                            } else if (e.target.value === '' || value === 0) {
                              // Разрешаем пустое значение для ввода
                              setCustomIntervalMinutes(null);
                            }
                          }}
                          onBlur={(e) => {
                            // При потере фокуса, если значение некорректно, устанавливаем минимальное
                            const value = parseInt(e.target.value);
                            if (!value || value < 1) {
                              setCustomIntervalMinutes(30);
                            } else if (value > 1440) {
                              setCustomIntervalMinutes(1440);
                            }
                          }}
                          className="w-24 px-3 py-2 text-sm border border-gray-700 dark:border-gray-600 bg-gray-800 dark:bg-gray-700 text-white rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                        />
                      )}
                      </div>
                    </div>
                  </div>

                  {/* Тип звука */}
                  <div>
                    <label className="block text-xs font-semibold text-gray-900 dark:text-white mb-2">
                      Тип звука
                    </label>
                    <div className="grid grid-cols-3 gap-2">
                      {soundTypes.map((sound) => (
                        <button
                          key={sound.value}
                          onClick={() => setNotificationSound(sound.value)}
                          className={`p-2 rounded-lg border-2 transition-all hover:scale-105 text-xs font-semibold ${
                            notificationSound === sound.value
                              ? 'border-blue-500 bg-blue-500/10 text-white'
                              : 'border-gray-700 dark:border-gray-600 hover:border-blue-500 text-gray-300'
                          }`}
                        >
                          <div className="flex items-center justify-between">
                            <span className="truncate">{sound.label}</span>
                            <div
                              onClick={(e) => {
                                e.stopPropagation();
                                handleTestSound(sound.value);
                              }}
                              className="ml-2 p-1 rounded hover:bg-gray-700 dark:hover:bg-gray-600 transition-colors flex-shrink-0 cursor-pointer"
                              title="Прослушать звук"
                              role="button"
                              tabIndex={0}
                              aria-label="Прослушать звук"
                              onKeyDown={(e) => {
                                if (e.key === 'Enter' || e.key === ' ') {
                                  e.preventDefault();
                                  e.stopPropagation();
                                  handleTestSound(sound.value);
                                }
                              }}
                            >
                              <Play className="w-3 h-3 text-blue-500" />
                            </div>
                          </div>
                        </button>
                      ))}
                    </div>
                  </div>
                </div>
              )}
            </div>

            {/* Анимация фавикона */}
            <div className="glass-card rounded-xl p-4">
              <div className="flex items-center justify-between mb-4">
                <h3 className="text-sm font-bold text-gray-900 dark:text-white">
                  Анимация фавикона
                </h3>
                <button
                  onClick={() => setFaviconAnimationEnabled(!faviconAnimationEnabled)}
                  className={`relative w-11 h-6 rounded-full transition-colors ${
                    faviconAnimationEnabled ? 'bg-blue-500' : 'bg-gray-300 dark:bg-gray-600'
                  }`}
                >
                  <span
                    className={`absolute top-0.5 left-0.5 w-5 h-5 bg-white rounded-full transition-transform ${
                      faviconAnimationEnabled ? 'translate-x-5' : 'translate-x-0'
                    }`}
                  />
                </button>
              </div>

              {faviconAnimationEnabled && (
                <div className="space-y-4">
                  {/* Стиль анимации */}
                  <div>
                    <label className="block text-xs font-semibold text-gray-900 dark:text-white mb-2">
                      Стиль
                    </label>
                    <div className="grid grid-cols-4 gap-2">
                      {animationStyles.map((style) => (
                        <FaviconPreviewCard
                          key={style.value}
                          style={style}
                          isSelected={faviconAnimationStyle === style.value}
                          color={faviconAnimationColor}
                          speed={faviconAnimationSpeed}
                          onClick={() => setFaviconAnimationStyle(style.value)}
                        />
                      ))}
                    </div>
                  </div>

                  {/* Цвет */}
                  <div>
                    <div className="flex items-center gap-3">
                      <label className="text-xs font-semibold text-gray-900 dark:text-white whitespace-nowrap">
                        Цвет
                      </label>
                      <div className="grid grid-cols-8 gap-1.5 flex-1">
                        {presetColors.map((color) => (
                          <button
                            key={color.value}
                            onClick={() => setFaviconAnimationColor(color.value)}
                            className={`w-8 h-8 rounded-lg border-2 transition-all hover:scale-110 ${
                              faviconAnimationColor === color.value
                                ? 'border-blue-500 ring-2 ring-blue-500/50 scale-110'
                                : 'border-gray-700 dark:border-gray-600 hover:border-blue-500'
                            }`}
                            title={color.label}
                          >
                            <div className={`w-full h-full rounded ${color.preview}`} />
                          </button>
                        ))}
                        {/* Кастомный цвет - кнопка для выбора */}
                        <div
                          className={`w-8 h-8 rounded-lg border-2 transition-all hover:scale-110 cursor-pointer relative ${
                            !presetColors.some(c => c.value === faviconAnimationColor)
                              ? 'border-blue-500 ring-2 ring-blue-500/50 scale-110'
                              : 'border-gray-700 dark:border-gray-600 hover:border-blue-500'
                          }`}
                          title="Кастомный цвет"
                        >
                          <input
                            type="color"
                            value={faviconAnimationColor}
                            onChange={(e) => setFaviconAnimationColor(e.target.value)}
                            className="absolute inset-0 w-full h-full opacity-0 cursor-pointer"
                            title="Кастомный цвет"
                          />
                          <div className="w-full h-full rounded bg-gradient-to-br from-blue-500 via-purple-500 to-pink-500 pointer-events-none" />
                        </div>
                      </div>
                    </div>
                  </div>

                  {/* Скорость */}
                  <div>
                    <div className="flex items-center gap-3">
                      <label className="text-xs font-semibold text-gray-900 dark:text-white whitespace-nowrap">
                        Скорость
                      </label>
                      <div className="grid grid-cols-3 gap-2 flex-1">
                      {animationSpeeds.map((speed) => (
                        <button
                          key={speed.value}
                          onClick={() => setFaviconAnimationSpeed(speed.value)}
                          className={`p-2 rounded-lg border-2 transition-all hover:scale-105 text-xs ${
                            faviconAnimationSpeed === speed.value
                              ? 'border-blue-500 bg-blue-500/10 text-white font-semibold'
                              : 'border-gray-700 dark:border-gray-600 hover:border-blue-500 text-gray-300'
                          }`}
                        >
                          {speed.label.split(' ')[0]}
                        </button>
                      ))}
                      </div>
                    </div>
                  </div>
                </div>
                )}
              </div>

        </div>
      </AnimatedModalContent>
    </BaseModal>
  );
}

