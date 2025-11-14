/**
 * Хук для управления анимацией фавикона браузера
 * 
 * Поддерживает 8 стилей анимации:
 * - pulse: плавное увеличение и уменьшение радиуса
 * - blink: мигание
 * - rotate: вращение с индикатором
 * - wave: расходящиеся волны
 * - gradient: изменение цвета по градиенту
 * - morph: морфинг формы (для кастомных случаев)
 * - particles: вращающиеся частицы
 * - breathe: плавное дыхание
 */

import { useEffect, useRef } from 'react';
import { useSettingsStore } from '../store/useSettingsStore';

/**
 * Хук для анимации фавикона во время работы таймера
 * @param {boolean} isTimerActive - активен ли таймер
 * @param {boolean} isPaused - на паузе ли таймер
 */
export function useFavicon(isTimerActive, isPaused) {
  const intervalRef = useRef(null);
  const { notifications } = useSettingsStore();
  const {
    faviconAnimationEnabled,
    faviconAnimationStyle,
    faviconAnimationColor,
    faviconAnimationSpeed
  } = notifications;

  // Обновление фавикона в DOM
  const updateFavicon = (url) => {
    let link = document.querySelector("link[rel~='icon']");
    if (!link) {
      link = document.createElement('link');
      link.rel = 'icon';
      document.head.appendChild(link);
    }
    link.href = url;
  };

  // Рисование фавикона с анимацией
  const drawFavicon = (isPaused, animationValue = 1) => {
    const canvas = document.createElement('canvas');
    canvas.width = 32;
    canvas.height = 32;
    const ctx = canvas.getContext('2d');
    const color = faviconAnimationColor || '#3b82f6';

    if (isPaused || !faviconAnimationEnabled) {
      // Статичный фавикон (серый при паузе, цветной если анимация отключена)
      ctx.fillStyle = isPaused ? '#9ca3af' : color;
      ctx.beginPath();
      ctx.arc(16, 16, 14, 0, 2 * Math.PI);
      ctx.fill();
    } else {
      ctx.save();
      const style = faviconAnimationStyle || 'pulse';

      switch (style) {
        case 'pulse':
          ctx.fillStyle = color;
          ctx.beginPath();
          const radius = 14 * animationValue;
          ctx.arc(16, 16, Math.max(5, radius), 0, 2 * Math.PI);
          ctx.fill();
          break;

        case 'blink':
          ctx.globalAlpha = animationValue;
          ctx.fillStyle = color;
          ctx.beginPath();
          ctx.arc(16, 16, 14, 0, 2 * Math.PI);
          ctx.fill();
          ctx.globalAlpha = 1;
          break;

        case 'rotate':
          ctx.translate(16, 16);
          ctx.rotate(animationValue * Math.PI * 2);
          ctx.translate(-16, -16);
          // Основной круг
          ctx.fillStyle = color;
          ctx.beginPath();
          ctx.arc(16, 16, 14, 0, 2 * Math.PI);
          ctx.fill();
          // Индикатор (стрелка)
          ctx.fillStyle = '#ffffff';
          ctx.beginPath();
          ctx.moveTo(16, 4);
          ctx.lineTo(12, 12);
          ctx.lineTo(20, 12);
          ctx.closePath();
          ctx.fill();
          break;

        case 'wave':
          ctx.fillStyle = color;
          for (let i = 0; i < 3; i++) {
            ctx.globalAlpha = (1 - Math.abs(animationValue - i * 0.5)) * 0.7;
            ctx.beginPath();
            const waveRadius = 14 + Math.sin(animationValue * Math.PI * 2 + i) * 3;
            ctx.arc(16, 16, Math.max(5, waveRadius), 0, 2 * Math.PI);
            ctx.fill();
          }
          ctx.globalAlpha = 1;
          break;

        case 'gradient':
          const gradient = ctx.createRadialGradient(16, 16, 0, 16, 16, 14);
          const hue = (animationValue * 360) % 360;
          gradient.addColorStop(0, `hsl(${hue}, 70%, 50%)`);
          gradient.addColorStop(1, `hsl(${hue}, 70%, 30%)`);
          ctx.fillStyle = gradient;
          ctx.beginPath();
          ctx.arc(16, 16, 14, 0, 2 * Math.PI);
          ctx.fill();
          break;

        case 'morph':
          // Morph: превращение квадрат → круг → треугольник
          // animationValue уже от 0 до 3 (из расчета (time * 0.8) % 3)
          const morphTime = animationValue; // 0-1: квадрат→круг, 1-2: круг→треугольник, 2-3: треугольник→квадрат
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
          // Частицы вокруг иконки
          ctx.fillStyle = '#ffffff';
          for (let i = 0; i < 6; i++) {
            const angle = (i / 6) * Math.PI * 2 + animationValue * Math.PI * 2;
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
          ctx.fillStyle = color;
          ctx.beginPath();
          const breatheRadius = 14 + Math.sin(animationValue * Math.PI * 2) * 3;
          ctx.arc(16, 16, breatheRadius, 0, 2 * Math.PI);
          ctx.fill();
          break;

        default:
          ctx.fillStyle = color;
          ctx.beginPath();
          ctx.arc(16, 16, 14, 0, 2 * Math.PI);
          ctx.fill();
      }

      ctx.restore();
    }

    return canvas.toDataURL('image/png');
  };

  useEffect(() => {
    if (isTimerActive) {
      // Скорость анимации
      const speedMap = { slow: 4000, normal: 2000, fast: 1000 };
      const animationSpeed = speedMap[faviconAnimationSpeed] || 2000;

      // Функция обновления фавикона
      const updateFaviconAnimation = () => {
        // Используем Date.now() вместо зависимости от интервалов для точности
        let animationValue = 1;

        if (faviconAnimationEnabled && !isPaused) {
          const style = faviconAnimationStyle || 'pulse';
          const time = Date.now() / animationSpeed;

          switch (style) {
            case 'pulse':
              animationValue = 0.75 + Math.sin(time * Math.PI * 2) * 0.25;
              break;
            case 'blink':
              animationValue = Math.floor(time) % 2 === 0 ? 1 : 0.2;
              break;
            case 'rotate':
              animationValue = (time * 0.5) % 1;
              break;
            case 'wave':
              animationValue = (time * 2) % 1;
              break;
            case 'gradient':
              animationValue = (time * 0.3) % 1;
              break;
            case 'morph':
              animationValue = (time * 0.8) % 3; // 0-3 для трех фаз
              break;
            case 'particles':
              animationValue = (time * 0.8) % 1;
              break;
            case 'breathe':
              animationValue = 0.5 + Math.sin(time * Math.PI * 2) * 0.5;
              break;
            default:
              animationValue = 1;
          }
        }

        const faviconUrl = drawFavicon(isPaused, animationValue);
        updateFavicon(faviconUrl);
      };

      // Запускаем интервал обновления
      intervalRef.current = setInterval(updateFaviconAnimation, 50);

      // Обработка активации вкладки - сразу обновляем фавикон при возврате
      const handleVisibilityChange = () => {
        if (document.visibilityState === 'visible') {
          // При активации сразу обновляем (на случай если интервал был замедлен)
          updateFaviconAnimation();
        }
      };

      document.addEventListener('visibilitychange', handleVisibilityChange);

      return () => {
        if (intervalRef.current) {
          clearInterval(intervalRef.current);
          intervalRef.current = null;
        }
        document.removeEventListener('visibilitychange', handleVisibilityChange);
      };
    } else {
      // Статичный фавикон когда таймер не активен
      const faviconUrl = drawFavicon(true);
      updateFavicon(faviconUrl);
    }
  }, [
    isTimerActive,
    isPaused,
    faviconAnimationEnabled,
    faviconAnimationStyle,
    faviconAnimationColor,
    faviconAnimationSpeed
  ]);
}

