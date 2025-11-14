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

  // Используем ref для хранения актуальных значений, чтобы избежать проблем с замыканиями
  const stateRef = useRef({
    isTimerActive,
    isPaused,
    faviconAnimationEnabled,
    faviconAnimationStyle,
    faviconAnimationColor,
    faviconAnimationSpeed
  });

  // Обновляем ref при изменении значений
  useEffect(() => {
    stateRef.current = {
      isTimerActive,
      isPaused,
      faviconAnimationEnabled,
      faviconAnimationStyle,
      faviconAnimationColor,
      faviconAnimationSpeed
    };
  }, [isTimerActive, isPaused, faviconAnimationEnabled, faviconAnimationStyle, faviconAnimationColor, faviconAnimationSpeed]);

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
  const drawFavicon = (isPaused, animationValue = 1, styleOverride = null, colorOverride = null) => {
    try {
      const canvas = document.createElement('canvas');
      canvas.width = 32;
      canvas.height = 32;
      const ctx = canvas.getContext('2d');
      // Используем переданные значения или значения из stateRef
      const currentState = stateRef.current;
      const color = colorOverride || currentState.faviconAnimationColor || '#3b82f6';
      const style = styleOverride || currentState.faviconAnimationStyle || 'pulse';
      const enabled = currentState.faviconAnimationEnabled;

      if (isPaused || !enabled) {
        // Статичный фавикон (серый при паузе, цветной если анимация отключена)
        ctx.fillStyle = isPaused ? '#9ca3af' : color;
        ctx.beginPath();
        ctx.arc(16, 16, 14, 0, 2 * Math.PI);
        ctx.fill();
      } else {

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
          ctx.save();
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
          ctx.restore();
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

        case 'data-pulse':
          // Data Pulse: пульсация данных и времени с концентрическими кругами, волной и часами
          const pulseValue = 0.5 + Math.sin(animationValue * Math.PI * 2) * 0.5;
          
          // Концентрические круги с пульсирующей анимацией
          const circles = [
            { r: 12, color: '#3B82F6', opacity: 0.2 },
            { r: 10, color: '#10B981', opacity: 0.3 },
            { r: 8, color: '#F59E0B', opacity: 0.4 },
          ];
          
          circles.forEach((circle, i) => {
            const scale = 1 + pulseValue * 0.15 * (i + 1) / 3; // Разные масштабы для каждого круга
            ctx.strokeStyle = circle.color;
            ctx.globalAlpha = circle.opacity * (0.7 + pulseValue * 0.3);
            ctx.lineWidth = 1.5;
            ctx.beginPath();
            ctx.arc(16, 16, circle.r * scale, 0, 2 * Math.PI);
            ctx.stroke();
          });
          
          // Волна данных с анимацией
          ctx.strokeStyle = color;
          ctx.lineWidth = 2;
          ctx.globalAlpha = 0.8;
          ctx.beginPath();
          const waveOffset = (animationValue * 0.3) % 1; // Смещение волны
          const wavePoints = 8;
          for (let i = 0; i <= wavePoints; i++) {
            const x = 4 + (i / wavePoints) * 24;
            const y = 16 + Math.sin((i / wavePoints + waveOffset) * Math.PI * 2) * 4 * pulseValue;
            if (i === 0) {
              ctx.moveTo(x, y);
            } else {
              ctx.lineTo(x, y);
            }
          }
          ctx.stroke();
          
          // Цветные точки на волне с пульсацией
          const points = [
            { x: 8, y: 10, color: '#3B82F6' },
            { x: 12, y: 22, color: '#10B981' },
            { x: 20, y: 8, color: '#F59E0B' },
            { x: 24, y: 18, color: '#10B981' },
          ];
          
          points.forEach((point, i) => {
            const pointPulse = 0.5 + Math.sin(animationValue * Math.PI * 2 + i * 0.5) * 0.5;
            ctx.fillStyle = point.color;
            ctx.globalAlpha = 0.7 + pointPulse * 0.3;
            ctx.beginPath();
            ctx.arc(point.x, point.y, 1.5 * (0.8 + pointPulse * 0.4), 0, 2 * Math.PI);
            ctx.fill();
          });
          
          // Центральные часы со стрелками
          ctx.strokeStyle = '#3B82F6';
          ctx.lineWidth = 2;
          ctx.globalAlpha = 1;
          ctx.beginPath();
          ctx.arc(16, 16, 3, 0, 2 * Math.PI);
          ctx.stroke();
          
          // Вращающиеся стрелки
          ctx.save();
          ctx.translate(16, 16);
          const hourAngle = (animationValue * 0.1) % 1 * Math.PI * 2;
          const minuteAngle = (animationValue * 0.5) % 1 * Math.PI * 2;
          
          // Часовая стрелка
          ctx.strokeStyle = '#3B82F6';
          ctx.lineWidth = 1.5;
          ctx.rotate(hourAngle);
          ctx.beginPath();
          ctx.moveTo(0, 0);
          ctx.lineTo(0, -2.5);
          ctx.stroke();
          ctx.rotate(-hourAngle); // Возвращаем обратно
          
          // Минутная стрелка
          ctx.strokeStyle = '#10B981';
          ctx.lineWidth = 1.5;
          ctx.rotate(minuteAngle);
          ctx.beginPath();
          ctx.moveTo(0, 0);
          ctx.lineTo(2, 0);
          ctx.stroke();
          
          // Центр часов
          ctx.fillStyle = '#F59E0B';
          ctx.beginPath();
          ctx.arc(0, 0, 0.8, 0, 2 * Math.PI);
          ctx.fill();
          
          ctx.restore();
          ctx.globalAlpha = 1;
          break;

        default:
          ctx.fillStyle = color;
          ctx.beginPath();
          ctx.arc(16, 16, 14, 0, 2 * Math.PI);
          ctx.fill();
      }
    }

    return canvas.toDataURL('image/png');
    } catch (error) {
      // В случае ошибки возвращаем статичный фавикон
      console.error('Ошибка рисования фавикона:', error);
      const fallbackCanvas = document.createElement('canvas');
      fallbackCanvas.width = 32;
      fallbackCanvas.height = 32;
      const fallbackCtx = fallbackCanvas.getContext('2d');
      fallbackCtx.fillStyle = '#3b82f6';
      fallbackCtx.beginPath();
      fallbackCtx.arc(16, 16, 14, 0, 2 * Math.PI);
      fallbackCtx.fill();
      return fallbackCanvas.toDataURL('image/png');
    }
  };

  useEffect(() => {
    // Скорость анимации
    const speedMap = { slow: 4000, normal: 2000, fast: 1000 };
    const animationSpeed = speedMap[stateRef.current.faviconAnimationSpeed] || 2000;

    let animationFrameId = null;
    let timeoutId = null;
    let isRunning = true;
    let lastUpdateTime = Date.now();

    // Функция обновления фавикона (использует реальное время для плавности)
    const updateFaviconAnimation = () => {
      // Получаем актуальные значения из ref
      const currentState = stateRef.current;
      
      if (!isRunning || !currentState.isTimerActive) {
        return;
      }

      const now = Date.now();
      const isVisible = document.visibilityState === 'visible';
      
      // Защита от слишком частых обновлений (минимум 16ms между кадрами)
      if (now - lastUpdateTime < 16 && isVisible) {
        animationFrameId = requestAnimationFrame(updateFaviconAnimation);
        return;
      }
      
      lastUpdateTime = now;
      
      // Всегда рассчитываем время анимации на основе реального времени
      let animationValue = 1;

      if (currentState.faviconAnimationEnabled && !currentState.isPaused && currentState.isTimerActive) {
        const style = currentState.faviconAnimationStyle || 'pulse';
        const time = now / animationSpeed;

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
          case 'data-pulse':
            // Data Pulse: используем time напрямую для плавной анимации (без модуля, так как sin уже периодический)
            animationValue = time * 1.5;
            break;
          default:
            animationValue = 1;
        }
      }

      // Обновляем фавикон в DOM каждый кадр для максимальной плавности
      try {
        const faviconUrl = drawFavicon(
          currentState.isPaused || !currentState.isTimerActive, 
          animationValue,
          currentState.faviconAnimationStyle,
          currentState.faviconAnimationColor
        );
        updateFavicon(faviconUrl);
      } catch (error) {
        console.error('Ошибка обновления фавикона:', error);
        isRunning = false;
        return;
      }

      // Продолжаем анимацию только если таймер активен
      if (!currentState.isTimerActive) {
        return;
      }

      // Продолжаем анимацию
      if (isVisible) {
        // Когда вкладка активна - используем requestAnimationFrame для плавности (60 FPS)
        animationFrameId = requestAnimationFrame(updateFaviconAnimation);
      } else {
        // Когда вкладка неактивна - используем setTimeout с интервалом 100ms (~10 FPS)
        // Это достаточно для плавной анимации в фоне и экономит ресурсы
        timeoutId = setTimeout(updateFaviconAnimation, 100);
      }
    };

    // Обработка изменения видимости вкладки
    const handleVisibilityChange = () => {
      const isVisible = document.visibilityState === 'visible';
      
      // Останавливаем текущий цикл анимации
      if (animationFrameId !== null) {
        cancelAnimationFrame(animationFrameId);
        animationFrameId = null;
      }
      if (timeoutId !== null) {
        clearTimeout(timeoutId);
        timeoutId = null;
      }

      // Немедленно обновляем фавикон с правильным временем
      const currentState = stateRef.current;
      if (isRunning && currentState.isTimerActive) {
        lastUpdateTime = 0; // Сбрасываем время для немедленного обновления
        updateFaviconAnimation();
      }
    };

    if (stateRef.current.isTimerActive) {
      // Запускаем анимацию
      updateFaviconAnimation();

      // Слушаем изменения видимости
      document.addEventListener('visibilitychange', handleVisibilityChange);
    } else {
      // Статичный фавикон когда таймер не активен
      try {
        const currentState = stateRef.current;
        const faviconUrl = drawFavicon(
          true, 
          1, 
          currentState.faviconAnimationStyle,
          currentState.faviconAnimationColor
        );
        updateFavicon(faviconUrl);
      } catch (error) {
        console.error('Ошибка установки статичного фавикона:', error);
      }
    }

    return () => {
      isRunning = false;
      if (animationFrameId !== null) {
        cancelAnimationFrame(animationFrameId);
        animationFrameId = null;
      }
      if (timeoutId !== null) {
        clearTimeout(timeoutId);
        timeoutId = null;
      }
      document.removeEventListener('visibilitychange', handleVisibilityChange);
    };
  }, [
    isTimerActive,
    isPaused,
    faviconAnimationEnabled,
    faviconAnimationStyle,
    faviconAnimationColor,
    faviconAnimationSpeed
  ]);
}

