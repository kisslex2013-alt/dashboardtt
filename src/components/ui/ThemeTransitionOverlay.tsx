/**
 * 🎨 Компонент overlay для анимации перехода темы
 * 
 * Применяет CSS анимации для различных концептов перехода
 */

import { useEffect } from 'react'

/**
 * Компонент overlay для анимации перехода темы
 * @param {Object} props
 * @param {string} props.transitionType - тип анимации: 'circle', 'fade', 'wipe', 'blur', 'rotate'
 * @param {string} props.currentTheme - текущая тема: 'light' | 'dark'
 * @param {HTMLElement|null} props.triggerElement - элемент-триггер (для circle)
 */
export function ThemeTransitionOverlay({ transitionType, currentTheme, triggerElement }) {
  useEffect(() => {
    // Добавляем стили для анимаций, если их еще нет
    if (!document.getElementById('theme-transition-styles')) {
      const style = document.createElement('style')
      style.id = 'theme-transition-styles'
      style.textContent = getTransitionStyles()
      document.head.appendChild(style)
    }
  }, [])

  return null // Компонент не рендерит ничего, только применяет стили
}

/**
 * Генерирует CSS стили для всех типов анимаций
 */
function getTransitionStyles() {
  return `
    /* ===== ОБЩИЕ СТИЛИ ===== */
    .theme-transition-overlay {
      position: fixed;
      top: 0;
      left: 0;
      width: 100%;
      height: 100%;
      pointer-events: none;
      z-index: 9999;
      opacity: 0;
    }

    .theme-transition-overlay.active {
      opacity: 1;
      pointer-events: auto;
    }

    .theme-transition-overlay.complete {
      opacity: 0;
    }

    /* ===== 1. CIRCLE REVEAL - Круговое раскрытие ===== */
    .theme-transition-circle {
      background: radial-gradient(
        circle at var(--circle-x, 50%) var(--circle-y, 50%),
        transparent 0%,
        transparent 0%,
        var(--transition-color, rgba(0, 0, 0, 0.95)) 0%
      );
      transform: translate(-50%, -50%) scale(0);
      transform-origin: var(--circle-x, 50%) var(--circle-y, 50%);
    }

    .theme-transition-circle.active {
      animation: circleReveal 0.6s cubic-bezier(0.4, 0, 0.2, 1) forwards;
    }

    .theme-transition-circle[data-theme="light"] {
      --transition-color: rgba(255, 255, 255, 0.95);
    }

    .theme-transition-circle[data-theme="dark"] {
      --transition-color: rgba(0, 0, 0, 0.95);
    }

    @keyframes circleReveal {
      0% {
        transform: translate(-50%, -50%) scale(0);
        opacity: 1;
      }
      50% {
        opacity: 1;
      }
      100% {
        transform: translate(-50%, -50%) scale(2.5);
        opacity: 0;
      }
    }

    /* ===== 2. FADE TRANSITION - Плавное затухание ===== */
    .theme-transition-fade {
      background: var(--transition-color, rgba(0, 0, 0, 0.9));
      opacity: 0;
    }

    .theme-transition-fade.active {
      animation: fadeTransition 0.4s ease-in-out forwards;
    }

    .theme-transition-fade[data-theme="light"] {
      --transition-color: rgba(255, 255, 255, 0.95);
    }

    .theme-transition-fade[data-theme="dark"] {
      --transition-color: rgba(0, 0, 0, 0.95);
    }

    @keyframes fadeTransition {
      0% {
        opacity: 0;
      }
      50% {
        opacity: 1;
      }
      100% {
        opacity: 0;
      }
    }

    /* ===== 3. WIPE - Горизонтальное стирание ===== */
    .theme-transition-wipe {
      background: var(--transition-color, rgba(0, 0, 0, 0.95));
      clip-path: polygon(0% 0%, 0% 0%, 0% 100%, 0% 100%);
    }

    .theme-transition-wipe.active {
      animation: wipeTransition 0.5s cubic-bezier(0.4, 0, 0.2, 1) forwards;
    }

    .theme-transition-wipe[data-theme="light"] {
      --transition-color: rgba(255, 255, 255, 0.95);
    }

    .theme-transition-wipe[data-theme="dark"] {
      --transition-color: rgba(0, 0, 0, 0.95);
    }

    @keyframes wipeTransition {
      0% {
        clip-path: polygon(0% 0%, 0% 0%, 0% 100%, 0% 100%);
      }
      50% {
        clip-path: polygon(0% 0%, 100% 0%, 100% 100%, 0% 100%);
      }
      100% {
        clip-path: polygon(100% 0%, 100% 0%, 100% 100%, 100% 100%);
      }
    }

    /* ===== 4. BLUR TRANSITION - Размытие и появление ===== */
    .theme-transition-blur {
      background: var(--transition-color, rgba(0, 0, 0, 0.8));
      backdrop-filter: blur(0px);
      opacity: 0;
    }

    .theme-transition-blur.active {
      animation: blurTransition 0.5s cubic-bezier(0.4, 0, 0.2, 1) forwards;
    }

    .theme-transition-blur[data-theme="light"] {
      --transition-color: rgba(255, 255, 255, 0.9);
    }

    .theme-transition-blur[data-theme="dark"] {
      --transition-color: rgba(0, 0, 0, 0.9);
    }

    @keyframes blurTransition {
      0% {
        opacity: 0;
        backdrop-filter: blur(0px);
      }
      30% {
        opacity: 1;
        backdrop-filter: blur(20px);
      }
      70% {
        opacity: 1;
        backdrop-filter: blur(20px);
      }
      100% {
        opacity: 0;
        backdrop-filter: blur(0px);
      }
    }

    /* ===== 5. ROTATE FLIP - Вращение с переворотом ===== */
    .theme-transition-rotate {
      background: var(--transition-color, rgba(0, 0, 0, 0.95));
      transform: perspective(1000px) rotateY(0deg);
      transform-origin: center center;
    }

    .theme-transition-rotate.active {
      animation: rotateFlipTransition 0.6s cubic-bezier(0.4, 0, 0.2, 1) forwards;
    }

    .theme-transition-rotate[data-theme="light"] {
      --transition-color: rgba(255, 255, 255, 0.95);
    }

    .theme-transition-rotate[data-theme="dark"] {
      --transition-color: rgba(0, 0, 0, 0.95);
    }

    @keyframes rotateFlipTransition {
      0% {
        transform: perspective(1000px) rotateY(0deg);
        opacity: 0;
      }
      25% {
        opacity: 1;
      }
      50% {
        transform: perspective(1000px) rotateY(90deg);
        opacity: 1;
      }
      75% {
        opacity: 1;
      }
      100% {
        transform: perspective(1000px) rotateY(180deg);
        opacity: 0;
      }
    }

    /* ===== ОПТИМИЗАЦИЯ ПРОИЗВОДИТЕЛЬНОСТИ ===== */
    .theme-transition-overlay {
      will-change: transform, opacity, clip-path, backdrop-filter;
    }

    @media (prefers-reduced-motion: reduce) {
      .theme-transition-overlay {
        animation: none !important;
        opacity: 0 !important;
      }
    }
  `
}

